import { Env, ready, secure } from '../../../_lib/core';
import { rateLimit } from '../../../_lib/guard';
import { googleOn, redirectUri, nextPath, oauthCookie, redirect } from '../../../_lib/social';

// GET ?next=/адреса -> перенаправлення на Google. Випадковий state лежить у HttpOnly-cookie й перевіряється в callback.
export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const bad = ready(env); if (bad) return bad;
  const rl = await rateLimit(env, request, 'oauth', 30, 600); if (rl) return rl;
  if (!googleOn(env)) return redirect('/?auth_error=social_off');
  const state = crypto.randomUUID().replace(/-/g, ''), next = nextPath(new URL(request.url).searchParams.get('next'));
  const q = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID as string, redirect_uri: redirectUri(request), response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' });
  return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${q}`, [oauthCookie(request, `${state}~${encodeURIComponent(next)}`, 600)]);
};
