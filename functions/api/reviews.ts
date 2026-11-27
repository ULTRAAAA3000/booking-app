import { Env, json, fail, ready, sameOrigin, body, str, needUser, currentUser, kyivToday } from '../_lib/core';
import { protect, rateLimit } from '../_lib/guard';

// GET ?slug=...&limit&offset -> публічні відгуки оселі. Без slug -> мої відгуки (потрібен вхід).
export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const bad = ready(env); if (bad) return bad;
  const q = new URL(request.url).searchParams, slug = q.get('slug');
  if (slug) {
    const p = await env.DB.prepare('SELECT id,rating_avg,rating_count FROM properties WHERE slug=? AND is_published=1 AND deleted_at IS NULL').bind(slug).first<{ id: number; rating_avg: number; rating_count: number }>();
    if (!p) return fail('not_found', 404);
    const limit = Math.min(Math.max(Number(q.get('limit')) || 5, 1), 20), offset = Math.max(Number(q.get('offset')) || 0, 0);
    const { results } = await env.DB.prepare(`SELECT COALESCE(r.author_name,u.name,'Гість') AS author,r.rating,r.body,r.verified,r.created_at
      FROM reviews r LEFT JOIN users u ON u.id=r.user_id WHERE r.property_id=? AND r.is_published=1 ORDER BY r.created_at DESC,r.id DESC LIMIT ? OFFSET ?`).bind(p.id, limit, offset).all();
    return json({ reviews: results, total: p.rating_count, avg: p.rating_avg });
  }
  const a = await needUser(env, request); if (a.res) return a.res;
  const { results } = await env.DB.prepare(`SELECT p.title,p.slug,r.rating,r.body,r.created_at FROM reviews r JOIN properties p ON p.id=r.property_id
    WHERE r.user_id=? ORDER BY r.created_at DESC`).bind(a.user.id).all();
  return json({ reviews: results });
};

// Відгук може залишити будь-хто: із акаунтом ім'я береться з акаунта, без акаунта потрібно вказати ім'я.
// Якщо в користувача є завершене бронювання цієї оселі, відгук позначається як підтверджений.
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const bad = ready(env); if (bad) return bad;
  if (!sameOrigin(request)) return fail('forbidden', 403);
  const b = await body(request); if (!b) return fail('invalid_body');
  const user = await currentUser(env, request);
  const g = user ? await rateLimit(env, request, 'review_u', 10, 3600, user.id) : await protect(env, request, b, 'review', 10, 3600);
  if (g) return g;
  const rating = Number(b.rating), text = str(b, 'body').slice(0, 1000);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail('invalid_rating');
  const today = kyivToday();
  let propertyId: number, bookingId: string | null = null;
  const bid = str(b, 'booking_id');
  if (bid) { // з кабінету: відгук до конкретного бронювання
    if (!user) return fail('unauthorized', 401);
    const bk = await env.DB.prepare(`SELECT id,property_id FROM bookings WHERE id=? AND user_id=? AND status IN ('confirmed','completed') AND check_out<=?`).bind(bid, user.id, today).first<{ id: string; property_id: number }>();
    if (!bk) return fail('cannot_review', 409);
    propertyId = bk.property_id; bookingId = bk.id;
  } else {
    const p = await env.DB.prepare('SELECT id FROM properties WHERE slug=? AND is_published=1 AND deleted_at IS NULL').bind(str(b, 'slug')).first<{ id: number }>();
    if (!p) return fail('not_found', 404);
    propertyId = p.id;
    if (user) {
      const bk = await env.DB.prepare(`SELECT b.id FROM bookings b WHERE b.user_id=? AND b.property_id=? AND b.status IN ('confirmed','completed') AND b.check_out<=?
        AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id=b.id) ORDER BY b.check_out DESC LIMIT 1`).bind(user.id, propertyId, today).first<{ id: string }>();
      if (bk) bookingId = bk.id;
      else if (await env.DB.prepare('SELECT 1 FROM reviews WHERE user_id=? AND property_id=? AND booking_id IS NULL').bind(user.id, propertyId).first()) return fail('already_reviewed', 409);
    }
  }
  let name = user ? user.name : str(b, 'name');
  if (!user) {
    if (name.length < 2 || name.length > 60) return fail('invalid_name');
    if (text.length < 10) return fail('review_too_short');
  }
  name = name.slice(0, 60);
  try {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO reviews (property_id,user_id,booking_id,rating,body,author_name,verified) VALUES (?,?,?,?,?,?,?)')
        .bind(propertyId, user?.id ?? null, bookingId, rating, text || null, name, bookingId ? 1 : 0),
      env.DB.prepare(`UPDATE properties SET rating_avg=(SELECT ROUND(AVG(rating),2) FROM reviews WHERE property_id=?1 AND is_published=1),
        rating_count=(SELECT COUNT(*) FROM reviews WHERE property_id=?1 AND is_published=1) WHERE id=?1`).bind(propertyId),
    ]);
  } catch (e) { if (String(e).includes('UNIQUE')) return fail('already_reviewed', 409); throw e; }
  const p = await env.DB.prepare('SELECT rating_avg,rating_count FROM properties WHERE id=?').bind(propertyId).first<{ rating_avg: number; rating_count: number }>();
  return json({ ok: true, avg: p?.rating_avg ?? 0, count: p?.rating_count ?? 0, verified: !!bookingId }, 201);
};
