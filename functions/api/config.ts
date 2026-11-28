import { Env, json } from '../_lib/core';
import { captchaOn } from '../_lib/guard';
import { googleOn, telegramBotId } from '../_lib/social';
import { mailOn } from '../_lib/mail';

// Публічні налаштування для браузера: ключ віджета Turnstile, вхід через Google, id бота Telegram, чи працює пошта, публічні контакти (секрети сюди не потрапляють).
export const onRequestGet: PagesFunction<Env> = async ({ env }) =>
  json({ turnstile_site_key: captchaOn(env) ? env.TURNSTILE_SITE_KEY : null, google: googleOn(env), telegram_bot_id: telegramBotId(env), mail: mailOn(env),
    contacts: { email: env.PUBLIC_EMAIL || null, phone: env.PUBLIC_PHONE || null, telegram: env.PUBLIC_TELEGRAM || null, address: env.PUBLIC_ADDRESS || null } }, 200, { 'cache-control': 'public, max-age=300' });
