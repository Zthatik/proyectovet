import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { prescriptions, prescriptionItems } from '../../../db/schema/prescriptions';
import { patients, owners } from '../../../db/schema/patients';
import { users } from '../../../db/schema/users';
import { eq, desc } from 'drizzle-orm';

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const url = new URL(request.url);
  const patientId = url.searchParams.get('patientId');

  let query = db
    .select({
      id: prescriptions.id,
      date: prescriptions.date,
      status: prescriptions.status,
      notes: prescriptions.notes,
      patientId: prescriptions.patientId,
      patientName: patients.name,
      ownerFirstName: owners.firstName,
      ownerLastName: owners.lastName,
      veterinarianName: users.name,
    })
    .from(prescriptions)
    .leftJoin(patients, eq(prescriptions.patientId, patients.id))
    .leftJoin(owners, eq(patients.ownerId, owners.id))
    .leftJoin(users, eq(prescriptions.veterinarianId, users.id))
    .$dynamic();

  if (patientId) query = query.where(eq(prescriptions.patientId, Number(patientId)));

  const result = await query.orderBy(desc(prescriptions.date));
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin' && user.role !== 'veterinario') {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }

  const body = await request.json();
  const { patientId, medicalRecordId, items, notes } = body;

  if (!patientId || !items || items.length === 0) {
    return new Response(JSON.stringify({ error: 'Paciente e items requeridos' }), { status: 400 });
  }

  const [result] = await db.insert(prescriptions).values({
    patientId: Number(patientId),
    medicalRecordId: medicalRecordId ? Number(medicalRecordId) : null,
    veterinarianId: user.id,
    date: new Date(),
    notes,
  });

  const prescriptionId = (result as any).insertId;
  await db.insert(prescriptionItems).values(
    items.map((item: any) => ({
      prescriptionId,
      medicationName: item.medicationName,
      dosage: item.dosage || null,
      frequency: item.frequency || null,
      duration: item.duration || null,
      instructions: item.instructions || null,
      quantity: item.quantity ? Number(item.quantity) : null,
    }))
  );

  const [newPrescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, prescriptionId));
  return new Response(JSON.stringify(newPrescription), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
