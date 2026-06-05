import pool from '../db/pool.js'

export async function getActivityLogs(req, res, next) {
  const { role, action, from, to, page = 1, limit = 20 } = req.query
  
  const parsedPage = parseInt(page, 10) || 1
  const parsedLimit = parseInt(limit, 10) || 20
  const offset = (parsedPage - 1) * parsedLimit

  try {
    let query = `
      SELECT a.*, u.full_name as actor_name
      FROM activity_logs a
      LEFT JOIN users u ON a.actor_id = u.id
    `
    const conditions = []
    const values = []
    let counter = 1

    if (role) {
      conditions.push(`a.actor_role = $${counter++}`)
      values.push(role)
    }

    if (action) {
      conditions.push(`a.action = $${counter++}`)
      values.push(action)
    }

    if (from) {
      conditions.push(`a.created_at >= $${counter++}`)
      values.push(from)
    }

    if (to) {
      conditions.push(`a.created_at <= $${counter++}`)
      values.push(to)
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    // Get count for pagination
    let countQuery = `SELECT COUNT(*) FROM activity_logs a`
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`
    }
    const countRes = await pool.query(countQuery, values)
    const totalRecords = parseInt(countRes.rows[0].count, 10)

    // Append sorting, limit, and offset
    query += ` ORDER BY a.id DESC LIMIT $${counter++} OFFSET $${counter++}`
    values.push(parsedLimit, offset)

    const { rows } = await pool.query(query, values)

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / parsedLimit)
      }
    })
  } catch (error) {
    next(error)
  }
}
