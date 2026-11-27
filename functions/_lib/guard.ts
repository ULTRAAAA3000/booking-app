import { Env, fail, json, hmac } from './core';

// Обмеження частоти: не більше `limit` запитів за `windowSec` секунд на ключ (за замовчуванням ключ = IP).
// У базі зберігається лише HMAC від IP / e-mail, не самі значення.
export async function rateLimit(env: Env, req: Request, action: string, limit: number, windowSec: number, subject?: string): Promise<Response | null> {
  const now = Math.floor(Date.now() / 1000), start = now - (now % windowSec);
  const who = await hmac(env.SESSION_SECRET, subject ?? req.headers.get('cf-connecting-ip') ?? 'local');
  const row = await env.DB.prepare('INSERT INTO rate_limits (key,window_start,count) VALUES (?,?,1) ON CONFLICT(key,window_start) DO UPDATE SET count=count+1 RETURNING count')
    .bind(`${action}:${who}`, start).first<{ count: number }>();
  if (Math.random() < 0.02) await env.DB.prepare('DELETE FROM rate_limits WHERE window_start<?').bind(now - 86400).run(); // прибирання старих лічильників
  if (row && row.count > limit) return json({ error: 'too_many_requests' }, 429, { 'retry-after': String(start + windowSec - now) });
  return null;
}

export const captchaOn = (env: Env) => !!(env.TURNSTILE_SECRET && env.TURNSTILE_SITE_KEY);

// Перевірка людини: приманка (приховане поле), мінімальний час заповнення, Cloudflare Turnstile (якщо налаштований).
export async function human(env: Env, req: Request, b: Record<string, unknown>): Promise<Response | null> {
  if (typeof b.website === 'string' && b.website !== '') return fail('invalid_request');
  const t = Number(b.t);
  if (!(t >= 1000)) return fail('too_fast');
  if (!captchaOn(env)) return null;
  const token = typeof b.turnstile === 'string' ? b.turnstile : '';
  if (!token || token.length > 2048) return fail('captcha_failed');
  const f = new FormData();
  f.append('secret', env.TURNSTILE_SECRET as string);
  f.append('response', token);
  const ip = req.headers.get('cf-connecting-ip'); if (ip) f.append('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: f });
    const j = (await r.json()) as { success?: boolean };
    return j.success ? null : fail('captcha_failed');
  } catch { return fail('captcha_unavailable', 503); }
}

// Усе разом: дешеві перевірки -> ліміт за IP -> зовнішня перевірка Turnstile.
export async function protect(env: Env, req: Request, b: Record<string, unknown>, action: string, limit: number, windowSec: number): Promise<Response | null> {
  if (!(typeof b.website !== 'string' || b.website === '') || !(Number(b.t) >= 1000)) return human(env, req, b);
  return (await rateLimit(env, req, action, limit, windowSec)) ?? (await human(env, req, b));
}
