import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import WorkflowGuide from '../../../components/WorkflowGuide'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'
import { formatPKR } from '../../../utils/formatCurrency'

function Card({ label, value, tone = 'text-primary' }) {
  const styles = tone === 'text-secondary'
    ? {
        accent: 'bg-secondary',
        ring: 'border-secondary/20 bg-secondary/10',
        value: 'text-secondary',
      }
    : tone === 'text-tertiary'
      ? {
          accent: 'bg-tertiary',
          ring: 'border-tertiary/20 bg-tertiary/10',
          value: 'text-tertiary',
        }
      : tone === 'text-error'
        ? {
            accent: 'bg-error',
            ring: 'border-error/20 bg-error/10',
            value: 'text-error',
          }
        : {
            accent: 'bg-primary',
            ring: 'border-primary/20 bg-primary/10',
            value: 'text-primary',
          }

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm ${styles.ring}`}>
      <div className={`absolute left-0 top-0 h-full w-1 ${styles.accent}`} />
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
      <p className={`mt-3 font-headline text-2xl font-black leading-tight ${styles.value}`}>{value}</p>
    </div>
  )
}

const STATUS_COLORS = {
  pending: '#f59e0b',
  paid: '#10b981',
  held: '#ef4444',
  overdue: '#ef4444',
}

function paymentStatusLabel(status) {
  const normalized = String(status || 'pending').toLowerCase()
  if (normalized === 'paid' || normalized === 'verified') return 'Paid'
  if (normalized === 'held' || normalized === 'flagged') return 'Held'
  if (normalized === 'overdue') return 'Overdue'
  return 'Pending'
}

function statusPillClass(status) {
  const normalized = String(status || 'pending').toLowerCase()
  if (normalized === 'paid' || normalized === 'verified') {
    return 'border-tertiary/20 bg-tertiary/10 text-tertiary'
  }
  if (normalized === 'held' || normalized === 'flagged' || normalized === 'overdue') {
    return 'border-error/20 bg-error/10 text-error'
  }
  return 'border-secondary/20 bg-secondary/10 text-secondary'
}

export default function AccountantDashboardPage() {
  const { accountantSummary, payments, consignments } = useRoleSystem()

  const latestPayments = useMemo(() => {
    return payments
      .map((payment) => {
        const linkedConsignment = consignments.find((item) => item.id === payment.consignmentDbId || item.consignmentId === payment.consignmentId)
        return {
          ...payment,
          ledgerRef: linkedConsignment?.consignmentId || payment.consignmentId,
          destination: linkedConsignment?.destination || 'N/A',
          createdAt: linkedConsignment?.createdAt || payment.createdAt,
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [payments, consignments])

  const paymentStatusData = useMemo(() => {
    const counts = {
      pending: 0,
      paid: 0,
      held: 0,
      overdue: 0,
    }

    payments.forEach((payment) => {
      const label = paymentStatusLabel(payment.status).toLowerCase()
      counts[label] = (counts[label] || 0) + 1
    })

    return Object.entries(counts).map(([status, count]) => ({
      status,
      label: paymentStatusLabel(status),
      count,
      color: STATUS_COLORS[status] || '#64748b',
    }))
  }, [payments])

  const revenueTrendData = useMemo(() => {
    const buckets = {}
    const now = Date.now()

    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(now - i * 24 * 60 * 60 * 1000)
      const label = day.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })
      buckets[label] = 0
    }

    payments.forEach((payment) => {
      if (paymentStatusLabel(payment.status) !== 'Paid') {
        return
      }

      const date = new Date(payment.verifiedAt || payment.createdAt)
      if (Number.isNaN(date.getTime())) {
        return
      }

      const label = date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })
      if (buckets[label] !== undefined) {
        buckets[label] += Number(payment.amount || 0)
      }
    })

    return Object.entries(buckets).map(([date, amount]) => ({ date, amount }))
  }, [payments])

  const deliveryQueueData = useMemo(() => {
    const counts = {
      IN_TRANSIT: 0,
      ARRIVED: 0,
      DELIVERED: 0,
      CLOSED: 0,
      FLAGGED: 0,
    }

    consignments.forEach((consignment) => {
      const status = String(consignment.status || '').toUpperCase()
      if (counts[status] !== undefined) {
        counts[status] += 1
      }
    })

    return Object.entries(counts).map(([status, count]) => ({
      status: status.replaceAll('_', ' '),
      count,
    }))
  }, [consignments])

  const accountantQueues = useMemo(() => ({
    arrived: consignments.filter((item) => String(item.status).toUpperCase() === 'ARRIVED').length,
    deliveryReview: consignments.filter((item) => ['ARRIVED', 'DELIVERY_PENDING_VERIFICATION'].includes(String(item.status).toUpperCase())).length,
    pendingPayments: payments.filter((item) => paymentStatusLabel(item.status) === 'Pending').length,
    verifiedPayments: payments.filter((item) => paymentStatusLabel(item.status) === 'Paid').length,
    ledgerClosing: consignments.filter((item) => String(item.status).toUpperCase() === 'DELIVERED').length,
    closedLedgers: consignments.filter((item) => String(item.status).toUpperCase() === 'CLOSED').length,
  }), [consignments, payments])

  function formatDateTime(value) {
    if (!value) {
      return 'N/A'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return 'N/A'
    }

    return date.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-gradient-to-br from-primary/10 via-surface-container-lowest to-tertiary/10 shadow-sm">
        <div className="grid gap-5 p-5 xl:grid-cols-[1.1fr_1.4fr] xl:items-stretch">
          <div className="flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-tertiary/20 bg-tertiary/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-tertiary">
                Finance Control
              </div>
              <div>
                <h1 className="font-headline text-2xl font-black text-on-surface">Accountant Dashboard</h1>
                <p className="mt-1 max-w-xl text-sm font-medium text-on-surface-variant">
                  Finance overview with date-sorted ledger activity.
                </p>
              </div>
            </div>

            <WorkflowGuide
              title="Accountant flow"
              items={[
                { label: '1. Confirm arrival', description: 'Review consignments that reached the delivery stage.' },
                { label: '2. Update payment', description: 'Mark cash payments or attach proof for bank transfer payments.' },
                { label: '3. Close ledger', description: 'Close the ledger only after delivery and payment are verified.' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card label="Total Revenue" value={formatPKR(accountantSummary.totalRevenue)} />
            <Card label="Pending Payments" value={accountantSummary.pendingPayments} tone="text-secondary" />
            <Card label="Verified Payments" value={accountantSummary.verifiedPayments} tone="text-tertiary" />
            <Card label="Flagged Payments" value={accountantSummary.flaggedPayments} tone="text-error" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <QueueMetric label="Arrived" value={accountantQueues.arrived} />
        <QueueMetric label="Delivery Review" value={accountantQueues.deliveryReview} />
        <QueueMetric label="Pending Payments" value={accountantQueues.pendingPayments} tone="text-secondary" />
        <QueueMetric label="Verified Payments" value={accountantQueues.verifiedPayments} tone="text-tertiary" />
        <QueueMetric label="Ledger Close" value={accountantQueues.ledgerClosing} tone="text-primary" />
        <QueueMetric label="Closed Ledgers" value={accountantQueues.closedLedgers} tone="text-tertiary" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-headline text-xl font-black text-on-surface">Revenue Trend</h2>
              <p className="text-xs font-medium text-on-surface-variant">Verified payment value from the last 7 days.</p>
            </div>
            <span className="rounded-full border border-tertiary/20 bg-tertiary/10 px-3 py-1 text-xs font-black text-tertiary">
              7 Days
            </span>
          </div>
          <div className="h-[280px] rounded-xl border border-outline-variant/10 bg-surface-container-low p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="date" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => [formatPKR(value), 'Revenue']} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-headline text-xl font-black text-on-surface">Payment Status Mix</h2>
            <p className="text-xs font-medium text-on-surface-variant">Live payment queue split for accountant action.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div className="h-[260px] rounded-xl border border-outline-variant/10 bg-surface-container-low p-3">
              {paymentStatusData.some((item) => item.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentStatusData} dataKey="count" nameKey="label" innerRadius={58} outerRadius={86} paddingAngle={3}>
                      {paymentStatusData.map((entry) => (
                        <Cell key={entry.status} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-semibold text-on-surface-variant">
                  No payment data yet.
                </div>
              )}
            </div>
            <div className="grid gap-2">
              {paymentStatusData.map((item) => (
                <div key={item.status} className="flex items-center justify-between rounded-xl border border-outline-variant/15 bg-surface-container-low p-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-on-surface-variant">{item.label}</span>
                  </div>
                  <span className="font-headline text-lg font-black text-on-surface">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-headline text-xl font-black text-on-surface">Delivery Queue Breakdown</h2>
          <p className="text-xs font-medium text-on-surface-variant">Consignment lifecycle states that drive accounting work.</p>
        </div>
        <div className="h-[260px] rounded-xl border border-outline-variant/10 bg-surface-container-low p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deliveryQueueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="status" fontSize={10} tickLine={false} />
              <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-headline text-xl font-black text-on-surface">Latest Payments</h2>
            <p className="text-xs font-medium text-on-surface-variant">Pulled from ledger data and sorted by latest date.</p>
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
            Latest {latestPayments.length}
          </span>
        </div>
        <div className="space-y-3 text-sm">
          {latestPayments.map((payment) => (
            <div key={payment.id} className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-surface-container">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">Ledger Reference</p>
                  <p className="mt-1 font-headline text-base font-black text-on-surface">{payment.ledgerRef}</p>
                  <p className="mt-1 text-xs font-medium text-on-surface-variant">Destination: {payment.destination}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-on-surface-variant">{formatDateTime(payment.createdAt)}</p>
                  <p className="mt-1 font-headline text-lg font-black text-primary">PKR {payment.amount}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-black text-primary">{payment.method || 'Cash'}</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusPillClass(payment.status)}`}>{payment.status}</span>
              </div>
            </div>
          ))}
          {!latestPayments.length ? (
            <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-6 text-center text-sm font-semibold text-on-surface-variant">
              No payments found.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function QueueMetric({ label, value, tone = 'text-primary' }) {
  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant">{label}</p>
      <p className={`mt-2 font-headline text-2xl font-black ${tone}`}>{value}</p>
    </div>
  )
}
