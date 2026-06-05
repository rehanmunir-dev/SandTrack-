import React, { useState, useEffect } from 'react'

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  showInput = false,
  inputPlaceholder = 'Enter reason here...',
  requiredInput = false
}) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setInputValue('')
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (showInput && requiredInput && !inputValue.trim()) {
      setError('This field is required.')
      return
    }
    onConfirm(showInput ? inputValue : null)
  }

  const variantClasses = {
    danger: 'bg-error text-white hover:bg-error/95',
    success: 'bg-tertiary text-white hover:bg-tertiary/95',
    primary: 'bg-primary text-on-primary hover:bg-primary/95',
  }

  const btnClass = variantClasses[confirmVariant] || variantClasses.primary

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-surface-container-lowest p-6 shadow-xl transition-all border border-outline-variant/15">
        <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-3">
          <span className="material-symbols-outlined text-2xl text-primary">
            {confirmVariant === 'danger' ? 'warning' : 'help'}
          </span>
          <h3 className="font-headline text-lg font-bold text-on-background">{title}</h3>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
            {message}
          </p>

          {showInput && (
            <div className="mt-4">
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  if (e.target.value.trim()) setError('')
                }}
                placeholder={inputPlaceholder}
                className="w-full min-h-[90px] rounded-xl border border-outline-variant bg-surface-container-highest px-3 py-2 text-sm text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                rows={3}
              />
              {error && (
                <p className="mt-1 text-xs text-error font-semibold">{error}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-outline-variant/15 pt-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-high"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] ${btnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
