import { z } from 'zod';

// ── Owners ──────────────────────────────────────────────────────────────────
export const ownerSchema = z.object({
  firstName:  z.string().min(1, 'Nombre requerido').max(100),
  lastName:   z.string().min(1, 'Apellido requerido').max(100),
  email:      z.string().email('Email inválido').max(200),
  phone:      z.string().max(20).optional().nullable(),
  address:    z.string().max(300).optional().nullable(),
  documentId: z.string().max(50).optional().nullable(),
});

export type OwnerInput = z.infer<typeof ownerSchema>;

// ── Patients ─────────────────────────────────────────────────────────────────
export const patientSchema = z.object({
  ownerId:         z.number().int().positive('Dueño requerido'),
  name:            z.string().min(1, 'Nombre requerido').max(100),
  species:         z.enum(['perro', 'gato', 'ave', 'conejo', 'reptil', 'otro']),
  breed:           z.string().max(100).optional().nullable(),
  color:           z.string().max(50).optional().nullable(),
  sex:             z.enum(['macho', 'hembra', 'desconocido']).optional().nullable(),
  dateOfBirth:     z.string().optional().nullable(),
  weight:          z.number().positive().optional().nullable(),
  microchipNumber: z.string().max(50).optional().nullable(),
});

export type PatientInput = z.infer<typeof patientSchema>;

// ── Appointments ─────────────────────────────────────────────────────────────
export const appointmentSchema = z.object({
  patientId:       z.number().int().positive('Paciente requerido'),
  ownerId:         z.number().int().positive('Dueño requerido'),
  veterinarianId:  z.string().min(1, 'Veterinario requerido'),
  scheduledAt:     z.string().min(1, 'Fecha requerida'),
  endAt:           z.string().min(1, 'Hora de fin requerida'),
  type:            z.enum(['consulta', 'vacunacion', 'cirugia', 'control', 'emergencia', 'desparasitacion', 'grooming']),
  reason:          z.string().max(500).optional().nullable(),
  notes:           z.string().max(1000).optional().nullable(),
}).refine(data => new Date(data.endAt) > new Date(data.scheduledAt), {
  message: 'La hora de fin debe ser posterior a la de inicio',
  path: ['endAt'],
});

export const appointmentStatusSchema = z.object({
  status: z.enum(['programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio']),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

// ── Medical Records ──────────────────────────────────────────────────────────
export const medicalRecordSchema = z.object({
  patientId:      z.number().int().positive(),
  veterinarianId: z.string().min(1),
  appointmentId:  z.number().int().positive().optional().nullable(),
  date:           z.string().min(1),
  reason:         z.string().min(1, 'Motivo requerido').max(500),
  diagnosis:      z.string().max(500).optional().nullable(),
  treatment:      z.string().max(1000).optional().nullable(),
  observations:   z.string().max(1000).optional().nullable(),
});

export type MedicalRecordInput = z.infer<typeof medicalRecordSchema>;

// ── Prescriptions ─────────────────────────────────────────────────────────────
export const prescriptionItemSchema = z.object({
  medicationName: z.string().min(1, 'Nombre del medicamento requerido').max(200),
  dosage:         z.string().max(100).optional().nullable(),
  frequency:      z.string().max(100).optional().nullable(),
  duration:       z.string().max(100).optional().nullable(),
  quantity:       z.number().int().positive().optional().nullable(),
  productId:      z.number().int().positive().optional().nullable(),
});

export const prescriptionSchema = z.object({
  patientId:       z.number().int().positive(),
  veterinarianId:  z.string().min(1),
  medicalRecordId: z.number().int().positive().optional().nullable(),
  date:            z.string().min(1),
  notes:           z.string().max(1000).optional().nullable(),
  items:           z.array(prescriptionItemSchema).min(1, 'Al menos un medicamento requerido'),
});

export type PrescriptionInput = z.infer<typeof prescriptionSchema>;

// ── Inventory ─────────────────────────────────────────────────────────────────
export const productSchema = z.object({
  name:           z.string().min(1, 'Nombre requerido').max(200),
  category:       z.enum(['medicamento', 'vacuna', 'insumo', 'alimento', 'accesorio', 'otro']),
  sku:            z.string().max(50).optional().nullable(),
  unitPrice:      z.number().nonnegative('Precio debe ser positivo'),
  costPrice:      z.number().nonnegative().optional().nullable(),
  stock:          z.number().int().nonnegative().default(0),
  minStock:       z.number().int().nonnegative().default(5),
  unit:           z.string().max(20).default('unidad'),
  expirationDate: z.string().optional().nullable(),
  supplier:       z.string().max(200).optional().nullable(),
});

export type ProductInput = z.infer<typeof productSchema>;

export const stockMovementSchema = z.object({
  productId:     z.number().int().positive(),
  type:          z.enum(['entrada', 'salida', 'ajuste']),
  quantity:      z.number().int().positive('Cantidad debe ser mayor a 0'),
  reason:        z.string().max(300).optional().nullable(),
});

export type StockMovementInput = z.infer<typeof stockMovementSchema>;

// ── Invoices ──────────────────────────────────────────────────────────────────
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Descripción requerida').max(300),
  quantity:    z.number().positive('Cantidad requerida'),
  unitPrice:   z.number().nonnegative('Precio requerido'),
  productId:   z.number().int().positive().optional().nullable(),
});

export const invoiceSchema = z.object({
  ownerId:  z.number().int().positive('Dueño requerido'),
  taxRate:  z.number().min(0).max(100).default(0),
  discount: z.number().min(0).default(0),
  notes:    z.string().max(500).optional().nullable(),
  items:    z.array(invoiceItemSchema).min(1, 'Al menos un ítem requerido'),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const paymentSchema = z.object({
  invoiceId: z.number().int().positive(),
  amount:    z.number().positive('Monto debe ser mayor a 0'),
  method:    z.enum(['efectivo', 'tarjeta', 'transferencia', 'otro']),
  reference: z.string().max(100).optional().nullable(),
  date:      z.string().min(1),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

// ── Form schemas (string inputs from HTML forms, use z.coerce where needed) ───
// These are used by React form components and share enum values with API schemas.

export const ownerFormSchema = z.object({
  firstName:  z.string().min(1, 'Nombre requerido').max(100),
  lastName:   z.string().min(1, 'Apellido requerido').max(100),
  email:      z.string().email('Email inválido').or(z.literal('')).optional(),
  phone:      z.string().max(20).optional(),
  address:    z.string().max(300).optional(),
  documentId: z.string().max(50).optional(),
});
export type OwnerFormData = z.infer<typeof ownerFormSchema>;

export const patientFormSchema = z.object({
  ownerId:         z.string().min(1, 'Selecciona un dueño'),
  name:            z.string().min(1, 'El nombre es requerido').max(100),
  species:         z.enum(['perro', 'gato', 'ave', 'reptil', 'roedor', 'otro']),
  sex:             z.enum(['macho', 'hembra']),
  breed:           z.string().max(100).optional(),
  color:           z.string().max(50).optional(),
  dateOfBirth:     z.string().optional(),
  weight:          z.string().optional(),
  microchipNumber: z.string().max(50).optional(),
  notes:           z.string().optional(),
});
export type PatientFormData = z.infer<typeof patientFormSchema>;

export const appointmentFormSchema = z.object({
  patientId:      z.string().min(1, 'Selecciona un paciente'),
  ownerId:        z.string().min(1, 'Requerido'),
  veterinarianId: z.string().min(1, 'Selecciona un veterinario'),
  scheduledAt:    z.string().min(1, 'Fecha y hora requerida'),
  endAt:          z.string().min(1, 'Hora de fin requerida'),
  type:           z.enum(['consulta', 'vacunacion', 'cirugia', 'control', 'emergencia', 'grooming']),
  visitAddress:   z.string().max(500).optional(),
  reason:         z.string().max(500).optional(),
  notes:          z.string().max(1000).optional(),
});
export type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

export const medicalRecordFormSchema = z.object({
  patientId:       z.string().min(1, 'Selecciona un paciente'),
  reason:          z.string().min(1, 'El motivo es requerido'),
  diagnosis:       z.string().optional(),
  treatment:       z.string().optional(),
  observations:    z.string().optional(),
  temperature:     z.string().optional(),
  heartRate:       z.string().optional(),
  weight:          z.string().optional(),
  respiratoryRate: z.string().optional(),
});
export type MedicalRecordFormData = z.infer<typeof medicalRecordFormSchema>;

export const productFormSchema = z.object({
  name:           z.string().min(1, 'Nombre requerido').max(200),
  description:    z.string().optional(),
  category:       z.enum(['medicamento', 'vacuna', 'insumo', 'alimento', 'accesorio', 'otro']),
  sku:            z.string().max(50).optional(),
  barcode:        z.string().max(50).optional(),
  unitPrice:      z.string().min(1, 'Precio requerido'),
  costPrice:      z.string().optional(),
  stock:          z.string().optional(),
  minStock:       z.string().optional(),
  unit:           z.string().max(20).optional(),
  expirationDate: z.string().optional(),
  supplier:       z.string().max(200).optional(),
});
export type ProductFormData = z.infer<typeof productFormSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────
export function zodError(error: z.ZodError) {
  const messages = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
  return new Response(JSON.stringify({ error: messages }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
