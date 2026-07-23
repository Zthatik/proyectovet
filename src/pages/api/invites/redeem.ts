import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { owners, patients } from '../../../db/schema/patients';
import { ownerInvites } from '../../../db/schema/invites';
import { eq } from 'drizzle-orm';
import { parseJsonBody } from '../../../lib/schemas';

/**
 * Redime una invitación de tutor: vincula la ficha de "owner" invitada a la
 * cuenta autenticada actual. Si la cuenta ya tenía una ficha propia (creada
 * automáticamente al registrarse, sin datos), sus mascotas (si tuviera) se
 * reasignan a la ficha invitada y la ficha vacía se elimina.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const parsed = await parseJsonBody(request);
  if ('error' in parsed) return parsed.error;
  const rawToken = (parsed.data as { token?: unknown })?.token;
  const token = typeof rawToken === 'string' ? rawToken.trim() : '';
  if (!token) return new Response(JSON.stringify({ error: 'Token requerido' }), { status: 400 });

  const [invite] = await db.select().from(ownerInvites).where(eq(ownerInvites.token, token));
  if (!invite) return new Response(JSON.stringify({ error: 'Invitación inválida' }), { status: 404 });
  if (invite.usedAt) return new Response(JSON.stringify({ error: 'Esta invitación ya fue utilizada' }), { status: 400 });
  if (invite.expiresAt.getTime() < Date.now()) {
    return new Response(JSON.stringify({ error: 'Esta invitación expiró. Pide un nuevo link a la clínica.' }), { status: 400 });
  }

  const [invitedOwner] = await db.select().from(owners).where(eq(owners.id, invite.ownerId));
  if (!invitedOwner) return new Response(JSON.stringify({ error: 'La ficha de tutor invitada ya no existe' }), { status: 404 });
  if (invitedOwner.userId && invitedOwner.userId !== user.id) {
    return new Response(JSON.stringify({ error: 'Esta ficha ya está vinculada a otra cuenta' }), { status: 400 });
  }

  const [currentOwner] = await db.select().from(owners).where(eq(owners.userId, user.id));

  await db.transaction(async (tx) => {
    await tx.update(owners).set({ userId: user.id }).where(eq(owners.id, invite.ownerId));
    await tx
      .update(ownerInvites)
      .set({ usedAt: new Date(), usedByUserId: user.id })
      .where(eq(ownerInvites.token, token));

    if (currentOwner && currentOwner.id !== invite.ownerId) {
      // Si la ficha auto-creada al registrarse ya tenía mascotas, se
      // reasignan a la ficha invitada antes de eliminar la ficha vacía.
      await tx.update(patients).set({ ownerId: invite.ownerId }).where(eq(patients.ownerId, currentOwner.id));
      await tx.delete(owners).where(eq(owners.id, currentOwner.id));
    }
  });

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
