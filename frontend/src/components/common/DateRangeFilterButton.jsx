import { useMemo, useState } from 'react'
import { hasDateRange, normalizeDateRange } from '../../utils/dateRange'

export default function DateRangeFilterButton({ value, onChange, label = 'Custom Date' }) {
  const [open, setOpen] = useState(false)

  const summary = useMemo(() => {
    if (!hasDateRange(value)) {
      return 'Any date'
    }

    if (value.from && value.to) {
      return `${value.from} to ${value.to}`
    }

    if (value.from) {
      return `From ${value.from}`
    }

    return `Until ${value.to}`
  }, [value])

  function updateField(key, nextValue) {
    const nextRange = normalizeDateRange({
      from: key === 'from' ? nextValue : value.from || '',
      to: key === 'to' ? nextValue : value.to || '',
    })

    onChange(nextRange)
  }

  function clearRange() {
    onChange({ from: '', to: '' })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface"
      >
        <span className="material-symbols-outlined text-base">calendar_month</span>
        {label}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3 shadow-xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{summary}</p>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant">From</label>
              <input
                type="date"
                value={value.from || ''}
                onChange={(event) => updateField('from', event.target.value)}
                max={value.to || undefined}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant">To</label>
              <input
                type="date"
                value={value.to || ''}
                onChange={(event) => updateField('to', event.target.value)}
                min={value.from || undefined}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={clearRange}
              className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
