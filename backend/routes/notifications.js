import { Router } from 'express'
import { getNotifications } from '../controllers/notificationController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

router.use(authenticateToken)
router.get('/', getNotifications)

export default router
