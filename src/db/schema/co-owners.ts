import { pgTable, serial, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { patients, owners } from './patients';

/**
 * Co-tutela: tutores adicionales de una mascota, además del tutor principal
 * (patients.ownerId). Permite que, por ejemplo, una pareja comparta el
 * acceso a la misma mascota desde cuentas de portal distintas.
 */
export const patientCoOwners = pgTable('patient_co_owners', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  ownerId: integer('owner_id').notNull().references(() => owners.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  uniquePair: uniqueIndex('uq_patient_co_owner').on(t.patientId, t.ownerId),
  idxPatient: index('idx_pco_patient').on(t.patientId),
  idxOwner: index('idx_pco_owner').on(t.ownerId),
}));

export type PatientCoOwner = typeof patientCoOwners.$inferSelect;
export type NewPatientCoOwner = typeof patientCoOwners.$inferInsert;
