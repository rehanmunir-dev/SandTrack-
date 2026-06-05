import pool from '../db/pool.js'
import { 
  generateUsername,
  generatePassword,
  hashPassword,
  ensureUniqueUsername
} from '../services/credentialService.js'

export const createUser = async (req, res, next) => {
  try {
    const { fullName, role, phone } = req.body

    // Validate
    if (!fullName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Full name and role are required'
      })
    }

    const validRoles = [
      'OPERATOR', 
      'DRIVER', 
      'WATCHMAN', 
      'ACCOUNTANT'
    ]
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be OPERATOR, DRIVER, WATCHMAN or ACCOUNTANT'
      })
    }

    // Generate credentials
    let username = generateUsername(fullName, role)
    username = await ensureUniqueUsername(username, pool)
    const plainPassword = generatePassword()
    const passwordHash = await hashPassword(plainPassword)

    // Create user in database
    const result = await pool.query(
      `INSERT INTO users 
        (username, password_hash, role, 
         full_name, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, username, role, 
                 full_name, phone, is_active, 
                 created_at`,
      [username, passwordHash, role, fullName, phone || null]
    )

    const newUser = result.rows[0]

    // Set logger config on req for activity middleware
    req.activityLog = {
      action: 'ADDED_STAFF',
      entityType: 'user',
      getEntityId: (data) => data.data.id,
      metadata: { username, role }
    }

    // IMPORTANT: Return plain password ONCE
    // It will never be shown again
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser.id,
        username: newUser.username,
        plainPassword: plainPassword,
        role: newUser.role,
        fullName: newUser.full_name,
        phone: newUser.phone,
        isActive: newUser.is_active,
        createdAt: newUser.created_at
      }
    })

  } catch (err) {
    console.error('Create user error:', err)
    next(err)
  }
}

export const getAllUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, username, role, full_name, 
              phone, is_active, created_at
       FROM users
       WHERE role != 'SUPER_ADMIN'
       ORDER BY created_at DESC`
    )

    return res.json({
      success: true,
      data: result.rows.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        fullName: u.full_name,
        phone: u.phone,
        isActive: u.is_active,
        createdAt: u.created_at
      }))
    })
  } catch (err) {
    next(err)
  }
}

// Support both export names for compatibility with other imports
export const getUsers = getAllUsers

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { isActive } = req.body

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'isActive status is required'
      })
    }

    const result = await pool.query(
      `UPDATE users SET is_active = $1
       WHERE id = $2 AND role != 'SUPER_ADMIN'
       RETURNING id, username, role, 
                 full_name, is_active`,
      [isActive, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    req.activityLog = {
      action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      entityType: 'user',
      entityId: parseInt(id, 10),
      metadata: { username: result.rows[0].username }
    }

    return res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'}`,
      data: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        role: result.rows[0].role,
        fullName: result.rows[0].full_name,
        isActive: result.rows[0].is_active
      }
    })
  } catch (err) {
    next(err)
  }
}

export const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params

    const plainPassword = generatePassword()
    const passwordHash = await hashPassword(plainPassword)

    const result = await pool.query(
      `UPDATE users SET password_hash = $1
       WHERE id = $2 AND role != 'SUPER_ADMIN'
       RETURNING id, username, role, full_name`,
      [passwordHash, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    req.activityLog = {
      action: 'RESET_PASSWORD',
      entityType: 'user',
      entityId: parseInt(id, 10),
      metadata: { username: result.rows[0].username }
    }

    // Return new plain password once
    return res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        role: result.rows[0].role,
        fullName: result.rows[0].full_name,
        newPassword: plainPassword
      }
    })
  } catch (err) {
    next(err)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `DELETE FROM users
       WHERE id = $1 AND role != 'SUPER_ADMIN'
       RETURNING id, username, role, full_name`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found or cannot be deleted'
      })
    }

    const deletedUser = result.rows[0]

    req.activityLog = {
      action: 'DELETE_STAFF',
      entityType: 'user',
      entityId: parseInt(id, 10),
      metadata: {
        username: deletedUser.username,
        role: deletedUser.role
      }
    }

    return res.json({
      success: true,
      message: 'Staff member deleted successfully',
      data: {
        id: deletedUser.id,
        username: deletedUser.username,
        role: deletedUser.role,
        fullName: deletedUser.full_name
      }
    })
  } catch (err) {
    next(err)
  }
}
