import { Env, json } from './_lib/core';

// Будь-який необроблений виняток у функціях API повертається як JSON { error: 'server_error' } (а не HTML-сторінка Cloudflare), деталі лише в логах.
export const onRequest: PagesFunction<Env> = async ({ next, request }) => {
  try { return await next(); } catch (e) {
    console.error('api', request.method, new URL(request.url).pathname, e);
    return json({ error: 'server_error', detail: String(e).slice(0, 200) }, 500); // ТИМЧАСОВО: текст помилки для діагностики, прибрати після виправлення
  }
};
