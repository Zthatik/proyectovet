import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { owners, patients } from '../../../db/schema/patients';
import { eq } from 'drizzle-orm';
import { clientPetSchema, zodError, parseJsonBody } from '../../../lib/schemas';
import { logAudit } from '../../../lib/audit';

/**
 * Permite al tutor autenticado registrar una mascota nueva propia,
 * directamente desde su portal (antes solo el staff podía crear pacientes).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'tutor') return new Response(JSON.stringify({ error: 'Acceso restringido' }), { status: 403 });

  const [owner] = await db.select({ id: owners.id }).from(owners).where(eq(owners.userId, user.id));
  if (!owner) return new Response(JSON.stringify({ error: 'Tu cuenta aún no está vinculada a una ficha de tutor. Contacta a la clínica.' }), { status: 404 });

  const parsed = await parseJsonBody(request);
  if ('error' in parsed) return parsed.error;
  const result = clientPetSchema.safeParse(parsed.data);
  if (!result.success) return zodError(result.error);
  const { name, species, sex, breed, color, dateOfBirth, weight, notes } = result.data;

  const [pet] = await db.insert(patients).values({
    ownerId: owner.id,
    name, species,
    sex: sex || 'desconocido',
    breed: breed || null,
    color: color || null,
    dateOfBirth: dateOfBirth || null,
    weight: weight != null ? String(weight) : null,
    notes: notes || null,
  }).returning();

  await logAudit({ userId: user.id, userName: user.name, action: 'patient.self_create', entityType: 'patient', entityId: pet.id, metadata: { name } });

  return new Response(JSON.stringify(pet), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
