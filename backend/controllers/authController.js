import pool from '../db/pool.js'
import crypto from 'crypto'
import fs from 'fs/promises'
import {
  generateAccessToken,
  generateRefreshToken,
  comparePassword,
  hashPassword
} from '../services/authService.js'

function toClientUser(user, accessToken) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.full_name,
    phone: user.phone,
    isActive: user.is_active,
    profilePictureUrl: user.profile_picture_url,
    ...(accessToken ? { accessToken } : {})
  }
}

export async function login(req, res, next) {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      })
    }

    // Find user in database
    const result = await pool.query(
      `SELECT id, username, password_hash, role,
              full_name, phone, is_active, profile_picture_url
       FROM users
       WHERE username = $1`,
      [username.trim().toLowerCase()]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      })
    }

    const user = result.rows[0]

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact your administrator.'
      })
    }

    // Verify password
    const passwordMatch = await comparePassword(password, user.password_hash)

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      })
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    return res.json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      accessToken: accessToken,
      user: toClientUser(user)
    })

  } catch (err) {
    console.error('Login error:', err)
    next(err)
  }
}

export async function logout(req, res, next) {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
    return res.status(200).json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    next(error)
  }
}

export async function refresh(req, res, next) {
  const refreshToken = req.cookies?.refreshToken

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token is missing' })
  }

  try {
    const jwtSecret = process.env.JWT_REFRESH_SECRET

    if (!jwtSecret) {
      throw new Error('JWT_REFRESH_SECRET is required')
    }
    
    // Verify refresh token
    const decoded = await new Promise((resolve, reject) => {
      import('jsonwebtoken').then(jwt => {
        jwt.default.verify(refreshToken, jwtSecret, (err, decoded) => {
          if (err) reject(err)
          else resolve(decoded)
        })
      })
    })

    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1 AND is_active = true', [decoded.id])
    const user = rows[0]

    if (!user) {
      return res.status(403).json({ success: false, message: 'User not found or suspended' })
    }

    const accessToken = generateAccessToken(user)
    return res.status(200).json({ success: true, accessToken, user: toClientUser(user, accessToken) })
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' })
  }
}

export async function updateProfilePicture(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Profile picture is required' })
    }

    const profilePictureUrl = `/uploads/${req.file.filename}`
    const { rows } = await pool.query(
      `UPDATE users
       SET profile_picture_url = $1
       WHERE id = $2 AND is_active = true
       RETURNING id, username, role, full_name, phone, is_active, profile_picture_url`,
      [profilePictureUrl, req.user.id]
    )

    if (rows.length === 0) {
      await fs.unlink(req.file.path).catch(() => {})
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const user = rows[0]
    return res.json({
      success: true,
      message: 'Profile picture updated successfully',
      user: toClientUser(user)
    })
  } catch (err) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {})
    }
    next(err)
  }
}

export async function forgotPassword(req, res, next) {
  const { username } = req.body

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' })
  }

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username])
    const user = rows[0]

    if (!user) {
      // Avoid enumerating usernames, return generic success
      return res.status(200).json({ success: true, message: 'If this user exists, reset instructions have been prepared.' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, expires, user.id]
    )

    return res.status(200).json({
      success: true,
      message: 'If this user exists, reset instructions have been prepared.'
    })
  } catch (error) {
    next(error)
  }
}

export async function resetPassword(req, res, next) {
  const { token, newPassword } = req.body

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and newPassword are required' })
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    )
    const user = rows[0]

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or has expired' })
    }

    const hashed = await hashPassword(newPassword)

    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashed, user.id]
    )

    return res.status(200).json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    next(error)
  }
}
