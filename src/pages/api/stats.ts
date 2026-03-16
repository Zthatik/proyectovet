import type { APIRoute } from 'astro';
import { db } from '../../db';
import { patients } from '../../db/schema/patients';
import { appointments } from '../../db/schema/appointments';
import { products } from '../../db/schema/inventory';
import { invoices } from '../../db/schema/billing';
import { eq, gte, and, count, sum } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [patientCount] = await db.select({ count: count() }).from(patients).where(eq(patients.isActive, true));

  const [todayAppts] = await db.select({ count: count() })
    .from(appointments)
    .where(and(gte(appointments.scheduledAt, today), sql`${appointments.scheduledAt} < ${tomorrow}`));

  const [productCount] = await db.select({ count: count() }).from(products).where(eq(products.isActive, true));

  const [monthRevenue] = await db.select({ total: sum(invoices.total) })
    .from(invoices)
    .where(and(gte(invoices.date, firstOfMonth), eq(invoices.status, 'pagada')));

  const upcomingAppts = await db.select({
    id: appointments.id,
    scheduledAt: appointments.scheduledAt,
    type: appointments.type,
    status: appointments.status,
  })
    .from(appointments)
    .where(gte(appointments.scheduledAt, today))
    .limit(5);

  return new Response(JSON.stringify({
    patients: patientCount.count,
    todayAppointments: todayAppts.count,
    products: productCount.count,
    monthRevenue: monthRevenue.total || 0,
    upcomingAppointments: upcomingAppts,
  }), { headers: { 'Content-Type': 'application/json' } });
};
