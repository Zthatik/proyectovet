import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { appointments } from '../../../../db/schema/appointments';
import { patients, owners } from '../../../../db/schema/patients';
import { users } from '../../../../db/schema/users';
import { eq } from 'drizzle-orm';
import { sendAppointmentReminder } from '../../../../lib/email/mailer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const POST: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin' && user.role !== 'recepcionista' && user.role !== 'veterinario') {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }

  const id = Number(params.id);
  const [appt] = await db
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
    .where(eq(appointments.id, id));

  if (!appt) return new Response(JSON.stringify({ error: 'Cita no encontrada' }), { status: 404 });
  if (!appt.ownerEmail) return new Response(JSON.stringify({ error: 'El dueño no tiene email registrado' }), { status: 400 });

  const result = await sendAppointmentReminder({
    ownerName: `${appt.ownerFirstName} ${appt.ownerLastName}`,
    ownerEmail: appt.ownerEmail,
    patientName: appt.patientName || 'su mascota',
    appointmentDate: format(new Date(appt.scheduledAt), "EEEE dd 'de' MMMM 'de' yyyy", { locale: es }),
    appointmentTime: format(new Date(appt.scheduledAt), 'HH:mm', { locale: es }),
    appointmentType: appt.type,
    veterinarianName: appt.veterinarianName || 'Veterinario',
  });

  // Mark reminder as sent
  if (result.success) {
    await db.update(appointments).set({ reminderSent: true }).where(eq(appointments.id, id));
  }

  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  });
};
