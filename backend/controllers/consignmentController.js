import pool from '../db/pool.js'
import { generateQrToken, generateQrImage } from '../services/qrService.js'

export async function getConsignments(req, res, next) {
  const { id: userId, role } = req.user

  try {
    let query = `
      SELECT c.*, 
             d.cnic as driver_cnic, u_driver.full_name as driver_name,
             t.registration_number as truck_registration,
             u_operator.full_name as operator_name
      FROM consignments c
      LEFT JOIN drivers d ON c.driver_id = d.id
      LEFT JOIN users u_driver ON d.user_id = u_driver.id
      LEFT JOIN trucks t ON c.truck_id = t.id
      LEFT JOIN users u_operator ON c.operator_id = u_operator.id
    `
    const values = []

    // Filter by role
    if (role === 'DRIVER') {
      query += ` WHERE d.user_id = $1`
      values.push(userId)
    }

    query += ` ORDER BY c.id DESC`

    const { rows } = await pool.query(query, values)
    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    next(error)
  }
}

export async function getConsignmentById(req, res, next) {
  const { id } = req.params
  try {
    const query = `
      SELECT c.*, 
             d.cnic as driver_cnic, u_driver.full_name as driver_name,
             t.registration_number as truck_registration, t.vehicle_type, t.wheel_count,
             u_operator.full_name as operator_name
      FROM consignments c
      LEFT JOIN drivers d ON c.driver_id = d.id
      LEFT JOIN users u_driver ON d.user_id = u_driver.id
      LEFT JOIN trucks t ON c.truck_id = t.id
      LEFT JOIN users u_operator ON c.operator_id = u_operator.id
      WHERE c.id = $1
    `
    const { rows } = await pool.query(query, [id])
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consignment not found' })
    }
    return res.status(200).json({ success: true, data: rows[0] })
  } catch (error) {
    next(error)
  }
}

export async function getConsignmentFullDetail(req, res, next) {
  const { id } = req.params

  try {
    const consignmentRes = await pool.query(`
      SELECT c.*,
             d.cnic as driver_cnic, d.license_number, d.face_photo_url,
             u_driver.full_name as driver_name, u_driver.phone as driver_phone,
             t.registration_number as truck_registration, t.vehicle_type, t.wheel_count, t.owner_name,
             u_operator.full_name as operator_name
      FROM consignments c
      LEFT JOIN drivers d ON c.driver_id = d.id
      LEFT JOIN users u_driver ON d.user_id = u_driver.id
      LEFT JOIN trucks t ON c.truck_id = t.id
      LEFT JOIN users u_operator ON c.operator_id = u_operator.id
      WHERE c.id = $1
    `, [id])

    if (consignmentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consignment not found' })
    }

    const [paymentsRes, gateLogsRes, ledgerRes, activityRes] = await Promise.all([
      pool.query(`
        SELECT p.*, u_sub.full_name as submitted_by_name, u_ver.full_name as verified_by_name
        FROM payments p
        LEFT JOIN users u_sub ON p.submitted_by = u_sub.id
        LEFT JOIN users u_ver ON p.verified_by = u_ver.id
        WHERE p.consignment_id = $1
        ORDER BY p.id DESC
      `, [id]),
      pool.query(`
        SELECT g.*, u.full_name as watchman_name
        FROM gate_logs g
        LEFT JOIN users u ON g.watchman_id = u.id
        WHERE g.consignment_id = $1
        ORDER BY g.id DESC
      `, [id]),
      pool.query(`
        SELECT l.*, u_created.full_name as created_by_name, u_verified.full_name as verified_by_name
        FROM ledger_entries l
        LEFT JOIN users u_created ON l.created_by = u_created.id
        LEFT JOIN users u_verified ON l.verified_by = u_verified.id
        WHERE l.consignment_id = $1
        ORDER BY l.id DESC
      `, [id]),
      pool.query(`
        SELECT a.*, u.full_name as actor_name
        FROM activity_logs a
        LEFT JOIN users u ON a.actor_id = u.id
        WHERE a.entity_type = 'consignment' AND a.entity_id = $1
        ORDER BY a.id DESC
      `, [id])
    ])

    return res.status(200).json({
      success: true,
      data: {
        consignment: consignmentRes.rows[0],
        payments: paymentsRes.rows,
        gateLogs: gateLogsRes.rows,
        ledgerEntries: ledgerRes.rows,
        activityLogs: activityRes.rows
      }
    })
  } catch (error) {
    next(error)
  }
}

export async function createConsignment(req, res, next) {
  const { driverId, truckId, materialType, weightTons, originLocation, destination, price, discount } = req.body
  const operatorId = req.user.id

  if (!driverId || !truckId || !weightTons) {
    return res.status(400).json({ success: false, message: 'DriverId, truckId and weight are required' })
  }

  try {
    const drvCheck = await pool.query('SELECT id, is_approved, is_active FROM drivers WHERE id = $1', [driverId])
    if (drvCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Assigned driver was not found' })
    }
    if (!drvCheck.rows[0].is_approved) {
      return res.status(400).json({ success: false, message: 'Assigned driver is not approved by CEO yet' })
    }
    if (drvCheck.rows[0].is_active === false) {
      return res.status(400).json({ success: false, message: 'Assigned driver is inactive' })
    }

    const activeDriverAssignment = await pool.query(`
      SELECT id, consignment_number, status
      FROM consignments
      WHERE driver_id = $1
        AND status IN ('SCAN_PENDING', 'IN_TRANSIT', 'ARRIVED', 'DELIVERY_PENDING_VERIFICATION', 'DELIVERED')
      ORDER BY id DESC
      LIMIT 1
    `, [driverId])
    if (activeDriverAssignment.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Assigned driver is already busy on consignment ${activeDriverAssignment.rows[0].consignment_number}`
      })
    }

    const trkCheck = await pool.query('SELECT id, is_approved, status FROM trucks WHERE id = $1', [truckId])
    if (trkCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Assigned truck was not found' })
    }
    if (!trkCheck.rows[0].is_approved) {
      return res.status(400).json({ success: false, message: 'Assigned truck is not approved by CEO yet' })
    }
    if (trkCheck.rows[0].status && trkCheck.rows[0].status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Assigned truck is inactive' })
    }

    const activeTruckAssignment = await pool.query(`
      SELECT id, consignment_number, status
      FROM consignments
      WHERE truck_id = $1
        AND status IN ('SCAN_PENDING', 'IN_TRANSIT', 'ARRIVED', 'DELIVERY_PENDING_VERIFICATION', 'DELIVERED')
      ORDER BY id DESC
      LIMIT 1
    `, [truckId])
    if (activeTruckAssignment.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Assigned truck is already busy on consignment ${activeTruckAssignment.rows[0].consignment_number}`
      })
    }

    const consignmentNumber = `CON-${Date.now()}-${Math.round(Math.random() * 1000)}`

    const sql = `
      INSERT INTO consignments (consignment_number, driver_id, truck_id, operator_id, material_type, weight_tons, origin_location, destination, status, price, discount)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SCAN_PENDING', $9, $10)
      RETURNING *
    `
    const values = [
      consignmentNumber,
      driverId,
      truckId,
      operatorId,
      materialType || 'Sand',
      weightTons,
      originLocation || 'Main Terminal',
      destination || '',
      parseFloat(price || 0),
      parseFloat(discount || 0)
    ]

    const { rows } = await pool.query(sql, values)

    // Auto-create matching pending CASH payment record based on Price - Discount
    const consignmentId = rows[0].id
    const amount = parseFloat(price || 0) - parseFloat(discount || 0)
    await pool.query(
      `INSERT INTO payments (consignment_id, amount, payment_method, submitted_by, status, notes)
       VALUES ($1, $2, 'CASH', $3, 'PENDING', 'Auto-created on consignment creation')`,
      [consignmentId, amount, operatorId]
    )

    req.activityLog = {
      action: 'CREATED_CONSIGNMENT',
      entityType: 'consignment',
      getEntityId: (data) => data.data.id,
      metadata: { consignmentNumber, weightTons }
    }

    return res.status(201).json({ success: true, data: rows[0], message: 'Consignment created successfully' })
  } catch (error) {
    next(error)
  }
}

export async function updateConsignmentStatus(req, res, next) {
  const { id } = req.params
  const { status } = req.body

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' })
  }

  try {
    const currentRes = await pool.query('SELECT status FROM consignments WHERE id = $1', [id])
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consignment not found' })
    }
    const currentStatus = currentRes.rows[0].status

    if (currentStatus === status) {
      return res.status(200).json({ success: true, message: `Status is already ${status}` })
    }

    const transitions = {
      'SCAN_PENDING': ['IN_TRANSIT', 'FLAGGED', 'CANCELLED'],
      'IN_TRANSIT': ['ARRIVED', 'FLAGGED', 'CANCELLED'],
      'ARRIVED': ['DELIVERY_PENDING_VERIFICATION', 'DELIVERED', 'FLAGGED', 'CANCELLED'],
      'DELIVERY_PENDING_VERIFICATION': ['DELIVERED', 'FLAGGED', 'CANCELLED'],
      'DELIVERED': ['BILLED', 'CLOSED', 'FLAGGED'],
      'BILLED': ['CLOSED'],
      'CLOSED': [],
      'FLAGGED': ['SCAN_PENDING', 'IN_TRANSIT', 'ARRIVED', 'DELIVERY_PENDING_VERIFICATION', 'DELIVERED', 'CANCELLED'],
      'CANCELLED': []
    }

    if (!transitions[currentStatus] || !transitions[currentStatus].includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid state transition from ${currentStatus} to ${status}` })
    }

    const sql = 'UPDATE consignments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *'
    const { rows } = await pool.query(sql, [status, id])

    req.activityLog = {
      action: 'UPDATE_CONSIGNMENT_STATUS',
      entityType: 'consignment',
      entityId: parseInt(id, 10),
      metadata: { status }
    }

    return res.status(200).json({ success: true, data: rows[0], message: `Consignment status updated to ${status}` })
  } catch (error) {
    next(error)
  }
}

export async function generateConsignmentQr(req, res, next) {
  const { id } = req.params
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL is required to generate QR pass links in production')
  }

  try {
    const consignmentCheck = await pool.query('SELECT id, status FROM consignments WHERE id = $1', [id])
    if (consignmentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consignment not found' })
    }

    const qrToken = generateQrToken()
    const expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) // 100 years in future (no expiration for testing)

    // Update status to SCAN_PENDING and save QR
    const sql = `
      UPDATE consignments
      SET qr_token = $1, qr_expires_at = $2, status = 'SCAN_PENDING', updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `
    const { rows } = await pool.query(sql, [qrToken, expiresAt, id])
    const epoch = expiresAt.getTime()

    const sessionUrl = `${frontendUrl}/public/qr-pass/${qrToken}`
    const qrImageBase64 = await generateQrImage(sessionUrl)

    req.activityLog = {
      action: 'GENERATE_QR',
      entityType: 'consignment',
      entityId: parseInt(id, 10),
      metadata: { qrToken }
    }

    return res.status(200).json({
      success: true,
      data: {
        consignment: rows[0],
        sessionUrl,
        qrImage: qrImageBase64,
        expiresAt: expiresAt.toISOString()
      },
      message: 'Secure transient QR link and image generated successfully'
    })
  } catch (error) {
    next(error)
  }
}

export async function getPublicQrPass(req, res, next) {
  const { token } = req.params

  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.consignment_number, c.material_type, c.weight_tons,
             c.destination, c.origin_location, c.status, c.qr_expires_at,
             u.full_name as driver_name,
             t.registration_number as truck_registration
      FROM consignments c
      LEFT JOIN drivers d ON c.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN trucks t ON c.truck_id = t.id
      WHERE c.qr_token = $1
    `, [token])

    const pass = rows[0]
    if (!pass) {
      return res.status(404).json({ success: false, valid: false, reason: 'NOT_FOUND', message: 'QR pass not found or already used' })
    }

    if (new Date(pass.qr_expires_at) < new Date()) {
      return res.status(410).json({ success: false, valid: false, reason: 'EXPIRED', message: 'This QR pass has expired' })
    }

    return res.status(200).json({ success: true, valid: true, data: pass })
  } catch (error) {
    next(error)
  }
}

export async function verifyConsignmentQr(req, res, next) {
  const { token } = req.params
  try {
    const query = `
      SELECT c.*, u.full_name as driver_name, d.cnic as driver_cnic,
             t.registration_number as truck_registration, t.vehicle_type, t.wheel_count
      FROM consignments c
      LEFT JOIN drivers d ON c.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN trucks t ON c.truck_id = t.id
      WHERE c.qr_token = $1
    `
    const { rows } = await pool.query(query, [token])
    const consignment = rows[0]

    if (!consignment) {
      return res.status(404).json({ success: false, valid: false, reason: 'NOT_FOUND', message: 'QR session token is invalid' })
    }

    const now = new Date()
    const expiresAt = new Date(consignment.qr_expires_at)

    if (expiresAt < now) {
      return res.status(200).json({ success: true, valid: false, reason: 'EXPIRED', message: 'This QR session link has expired' })
    }

    if (consignment.status !== 'SCAN_PENDING') {
      return res.status(200).json({ success: true, valid: false, reason: 'WRONG_STATUS', message: `Mismatched status: ${consignment.status}` })
    }

    return res.status(200).json({
      success: true,
      valid: true,
      data: consignment,
      message: 'QR pass verified. Clear gate to release this consignment.'
    })
  } catch (error) {
    next(error)
  }
}

export async function clearConsignmentGate(req, res, next) {
  const { id } = req.params
  const { qrToken } = req.body
  const watchmanId = req.user.id

  if (!qrToken) {
    return res.status(400).json({ success: false, message: 'QR token is required to clear the gate' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query('SELECT * FROM consignments WHERE id = $1 FOR UPDATE', [id])
    const consignment = rows[0]

    if (!consignment) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, message: 'Consignment not found' })
    }

    if (consignment.status !== 'SCAN_PENDING') {
      await client.query('ROLLBACK')
      return res.status(400).json({ success: false, message: `Cannot clear gate from status ${consignment.status}` })
    }

    if (!consignment.qr_token || consignment.qr_token !== qrToken) {
      await client.query('ROLLBACK')
      return res.status(400).json({ success: false, message: 'QR token is not active for this consignment' })
    }

    if (new Date(consignment.qr_expires_at) < new Date()) {
      await client.query(`
        INSERT INTO gate_logs (consignment_id, watchman_id, qr_token_used, scan_result, notes)
        VALUES ($1, $2, $3, 'EXPIRED', 'Token clear attempt expired')
      `, [consignment.id, watchmanId, qrToken])
      await client.query('COMMIT')
      return res.status(400).json({ success: false, message: 'QR token has expired' })
    }

    const updated = await client.query(`
      UPDATE consignments
      SET status = 'IN_TRANSIT', qr_token = NULL, qr_expires_at = NULL, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [consignment.id])

    await client.query(`
      INSERT INTO gate_logs (consignment_id, watchman_id, qr_token_used, scan_result, notes)
      VALUES ($1, $2, $3, 'CLEARED', 'Gate scan passed successfully')
    `, [consignment.id, watchmanId, qrToken])

    await client.query('COMMIT')

    req.activityLog = {
      action: 'GATE_CLEARED',
      entityType: 'consignment',
      entityId: consignment.id,
      metadata: { gateVerifiedBy: watchmanId }
    }

    return res.status(200).json({
      success: true,
      data: updated.rows[0],
      message: 'Gate cleared successfully. Consignment is now in transit.'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
}

export async function markConsignmentArrived(req, res, next) {
  const { id } = req.params

  try {
    const { rows: currentRows } = await pool.query('SELECT status FROM consignments WHERE id = $1', [id])
    if (currentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consignment not found' })
    }

    if (currentRows[0].status !== 'IN_TRANSIT') {
      return res.status(400).json({ success: false, message: `Cannot mark arrived from status ${currentRows[0].status}` })
    }

    const { rows } = await pool.query(
      "UPDATE consignments SET status = 'ARRIVED', arrived_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    )

    req.activityLog = {
      action: 'ARRIVED',
      entityType: 'consignment',
      entityId: parseInt(id, 10),
      metadata: { markedBy: req.user.id }
    }

    return res.status(200).json({ success: true, data: rows[0], message: 'Consignment marked arrived' })
  } catch (error) {
    next(error)
  }
}

export async function verifyConsignmentDelivery(req, res, next) {
  const { id } = req.params

  try {
    const { rows: currentRows } = await pool.query('SELECT status FROM consignments WHERE id = $1', [id])
    if (currentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consignment not found' })
    }

    if (!['ARRIVED', 'DELIVERY_PENDING_VERIFICATION'].includes(currentRows[0].status)) {
      return res.status(400).json({ success: false, message: `Cannot verify delivery from status ${currentRows[0].status}` })
    }

    const { rows } = await pool.query(
      "UPDATE consignments SET status = 'DELIVERED', delivery_verified_by = $1, delivery_verified_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *",
      [req.user.id, id]
    )

    req.activityLog = {
      action: 'DELIVERY_VERIFIED',
      entityType: 'consignment',
      entityId: parseInt(id, 10),
      metadata: { verifiedBy: req.user.id }
    }

    return res.status(200).json({ success: true, data: rows[0], message: 'Delivery verified' })
  } catch (error) {
    next(error)
  }
}

export async function flagConsignment(req, res, next) {
  const { id } = req.params
  const { reason } = req.body

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Reason for flagging is required' })
  }

  try {
    const sql = `
      UPDATE consignments
      SET is_flagged = true, flag_reason = $1, status = 'FLAGGED', updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `
    const { rows } = await pool.query(sql, [reason, id])

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consignment not found' })
    }

    req.activityLog = {
      action: 'CONSIGNMENT_FLAGGED',
      entityType: 'consignment',
      entityId: parseInt(id, 10),
      metadata: { reason }
    }

    return res.status(200).json({ success: true, data: rows[0], message: 'Consignment flagged successfully' })
  } catch (error) {
    next(error)
  }
}
