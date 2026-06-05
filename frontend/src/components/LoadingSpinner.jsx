import React from 'react'

export default function LoadingSpinner({ size = 'md', label }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  const loaderSize = sizeClasses[size] || sizeClasses.md

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div 
        className={`animate-spin rounded-full border-t-primary border-outline-variant/35 ${loaderSize}`} 
      />
      {label && (
        <p className="mt-3 text-xs sm:text-sm font-semibold text-on-surface-variant animate-pulse">
          {label}
        </p>
      )}
    </div>
  )
}
