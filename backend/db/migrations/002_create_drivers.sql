CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  cnic VARCHAR(15) UNIQUE NOT NULL,
  license_number VARCHAR(30) UNIQUE,
  face_photo_url TEXT,
  is_approved BOOLEAN DEFAULT false,
  approved_by INT REFERENCES users(id) ON DELETE SET NULL,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  flagged_by INT REFERENCES users(id) ON DELETE SET NULL,
  flagged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
