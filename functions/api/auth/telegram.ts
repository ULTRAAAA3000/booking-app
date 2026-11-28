import { Env, json, fail, ready, sameOrigin, body, startSession, realEmail } from '../../_lib/core';
import { rateLimit } from '../../_lib/guard';
import { telegramHash, sameHash, socialLogin } from '../../_lib/social';

// POST: дані від Telegram Login (id, first_name, last_name, username, photo_url, auth_date, hash).
// Перевіряємо підпис токеном бота й свіжість auth_date, далі вхід / створення акаунта.
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const bad = ready(env); if (bad) return bad;
  if (!sameOrigin(request)) return fail('forbidden', 403);
  if (!env.TELEGRAM_BOT_TOKEN) return fail('social_off', 503);
  const rl = await rateLimit(env, request, 'tg', 20, 600); if (rl) return rl;
  const b = await body(request); if (!b) return fail('invalid_body');
  const hash = typeof b.hash === 'string' ? b.hash : '', keys = Object.keys(b).filter((k) => k !== 'hash').sort();
  if (!hash || keys.some((k) => typeof b[k] !== 'string' && typeof b[k] !== 'number')) return fail('telegram_failed', 401);
  if (!sameHash(await telegramHash(env.TELEGRAM_BOT_TOKEN, keys.map((k) => `${k}=${b[k]}`).join('\n')), hash)) return fail('telegram_failed', 401);
  const age = Math.floor(Date.now() / 1000) - Number(b.auth_date);
  if (!(age >= -60 && age <= 3600)) return fail('telegram_expired', 401);
  const id = String(b.id);
  if (!/^\d{1,20}$/.test(id)) return fail('telegram_failed', 401);
  const s = (k: string) => (typeof b[k] === 'string' ? (b[k] as string).trim() : '');
  const u = await socialLogin(env, { provider: 'telegram', id, name: [s('first_name'), s('last_name')].filter(Boolean).join(' ') || s('username') });
  return json({ user: { ...u, email: realEmail(u.email) } }, 200, { 'set-cookie': await startSession(env, request, u.id) });
};
