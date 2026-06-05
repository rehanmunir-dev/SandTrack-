import 'dotenv/config'
import pool from './db/pool.js'

async function listUsers() {
  try {
    const query = `
      SELECT u.username, r.name as role
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON r.id = ur.role_id;
    `
    const { rows } = await pool.query(query)
    console.log(JSON.stringify(rows, null, 2))
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

listUsers()
