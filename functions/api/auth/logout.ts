import { Env, json, fail, ready, sameOrigin, endSession } from '../../_lib/core';

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const bad = ready(env); if (bad) return bad;
  if (!sameOrigin(request)) return fail('forbidden', 403);
  return json({ ok: true }, 200, { 'set-cookie': await endSession(env, request) });
};
