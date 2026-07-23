import type { APIRoute } from 'astro';
import { sendPendingAppointmentReminders } from '../../../lib/reminders';

/**
 * Recordatorios automáticos de citas. Lo dispara Vercel Cron cada mañana
 * (ver vercel.json); envía los emails pendientes de las próximas 36 horas,
 * de modo que las citas de mañana por la tarde también alcancen a avisarse
 * con un día de anticipación.
 *
 * Vercel envía `Authorization: Bearer <CRON_SECRET>` si la variable
 * CRON_SECRET está configurada. Rechazamos cualquier otra llamada.
 */
const REMINDER_WINDOW_HOURS = 36;

export const GET: APIRoute = async ({ request }) => {
  const secret = (import.meta.env.CRON_SECRET || process.env.CRON_SECRET || '').trim();
  if (secret) {
    const auth = (request.headers.get('authorization') || '').trim();
    if (auth !== `Bearer ${secret}`) {
      return new Response('No autorizado', { status: 401 });
    }
  }

  try {
    const summary = await sendPendingAppointmentReminders(REMINDER_WINDOW_HOURS);
    return new Response(
      JSON.stringify({ ok: true, ts: new Date().toISOString(), ...summary }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : 'error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
