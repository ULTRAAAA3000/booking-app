import { Env, ready, startSession } from '../../../_lib/core';
import { rateLimit } from '../../../_lib/guard';
import { googleOn, redirectUri, nextPath, oauthCookie, redirect, socialLogin } from '../../../_lib/social';

interface Claims { iss?: string; aud?: string; exp?: number; sub?: string; email?: string; email_verified?: boolean | string; name?: string }
const claims = (jwt: string): Claims => {
  const p = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(p), (c) => c.charCodeAt(0))));
};

// Google повертає сюди з ?code&state. Код обмінюється на токен напряму з серверами Google (HTTPS + client_secret),
// тому id_token можна читати без перевірки підпису. Після входу: сесія (cookie) і перенаправлення на сторінку, з якої почали.
export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const bad = ready(env); if (bad) return bad;
  const rl = await rateLimit(env, request, 'oauth', 30, 600); if (rl) return rl;
  const clear = oauthCookie(request, '', 0), q = new URL(request.url).searchParams;
  const err = (e: string) => redirect(`/?auth_error=${e}`, [clear]);
  if (!googleOn(env)) return err('social_off');
  if (q.get('error')) return err('google_denied');
  const [st, nx = ''] = ((request.headers.get('cookie') ?? '').split(/;\s*/).find((c) => c.startsWith('oas=')) ?? '').slice(4).split('~');
  const code = q.get('code');
  if (!st || st !== q.get('state') || !code) return err('google_failed');
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID as string, client_secret: env.GOOGLE_CLIENT_SECRET as string, redirect_uri: redirectUri(request), grant_type: 'authorization_code' }),
    });
    const t = (await r.json()) as { id_token?: string };
    if (!r.ok || !t.id_token) return err('google_failed');
    const c = claims(t.id_token);
    if ((c.iss !== 'https://accounts.google.com' && c.iss !== 'accounts.google.com') || c.aud !== env.GOOGLE_CLIENT_ID || !c.exp || c.exp * 1000 < Date.now()) return err('google_failed');
    if (!c.sub || !c.email || !(c.email_verified === true || c.email_verified === 'true')) return err('google_failed');
    const u = await socialLogin(env, { provider: 'google', id: c.sub, name: c.name || c.email.split('@')[0], email: c.email });
    let next = '/'; try { next = nextPath(decodeURIComponent(nx)); } catch { /* зіпсований next: на головну */ }
    return redirect(next, [await startSession(env, request, u.id), clear]);
  } catch { return err('google_failed'); }
};
