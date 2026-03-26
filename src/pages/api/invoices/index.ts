import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { invoices, invoiceItems, payments } from '../../../db/schema/billing';
import { owners } from '../../../db/schema/patients';
import { eq, desc } from 'drizzle-orm';
import { invoiceSchema, zodError } from '../../../lib/schemas';

const STAFF_ROLES = ['admin', 'veterinario', 'recepcionista'];

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (!STAFF_ROLES.includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403 });
  }

  const result = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      date: invoices.date,
      subtotal: invoices.subtotal,
      taxAmount: invoices.taxAmount,
      discount: invoices.discount,
      total: invoices.total,
      status: invoices.status,
      ownerId: invoices.ownerId,
      ownerFirstName: owners.firstName,
      ownerLastName: owners.lastName,
    })
    .from(invoices)
    .leftJoin(owners, eq(invoices.ownerId, owners.id))
    .orderBy(desc(invoices.date));

  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const body = await request.json();
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { ownerId, items, taxRate, discount, notes } = parsed.data;
  const appointmentId = body.appointmentId ? Number(body.appointmentId) : null;

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = taxRate ? (subtotal * taxRate) / 100 : 0;
  const disc = discount || 0;
  const total = subtotal + tax - disc;
  if (total < 0) {
    return new Response(JSON.stringify({ error: 'El total no puede ser negativo' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const invoiceNumber = `FAC-${Date.now()}`;

  const newInvoice = await db.transaction(async (tx) => {
    const [result] = await tx.insert(invoices).values({
      invoiceNumber,
      ownerId: Number(ownerId),
      appointmentId: appointmentId ? Number(appointmentId) : null,
      date: new Date(),
      subtotal: String(subtotal.toFixed(2)),
      taxRate: String(taxRate || '0'),
      taxAmount: String(tax.toFixed(2)),
      discount: String(disc.toFixed(2)),
      total: String(total.toFixed(2)),
      notes,
      createdBy: user.id,
    });

    const invoiceId = (result as any).insertId;
    await tx.insert(invoiceItems).values(
      items.map((item) => ({
        invoiceId,
        productId: item.productId || null,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: String(item.unitPrice),
        subtotal: String((item.quantity * item.unitPrice).toFixed(2)),
      }))
    );

    const [inv] = await tx.select().from(invoices).where(eq(invoices.id, invoiceId));
    return inv;
  });
  return new Response(JSON.stringify(newInvoice), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
