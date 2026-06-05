import pool from '../db/pool.js'

export async function getLedgerEntries(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT l.*, c.consignment_number, p.status as payment_status,
             u_created.full_name as created_by_name,
             u_verified.full_name as verified_by_name
      FROM ledger_entries l
      LEFT JOIN consignments c ON l.consignment_id = c.id
      LEFT JOIN payments p ON l.payment_id = p.id
      LEFT JOIN users u_created ON l.created_by = u_created.id
      LEFT JOIN users u_verified ON l.verified_by = u_verified.id
      ORDER BY l.id DESC
    `)

    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    next(error)
  }
}

export async function getLedgerEntriesByConsignment(req, res, next) {
  const { id } = req.params

  try {
    const { rows } = await pool.query(`
      SELECT l.*, c.consignment_number, p.status as payment_status,
             u_created.full_name as created_by_name,
             u_verified.full_name as verified_by_name
      FROM ledger_entries l
      LEFT JOIN consignments c ON l.consignment_id = c.id
      LEFT JOIN payments p ON l.payment_id = p.id
      LEFT JOIN users u_created ON l.created_by = u_created.id
      LEFT JOIN users u_verified ON l.verified_by = u_verified.id
      WHERE l.consignment_id = $1
      ORDER BY l.id DESC
    `, [id])

    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    next(error)
  }
}

export async function closeConsignmentLedger(req, res, next) {
  const { id } = req.params
  const actorId = req.user.id

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const consignmentRes = await client.query('SELECT * FROM consignments WHERE id = $1 FOR UPDATE', [id])
    const consignment = consignmentRes.rows[0]

    if (!consignment) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, message: 'Consignment not found' })
    }

    if (consignment.status !== 'DELIVERED') {
      await client.query('ROLLBACK')
      return res.status(400).json({ success: false, message: `Ledger can only close delivered consignments. Current status: ${consignment.status}` })
    }

    const paymentRes = await client.query(
      "SELECT * FROM payments WHERE consignment_id = $1 ORDER BY id DESC LIMIT 1",
      [id]
    )
    const payment = paymentRes.rows[0] || null

    if (payment && payment.status !== 'VERIFIED') {
      await client.query('ROLLBACK')
      return res.status(400).json({ success: false, message: 'Payment must be verified before closing ledger' })
    }

    const existing = await client.query(
      "SELECT id FROM ledger_entries WHERE consignment_id = $1 AND entry_type = 'CONSIGNMENT_CLOSE' AND status = 'CLOSED'",
      [id]
    )

    if (existing.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ success: false, message: 'Ledger is already closed for this consignment' })
    }

    const amount = Number(payment?.amount || consignment.price || 0) - Number(consignment.discount || 0)
    const ledgerRes = await client.query(`
      INSERT INTO ledger_entries
        (consignment_id, payment_id, entry_type, debit, credit, amount, status, created_by, verified_by, verified_at, notes)
      VALUES ($1, $2, 'CONSIGNMENT_CLOSE', 0, $3, $3, 'CLOSED', $4, $4, NOW(), 'Consignment delivered and ledger closed')
      RETURNING *
    `, [id, payment?.id || null, amount, actorId])

    const updatedConsignmentRes = await client.query(
      "UPDATE consignments SET status = 'CLOSED', updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    )

    await client.query('COMMIT')

    req.activityLog = {
      action: 'LEDGER_CLOSED',
      entityType: 'consignment',
      entityId: parseInt(id, 10),
      metadata: { paymentId: payment?.id || null, amount }
    }

    return res.status(200).json({
      success: true,
      data: {
        consignment: updatedConsignmentRes.rows[0],
        ledgerEntry: ledgerRes.rows[0]
      },
      message: 'Ledger closed successfully'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
}
