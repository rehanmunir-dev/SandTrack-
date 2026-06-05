import { Router } from 'express'
import { body } from 'express-validator'
import {
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  updateProfilePicture
} from '../controllers/authController.js'
import { authenticateToken } from '../middleware/auth.js'
import { imageUpload } from '../middleware/upload.js'
import { validateRequest } from '../middleware/validate.js'

const router = Router()

router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').trim().notEmpty().withMessage('Password is required'),
    validateRequest
  ],
  login
)

router.post('/logout', logout)

router.post('/refresh', refresh)

router.patch(
  '/profile-picture',
  authenticateToken,
  imageUpload.single('profilePicture'),
  updateProfilePicture
)

router.post(
  '/forgot-password',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    validateRequest
  ],
  forgotPassword
)

router.post(
  '/reset-password',
  [
    body('token').trim().notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 4 }).withMessage('Password must be at least 4 characters long'),
    validateRequest
  ],
  resetPassword
)

export default router
