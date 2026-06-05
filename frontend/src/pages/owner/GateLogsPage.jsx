import React, { useState, useMemo, useEffect } from 'react'
import SectionCard from '../../components/common/SectionCard'
import { useRoleSystem } from '../../context/roleSystem/RoleSystemContext'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import PeriodDateFilterDropdown from '../../components/common/PeriodDateFilterDropdown'
import { isInDateRange } from '../../utils/dateRange'

const RESULT_OPTIONS = [
  { value: 'ALL', label: 'All Scan Results' },
  { value: 'valid', label: 'Valid / Cleared' },
  { value: 'used', label: 'Used / Duplicate' },
  { value: 'invalid', label: 'Invalid / Flagged Fraud' },
]

export default function GateLogsPage() {
  const { scans } = useRoleSystem()

  // State
  const [resultFilter, setResultFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [periodFilter, setPeriodFilter] = useState('30d')

  // Document Title
  useEffect(() => {
    document.title = 'SandTrack — Gate Verification Logs'
  }, [])

  // Check if dates are inside selected period helper
  const isInsidePeriod = (isoDate, period) => {
    if (!isoDate) return false
    const createdAt = new Date(isoDate).getTime()
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000

    const daysMap = {
      daily: 1,
      '7d': 7,
      '14d': 14,
      '30d': 30,
    }

    const days = daysMap[period] || 30
    return createdAt >= now - days * oneDay
  }

  // Filtered Logs
  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      // 1. Result Status Filter
      if (resultFilter !== 'ALL') {
        const normalizedResult = String(scan.result || '').toLowerCase()
        if (normalizedResult !== resultFilter.toLowerCase()) {
          return false
        }
      }

      // 2. Date Range / Period Filter
      if (dateRange.from || dateRange.to) {
        if (!isInDateRange(scan.createdAt, dateRange)) {
          return false
        }
      } else {
        if (!isInsidePeriod(scan.createdAt, periodFilter)) {
          return false
        }
      }

      // 3. Search Query (QR code or Watchman name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchQR = String(scan.qrCode || '').toLowerCase().includes(q)
        const matchActor = String(scan.actor || '').toLowerCase().includes(q)
        const matchGate = String(scan.gateName || '').toLowerCase().includes(q)
        if (!matchQR && !matchActor && !matchGate) {
          return false
        }
      }

      return true
    })
  }, [scans, resultFilter, searchQuery, dateRange, periodFilter])

  const hasActiveFilters = resultFilter !== 'ALL' || searchQuery.trim() !== '' || dateRange.from !== '' || dateRange.to !== ''

  const handleClearFilters = () => {
    setResultFilter('ALL')
    setSearchQuery('')
    setDateRange({ from: '', to: '' })
    setPeriodFilter('30d')
  }

  const formatScanDate = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-outline-variant/10 pb-4">
        <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-background tracking-tight">
          Gate Verification Ledger
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">
          Detailed security logging of physical terminal gate operations, driver check-ins, and anti-fraud scans.
        </p>
      </div>

      {/* Filters Bar */}
      <SectionCard 
        title="Verification Filter" 
        subtitle="Search and trace scans by results, periods, and keywords."
        right={
          hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="rounded-lg bg-surface-container-high px-3 py-1.5 text-xs font-bold text-primary hover:bg-surface-container-highest flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">filter_alt_off</span>
              Clear Filters
            </button>
          )
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          
          {/* Keyword Search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Search Scanner</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search QR, watchman, gate..."
              className="w-full rounded-xl border border-outline-variant bg-surface-container-highest px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Result Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Scan Outcome</label>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-highest px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20"
            >
              {RESULT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Logging Time Frame</label>
            <PeriodDateFilterDropdown
              periodValue={periodFilter}
              onPeriodChange={setPeriodFilter}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              options={[
                { value: 'daily', label: 'Daily (Last 24 Hours)' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '14d', label: 'Last 14 Days' },
                { value: '30d', label: 'Last 30 Days' },
              ]}
              label="Select frame"
            />
          </div>

        </div>
      </SectionCard>

      {/* Main Ledger Table */}
      <SectionCard 
        title="Gate Scanner Activity Log" 
        subtitle={`Displaying ${filteredScans.length} verification scans`}
      >
        {filteredScans.length === 0 ? (
          <EmptyState
            icon="document_scanner"
            title="No scan records matched"
            message="Change your search queries or dates to display logs."
            actionLabel={hasActiveFilters ? "Reset Filters" : null}
            onAction={hasActiveFilters ? handleClearFilters : null}
          />
        ) : (
          <div className="app-table-scroll rounded-2xl border border-outline-variant/15">
            <table className="app-table border-collapse text-left">
              <thead className="bg-surface-container-high text-on-surface-variant uppercase text-[10px] font-bold tracking-widest border-b border-outline-variant/15">
                <tr>
                  <th className="px-4 py-3.5">Scanned QR Code</th>
                  <th className="px-4 py-3.5">Check-in Location</th>
                  <th className="px-4 py-3.5">Scan Outcome</th>
                  <th className="px-4 py-3.5">Verified By</th>
                  <th className="px-4 py-3.5 text-right">Check-in Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-sm">
                {filteredScans.map((scan) => {
                  const isInvalid = String(scan.result).toLowerCase() === 'invalid'
                  return (
                    <tr 
                      key={scan.id} 
                      className={`transition-colors ${
                        isInvalid 
                          ? 'bg-error-container/10 hover:bg-error-container/20 border-l-4 border-l-error' 
                          : 'hover:bg-surface-container-lowest'
                      }`}
                    >
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-on-surface-variant break-all">
                        {scan.qrCode}
                        {isInvalid && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-[9px] font-extrabold text-error bg-error-container px-1.5 py-0.5 rounded uppercase">
                            ⚠️ Threat Blocked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-on-surface">
                        {scan.gateName || 'Main Gate'}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={scan.result} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 font-medium text-primary">
                        {scan.actor}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-on-surface-variant">
                        {formatScanDate(scan.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

    </div>
  )
}
