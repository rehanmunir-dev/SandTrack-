import { Router } from 'express'
import { getGateLogs, createGateLog } from '../controllers/gateLogController.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { activityLogger } from '../middleware/activityLogger.js'

const router = Router()

router.use(authenticateToken)

// Admin auds scans, watchmen create them
router.get('/', authorizeRoles('SUPER_ADMIN'), getGateLogs)
router.post('/', authorizeRoles('WATCHMAN'), activityLogger, createGateLog)

export default router
