import { db } from '../db';
import { appointments } from '../db/schema/appointments';
import { patients, owners } from '../db/schema/patients';
import { users } from '../db/schema/users';
import { eq, and, gte, lte, isNotNull } from 'drizzle-orm';
import { sendAppointmentReminder } from './email/mailer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ReminderResult {
  id: number;
  email: string;
  success: boolean;
  message: string;
}

export interface ReminderSummary {
  total: number;
  sent: number;
  failed: number;
  results: ReminderResult[];
}

/**
 * Envía por email los recordatorios de citas de las próximas `windowHours` horas
 * que aún no se hayan enviado (reminderSent = false) y cuyo tutor tenga email.
 * Marca reminderSent = true solo si el envío fue exitoso.
 *
 * La usan el endpoint manual (/api/appointments/reminders-bulk) y el cron
 * diario (/api/cron/reminders).
 */
export async function sendPendingAppointmentReminders(windowHours = 24): Promise<ReminderSummary> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

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
        lte(appointments.scheduledAt, windowEnd),
        eq(appointments.reminderSent, false),
        isNotNull(owners.email),
      ),
    );

  const results: ReminderResult[] = [];

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

  return {
    total: results.length,
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}
