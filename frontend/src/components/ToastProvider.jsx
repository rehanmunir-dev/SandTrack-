import React from 'react'
import toast, { Toaster } from 'react-hot-toast'

export const useToast = () => ({
  success: (msg) => toast.success(msg),
  error: (msg) => toast.error(msg),
  loading: (msg) => toast.loading(msg),
  dismiss: () => toast.dismiss()
})

export default function ToastProvider({ children }) {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#191b22',
            borderRadius: '12px',
            border: '1px solid rgba(225, 226, 236, 0.5)',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif shadow-sm',
          },
          success: {
            duration: 3000,
          },
          error: {
            duration: 5000,
          }
        }}
      />
      {children}
    </>
  )
}
