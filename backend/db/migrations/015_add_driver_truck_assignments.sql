ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS assigned_truck_id INT REFERENCES trucks(id) ON DELETE SET NULL;

ALTER TABLE trucks
  ADD COLUMN IF NOT EXISTS assigned_driver_id INT REFERENCES drivers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_drivers_assigned_truck_id
  ON drivers(assigned_truck_id);

CREATE INDEX IF NOT EXISTS idx_trucks_assigned_driver_id
  ON trucks(assigned_driver_id);
