DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'consignments'
      AND constraint_name = 'consignments_status_check'
  ) THEN
    ALTER TABLE consignments DROP CONSTRAINT consignments_status_check;
  END IF;
END $$;

ALTER TABLE consignments
  ALTER COLUMN status TYPE VARCHAR(40),
  ALTER COLUMN status SET DEFAULT 'SCAN_PENDING';

UPDATE consignments SET status = 'SCAN_PENDING' WHERE status = 'PENDING';
UPDATE consignments SET status = 'IN_TRANSIT' WHERE status = 'GATE_CLEARED';

ALTER TABLE consignments
  ADD CONSTRAINT consignments_status_check
  CHECK (status IN ('SCAN_PENDING', 'IN_TRANSIT', 'ARRIVED', 'DELIVERY_PENDING_VERIFICATION', 'DELIVERED', 'BILLED', 'CLOSED', 'FLAGGED', 'CANCELLED'));

ALTER TABLE consignments
  ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_verified_by INT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS ledger_entries (
  id SERIAL PRIMARY KEY,
  consignment_id INT REFERENCES consignments(id) ON DELETE CASCADE,
  payment_id INT REFERENCES payments(id) ON DELETE SET NULL,
  entry_type VARCHAR(40) NOT NULL,
  debit NUMERIC(12,2) DEFAULT 0,
  credit NUMERIC(12,2) DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'VERIFIED', 'CLOSED', 'FLAGGED')),
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  verified_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_consignment_id ON ledger_entries(consignment_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_payment_id ON ledger_entries(payment_id);
CREATE INDEX IF NOT EXISTS idx_consignments_status ON consignments(status);
CREATE INDEX IF NOT EXISTS idx_consignments_qr_token ON consignments(qr_token);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
