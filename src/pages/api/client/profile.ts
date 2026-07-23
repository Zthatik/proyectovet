import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { owners } from '../../../db/schema/patients';
import { eq } from 'drizzle-orm';
import { clientProfileSchema, zodError, parseJsonBody } from '../../../lib/schemas';
import { logAudit } from '../../../lib/audit';

/**
 * Permite al tutor autenticado editar sus propios datos de contacto
 * (teléfono, dirección). El email queda fuera: es la identidad de acceso y
 * cambiarlo se gestiona desde Configuración, no desde el portal.
 */
export const PUT: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'tutor') return new Response(JSON.stringify({ error: 'Acceso restringido' }), { status: 403 });

  const [owner] = await db.select({ id: owners.id }).from(owners).where(eq(owners.userId, user.id));
  if (!owner) return new Response(JSON.stringify({ error: 'Tu cuenta aún no está vinculada a una ficha de tutor' }), { status: 404 });

  const parsed = await parseJsonBody(request);
  if ('error' in parsed) return parsed.error;
  const result = clientProfileSchema.safeParse(parsed.data);
  if (!result.success) return zodError(result.error);

  await db.update(owners).set({ phone: result.data.phone, address: result.data.address }).where(eq(owners.id, owner.id));
  await logAudit({ userId: user.id, userName: user.name, action: 'owner.self_update_contact', entityType: 'owner', entityId: owner.id });

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
