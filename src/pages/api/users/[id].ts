import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users, accounts } from '../../../db/schema/users';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { userUpdateSchema, zodError, parseJsonBody } from '../../../lib/schemas';

async function hashPassword(password: string): Promise<string> {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = Buffer.from(saltBytes).toString('hex');
  const key = await scryptAsync(password.normalize('NFKC'), salt, { N: 16384, r: 16, p: 1, dkLen: 64 });
  return `${salt}:${Buffer.from(key).toString('hex')}`;
}

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin') return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });

  const id = params.id!;
  const parsed = await parseJsonBody(request);
  if ('error' in parsed) return parsed.error;
  const result = userUpdateSchema.safeParse(parsed.data);
  if (!result.success) return zodError(result.error);
  const { role, name, email, password } = result.data;

  const updateData: Record<string, string> = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (Object.keys(updateData).length > 0) await db.update(users).set(updateData).where(eq(users.id, id));

  if (password) {
    const hashed = await hashPassword(password);
    await db.update(accounts).set({ password: hashed }).where(eq(accounts.userId, id));
  }

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
