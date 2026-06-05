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
import SectionCard from '../../../components/common/SectionCard'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'
import { formatPKR } from '../../../utils/formatCurrency'

function Card({ label, value, tone = 'text-primary' }) {
  return (
    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className={`mt-2 font-headline text-3xl font-extrabold ${tone}`}>{value}</p>
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
      <SectionCard title="Accountant Dashboard" subtitle="Finance overview with date-sorted ledger activity.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card label="Total Revenue" value={formatPKR(accountantSummary.totalRevenue)} />
          <Card label="Pending Payments" value={accountantSummary.pendingPayments} tone="text-secondary" />
          <Card label="Verified Payments" value={accountantSummary.verifiedPayments} tone="text-tertiary" />
          <Card label="Flagged Payments" value={accountantSummary.flaggedPayments} tone="text-error" />
        </div>
      </SectionCard>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="Revenue Trend" subtitle="Verified payment value from the last 7 days.">
          <div className="h-[260px]">
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
        </SectionCard>

        <SectionCard title="Payment Status Mix" subtitle="Live payment queue split for accountant action.">
          <div className="h-[260px]">
            {paymentStatusData.some((item) => item.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentStatusData} dataKey="count" nameKey="label" innerRadius={55} outerRadius={82} paddingAngle={3}>
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
        </SectionCard>
      </section>

      <SectionCard title="Delivery Queue Breakdown" subtitle="Consignment lifecycle states that drive accounting work.">
        <div className="h-[240px]">
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
      </SectionCard>

      <SectionCard title="Latest Payments" subtitle="Pulled from ledger data and sorted by latest date.">
        <div className="space-y-3 text-sm">
          {latestPayments.map((payment) => (
            <div key={payment.id} className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-headline text-base font-bold text-on-surface">{payment.ledgerRef}</p>
                  <p className="text-xs text-on-surface-variant">Destination: {payment.destination}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-on-surface-variant">{formatDateTime(payment.createdAt)}</p>
                  <p className="mt-1 text-sm font-bold text-primary">PKR {payment.amount}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface-variant">{payment.method || 'Cash'}</span>
                <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface-variant">{payment.status}</span>
              </div>
            </div>
          ))}
          {!latestPayments.length ? (
            <p className="text-sm text-on-surface-variant">No payments found.</p>
          ) : null}
        </div>
      </SectionCard>
    </div>
  )
}
