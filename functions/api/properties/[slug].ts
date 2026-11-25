import { Env, json, fail, ready } from '../../_lib/core';

export const onRequestGet: PagesFunction<Env, 'slug'> = async ({ env, params }) => {
  const bad = ready(env); if (bad) return bad;
  const row = await env.DB.prepare(`SELECT p.id,p.slug,p.title,p.type,p.description,p.short_desc,p.price_minor,p.currency,p.max_guests,p.bedrooms,p.beds,p.bathrooms,p.area_m2,
      p.check_in_time,p.check_out_time,p.min_nights,p.max_nights,p.host_name,p.rating_avg,p.rating_count,r.slug AS region_slug,r.name AS region
      FROM properties p JOIN regions r ON r.id=p.region_id WHERE p.slug=? AND p.is_published=1 AND p.deleted_at IS NULL`).bind(String(params.slug)).first<Record<string, unknown> & { id: number }>();
  if (!row) return fail('not_found', 404);
  const { id, ...property } = row;
  const photos = (await env.DB.prepare('SELECT url,r2_key,alt FROM property_photos WHERE property_id=? ORDER BY is_cover DESC,sort_order').bind(id).all()).results;
  const amenities = (await env.DB.prepare('SELECT a.name_uk FROM property_amenities pa JOIN amenities a ON a.id=pa.amenity_id WHERE pa.property_id=? ORDER BY a.id').bind(id).all()).results.map((r) => (r as { name_uk: string }).name_uk);
  return json({ property, photos, amenities });
};
