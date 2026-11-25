import { Env, json, fail, ready, getProperty, checkStay, isFree, nights, kyivToday } from '../_lib/core';

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const bad = ready(env); if (bad) return bad;
  const q = new URL(request.url).searchParams;
  const p = await getProperty(env, q.get('slug') ?? '');
  if (!p) return fail('not_found', 404);
  if (q.get('busy')) { // зайняті періоди (без персональних даних) для календаря на сторінці оселі
    const { results } = await env.DB.prepare(`SELECT check_in AS "from", check_out AS "to" FROM bookings WHERE property_id=?1 AND status IN ('pending','confirmed') AND check_out>?2
      UNION ALL SELECT start_date,end_date FROM availability_blocks WHERE property_id=?1 AND end_date>?2 ORDER BY 1`).bind(p.id, kyivToday()).all();
    return json({ busy: results });
  }
  const property = { slug: p.slug, title: p.title, region: p.region, cover: p.cover, price_minor: p.price_minor, currency: p.currency, max_guests: p.max_guests, min_nights: p.min_nights };
  const a = q.get('in'), b = q.get('out');
  if (!a || !b) return json({ property, available: null });
  const reason = checkStay(p, a, b, Number(q.get('guests') ?? 1));
  if (reason) return json({ property, available: false, reason });
  const free = await isFree(env, p.id, a, b), n = nights(a, b);
  return json({ property, available: free, reason: free ? null : 'dates_unavailable', nights: n, total_minor: n * p.price_minor });
};
