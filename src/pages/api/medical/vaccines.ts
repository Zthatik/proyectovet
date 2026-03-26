import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { vaccines } from '../../../db/schema/medical';
import { users } from '../../../db/schema/users';
import { eq, desc } from 'drizzle-orm';
import { vaccineCreateSchema, zodError, parseJsonBody } from '../../../lib/schemas';

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const url = new URL(request.url);
  const patientId = url.searchParams.get('patientId');
  if (!patientId) return new Response(JSON.stringify({ error: 'patientId requerido' }), { status: 400 });

  const result = await db
    .select({
      id: vaccines.id,
      name: vaccines.name,
      brand: vaccines.brand,
      batchNumber: vaccines.batchNumber,
      applicationDate: vaccines.applicationDate,
      nextDoseDate: vaccines.nextDoseDate,
      notes: vaccines.notes,
      veterinarianName: users.name,
    })
    .from(vaccines)
    .leftJoin(users, eq(vaccines.veterinarianId, users.id))
    .where(eq(vaccines.patientId, Number(patientId)))
    .orderBy(desc(vaccines.applicationDate));

  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin' && user.role !== 'veterinario') {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }

  const parsed = await parseJsonBody(request);
  if ('error' in parsed) return parsed.error;
  const result_ = vaccineCreateSchema.safeParse(parsed.data);
  if (!result_.success) return zodError(result_.error);
  const { patientId, name, brand, batchNumber, applicationDate, nextDoseDate, notes } = result_.data;

  const [result] = await db.insert(vaccines).values({
    patientId,
    veterinarianId: user.id,
    name,
    brand: brand ?? null,
    batchNumber: batchNumber ?? null,
    applicationDate,
    nextDoseDate: nextDoseDate ?? null,
    notes: notes ?? null,
  });

  const [newVaccine] = await db.select().from(vaccines).where(eq(vaccines.id, (result as any).insertId));
  return new Response(JSON.stringify(newVaccine), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
