import { defineMiddleware } from 'astro:middleware';

const AUTH_COOKIE = 'br-auth';

function safeAppNext(raw: string | null): string {
  if (!raw) return '/connexion';
  try {
    // Only allow same-app relative paths — blocks open redirects via ?next=
    if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return '/connexion';
    if (!raw.startsWith('/app')) return '/connexion';
    return raw;
  } catch {
    return '/connexion';
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  if (!path.startsWith('/app')) return next();

  const auth = context.cookies.get(AUTH_COOKIE)?.value;
  if (auth !== 'demo' && auth !== 'live') {
    const nextPath = safeAppNext(`${path}${context.url.search}`);
    return context.redirect(`/connexion?next=${encodeURIComponent(nextPath)}`);
  }

  const response = await next();
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
});
