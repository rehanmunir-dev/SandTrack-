-- Insert CEO only if not exists
INSERT INTO users 
  (username, password_hash, role, full_name, is_active)
VALUES (
  'admin',
  '$2a$10$U3PpJ3uYONSsPB4MZ8.Qp.PU/2ZI2eM2G5XEtrvXHoxg8ddaQ27CG',
  'SUPER_ADMIN',
  'System Administrator',
  true
)
ON CONFLICT (username) DO NOTHING;
