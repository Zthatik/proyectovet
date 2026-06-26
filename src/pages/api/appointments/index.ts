import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { appointments } from '../../../db/schema/appointments';
import { patients, owners } from '../../../db/schema/patients';
import { users } from '../../../db/schema/users';
import { eq, gte, lte, and, desc } from 'drizzle-orm';
import { appointmentSchema, zodError } from '../../../lib/schemas';

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const status = url.searchParams.get('status');
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || '100')));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (from) conditions.push(gte(appointments.scheduledAt, new Date(from)));
  if (to) conditions.push(lte(appointments.scheduledAt, new Date(to)));
  const VALID_STATUSES = ['programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio'] as const;
  type AppointmentStatus = typeof VALID_STATUSES[number];
  if (status) {
    if (!VALID_STATUSES.includes(status as AppointmentStatus)) {
      return new Response(JSON.stringify({ error: 'Estado inválido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    conditions.push(eq(appointments.status, status as AppointmentStatus));
  }

  const result = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      endAt: appointments.endAt,
      type: appointments.type,
      status: appointments.status,
      reason: appointments.reason,
      notes: appointments.notes,
      patientId: appointments.patientId,
      patientName: patients.name,
      patientSpecies: patients.species,
      ownerId: appointments.ownerId,
      ownerFirstName: owners.firstName,
      ownerLastName: owners.lastName,
      veterinarianId: appointments.veterinarianId,
      veterinarianName: users.name,
    })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(owners, eq(appointments.ownerId, owners.id))
    .leftJoin(users, eq(appointments.veterinarianId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(appointments.scheduledAt))
    .limit(limit)
    .offset(offset);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
};

const STAFF_ROLES_WRITE = ['admin', 'veterinario', 'recepcionista'];

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (!STAFF_ROLES_WRITE.includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }

  const body = await request.json();
  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { patientId, ownerId, veterinarianId, scheduledAt, endAt, type, reason, notes } = parsed.data;
  const visitAddress = body.visitAddress || null;

  const [newAppt] = await db.insert(appointments).values({
    patientId,
    ownerId,
    veterinarianId,
    scheduledAt: new Date(scheduledAt),
    endAt: new Date(endAt),
    type,
    reason,
    notes,
    visitAddress,
  }).returning();
  return new Response(JSON.stringify(newAppt), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
