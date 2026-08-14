ALTER TABLE "ExpertAssignment" ADD COLUMN "innovationId" UUID;

UPDATE "ExpertAssignment" AS assignment
SET "innovationId" = version."innovationId"
FROM "InnovationVersion" AS version
WHERE assignment."versionId" = version."id";

ALTER TABLE "ExpertAssignment" ALTER COLUMN "innovationId" SET NOT NULL;

CREATE UNIQUE INDEX "ExpertAssignment_innovationId_key"
ON "ExpertAssignment"("innovationId");

ALTER TABLE "ExpertAssignment"
ADD CONSTRAINT "ExpertAssignment_innovationId_fkey"
FOREIGN KEY ("innovationId") REFERENCES "Innovation"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
