// Синхронізація календарів (iCal) із зовнішніми каналами, насамперед booking.com.
// Експорт: наші броні й закриті дати -> .ics, який імпортує канал. Імпорт: .ics каналу -> availability_blocks.

export interface IcsEvent { uid: string; from: string; to: string }
interface Link { id: number; property_id: number; channel: string; ical_import_url: string | null }
export const OWN_UID_SUFFIX = '@polonyna';

const isoDay = (s: string) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
const plusDay = (d: string) => new Date(Date.parse(d) + 864e5).toISOString().slice(0, 10);
const todayUtc = () => new Date().toISOString().slice(0, 10);

export function buildIcs(name: string, events: IcsEvent[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Polonyna//Calendar sync//UK', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${name.replace(/[\r\n,;\\]/g, ' ')}`];
  for (const e of events) L.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${e.from.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${e.to.replace(/-/g, '')}`, 'SUMMARY:Reserved', 'END:VEVENT'); // без персональних даних
  L.push('END:VCALENDAR');
  return L.join('\r\n') + '\r\n';
}

export function parseIcs(text: string): IcsEvent[] {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const out: IcsEvent[] = [];
  let cur: Record<string, string> | null = null;
  for (const l of lines) {
    if (l === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (l === 'END:VEVENT') {
      if (cur && cur.STATUS?.toUpperCase() !== 'CANCELLED' && /^\d{8}/.test(cur.DTSTART ?? '')) {
        const from = isoDay(cur.DTSTART);
        let to = /^\d{8}/.test(cur.DTEND ?? '') ? isoDay(cur.DTEND) : plusDay(from);
        if (to <= from) to = plusDay(from);
        out.push({ uid: cur.UID || `${from}_${to}`, from, to });
      }
      cur = null; continue;
    }
    if (!cur) continue;
    const i = l.indexOf(':'); if (i < 0) continue;
    const key = l.slice(0, i).split(';')[0].toUpperCase();
    if (!(key in cur)) cur[key] = l.slice(i + 1).trim();
  }
  return out;
}

async function syncOne(db: D1Database, l: Link, fetchFn: typeof fetch) {
  let status: string, count = 0;
  try {
    const url = new URL(l.ical_import_url ?? '');
    if (url.protocol !== 'https:') throw new Error('url_not_https');
    const r = await fetchFn(url.href, { headers: { 'user-agent': 'PolonynaSync/1.0' }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error('http_' + r.status);
    const text = await r.text();
    if (text.length > 2_000_000) throw new Error('too_big');
    if (!text.includes('BEGIN:VCALENDAR')) throw new Error('not_ical');
    const today = todayUtc();
    const ev = parseIcs(text).filter((e) => e.to >= today && !e.uid.endsWith(OWN_UID_SUFFIX));
    count = ev.length;
    let conflicts = 0;
    for (const e of ev) {
      const c = await db.prepare(`SELECT COUNT(*) AS n FROM bookings WHERE property_id=? AND status IN ('pending','confirmed') AND check_in<? AND check_out>?`).bind(l.property_id, e.to, e.from).first<{ n: number }>();
      conflicts += c?.n ? 1 : 0;
    }
    const have = (await db.prepare('SELECT external_uid FROM availability_blocks WHERE property_id=? AND source=?').bind(l.property_id, l.channel).all<{ external_uid: string }>()).results.map((r) => r.external_uid);
    const keep = new Set(ev.map((e) => e.uid));
    const st = [
      ...ev.map((e) => db.prepare(`INSERT INTO availability_blocks (property_id,start_date,end_date,reason,source,external_uid) VALUES (?1,?2,?3,?4,?4,?5)
        ON CONFLICT(property_id,source,external_uid) DO UPDATE SET start_date=excluded.start_date,end_date=excluded.end_date`).bind(l.property_id, e.from, e.to, l.channel, e.uid)),
      ...have.filter((u) => !keep.has(u)).map((u) => db.prepare('DELETE FROM availability_blocks WHERE property_id=? AND source=? AND external_uid=?').bind(l.property_id, l.channel, u)),
    ];
    for (let i = 0; i < st.length; i += 50) await db.batch(st.slice(i, i + 50));
    status = `ok: ${count} подій${conflicts ? `, конфліктів із нашими бронями: ${conflicts}` : ''}`;
  } catch (e) {
    status = 'error: ' + (e instanceof Error ? e.message : String(e)); // при помилці наявні блоки не чіпаємо
  }
  await db.prepare(`UPDATE channel_links SET last_synced_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),last_status=? WHERE id=?`).bind(status, l.id).run();
  return { property_id: l.property_id, channel: l.channel, status };
}

export async function syncAll(db: D1Database, fetchFn: typeof fetch = fetch) {
  const { results } = await db.prepare('SELECT id,property_id,channel,ical_import_url FROM channel_links WHERE enabled=1 AND ical_import_url IS NOT NULL').all<Link>();
  const out = [];
  for (const l of results) out.push(await syncOne(db, l, fetchFn));
  return out;
}
