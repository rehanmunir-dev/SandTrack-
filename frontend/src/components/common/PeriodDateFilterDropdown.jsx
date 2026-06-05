import { useMemo, useState } from 'react'
import { hasDateRange, normalizeDateRange } from '../../utils/dateRange'

export default function PeriodDateFilterDropdown({
  periodValue,
  onPeriodChange,
  dateRange,
  onDateRangeChange,
  options,
  label = 'Range',
}) {
  const [open, setOpen] = useState(false)

  const selectedLabel = useMemo(() => {
    return options.find((option) => option.value === periodValue)?.label || periodValue
  }, [options, periodValue])

  const customSummary = useMemo(() => {
    if (!hasDateRange(dateRange)) {
      return 'No custom date'
    }

    if (dateRange.from && dateRange.to) {
      return `${dateRange.from} to ${dateRange.to}`
    }

    if (dateRange.from) {
      return `From ${dateRange.from}`
    }

    return `Until ${dateRange.to}`
  }, [dateRange])

  function updateDateField(key, nextValue) {
    const nextRange = normalizeDateRange({
      from: key === 'from' ? nextValue : dateRange.from || '',
      to: key === 'to' ? nextValue : dateRange.to || '',
    })

    onDateRangeChange(nextRange)
  }

  function clearCustomRange() {
    onDateRangeChange({ from: '', to: '' })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex w-full items-center justify-between rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface"
      >
        <span>{label}: {selectedLabel}</span>
        <span className="material-symbols-outlined text-base">expand_more</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3 shadow-xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Preset Range</p>
          <div className="grid grid-cols-1 gap-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onPeriodChange(option.value)}
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium ${periodValue === option.value ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface'}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-outline-variant/20 pt-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Custom Date</p>
            <p className="mb-2 text-xs text-on-surface-variant">{customSummary}</p>
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">From</label>
                <input
                  type="date"
                  value={dateRange.from || ''}
                  onChange={(event) => updateDateField('from', event.target.value)}
                  max={dateRange.to || undefined}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">To</label>
                <input
                  type="date"
                  value={dateRange.to || ''}
                  onChange={(event) => updateDateField('to', event.target.value)}
                  min={dateRange.from || undefined}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={clearCustomRange}
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