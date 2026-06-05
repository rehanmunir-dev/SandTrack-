import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionCard from '../../components/common/SectionCard'
import StatusBadge from '../../components/common/StatusBadge'
import { useAppState } from '../../context/AppStateContext'

function MetricCard({ label, value, colorClass, extra }) {
  return (
    <div className="app-kpi-card">
      <p className="mb-4 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <div className="flex items-end justify-between gap-3">
        <h3 className={`font-headline text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-extrabold ${colorClass}`}>{value}</h3>
        {extra || null}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const {
    consignments,
    payments,
    alerts,
    counters,
    dashboardRefreshAt,
    refreshDashboard,
  } = useAppState()
  const [search, setSearch] = useState('')

  const formatter = useMemo(() => new Intl.NumberFormat('en-PK'), [])

  const criticalAlerts = useMemo(() => {
    return alerts.filter((alert) => alert.severity === 'CRITICAL' && alert.status !== 'RESOLVED')
  }, [alerts])

  const liveRows = useMemo(() => {
    return consignments
      .filter((item) => item.status !== 'CLOSED')
      .filter((item) => {
        const query = search.trim().toLowerCase()
        if (!query) {
          return true
        }

        return (
          item.receiptId.toLowerCase().includes(query) ||
          item.vehicleNo.toLowerCase().includes(query) ||
          item.terminal.toLowerCase().includes(query)
        )
      })
      .slice(0, 8)
  }, [consignments, search])

  const monthlyRevenue = useMemo(() => {
    return payments.reduce((acc, item) => {
      if (item.status !== 'VERIFIED') {
        return acc
      }

      return acc + Number(item.amountEntered || 0)
    }, 0)
  }, [payments])

  const pendingReceivables = useMemo(() => {
    return payments.reduce((acc, item) => {
      if (['PENDING_VERIFICATION', 'FLAGGED'].includes(item.status)) {
        return acc + Number(item.amountEntered || 0)
      }

      return acc
    }, 0)
  }, [payments])

  const deliveredCount = consignments.filter((item) => item.status === 'DELIVERED').length
  const inTransitCount = consignments.filter((item) => item.status === 'IN_TRANSIT').length
  const dailyAverage = Math.round(monthlyRevenue / 30)

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      <SectionCard
        title="Owner Dashboard"
        subtitle={`Last refresh: ${new Date(dashboardRefreshAt).toLocaleString()}`}
        right={
          <button type="button" onClick={refreshDashboard} className="app-btn-secondary">
            Refresh
          </button>
        }
      >
        <p className="text-sm text-on-surface-variant">
          Real-time terminal throughput, fraud alerts, and financial visibility.
        </p>
      </SectionCard>

      <section className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-5 lg:gap-6 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Loaded Today"
          value={counters.activeConsignments}
          colorClass="text-primary"
          extra={
            <span className="rounded bg-tertiary-fixed px-2 py-0.5 text-xs font-bold text-on-tertiary-container">
              Live
            </span>
          }
        />

        <MetricCard
          label="On Way"
          value={inTransitCount}
          colorClass="text-secondary"
          extra={
            <div className="flex h-6 w-12 items-center justify-center rounded-full bg-secondary-container/10">
              <span className="material-symbols-outlined text-sm text-secondary">local_shipping</span>
            </div>
          }
        />

        <MetricCard
          label="Delivered"
          value={deliveredCount}
          colorClass="text-on-tertiary-container"
          extra={<span className="material-symbols-outlined text-on-tertiary-container">check_circle</span>}
        />

        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary-container p-6 lg:col-span-2">
          <div className="relative z-10 h-full space-y-4">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary-fixed-dim">
                Total Revenue (Monthly)
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-primary-fixed-dim">PKR</span>
                <h3 className="font-headline text-4xl font-black text-white">
                  {formatter.format(monthlyRevenue)}
                </h3>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-widest text-primary-fixed-dim/70">
                  Pending Receivables
                </p>
                <p className="text-sm font-bold text-white">PKR {formatter.format(pendingReceivables)}</p>
              </div>
              <div className="h-8 w-px bg-primary-fixed-dim/20" />
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-widest text-primary-fixed-dim/70">
                  Daily Avg
                </p>
                <p className="text-sm font-bold text-white">PKR {formatter.format(dailyAverage)}</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-10">
            <span className="material-symbols-outlined text-9xl text-white">payments</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <SectionCard title="Priority Alerts" subtitle="Critical incidents that need immediate action" className="lg:col-span-2">
          <div className="space-y-3">
            {criticalAlerts.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No critical alerts at the moment.</p>
            ) : (
              criticalAlerts.map((alert) => (
                <div key={alert.id} className="rounded-r-lg border-l-4 border-error bg-error-container/40 p-4">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-on-error-container">{alert.title}</p>
                    <span className="text-[10px] text-on-error-container/70">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-on-error-container/80">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <div className="rounded-xl bg-primary p-6 text-white">
          <h4 className="font-headline text-lg font-bold">Dispatch Trends</h4>
          <p className="mb-6 text-xs text-primary-fixed-dim/70">Volume increase vs last 7 refresh cycles.</p>
          <div className="flex h-24 items-end gap-2">
            {[40, 65, 55, 85, 70, 95, 80].map((height, index) => (
              <div
                key={`${height}-${index}`}
                className={`flex-1 rounded-t ${index === 6 ? 'bg-secondary' : 'bg-primary-fixed-dim/20'}`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary-fixed-dim/50">
            <span>Mon</span>
            <span>Today</span>
          </div>
        </div>
      </section>

      <SectionCard
        title="Live Consignments"
        subtitle="Click any row to open details"
        right={
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
              search
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="app-input w-full sm:w-72 pl-9"
              placeholder="Search vehicle or receipt"
            />
          </div>
        }
      >
        <div className="app-table-scroll no-scrollbar rounded-lg border border-outline-variant/20">
          <table className="app-table text-left text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Receipt</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Vehicle</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Terminal</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Logistics Status</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {liveRows.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/app/consignments/${item.id}`)}
                  className="cursor-pointer transition-colors hover:bg-surface-container-low"
                >
                  <td className="px-4 py-3 font-headline font-bold text-primary">{item.receiptId}</td>
                  <td className="px-4 py-3 font-semibold text-on-surface">{item.vehicleNo}</td>
                  <td className="px-4 py-3 text-on-surface">{item.terminal}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.paymentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
