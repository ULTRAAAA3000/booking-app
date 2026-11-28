import { Env, json, fail, ready, sameOrigin, body, str, verifyPassword, startSession } from '../../_lib/core';
import { protect, rateLimit } from '../../_lib/guard';
import { sendVerification } from '../../_lib/mail';

export const onRequestPost: PagesFunction<Env> = async ({ env, request, waitUntil }) => {
  const bad = ready(env); if (bad) return bad;
  if (!sameOrigin(request)) return fail('forbidden', 403);
  const b = await body(request); if (!b) return fail('invalid_body');
  const g = await protect(env, request, b, 'login', 10, 600); if (g) return g;
  const email = str(b, 'email').toLowerCase(), pw = typeof b.password === 'string' ? b.password : '';
  const rl = await rateLimit(env, request, 'login_email', 5, 600, email); if (rl) return rl; // проти підбору пароля до одного акаунта
  const u = await env.DB.prepare('SELECT id,name,email,role,password_hash,email_verified_at FROM users WHERE email=? AND deleted_at IS NULL')
    .bind(email).first<{ id: string; name: string; email: string; role: string; password_hash: string | null; email_verified_at: string | null }>();
  if (!(await verifyPassword(pw, u?.password_hash ?? null)) || !u) return fail('invalid_credentials', 401);
  await env.DB.prepare("UPDATE users SET last_login_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(u.id).run();
  if (!u.email_verified_at) waitUntil(sendVerification(env, request, u, 1440)); // після входу нагадуємо підтвердити пошту
  return json({ user: { id: u.id, name: u.name, email: u.email, role: u.role, verified: !!u.email_verified_at } }, 200, { 'set-cookie': await startSession(env, request, u.id) });
};
