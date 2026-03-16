import {
  mysqlTable,
  varchar,
  int,
  text,
  timestamp,
  datetime,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core';
import { users } from './users';
import { patients } from './patients';
import { medicalRecords } from './medical';

export const prescriptionStatusEnum = mysqlEnum('prescription_status', [
  'activa',
  'completada',
  'cancelada',
]);

export const prescriptions = mysqlTable('prescriptions', {
  id: int('id').primaryKey().autoincrement(),
  medicalRecordId: int('medical_record_id').references(() => medicalRecords.id),
  patientId: int('patient_id')
    .notNull()
    .references(() => patients.id),
  veterinarianId: varchar('veterinarian_id', { length: 36 })
    .notNull()
    .references(() => users.id),
  date: datetime('date').notNull(),
  notes: text('notes'),
  status: prescriptionStatusEnum.notNull().default('activa'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  idxPatientId: index('idx_prescriptions_patient').on(t.patientId),
}));

export const prescriptionItems = mysqlTable('prescription_items', {
  id: int('id').primaryKey().autoincrement(),
  prescriptionId: int('prescription_id')
    .notNull()
    .references(() => prescriptions.id, { onDelete: 'cascade' }),
  productId: int('product_id'),
  medicationName: varchar('medication_name', { length: 200 }).notNull(),
  dosage: varchar('dosage', { length: 100 }),
  frequency: varchar('frequency', { length: 100 }),
  duration: varchar('duration', { length: 100 }),
  instructions: text('instructions'),
  quantity: int('quantity'),
});

export const labOrderStatusEnum = mysqlEnum('lab_order_status', [
  'solicitado',
  'en_proceso',
  'completado',
  'cancelado',
]);

export const labOrders = mysqlTable('lab_orders', {
  id: int('id').primaryKey().autoincrement(),
  medicalRecordId: int('medical_record_id').references(() => medicalRecords.id),
  patientId: int('patient_id')
    .notNull()
    .references(() => patients.id),
  veterinarianId: varchar('veterinarian_id', { length: 36 })
    .notNull()
    .references(() => users.id),
  type: varchar('type', { length: 100 }).notNull(),
  description: text('description'),
  status: labOrderStatusEnum.notNull().default('solicitado'),
  results: text('results'),
  resultFileUrl: varchar('result_file_url', { length: 512 }),
  requestedAt: datetime('requested_at').notNull(),
  completedAt: datetime('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  idxPatientId: index('idx_lab_orders_patient').on(t.patientId),
  idxStatus: index('idx_lab_orders_status').on(t.status),
}));

export type Prescription = typeof prescriptions.$inferSelect;
export type NewPrescription = typeof prescriptions.$inferInsert;
export type LabOrder = typeof labOrders.$inferSelect;
export type NewLabOrder = typeof labOrders.$inferInsert;
