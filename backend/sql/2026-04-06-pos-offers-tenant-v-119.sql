BEGIN;

ALTER TABLE tenant_v_119.items
  ADD COLUMN IF NOT EXISTS is_offer_item BOOLEAN;

ALTER TABLE tenant_v_119.items
  ADD COLUMN IF NOT EXISTS offer_is_active BOOLEAN;

ALTER TABLE tenant_v_119.items
  ADD COLUMN IF NOT EXISTS offer_is_24_7 BOOLEAN;

ALTER TABLE tenant_v_119.items
  ADD COLUMN IF NOT EXISTS offer_start_time TIME;

ALTER TABLE tenant_v_119.items
  ADD COLUMN IF NOT EXISTS offer_end_time TIME;

ALTER TABLE tenant_v_119.items
  ADD COLUMN IF NOT EXISTS offer_start_date DATE;

ALTER TABLE tenant_v_119.items
  ADD COLUMN IF NOT EXISTS offer_end_date DATE;

UPDATE tenant_v_119.items
SET
  is_offer_item = COALESCE(is_offer_item, false),
  offer_is_active = COALESCE(offer_is_active, false),
  offer_is_24_7 = COALESCE(offer_is_24_7, true)
WHERE is_offer_item IS NULL
   OR offer_is_active IS NULL
   OR offer_is_24_7 IS NULL;

UPDATE tenant_v_119.items
SET
  offer_is_active = false,
  offer_is_24_7 = true,
  offer_start_time = NULL,
  offer_end_time = NULL,
  offer_start_date = NULL,
  offer_end_date = NULL
WHERE COALESCE(is_offer_item, false) = false;

ALTER TABLE tenant_v_119.items
  ALTER COLUMN is_offer_item SET DEFAULT false;

ALTER TABLE tenant_v_119.items
  ALTER COLUMN offer_is_active SET DEFAULT false;

ALTER TABLE tenant_v_119.items
  ALTER COLUMN offer_is_24_7 SET DEFAULT true;

ALTER TABLE tenant_v_119.items
  ALTER COLUMN is_offer_item SET NOT NULL;

ALTER TABLE tenant_v_119.items
  ALTER COLUMN offer_is_active SET NOT NULL;

ALTER TABLE tenant_v_119.items
  ALTER COLUMN offer_is_24_7 SET NOT NULL;

ALTER TABLE tenant_v_119.items
  DROP CONSTRAINT IF EXISTS items_offer_date_range_check;

ALTER TABLE tenant_v_119.items
  ADD CONSTRAINT items_offer_date_range_check
  CHECK (
    offer_start_date IS NULL
    OR offer_end_date IS NULL
    OR offer_end_date >= offer_start_date
  ) NOT VALID;

ALTER TABLE tenant_v_119.items
  VALIDATE CONSTRAINT items_offer_date_range_check;

ALTER TABLE tenant_v_119.items
  DROP CONSTRAINT IF EXISTS items_offer_time_pair_check;

ALTER TABLE tenant_v_119.items
  ADD CONSTRAINT items_offer_time_pair_check
  CHECK (
    offer_is_24_7 = true
    OR (
      (offer_start_time IS NULL AND offer_end_time IS NULL)
      OR (offer_start_time IS NOT NULL AND offer_end_time IS NOT NULL)
    )
  ) NOT VALID;

ALTER TABLE tenant_v_119.items
  VALIDATE CONSTRAINT items_offer_time_pair_check;

ALTER TABLE tenant_v_119.items
  DROP CONSTRAINT IF EXISTS items_offer_time_order_check;

ALTER TABLE tenant_v_119.items
  ADD CONSTRAINT items_offer_time_order_check
  CHECK (
    offer_is_24_7 = true
    OR offer_start_time IS NULL
    OR offer_end_time IS NULL
    OR offer_end_time > offer_start_time
  ) NOT VALID;

ALTER TABLE tenant_v_119.items
  VALIDATE CONSTRAINT items_offer_time_order_check;

CREATE INDEX IF NOT EXISTS tenant_v_119_items_offer_visibility_idx
  ON tenant_v_119.items (category, is_offer_item, offer_is_active, offer_start_date, offer_end_date);

COMMIT;
