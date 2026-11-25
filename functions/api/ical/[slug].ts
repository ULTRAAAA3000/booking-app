import { Env, ready } from '../../_lib/core';
import { buildIcs, IcsEvent, OWN_UID_SUFFIX } from '../../_lib/ical';

// Наш календар для каналу: /api/ical/<slug>.ics?t=<токен із channel_links.ical_export_token>
export const onRequestGet: PagesFunction<Env, 'slug'> = async ({ env, params, request }) => {
  const bad = ready(env); if (bad) return bad;
  const slug = String(params.slug).replace(/\.ics$/, ''), t = new URL(request.url).searchParams.get('t') ?? '';
  const p = t.length >= 16 ? await env.DB.prepare(`SELECT p.id,p.title FROM properties p JOIN channel_links c ON c.property_id=p.id
    WHERE p.slug=? AND c.enabled=1 AND c.ical_export_token=?`).bind(slug, t).first<{ id: number; title: string }>() : null;
  if (!p) return new Response('Not found', { status: 404 });
  const day = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const b = await env.DB.prepare(`SELECT id,check_in,check_out FROM bookings WHERE property_id=? AND status IN ('pending','confirmed') AND check_out>=?`).bind(p.id, day).all<{ id: string; check_in: string; check_out: string }>();
  const k = await env.DB.prepare(`SELECT id,start_date,end_date FROM availability_blocks WHERE property_id=? AND source='manual' AND end_date>=?`).bind(p.id, day).all<{ id: number; start_date: string; end_date: string }>();
  const ev: IcsEvent[] = [
    ...b.results.map((r) => ({ uid: r.id + OWN_UID_SUFFIX, from: r.check_in, to: r.check_out })),
    ...k.results.map((r) => ({ uid: `block-${r.id}${OWN_UID_SUFFIX}`, from: r.start_date, to: r.end_date })),
  ];
  return new Response(buildIcs(p.title, ev), { headers: { 'content-type': 'text/calendar; charset=utf-8', 'cache-control': 'no-store' } });
};
