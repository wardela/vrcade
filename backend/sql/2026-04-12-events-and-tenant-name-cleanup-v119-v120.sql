BEGIN;

ALTER TABLE tenant_v_119.events
  ADD COLUMN IF NOT EXISTS status TEXT;

UPDATE tenant_v_119.events
SET status = CASE
  WHEN LOWER(BTRIM(COALESCE(status, ''))) = 'closed' THEN 'ended'
  WHEN LOWER(BTRIM(COALESCE(status, ''))) = 'ended' THEN 'ended'
  ELSE 'open'
END
WHERE status IS NULL
   OR BTRIM(status) = ''
   OR LOWER(BTRIM(status)) = 'closed';

ALTER TABLE tenant_v_119.events
  ALTER COLUMN status SET DEFAULT 'open';

ALTER TABLE tenant_v_119.events
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE tenant_v_119.events
  DROP CONSTRAINT IF EXISTS tenant_v_119_events_status_check;

ALTER TABLE tenant_v_119.events
  ADD CONSTRAINT tenant_v_119_events_status_check
  CHECK (status IN ('open', 'ended'));

ALTER TABLE tenant_v_119.event_payments
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);

UPDATE tenant_v_119.event_payments
SET payment_method = CASE
  WHEN LOWER(BTRIM(COALESCE(payment_method, ''))) IN ('cash', 'card', 'transfer')
    THEN LOWER(BTRIM(payment_method))
  WHEN LOWER(BTRIM(COALESCE(payment_type, ''))) IN ('cash', 'card', 'transfer')
    THEN LOWER(BTRIM(payment_type))
  ELSE 'cash'
END
WHERE payment_method IS NULL
   OR BTRIM(payment_method) = '';

ALTER TABLE tenant_v_119.event_payments
  ALTER COLUMN payment_method SET DEFAULT 'cash';

ALTER TABLE tenant_v_119.event_payments
  ALTER COLUMN payment_method SET NOT NULL;

ALTER TABLE tenant_v_119.event_payments
  DROP CONSTRAINT IF EXISTS tenant_v_119_event_payments_payment_method_check;

ALTER TABLE tenant_v_119.event_payments
  ADD CONSTRAINT tenant_v_119_event_payments_payment_method_check
  CHECK (payment_method IN ('cash', 'card', 'transfer'));

CREATE INDEX IF NOT EXISTS tenant_v_119_events_status_event_date_idx
  ON tenant_v_119.events (status, event_date DESC, id DESC);

CREATE INDEX IF NOT EXISTS tenant_v_119_event_payments_event_id_payment_method_idx
  ON tenant_v_119.event_payments (event_id, payment_method, payment_date, id);

ALTER TABLE tenant_v120.events
  ADD COLUMN IF NOT EXISTS status TEXT;

UPDATE tenant_v120.events
SET status = CASE
  WHEN LOWER(BTRIM(COALESCE(status, ''))) = 'closed' THEN 'ended'
  WHEN LOWER(BTRIM(COALESCE(status, ''))) = 'ended' THEN 'ended'
  ELSE 'open'
END
WHERE status IS NULL
   OR BTRIM(status) = ''
   OR LOWER(BTRIM(status)) = 'closed';

ALTER TABLE tenant_v120.events
  ALTER COLUMN status SET DEFAULT 'open';

ALTER TABLE tenant_v120.events
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE tenant_v120.events
  DROP CONSTRAINT IF EXISTS tenant_v120_events_status_check;

ALTER TABLE tenant_v120.events
  DROP CONSTRAINT IF EXISTS tenant_v_119_events_status_check;

ALTER TABLE tenant_v120.events
  ADD CONSTRAINT tenant_v120_events_status_check
  CHECK (status IN ('open', 'ended'));

ALTER TABLE tenant_v120.event_payments
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);

UPDATE tenant_v120.event_payments
SET payment_method = CASE
  WHEN LOWER(BTRIM(COALESCE(payment_method, ''))) IN ('cash', 'card', 'transfer')
    THEN LOWER(BTRIM(payment_method))
  WHEN LOWER(BTRIM(COALESCE(payment_type, ''))) IN ('cash', 'card', 'transfer')
    THEN LOWER(BTRIM(payment_type))
  ELSE 'cash'
END
WHERE payment_method IS NULL
   OR BTRIM(payment_method) = '';

ALTER TABLE tenant_v120.event_payments
  ALTER COLUMN payment_method SET DEFAULT 'cash';

ALTER TABLE tenant_v120.event_payments
  ALTER COLUMN payment_method SET NOT NULL;

ALTER TABLE tenant_v120.event_payments
  DROP CONSTRAINT IF EXISTS tenant_v120_event_payments_payment_method_check;

ALTER TABLE tenant_v120.event_payments
  DROP CONSTRAINT IF EXISTS tenant_v_119_event_payments_payment_method_check;

ALTER TABLE tenant_v120.event_payments
  ADD CONSTRAINT tenant_v120_event_payments_payment_method_check
  CHECK (payment_method IN ('cash', 'card', 'transfer'));

CREATE INDEX IF NOT EXISTS tenant_v120_events_status_event_date_idx
  ON tenant_v120.events (status, event_date DESC, id DESC);

CREATE INDEX IF NOT EXISTS tenant_v120_event_payments_event_id_payment_method_idx
  ON tenant_v120.event_payments (event_id, payment_method, payment_date, id);

DROP TRIGGER IF EXISTS tenant_v_119_categories_prevent_locked_mutation
  ON tenant_v120.categories;

DROP TRIGGER IF EXISTS tenant_v120_categories_prevent_locked_mutation
  ON tenant_v120.categories;

CREATE TRIGGER tenant_v120_categories_prevent_locked_mutation
BEFORE UPDATE OR DELETE ON tenant_v120.categories
FOR EACH ROW
EXECUTE FUNCTION tenant_v120.prevent_locked_category_mutation();

DROP TRIGGER IF EXISTS tenant_v_119_items_prevent_locked_mutation
  ON tenant_v120.items;

DROP TRIGGER IF EXISTS tenant_v120_items_prevent_locked_mutation
  ON tenant_v120.items;

CREATE TRIGGER tenant_v120_items_prevent_locked_mutation
BEFORE UPDATE OR DELETE ON tenant_v120.items
FOR EACH ROW
EXECUTE FUNCTION tenant_v120.prevent_locked_item_mutation();

COMMIT;
