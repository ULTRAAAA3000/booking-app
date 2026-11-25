import { Env, json, fail, ready, getProperty, checkStay, isFree, nights } from '../_lib/core';

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const bad = ready(env); if (bad) return bad;
  const q = new URL(request.url).searchParams;
  const p = await getProperty(env, q.get('slug') ?? '');
  if (!p) return fail('not_found', 404);
  const property = { slug: p.slug, title: p.title, region: p.region, cover: p.cover, price_minor: p.price_minor, currency: p.currency, max_guests: p.max_guests, min_nights: p.min_nights };
  const a = q.get('in'), b = q.get('out');
  if (!a || !b) return json({ property, available: null });
  const reason = checkStay(p, a, b, Number(q.get('guests') ?? 1));
  if (reason) return json({ property, available: false, reason });
  const free = await isFree(env, p.id, a, b), n = nights(a, b);
  return json({ property, available: free, reason: free ? null : 'dates_unavailable', nights: n, total_minor: n * p.price_minor });
};
