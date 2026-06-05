import pool from '../db/pool.js'
import { hashPassword as hashPasswordAuth } from '../services/authService.js'
import {
  generateUsername,
  ensureUniqueUsername,
  generatePassword,
  hashPassword
} from '../services/credentialService.js'

export async function getDrivers(req, res, next) {
  try {
    const query = `
      SELECT d.*, u.username, u.full_name, u.phone, u.is_active as user_is_active,
             approver.full_name as approved_by_name
      FROM drivers d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN users approver ON d.approved_by = approver.id
      ORDER BY d.id DESC
    `
    const { rows } = await pool.query(query)
    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    next(error)
  }
}

export async function getDriverById(req, res, next) {
  const { id } = req.params
  try {
    const query = `
      SELECT d.*, u.username, u.full_name, u.phone, u.is_active as user_is_active,
             approver.full_name as approved_by_name
      FROM drivers d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN users approver ON d.approved_by = approver.id
      WHERE d.id = $1
    `
    const { rows } = await pool.query(query, [id])
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Driver not found' })
    }
    return res.status(200).json({ success: true, data: rows[0] })
  } catch (error) {
    next(error)
  }
}

export async function registerDriver(req, res, next) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { 
      fullName, 
      cnic, 
      licenseNumber, 
      phone 
    } = req.body

    if (!fullName || !cnic) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        success: false,
        message: 'Full name and CNIC are required'
      })
    }

    // Check CNIC not already registered
    const existingDriver = await client.query(
      'SELECT id FROM drivers WHERE cnic = $1',
      [cnic]
    )
    if (existingDriver.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.status(409).json({
        success: false,
        message: 'A driver with this CNIC already exists'
      })
    }

    // Step 1: Generate driver login credentials
    let username = generateUsername(fullName, 'DRIVER')
    username = await ensureUniqueUsername(username, client)
    const plainPassword = generatePassword()
    const passwordHash = await hashPassword(plainPassword)

    // Step 2: Create user account for driver
    const userResult = await client.query(
      `INSERT INTO users
        (username, password_hash, role,
         full_name, phone, is_active)
       VALUES ($1, $2, 'DRIVER', $3, $4, true)
       RETURNING id, username`,
      [username, passwordHash, fullName, phone || null]
    )

    const driverUser = userResult.rows[0]

    // Step 3: Handle face photo upload
    const facePhotoUrl = req.file
      ? `/uploads/${req.file.filename}`
      : null

    // Step 4: Create driver profile
    const driverResult = await client.query(
      `INSERT INTO drivers
        (user_id, cnic, license_number,
         face_photo_url, is_approved, is_active)
       VALUES ($1, $2, $3, $4, false, true)
       RETURNING *`,
      [
        driverUser.id, 
        cnic, 
        licenseNumber || null, 
        facePhotoUrl
      ]
    )

    const driver = driverResult.rows[0]

    // Step 5: Log activity
    if (req.user && req.user.role !== 'SUPER_ADMIN') {
      await client.query(
        `INSERT INTO activity_logs
          (actor_id, actor_role, action,
           entity_type, entity_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id, 
          req.user.role,
          'REGISTER_DRIVER', 
          'driver', 
          driver.id
        ]
      )
    }

    await client.query('COMMIT')

    // Return everything including login credentials
    // Plain password shown ONCE — operator must note it
    return res.status(201).json({
      success: true,
      message: 'Driver registered successfully',
      data: {
        id: driver.id,
        fullName: fullName,
        cnic: driver.cnic,
        licenseNumber: driver.license_number,
        facePhotoUrl: driver.face_photo_url,
        isApproved: driver.is_approved,
        createdAt: driver.created_at,
        loginCredentials: {
          username: driverUser.username,
          plainPassword: plainPassword,
          message: 'Share these credentials with the driver. Password shown once only.'
        }
      }
    })

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Register driver error:', err)
    next(err)
  } finally {
    client.release()
  }
}

export async function approveDriver(req, res, next) {
  const { id } = req.params
  const approverId = req.user.id

  try {
    const sql = `
      UPDATE drivers 
      SET is_approved = true, approved_by = $1
      WHERE id = $2 
      RETURNING *
    `
    const { rows } = await pool.query(sql, [approverId, id])

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Driver not found' })
    }

    req.activityLog = {
      action: 'APPROVE_DRIVER',
      entityType: 'driver',
      entityId: parseInt(id, 10),
      metadata: { approvedBy: approverId }
    }

    return res.status(200).json({ success: true, data: rows[0], message: 'Driver approved successfully' })
  } catch (error) {
    next(error)
  }
}

export async function updateDriver(req, res, next) {
  const { id } = req.params
  const { fullName, phone, cnic, licenseNumber, status, isActive } = req.body
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const current = await client.query('SELECT id, user_id FROM drivers WHERE id = $1', [id])
    if (current.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, message: 'Driver not found' })
    }

    // Dynamically build the update fields
    const updates = []
    const values = []
    let counter = 1

    if (cnic !== undefined) {
      updates.push(`cnic = $${counter++}`)
      values.push(cnic)
    }
    if (licenseNumber !== undefined) {
      updates.push(`license_number = $${counter++}`)
      values.push(licenseNumber)
    }
    const normalizedActive = isActive !== undefined ? Boolean(isActive) : status !== undefined ? status === 'active' : undefined
    if (normalizedActive !== undefined) {
      updates.push(`is_active = $${counter++}`)
      values.push(normalizedActive)
    }

    if (updates.length === 0 && fullName === undefined && phone === undefined) {
      await client.query('ROLLBACK')
      return res.status(400).json({ success: false, message: 'No fields to update provided' })
    }

    let rows = [current.rows[0]]
    if (updates.length > 0) {
      values.push(id)
      const sql = `
        UPDATE drivers 
        SET ${updates.join(', ')} 
        WHERE id = $${counter} 
        RETURNING *
      `
      const result = await client.query(sql, values)
      rows = result.rows
    }

    const userUpdates = []
    const userValues = []
    let userCounter = 1
    if (fullName !== undefined) {
      userUpdates.push(`full_name = $${userCounter++}`)
      userValues.push(fullName)
    }
    if (phone !== undefined) {
      userUpdates.push(`phone = $${userCounter++}`)
      userValues.push(phone)
    }
    if (normalizedActive !== undefined) {
      userUpdates.push(`is_active = $${userCounter++}`)
      userValues.push(normalizedActive)
    }

    if (userUpdates.length > 0 && current.rows[0].user_id) {
      userValues.push(current.rows[0].user_id)
      await client.query(
        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${userCounter}`,
        userValues
      )
    }

    await client.query('COMMIT')

    req.activityLog = {
      action: 'UPDATE_DRIVER',
      entityType: 'driver',
      entityId: parseInt(id, 10),
      metadata: { updatedFields: Object.keys(req.body) }
    }

    return res.status(200).json({ success: true, data: rows[0], message: 'Driver updated successfully' })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
}

export async function flagDriver(req, res, next) {
  const { id } = req.params
  const { reason } = req.body

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Reason for flagging is required' })
  }

  try {
    const { rows } = await pool.query(`
      UPDATE drivers
      SET is_flagged = true,
          flag_reason = $1,
          flagged_by = $2,
          flagged_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [reason, req.user.id, id])

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Driver not found' })
    }

    req.activityLog = {
      action: 'DRIVER_FLAGGED',
      entityType: 'driver',
      entityId: parseInt(id, 10),
      metadata: { reason, flaggedBy: req.user.id }
    }

    return res.status(200).json({ success: true, data: rows[0], message: 'Driver flagged successfully' })
  } catch (error) {
    next(error)
  }
}
