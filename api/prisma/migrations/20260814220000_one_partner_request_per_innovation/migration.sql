-- A Partner may create only one collaboration request for an innovation,
-- regardless of request type or final status. Keep all legacy request rows,
-- but assign the permanent key to the earliest row for each pair.
ALTER TABLE "Engagement"
ADD COLUMN "requestKey" VARCHAR(80);

WITH first_requests AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "innovationId", "partnerId"
      ORDER BY "createdAt", "id"
    ) AS request_rank
  FROM "Engagement"
)
UPDATE "Engagement" AS engagement
SET "requestKey" = engagement."innovationId"::text || ':' || engagement."partnerId"::text
FROM first_requests
WHERE engagement."id" = first_requests."id"
  AND first_requests.request_rank = 1;

CREATE UNIQUE INDEX "Engagement_requestKey_key"
ON "Engagement" ("requestKey");
