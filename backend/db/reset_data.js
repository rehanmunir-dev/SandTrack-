import pool from './pool.js'

// DEV-ONLY DANGER ZONE:
// This script removes operational records. It must never run in production and
// requires an explicit opt-in flag even in development.
if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to run database reset in production.')
}

if (process.env.ALLOW_DB_RESET !== 'true') {
  throw new Error('Refusing to run database reset. Set ALLOW_DB_RESET=true to continue.')
}

async function resetDatabase() {
  console.log('=== STARTING FRESH DATABASE CLEANING ===')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    console.log('Cleaning dependent data tables...')
    await client.query('DELETE FROM activity_logs')
    await client.query('DELETE FROM gate_logs')
    await client.query('DELETE FROM expenses')
    await client.query('DELETE FROM payments')
    await client.query('DELETE FROM consignments')
    await client.query('DELETE FROM trucks')
    await client.query('DELETE FROM drivers')
    await client.query("DELETE FROM users WHERE role != 'SUPER_ADMIN'")

    console.log('Resetting auto-increment ID sequences...')
    await client.query('ALTER SEQUENCE IF EXISTS activity_logs_id_seq RESTART WITH 1')
    await client.query('ALTER SEQUENCE IF EXISTS gate_logs_id_seq RESTART WITH 1')
    await client.query('ALTER SEQUENCE IF EXISTS expenses_id_seq RESTART WITH 1')
    await client.query('ALTER SEQUENCE IF EXISTS payments_id_seq RESTART WITH 1')
    await client.query('ALTER SEQUENCE IF EXISTS consignments_id_seq RESTART WITH 1')
    await client.query('ALTER SEQUENCE IF EXISTS trucks_id_seq RESTART WITH 1')
    await client.query('ALTER SEQUENCE IF EXISTS drivers_id_seq RESTART WITH 1')
    
    // For users, reset to start after the seeded admin
    const adminCheck = await client.query("SELECT id FROM users WHERE username = 'admin'")
    if (adminCheck.rows.length > 0) {
      const adminId = adminCheck.rows[0].id
      await client.query(`ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH ${adminId + 1}`)
    } else {
      await client.query('ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1')
    }

    await client.query('COMMIT')
    console.log('=== DATABASE SUCCESSFULLY CLEANED! ===')
    console.log('Only System Administrator (SUPER_ADMIN) remains.')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Database reset failed:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

resetDatabase()
