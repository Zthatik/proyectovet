import {
  mysqlTable,
  varchar,
  int,
  text,
  boolean,
  timestamp,
  datetime,
  time,
  tinyint,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core';
import { users } from './users';
import { patients } from './patients';

export const appointmentTypeEnum = mysqlEnum('type', [
  'consulta',
  'vacunacion',
  'cirugia',
  'control',
  'emergencia',
  'grooming',
]);

export const appointmentStatusEnum = mysqlEnum('status', [
  'programada',
  'confirmada',
  'en_camino',
  'en_curso',
  'completada',
  'cancelada',
  'no_asistio',
]);

export const appointments = mysqlTable('appointments', {
  id: int('id').primaryKey().autoincrement(),
  patientId: int('patient_id')
    .notNull()
    .references(() => patients.id),
  ownerId: int('owner_id').notNull(),
  veterinarianId: varchar('veterinarian_id', { length: 36 })
    .notNull()
    .references(() => users.id),
  scheduledAt: datetime('scheduled_at').notNull(),
  endAt: datetime('end_at').notNull(),
  type: appointmentTypeEnum.notNull(),
  status: appointmentStatusEnum.notNull().default('programada'),
  reason: varchar('reason', { length: 255 }),
  notes: text('notes'),
  visitAddress: varchar('visit_address', { length: 500 }),
  reminderSent: boolean('reminder_sent').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (t) => ({
  idxScheduledAt: index('idx_appointments_scheduled').on(t.scheduledAt),
  idxStatus: index('idx_appointments_status').on(t.status),
  idxPatientId: index('idx_appointments_patient').on(t.patientId),
  idxVetId: index('idx_appointments_vet').on(t.veterinarianId),
  idxOwnerId: index('idx_appt_owner_id').on(t.ownerId),
}));

export const veterinarianSchedules = mysqlTable('veterinarian_schedules', {
  id: int('id').primaryKey().autoincrement(),
  veterinarianId: varchar('veterinarian_id', { length: 36 })
    .notNull()
    .references(() => users.id),
  dayOfWeek: tinyint('day_of_week').notNull(), // 0=Sunday .. 6=Saturday
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
