import {
  mysqlTable,
  varchar,
  int,
  text,
  boolean,
  timestamp,
  date,
  decimal,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core';
import { users } from './users';

export const owners = mysqlTable('owners', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  documentId: varchar('document_id', { length: 20 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (t) => ({
  idxEmail: index('idx_owners_email').on(t.email),
}));

export const speciesEnum = mysqlEnum('species', [
  'perro',
  'gato',
  'ave',
  'reptil',
  'roedor',
  'otro',
]);

export const sexEnum = mysqlEnum('sex', ['macho', 'hembra']);

export const patients = mysqlTable('patients', {
  id: int('id').primaryKey().autoincrement(),
  ownerId: int('owner_id')
    .notNull()
    .references(() => owners.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  species: speciesEnum.notNull(),
  breed: varchar('breed', { length: 100 }),
  color: varchar('color', { length: 50 }),
  sex: sexEnum.notNull(),
  dateOfBirth: date('date_of_birth'),
  weight: decimal('weight', { precision: 5, scale: 2 }),
  microchipNumber: varchar('microchip_number', { length: 50 }),
  photo: text('photo'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (t) => ({
  idxOwnerId: index('idx_patients_owner').on(t.ownerId),
  idxIsActive: index('idx_patients_active').on(t.isActive),
}));

export type Owner = typeof owners.$inferSelect;
export type NewOwner = typeof owners.$inferInsert;
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
