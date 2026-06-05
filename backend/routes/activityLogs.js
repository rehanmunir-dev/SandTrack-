import { Router } from 'express'
import { getActivityLogs } from '../controllers/activityLogController.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

// Only Super Admins (CEOs) can monitor staff activities
router.use(authenticateToken)
router.use(authorizeRoles('SUPER_ADMIN'))

router.get('/', getActivityLogs)

export default router
