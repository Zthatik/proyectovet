import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { products, stockMovements } from '../../../db/schema/inventory';
import { eq } from 'drizzle-orm';
import { stockMovementSchema, zodError } from '../../../lib/schemas';

const STAFF_ROLES = ['admin', 'veterinario', 'recepcionista'];

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (!STAFF_ROLES.includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }

  const body = await request.json();
  const parsed = stockMovementSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { productId, type, quantity, reason } = parsed.data;

  const [product] = await db.select().from(products).where(eq(products.id, productId));
  if (!product) return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });

  // stock/quantity son columnas decimal → llegan como string desde la BD;
  // sumarlas directo concatenaría texto en vez de sumar.
  const isOutflow = type === 'salida' || type === 'consumo_interno';
  const delta = isOutflow ? -quantity : quantity;
  const newStock = parseFloat(product.stock) + delta;

  if (newStock < 0) {
    return new Response(JSON.stringify({ error: 'Stock insuficiente' }), { status: 400 });
  }

  const updated = await db.transaction(async (tx) => {
    await tx.update(products).set({ stock: String(newStock) }).where(eq(products.id, productId));
    await tx.insert(stockMovements).values({
      productId, type, quantity: String(quantity), reason: reason || null, userId: user.id,
    });
    const [result] = await tx.select().from(products).where(eq(products.id, productId));
    return result;
  });

  return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
};
