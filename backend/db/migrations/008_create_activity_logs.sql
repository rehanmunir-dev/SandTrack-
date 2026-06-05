CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  actor_id INT REFERENCES users(id) ON DELETE SET NULL,
  actor_role VARCHAR(20),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(30),
  entity_id INT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
