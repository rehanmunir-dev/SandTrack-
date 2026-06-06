import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

// Database pool
import pool from './db/pool.js'

// Import Middlewares
import { errorHandler } from './middleware/errorHandler.js'
import { ensureUploadDir, uploadDir } from './config/uploadPath.js'

// Import Routes
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import driverRoutes from './routes/drivers.js'
import truckRoutes from './routes/trucks.js'
import consignmentRoutes from './routes/consignments.js'
import paymentRoutes from './routes/payments.js'
import expenseRoutes from './routes/expenses.js'
import gateLogRoutes from './routes/gateLogs.js'
import activityLogRoutes from './routes/activityLogs.js'
import analyticsRoutes from './routes/analytics.js'
import ledgerRoutes from './routes/ledger.js'
import notificationRoutes from './routes/notifications.js'

const app = express()
const PORT = process.env.PORT || 5000
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL is required in production')
}

// Ensure upload and static directories exist
ensureUploadDir()

// CORS Config
app.use(cors({
  origin: frontendUrl,
  credentials: true
}))

// Standard Parsing Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Serve static uploaded files
app.use('/uploads', express.static(uploadDir))

// Health Endpoint returning DB Connection status
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    return res.status(200).json({
      status: 'ok',
      db: 'connected'
    })
  } catch (err) {
    console.error('Database connection failed in health check:', err)
    return res.status(503).json({
      status: 'error',
      db: 'disconnected',
      error: err.message
    })
  }
})

// Wire up routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/drivers', driverRoutes)
app.use('/api/trucks', truckRoutes)
app.use('/api/consignments', consignmentRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/gate-logs', gateLogRoutes)
app.use('/api/activity-logs', activityLogRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/ledger', ledgerRoutes)
app.use('/api/notifications', notificationRoutes)

// Fallback Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' })
})

// Global Error Handler Middleware
app.use(errorHandler)

let server
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`[SANDTRACK BACKEND] running on http://localhost:${PORT}`)
    console.log(`Environment Mode: ${process.env.NODE_ENV || 'development'}`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${PORT} is already in use. Kill the process using that port and restart.`
      )
      process.exit(1)
    }
  })
}

export default app
