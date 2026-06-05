CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  consignment_id INT REFERENCES consignments(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(10) NOT NULL CHECK (payment_method IN ('CASH', 'BANK')),
  receipt_image_url TEXT,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'FLAGGED')),
  submitted_by INT REFERENCES users(id) ON DELETE SET NULL,
  verified_by INT REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);
