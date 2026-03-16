import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { veterinarianSchedules } from '../../../db/schema/appointments';
import { eq } from 'drizzle-orm';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin') return new Response(JSON.stringify({ error: 'Solo admin' }), { status: 403 });

  const id = Number(params.id);
  const body = await request.json();
  const { startTime, endTime, isActive } = body;

  await db.update(veterinarianSchedules)
    .set({ ...(startTime && { startTime }), ...(endTime && { endTime }), ...(isActive !== undefined && { isActive }) })
    .where(eq(veterinarianSchedules.id, id));

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin') return new Response(JSON.stringify({ error: 'Solo admin' }), { status: 403 });

  await db.delete(veterinarianSchedules).where(eq(veterinarianSchedules.id, Number(params.id)));
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
