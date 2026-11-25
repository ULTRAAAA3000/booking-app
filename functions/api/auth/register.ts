import { Env, json, fail, ready, sameOrigin, body, str, EMAIL, hashPassword, startSession } from '../../_lib/core';

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const bad = ready(env); if (bad) return bad;
  if (!sameOrigin(request)) return fail('forbidden', 403);
  const b = await body(request); if (!b) return fail('invalid_body');
  const name = str(b, 'name'), email = str(b, 'email').toLowerCase(), pw = typeof b.password === 'string' ? b.password : '';
  if (name.length < 1 || name.length > 80) return fail('invalid_name');
  if (!EMAIL.test(email) || email.length > 254) return fail('invalid_email');
  if (pw.length < 8 || pw.length > 200) return fail('invalid_password');
  if (await env.DB.prepare('SELECT 1 FROM users WHERE email=?').bind(email).first()) return fail('email_taken', 409);
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare('INSERT INTO users (id,email,name,password_hash,last_login_at) VALUES (?,?,?,?,strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\'))')
      .bind(id, email, name, await hashPassword(pw)).run();
  } catch (e) { if (String(e).includes('UNIQUE')) return fail('email_taken', 409); throw e; }
  return json({ user: { id, name, email, role: 'guest' } }, 201, { 'set-cookie': await startSession(env, request, id) });
};
