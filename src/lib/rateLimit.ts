import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Rate limiter persistente respaldado en Postgres.
 *
 * A diferencia de un Map en memoria, funciona en entornos serverless (Vercel),
 * donde cada invocación es un proceso distinto y no comparte estado.
 *
 * Hace un upsert atómico: si la ventana expiró reinicia el contador, si no lo
 * incrementa. Devuelve `true` si la petición está permitida, `false` si supera
 * el límite. Si la BD falla, hace *fail-open* (no bloquea) para no tumbar el login.
 *
 * @param key         Identificador (p.ej. `auth:<ip>`).
 * @param maxRequests Máximo de peticiones permitidas dentro de la ventana.
 * @param windowMs    Tamaño de la ventana en milisegundos.
 */
export async function rateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  // postgres-js con prepare:false (pooler) no serializa objetos Date como
  // parámetros, así que pasamos la fecha como string ISO y la casteamos.
  const resetAt = new Date(Date.now() + windowMs).toISOString();
  try {
    const rows = await db.execute(sql`
      INSERT INTO rate_limits (key, count, reset_at)
      VALUES (${key}, 1, ${resetAt}::timestamptz)
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
        reset_at = CASE WHEN rate_limits.reset_at < now() THEN ${resetAt}::timestamptz ELSE rate_limits.reset_at END
      RETURNING count
    `);
    const count = Number((rows as unknown as Array<{ count: number }>)[0]?.count ?? 1);
    return count <= maxRequests;
  } catch (err) {
    console.error('[rateLimit] error, fail-open:', err instanceof Error ? err.message : err);
    return true;
  }
}

/** Elimina entradas expiradas (>1 día). Pensado para llamarse desde el cron diario. */
export async function cleanupRateLimits(): Promise<void> {
  try {
    await db.execute(sql`DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day'`);
  } catch {
    // best-effort
  }
}
