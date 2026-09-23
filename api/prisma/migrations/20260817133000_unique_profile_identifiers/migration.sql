-- Previous integration-test cleanup disabled foreign-key actions and left
-- unreachable profiles. They have no parent User and cannot belong to an account.
DELETE FROM "UserProfile" profile
WHERE NOT EXISTS (
  SELECT 1
  FROM "User" account
  WHERE account."id" = profile."userId"
);

-- Store identity values in one canonical form before enforcing uniqueness.
UPDATE "UserProfile"
SET "identificationNumber" = NULLIF(UPPER(TRIM("identificationNumber")), '')
WHERE "identificationNumber" IS NOT NULL;

UPDATE "UserProfile"
SET "privatePhone" = CASE
  WHEN NULLIF(REGEXP_REPLACE("privatePhone", '[^0-9]', '', 'g'), '') IS NULL THEN NULL
  WHEN REGEXP_REPLACE("privatePhone", '[^0-9]', '', 'g') LIKE '0%'
    THEN '+250' || SUBSTRING(REGEXP_REPLACE("privatePhone", '[^0-9]', '', 'g') FROM 2)
  ELSE '+' || REGEXP_REPLACE("privatePhone", '[^0-9]', '', 'g')
END
WHERE "privatePhone" IS NOT NULL;

CREATE UNIQUE INDEX "UserProfile_identificationNumber_key"
ON "UserProfile"("identificationNumber");

CREATE UNIQUE INDEX "UserProfile_privatePhone_key"
ON "UserProfile"("privatePhone");
