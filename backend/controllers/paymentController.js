import pool from '../db/pool.js'

export async function getPayments(req, res, next) {
  const { status, method } = req.query
  try {
    let query = `
      SELECT p.*,
             c.consignment_number, c.weight_tons,
             u_sub.full_name as submitted_by_name,
             u_ver.full_name as verified_by_name
      FROM payments p
      LEFT JOIN consignments c ON p.consignment_id = c.id
      LEFT JOIN users u_sub ON p.submitted_by = u_sub.id
      LEFT JOIN users u_ver ON p.verified_by = u_ver.id
    `
    const conditions = []
    const values = []
    let paramIndex = 1

    if (status) {
      conditions.push(`p.status = $${paramIndex++}`)
      values.push(status)
    }

    if (method) {
      conditions.push(`p.payment_method = $${paramIndex++}`)
      values.push(method)
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    query += ` ORDER BY p.id DESC`

    const { rows } = await pool.query(query, values)
    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    next(error)
  }
}

export async function getPaymentById(req, res, next) {
  const { id } = req.params
  try {
    const query = `
      SELECT p.*,
             c.consignment_number, c.weight_tons, c.status as consignment_status,
             u_sub.full_name as submitted_by_name,
             u_ver.full_name as verified_by_name
      FROM payments p
      LEFT JOIN consignments c ON p.consignment_id = c.id
      LEFT JOIN users u_sub ON p.submitted_by = u_sub.id
      LEFT JOIN users u_ver ON p.verified_by = u_ver.id
      WHERE p.id = $1
    `
    const { rows } = await pool.query(query, [id])
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' })
    }
    return res.status(200).json({ success: true, data: rows[0] })
  } catch (error) {
    next(error)
  }
}

export async function submitPayment(req, res, next) {
  const { consignmentId, amount, paymentMethod, notes } = req.body
  const submittedBy = req.user.id
  const receiptImageUrl = req.file ? `/uploads/${req.file.filename}` : null

  if (!consignmentId || !amount || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'ConsignmentId, amount and paymentMethod are required' })
  }

  // Payments with method='CASH' must NOT require receipt_image_url
  if (paymentMethod === 'BANK' && !receiptImageUrl) {
    return res.status(400).json({ success: false, message: 'Bank payments require uploading a receipt image' })
  }

  try {
    const consignmentCheck = await pool.query('SELECT id FROM consignments WHERE id = $1', [consignmentId])
    if (consignmentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consignment not found' })
    }

    const sql = `
      INSERT INTO payments (consignment_id, amount, payment_method, receipt_image_url, submitted_by, status, notes)
      VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)
      RETURNING *
    `
    const values = [consignmentId, amount, paymentMethod, receiptImageUrl, submittedBy, notes || '']
    const { rows } = await pool.query(sql, values)

    req.activityLog = {
      action: 'SUBMIT_PAYMENT',
      entityType: 'payment',
      getEntityId: (data) => data.data.id,
      metadata: { amount, paymentMethod }
    }

    return res.status(201).json({ success: true, data: rows[0], message: 'Payment submitted successfully for verification' })
  } catch (error) {
    next(error)
  }
}

export async function verifyPayment(req, res, next) {
  const { id } = req.params
  const verifiedBy = req.user.id

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const checkRes = await client.query('SELECT status, payment_method, receipt_image_url FROM payments WHERE id = $1', [id])
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, message: 'Payment not found' })
    }
    if (checkRes.rows[0].status === 'VERIFIED') {
      await client.query('ROLLBACK')
      return res.status(400).json({ success: false, message: 'Already processed' })
    }
    if (checkRes.rows[0].payment_method !== 'CASH' && !checkRes.rows[0].receipt_image_url) {
      await client.query('ROLLBACK')
      return res.status(400).json({ success: false, message: 'Non-cash payments require a receipt image before verification' })
    }

    const sql = `
      UPDATE payments 
      SET status = 'VERIFIED', verified_by = $1, verified_at = NOW()
      WHERE id = $2 
      RETURNING *
    `
    const { rows } = await client.query(sql, [verifiedBy, id])

    if (rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, message: 'Payment not found' })
    }

    const payment = rows[0]

    await client.query('COMMIT')

    req.activityLog = {
      action: 'PAYMENT_VERIFIED',
      entityType: 'payment',
      entityId: parseInt(id, 10),
      metadata: { verifiedBy }
    }

    return res.status(200).json({ success: true, data: payment, message: 'Payment verified successfully' })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
}

export async function flagPayment(req, res, next) {
  const { id } = req.params
  const { notes } = req.body
  const verifiedBy = req.user.id

  if (!notes) {
    return res.status(400).json({ success: false, message: 'Flag notes are required explaining why payment is flagged' })
  }

  try {
    const sql = `
      UPDATE payments 
      SET status = 'FLAGGED', verified_by = $1, verified_at = NOW(), notes = $2
      WHERE id = $3 
      RETURNING *
    `
    const { rows } = await pool.query(sql, [verifiedBy, notes, id])

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' })
    }

    req.activityLog = {
      action: 'PAYMENT_FLAGGED',
      entityType: 'payment',
      entityId: parseInt(id, 10),
      metadata: { flaggedBy: verifiedBy, reason: notes }
    }

    return res.status(200).json({ success: true, data: rows[0], message: 'Payment successfully flagged for review' })
  } catch (error) {
    next(error)
  }
}

export async function updatePaymentDetails(req, res, next) {
  const { id } = req.params
  const { method, amount, status, remarks, receiptImage } = req.body
  const accountantId = req.user.id

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const pRes = await client.query('SELECT consignment_id FROM payments WHERE id = $1', [id])
    if (pRes.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, message: 'Payment not found' })
    }

    const methodMap = {
      CASH: 'CASH',
      BANK: 'BANK',
      'BANK ACCOUNT': 'BANK',
      'ONLINE TRANSFER': 'BANK',
      CHEQUE: 'BANK'
    }
    const statusMap = {
      PENDING: 'PENDING',
      PAID: 'VERIFIED',
      VERIFIED: 'VERIFIED',
      HELD: 'FLAGGED',
      OVERDUE: 'FLAGGED',
      FLAGGED: 'FLAGGED'
    }
    const normalizedMethod = methodMap[String(method || 'CASH').toUpperCase()] || 'CASH'
    const normalizedStatus = statusMap[String(status || 'PENDING').toUpperCase()] || 'PENDING'

    if (normalizedMethod !== 'CASH' && normalizedStatus === 'VERIFIED' && !receiptImage) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        success: false,
        message: 'Non-cash verified payments require a receipt image'
      })
    }

    const paySql = `
      UPDATE payments
      SET payment_method = $1,
          amount = $2,
          status = $3::varchar,
          notes = $4,
          receipt_image_url = $5,
          verified_by = CASE WHEN $3::varchar IN ('VERIFIED', 'FLAGGED') THEN $6 ELSE verified_by END,
          verified_at = CASE WHEN $3::varchar IN ('VERIFIED', 'FLAGGED') THEN NOW() ELSE verified_at END
      WHERE id = $7
      RETURNING *
    `
    const payValues = [
      normalizedMethod,
      parseFloat(amount || 0),
      normalizedStatus,
      remarks || '',
      receiptImage || '',
      accountantId,
      id
    ]
    const { rows } = await client.query(paySql, payValues)

    let deliveryUpdated = false
    if (normalizedStatus === 'VERIFIED') {
      const deliveredRes = await client.query(`
        UPDATE consignments
        SET status = 'DELIVERED',
            arrived_at = COALESCE(arrived_at, NOW()),
            delivery_verified_by = COALESCE(delivery_verified_by, $1),
            delivery_verified_at = COALESCE(delivery_verified_at, NOW()),
            updated_at = NOW()
        WHERE id = $2
          AND status NOT IN ('DELIVERED', 'BILLED', 'CLOSED', 'FLAGGED', 'CANCELLED')
        RETURNING id
      `, [accountantId, pRes.rows[0].consignment_id])
      deliveryUpdated = deliveredRes.rows.length > 0
    }

    await client.query('COMMIT')

    req.activityLog = {
      action: 'PAYMENT_UPDATED',
      entityType: 'payment',
      entityId: parseInt(id, 10),
      metadata: { accountantId, amount, status: normalizedStatus, deliveryUpdated }
    }

    return res.status(200).json({ success: true, data: rows[0], deliveryUpdated, message: 'Payment details updated successfully' })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
}
