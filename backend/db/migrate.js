import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from './pool.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigrations() {
  console.log('Starting Database Migrations...')
  const migrationsDir = path.join(__dirname, 'migrations')
  
  try {
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()

    console.log(`Found ${files.length} migration files to run.`)

    for (const file of files) {
      console.log(`Running migration: ${file}`)
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf-8')

      // Execute SQL content
      await pool.query(sql)
      console.log(`Successfully completed: ${file}`)
    }

    console.log('All migrations completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigrations()
