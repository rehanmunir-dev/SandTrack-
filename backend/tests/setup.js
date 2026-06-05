import fs from 'fs'
import path from 'path'
import pool from '../db/pool.js'

let schemaReady = false

function assertTestDatabase() {
  const rawUrl = process.env.DATABASE_URL || ''
  const dbName = rawUrl ? decodeURIComponent(new URL(rawUrl).pathname.replace(/^\//, '')) : ''
  const allowReset = process.env.ALLOW_NON_TEST_DB_RESET === 'true'

  if (!allowReset && !dbName.toLowerCase().includes('test')) {
    throw new Error(
      `Refusing to reset database "${dbName || '(missing)'}". Use a dedicated test database or set ALLOW_NON_TEST_DB_RESET=true.`
    )
  }
}

async function ensureSchema() {
  if (schemaReady) return

  const migrationsDir = path.join(process.cwd(), 'db', 'migrations')
  const files = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
    await pool.query(sql)
  }

  schemaReady = true
}

export async function clearDatabase() {
  assertTestDatabase()
  await ensureSchema()

  await pool.query(`
    TRUNCATE TABLE
      activity_logs,
      gate_logs,
      expenses,
      payments,
      consignments,
      trucks,
      drivers,
      users
    RESTART IDENTITY CASCADE;
  `)
}

export async function seedUsers() {
  await ensureSchema()

  await pool.query(`
    INSERT INTO users (username, password_hash, role, full_name, phone, is_active)
    VALUES
      ('admin', '$2a$10$h90VQxGMT3iy5BaUdE29H.DLfrg2GizK7LFvl9hLJgCUXXwMWT9j.', 'SUPER_ADMIN', 'CEO / Owner', '+923001234567', true),
      ('operator', '$2a$10$zAHYw0NlzOtOQNEgjOH3auc/15pJfCMg/CMdKmJySIOlu.RVCtJpe.', 'OPERATOR', 'Terminal Operator', '+923007654321', true),
      ('driver', '$2a$10$JbLvt8XNyTuwOQY/dbDunelz7mJm/8vD4hD2pSWbizpVf/Zlf61PS', 'DRIVER', 'Hassan Riaz', '+923001112223', true),
      ('watchman', '$2a$10$17f81S8wrCLMe0fhgvYOCukEmjQg4pV.xprSLasmEvNKFt3WNd8fW', 'WATCHMAN', 'Farhan Ahmed', '+923004445556', true),
      ('accountant', '$2a$10$XpQWtgFlsnlVbVM3Ah2rRO0/QujTYo2Zr8IWbAmZjhzKyV.c37ODO', 'ACCOUNTANT', 'Office Accountant', '+923007778889', true)
    ON CONFLICT (username) DO NOTHING;
  `)
}

export async function closeDatabaseConnection() {
  await pool.end()
}
