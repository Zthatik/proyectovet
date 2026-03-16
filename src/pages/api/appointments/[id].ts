import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { appointments } from '../../../db/schema/appointments';
import { patients, owners } from '../../../db/schema/patients';
import { users } from '../../../db/schema/users';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const id = Number(params.id);
  const [appt] = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      endAt: appointments.endAt,
      type: appointments.type,
      status: appointments.status,
      reason: appointments.reason,
      notes: appointments.notes,
      visitAddress: appointments.visitAddress,
      patientId: appointments.patientId,
      patientName: patients.name,
      patientSpecies: patients.species,
      ownerId: appointments.ownerId,
      ownerFirstName: owners.firstName,
      ownerLastName: owners.lastName,
      ownerPhone: owners.phone,
      veterinarianId: appointments.veterinarianId,
      veterinarianName: users.name,
    })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(owners, eq(appointments.ownerId, owners.id))
    .leftJoin(users, eq(appointments.veterinarianId, users.id))
    .where(eq(appointments.id, id));

  if (!appt) return new Response(JSON.stringify({ error: 'No encontrado' }), { status: 404 });
  return new Response(JSON.stringify(appt), { headers: { 'Content-Type': 'application/json' } });
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const id = Number(params.id);
  const body = await request.json();
  const { scheduledAt, endAt, type, status, reason, notes, veterinarianId, visitAddress } = body;

  await db.update(appointments).set({
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    endAt: endAt ? new Date(endAt) : undefined,
    type, status, reason, notes, veterinarianId,
    ...(visitAddress !== undefined && { visitAddress }),
  }).where(eq(appointments.id, id));

  const [updated] = await db.select().from(appointments).where(eq(appointments.id, id));
  return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const id = Number(params.id);
  await db.update(appointments).set({ status: 'cancelada' }).where(eq(appointments.id, id));
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
