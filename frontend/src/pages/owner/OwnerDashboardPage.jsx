import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OWNER_ROUTES } from '../../constants/owner/routes'
import { useOwnerData } from '../../context/owner/OwnerContext'
import KPIStatCard from '../../components/owner/KPIStatCard'
import DetailCard from '../../components/owner/DetailCard'
import OwnerStatusBadge from '../../components/owner/OwnerStatusBadge'
import SearchBar from '../../components/owner/SearchBar'
import PeriodDateFilterDropdown from '../../components/common/PeriodDateFilterDropdown'
import { isInDateRange } from '../../utils/dateRange'
import { useRoleSystem } from '../../context/roleSystem/RoleSystemContext'

function formatPkr(value) {
  return new Intl.NumberFormat('en-PK').format(value)
}

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

export default function OwnerDashboardPage() {
  const navigate = useNavigate()
  const { consignments, alerts, payments, routeMonitoring, trendSeries } = useOwnerData()
  const { activityLogs } = useRoleSystem()
  const [search, setSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState('daily')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const filteredConsignments = useMemo(
    () => consignments.filter((item) => isInsidePeriod(item.createdAt, periodFilter) && isInDateRange(item.createdAt, dateRange)),
    [consignments, periodFilter, dateRange],
  )

  const filteredAlerts = useMemo(
    () => alerts.filter((item) => isInsidePeriod(item.createdAt, periodFilter) && isInDateRange(item.createdAt, dateRange)),
    [alerts, periodFilter, dateRange],
  )

  const dashboardStats = useMemo(() => {
    const loadedToday = filteredConsignments.filter((item) => item.logisticsStatus === 'loaded' || item.logisticsStatus === 'scan-pending').length
    const onWay = filteredConsignments.filter((item) => item.logisticsStatus === 'on-way' || item.logisticsStatus === 'in-transit').length
    const delivered = filteredConsignments.filter((item) => item.logisticsStatus === 'delivered').length

    const filteredPayments = payments.filter((item) => isInsidePeriod(item.verifiedAt || item.createdAt, periodFilter) && isInDateRange(item.verifiedAt || item.createdAt, dateRange))
    const revenue = filteredPayments
      .filter((item) => item.status === 'verified' || item.status === 'paid')
      .reduce((sum, item) => sum + item.amount, 0)
    const pendingReceivables = filteredPayments
      .filter((item) => item.status === 'pending')
      .reduce((sum, item) => sum + item.amount, 0)

    const criticalAlerts = filteredAlerts.filter(
      (a) => a.severity === 'critical' && a.reviewState !== 'resolved' && a.reviewState !== 'dismissed',
    ).length

    return {
      loadedToday,
      onWay,
      delivered,
      revenue,
      pendingReceivables,
      criticalAlerts,
    }
  }, [filteredConsignments, filteredAlerts, payments, periodFilter, dateRange])

  const routeKpis = useMemo(() => {
    return {
      activeRoutes: routeMonitoring.length,
      deliveredRoutes: routeMonitoring.filter((route) => route.status === 'delivered').length,
      activeTrucks: routeMonitoring.reduce((sum, route) => sum + route.activeCount, 0),
      onWayTrips: filteredConsignments.filter((item) => item.logisticsStatus === 'on-way' || item.logisticsStatus === 'in-transit').length,
    }
  }, [routeMonitoring, filteredConsignments])

  const liveConsignments = useMemo(() => {
    const q = search.trim().toLowerCase()
    return filteredConsignments
      .filter((item) => !q || item.receiptId.toLowerCase().includes(q) || item.vehicleNo.toLowerCase().includes(q))
      .slice(0, 8)
  }, [filteredConsignments, search])

  const priorityAlerts = filteredAlerts
    .filter((alert) => alert.severity === 'critical' || alert.severity === 'warning')
    .slice(0, 4)

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <section className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-headline text-base font-bold">Dashboard Time Filter</h4>
            <p className="text-xs text-on-surface-variant">Default view is Daily. All dashboard numbers follow this filter.</p>
          </div>
          <div className="w-full sm:w-auto">
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
      </section>

      <section className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-5 lg:gap-6 md:grid-cols-2 lg:grid-cols-5">
        <KPIStatCard
          title="Loaded"
          value={dashboardStats.loadedToday}
          tone="primary"
          onClick={() => navigate(`${OWNER_ROUTES.CONSIGNMENTS}?status=scan-pending`)}
        />
        <KPIStatCard
          title="On Way"
          value={dashboardStats.onWay}
          tone="secondary"
          onClick={() => navigate(`${OWNER_ROUTES.CONSIGNMENTS}?status=in-transit`)}
        />
        <KPIStatCard
          title="Delivered"
          value={dashboardStats.delivered}
          tone="success"
          onClick={() => navigate(`${OWNER_ROUTES.CONSIGNMENTS}?status=delivered`)}
        />
        <KPIStatCard
          title="Revenue"
          value={`PKR ${formatPkr(dashboardStats.revenue)}`}
          onClick={() => navigate(OWNER_ROUTES.ANALYTICS)}
        />
        <KPIStatCard
          title="Pending Receivables"
          value={`PKR ${formatPkr(dashboardStats.pendingReceivables)}`}
          onClick={() => navigate(`${OWNER_ROUTES.CONSIGNMENTS}?payment=pending`)}
        />
      </section>

      <section className="grid grid-cols-1 gap-8">
        <DetailCard title="Route Summary">
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Active Routes</p>
              <p className="font-headline text-2xl font-extrabold text-primary">{routeKpis.activeRoutes}</p>
            </div>
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Active Trucks</p>
              <p className="font-headline text-2xl font-extrabold text-primary">{routeKpis.activeTrucks}</p>
            </div>
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">On Way Trips</p>
              <p className="font-headline text-2xl font-extrabold text-secondary">{routeKpis.onWayTrips}</p>
            </div>
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Delivered</p>
              <p className="font-headline text-2xl font-extrabold text-tertiary">{routeKpis.deliveredRoutes}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-low p-4">
            <div>
              <p className="font-semibold text-on-surface">View All Trucks & Routes</p>
              <p className="text-xs text-on-surface-variant">Manage active shipments and terminal operations</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(OWNER_ROUTES.TRUCKS)}
              className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container-high"
            >
              Open
            </button>
          </div>
        </DetailCard>

        <DetailCard title="Priority Alerts">
          <div className="space-y-3">
            {priorityAlerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => navigate(`${OWNER_ROUTES.ALERTS}?alertId=${alert.id}`)}
                className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-low p-3 text-left transition-colors hover:bg-surface-container-high"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <OwnerStatusBadge status={alert.severity} />
                  <span className="text-[11px] text-on-surface-variant">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm font-semibold text-on-surface">{alert.title}</p>
              </button>
            ))}
          </div>
        </DetailCard>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-xl border border-outline-variant/10 bg-primary p-6 text-white lg:col-span-1">
          <h4 className="font-headline text-lg font-bold">Dispatch Trends</h4>
          <p className="mb-4 text-xs text-primary-fixed-dim/80">Last 7 periods</p>
          <div className="flex h-24 items-end gap-2">
            {trendSeries.map((point, idx) => (
              <div
                key={`${point}-${idx}`}
                className={`flex-1 rounded-t ${idx === trendSeries.length - 1 ? 'bg-secondary' : 'bg-primary-fixed-dim/20'}`}
                style={{ height: `${point}%` }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 p-4">
            <div>
              <h4 className="font-headline text-lg font-bold">Live Consignments</h4>
              <p className="text-xs text-on-surface-variant">Row click opens detail page</p>
            </div>
            <div className="w-full max-w-xs">
              <SearchBar value={search} onChange={setSearch} placeholder="Search vehicle or receipt" />
            </div>
          </div>

          <div className="app-table-scroll">
            <table className="app-table text-left text-sm">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Receipt</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Vehicle</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {liveConsignments.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/owner/consignments/${item.id}`)}
                    className="cursor-pointer transition-colors hover:bg-surface-container-low"
                  >
                    <td className="px-4 py-3 font-headline font-bold text-primary">{item.receiptId}</td>
                    <td className="px-4 py-3 font-semibold text-on-surface">{item.vehicleNo}</td>
                    <td className="px-4 py-3"><OwnerStatusBadge status={item.logisticsStatus} /></td>
                    <td className="px-4 py-3"><OwnerStatusBadge status={item.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm p-6">
        <div className="mb-4">
          <h4 className="font-headline text-lg font-bold">Global Staff Activity Log</h4>
          <p className="text-xs text-on-surface-variant">Real-time actions performed by operators, accountants, and watchmen</p>
        </div>
        <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
          {activityLogs && activityLogs.length > 0 ? (
            activityLogs.map(log => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/10 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-on-surface">{log.action}</p>
                  <p className="text-xs text-on-surface-variant">{log.details}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-bold text-primary">{log.actor} <span className="text-[10px] font-normal text-on-surface-variant uppercase tracking-widest bg-surface-container-high px-1.5 py-0.5 rounded ml-1">{log.role}</span></p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-center text-on-surface-variant py-4">No recent activity logged.</p>
          )}
        </div>
      </section>

      <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
          <SearchBar value={search} onChange={setSearch} placeholder="Search receipt, vehicle, staff" />
          <button
            type="button"
            onClick={() => navigate(OWNER_ROUTES.TRUCKS)}
            className="rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-bold text-on-surface"
          >
            View All Trucks
          </button>
          <button
            type="button"
            onClick={() => navigate(`${OWNER_ROUTES.SEARCH}?q=${encodeURIComponent(search)}`)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
          >
            Open Global Search
          </button>
        </div>
      </div>
    </div>
  )
}
