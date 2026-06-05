import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PermissionGate from '../../components/rbac/PermissionGate'
import StatusBadge from '../../components/common/StatusBadge'
import PeriodDateFilterDropdown from '../../components/common/PeriodDateFilterDropdown'
import { useAppState } from '../../context/AppStateContext'
import { useAuth } from '../../context/AuthContext'
import { PERMISSIONS } from '../../rbac/permissions'
import { CONSIGNMENT_TRANSITIONS } from '../../constants/statusModels'
import { isInDateRange } from '../../utils/dateRange'

const TAB_FILTERS = {
  active: ['CREATED', 'LOADED', 'IN_TRANSIT', 'AT_GATE', 'VERIFIED_FOR_RELEASE'],
  flagged: ['FLAGGED'],
  delivered: ['DELIVERED', 'CLOSED'],
}

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const createInitialForm = () => ({
  receiptId: '',
  terminal: '',
  vehicleNo: '',
  driverName: '',
  destination: '',
  sourceMine: '',
  amountDue: '',
  sourceWeight: '',
})

export default function ConsignmentsPage() {
  const navigate = useNavigate()
  const { currentUser, can } = useAuth()
  const {
    consignments,
    filters,
    setFilter,
    createConsignment,
    transitionConsignment,
  } = useAppState()

  const [form, setForm] = useState(createInitialForm)
  const [notice, setNotice] = useState('')
  const [periodFilter, setPeriodFilter] = useState('daily')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const consignmentFilter = filters.consignments

  const filteredRows = useMemo(() => {
    const activeTabStatuses = TAB_FILTERS[consignmentFilter.tab] || null
    const now = Date.now()
    const periodWindowMs =
      periodFilter === 'daily'
        ? 24 * 60 * 60 * 1000
        : periodFilter === 'weekly'
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000

    return consignments.filter((item) => {
      const referenceAt = item.timeline?.[0]?.at || item.timeline?.[item.timeline.length - 1]?.at
      const referenceMs = new Date(referenceAt || Date.now()).getTime()
      const inSelectedPeriod = now - referenceMs <= periodWindowMs
      if (!inSelectedPeriod) {
        return false
      }
      if (!isInDateRange(referenceAt || item.createdAt, dateRange)) {
        return false
      }

      const matchesTab = activeTabStatuses
        ? activeTabStatuses.includes(item.status)
        : true

      const matchesTerminal =
        consignmentFilter.terminal === 'ALL' ||
        item.terminal === consignmentFilter.terminal

      const query = consignmentFilter.search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        item.receiptId.toLowerCase().includes(query) ||
        item.vehicleNo.toLowerCase().includes(query) ||
        item.terminal.toLowerCase().includes(query)

      return matchesTab && matchesTerminal && matchesSearch
    })
  }, [consignments, consignmentFilter, periodFilter, dateRange])

  const terminalOptions = useMemo(() => {
    return ['ALL', ...new Set(consignments.map((item) => item.terminal))]
  }, [consignments])

  function handleCreate(event) {
    event.preventDefault()

    createConsignment({
      ...form,
      actor: currentUser.name,
    })

    setForm(createInitialForm())
    setNotice('Consignment created and QR generated.')
  }

  function handleTransition(consignmentId, nextStatus) {
    transitionConsignment({
      consignmentId,
      nextStatus,
      actor: currentUser.name,
    })
    setNotice(`Status transition requested: ${nextStatus}`)
  }

  const showTerminalChip = consignmentFilter.terminal !== 'ALL'

  return (
    <div className="space-y-8 pb-3">
      <section className="rounded-xl bg-surface-container-low p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Consignments</h2>
            <p className="text-sm font-medium text-on-surface-variant">Dispatch creation and lifecycle tracking</p>
          </div>
          <span className="rounded-full border border-outline-variant/40 bg-surface-container-highest px-3 py-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Active Monitoring
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label htmlFor="consignment-search" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
              Search
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                id="consignment-search"
                value={consignmentFilter.search}
                onChange={(event) => setFilter('consignments', { search: event.target.value })}
                className="w-full rounded-lg border-none bg-surface-container-lowest py-3 pl-12 pr-4 text-sm text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/10"
                placeholder="Search receipt ID / vehicle / terminal"
              />
            </div>
          </div>

          <div>
            <label htmlFor="consignment-terminal" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
              Terminal
            </label>
            <select
              id="consignment-terminal"
              value={consignmentFilter.terminal}
              onChange={(event) => setFilter('consignments', { terminal: event.target.value })}
              className="w-full rounded-lg border-none bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/10"
            >
              {terminalOptions.map((terminal) => (
                <option key={terminal} value={terminal}>
                  {terminal}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="consignment-status" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
              Status View
            </label>
            <select
              id="consignment-status"
              value={consignmentFilter.tab}
              onChange={(event) => setFilter('consignments', { tab: event.target.value })}
              className="w-full rounded-lg border-none bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/10"
            >
              <option value="active">Active</option>
              <option value="flagged">Flagged</option>
              <option value="delivered">Delivered / Closed</option>
            </select>
          </div>

          <div>
            <label htmlFor="consignment-period" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
              Range
            </label>
            <PeriodDateFilterDropdown
              periodValue={periodFilter}
              onPeriodChange={setPeriodFilter}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              options={PERIOD_OPTIONS}
              label="Range"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/20 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="flex items-center gap-2 rounded-lg bg-surface-container-highest px-4 py-2 text-sm font-bold text-on-surface-variant transition-colors hover:bg-outline-variant/70">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Advanced Filters
            </button>
            {showTerminalChip ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
                {consignmentFilter.terminal}
                <button
                  type="button"
                  onClick={() => setFilter('consignments', { terminal: 'ALL' })}
                  className="material-symbols-outlined text-[14px]"
                  aria-label="Clear terminal filter"
                >
                  close
                </button>
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export CSV
            </button>
            <button type="button" className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              Export PDF
            </button>
          </div>
        </div>
      </section>

      <PermissionGate permissions={[PERMISSIONS.CONSIGNMENT_CREATE]}>
        <section className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-headline text-lg font-bold text-on-surface">Create Dispatch / Consignment</h3>
            <p className="text-sm text-on-surface-variant">Operator flow entry point</p>
          </div>

          <form onSubmit={handleCreate} className="max-w-md space-y-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Receipt ID</label>
              <input
                required
                className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 text-sm text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Receipt ID"
                value={form.receiptId}
                onChange={(event) => setForm((prev) => ({ ...prev, receiptId: event.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Terminal</label>
              <input
                required
                className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 text-sm text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Terminal"
                value={form.terminal}
                onChange={(event) => setForm((prev) => ({ ...prev, terminal: event.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Vehicle Number</label>
              <input
                required
                className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 text-sm text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Vehicle"
                value={form.vehicleNo}
                onChange={(event) => setForm((prev) => ({ ...prev, vehicleNo: event.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Driver Name</label>
              <input
                required
                className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 text-sm text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Driver"
                value={form.driverName}
                onChange={(event) => setForm((prev) => ({ ...prev, driverName: event.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Destination</label>
              <input
                required
                className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 text-sm text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Destination"
                value={form.destination}
                onChange={(event) => setForm((prev) => ({ ...prev, destination: event.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Source Mine</label>
              <input
                required
                className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 text-sm text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Source mine"
                value={form.sourceMine}
                onChange={(event) => setForm((prev) => ({ ...prev, sourceMine: event.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Amount Due</label>
              <input
                required
                type="number"
                className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 text-sm text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Amount due"
                value={form.amountDue}
                onChange={(event) => setForm((prev) => ({ ...prev, amountDue: event.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Source Weight (Tons)</label>
              <input
                required
                type="number"
                step="0.1"
                className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 text-sm text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Source weight"
                value={form.sourceWeight}
                onChange={(event) => setForm((prev) => ({ ...prev, sourceWeight: event.target.value }))}
              />
            </div>

            <button className="w-full rounded-lg bg-gradient-to-br from-primary to-primary-container px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.98]">
              Create Consignment
            </button>
          </form>
        </section>
      </PermissionGate>

      {notice ? (
        <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {notice}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
        <div className="app-table-scroll">
          <table className="app-table border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                <th className="px-6 py-4">Receipt ID</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Terminal</th>
                <th className="px-6 py-4">Logistics</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/40 text-sm">
              {filteredRows.map((item) => {
                const nextStatuses = CONSIGNMENT_TRANSITIONS[item.status] || []
                return (
                  <tr key={item.id} className="group transition-colors hover:bg-surface-container-high">
                    <td className="px-6 py-5">
                      <button
                        type="button"
                        className="font-headline text-base font-bold text-primary hover:underline"
                        onClick={() => navigate(`/app/consignments/${item.id}`)}
                      >
                        {item.receiptId}
                      </button>
                      <p className="mt-1 text-xs text-on-surface-variant">{item.driverName}</p>
                    </td>
                    <td className="px-6 py-5 font-semibold text-on-surface">{item.vehicleNo}</td>
                    <td className="px-6 py-5 text-on-surface">{item.terminal}</td>
                    <td className="px-6 py-5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={item.paymentStatus} />
                    </td>
                    <td className="px-6 py-5 text-right">
                      {nextStatuses.length > 0 && can(PERMISSIONS.CONSIGNMENT_TRANSITION) ? (
                        <div className="flex justify-end gap-2 opacity-90 transition-opacity group-hover:opacity-100">
                          {nextStatuses.map((nextStatus) => (
                            <button
                              key={nextStatus}
                              type="button"
                              onClick={() => handleTransition(item.id, nextStatus)}
                              className="rounded-lg border border-outline-variant bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:border-primary/30 hover:text-primary"
                            >
                              {nextStatus}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-on-surface-variant/70">No transition</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-surface-variant/30 bg-surface-container-low px-6 py-4">
          <span className="text-xs font-medium text-on-surface-variant">
            Showing 1 to {filteredRows.length} of {filteredRows.length} consignments
          </span>
          <div className="flex gap-2">
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-highest">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button type="button" className="h-8 w-8 rounded bg-primary text-xs font-bold text-white">1</button>
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-highest">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
