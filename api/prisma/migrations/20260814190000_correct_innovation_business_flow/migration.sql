ALTER TABLE "InnovationVersion"
ADD COLUMN "administratorReviewedAt" TIMESTAMP(3),
ADD COLUMN "administratorReviewedById" UUID;

ALTER TABLE "InnovationVersion"
ADD CONSTRAINT "InnovationVersion_administratorReviewedById_fkey"
FOREIGN KEY ("administratorReviewedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "Review_assignmentId_key";

CREATE UNIQUE INDEX "Review_assignmentId_versionId_key"
ON "Review"("assignmentId", "versionId");

-- The new flow publishes an Expert-approved version immediately. Normalize
-- legacy records that were waiting in the old intermediate states.
UPDATE "Innovation" AS innovation
SET
  "publishedVersionId" = COALESCE(
    innovation."publishedVersionId",
    (
      SELECT version."id"
      FROM "InnovationVersion" AS version
      WHERE version."innovationId" = innovation."id"
        AND version."immutableAt" IS NOT NULL
      ORDER BY version."versionNumber" DESC
      LIMIT 1
    )
  ),
  "publishedAt" = COALESCE(innovation."publishedAt", CURRENT_TIMESTAMP),
  "status" = 'PUBLISHED'
WHERE innovation."status" IN ('RECOMMENDED', 'APPROVED')
  AND COALESCE(
    innovation."publishedVersionId",
    (
      SELECT version."id"
      FROM "InnovationVersion" AS version
      WHERE version."innovationId" = innovation."id"
        AND version."immutableAt" IS NOT NULL
      ORDER BY version."versionNumber" DESC
      LIMIT 1
    )
  ) IS NOT NULL;

UPDATE "Innovation"
SET "status" = 'SUBMITTED'
WHERE "status" IN ('RECOMMENDED', 'APPROVED');

UPDATE "Innovation"
SET "status" = 'ARCHIVED', "archivedAt" = COALESCE("archivedAt", CURRENT_TIMESTAMP)
WHERE "status" = 'REJECTED';
