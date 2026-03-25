import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { products, stockMovements } from '../../../db/schema/inventory';
import { eq } from 'drizzle-orm';
import { stockMovementSchema, zodError } from '../../../lib/schemas';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const body = await request.json();
  const parsed = stockMovementSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { productId, type, quantity, reason } = parsed.data;

  const [product] = await db.select().from(products).where(eq(products.id, productId));
  if (!product) return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });

  const delta = type === 'salida' ? -quantity : quantity;
  const newStock = product.stock + delta;

  if (newStock < 0) {
    return new Response(JSON.stringify({ error: 'Stock insuficiente' }), { status: 400 });
  }

  await db.update(products).set({ stock: newStock }).where(eq(products.id, productId));
  await db.insert(stockMovements).values({
    productId, type, quantity, reason: reason || null, userId: user.id,
  });

  const [updated] = await db.select().from(products).where(eq(products.id, productId));
  return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
};
