import { Env, json, fail, body, needUser, verifyPassword, hashPassword, sessionHash } from '../../_lib/core';

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const a = await needUser(env, request, true); if (a.res) return a.res;
  const b = await body(request); if (!b) return fail('invalid_body');
  const cur = typeof b.current === 'string' ? b.current : '', next = typeof b.next === 'string' ? b.next : '';
  if (next.length < 8 || next.length > 200) return fail('invalid_password');
  const row = await env.DB.prepare('SELECT password_hash FROM users WHERE id=?').bind(a.user.id).first<{ password_hash: string | null }>();
  if (row?.password_hash && !(await verifyPassword(cur, row.password_hash))) return fail('invalid_credentials', 401);
  const hash = await hashPassword(next), me = await sessionHash(env, request);
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET password_hash=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(hash, a.user.id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').bind(a.user.id, me), // інші пристрої розлогінюються
  ]);
  return json({ ok: true });
};
