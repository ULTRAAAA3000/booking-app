import { Env, json, ready, currentUser } from '../../_lib/core';

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const bad = ready(env); if (bad) return bad;
  return json({ user: await currentUser(env, request) });
};
