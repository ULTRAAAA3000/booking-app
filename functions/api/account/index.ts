import { Env, json, fail, body, str, PHONE, needUser, verifyPassword, expiredCookie, realEmail } from '../../_lib/core';
import { rateLimit } from '../../_lib/guard';

const profile = (env: Env, id: string) =>
  env.DB.prepare('SELECT id,name,email,phone,locale,notify_email,marketing_opt_in,email_verified_at,created_at FROM users WHERE id=?').bind(id).first<{ email: string }>().then((p) => p && { ...p, email: realEmail(p.email) });

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const a = await needUser(env, request); if (a.res) return a.res;
  return json({ profile: await profile(env, a.user.id) });
};

export const onRequestPatch: PagesFunction<Env> = async ({ env, request }) => {
  const a = await needUser(env, request, true); if (a.res) return a.res;
  const b = await body(request); if (!b) return fail('invalid_body');
  const sets: string[] = [], vals: unknown[] = [];
  if ('name' in b) { const n = str(b, 'name'); if (n.length < 1 || n.length > 80) return fail('invalid_name'); sets.push('name=?'); vals.push(n); }
  if ('phone' in b) { const p = str(b, 'phone'); if (p && !PHONE.test(p)) return fail('invalid_phone'); sets.push('phone=?'); vals.push(p || null); }
  if ('locale' in b) { if (b.locale !== 'uk') return fail('invalid_locale'); sets.push('locale=?'); vals.push('uk'); }
  for (const k of ['notify_email', 'marketing_opt_in']) if (k in b) { sets.push(`${k}=?`); vals.push(b[k] ? 1 : 0); }
  if (!sets.length) return fail('nothing_to_update');
  await env.DB.prepare(`UPDATE users SET ${sets.join(',')},updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?`).bind(...vals, a.user.id).run();
  return json({ profile: await profile(env, a.user.id) });
};

// Видалення акаунта: персональні дані знеособлюються, сесії й обране видаляються, історія броней залишається в базі.
export const onRequestDelete: PagesFunction<Env> = async ({ env, request }) => {
  const a = await needUser(env, request, true); if (a.res) return a.res;
  const rl = await rateLimit(env, request, 'del', 5, 900, a.user.id); if (rl) return rl;
  const b = await body(request); if (!b) return fail('invalid_body');
  const row = await env.DB.prepare('SELECT password_hash FROM users WHERE id=?').bind(a.user.id).first<{ password_hash: string | null }>();
  if (row?.password_hash && !(await verifyPassword(typeof b.password === 'string' ? b.password : '', row.password_hash))) return fail('invalid_credentials', 401);
  const id = a.user.id;
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET deleted_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),name='Видалений користувач',email='deleted-'||id||'@invalid',phone=NULL,password_hash=NULL WHERE id=?").bind(id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(id),
    env.DB.prepare('DELETE FROM favorites WHERE user_id=?').bind(id),
    env.DB.prepare('DELETE FROM auth_identities WHERE user_id=?').bind(id),
    env.DB.prepare('DELETE FROM email_verifications WHERE user_id=?').bind(id),
    env.DB.prepare("UPDATE contact_messages SET user_id=NULL,name='Видалений користувач',email='deleted@invalid',phone=NULL WHERE user_id=?").bind(id),
  ]);
  return json({ ok: true }, 200, { 'set-cookie': expiredCookie(request) });
};
