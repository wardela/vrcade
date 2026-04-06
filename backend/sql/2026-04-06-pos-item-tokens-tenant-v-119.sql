BEGIN;

ALTER TABLE tenant_v_119.items
  ADD COLUMN IF NOT EXISTS has_tokens BOOLEAN;

ALTER TABLE tenant_v_119.items
  ADD COLUMN IF NOT EXISTS token_count INTEGER;

UPDATE tenant_v_119.items
SET
  has_tokens = COALESCE(has_tokens, false),
  token_count = CASE
    WHEN COALESCE(has_tokens, false) THEN COALESCE(token_count, 0)
    ELSE 0
  END
WHERE has_tokens IS NULL
   OR token_count IS NULL;

UPDATE tenant_v_119.items
SET token_count = 0
WHERE COALESCE(has_tokens, false) = false
  AND COALESCE(token_count, 0) <> 0;

ALTER TABLE tenant_v_119.items
  ALTER COLUMN has_tokens SET DEFAULT false;

ALTER TABLE tenant_v_119.items
  ALTER COLUMN token_count SET DEFAULT 0;

ALTER TABLE tenant_v_119.items
  ALTER COLUMN has_tokens SET NOT NULL;

ALTER TABLE tenant_v_119.items
  ALTER COLUMN token_count SET NOT NULL;

ALTER TABLE tenant_v_119.items
  DROP CONSTRAINT IF EXISTS items_token_config_check;

ALTER TABLE tenant_v_119.items
  ADD CONSTRAINT items_token_config_check
  CHECK (
    (has_tokens = false AND token_count = 0)
    OR (has_tokens = true AND token_count > 0)
  ) NOT VALID;

ALTER TABLE tenant_v_119.items
  VALIDATE CONSTRAINT items_token_config_check;

CREATE INDEX IF NOT EXISTS tenant_v_119_invoice_header_session_id_idx
  ON tenant_v_119.invoice_header (session_id);

CREATE INDEX IF NOT EXISTS tenant_v_119_invoice_lines_invoice_number_item_id_idx
  ON tenant_v_119.invoice_lines (invoice_number, item_id);

COMMIT;
