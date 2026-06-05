import React from 'react'

export default function EmptyState({ icon = 'folder_open', title = 'No data found', message, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-lowest/50">
      <span className="material-symbols-outlined text-4xl sm:text-5xl text-outline/65 mb-3">
        {icon}
      </span>
      <h3 className="font-headline text-base sm:text-lg font-bold text-on-background">{title}</h3>
      {message && (
        <p className="mt-1 text-xs sm:text-sm font-medium text-on-surface-variant max-w-sm">
          {message}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 app-btn-secondary px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm font-bold">add</span>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
