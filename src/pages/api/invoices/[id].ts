import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { invoices, invoiceItems, payments } from '../../../db/schema/billing';
import { owners } from '../../../db/schema/patients';
import { eq, desc } from 'drizzle-orm';

export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const id = Number(params.id);
  const [invoice] = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      date: invoices.date,
      subtotal: invoices.subtotal,
      taxRate: invoices.taxRate,
      taxAmount: invoices.taxAmount,
      discount: invoices.discount,
      total: invoices.total,
      status: invoices.status,
      notes: invoices.notes,
      ownerId: invoices.ownerId,
      ownerFirstName: owners.firstName,
      ownerLastName: owners.lastName,
      ownerEmail: owners.email,
      ownerPhone: owners.phone,
    })
    .from(invoices)
    .leftJoin(owners, eq(invoices.ownerId, owners.id))
    .where(eq(invoices.id, id));

  if (!invoice) return new Response(JSON.stringify({ error: 'No encontrado' }), { status: 404 });

  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
  const invoicePayments = await db.select().from(payments).where(eq(payments.invoiceId, id)).orderBy(desc(payments.date));

  return new Response(JSON.stringify({ ...invoice, items, payments: invoicePayments }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const id = Number(params.id);
  const body = await request.json();
  const { status, notes } = body;

  await db.update(invoices).set({ status, notes }).where(eq(invoices.id, id));
  const [updated] = await db.select().from(invoices).where(eq(invoices.id, id));
  return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
};
