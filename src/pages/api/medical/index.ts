import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { medicalRecords, vaccines } from '../../../db/schema/medical';
import { users } from '../../../db/schema/users';
import { patients } from '../../../db/schema/patients';
import { eq, desc } from 'drizzle-orm';

const STAFF_ROLES = ['admin', 'veterinario', 'recepcionista'];

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (!STAFF_ROLES.includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403 });
  }

  const url = new URL(request.url);
  const patientId = url.searchParams.get('patientId');
  if (!patientId) return new Response(JSON.stringify({ error: 'patientId requerido' }), { status: 400 });

  const records = await db
    .select({
      id: medicalRecords.id,
      date: medicalRecords.date,
      reason: medicalRecords.reason,
      diagnosis: medicalRecords.diagnosis,
      treatment: medicalRecords.treatment,
      observations: medicalRecords.observations,
      vitalSigns: medicalRecords.vitalSigns,
      veterinarianId: medicalRecords.veterinarianId,
      veterinarianName: users.name,
    })
    .from(medicalRecords)
    .leftJoin(users, eq(medicalRecords.veterinarianId, users.id))
    .where(eq(medicalRecords.patientId, Number(patientId)))
    .orderBy(desc(medicalRecords.date));

  return new Response(JSON.stringify(records), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin' && user.role !== 'veterinario') {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }

  const body = await request.json();
  const { patientId, appointmentId, date, reason, diagnosis, treatment, observations, vitalSigns } = body;

  if (!patientId || !reason) {
    return new Response(JSON.stringify({ error: 'Paciente y motivo son requeridos' }), { status: 400 });
  }

  const [result] = await db.insert(medicalRecords).values({
    patientId: Number(patientId),
    veterinarianId: user.id,
    appointmentId: appointmentId ? Number(appointmentId) : null,
    date: date ? new Date(date) : new Date(),
    reason, diagnosis, treatment, observations,
    vitalSigns: vitalSigns || null,
  });

  const [newRecord] = await db.select().from(medicalRecords).where(eq(medicalRecords.id, (result as any).insertId));
  return new Response(JSON.stringify(newRecord), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
