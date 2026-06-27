/**
 * Fuente única de la identidad de "Alma Veterinaria".
 *
 * Todo el sistema (PDFs, correos, app) debe leer la marca, el contacto y los
 * colores desde aquí. Para cambiar el número de WhatsApp, el email o el logo,
 * edita SOLO este archivo.
 */

/** Número de WhatsApp en formato internacional E.164 sin "+" (para enlaces wa.me). */
const WHATSAPP_E164 = '56992921167';

/** Mensaje pre-cargado al abrir el chat de WhatsApp. */
const WHATSAPP_MESSAGE =
  'Hola Alma Veterinaria, quiero agendar una visita a domicilio para mi mascota.';

export const clinic = {
  name: 'Alma Veterinaria',
  tagline: 'Medicina Veterinaria · Terapias Holísticas · Amor Consciente',
  /** Frase que resume el modelo de atención. */
  subtitle: 'Atención veterinaria a domicilio',

  email: 'contacto@almaveterinaria.cl',

  whatsapp: {
    /** Solo dígitos, formato internacional sin "+" (para wa.me / enlaces). */
    e164: WHATSAPP_E164,
    /** Versión legible para mostrar en pantalla y documentos. */
    display: '+56 9 9292 1167',
    /** Enlace directo al chat con mensaje pre-cargado. */
    link: `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
  },

  /** Llamado a la acción: WhatsApp es el ÚNICO canal de agendamiento. */
  bookingCta: 'Agenda tu visita a domicilio por WhatsApp',

  /** Rutas del logo en /public (servidas estáticamente). */
  logo: {
    /** Versión limpia (solo el nombre). Ideal para encabezados y la app. */
    main: '/logoAlmaVet.jpg',
    /** Versión con eslogan completo. Ideal para piezas grandes (login). */
    full: '/logo-alma-tagline.jpg',
    /** Mark cuadrado (perro + gato) sobre fondo blanco. Para chips e íconos. */
    mark: '/logo-alma-mark.png',
  },
} as const;

/**
 * Paleta de marca derivada del logo (verde bosque + acento terracota/dorado).
 * Usada en los PDFs y donde se necesiten valores HEX literales.
 */
export const brandColors = {
  green: '#44563D', // verde bosque principal
  greenMid: '#55694B', // verde medio (acentos suaves)
  greenSoft: '#EAEDE3', // verde muy claro (fondos)
  accent: '#A07C4E', // terracota / dorado del eslogan
  cream: '#F6F3E9', // fondo crema
  ink: '#2B2B2B', // texto principal
  muted: '#6B7280', // texto secundario
  mutedLight: '#9CA3AF', // texto terciario
  border: '#E5E7EB', // bordes
} as const;
