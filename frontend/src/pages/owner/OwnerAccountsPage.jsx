import { useMemo, useState } from 'react'
import OwnerStatusBadge from '../../components/owner/OwnerStatusBadge'
import EmptyState from '../../components/owner/EmptyState'
import PeriodDateFilterDropdown from '../../components/common/PeriodDateFilterDropdown'
import { useOwnerData } from '../../context/owner/OwnerContext'
import { isInDateRange } from '../../utils/dateRange'

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily (Last 24 Hours)' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '14d', label: 'Last 14 Days' },
  { value: '30d', label: 'Last 30 Days' },
]

function isInsidePeriod(isoDate, period) {
  if (!isoDate) {
    return false
  }

  const createdAt = new Date(isoDate).getTime()
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000

  if (period === 'yesterday') {
    return createdAt >= now - oneDay * 2 && createdAt < now - oneDay
  }

  const daysMap = {
    daily: 1,
    '7d': 7,
    '14d': 14,
    '30d': 30,
  }

  const days = daysMap[period] || 1
  return createdAt >= now - days * oneDay
}

function formatPkr(value) {
  return `PKR ${new Intl.NumberFormat('en-PK').format(value)}`
}

export default function OwnerAccountsPage() {
  const { consignments, payments, terminals } = useOwnerData()
  const [periodFilter, setPeriodFilter] = useState('daily')
  const [terminalFilter, setTerminalFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const paymentRows = useMemo(() => {
    return payments.map((payment) => {
      const consignment = consignments.find((item) => String(item.id) === String(payment.consignmentId))
      return {
        ...payment,
        consignment,
        terminalId: consignment?.terminalId || 't-hazro-main',
        receiptId: consignment?.receiptId || payment.consignmentNumber || `Payment-${payment.id}`,
        vehicleNo: consignment?.vehicleNo || 'N/A',
        weightTons: consignment?.weightTons || 0,
        updatedAt: payment.verifiedAt || payment.createdAt,
      }
    })
  }, [payments, consignments])

  const filteredPayments = useMemo(
    () =>
      paymentRows.filter((item) => {
        const activityDate = item.verifiedAt || item.createdAt
        if (!isInsidePeriod(activityDate, periodFilter)) {
          return false
        }
        if (!isInDateRange(activityDate, dateRange)) {
          return false
        }
        if (terminalFilter !== 'all' && item.terminalId !== terminalFilter) {
          return false
        }
        if (paymentFilter !== 'all' && item.status !== paymentFilter) {
          return false
        }
        return true
      }),
    [paymentRows, periodFilter, terminalFilter, paymentFilter, dateRange],
  )

  const summary = useMemo(() => {
    let paidAmount = 0
    let pendingAmount = 0
    let heldAmount = 0
    let overdueAmount = 0

    filteredPayments.forEach((item) => {
      const amount = Number(item.amount || 0)

      if (item.status === 'paid' || item.status === 'verified') {
        paidAmount += amount
      }
      if (item.status === 'pending') {
        pendingAmount += amount
      }
      if (item.status === 'held') {
        heldAmount += amount
      }
      if (item.status === 'overdue') {
        overdueAmount += amount
      }
    })

    const totalInScope = paidAmount + pendingAmount + heldAmount + overdueAmount

    return {
      totalInScope,
      paidAmount,
      pendingAmount,
      heldAmount,
      overdueAmount,
      transactionCount: filteredPayments.length,
    }
  }, [filteredPayments])

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <PeriodDateFilterDropdown
            periodValue={periodFilter}
            onPeriodChange={setPeriodFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            options={PERIOD_OPTIONS}
            label="Range"
          />

          <select
            value={terminalFilter}
            onChange={(e) => setTerminalFilter(e.target.value)}
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
          >
            <option value="all">All Terminals</option>
            {terminals.map((terminal) => (
              <option key={terminal.id} value={terminal.id}>{terminal.name}</option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
          >
            <option value="all">All Payment Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="held">Held</option>
            <option value="overdue">Overdue</option>
          </select>

        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total Payment Value</p>
          <p className="mt-2 font-headline text-3xl font-extrabold text-primary">{formatPkr(summary.totalInScope)}</p>
          <p className="mt-1 text-xs font-semibold text-on-surface-variant">Transactions: {summary.transactionCount}</p>
        </div>

        <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Paid Amount</p>
          <p className="mt-2 font-headline text-3xl font-extrabold text-tertiary">{formatPkr(summary.paidAmount)}</p>
          <p className="mt-1 text-xs font-semibold text-on-surface-variant">Settled payments</p>
        </div>

        <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Pending + Risk</p>
          <p className="mt-2 font-headline text-3xl font-extrabold text-error">{formatPkr(summary.pendingAmount + summary.heldAmount + summary.overdueAmount)}</p>
          <p className="mt-1 text-xs font-semibold text-on-surface-variant">Pending, held, and overdue</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Pending</p>
          <p className="mt-2 font-headline text-2xl font-extrabold text-secondary">{formatPkr(summary.pendingAmount)}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Held</p>
          <p className="mt-2 font-headline text-2xl font-extrabold text-error">{formatPkr(summary.heldAmount)}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Overdue</p>
          <p className="mt-2 font-headline text-2xl font-extrabold text-error">{formatPkr(summary.overdueAmount)}</p>
        </div>
      </section>

      <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
        <div className="border-b border-outline-variant/20 p-4">
          <h4 className="font-headline text-lg font-bold">Payment Ledger</h4>
          <p className="text-xs text-on-surface-variant">Super admin can review all payment-related transactions in one place.</p>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No payments found" subtitle="Change filters to see payment entries." />
          </div>
        ) : (
          <div className="app-table-scroll">
            <table className="app-table text-left text-sm">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Receipt</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Terminal</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Vehicle</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Weight</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Estimated Amount</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Payment Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredPayments.map((item) => {
                  const terminalName = terminals.find((terminal) => terminal.id === item.terminalId)?.name || 'N/A'

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-surface-container-low">
                      <td className="px-4 py-3 font-headline font-bold text-primary">{item.receiptId}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{terminalName}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{item.vehicleNo}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{item.weightTons.toFixed(1)} tons</td>
                      <td className="px-4 py-3 text-xs font-semibold text-on-surface">{formatPkr(item.amount)}</td>
                      <td className="px-4 py-3"><OwnerStatusBadge status={item.status} /></td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{new Date(item.updatedAt).toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
