import { Env, hmac } from './core';

export const mailOn = (env: Env) => !!(env.RESEND_API_KEY && env.MAIL_FROM);
export const esc = (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

// Відправка через Resend (https://resend.com/docs/api-reference/emails/send-email). Без RESEND_API_KEY і MAIL_FROM нічого не робить.
export async function sendMail(env: Env, m: { to: string | string[]; subject: string; html: string; text: string; replyTo?: string }): Promise<boolean> {
  if (!mailOn(env)) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM, to: m.to, subject: m.subject, html: m.html, text: m.text, ...(m.replyTo ? { reply_to: m.replyTo } : {}) }),
    });
    if (!r.ok) console.error('resend', r.status, await r.text());
    return r.ok;
  } catch (e) { console.error('resend', e); return false; }
}

// ---- оформлення листів (стиль сайту: персиковий фон, біла картка, чорна кнопка) ----
const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
export const fd = (s: string) => `${Number(s.slice(8, 10))} ${MONTHS[Number(s.slice(5, 7)) - 1]} ${s.slice(0, 4)}`;
export const money = (minor: number, cur: string) => { const [i, f] = (minor / 100).toFixed(minor % 100 ? 2 : 0).split('.'); return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${f ? ',' + f : ''} ${cur === 'UAH' ? '₴' : cur}`; };
const rows = (r: [string, string][]) => `<table role="presentation" style="width:100%;border-collapse:collapse;margin:18px 0">${r.map(([k, v]) =>
  `<tr><td style="padding:9px 0;border-top:1px solid #f1e8e2;color:#8a7f83;font-size:14px">${esc(k)}</td><td style="padding:9px 0;border-top:1px solid #f1e8e2;font-size:14px;text-align:right">${esc(v)}</td></tr>`).join('')}</table>`;
const layout = (title: string, inner: string, btn?: { href: string; label: string }) => `<!doctype html><html lang="uk"><body style="margin:0;background:#f7d9c6;padding:28px 12px;font-family:Manrope,Arial,sans-serif;color:#1d1a1c">
<div style="max-width:520px;margin:0 auto"><div style="font-size:22px;font-weight:300;margin:0 0 14px 6px">BookingApp</div>
<div style="background:#fff;border-radius:22px;padding:30px 28px"><h1 style="font:400 26px Georgia,serif;margin:0 0 14px">${esc(title)}</h1>
<div style="font-size:15px;line-height:1.65;color:#5c5156">${inner}</div>${btn ? `<a href="${esc(btn.href)}" style="display:inline-block;margin-top:20px;background:#000;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:26px">${esc(btn.label)}</a>` : ''}</div>
<p style="font-size:12px;color:#8a7f83;margin:14px 6px 0">Це автоматичний лист від BookingApp.</p></div></body></html>`;

// ---- підтвердження e-mail ----
// Токен у листі, у базі лише його HMAC. cooldownMin: не надсилати знову, якщо лист уже йшов нещодавно.
export async function sendVerification(env: Env, req: Request, u: { id: string; name: string; email: string }, cooldownMin = 10): Promise<'sent' | 'wait' | 'failed' | 'off'> {
  if (!mailOn(env) || !u.email || u.email.endsWith('.invalid')) return 'off';
  const recent = await env.DB.prepare("SELECT 1 FROM email_verifications WHERE user_id=? AND created_at>strftime('%Y-%m-%dT%H:%M:%fZ','now',?)").bind(u.id, `-${cooldownMin} minutes`).first();
  if (recent) return 'wait';
  const token = [...crypto.getRandomValues(new Uint8Array(32))].map((x) => x.toString(16).padStart(2, '0')).join('');
  await env.DB.prepare('INSERT INTO email_verifications (token_hash,user_id,email,expires_at) VALUES (?,?,?,?)')
    .bind(await hmac(env.SESSION_SECRET, token), u.id, u.email, new Date(Date.now() + 48 * 36e5).toISOString()).run();
  if (Math.random() < 0.02) await env.DB.prepare("DELETE FROM email_verifications WHERE expires_at<strftime('%Y-%m-%dT%H:%M:%fZ','now','-7 days')").run(); // прибирання старих токенів
  const link = `${new URL(req.url).origin}/api/auth/verify?t=${token}`;
  const ok = await sendMail(env, {
    to: u.email, subject: 'Підтвердіть e-mail — BookingApp',
    html: layout('Підтвердіть e-mail', `<p>Вітаємо, ${esc(u.name)}! Натисніть кнопку, щоб підтвердити цю адресу. Посилання діє 48 годин.</p><p>Якщо ви не реєструвались на BookingApp, просто проігноруйте цей лист.</p>`, { href: link, label: 'Підтвердити e-mail' }),
    text: `Вітаємо, ${u.name}! Підтвердіть e-mail за посиланням (діє 48 годин): ${link}\n\nЯкщо ви не реєструвались на BookingApp, проігноруйте цей лист.`,
  });
  return ok ? 'sent' : 'failed';
}

// ---- підтвердження бронювання гостю ----
export function bookingMail(origin: string, b: { ref: string; title: string; check_in: string; check_out: string; nights: number; guests: number; total_minor: number; currency: string; name: string; account: boolean }) {
  const r: [string, string][] = [['Номер бронювання', b.ref], ['Оселя', b.title], ['Заїзд', fd(b.check_in)], ['Виїзд', fd(b.check_out)], ['Ночей / гостей', `${b.nights} / ${b.guests}`], ['Разом', money(b.total_minor, b.currency)]];
  return {
    subject: `Бронювання ${b.ref} прийнято: ${b.title}`,
    html: layout('Бронювання прийнято', `<p>Дякуємо, ${esc(b.name)}! Ваше замовлення прийнято. Збережіть номер бронювання.</p>${rows(r)}<p style="font-size:13px">Оплата поки не потрібна: її підключимо наступним етапом.${b.account ? '' : ' Ви бронювали без акаунта, тож збережіть цей лист.'}</p>`,
      b.account ? { href: `${origin}/account.html#bookings`, label: 'Мої бронювання' } : undefined),
    text: `Дякуємо, ${b.name}! Бронювання прийнято.\n\n${r.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nОплата поки не потрібна: її підключимо наступним етапом.`,
  };
}

// ---- повідомлення з форми контактів нам ----
export const TOPICS: Record<string, string> = { booking: 'Бронювання', stay: 'Питання про оселю', host: 'Розмістити оселю', other: 'Інше' };
export function contactMail(m: { name: string; email: string; phone: string; topic: string; message: string }) {
  const r: [string, string][] = [['Тема', TOPICS[m.topic]], ['Ім\'я', m.name], ['E-mail', m.email], ['Телефон', m.phone || '—']];
  return {
    subject: `Нове повідомлення: ${TOPICS[m.topic]}`,
    html: layout('Нове повідомлення з сайту', `${rows(r)}<p style="white-space:pre-line;color:#1d1a1c">${esc(m.message)}</p><p style="font-size:13px">Щоб відповісти, просто натисніть «Відповісти»: лист піде на ${esc(m.email)}.</p>`),
    text: `${r.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${m.message}`,
  };
}
