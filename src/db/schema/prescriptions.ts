import {
  pgTable,
  varchar,
  integer,
  serial,
  text,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { patients } from './patients';
import { medicalRecords } from './medical';

export const prescriptionStatusEnum = pgEnum('prescription_status', [
  'activa',
  'completada',
  'cancelada',
]);

export const prescriptions = pgTable('prescriptions', {
  id: serial('id').primaryKey(),
  medicalRecordId: integer('medical_record_id').references(() => medicalRecords.id),
  patientId: integer('patient_id')
    .notNull()
    .references(() => patients.id),
  veterinarianId: varchar('veterinarian_id', { length: 36 })
    .notNull()
    .references(() => users.id),
  date: timestamp('date').notNull(),
  notes: text('notes'),
  status: prescriptionStatusEnum('prescription_status').notNull().default('activa'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  idxPatientId: index('idx_prescriptions_patient').on(t.patientId),
}));

export const prescriptionItems = pgTable('prescription_items', {
  id: serial('id').primaryKey(),
  prescriptionId: integer('prescription_id')
    .notNull()
    .references(() => prescriptions.id, { onDelete: 'cascade' }),
  productId: integer('product_id'),
  medicationName: varchar('medication_name', { length: 200 }).notNull(),
  dosage: varchar('dosage', { length: 100 }),
  frequency: varchar('frequency', { length: 100 }),
  duration: varchar('duration', { length: 100 }),
  instructions: text('instructions'),
  quantity: integer('quantity'),
});

export const labOrderStatusEnum = pgEnum('lab_order_status', [
  'solicitado',
  'en_proceso',
  'completado',
  'cancelado',
]);

export const labOrders = pgTable('lab_orders', {
  id: serial('id').primaryKey(),
  medicalRecordId: integer('medical_record_id').references(() => medicalRecords.id),
  patientId: integer('patient_id')
    .notNull()
    .references(() => patients.id),
  veterinarianId: varchar('veterinarian_id', { length: 36 })
    .notNull()
    .references(() => users.id),
  type: varchar('type', { length: 100 }).notNull(),
  description: text('description'),
  status: labOrderStatusEnum('lab_order_status').notNull().default('solicitado'),
  results: text('results'),
  resultFileUrl: varchar('result_file_url', { length: 512 }),
  requestedAt: timestamp('requested_at').notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  idxPatientId: index('idx_lab_orders_patient').on(t.patientId),
  idxStatus: index('idx_lab_orders_status').on(t.status),
}));

export type Prescription = typeof prescriptions.$inferSelect;
export type NewPrescription = typeof prescriptions.$inferInsert;
export type LabOrder = typeof labOrders.$inferSelect;
export type NewLabOrder = typeof labOrders.$inferInsert;
