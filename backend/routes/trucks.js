import express from 'express'
import {
  getTrucks as getAllTrucks,
  getTrucks,
  registerTruck,
  getTruckById,
  approveTruck,
  updateTruck,
  flagTruck
} from '../controllers/truckController.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { activityLogger } from '../middleware/activityLogger.js'

const router = express.Router()

router.get('/', authenticateToken, getAllTrucks || getTrucks)
router.post('/', authenticateToken,
  authorizeRoles('OPERATOR', 'SUPER_ADMIN'),
  activityLogger,
  registerTruck
)
router.get('/:id', authenticateToken, getTruckById)
router.patch('/:id/approve', authenticateToken,
  authorizeRoles('SUPER_ADMIN'), activityLogger, approveTruck
)
router.patch('/:id', authenticateToken,
  authorizeRoles('OPERATOR', 'SUPER_ADMIN'), activityLogger, updateTruck
)
router.patch('/:id/flag', authenticateToken,
  authorizeRoles('WATCHMAN', 'SUPER_ADMIN', 'OPERATOR'), activityLogger, flagTruck
)

export default router
