import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

function buildSslConfig() {
  const dbSsl = String(process.env.DB_SSL || '').trim().toLowerCase()

  if (dbSsl === 'true') {
    return { rejectUnauthorized: false }
  }

  return false
}

function buildPoolConfig() {
  const rawUrl = process.env.DATABASE_URL || ''

  if (!rawUrl) {
    throw new Error('DATABASE_URL is missing. Add it in backend/.env')
  }

  const dbUrl = new URL(rawUrl)

  return {
    host: dbUrl.hostname,
    port: Number(dbUrl.port || 5432),
    user: decodeURIComponent(dbUrl.username || ''),
    password: String(decodeURIComponent(dbUrl.password || '')),
    database: decodeURIComponent((dbUrl.pathname || '').replace(/^\//, '')),
    ssl: buildSslConfig(),
  }
}

const pool = new Pool(buildPoolConfig())

export default pool
