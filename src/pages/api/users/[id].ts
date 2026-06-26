import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users, accounts, sessions } from '../../../db/schema/users';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { userUpdateSchema, zodError, parseJsonBody } from '../../../lib/schemas';
import { jsonError, jsonOk } from '../../../lib/http';

/** ¿El error es una violación de clave foránea de Postgres? */
function isForeignKeyError(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === '23503' || e?.cause?.code === '23503';
}

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
  const { role, name, email, password, isActive } = result.data;

  if (isActive === false && id === user.id) {
    return jsonError(400, 'No puedes desactivar tu propia cuenta');
  }

  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (Object.keys(updateData).length > 0) await db.update(users).set(updateData).where(eq(users.id, id));

  // Al desactivar, cerrar las sesiones del usuario para cortar el acceso ya.
  if (isActive === false) {
    await db.delete(sessions).where(eq(sessions.userId, id));
  }

  if (password) {
    const hashed = await hashPassword(password);
    await db.update(accounts).set({ password: hashed }).where(eq(accounts.userId, id));
  }

  const [updated] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive }).from(users).where(eq(users.id, id));
  return jsonOk(updated);
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return jsonError(401, 'No autorizado');
  if (user.role !== 'admin') return jsonError(403, 'Sin permiso');

  const id = params.id!;
  if (id === user.id) return jsonError(400, 'No puedes eliminarte a ti mismo');

  // sessions y accounts tienen ON DELETE CASCADE; el resto de tablas
  // (citas, facturas, historiales…) son RESTRICT, así que si el usuario
  // tiene registros asociados, Postgres lanza 23503 y sugerimos desactivar.
  try {
    await db.delete(users).where(eq(users.id, id));
    return jsonOk({ success: true });
  } catch (err) {
    if (isForeignKeyError(err)) {
      return jsonError(409, 'Este usuario tiene registros asociados (citas, facturas, historiales…) y no puede eliminarse. Desactívalo para retirarle el acceso conservando el historial.');
    }
    throw err;
  }
};
