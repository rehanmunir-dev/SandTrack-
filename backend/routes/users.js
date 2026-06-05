import { Router } from 'express'
import { body } from 'express-validator'
import {
  getAllUsers,
  createUser,
  toggleUserStatus,
  resetUserPassword,
  deleteUser
} from '../controllers/userController.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { activityLogger } from '../middleware/activityLogger.js'
import { validateRequest } from '../middleware/validate.js'

const router = Router()

// All user management is SUPER_ADMIN only
router.use(authenticateToken)
router.use(authorizeRoles('SUPER_ADMIN'))

router.get('/', getAllUsers)

router.post(
  '/',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('role').isIn(['OPERATOR', 'DRIVER', 'WATCHMAN', 'ACCOUNTANT']).withMessage('Invalid staff role'),
    body('phone').optional().trim(),
    validateRequest,
    activityLogger
  ],
  createUser
)

router.patch(
  '/:id/status',
  [
    body('isActive').isBoolean().withMessage('isActive must be a boolean value'),
    validateRequest,
    activityLogger
  ],
  toggleUserStatus
)

router.post(
  '/:id/reset-password',
  activityLogger,
  resetUserPassword
)

router.delete(
  '/:id',
  activityLogger,
  deleteUser
)

export default router
