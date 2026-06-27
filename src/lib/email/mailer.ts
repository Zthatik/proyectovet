import nodemailer from 'nodemailer';
import { clinic } from '../clinic';

/** Remitente por defecto, derivado de la marca. SMTP_FROM lo puede sobrescribir. */
const DEFAULT_FROM = `${clinic.name} <${clinic.email}>`;

function getTransporter() {
  const host = import.meta.env.SMTP_HOST;
  const port = Number(import.meta.env.SMTP_PORT || 587);
  const user = import.meta.env.SMTP_USER;
  const pass = import.meta.env.SMTP_PASS;

  // If no SMTP config, use Ethereal (test account) placeholder
  if (!host) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

export interface AppointmentReminderData {
  ownerName: string;
  ownerEmail: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  veterinarianName: string;
}

export async function sendAppointmentReminder(data: AppointmentReminderData): Promise<{ success: boolean; message: string }> {
  const transporter = getTransporter();

  if (!transporter) {
    return { success: false, message: 'SMTP no configurado. Agrega SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASS al archivo .env' };
  }

  const typeLabels: Record<string, string> = {
    consulta: 'Consulta General', vacunacion: 'Vacunación', cirugia: 'Cirugía',
    control: 'Control', emergencia: 'Emergencia', grooming: 'Grooming',
  };

  // URL absoluta del logo (los correos requieren URL pública, no data-URI).
  const siteUrl = (import.meta.env.BETTER_AUTH_URL || '').replace(/\/$/, '');
  const logoImg = siteUrl
    ? `<img src="${siteUrl}${clinic.logo.main}" alt="${clinic.name}" width="120" style="display:block; margin:0 auto 4px; border-radius:8px;" />`
    : `<h1 style="color: white; margin: 0; font-size: 22px;">${clinic.name}</h1>`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: #44563D; padding: 24px; text-align: center;">
      ${logoImg}
      <p style="color: #d7dccb; margin: 6px 0 0; font-size: 13px;">Recordatorio de Cita · ${clinic.subtitle}</p>
    </div>
    <div style="padding: 28px 24px;">
      <p style="color: #374151; font-size: 15px; margin: 0 0 20px;">Hola <strong>${data.ownerName}</strong>,</p>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px;">Le recordamos que tiene una cita programada para su mascota <strong>${data.patientName}</strong>:</p>

      <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 13px; width: 40%;">Tipo:</td>
            <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600;">${typeLabels[data.appointmentType] || data.appointmentType}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Fecha:</td>
            <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600;">${data.appointmentDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Hora:</td>
            <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600;">${data.appointmentTime}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Veterinario:</td>
            <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600;">${data.veterinarianName}</td>
          </tr>
        </table>
      </div>

      <p style="color: #6b7280; font-size: 13px; margin: 0 0 16px;">Si necesita cancelar o reprogramar su visita a domicilio, escríbanos por WhatsApp con anticipación. Es nuestro único canal de agendamiento.</p>
      <div style="text-align: center; margin: 0 0 4px;">
        <a href="${clinic.whatsapp.link}" style="display: inline-block; background: #25D366; color: white; text-decoration: none; font-size: 14px; font-weight: 600; padding: 11px 22px; border-radius: 999px;">💬 ${clinic.bookingCta}</a>
      </div>
      <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 8px 0 0;">${clinic.whatsapp.display}</p>
    </div>
    <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">${clinic.name} — ${clinic.subtitle}</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const from = import.meta.env.SMTP_FROM || DEFAULT_FROM;
    await transporter.sendMail({
      from,
      to: data.ownerEmail,
      subject: `Recordatorio: Cita de ${data.patientName} — ${data.appointmentDate}`,
      html,
    });
    return { success: true, message: 'Email enviado correctamente' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
