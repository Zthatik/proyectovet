import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { veterinarianSchedules } from '../../../db/schema/appointments';
import { users } from '../../../db/schema/users';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const url = new URL(request.url);
  const vetId = url.searchParams.get('veterinarianId');

  let query = db
    .select({
      id: veterinarianSchedules.id,
      veterinarianId: veterinarianSchedules.veterinarianId,
      veterinarianName: users.name,
      dayOfWeek: veterinarianSchedules.dayOfWeek,
      startTime: veterinarianSchedules.startTime,
      endTime: veterinarianSchedules.endTime,
      isActive: veterinarianSchedules.isActive,
    })
    .from(veterinarianSchedules)
    .leftJoin(users, eq(veterinarianSchedules.veterinarianId, users.id))
    .$dynamic();

  if (vetId) query = query.where(eq(veterinarianSchedules.veterinarianId, vetId));

  const result = await query.orderBy(veterinarianSchedules.veterinarianId, veterinarianSchedules.dayOfWeek);
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin') return new Response(JSON.stringify({ error: 'Solo admin' }), { status: 403 });

  const body = await request.json();
  const { veterinarianId, dayOfWeek, startTime, endTime } = body;

  if (!veterinarianId || dayOfWeek === undefined || !startTime || !endTime) {
    return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), { status: 400 });
  }

  const [result] = await db.insert(veterinarianSchedules).values({
    veterinarianId, dayOfWeek: Number(dayOfWeek), startTime, endTime, isActive: true,
  });

  return new Response(JSON.stringify({ id: (result as any).insertId }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
