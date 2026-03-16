import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { owners, patients } from '../../../db/schema/patients';
import { appointments } from '../../../db/schema/appointments';
import { invoices } from '../../../db/schema/billing';
import { users } from '../../../db/schema/users';
import { eq, gte, and, ne } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'cliente') return new Response(JSON.stringify({ error: 'Acceso restringido' }), { status: 403 });

  // Find owner record linked to this user
  const [owner] = await db.select().from(owners).where(eq(owners.userId, user.id));
  if (!owner) {
    return new Response(JSON.stringify({ owner: null, pets: [], appointments: [], invoices: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pets, upcomingAppts, pendingInvoices] = await Promise.all([
    db.select().from(patients).where(and(eq(patients.ownerId, owner.id), eq(patients.isActive, true))),
    db
      .select({
        id: appointments.id,
        scheduledAt: appointments.scheduledAt,
        endAt: appointments.endAt,
        type: appointments.type,
        status: appointments.status,
        reason: appointments.reason,
        visitAddress: appointments.visitAddress,
        veterinarianName: users.name,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.veterinarianId, users.id))
      .where(and(eq(appointments.ownerId, owner.id), gte(appointments.scheduledAt, today)))
      .orderBy(appointments.scheduledAt)
      .limit(10),
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        date: invoices.date,
        total: invoices.total,
        status: invoices.status,
      })
      .from(invoices)
      .where(and(eq(invoices.ownerId, owner.id), ne(invoices.status, 'pagada')))
      .orderBy(invoices.date)
      .limit(10),
  ]);

  return new Response(
    JSON.stringify({ owner, pets, appointments: upcomingAppts, invoices: pendingInvoices }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
