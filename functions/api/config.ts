import { Env, json } from '../_lib/core';
import { captchaOn } from '../_lib/guard';
import { googleOn, telegramBotId } from '../_lib/social';

// Публічні налаштування для браузера: ключ віджета Turnstile, чи увімкнено вхід через Google, id бота Telegram (секрети сюди не потрапляють).
export const onRequestGet: PagesFunction<Env> = async ({ env }) =>
  json({ turnstile_site_key: captchaOn(env) ? env.TURNSTILE_SITE_KEY : null, google: googleOn(env), telegram_bot_id: telegramBotId(env) }, 200, { 'cache-control': 'public, max-age=300' });
