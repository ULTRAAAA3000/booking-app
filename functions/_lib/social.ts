import { Env, secure } from './core';

interface U { id: string; name: string; email: string; role: string }
const enc = new TextEncoder();
const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

export const googleOn = (env: Env) => !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
export const telegramBotId = (env: Env) => { const id = (env.TELEGRAM_BOT_TOKEN ?? '').split(':')[0]; return /^\d+$/.test(id) ? id : null; };
export const redirectUri = (req: Request) => `${new URL(req.url).origin}/api/auth/google/callback`;
export const nextPath = (v: string | null) => (v && /^\/(?![/\\])[^\r\n]{0,300}$/.test(v) ? v : '/'); // лише адреси цього сайту, без відкритого редиректу
export const oauthCookie = (req: Request, value: string, maxAge: number) => `oas=${value}; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure(req)}`;
export function redirect(to: string, cookies: string[] = []) {
  const h = new Headers({ location: to, 'cache-control': 'no-store' });
  for (const c of cookies) h.append('set-cookie', c);
  return new Response(null, { status: 302, headers: h });
}

// Підпис даних Telegram: HMAC-SHA256 від рядка «key=value» (за алфавітом), ключ = SHA-256 від токена бота.
export async function telegramHash(token: string, data: string) {
  const key = await crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', enc.encode(token)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)))].map((x) => x.toString(16).padStart(2, '0')).join('');
}
export function sameHash(a: string, b: string) {
  let d = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

// Вхід через соцмережу: акаунт за ідентичністю -> інакше прив'язка до акаунта з тим самим підтвердженим e-mail -> інакше новий акаунт.
// `email` передаємо лише якщо його підтвердив сам провайдер (Google). У Telegram e-mail немає: ставимо технічну адресу *.invalid.
export async function socialLogin(env: Env, s: { provider: 'google' | 'telegram'; id: string; name: string; email?: string }): Promise<U> {
  const find = () => env.DB.prepare(`SELECT u.id,u.name,u.email,u.role FROM auth_identities i JOIN users u ON u.id=i.user_id
    WHERE i.provider=? AND i.provider_user_id=? AND u.deleted_at IS NULL`).bind(s.provider, s.id).first<U>();
  let u = await find();
  if (!u) {
    const email = s.email?.toLowerCase() || null, name = s.name.trim().slice(0, 80) || 'Користувач';
    const ex = email ? await env.DB.prepare('SELECT id,name,email,role,email_verified_at FROM users WHERE email=? AND deleted_at IS NULL').bind(email).first<U & { email_verified_at: string | null }>() : null;
    try {
      if (ex) {
        // Якщо власник e-mail раніше не підтверджував його, скидаємо пароль і сесії: захист від реєстрації на чужу пошту наперед.
        const st = [
          env.DB.prepare('INSERT INTO auth_identities (user_id,provider,provider_user_id) VALUES (?,?,?)').bind(ex.id, s.provider, s.id),
          env.DB.prepare(`UPDATE users SET password_hash=CASE WHEN email_verified_at IS NULL THEN NULL ELSE password_hash END,email_verified_at=COALESCE(email_verified_at,${NOW}) WHERE id=?`).bind(ex.id),
        ];
        if (!ex.email_verified_at) st.push(env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(ex.id));
        await env.DB.batch(st);
        u = { id: ex.id, name: ex.name, email: ex.email, role: ex.role };
      } else {
        const id = crypto.randomUUID(), mail = email ?? `${s.provider}-${s.id}@${s.provider}.invalid`;
        await env.DB.batch([
          env.DB.prepare(`INSERT INTO users (id,email,name,email_verified_at) VALUES (?,?,?,${email ? NOW : 'NULL'})`).bind(id, mail, name),
          env.DB.prepare('INSERT INTO auth_identities (user_id,provider,provider_user_id) VALUES (?,?,?)').bind(id, s.provider, s.id),
        ]);
        u = { id, name, email: mail, role: 'guest' };
      }
    } catch (e) { if (!String(e).includes('UNIQUE')) throw e; u = await find(); if (!u) throw e; } // паралельний вхід уже створив акаунт
  }
  await env.DB.prepare(`UPDATE users SET last_login_at=${NOW} WHERE id=?`).bind(u.id).run();
  return u;
}
