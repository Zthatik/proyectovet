import { pgTable, serial, varchar, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Bitácora de acciones sensibles: quién hizo qué, cuándo, y sobre qué
 * registro. No reemplaza createdAt/updatedAt — registra explícitamente
 * acciones destructivas o de alto impacto (borrados, cambios de precio,
 * anulación de facturas, cambios de rol) para poder investigar un incidente
 * o responder a una auditoría de cumplimiento (Ley 21.719).
 */
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
  userName: varchar('user_name', { length: 255 }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 50 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  idxCreatedAt: index('idx_audit_logs_created_at').on(t.createdAt),
  idxEntity: index('idx_audit_logs_entity').on(t.entityType, t.entityId),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
