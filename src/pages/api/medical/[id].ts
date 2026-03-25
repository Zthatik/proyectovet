import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { medicalRecords } from '../../../db/schema/medical';
import { patients, owners } from '../../../db/schema/patients';
import { users } from '../../../db/schema/users';
import { prescriptions } from '../../../db/schema/prescriptions';
import { appointments } from '../../../db/schema/appointments';
import { eq, desc } from 'drizzle-orm';

export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const id = Number(params.id);
  if (!id || isNaN(id) || id <= 0) {
    return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });
  }
  const [record] = await db
    .select({
      id: medicalRecords.id,
      date: medicalRecords.date,
      reason: medicalRecords.reason,
      diagnosis: medicalRecords.diagnosis,
      treatment: medicalRecords.treatment,
      observations: medicalRecords.observations,
      vitalSigns: medicalRecords.vitalSigns,
      appointmentId: medicalRecords.appointmentId,
      patientId: medicalRecords.patientId,
      patientName: patients.name,
      patientSpecies: patients.species,
      patientBreed: patients.breed,
      ownerId: patients.ownerId,
      ownerFirstName: owners.firstName,
      ownerLastName: owners.lastName,
      veterinarianId: medicalRecords.veterinarianId,
      veterinarianName: users.name,
    })
    .from(medicalRecords)
    .leftJoin(patients, eq(medicalRecords.patientId, patients.id))
    .leftJoin(owners, eq(patients.ownerId, owners.id))
    .leftJoin(users, eq(medicalRecords.veterinarianId, users.id))
    .where(eq(medicalRecords.id, id));

  if (!record) return new Response(JSON.stringify({ error: 'No encontrado' }), { status: 404 });

  const rxList = await db
    .select({ id: prescriptions.id, date: prescriptions.date, status: prescriptions.status })
    .from(prescriptions)
    .where(eq(prescriptions.medicalRecordId, id))
    .orderBy(desc(prescriptions.date));

  return new Response(JSON.stringify({ ...record, prescriptions: rxList }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin') return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });

  const id = Number(params.id);
  if (!id || isNaN(id) || id <= 0) {
    return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });
  }
  await db.delete(medicalRecords).where(eq(medicalRecords.id, id));
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
