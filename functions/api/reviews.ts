import { Env, json, fail, body, str, needUser, kyivToday } from '../_lib/core';

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const a = await needUser(env, request); if (a.res) return a.res;
  const { results } = await env.DB.prepare(`SELECT p.title,p.slug,r.rating,r.body,r.created_at FROM reviews r JOIN properties p ON p.id=r.property_id
    WHERE r.user_id=? ORDER BY r.created_at DESC`).bind(a.user.id).all();
  return json({ reviews: results });
};

// Відгук можна залишити лише після виїзду, один на бронювання.
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const a = await needUser(env, request, true); if (a.res) return a.res;
  const b = await body(request); if (!b) return fail('invalid_body');
  const rating = Number(b.rating), text = str(b, 'body').slice(0, 1000);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail('invalid_rating');
  const bk = await env.DB.prepare(`SELECT id,property_id FROM bookings WHERE id=? AND user_id=? AND status IN ('confirmed','completed') AND check_out<=?`)
    .bind(str(b, 'booking_id'), a.user.id, kyivToday()).first<{ id: string; property_id: number }>();
  if (!bk) return fail('cannot_review', 409);
  try {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO reviews (property_id,user_id,booking_id,rating,body) VALUES (?,?,?,?,?)').bind(bk.property_id, a.user.id, bk.id, rating, text || null),
      env.DB.prepare('UPDATE properties SET rating_avg=ROUND((rating_avg*rating_count+?1)/(rating_count+1),2),rating_count=rating_count+1 WHERE id=?2').bind(rating, bk.property_id),
    ]);
  } catch (e) { if (String(e).includes('UNIQUE')) return fail('already_reviewed', 409); throw e; }
  return json({ ok: true }, 201);
};
