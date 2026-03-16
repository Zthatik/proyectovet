import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { invoices, payments } from '../../../db/schema/billing';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const body = await request.json();
  const { invoiceId, amount, method, reference } = body;

  if (!invoiceId || !amount || !method) {
    return new Response(JSON.stringify({ error: 'Factura, monto y método son requeridos' }), { status: 400 });
  }

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, Number(invoiceId)));
  if (!invoice) return new Response(JSON.stringify({ error: 'Factura no encontrada' }), { status: 404 });

  await db.insert(payments).values({
    invoiceId: Number(invoiceId),
    amount: String(amount),
    method,
    reference: reference || null,
    date: new Date(),
    receivedBy: user.id,
  });

  const allPayments = await db.select().from(payments).where(eq(payments.invoiceId, Number(invoiceId)));
  const paid = allPayments.reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);
  const total = parseFloat(String(invoice.total));
  const newStatus = paid >= total ? 'pagada' : paid > 0 ? 'parcial' : invoice.status;

  await db.update(invoices).set({ status: newStatus }).where(eq(invoices.id, Number(invoiceId)));

  return new Response(JSON.stringify({ success: true, newStatus }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
