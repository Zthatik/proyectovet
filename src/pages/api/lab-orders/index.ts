import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { labOrders } from '../../../db/schema/prescriptions';
import { patients } from '../../../db/schema/patients';
import { users } from '../../../db/schema/users';
import { eq, desc } from 'drizzle-orm';

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const url = new URL(request.url);
  const patientId = url.searchParams.get('patientId');

  let query = db
    .select({
      id: labOrders.id, type: labOrders.type, description: labOrders.description,
      status: labOrders.status, results: labOrders.results,
      requestedAt: labOrders.requestedAt, completedAt: labOrders.completedAt,
      patientName: patients.name, veterinarianName: users.name,
    })
    .from(labOrders)
    .leftJoin(patients, eq(labOrders.patientId, patients.id))
    .leftJoin(users, eq(labOrders.veterinarianId, users.id))
    .$dynamic();

  if (patientId) query = query.where(eq(labOrders.patientId, Number(patientId)));

  const result = await query.orderBy(desc(labOrders.requestedAt));
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin' && user.role !== 'veterinario') {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }

  const body = await request.json();
  const { patientId, medicalRecordId, type, description } = body;

  if (!patientId || !type) {
    return new Response(JSON.stringify({ error: 'Paciente y tipo requeridos' }), { status: 400 });
  }

  const [result] = await db.insert(labOrders).values({
    patientId: Number(patientId),
    medicalRecordId: medicalRecordId ? Number(medicalRecordId) : null,
    veterinarianId: user.id,
    type, description,
    requestedAt: new Date(),
  });

  const [newOrder] = await db.select().from(labOrders).where(eq(labOrders.id, (result as any).insertId));
  return new Response(JSON.stringify(newOrder), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
