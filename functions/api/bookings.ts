import { Env, json, fail, ready, sameOrigin, body, str, EMAIL, PHONE, currentUser, getProperty, checkStay, nights, kyivToday } from '../_lib/core';
import { protect } from '../_lib/guard';

// Створення бронювання: працює і для гостя без акаунта, і для користувача з сесією (тоді бронь прив'язується до акаунта).
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const bad = ready(env); if (bad) return bad;
  if (!sameOrigin(request)) return fail('forbidden', 403);
  const b = await body(request); if (!b) return fail('invalid_body');
  const g = await protect(env, request, b, 'booking', 10, 3600); if (g) return g;
  const name = str(b, 'name'), email = str(b, 'email').toLowerCase(), phone = str(b, 'phone'), note = str(b, 'note').slice(0, 500);
  if (name.length < 2 || name.length > 80) return fail('invalid_name');
  if (!EMAIL.test(email) || email.length > 254) return fail('invalid_email');
  if (!PHONE.test(phone)) return fail('invalid_phone');
  const p = await getProperty(env, str(b, 'slug'));
  if (!p) return fail('not_found', 404);
  const a = str(b, 'in'), o = str(b, 'out'), guests = Number(b.guests);
  const reason = checkStay(p, a, o, guests);
  if (reason) return fail(reason);
  const user = await currentUser(env, request);
  const n = nights(a, o), id = crypto.randomUUID(), total = n * p.price_minor;
  try {
    await env.DB.prepare(`INSERT INTO bookings (id,property_id,user_id,check_in,check_out,guests,total_minor,currency,guest_name,guest_email,guest_phone,note)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id, p.id, user?.id ?? null, a, o, guests, total, p.currency, name, email, phone, note || null).run();
  } catch (e) {
    if (String(e).includes('dates_unavailable')) return fail('dates_unavailable', 409); // тригер у базі
    throw e;
  }
  return json({ booking: { id, ref: id.slice(0, 8).toUpperCase(), slug: p.slug, title: p.title, check_in: a, check_out: o, nights: n, guests, total_minor: total, currency: p.currency, status: 'confirmed', account: !!user } }, 201);
};

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const bad = ready(env); if (bad) return bad;
  const user = await currentUser(env, request);
  if (!user) return fail('unauthorized', 401);
  const today = kyivToday();
  const { results } = await env.DB.prepare(`SELECT b.id,substr(upper(b.id),1,8) AS ref,p.title,p.slug,b.check_in,b.check_out,b.guests,b.total_minor,b.currency,b.status,b.created_at,
    COALESCE((SELECT url FROM property_photos WHERE property_id=p.id ORDER BY is_cover DESC,sort_order LIMIT 1),'') AS cover,
    EXISTS(SELECT 1 FROM reviews r WHERE r.booking_id=b.id) AS reviewed
    FROM bookings b JOIN properties p ON p.id=b.property_id WHERE b.user_id=? ORDER BY b.check_in DESC LIMIT 100`).bind(user.id).all<Record<string, unknown> & { status: string; check_in: string; check_out: string; reviewed: number }>();
  const bookings = results.map((b) => ({ ...b,
    can_cancel: (b.status === 'confirmed' || b.status === 'pending') && b.check_in > today,
    can_review: (b.status === 'confirmed' || b.status === 'completed') && b.check_out <= today && !b.reviewed }));
  return json({ bookings });
};
