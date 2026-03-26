import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { products, stockMovements } from '../../../db/schema/inventory';
import { eq, desc } from 'drizzle-orm';
import { productUpdateSchema, zodError, parseJsonBody } from '../../../lib/schemas';

export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const id = Number(params.id);
  if (!id || isNaN(id) || id <= 0) {
    return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });
  }
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) return new Response(JSON.stringify({ error: 'No encontrado' }), { status: 404 });

  const movements = await db.select().from(stockMovements).where(eq(stockMovements.productId, id)).orderBy(desc(stockMovements.createdAt)).limit(20);
  return new Response(JSON.stringify({ ...product, movements }), { headers: { 'Content-Type': 'application/json' } });
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const id = Number(params.id);
  if (!id || isNaN(id) || id <= 0) {
    return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });
  }
  const parsed = await parseJsonBody(request);
  if ('error' in parsed) return parsed.error;
  const result = productUpdateSchema.safeParse(parsed.data);
  if (!result.success) return zodError(result.error);
  const { name, category, sku, unitPrice, costPrice, minStock, unit, expirationDate, supplier } = result.data;

  await db.update(products).set({
    name, category, sku,
    unitPrice: unitPrice !== undefined ? String(unitPrice) : undefined,
    costPrice: costPrice !== undefined ? String(costPrice) : undefined,
    minStock, unit, expirationDate: expirationDate || null, supplier,
  }).where(eq(products.id, id));

  const [updated] = await db.select().from(products).where(eq(products.id, id));
  return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin') return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });

  const id = Number(params.id);
  if (!id || isNaN(id) || id <= 0) {
    return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });
  }
  await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
