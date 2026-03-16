import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { products, stockMovements } from '../../../db/schema/inventory';
import { eq, sql } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const body = await request.json();
  const { productId, type, quantity, reason } = body;

  if (!productId || !type || !quantity) {
    return new Response(JSON.stringify({ error: 'Campos requeridos faltantes' }), { status: 400 });
  }

  const [product] = await db.select().from(products).where(eq(products.id, Number(productId)));
  if (!product) return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });

  const delta = type === 'salida' ? -Math.abs(Number(quantity)) : Math.abs(Number(quantity));
  const newStock = product.stock + delta;

  if (newStock < 0) {
    return new Response(JSON.stringify({ error: 'Stock insuficiente' }), { status: 400 });
  }

  await db.update(products).set({ stock: newStock }).where(eq(products.id, Number(productId)));
  await db.insert(stockMovements).values({
    productId: Number(productId), type, quantity: Math.abs(Number(quantity)), reason, userId: user.id,
  });

  const [updated] = await db.select().from(products).where(eq(products.id, Number(productId)));
  return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
};
