import React, { useState, useMemo, useEffect } from 'react'
import SectionCard from '../../components/common/SectionCard'
import { useRoleSystem } from '../../context/roleSystem/RoleSystemContext'
import RoleBadge from '../../components/RoleBadge'
import EmptyState from '../../components/EmptyState'
import PeriodDateFilterDropdown from '../../components/common/PeriodDateFilterDropdown'
import { isInDateRange } from '../../utils/dateRange'

const ROLE_OPTIONS = [
  { value: 'ALL', label: 'All Staff Roles' },
  { value: 'operator', label: 'Terminal Operators' },
  { value: 'accountant', label: 'Accountants' },
  { value: 'watchman', label: 'Watchmen' },
]

const PAGE_SIZE = 20

export default function StaffActivityLogPage() {
  const { activityLogs } = useRoleSystem()

  // State
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [periodFilter, setPeriodFilter] = useState('30d')
  const [currentPage, setCurrentPage] = useState(1)

  // Document Title
  useEffect(() => {
    document.title = 'SandTrack — Global Staff Activity Log'
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
  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      // 1. Role Filter
      if (roleFilter !== 'ALL') {
        const normalizedRole = String(log.role || '').toLowerCase()
        if (normalizedRole !== roleFilter.toLowerCase()) {
          return false
        }
      }

      // 2. Date Range / Period Filter
      if (dateRange.from || dateRange.to) {
        if (!isInDateRange(log.timestamp, dateRange)) {
          return false
        }
      } else {
        if (!isInsidePeriod(log.timestamp, periodFilter)) {
          return false
        }
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchAction = String(log.action || '').toLowerCase().includes(q)
        const matchActor = String(log.actor || '').toLowerCase().includes(q)
        const matchDetails = String(log.details || '').toLowerCase().includes(q)
        if (!matchAction && !matchActor && !matchDetails) {
          return false
        }
      }

      return true
    })
  }, [activityLogs, roleFilter, searchQuery, dateRange, periodFilter])

  const hasActiveFilters = roleFilter !== 'ALL' || searchQuery.trim() !== '' || dateRange.from !== '' || dateRange.to !== ''

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE))
  const pageStartIndex = (currentPage - 1) * PAGE_SIZE
  const pageEndIndex = Math.min(pageStartIndex + PAGE_SIZE, filteredLogs.length)
  const paginatedLogs = filteredLogs.slice(pageStartIndex, pageEndIndex)
  const visiblePageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  useEffect(() => {
    setCurrentPage(1)
  }, [roleFilter, searchQuery, dateRange, periodFilter])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleClearFilters = () => {
    setRoleFilter('ALL')
    setSearchQuery('')
    setDateRange({ from: '', to: '' })
    setPeriodFilter('30d')
    setCurrentPage(1)
  }

  const formatLogDate = (iso) => {
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
          Global Staff Activity Audit
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">
          Complete transparent real-time security tracking logs of terminal events, watchman entries, and accountant ledger dispatches.
        </p>
      </div>

      {/* Filters Bar */}
      <SectionCard 
        title="Audit Feed Settings" 
        subtitle="Search and trace staff activities by roles, periods, and keywords."
        right={
          hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="rounded-lg bg-surface-container-high px-3 py-1.5 text-xs font-bold text-primary hover:bg-surface-container-highest flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">filter_alt_off</span>
              Clear Active Filters
            </button>
          )
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          
          {/* Keyword Search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Search Keywords</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actions, names..."
              className="w-full rounded-xl border border-outline-variant bg-surface-container-highest px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Role Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Staff Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-highest px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20"
            >
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Audit Time Window</label>
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
              label="Select window"
            />
          </div>

        </div>
      </SectionCard>

      {/* Audit List Feed */}
      <SectionCard 
        title="Security Audit Feed" 
        subtitle={
          filteredLogs.length > 0
            ? `Displaying ${pageStartIndex + 1}-${pageEndIndex} of ${filteredLogs.length} activity entries`
            : 'Displaying 0 activity entries'
        }
      >
        {filteredLogs.length === 0 ? (
          <EmptyState
            icon="event_note"
            title="No activity matches filters"
            message="Change your search queries or dates to display past logs."
            actionLabel={hasActiveFilters ? "Reset Filters" : null}
            onAction={hasActiveFilters ? handleClearFilters : null}
          />
        ) : (
          <div className="space-y-4">
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
              {paginatedLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="app-card border-outline-variant/10 bg-surface-container-low p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-headline text-base font-bold text-on-background">{log.action}</h3>
                      <RoleBadge role={log.role} />
                    </div>
                    <div className="rounded-lg bg-surface-container-highest p-3 border border-outline-variant/15 font-mono text-xs text-on-surface-variant">
                      {log.details}
                    </div>
                  </div>

                  <div className="text-left md:text-right flex-shrink-0 space-y-1">
                    <p className="text-sm font-bold text-primary flex items-center gap-1 md:justify-end">
                      <span className="material-symbols-outlined text-base">person</span>
                      {log.actor}
                    </p>
                    <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1 md:justify-end">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {formatLogDate(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/15 pt-4">
                <p className="text-xs font-semibold text-on-surface-variant">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {visiblePageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition-colors ${
                        currentPage === page
                          ? 'bg-primary text-white'
                          : 'border border-outline-variant text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </SectionCard>

    </div>
  )
}
