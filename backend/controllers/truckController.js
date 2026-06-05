import pool from '../db/pool.js'

export async function getTrucks(req, res, next) {
  try {
    const query = `
      SELECT t.*, u.full_name as approved_by_name
      FROM trucks t
      LEFT JOIN users u ON t.approved_by = u.id
      ORDER BY t.id DESC
    `
    const { rows } = await pool.query(query)
    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    next(error)
  }
}

export async function getTruckById(req, res, next) {
  const { id } = req.params
  try {
    const query = `
      SELECT t.*, u.full_name as approved_by_name
      FROM trucks t
      LEFT JOIN users u ON t.approved_by = u.id
      WHERE t.id = $1
    `
    const { rows } = await pool.query(query, [id])
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Truck not found' })
    }
    return res.status(200).json({ success: true, data: rows[0] })
  } catch (error) {
    next(error)
  }
}

export async function registerTruck(req, res, next) {
  const { registrationNumber, vehicleType, wheelCount, ownerName } = req.body

  if (!registrationNumber || !vehicleType || !wheelCount) {
    return res.status(400).json({ success: false, message: 'Registration number, vehicle type, and wheel count are required' })
  }

  // Validate wheel count
  const validWheels = [8, 14, 16, 18, 20, 22]
  if (!validWheels.includes(Number(wheelCount))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid wheel count. Must be 8, 14, 16, 18, 20, or 22'
    })
  }

  // Validate vehicle type
  const validTypes = ['Damper','Truck','Mazda','Suzuki']
  if (!validTypes.includes(vehicleType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vehicle type'
    })
  }

  try {
    const checkTruck = await pool.query('SELECT id FROM trucks WHERE registration_number = $1', [registrationNumber])
    if (checkTruck.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Truck registration number is already registered' })
    }

    const sql = `
      INSERT INTO trucks (registration_number, vehicle_type, wheel_count, owner_name, status)
      VALUES ($1, $2, $3, $4, 'ACTIVE')
      RETURNING *
    `
    const values = [registrationNumber, vehicleType, wheelCount, ownerName || '']
    const { rows } = await pool.query(sql, values)

    req.activityLog = {
      action: 'ADDED_TRUCK',
      entityType: 'truck',
      getEntityId: (data) => data.data.id,
      metadata: { registrationNumber, vehicleType, wheelCount }
    }

    return res.status(201).json({
      success: true,
      data: rows[0],
      message: 'Truck registered successfully (pending approvals)'
    })
  } catch (error) {
    next(error)
  }
}

export async function approveTruck(req, res, next) {
  const { id } = req.params
  const approverId = req.user.id

  try {
    const sql = `
      UPDATE trucks 
      SET is_approved = true, approved_by = $1
      WHERE id = $2 
      RETURNING *
    `
    const { rows } = await pool.query(sql, [approverId, id])

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Truck not found' })
    }

    req.activityLog = {
      action: 'APPROVE_TRUCK',
      entityType: 'truck',
      entityId: parseInt(id, 10),
      metadata: { approvedBy: approverId }
    }

    return res.status(200).json({ success: true, data: rows[0], message: 'Truck approved successfully' })
  } catch (error) {
    next(error)
  }
}

export async function updateTruck(req, res, next) {
  const { id } = req.params
  const { registrationNumber, vehicleType, wheelCount, ownerName, status } = req.body

  try {
    const updates = []
    const values = []
    let counter = 1

    if (registrationNumber !== undefined) {
      updates.push(`registration_number = $${counter++}`)
      values.push(registrationNumber)
    }
    if (vehicleType !== undefined) {
      updates.push(`vehicle_type = $${counter++}`)
      values.push(vehicleType)
    }
    if (wheelCount !== undefined) {
      updates.push(`wheel_count = $${counter++}`)
      values.push(wheelCount)
    }
    if (ownerName !== undefined) {
      updates.push(`owner_name = $${counter++}`)
      values.push(ownerName)
    }
    if (status !== undefined) {
      const normalizedStatus = String(status).toUpperCase()
      if (!['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'STANDBY'].includes(normalizedStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid truck status' })
      }
      updates.push(`status = $${counter++}`)
      values.push(normalizedStatus)
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update provided' })
    }

    values.push(id)
    const sql = `
      UPDATE trucks 
      SET ${updates.join(', ')} 
      WHERE id = $${counter} 
      RETURNING *
    `
    const { rows } = await pool.query(sql, values)

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Truck not found' })
    }

    req.activityLog = {
      action: 'UPDATE_TRUCK',
      entityType: 'truck',
      entityId: parseInt(id, 10),
      metadata: { updatedFields: Object.keys(req.body) }
    }

    return res.status(200).json({ success: true, data: rows[0], message: 'Truck updated successfully' })
  } catch (error) {
    next(error)
  }
}

export async function flagTruck(req, res, next) {
  const { id } = req.params
  const { reason } = req.body

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Reason for flagging is required' })
  }

  try {
    const { rows } = await pool.query(`
      UPDATE trucks
      SET is_flagged = true,
          flag_reason = $1,
          flagged_by = $2,
          flagged_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [reason, req.user.id, id])

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Truck not found' })
    }

    req.activityLog = {
      action: 'TRUCK_FLAGGED',
      entityType: 'truck',
      entityId: parseInt(id, 10),
      metadata: { reason, flaggedBy: req.user.id }
    }

    return res.status(200).json({ success: true, data: rows[0], message: 'Truck flagged successfully' })
  } catch (error) {
    next(error)
  }
}
