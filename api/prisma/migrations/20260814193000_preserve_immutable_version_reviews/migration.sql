ALTER TABLE "InnovationVersion"
DROP CONSTRAINT IF EXISTS "InnovationVersion_administratorReviewedById_fkey";

ALTER TABLE "InnovationVersion"
DROP COLUMN IF EXISTS "administratorReviewedAt",
DROP COLUMN IF EXISTS "administratorReviewedById";

CREATE TABLE "InnovationAdministratorReview" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "innovationId" UUID NOT NULL,
  "versionId" UUID NOT NULL,
  "reviewedById" UUID NOT NULL,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InnovationAdministratorReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InnovationAdministratorReview_innovationId_key"
ON "InnovationAdministratorReview"("innovationId");

CREATE UNIQUE INDEX "InnovationAdministratorReview_versionId_key"
ON "InnovationAdministratorReview"("versionId");

CREATE INDEX "InnovationAdministratorReview_reviewedById_reviewedAt_idx"
ON "InnovationAdministratorReview"("reviewedById", "reviewedAt");

ALTER TABLE "InnovationAdministratorReview"
ADD CONSTRAINT "InnovationAdministratorReview_innovationId_fkey"
FOREIGN KEY ("innovationId") REFERENCES "Innovation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InnovationAdministratorReview"
ADD CONSTRAINT "InnovationAdministratorReview_versionId_fkey"
FOREIGN KEY ("versionId") REFERENCES "InnovationVersion"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InnovationAdministratorReview"
ADD CONSTRAINT "InnovationAdministratorReview_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
