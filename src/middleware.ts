import { defineMiddleware } from 'astro:middleware';
import { auth } from './lib/auth';
import { rateLimit } from './lib/rateLimit';

// '/api/cron' se autentica por su cuenta con CRON_SECRET (Bearer), no por sesión.
const publicRoutes = ['/', '/login', '/register', '/api/auth', '/api/cron'];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
}

function addSecurityHeaders(response: Response): Response {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'"
  );
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Rate limit write endpoints: 60 requests per minute per IP
  const writeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (pathname.startsWith('/api/') && writeMethods.includes(context.request.method)) {
    const ip = context.request.headers.get('x-forwarded-for')
      ?? context.request.headers.get('cf-connecting-ip')
      ?? 'unknown';
    if (!rateLimit(`write:${ip}`, 60, 60 * 1000)) {
      return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Espera un momento.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }
  }

  // Rate limit auth endpoints (sign-in, sign-up): 10 requests per minute per IP
  if (pathname.startsWith('/api/auth/sign-in') || pathname.startsWith('/api/auth/sign-up')) {
    const ip = context.request.headers.get('x-forwarded-for')
      ?? context.request.headers.get('cf-connecting-ip')
      ?? 'unknown';
    const key = `auth:${ip}`;
    if (!rateLimit(key, 10, 60 * 1000)) {
      return new Response(JSON.stringify({ error: 'Demasiados intentos. Intenta en un minuto.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      });
    }
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    try {
      const session = await auth.api.getSession({
        headers: context.request.headers,
      });
      if (session) {
        context.locals.user = session.user as any;
        context.locals.session = session.session as any;
      }
    } catch {
      // Ignore auth errors on public routes
    }
    return addSecurityHeaders(await next());
  }

  // Protected routes: require authentication
  try {
    const session = await auth.api.getSession({
      headers: context.request.headers,
    });

    if (!session) {
      if (pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return context.redirect('/login');
    }

    context.locals.user = session.user as any;
    context.locals.session = session.session as any;
  } catch {
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Error de autenticacion' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/login');
  }

  return addSecurityHeaders(await next());
});
