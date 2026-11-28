import { Env, json, fail, ready, sameOrigin, body, str, EMAIL, PHONE, currentUser } from '../_lib/core';
import { protect } from '../_lib/guard';
import { sendMail, contactMail, TOPICS } from '../_lib/mail';

// POST: форма контактів. Повідомлення завжди зберігається в базі (contact_messages); якщо задано пошту, копія йде на CONTACT_TO
// з Reply-To відвідувача, тож відповісти можна простою «Відповісти».
export const onRequestPost: PagesFunction<Env> = async ({ env, request, waitUntil }) => {
  const bad = ready(env); if (bad) return bad;
  if (!sameOrigin(request)) return fail('forbidden', 403);
  const b = await body(request); if (!b) return fail('invalid_body');
  const g = await protect(env, request, b, 'contact', 5, 3600); if (g) return g;
  const name = str(b, 'name'), email = str(b, 'email').toLowerCase(), phone = str(b, 'phone'), topic = str(b, 'topic') || 'other', message = str(b, 'message');
  if (name.length < 2 || name.length > 80) return fail('invalid_name');
  if (!EMAIL.test(email) || email.length > 254) return fail('invalid_email');
  if (phone && !PHONE.test(phone)) return fail('invalid_phone');
  if (!(topic in TOPICS)) return fail('invalid_topic');
  if (message.length < 10 || message.length > 2000) return fail('invalid_message');
  const user = await currentUser(env, request);
  await env.DB.prepare('INSERT INTO contact_messages (id,user_id,name,email,phone,topic,message) VALUES (?,?,?,?,?,?,?)')
    .bind(crypto.randomUUID(), user?.id ?? null, name, email, phone || null, topic, message).run();
  const to = (env.CONTACT_TO ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  if (to.length) waitUntil(sendMail(env, { to, replyTo: email, ...contactMail({ name, email, phone, topic, message }) }));
  return json({ ok: true }, 201);
};
