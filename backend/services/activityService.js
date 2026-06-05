import pool from '../db/pool.js'

export async function logActivity(actorId, actorRole, action, entityType, entityId, metadata = {}) {
  // NOTE: Do NOT log activity if actor_role = 'SUPER_ADMIN'
  if (actorRole === 'SUPER_ADMIN') {
    return
  }

  const sql = `
    INSERT INTO activity_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `
  
  try {
    const values = [
      actorId,
      actorRole,
      action,
      entityType,
      entityId,
      JSON.stringify(metadata)
    ]
    const { rows } = await pool.query(sql, values)
    return rows[0]
  } catch (error) {
    console.error('Failed to write activity log:', error)
  }
}
