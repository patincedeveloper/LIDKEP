-- Submitted versions remain immutable while their parent innovation exists.
-- When the parent innovation is deleted, its versions must be allowed to follow
-- the InnovationVersion_innovationId_fkey ON DELETE CASCADE relationship.
CREATE OR REPLACE FUNCTION prevent_immutable_innovation_version_change()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD."immutableAt" IS NOT NULL
       AND EXISTS (
         SELECT 1
         FROM "Innovation"
         WHERE "id" = OLD."innovationId"
       ) THEN
      RAISE EXCEPTION 'submitted innovation versions are immutable';
    END IF;

    RETURN OLD;
  END IF;

  IF OLD."immutableAt" IS NOT NULL THEN
    RAISE EXCEPTION 'submitted innovation versions are immutable';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
