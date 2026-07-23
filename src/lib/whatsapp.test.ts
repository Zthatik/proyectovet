import { describe, it, expect } from 'vitest';
import {
  normalizePhoneForWhatsapp,
  buildWhatsappLink,
  buildAppointmentReminderMessage,
} from './whatsapp';

describe('normalizePhoneForWhatsapp', () => {
  it('acepta móvil chileno completo con "+" y espacios', () => {
    expect(normalizePhoneForWhatsapp('+56 9 9292 1167')).toBe('56992921167');
  });

  it('acepta móvil chileno sin código de país', () => {
    expect(normalizePhoneForWhatsapp('9 9292 1167')).toBe('56992921167');
    expect(normalizePhoneForWhatsapp('992921167')).toBe('56992921167');
  });

  it('acepta 8 dígitos sin el 9 inicial', () => {
    expect(normalizePhoneForWhatsapp('92921167')).toBe('56992921167');
  });

  it('respeta números largos con otro código de país', () => {
    expect(normalizePhoneForWhatsapp('+54 9 11 1234 5678')).toBe('5491112345678');
  });

  it('rechaza números demasiado cortos, vacíos o nulos', () => {
    expect(normalizePhoneForWhatsapp('12345')).toBeNull();
    expect(normalizePhoneForWhatsapp('')).toBeNull();
    expect(normalizePhoneForWhatsapp(null)).toBeNull();
    expect(normalizePhoneForWhatsapp(undefined)).toBeNull();
  });

  it('rechaza 9-10 dígitos que no calzan con un móvil chileno', () => {
    expect(normalizePhoneForWhatsapp('812345678')).toBeNull();
  });
});

describe('buildWhatsappLink', () => {
  it('genera enlace wa.me con mensaje codificado', () => {
    const link = buildWhatsappLink('+56 9 9292 1167', 'Hola, ¿cómo está?');
    expect(link).toBe('https://wa.me/56992921167?text=Hola%2C%20%C2%BFc%C3%B3mo%20est%C3%A1%3F');
  });

  it('devuelve null si el teléfono no es válido', () => {
    expect(buildWhatsappLink('123', 'Hola')).toBeNull();
    expect(buildWhatsappLink(null, 'Hola')).toBeNull();
  });
});

describe('buildAppointmentReminderMessage', () => {
  it('incluye tutor, mascota, tipo, fecha, hora y veterinario', () => {
    const msg = buildAppointmentReminderMessage({
      ownerName: 'María Pérez',
      patientName: 'Rocky',
      appointmentDate: 'viernes 24 de julio de 2026',
      appointmentTime: '15:30',
      appointmentTypeLabel: 'Vacunación',
      veterinarianName: 'Dra. Soto',
    });
    expect(msg).toContain('María Pérez');
    expect(msg).toContain('Rocky');
    expect(msg).toContain('Vacunación');
    expect(msg).toContain('viernes 24 de julio de 2026');
    expect(msg).toContain('15:30');
    expect(msg).toContain('Dra. Soto');
  });
});
