import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { invoices, payments } from '../../../db/schema/billing';
import { appointments } from '../../../db/schema/appointments';
import { patients } from '../../../db/schema/patients';
import { products } from '../../../db/schema/inventory';
import { gte, sql, and, eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin' && user.role !== 'recepcionista') {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }

  const url = new URL(request.url);
  const months = Number(url.searchParams.get('months') || '6');

  const since = new Date();
  since.setMonth(since.getMonth() - months);

  // Revenue by month
  const revenueRaw = await db
    .select({
      month: sql<string>`DATE_FORMAT(${invoices.date}, '%Y-%m')`,
      total: sql<number>`SUM(CAST(${invoices.total} AS DECIMAL(12,2)))`,
      count: sql<number>`COUNT(*)`,
    })
    .from(invoices)
    .where(and(gte(invoices.date, since), sql`${invoices.status} != 'anulada'`))
    .groupBy(sql`DATE_FORMAT(${invoices.date}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${invoices.date}, '%Y-%m')`);

  // Appointments by type
  const apptByType = await db
    .select({
      type: appointments.type,
      count: sql<number>`COUNT(*)`,
    })
    .from(appointments)
    .where(gte(appointments.scheduledAt, since))
    .groupBy(appointments.type);

  // Appointments by status
  const apptByStatus = await db
    .select({
      status: appointments.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(appointments)
    .where(gte(appointments.scheduledAt, since))
    .groupBy(appointments.status);

  // Top patients (most appointments)
  const topPatients = await db
    .select({
      name: patients.name,
      species: patients.species,
      count: sql<number>`COUNT(*)`,
    })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patientId, patients.id))
    .where(gte(appointments.scheduledAt, since))
    .groupBy(appointments.patientId, patients.name, patients.species)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(5);

  // Low stock products
  const lowStock = await db
    .select({ name: products.name, stock: products.stock, minStock: products.minStock })
    .from(products)
    .where(and(sql`${products.stock} <= ${products.minStock}`, eq(products.isActive, true)))
    .orderBy(products.stock)
    .limit(5);

  // Summary totals
  const [totals] = await db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL(12,2))), 0)`,
      paidCount: sql<number>`COUNT(CASE WHEN ${invoices.status} = 'pagada' THEN 1 END)`,
      pendingCount: sql<number>`COUNT(CASE WHEN ${invoices.status} IN ('emitida','parcial') THEN 1 END)`,
    })
    .from(invoices)
    .where(and(gte(invoices.date, since), sql`${invoices.status} != 'anulada'`));

  const [apptTotals] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(appointments)
    .where(gte(appointments.scheduledAt, since));

  const [patientTotal] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(patients)
    .where(eq(patients.isActive, true));

  return new Response(
    JSON.stringify({
      revenueByMonth: revenueRaw,
      appointmentsByType: apptByType,
      appointmentsByStatus: apptByStatus,
      topPatients,
      lowStock,
      summary: {
        totalRevenue: totals?.totalRevenue ?? 0,
        paidInvoices: totals?.paidCount ?? 0,
        pendingInvoices: totals?.pendingCount ?? 0,
        totalAppointments: apptTotals?.total ?? 0,
        totalPatients: patientTotal?.total ?? 0,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
