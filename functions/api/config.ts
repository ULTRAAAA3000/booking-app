import { Env, json } from '../_lib/core';
import { captchaOn } from '../_lib/guard';

// Публічні налаштування для браузера: ключ віджета Turnstile (секрет сюди не потрапляє).
export const onRequestGet: PagesFunction<Env> = async ({ env }) =>
  json({ turnstile_site_key: captchaOn(env) ? env.TURNSTILE_SITE_KEY : null }, 200, { 'cache-control': 'public, max-age=300' });
