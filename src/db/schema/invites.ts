import { pgTable, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { owners } from './patients';

/**
 * Invitación de un solo uso para vincular una cuenta de tutor a una ficha de
 * "owner" ya existente en el sistema (creada por el staff). Reemplaza la
 * vinculación automática por coincidencia de email: solo el staff puede
 * generar el token, y solo se redime una vez.
 */
export const ownerInvites = pgTable('owner_invites', {
  token: varchar('token', { length: 64 }).primaryKey(),
  ownerId: integer('owner_id')
    .notNull()
    .references(() => owners.id, { onDelete: 'cascade' }),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  usedByUserId: varchar('used_by_user_id', { length: 36 }).references(() => users.id),
}, (t) => ({
  idxOwnerId: index('idx_owner_invites_owner').on(t.ownerId),
}));

export type OwnerInvite = typeof ownerInvites.$inferSelect;
export type NewOwnerInvite = typeof ownerInvites.$inferInsert;
