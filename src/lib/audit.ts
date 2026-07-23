import { db } from '../db';
import { auditLogs } from '../db/schema/audit';

export interface AuditParams {
  userId: string;
  userName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  metadata?: Record<string, unknown>;
}

/**
 * Registra una acción sensible en la bitácora de auditoría. Nunca lanza: un
 * fallo al auditar no debe bloquear la acción real que se está registrando.
 */
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId,
      userName: params.userName ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId != null ? String(params.entityId) : null,
      metadata: params.metadata ?? null,
    });
  } catch (err) {
    console.error('[audit] No se pudo registrar la acción:', err);
  }
}
