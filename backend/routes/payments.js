import { Router } from 'express'
import { body } from 'express-validator'
import {
  getPayments,
  getPaymentById,
  submitPayment,
  verifyPayment,
  flagPayment,
  updatePaymentDetails
} from '../controllers/paymentController.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { activityLogger } from '../middleware/activityLogger.js'
import { upload } from '../middleware/upload.js'
import { validateRequest } from '../middleware/validate.js'

const router = Router()

router.use(authenticateToken)

router.get('/', getPayments)
router.get('/:id', getPaymentById)

// Submit payment (anyone verified, typically driver/operator upload)
router.post(
  '/',
  [
    upload.single('receiptImage'),
    body('consignmentId').isInt().withMessage('Consignment ID must be an integer'),
    body('amount').isNumeric().withMessage('Payment amount must be a number'),
    body('paymentMethod').isIn(['CASH', 'BANK']).withMessage('Payment method must be CASH or BANK'),
    body('notes').optional().trim(),
    validateRequest,
    activityLogger
  ],
  submitPayment
)

// Accountants confirm, flag, or edit payments
router.put('/:id', authorizeRoles('ACCOUNTANT'), activityLogger, updatePaymentDetails)
router.patch('/:id/verify', authorizeRoles('ACCOUNTANT'), activityLogger, verifyPayment)

router.patch(
  '/:id/flag',
  [
    authorizeRoles('ACCOUNTANT'),
    body('notes').trim().notEmpty().withMessage('Explanation notes are required to flag a payment'),
    validateRequest,
    activityLogger
  ],
  flagPayment
)

export default router
