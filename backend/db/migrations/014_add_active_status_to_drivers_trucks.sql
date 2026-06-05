ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE trucks
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';

UPDATE drivers SET is_active = true WHERE is_active IS NULL;
UPDATE trucks SET status = 'ACTIVE' WHERE status IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'trucks'
      AND constraint_name = 'trucks_status_check'
  ) THEN
    ALTER TABLE trucks
      ADD CONSTRAINT trucks_status_check
      CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'STANDBY'));
  END IF;
END $$;
