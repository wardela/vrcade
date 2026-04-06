CREATE TABLE IF NOT EXISTS dev_sales.invoice_payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES dev_sales.invoice_header(id) ON DELETE CASCADE,
  session_id INTEGER NULL REFERENCES dev_sales.pos_sessions(id) ON DELETE SET NULL,
  user_id INTEGER NULL REFERENCES dev_sales.users(id) ON DELETE SET NULL,
  payment_method VARCHAR(20) NOT NULL,
  amount NUMERIC(18,3) NOT NULL,
  amount_paid NUMERIC(18,3) NULL,
  change_amount NUMERIC(18,3) NULL,
  payment_order INTEGER NOT NULL DEFAULT 1,
  reference_note TEXT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT invoice_payments_method_check CHECK (payment_method IN ('cash', 'card', 'transfer')),
  CONSTRAINT invoice_payments_amount_check CHECK (amount > 0),
  CONSTRAINT invoice_payments_amount_paid_check CHECK (amount_paid IS NULL OR amount_paid >= 0),
  CONSTRAINT invoice_payments_change_amount_check CHECK (change_amount IS NULL OR change_amount >= 0),
  CONSTRAINT invoice_payments_order_check CHECK (payment_order BETWEEN 1 AND 2),
  CONSTRAINT invoice_payments_cash_fields_check CHECK (
    (payment_method = 'cash' AND amount_paid IS NOT NULL AND change_amount IS NOT NULL)
    OR
    (payment_method IN ('card', 'transfer') AND amount_paid IS NULL AND change_amount IS NULL)
  ),
  CONSTRAINT invoice_payments_invoice_order_unique UNIQUE (invoice_id, payment_order)
);

CREATE INDEX IF NOT EXISTS dev_sales_invoice_payments_invoice_id_idx
  ON dev_sales.invoice_payments (invoice_id);

CREATE INDEX IF NOT EXISTS dev_sales_invoice_payments_session_id_idx
  ON dev_sales.invoice_payments (session_id);

CREATE INDEX IF NOT EXISTS dev_sales_invoice_payments_user_id_idx
  ON dev_sales.invoice_payments (user_id);

CREATE INDEX IF NOT EXISTS dev_sales_invoice_payments_method_idx
  ON dev_sales.invoice_payments (payment_method);

CREATE TABLE IF NOT EXISTS dev_sales.pos_invoice_requests (
  id SERIAL PRIMARY KEY,
  idempotency_key VARCHAR(120) NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES dev_sales.users(id) ON DELETE RESTRICT,
  session_id INTEGER NULL REFERENCES dev_sales.pos_sessions(id) ON DELETE SET NULL,
  invoice_id INTEGER NULL REFERENCES dev_sales.invoice_header(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dev_sales_pos_invoice_requests_user_id_idx
  ON dev_sales.pos_invoice_requests (user_id);

CREATE INDEX IF NOT EXISTS dev_sales_pos_invoice_requests_session_id_idx
  ON dev_sales.pos_invoice_requests (session_id);

CREATE INDEX IF NOT EXISTS dev_sales_pos_invoice_requests_invoice_id_idx
  ON dev_sales.pos_invoice_requests (invoice_id);
