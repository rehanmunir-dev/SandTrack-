import { Router } from 'express'
import { body } from 'express-validator'
import {
  getConsignments,
  getConsignmentById,
  getConsignmentFullDetail,
  createConsignment,
  updateConsignmentStatus,
  generateConsignmentQr,
  verifyConsignmentQr,
  getPublicQrPass,
  clearConsignmentGate,
  markConsignmentArrived,
  verifyConsignmentDelivery,
  flagConsignment
} from '../controllers/consignmentController.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { activityLogger } from '../middleware/activityLogger.js'
import { validateRequest } from '../middleware/validate.js'

const router = Router()

router.get('/qr-pass/:token', getPublicQrPass)

router.use(authenticateToken)

router.get('/', getConsignments)
router.get('/verify-qr/:token', authorizeRoles('WATCHMAN'), activityLogger, verifyConsignmentQr)
router.get('/:id/full-detail', getConsignmentFullDetail)
router.get('/:id', getConsignmentById)

// OPERATORS manage dispatches
router.post(
  '/',
  [
    authorizeRoles('OPERATOR'),
    body('driverId').isInt().withMessage('Driver ID must be an integer'),
    body('truckId').isInt().withMessage('Truck ID must be an integer'),
    body('weightTons').isDecimal().withMessage('Weight in tons must be a decimal value'),
    body('materialType').optional().trim(),
    body('originLocation').optional().trim(),
    body('destination').optional().trim(),
    validateRequest,
    activityLogger
  ],
  createConsignment
)

router.patch(
  '/:id/status',
  [
    authorizeRoles('OPERATOR', 'SUPER_ADMIN'),
    body('status').isIn(['SCAN_PENDING', 'IN_TRANSIT', 'ARRIVED', 'DELIVERY_PENDING_VERIFICATION', 'DELIVERED', 'BILLED', 'CLOSED', 'FLAGGED', 'CANCELLED']).withMessage('Invalid consignment status'),
    validateRequest,
    activityLogger
  ],
  updateConsignmentStatus
)

router.post('/:id/qr', authorizeRoles('OPERATOR'), activityLogger, generateConsignmentQr)
router.post('/:id/clear-gate', [
  authorizeRoles('WATCHMAN', 'SUPER_ADMIN'),
  body('qrToken').trim().notEmpty().withMessage('QR token is required'),
  validateRequest,
  activityLogger
], clearConsignmentGate)

router.patch('/:id/mark-arrived', authorizeRoles('ACCOUNTANT', 'SUPER_ADMIN'), activityLogger, markConsignmentArrived)
router.patch('/:id/verify-delivery', authorizeRoles('ACCOUNTANT', 'SUPER_ADMIN'), activityLogger, verifyConsignmentDelivery)

// Operators flag mismatches manually
router.patch(
  '/:id/flag',
  [
    authorizeRoles('OPERATOR', 'WATCHMAN', 'SUPER_ADMIN'),
    body('reason').trim().notEmpty().withMessage('Reason for flagging is required'),
    validateRequest,
    activityLogger
  ],
  flagConsignment
)

export default router
