import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const configDir = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(configDir, '..')
const configuredUploadDir = process.env.UPLOAD_DIR || 'uploads'

export const uploadDir = path.isAbsolute(configuredUploadDir)
  ? configuredUploadDir
  : path.resolve(backendRoot, configuredUploadDir)

export function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
}
