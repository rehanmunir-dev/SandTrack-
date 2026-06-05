CREATE TABLE IF NOT EXISTS trucks (
  id SERIAL PRIMARY KEY,
  registration_number VARCHAR(20) UNIQUE NOT NULL,
  vehicle_type VARCHAR(20) CHECK (vehicle_type IN ('Damper', 'Truck', 'Mazda', 'Suzuki')),
  wheel_count INT CHECK (wheel_count IN (8, 14, 16, 18, 20, 22)),
  owner_name VARCHAR(100),
  is_approved BOOLEAN DEFAULT false,
  approved_by INT REFERENCES users(id) ON DELETE SET NULL,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  flagged_by INT REFERENCES users(id) ON DELETE SET NULL,
  flagged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
