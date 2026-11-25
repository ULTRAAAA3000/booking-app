import { Env, json, needUser, sessionHash } from '../../_lib/core';

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const a = await needUser(env, request); if (a.res) return a.res;
  const me = await sessionHash(env, request);
  const { results } = await env.DB.prepare("SELECT token_hash,user_agent,created_at FROM sessions WHERE user_id=? AND expires_at>strftime('%Y-%m-%dT%H:%M:%fZ','now') ORDER BY created_at DESC LIMIT 20")
    .bind(a.user.id).all<{ token_hash: string; user_agent: string | null; created_at: string }>();
  return json({ sessions: results.map((s) => ({ current: s.token_hash === me, user_agent: s.user_agent, created_at: s.created_at })) });
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, request }) => { // вийти на всіх інших пристроях
  const a = await needUser(env, request, true); if (a.res) return a.res;
  const r = await env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').bind(a.user.id, await sessionHash(env, request)).run();
  return json({ ok: true, removed: r.meta.changes });
};
