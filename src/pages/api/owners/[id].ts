import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { owners, patients } from '../../../db/schema/patients';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const id = Number(params.id);
  if (!id || isNaN(id) || id <= 0) {
    return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });
  }
  const [owner] = await db.select().from(owners).where(eq(owners.id, id));
  if (!owner) return new Response(JSON.stringify({ error: 'No encontrado' }), { status: 404 });

  const ownerPatients = await db.select().from(patients).where(eq(patients.ownerId, id));
  return new Response(JSON.stringify({ ...owner, patients: ownerPatients }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const id = Number(params.id);
  if (!id || isNaN(id) || id <= 0) {
    return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });
  }
  const body = await request.json();
  const { firstName, lastName, email, phone, address, documentId } = body;

  await db.update(owners).set({ firstName, lastName, email, phone, address, documentId }).where(eq(owners.id, id));
  const [updated] = await db.select().from(owners).where(eq(owners.id, id));
  return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin' && user.role !== 'recepcionista') {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }

  const id = Number(params.id);
  if (!id || isNaN(id) || id <= 0) {
    return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });
  }
  await db.delete(owners).where(eq(owners.id, id));
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
