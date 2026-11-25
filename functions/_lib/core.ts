export interface Env { DB: D1Database; SESSION_SECRET: string }
export interface User { id: string; name: string; email: string; role: string }
export interface Property { id: number; slug: string; title: string; region: string; cover: string; price_minor: number; currency: string; max_guests: number; min_nights: number; max_nights: number | null }

const enc = new TextEncoder();
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE = /^[+\d][\d\s()-]{6,19}$/;

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
export const fail = (error: string, status = 400) => json({ error }, status);
export const ready = (env: Env) => (env.DB && env.SESSION_SECRET ? null : fail('server_misconfigured', 500));
export const sameOrigin = (req: Request) => { const o = req.headers.get('origin'); return !o || o === new URL(req.url).origin; };
export async function body(req: Request): Promise<Record<string, unknown> | null> {
  try { const t = await req.text(); if (t.length > 10_000) return null; const v = JSON.parse(t); return v && typeof v === 'object' ? v : null; } catch { return null; }
}
export const str = (b: Record<string, unknown>, k: string) => (typeof b[k] === 'string' ? (b[k] as string).trim() : '');

// ---- паролі (PBKDF2) та сесії (cookie з токеном; у базі лише HMAC токена) ----
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const DUMMY = `pbkdf2$100000$${'A'.repeat(22)}==$${'A'.repeat(43)}=`;
async function pbkdf2(pw: string, salt: Uint8Array, iter: number) {
  const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, k, 256));
}
export async function hashPassword(pw: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$100000$${b64(salt)}$${b64(await pbkdf2(pw, salt, 100000))}`;
}
export async function verifyPassword(pw: string, stored: string | null) {
  const [alg, it, s, h] = (stored ?? DUMMY).split('$');
  if (alg !== 'pbkdf2') return false;
  const got = await pbkdf2(pw, unb64(s), Number(it)), exp = unb64(h);
  let d = got.length ^ exp.length;
  for (let i = 0; i < got.length; i++) d |= got[i] ^ (exp[i] ?? 0);
  return d === 0 && stored !== null;
}
async function hmac(secret: string, msg: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg)))].map((x) => x.toString(16).padStart(2, '0')).join('');
}
const DAYS = 30;
const sid = (req: Request) => (req.headers.get('cookie') ?? '').split(/;\s*/).find((c) => c.startsWith('sid='))?.slice(4);
const secure = (req: Request) => (new URL(req.url).protocol === 'https:' ? '; Secure' : '');
export async function startSession(env: Env, req: Request, userId: string) {
  const token = b64(crypto.getRandomValues(new Uint8Array(32))).replace(/[+/=]/g, (c) => (c === '+' ? '-' : c === '/' ? '_' : ''));
  const exp = new Date(Date.now() + DAYS * 864e5).toISOString();
  await env.DB.prepare('INSERT INTO sessions (token_hash,user_id,user_agent,expires_at) VALUES (?,?,?,?)')
    .bind(await hmac(env.SESSION_SECRET, token), userId, (req.headers.get('user-agent') ?? '').slice(0, 200), exp).run();
  return `sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DAYS * 86400}${secure(req)}`;
}
export async function endSession(env: Env, req: Request) {
  const t = sid(req);
  if (t) await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await hmac(env.SESSION_SECRET, t)).run();
  return `sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure(req)}`;
}
export async function currentUser(env: Env, req: Request): Promise<User | null> {
  const t = sid(req);
  if (!t) return null;
  return env.DB.prepare(`SELECT u.id,u.name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>strftime('%Y-%m-%dT%H:%M:%fZ','now') AND u.deleted_at IS NULL`)
    .bind(await hmac(env.SESSION_SECRET, t)).first<User>();
}

// ---- оселі, дати, доступність ----
export const kyivToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' });
export const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
export const nights = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
export const getProperty = (env: Env, slug: string) =>
  env.DB.prepare(`SELECT p.id,p.slug,p.title,p.price_minor,p.currency,p.max_guests,p.min_nights,p.max_nights,r.name AS region,
    COALESCE((SELECT url FROM property_photos WHERE property_id=p.id ORDER BY is_cover DESC,sort_order LIMIT 1),'') AS cover
    FROM properties p JOIN regions r ON r.id=p.region_id WHERE p.slug=? AND p.is_published=1 AND p.deleted_at IS NULL`).bind(slug).first<Property>();
export function checkStay(p: Property, a: string, b: string, guests: number): string | null {
  if (!isDate(a) || !isDate(b) || b <= a) return 'invalid_dates';
  if (a < kyivToday()) return 'past_date';
  const n = nights(a, b);
  if (n < p.min_nights) return 'min_nights';
  if (n > 90 || (p.max_nights && n > p.max_nights)) return 'max_nights';
  if (!Number.isInteger(guests) || guests < 1 || guests > p.max_guests) return 'invalid_guests';
  return null;
}
export async function isFree(env: Env, id: number, a: string, b: string) {
  const r = await env.DB.prepare(`SELECT 1 AS x FROM bookings WHERE property_id=?1 AND status IN ('pending','confirmed') AND check_in<?3 AND check_out>?2
    UNION ALL SELECT 1 FROM availability_blocks WHERE property_id=?1 AND start_date<?3 AND end_date>?2 LIMIT 1`).bind(id, a, b).first();
  return !r;
}
