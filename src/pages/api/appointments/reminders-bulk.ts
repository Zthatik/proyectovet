import type { APIRoute } from 'astro';
import { sendPendingAppointmentReminders } from '../../../lib/reminders';

// POST /api/appointments/reminders-bulk
// Sends reminder emails for all appointments in the next 24 hours
// that haven't been sent yet and the owner has an email address.
export const POST: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin' && user.role !== 'recepcionista') {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }

  const summary = await sendPendingAppointmentReminders(24);

  return new Response(
    JSON.stringify(summary),
    { headers: { 'Content-Type': 'application/json' } },
  );
};
