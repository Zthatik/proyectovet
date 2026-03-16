import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users } from '../../../db/schema/users';
import { eq } from 'drizzle-orm';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin') return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });

  const id = params.id!;
  const body = await request.json();
  const { role, name } = body;

  await db.update(users).set({ role, name }).where(eq(users.id, id));
  const [updated] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).where(eq(users.id, id));
  return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin') return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });

  const id = params.id!;
  if (id === user.id) return new Response(JSON.stringify({ error: 'No puedes eliminarte a ti mismo' }), { status: 400 });

  await db.delete(users).where(eq(users.id, id));
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
