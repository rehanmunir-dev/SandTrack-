CREATE TABLE IF NOT EXISTS gate_logs (
  id SERIAL PRIMARY KEY,
  consignment_id INT REFERENCES consignments(id) ON DELETE CASCADE,
  watchman_id INT REFERENCES users(id) ON DELETE SET NULL,
  qr_token_used VARCHAR(255),
  scan_result VARCHAR(20) NOT NULL CHECK (scan_result IN ('CLEARED', 'REJECTED', 'EXPIRED')),
  notes TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);
