import { auditRepository } from '../repositories/audit.repository.js';

/**
 * Records a safe, append-only audit event. Callers performing workflow changes must
 * pass the Prisma transaction client so the state change and audit event commit together.
 */
export function recordAuditEvent(event, transaction) {
  return auditRepository.create(event, transaction);
}
