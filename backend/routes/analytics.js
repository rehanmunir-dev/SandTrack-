import { Router } from 'express'
import {
  getSummaryStats,
  getPaymentsByMethod,
  getDailyRevenue
} from '../controllers/analyticsController.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

// Analytics restricted entirely to SUPER_ADMIN (CEO)
router.use(authenticateToken)
router.use(authorizeRoles('SUPER_ADMIN'))

router.get('/summary', getSummaryStats)
router.get('/payments-by-method', getPaymentsByMethod)
router.get('/daily-revenue', getDailyRevenue)

export default router
