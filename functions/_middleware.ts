import { Env, fail } from './_lib/core';

// Будь-який необроблений виняток у функціях API повертається як JSON { error: 'server_error' } (а не HTML-сторінка Cloudflare), деталі лише в логах.
export const onRequest: PagesFunction<Env> = async ({ next, request }) => {
  try { return await next(); } catch (e) {
    console.error('api', request.method, new URL(request.url).pathname, e);
    return fail('server_error', 500);
  }
};
