import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { owners } from '../../../db/schema/patients';
import { eq, like, or, desc } from 'drizzle-orm';

const STAFF_ROLES = ['admin', 'veterinario', 'recepcionista'];

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (!STAFF_ROLES.includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';

  let query = db.select().from(owners).$dynamic();
  if (search) {
    query = query.where(
      or(
        like(owners.firstName, `%${search}%`),
        like(owners.lastName, `%${search}%`),
        like(owners.email, `%${search}%`),
        like(owners.phone, `%${search}%`)
      )
    );
  }

  const result = await query.orderBy(desc(owners.createdAt));
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const body = await request.json();
  const { firstName, lastName, email, phone, address, documentId } = body;

  if (!firstName || !lastName) {
    return new Response(JSON.stringify({ error: 'Nombre y apellido son requeridos' }), { status: 400 });
  }

  const [result] = await db.insert(owners).values({
    firstName, lastName, email, phone, address, documentId,
  });

  const [newOwner] = await db.select().from(owners).where(eq(owners.id, (result as any).insertId));
  return new Response(JSON.stringify(newOwner), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
