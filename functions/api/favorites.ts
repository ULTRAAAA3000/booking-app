import { Env, json, fail, body, str, needUser } from '../_lib/core';

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const a = await needUser(env, request); if (a.res) return a.res;
  const { results } = await env.DB.prepare(`SELECT p.slug,p.title,p.price_minor,p.currency,r.name AS region,
    COALESCE((SELECT url FROM property_photos WHERE property_id=p.id ORDER BY is_cover DESC,sort_order LIMIT 1),'') AS cover
    FROM favorites f JOIN properties p ON p.id=f.property_id JOIN regions r ON r.id=p.region_id
    WHERE f.user_id=? AND p.deleted_at IS NULL ORDER BY f.created_at DESC`).bind(a.user.id).all();
  return json({ favorites: results });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const a = await needUser(env, request, true); if (a.res) return a.res;
  const b = await body(request); if (!b) return fail('invalid_body');
  const p = await env.DB.prepare('SELECT id FROM properties WHERE slug=? AND deleted_at IS NULL').bind(str(b, 'slug')).first<{ id: number }>();
  if (!p) return fail('not_found', 404);
  if (b.on) await env.DB.prepare('INSERT OR IGNORE INTO favorites (user_id,property_id) VALUES (?,?)').bind(a.user.id, p.id).run();
  else await env.DB.prepare('DELETE FROM favorites WHERE user_id=? AND property_id=?').bind(a.user.id, p.id).run();
  return json({ ok: true, on: !!b.on });
};
