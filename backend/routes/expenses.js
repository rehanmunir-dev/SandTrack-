import { Router } from 'express'
import { body } from 'express-validator'
import { getExpenses, createExpense, deleteExpense } from '../controllers/expenseController.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { activityLogger } from '../middleware/activityLogger.js'
import { validateRequest } from '../middleware/validate.js'

const router = Router()

router.use(authenticateToken)

// Accountants record, and Admin can view expense ledgers
router.get('/', authorizeRoles('ACCOUNTANT', 'SUPER_ADMIN'), getExpenses)

router.post(
  '/',
  [
    authorizeRoles('ACCOUNTANT'),
    body('category').isIn(['SALARY', 'PETTY_CASH', 'MAINTENANCE', 'OTHER']).withMessage('Expense category must be SALARY, PETTY_CASH, MAINTENANCE, or OTHER'),
    body('amount').isNumeric().withMessage('Amount must be a numeric value'),
    body('description').optional().trim(),
    validateRequest,
    activityLogger
  ],
  createExpense
)

router.delete('/:id', authorizeRoles('ACCOUNTANT'), activityLogger, deleteExpense)

export default router
