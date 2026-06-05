import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

export function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, fullName: user.full_name },
    getRequiredEnv('JWT_ACCESS_SECRET'),
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  )
}

export function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    getRequiredEnv('JWT_REFRESH_SECRET'),
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  )
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(password, hash) {
  const match = await bcrypt.compare(password, hash)
  return match
}
