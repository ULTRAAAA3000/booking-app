import { Env, json, fail, ready, sameOrigin, body, str, verifyPassword, startSession } from '../../_lib/core';

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const bad = ready(env); if (bad) return bad;
  if (!sameOrigin(request)) return fail('forbidden', 403);
  const b = await body(request); if (!b) return fail('invalid_body');
  const email = str(b, 'email').toLowerCase(), pw = typeof b.password === 'string' ? b.password : '';
  const u = await env.DB.prepare('SELECT id,name,email,role,password_hash FROM users WHERE email=? AND deleted_at IS NULL')
    .bind(email).first<{ id: string; name: string; email: string; role: string; password_hash: string | null }>();
  if (!(await verifyPassword(pw, u?.password_hash ?? null)) || !u) return fail('invalid_credentials', 401);
  await env.DB.prepare("UPDATE users SET last_login_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(u.id).run();
  return json({ user: { id: u.id, name: u.name, email: u.email, role: u.role } }, 200, { 'set-cookie': await startSession(env, request, u.id) });
};
