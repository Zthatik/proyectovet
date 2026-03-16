import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users } from '../../../db/schema/users';
import { eq } from 'drizzle-orm';

const ADMIN_ONLY = ['admin'];

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (!ADMIN_ONLY.includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403 });
  }

  const url = new URL(request.url);
  const role = url.searchParams.get('role');

  let query = db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
  }).from(users).$dynamic();

  if (role) query = query.where(eq(users.role, role as any));

  const result = await query;
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
};
