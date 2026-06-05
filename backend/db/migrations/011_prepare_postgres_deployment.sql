ALTER TABLE consignments
ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) DEFAULT 0;

ALTER TABLE consignments
ADD COLUMN IF NOT EXISTS discount DECIMAL(12,2) DEFAULT 0;

ALTER TABLE consignments
ALTER COLUMN status SET DEFAULT 'SCAN_PENDING';

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'consignments'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE consignments DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE consignments
ADD CONSTRAINT consignments_status_check
CHECK (status IN ('SCAN_PENDING', 'IN_TRANSIT', 'ARRIVED', 'DELIVERY_PENDING_VERIFICATION', 'DELIVERED', 'BILLED', 'CLOSED', 'FLAGGED', 'CANCELLED'));
