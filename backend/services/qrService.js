import crypto from 'crypto'
import QRCode from 'qrcode'

export function generateQrToken() {
  return crypto.randomUUID()
}

export async function generateQrImage(text) {
  try {
    const dataUrl = await QRCode.toDataURL(text)
    return dataUrl
  } catch (error) {
    console.error('Error generating QR code base64 image:', error)
    throw error
  }
}
