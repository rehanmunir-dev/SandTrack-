import pool from '../db/pool.js'

export async function getGateLogs(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT g.*, 
             c.consignment_number,
             u.full_name as watchman_name
      FROM gate_logs g
      LEFT JOIN consignments c ON g.consignment_id = c.id
      LEFT JOIN users u ON g.watchman_id = u.id
      ORDER BY g.id DESC
    `)
    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    next(error)
  }
}

export async function createGateLog(req, res, next) {
  const { consignmentId, qrTokenUsed, scanResult, notes } = req.body
  const watchmanId = req.user.id

  if (!consignmentId || !scanResult) {
    return res.status(400).json({ success: false, message: 'ConsignmentId and scanResult are required' })
  }

  try {
    const sql = `
      INSERT INTO gate_logs (consignment_id, watchman_id, qr_token_used, scan_result, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const values = [consignmentId, watchmanId, qrTokenUsed || null, scanResult, notes || '']
    const { rows } = await pool.query(sql, values)

    req.activityLog = {
      action: 'GATE_SCAN_RECORDED',
      entityType: 'consignment',
      entityId: consignmentId,
      metadata: { scanResult }
    }

    return res.status(201).json({ success: true, data: rows[0], message: 'Gate log created successfully' })
  } catch (error) {
    next(error)
  }
}
