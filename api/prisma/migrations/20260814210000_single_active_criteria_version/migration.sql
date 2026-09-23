-- Keep one active evaluation criteria version. Existing reviews retain their
-- foreign key to the exact version that was active when they were assigned.
WITH ranked_active AS (
  SELECT
    "id",
    row_number() OVER (
      ORDER BY "activatedAt" DESC NULLS LAST, "createdAt" DESC, "id"
    ) AS active_rank
  FROM "EvaluationCriteriaVersion"
  WHERE "status" = 'ACTIVE'
)
UPDATE "EvaluationCriteriaVersion" AS version
SET
  "status" = 'RETIRED',
  "retiredAt" = COALESCE(version."retiredAt", CURRENT_TIMESTAMP)
FROM ranked_active
WHERE version."id" = ranked_active."id"
  AND ranked_active.active_rank > 1;

CREATE UNIQUE INDEX "EvaluationCriteriaVersion_single_active"
ON "EvaluationCriteriaVersion" ("status")
WHERE "status" = 'ACTIVE';
