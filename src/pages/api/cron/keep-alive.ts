import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sql } from 'drizzle-orm';
import { cleanupRateLimits } from '../../../lib/rateLimit';

/**
 * Ping diario para evitar que Supabase (plan Free) pause el proyecto
 * tras 7 días sin actividad. Lo dispara Vercel Cron (ver vercel.json).
 *
 * Vercel envía `Authorization: Bearer <CRON_SECRET>` si la variable
 * CRON_SECRET está configurada. Rechazamos cualquier otra llamada.
 */
export const GET: APIRoute = async ({ request }) => {
  const secret = (import.meta.env.CRON_SECRET || process.env.CRON_SECRET || '').trim();
  if (secret) {
    const auth = (request.headers.get('authorization') || '').trim();
    if (auth !== `Bearer ${secret}`) {
      return new Response('No autorizado', { status: 401 });
    }
  }

  try {
    await db.execute(sql`SELECT 1`);
    // Aprovecha el ping diario para purgar entradas de rate limit expiradas.
    await cleanupRateLimits();
    return new Response(
      JSON.stringify({ ok: true, ts: new Date().toISOString() }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : 'error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
