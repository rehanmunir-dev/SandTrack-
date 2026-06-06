import pool from '../db/pool.js'

const ROLE_ACTIONS = {
  SUPER_ADMIN: null,
  OPERATOR: [
    'APPROVE_DRIVER',
    'APPROVE_TRUCK',
    'DRIVER_FLAGGED',
    'TRUCK_FLAGGED',
    'CONSIGNMENT_FLAGGED',
    'GATE_CLEARED',
    'ARRIVED',
    'DELIVERY_VERIFIED',
    'PAYMENT_VERIFIED',
    'PAYMENT_FLAGGED',
    'LEDGER_CLOSED'
  ],
  DRIVER: [
    'CREATED_CONSIGNMENT',
    'GENERATE_QR',
    'GATE_CLEARED',
    'ARRIVED',
    'DELIVERY_VERIFIED',
    'LEDGER_CLOSED',
    'DRIVER_FLAGGED',
    'TRUCK_FLAGGED',
    'CONSIGNMENT_FLAGGED'
  ],
  WATCHMAN: [
    'CREATED_CONSIGNMENT',
    'GENERATE_QR',
    'GATE_CLEARED',
    'DRIVER_FLAGGED',
    'TRUCK_FLAGGED',
    'CONSIGNMENT_FLAGGED'
  ],
  ACCOUNTANT: [
    'GATE_CLEARED',
    'ARRIVED',
    'DELIVERY_VERIFIED',
    'SUBMIT_PAYMENT',
    'PAYMENT_UPDATED',
    'PAYMENT_VERIFIED',
    'PAYMENT_FLAGGED',
    'LEDGER_CLOSED',
    'DRIVER_FLAGGED',
    'TRUCK_FLAGGED',
    'CONSIGNMENT_FLAGGED'
  ]
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {}
  }

  const allowedKeys = ['reason', 'status', 'previousStatus', 'newStatus']
  return Object.fromEntries(
    allowedKeys
      .filter((key) => metadata[key] !== undefined)
      .map((key) => [key, metadata[key]])
  )
}

export async function getNotifications(req, res, next) {
  const requestedLimit = Number.parseInt(req.query.limit, 10)
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 50)
    : 20
  const allowedActions = Object.prototype.hasOwnProperty.call(ROLE_ACTIONS, req.user.role)
    ? ROLE_ACTIONS[req.user.role]
    : []

  if (req.user.role !== 'SUPER_ADMIN' && allowedActions.length === 0) {
    return res.status(200).json({ success: true, data: [] })
  }

  try {
    const values = []
    let actionFilter = ''

    if (allowedActions) {
      values.push(allowedActions)
      actionFilter = 'WHERE a.action = ANY($1::varchar[])'
    }

    values.push(limit)
    const limitPlaceholder = `$${values.length}`

    const { rows } = await pool.query(`
      SELECT
        a.id,
        a.action,
        a.entity_type,
        a.entity_id,
        a.metadata,
        a.actor_role,
        a.created_at,
        u.full_name AS actor_name,
        CASE
          WHEN a.entity_type = 'consignment' THEN c.consignment_number
          WHEN a.entity_type = 'driver' THEN COALESCE(du.full_name, CONCAT('Driver #', d.id))
          WHEN a.entity_type = 'truck' THEN t.registration_number
          WHEN a.entity_type = 'payment' THEN CONCAT('Payment #', p.id)
          ELSE CONCAT(INITCAP(COALESCE(a.entity_type, 'record')), ' #', COALESCE(a.entity_id::text, ''))
        END AS entity_label
      FROM activity_logs a
      LEFT JOIN users u ON u.id = a.actor_id
      LEFT JOIN consignments c ON a.entity_type = 'consignment' AND c.id = a.entity_id
      LEFT JOIN drivers d ON a.entity_type = 'driver' AND d.id = a.entity_id
      LEFT JOIN users du ON du.id = d.user_id
      LEFT JOIN trucks t ON a.entity_type = 'truck' AND t.id = a.entity_id
      LEFT JOIN payments p ON a.entity_type = 'payment' AND p.id = a.entity_id
      ${actionFilter}
      ORDER BY a.id DESC
      LIMIT ${limitPlaceholder}
    `, values)

    const notifications = rows.map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      entityLabel: row.entity_label,
      metadata: sanitizeMetadata(row.metadata),
      actorName: row.actor_name || 'System',
      actorRole: row.actor_role,
      createdAt: row.created_at
    }))

    return res.status(200).json({ success: true, data: notifications })
  } catch (error) {
    next(error)
  }
}
