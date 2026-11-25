import { syncAll } from '../../../functions/_lib/ical';

export interface Env { DB: D1Database; SYNC_SECRET?: string }

export default {
  // Cron: підтягує календарі каналів і закриває зайняті там дати в нашій базі.
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(syncAll(env.DB));
  },
  // Ручний запуск: POST /run з заголовком Authorization: Bearer <SYNC_SECRET>
  async fetch(req: Request, env: Env): Promise<Response> {
    const u = new URL(req.url);
    if (req.method === 'POST' && u.pathname === '/run' && env.SYNC_SECRET && req.headers.get('authorization') === `Bearer ${env.SYNC_SECRET}`) {
      return Response.json({ results: await syncAll(env.DB) });
    }
    return new Response('Not found', { status: 404 });
  },
};
