import express from 'express'
import { 
  getDrivers as getAllDrivers,
  getDrivers, 
  registerDriver, 
  getDriverById,
  approveDriver,
  updateDriver,
  flagDriver
} from '../controllers/driverController.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { uploadMiddleware } from '../middleware/upload.js'
import { activityLogger } from '../middleware/activityLogger.js'

const router = express.Router()

router.get('/', authenticateToken, getAllDrivers || getDrivers)
router.post('/', authenticateToken, 
  authorizeRoles('OPERATOR', 'SUPER_ADMIN'),
  uploadMiddleware.single('facePhoto'),
  activityLogger,
  registerDriver
)
router.get('/:id', authenticateToken, getDriverById)
router.patch('/:id/approve', authenticateToken,
  authorizeRoles('SUPER_ADMIN'), activityLogger, approveDriver
)
router.patch('/:id', authenticateToken,
  authorizeRoles('OPERATOR', 'SUPER_ADMIN'), activityLogger, updateDriver
)
router.patch('/:id/flag', authenticateToken,
  authorizeRoles('WATCHMAN', 'SUPER_ADMIN', 'OPERATOR'), activityLogger, flagDriver
)

export default router
