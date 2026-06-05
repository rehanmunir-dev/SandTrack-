import pool from './pool.js'
import bcrypt from 'bcryptjs'

// DEV-ONLY DANGER ZONE:
// This script wipes operational records. It must never run in production and
// requires an explicit opt-in flag even in development.
if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to run database reset in production.')
}

if (process.env.ALLOW_DB_RESET !== 'true') {
  throw new Error('Refusing to run database reset. Set ALLOW_DB_RESET=true to continue.')
}

async function resetSystem() {
  console.log('[SANDTRACK DATABASE RESET] Starting full system wipe...')
  try {
    // 1. Truncate all transaction tables
    await pool.query(
      `TRUNCATE TABLE activity_logs, gate_logs, expenses, payments, consignments, trucks, drivers RESTART IDENTITY CASCADE`
    )
    console.log('[1/3] Transactional tables truncated successfully.')

    // 2. Clear out all non-admin users
    await pool.query(
      `DELETE FROM users WHERE role != 'SUPER_ADMIN'`
    )
    console.log('[2/3] All non-admin user accounts removed.')

    // 3. Ensure base admin exists
    try {
      const adminPasswordHash = bcrypt.hashSync('admin', 10)
      await pool.query(
        `INSERT INTO users (username, password_hash, role, full_name, is_active)
         VALUES ('admin', $1, 'SUPER_ADMIN', 'CEO / Owner', true)`,
        [adminPasswordHash]
      )
      console.log('[3/3] Root CEO / Admin credentials verified.')
    } catch (dbErr) {
      if (dbErr.message.includes('Duplicate username') || dbErr.code === '23505') {
        console.log('[3/3] Root CEO / Admin credentials already verified.')
      } else {
        throw dbErr;
      }
    }

    console.log('\n[SANDTRACK DATABASE RESET] System successfully reset to clean, fresh state!')
    process.exit(0)
  } catch (err) {
    console.error('[SANDTRACK DATABASE RESET] Reset failed:', err)
    process.exit(1)
  }
}

resetSystem()
