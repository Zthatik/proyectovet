import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { vaccines } from '../../../db/schema/medical';
import { patients, owners } from '../../../db/schema/patients';
import { eq, lte, isNotNull, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const result = await db
    .select({
      id: vaccines.id,
      vaccineName: vaccines.name,
      nextDoseDate: vaccines.nextDoseDate,
      patientId: vaccines.patientId,
      patientName: patients.name,
      patientSpecies: patients.species,
      ownerId: patients.ownerId,
      ownerFirstName: owners.firstName,
      ownerLastName: owners.lastName,
      ownerPhone: owners.phone,
    })
    .from(vaccines)
    .leftJoin(patients, eq(vaccines.patientId, patients.id))
    .leftJoin(owners, eq(patients.ownerId, owners.id))
    .where(
      and(
        isNotNull(vaccines.nextDoseDate),
        lte(vaccines.nextDoseDate, in30Days.toISOString().split('T')[0])
      )
    )
    .orderBy(vaccines.nextDoseDate);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
};
