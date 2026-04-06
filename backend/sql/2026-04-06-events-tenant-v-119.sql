BEGIN;

ALTER TABLE tenant_v_119.categories
  ADD COLUMN IF NOT EXISTS is_system_locked BOOLEAN;

ALTER TABLE tenant_v_119.categories
  ALTER COLUMN is_system_locked SET DEFAULT false;

UPDATE tenant_v_119.categories
SET is_system_locked = false
WHERE is_system_locked IS NULL;

ALTER TABLE tenant_v_119.categories
  ALTER COLUMN is_system_locked SET NOT NULL;

ALTER TABLE tenant_v_119.items
  ADD COLUMN IF NOT EXISTS is_system_locked BOOLEAN;

ALTER TABLE tenant_v_119.items
  ALTER COLUMN is_system_locked SET DEFAULT false;

UPDATE tenant_v_119.items
SET is_system_locked = false
WHERE is_system_locked IS NULL;

ALTER TABLE tenant_v_119.items
  ALTER COLUMN is_system_locked SET NOT NULL;

CREATE TABLE IF NOT EXISTS tenant_v_119.events (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  client_id BIGINT NOT NULL REFERENCES tenant_v_119.clients(id),
  details TEXT,
  notes TEXT,
  total_amount NUMERIC(12, 3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tenant_v_119.events
  DROP CONSTRAINT IF EXISTS tenant_v_119_events_total_amount_positive_check;

ALTER TABLE tenant_v_119.events
  ADD CONSTRAINT tenant_v_119_events_total_amount_positive_check
  CHECK (total_amount > 0);

CREATE TABLE IF NOT EXISTS tenant_v_119.event_payments (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES tenant_v_119.events(id) ON DELETE CASCADE,
  amount NUMERIC(12, 3) NOT NULL,
  payment_date DATE NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'initial',
  invoice_id BIGINT REFERENCES tenant_v_119.invoice_header(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tenant_v_119.event_payments
  DROP CONSTRAINT IF EXISTS tenant_v_119_event_payments_amount_positive_check;

ALTER TABLE tenant_v_119.event_payments
  ADD CONSTRAINT tenant_v_119_event_payments_amount_positive_check
  CHECK (amount > 0);

CREATE INDEX IF NOT EXISTS tenant_v_119_events_event_date_idx
  ON tenant_v_119.events (event_date DESC, id DESC);

CREATE INDEX IF NOT EXISTS tenant_v_119_events_client_id_idx
  ON tenant_v_119.events (client_id);

CREATE INDEX IF NOT EXISTS tenant_v_119_event_payments_event_id_payment_date_idx
  ON tenant_v_119.event_payments (event_id, payment_date, id);

CREATE INDEX IF NOT EXISTS tenant_v_119_event_payments_invoice_id_idx
  ON tenant_v_119.event_payments (invoice_id);

WITH existing_category AS (
  SELECT tenant_v_119.categories.id
  FROM tenant_v_119.categories
  WHERE LOWER(BTRIM(tenant_v_119.categories.name)) = LOWER('Events')
  ORDER BY tenant_v_119.categories.id ASC
  LIMIT 1
),
inserted_category AS (
  INSERT INTO tenant_v_119.categories (name, is_system_locked)
  SELECT 'Events', true
  WHERE NOT EXISTS (SELECT 1 FROM existing_category)
  RETURNING tenant_v_119.categories.id
),
chosen_category AS (
  SELECT existing_category.id FROM existing_category
  UNION ALL
  SELECT inserted_category.id FROM inserted_category
)
UPDATE tenant_v_119.categories
SET is_system_locked = true
WHERE tenant_v_119.categories.id IN (SELECT chosen_category.id FROM chosen_category)
  AND tenant_v_119.categories.is_system_locked = false;

WITH chosen_category AS (
  SELECT tenant_v_119.categories.id
  FROM tenant_v_119.categories
  WHERE LOWER(BTRIM(tenant_v_119.categories.name)) = LOWER('Events')
  ORDER BY tenant_v_119.categories.id ASC
  LIMIT 1
),
default_unit AS (
  SELECT tenant_v_119.units.id
  FROM tenant_v_119.units
  ORDER BY tenant_v_119.units.id ASC
  LIMIT 1
),
existing_item AS (
  SELECT tenant_v_119.items.id
  FROM tenant_v_119.items
  INNER JOIN chosen_category
    ON chosen_category.id = tenant_v_119.items.category
  WHERE LOWER(BTRIM(tenant_v_119.items.name)) = LOWER('Payment for Event')
  ORDER BY tenant_v_119.items.id ASC
  LIMIT 1
),
inserted_item AS (
  INSERT INTO tenant_v_119.items (
    code,
    name,
    price_with_tax,
    tax_percentage,
    category,
    fav,
    unit,
    minimum_qty_alert,
    stock_qty,
    usual_discount_percentage,
    usual_sales_qty,
    notes,
    is_stocked,
    default_storage_id,
    has_tokens,
    token_count,
    is_offer_item,
    offer_is_active,
    offer_is_24_7,
    offer_start_time,
    offer_end_time,
    offer_start_date,
    offer_end_date,
    is_system_locked
  )
  SELECT
    'SYS-EVENT-PAY',
    'Payment for Event',
    0,
    16,
    chosen_category.id,
    false,
    default_unit.id,
    0,
    0,
    0,
    1,
    'System item used automatically for event payment invoices',
    false,
    NULL,
    false,
    0,
    false,
    false,
    true,
    NULL,
    NULL,
    NULL,
    NULL,
    true
  FROM chosen_category
  CROSS JOIN default_unit
  WHERE NOT EXISTS (SELECT 1 FROM existing_item)
  RETURNING tenant_v_119.items.id
),
chosen_item AS (
  SELECT existing_item.id FROM existing_item
  UNION ALL
  SELECT inserted_item.id FROM inserted_item
)
UPDATE tenant_v_119.items
SET code = 'SYS-EVENT-PAY',
    name = 'Payment for Event',
    price_with_tax = 0,
    tax_percentage = 16,
    category = (
      SELECT chosen_category.id
      FROM (
        SELECT tenant_v_119.categories.id
        FROM tenant_v_119.categories
        WHERE LOWER(BTRIM(tenant_v_119.categories.name)) = LOWER('Events')
        ORDER BY tenant_v_119.categories.id ASC
        LIMIT 1
      ) AS chosen_category
    ),
    fav = false,
    minimum_qty_alert = 0,
    stock_qty = 0,
    usual_discount_percentage = 0,
    usual_sales_qty = 1,
    notes = 'System item used automatically for event payment invoices',
    is_stocked = false,
    default_storage_id = NULL,
    has_tokens = false,
    token_count = 0,
    is_offer_item = false,
    offer_is_active = false,
    offer_is_24_7 = true,
    offer_start_time = NULL,
    offer_end_time = NULL,
    offer_start_date = NULL,
    offer_end_date = NULL,
    is_system_locked = true
WHERE tenant_v_119.items.id IN (SELECT chosen_item.id FROM chosen_item)
  AND tenant_v_119.items.is_system_locked = false;

CREATE OR REPLACE FUNCTION tenant_v_119.prevent_locked_category_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_system_locked THEN
    RAISE EXCEPTION 'System-required category "%" cannot be changed or deleted.', OLD.name;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS tenant_v_119_categories_prevent_locked_mutation
ON tenant_v_119.categories;

CREATE TRIGGER tenant_v_119_categories_prevent_locked_mutation
BEFORE UPDATE OR DELETE ON tenant_v_119.categories
FOR EACH ROW
WHEN (OLD.is_system_locked = true)
EXECUTE FUNCTION tenant_v_119.prevent_locked_category_mutation();

CREATE OR REPLACE FUNCTION tenant_v_119.prevent_locked_item_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_system_locked THEN
    RAISE EXCEPTION 'System-required item "%" cannot be changed or deleted.', OLD.name;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS tenant_v_119_items_prevent_locked_mutation
ON tenant_v_119.items;

CREATE TRIGGER tenant_v_119_items_prevent_locked_mutation
BEFORE UPDATE OR DELETE ON tenant_v_119.items
FOR EACH ROW
WHEN (OLD.is_system_locked = true)
EXECUTE FUNCTION tenant_v_119.prevent_locked_item_mutation();

COMMIT;
