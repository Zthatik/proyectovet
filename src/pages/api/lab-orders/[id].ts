import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { labOrders } from '../../../db/schema/prescriptions';
import { eq } from 'drizzle-orm';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const id = Number(params.id);
  if (!id || isNaN(id) || id <= 0) {
    return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });
  }
  const body = await request.json();
  const { status, results } = body;

  await db.update(labOrders).set({
    status,
    results: results || null,
    completedAt: status === 'completado' ? new Date() : null,
  }).where(eq(labOrders.id, id));

  const [updated] = await db.select().from(labOrders).where(eq(labOrders.id, id));
  return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
};
