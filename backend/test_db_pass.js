import 'dotenv/config'
import pg from 'pg'
const { Pool } = pg

// DEV-ONLY helper. Never print or brute-force database passwords in production.
if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to run database password test helper in production.')
}

async function testConnection(password) {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'receipt_system'
  })

  try {
    const { rows } = await pool.query('SELECT NOW()')
    console.log('Connection SUCCESS with supplied password candidate')
    await pool.end()
    return true
  } catch (error) {
    console.log(`Connection FAILED with supplied password candidate - ${error.message}`)
    await pool.end()
    return false
  }
}

async function run() {
  await testConnection('rehan0344556677')
  await testConnection('postgres')
  await testConnection('')
  process.exit(0)
}

run()
