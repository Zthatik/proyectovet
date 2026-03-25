import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { vaccines } from '../../../db/schema/medical';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const id = Number(params.id);
  if (!id || isNaN(id) || id <= 0) {
    return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });
  }
  await db.delete(vaccines).where(eq(vaccines.id, id));
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
