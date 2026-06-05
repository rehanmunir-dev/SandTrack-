import jwt from 'jsonwebtoken'

function getAccessSecret() {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET is required')
  }
  return process.env.JWT_ACCESS_SECRET
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.token

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token is missing or invalid' })
  }

  jwt.verify(token, getAccessSecret(), (err, user) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Token is expired or invalid' })
    }
    req.user = user
    next()
  })
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized access for this user role' })
    }
    next()
  }
}
