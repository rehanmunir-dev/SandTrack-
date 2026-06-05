import { Router } from 'express'
import {
  closeConsignmentLedger,
  getLedgerEntries,
  getLedgerEntriesByConsignment
} from '../controllers/ledgerController.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { activityLogger } from '../middleware/activityLogger.js'

const router = Router()

router.use(authenticateToken)

router.get('/', authorizeRoles('ACCOUNTANT', 'SUPER_ADMIN'), getLedgerEntries)
router.get('/consignment/:id', authorizeRoles('ACCOUNTANT', 'SUPER_ADMIN'), getLedgerEntriesByConsignment)
router.post('/close-consignment/:id', authorizeRoles('ACCOUNTANT', 'SUPER_ADMIN'), activityLogger, closeConsignmentLedger)

export default router
