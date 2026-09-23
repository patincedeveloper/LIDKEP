ALTER TABLE "UserProfile"
  ADD COLUMN "identificationType" TEXT,
  ADD COLUMN "identificationNumber" TEXT,
  ADD COLUMN "educationLevel" TEXT,
  ADD COLUMN "province" TEXT,
  ADD COLUMN "administrativeSector" TEXT,
  ADD COLUMN "occupation" TEXT,
  ADD COLUMN "yearsOfExperience" INTEGER,
  DROP COLUMN "biography";

ALTER TABLE "InnovationVersion"
  ADD COLUMN "impactArea" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "novelty" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "currentEvidence" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "implementationPlan" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "scalability" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "sustainability" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "supportingLinks" JSONB NOT NULL DEFAULT '[]'::jsonb;
