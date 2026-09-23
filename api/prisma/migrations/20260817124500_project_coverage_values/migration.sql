-- Project locality is now represented as one of six coverage levels.
-- Preserve existing innovations by mapping every former District name to District coverage.
ALTER TABLE "InnovationVersion"
DISABLE TRIGGER "InnovationVersion_immutable_update";

UPDATE "InnovationVersion"
SET "district" = 'District'
WHERE "district" NOT IN (
  'District',
  'Province',
  'National',
  'East Africa',
  'Africa',
  'International'
);

ALTER TABLE "InnovationVersion"
ENABLE TRIGGER "InnovationVersion_immutable_update";
