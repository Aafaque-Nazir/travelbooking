-- FIXED MIGRATION SCRIPT
-- The previous script failed because Postgres doesn't allow subqueries in the 'USING' clause of ALTER TABLE.
-- We will use a safer "Add -> Update -> Swap" method.

-- 1. Create temporary new columns
ALTER TABLE routes ADD COLUMN bp_new jsonb DEFAULT '[]';
ALTER TABLE routes ADD COLUMN dp_new jsonb DEFAULT '[]';

-- 2. Migrate the data (UPDATE allows subqueries)
UPDATE routes
SET bp_new = COALESCE(
  (
    SELECT jsonb_agg(jsonb_build_object('name', elem, 'price', 0))
    FROM jsonb_array_elements_text(to_jsonb(boarding_points)) AS elem
  ),
  '[]'::jsonb
);

UPDATE routes
SET dp_new = COALESCE(
  (
    SELECT jsonb_agg(jsonb_build_object('name', elem, 'price', 0))
    FROM jsonb_array_elements_text(to_jsonb(dropping_points)) AS elem
  ),
  '[]'::jsonb
);

-- 3. Drop old columns and rename new ones
ALTER TABLE routes DROP COLUMN boarding_points;
ALTER TABLE routes DROP COLUMN dropping_points;

ALTER TABLE routes RENAME COLUMN bp_new TO boarding_points;
ALTER TABLE routes RENAME COLUMN dp_new TO dropping_points;

-- 4. Verify
SELECT * FROM routes LIMIT 5;
