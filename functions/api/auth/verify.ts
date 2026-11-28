import { Env, json, fail, ready, needUser, hmac } from '../../_lib/core';
import { rateLimit } from '../../_lib/guard';
import { mailOn, sendVerification } from '../../_lib/mail';
import { redirect } from '../../_lib/social';

// GET ?t=токен: перехід за посиланням із листа. Підтверджує e-mail і веде в кабінет (verified=1, або 0, якщо посилання недійсне).
export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const bad = ready(env); if (bad) return bad;
  const rl = await rateLimit(env, request, 'verify', 30, 600); if (rl) return rl;
  const t = new URL(request.url).searchParams.get('t') ?? '';
  const row = /^[0-9a-f]{64}$/.test(t) ? await env.DB.prepare(`SELECT v.token_hash,v.user_id FROM email_verifications v JOIN users u ON u.id=v.user_id
    WHERE v.token_hash=? AND v.used_at IS NULL AND v.expires_at>strftime('%Y-%m-%dT%H:%M:%fZ','now') AND u.deleted_at IS NULL AND u.email=v.email`)
    .bind(await hmac(env.SESSION_SECRET, t)).first<{ token_hash: string; user_id: string }>() : null;
  if (!row) return redirect('/account.html?verified=0#profile');
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET email_verified_at=COALESCE(email_verified_at,strftime('%Y-%m-%dT%H:%M:%fZ','now')) WHERE id=?").bind(row.user_id),
    env.DB.prepare("UPDATE email_verifications SET used_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE token_hash=?").bind(row.token_hash),
  ]);
  return redirect('/account.html?verified=1#profile');
};

// POST: надіслати лист підтвердження ще раз (потрібен вхід; не частіше ніж раз на 2 хв, 5 на годину).
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const a = await needUser(env, request, true); if (a.res) return a.res;
  if (!mailOn(env)) return fail('mail_off', 503);
  if (!a.user.email) return fail('no_email');
  if (a.user.verified) return json({ ok: true, verified: true });
  const rl = await rateLimit(env, request, 'verify_send', 5, 3600, a.user.id); if (rl) return rl;
  const r = await sendVerification(env, request, a.user, 2);
  return r === 'sent' ? json({ ok: true }) : fail(r === 'wait' ? 'wait' : 'mail_failed', r === 'wait' ? 429 : 502);
};
