import { Env, json, ready, isDate } from '../../_lib/core';

const SORT: Record<string, string> = {
  recommended: 'p.id ASC', price_asc: 'p.price_minor ASC,p.id', price_desc: 'p.price_minor DESC,p.id',
  rating: 'p.rating_avg DESC,p.rating_count DESC,p.id', popular: 'p.rating_count DESC,p.id',
};

// Каталог: фільтри за регіоном, типом, гістьми, ціною (грн), текстом і вільними датами.
export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const bad = ready(env); if (bad) return bad;
  const q = new URL(request.url).searchParams;
  const w = ['p.is_published=1', 'p.deleted_at IS NULL'], v: unknown[] = [];
  const region = q.get('region'); if (region) { w.push('r.slug=?'); v.push(region); }
  const type = q.get('type'); if (type) { w.push('p.type=?'); v.push(type); }
  const guests = Math.floor(Number(q.get('guests'))); if (guests > 0) { w.push('p.max_guests>=?'); v.push(guests); }
  const min = Number(q.get('min')), max = Number(q.get('max'));
  if (min > 0) { w.push('p.price_minor>=?'); v.push(Math.round(min * 100)); }
  if (max > 0) { w.push('p.price_minor<=?'); v.push(Math.round(max * 100)); }
  const text = (q.get('q') ?? '').trim().slice(0, 60);
  if (text) { w.push('(p.title LIKE ? OR r.name LIKE ?)'); v.push(`%${text}%`, `%${text}%`); }
  const a = q.get('in') ?? '', b = q.get('out') ?? '';
  if (isDate(a) && isDate(b) && b > a) {
    w.push(`NOT EXISTS (SELECT 1 FROM bookings x WHERE x.property_id=p.id AND x.status IN ('pending','confirmed') AND x.check_in<? AND x.check_out>?)`);
    w.push(`NOT EXISTS (SELECT 1 FROM availability_blocks k WHERE k.property_id=p.id AND k.start_date<? AND k.end_date>?)`);
    v.push(b, a, b, a);
  }
  const limit = Math.min(Math.max(Number(q.get('limit')) || 12, 1), 48), offset = Math.max(Number(q.get('offset')) || 0, 0);
  const from = `FROM properties p JOIN regions r ON r.id=p.region_id WHERE ${w.join(' AND ')}`;
  const total = await env.DB.prepare(`SELECT COUNT(*) AS n ${from}`).bind(...v).first<{ n: number }>();
  const { results } = await env.DB.prepare(`SELECT p.slug,p.title,p.type,p.short_desc,p.price_minor,p.currency,p.max_guests,p.bedrooms,p.beds,p.bathrooms,p.area_m2,
      p.rating_avg,p.rating_count,r.slug AS region_slug,r.name AS region,
      COALESCE((SELECT url FROM property_photos WHERE property_id=p.id ORDER BY is_cover DESC,sort_order LIMIT 1),'') AS cover
      ${from} ORDER BY ${SORT[q.get('sort') ?? ''] ?? SORT.recommended} LIMIT ? OFFSET ?`).bind(...v, limit, offset).all();
  const regions = (await env.DB.prepare('SELECT slug,name FROM regions ORDER BY sort_order,name').all()).results;
  const types = (await env.DB.prepare('SELECT DISTINCT type FROM properties WHERE is_published=1 AND deleted_at IS NULL ORDER BY type').all()).results.map((r) => (r as { type: string }).type);
  return json({ items: results, total: total?.n ?? 0, regions, types });
};
