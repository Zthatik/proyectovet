import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { appointments } from '../../../db/schema/appointments';
import { patients, owners } from '../../../db/schema/patients';
import { users } from '../../../db/schema/users';
import { eq, and, gte, lte, isNotNull } from 'drizzle-orm';
import { sendAppointmentReminder } from '../../../lib/email/mailer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// POST /api/appointments/reminders-bulk
// Sends reminder emails for all appointments in the next 24 hours
// that haven't been sent yet and the owner has an email address.
export const POST: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin' && user.role !== 'recepcionista') {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const pending = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      type: appointments.type,
      patientName: patients.name,
      ownerFirstName: owners.firstName,
      ownerLastName: owners.lastName,
      ownerEmail: owners.email,
      veterinarianName: users.name,
    })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(owners, eq(appointments.ownerId, owners.id))
    .leftJoin(users, eq(appointments.veterinarianId, users.id))
    .where(
      and(
        gte(appointments.scheduledAt, now),
        lte(appointments.scheduledAt, in24h),
        eq(appointments.reminderSent, false),
        isNotNull(owners.email),
      ),
    );

  const results: { id: number; email: string; success: boolean; message: string }[] = [];

  for (const appt of pending) {
    if (!appt.ownerEmail) continue;

    const result = await sendAppointmentReminder({
      ownerName: `${appt.ownerFirstName} ${appt.ownerLastName}`,
      ownerEmail: appt.ownerEmail,
      patientName: appt.patientName || 'su mascota',
      appointmentDate: format(new Date(appt.scheduledAt), "EEEE dd 'de' MMMM 'de' yyyy", { locale: es }),
      appointmentTime: format(new Date(appt.scheduledAt), 'HH:mm', { locale: es }),
      appointmentType: appt.type,
      veterinarianName: appt.veterinarianName || 'Veterinario',
    });

    if (result.success) {
      await db.update(appointments).set({ reminderSent: true }).where(eq(appointments.id, appt.id));
    }

    results.push({ id: appt.id, email: appt.ownerEmail, ...result });
  }

  const sent    = results.filter((r) => r.success).length;
  const failed  = results.filter((r) => !r.success).length;

  return new Response(
    JSON.stringify({ total: results.length, sent, failed, results }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};
