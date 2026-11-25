import { Env, json, fail, body, str, needUser, kyivToday } from '../../_lib/core';

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const a = await needUser(env, request, true); if (a.res) return a.res;
  const b = await body(request); if (!b) return fail('invalid_body');
  const r = await env.DB.prepare(`UPDATE bookings SET status='cancelled',cancelled_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id=? AND user_id=? AND status IN ('pending','confirmed') AND check_in>?`).bind(str(b, 'id'), a.user.id, kyivToday()).run();
  return r.meta.changes === 1 ? json({ ok: true }) : fail('cannot_cancel', 409);
};
