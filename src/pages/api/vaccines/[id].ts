import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { vaccines } from '../../../db/schema/medical';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  return new Response(
    JSON.stringify({ error: 'Los registros de vacunas no pueden eliminarse para mantener el historial de salud del paciente' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );
};
