import bcrypt from 'bcryptjs'

// Generates a readable username from full name
// Example: "Muhammad Rehan" → "rehan.sand" or "m.rehan"
export const generateUsername = (fullName, role) => {
  const parts = fullName.trim().toLowerCase().split(/\s+/)
  const last = parts[parts.length - 1]

  const rolePrefix = {
    OPERATOR: 'op',
    DRIVER: 'drv',
    WATCHMAN: 'gate',
    ACCOUNTANT: 'acc',
    SUPER_ADMIN: 'admin'
  }

  const prefix = rolePrefix[role] || 'usr'
  const random = Math.floor(100 + Math.random() * 900)

  // Format: drv.rehan.742
  return `${prefix}.${last}.${random}`
}

// Generates a medium difficulty password
// Format: Word + Number + Symbol
// Example: Sand#4821 or Gate@3374
export const generatePassword = () => {
  const words = [
    'Sand', 'Gate', 'Load', 'Trip', 'Haul',
    'Dust', 'Rock', 'Road', 'Port', 'Yard'
  ]
  const symbols = ['#', '@', '!', '$']
  const word = words[Math.floor(Math.random() * words.length)]
  const symbol = symbols[Math.floor(Math.random() * symbols.length)]
  const number = Math.floor(1000 + Math.random() * 9000)

  // Example: Sand#4821
  return `${word}${symbol}${number}`
}

// Hash a password for database storage
export const hashPassword = async (plainPassword) => {
  return await bcrypt.hash(plainPassword, 10)
}

// Verify password on login
export const verifyPassword = async (plain, hashed) => {
  return await bcrypt.compare(plain, hashed)
}

// Check if username already exists and make it unique
export const ensureUniqueUsername = async (username, dbClient) => {
  const result = await dbClient.query(
    'SELECT id FROM users WHERE username = $1',
    [username]
  )
  if (result.rows.length === 0) return username

  // Add extra random digits if taken
  const extra = Math.floor(10 + Math.random() * 90)
  return `${username}${extra}`
}
