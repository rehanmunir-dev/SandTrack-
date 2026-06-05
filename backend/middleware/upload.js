import multer from 'multer'
import path from 'path'
import { ensureUploadDir, uploadDir } from '../config/uploadPath.js'

ensureUploadDir()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})

function createExtensionFilter(allowedExtensions, message) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()

    if (allowedExtensions.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(message), false)
    }
  }
}

const fileFilter = createExtensionFilter(
  ['.jpg', '.jpeg', '.png', '.pdf'],
  'Only .jpg, .jpeg, .png, and .pdf files are allowed!'
)

const imageFileFilter = createExtensionFilter(
  ['.jpg', '.jpeg', '.png'],
  'Only .jpg, .jpeg, and .png image files are allowed!'
)

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

export const uploadMiddleware = upload

export const imageUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
})
