import {
  pgTable,
  varchar,
  integer,
  serial,
  text,
  boolean,
  timestamp,
  date,
  decimal,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const owners = pgTable('owners', {
  id: serial('id').primaryKey(),
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
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  idxEmail: index('idx_owners_email').on(t.email),
}));

export const speciesEnum = pgEnum('species', [
  'perro',
  'gato',
  'ave',
  'conejo',
  'reptil',
  'roedor',
  'otro',
]);

export const sexEnum = pgEnum('sex', ['macho', 'hembra', 'desconocido']);

export const patients = pgTable('patients', {
  id: serial('id').primaryKey(),
  ownerId: integer('owner_id')
    .notNull()
    .references(() => owners.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  species: speciesEnum('species').notNull(),
  breed: varchar('breed', { length: 100 }),
  color: varchar('color', { length: 50 }),
  sex: sexEnum('sex').notNull(),
  dateOfBirth: date('date_of_birth'),
  weight: decimal('weight', { precision: 5, scale: 2 }),
  microchipNumber: varchar('microchip_number', { length: 50 }),
  photo: text('photo'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  idxOwnerId: index('idx_patients_owner').on(t.ownerId),
  idxIsActive: index('idx_patients_active').on(t.isActive),
}));

export type Owner = typeof owners.$inferSelect;
export type NewOwner = typeof owners.$inferInsert;
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
