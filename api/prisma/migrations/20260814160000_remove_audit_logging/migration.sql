ALTER TABLE "VerificationRequest"
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedById" UUID;

DO $$
BEGIN
  IF to_regclass('"AuditLog"') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS "AuditLog_append_only" ON "AuditLog";
  END IF;
END $$;

DROP FUNCTION IF EXISTS prevent_audit_log_change();
DROP TABLE IF EXISTS "AuditLog";
