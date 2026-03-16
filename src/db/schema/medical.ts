import {
  mysqlTable,
  varchar,
  int,
  text,
  timestamp,
  date,
  datetime,
  json,
  index,
} from 'drizzle-orm/mysql-core';
import { users } from './users';
import { patients } from './patients';

export const medicalRecords = mysqlTable('medical_records', {
  id: int('id').primaryKey().autoincrement(),
  patientId: int('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  veterinarianId: varchar('veterinarian_id', { length: 36 })
    .notNull()
    .references(() => users.id),
  appointmentId: int('appointment_id'),
  date: datetime('date').notNull(),
  reason: varchar('reason', { length: 255 }).notNull(),
  diagnosis: text('diagnosis'),
  treatment: text('treatment'),
  observations: text('observations'),
  vitalSigns: json('vital_signs').$type<{
    temperature?: number;
    heartRate?: number;
    weight?: number;
    respiratoryRate?: number;
  }>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  idxPatientId: index('idx_medical_records_patient').on(t.patientId),
  idxDate: index('idx_mr_date').on(t.date),
}));

export const vaccines = mysqlTable('vaccines', {
  id: int('id').primaryKey().autoincrement(),
  patientId: int('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  veterinarianId: varchar('veterinarian_id', { length: 36 })
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  brand: varchar('brand', { length: 100 }),
  batchNumber: varchar('batch_number', { length: 50 }),
  applicationDate: date('application_date').notNull(),
  nextDoseDate: date('next_dose_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  idxNextDoseDate: index('idx_vac_next_dose_date').on(t.nextDoseDate),
}));

export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type NewMedicalRecord = typeof medicalRecords.$inferInsert;
export type Vaccine = typeof vaccines.$inferSelect;
export type NewVaccine = typeof vaccines.$inferInsert;
