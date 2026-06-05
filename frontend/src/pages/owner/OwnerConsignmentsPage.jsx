import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import KPIStatCard from '../../components/owner/KPIStatCard'
import OwnerStatusBadge from '../../components/owner/OwnerStatusBadge'
import SearchBar from '../../components/owner/SearchBar'
import EmptyState from '../../components/owner/EmptyState'
import PeriodDateFilterDropdown from '../../components/common/PeriodDateFilterDropdown'
import { useOwnerData } from '../../context/owner/OwnerContext'
import { isInDateRange } from '../../utils/dateRange'

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export default function OwnerConsignmentsPage() {
  const navigate = useNavigate()
  const { consignments, terminals } = useOwnerData()
  const [searchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [terminalFilter, setTerminalFilter] = useState(searchParams.get('terminal') || 'all')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [paymentFilter, setPaymentFilter] = useState(searchParams.get('payment') || 'all')
  const [flaggedOnly, setFlaggedOnly] = useState(searchParams.get('flagged') === 'true')
  const [periodFilter, setPeriodFilter] = useState(searchParams.get('period') || 'daily')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const now = Date.now()
    const periodWindowMs =
      periodFilter === 'daily'
        ? 24 * 60 * 60 * 1000
        : periodFilter === 'weekly'
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000

    return consignments.filter((item) => {
      const createdAtMs = new Date(item.createdAt || item.updatedAt).getTime()
      const inSelectedPeriod = now - createdAtMs <= periodWindowMs
      if (!inSelectedPeriod) {
        return false
      }
      if (!isInDateRange(item.createdAt || item.updatedAt, dateRange)) {
        return false
      }

      if (q && !(item.receiptId.toLowerCase().includes(q) || item.vehicleNo.toLowerCase().includes(q))) {
        return false
      }
      if (terminalFilter !== 'all' && item.terminalId !== terminalFilter) {
        return false
      }
      if (statusFilter !== 'all' && item.logisticsStatus !== statusFilter) {
        return false
      }
      if (paymentFilter !== 'all' && item.paymentStatus !== paymentFilter) {
        return false
      }
      if (flaggedOnly && !item.flagged) {
        return false
      }
      return true
    })
  }, [consignments, search, terminalFilter, statusFilter, paymentFilter, flaggedOnly, periodFilter, dateRange])

  const summary = {
    total: filtered.length,
    delivered: filtered.filter((item) => item.logisticsStatus === 'delivered').length,
    pendingPayment: filtered.filter((item) => item.paymentStatus === 'pending').length,
    flagged: filtered.filter((item) => item.flagged).length,
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIStatCard title="Visible Consignments" value={summary.total} />
        <KPIStatCard title="Delivered" value={summary.delivered} tone="success" />
        <KPIStatCard title="Pending Payment" value={summary.pendingPayment} tone="secondary" />
        <KPIStatCard title="Flagged" value={summary.flagged} tone="primary" />
      </section>

      <section className="grid grid-cols-1 gap-3 rounded-xl bg-surface-container-low p-4 md:grid-cols-7">
        <div className="md:col-span-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Search receipt or vehicle" />
        </div>
        <select value={terminalFilter} onChange={(e) => setTerminalFilter(e.target.value)} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
          <option value="all">All Terminals</option>
          {terminals.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
          <option value="all">All Logistics Status</option>
          <option value="scan-pending">Scan Pending</option>
          <option value="in-transit">On Way</option>
          <option value="arrived">Arrived</option>
          <option value="delivery-pending-verification">Delivery Pending Verification</option>
          <option value="delivered">Delivered</option>
          <option value="closed">Closed</option>
          <option value="billed">Billed</option>
          <option value="flagged">Flagged</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
          <option value="all">All Payment Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="held">Held</option>
          <option value="overdue">Overdue</option>
        </select>
        <label className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} />
          Flagged only
        </label>
        <PeriodDateFilterDropdown
          periodValue={periodFilter}
          onPeriodChange={setPeriodFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          options={PERIOD_OPTIONS}
          label="Range"
        />
      </section>

      <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
        <div className="border-b border-outline-variant/20 p-4">
          <h4 className="font-headline text-lg font-bold">Consignment Registry</h4>
        </div>

        {filtered.length === 0 ? (
          <div className="p-4"><EmptyState title="No consignments found" /></div>
        ) : (
          <div className="app-table-scroll">
            <table className="app-table text-left text-sm">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Receipt</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Vehicle</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Terminal</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Logistics</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Payment</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filtered.map((item) => (
                  <tr key={item.id} onClick={() => navigate(`/owner/consignments/${item.id}`)} className="cursor-pointer transition-colors hover:bg-surface-container-low">
                    <td className="px-4 py-3 font-headline font-bold text-primary">{item.receiptId}</td>
                    <td className="px-4 py-3 font-semibold text-on-surface">{item.vehicleNo}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{terminals.find((terminal) => terminal.id === item.terminalId)?.name || 'N/A'}</td>
                    <td className="px-4 py-3"><OwnerStatusBadge status={item.logisticsStatus} /></td>
                    <td className="px-4 py-3"><OwnerStatusBadge status={item.paymentStatus} /></td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{new Date(item.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
