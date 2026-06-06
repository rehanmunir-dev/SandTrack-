import React from 'react'

export default function EmptyState({ icon = 'folder_open', title = 'No data found', message, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <span className="material-symbols-outlined mb-3 text-4xl text-slate-400 sm:text-5xl">
        {icon}
      </span>
      <h3 className="font-headline text-base font-extrabold text-slate-900 sm:text-lg">{title}</h3>
      {message && (
        <p className="mt-1 max-w-sm text-sm font-medium leading-6 text-slate-600">
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
