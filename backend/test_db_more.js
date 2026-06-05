import pg from 'pg'
const { Pool } = pg

// DEV-ONLY helper. Never print or brute-force database passwords in production.
if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to run database password test helper in production.')
}

async function testConnection(password, dbname = 'postgres') {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: password,
    database: dbname
  })

  try {
    const { rows } = await pool.query('SELECT NOW()')
    console.log(`SUCCESS with supplied password candidate on ${dbname}`)
    await pool.end()
    return true
  } catch (error) {
    console.log(`FAILED with supplied password candidate on ${dbname} - ${error.message}`)
    await pool.end()
    return false
  }
}

async function run() {
  const passes = ['postgres', 'rehan0344556677', 'admin', 'root', '123456', '123']
  const dbs = ['postgres', 'receipt_system']
  
  for (const db of dbs) {
    for (const pass of passes) {
      if (await testConnection(pass, db)) {
        process.exit(0)
      }
    }
  }
  process.exit(1)
}

run()
