import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { OWNER_ROUTES } from '../../constants/owner/routes'
import { useOwnerData } from '../../context/owner/OwnerContext'
import KPIStatCard from '../../components/owner/KPIStatCard'
import DetailCard from '../../components/owner/DetailCard'
import OwnerStatusBadge from '../../components/owner/OwnerStatusBadge'
import SearchBar from '../../components/owner/SearchBar'
import PeriodDateFilterDropdown from '../../components/common/PeriodDateFilterDropdown'
import { isInDateRange } from '../../utils/dateRange'
import { useRoleSystem } from '../../context/roleSystem/RoleSystemContext'
import WorkflowGuide from '../../components/WorkflowGuide'

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

function getPeriodDays(period) {
  return {
    daily: 1,
    yesterday: 1,
    '7d': 7,
    '14d': 14,
    '30d': 30,
  }[period] || 1
}

function percentChange(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return Math.round(((current - previous) / previous) * 100)
}

function formatChange(value) {
  if (value === 0) return 'No change'
  return `${value > 0 ? '+' : ''}${value}% vs previous period`
}

export default function OwnerDashboardPage() {
  const navigate = useNavigate()
  const { consignments, alerts, payments, routeMonitoring } = useOwnerData()
  const { activityLogs, drivers, trucks, scans } = useRoleSystem()
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
    const closed = filteredConsignments.filter((item) => item.logisticsStatus === 'closed' || String(item.status).toUpperCase() === 'CLOSED').length
    const tonsMoved = filteredConsignments.reduce((sum, item) => sum + Number(item.weightTons || item.netWeight || 0), 0)
    const pendingApprovals = drivers.filter((item) => item.approvalStatus === 'pending').length + trucks.filter((item) => item.approvalStatus === 'pending').length

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
      closed,
      revenue,
      pendingReceivables,
      criticalAlerts,
      tonsMoved,
      pendingApprovals,
    }
  }, [filteredConsignments, filteredAlerts, payments, periodFilter, dateRange, drivers, trucks])

  const executiveStats = useMemo(() => {
    const now = Date.now()
    const periodMs = getPeriodDays(periodFilter) * 24 * 60 * 60 * 1000
    const currentStart = periodFilter === 'yesterday' ? now - periodMs * 2 : now - periodMs
    const currentEnd = periodFilter === 'yesterday' ? now - periodMs : now
    const previousStart = currentStart - periodMs
    const previousEnd = currentStart

    const inWindow = (value, start, end) => {
      const time = new Date(value).getTime()
      return Number.isFinite(time) && time >= start && time < end
    }

    const currentConsignments = consignments.filter((item) => inWindow(item.createdAt, currentStart, currentEnd))
    const previousConsignments = consignments.filter((item) => inWindow(item.createdAt, previousStart, previousEnd))
    const currentPayments = payments.filter((item) => inWindow(item.verifiedAt || item.createdAt, currentStart, currentEnd))
    const previousPayments = payments.filter((item) => inWindow(item.verifiedAt || item.createdAt, previousStart, previousEnd))

    const paidAmount = (items) => items
      .filter((item) => item.status === 'verified' || item.status === 'paid')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const deliveredCount = (items) => items.filter((item) => ['delivered', 'closed'].includes(item.logisticsStatus)).length
    const tons = (items) => items.reduce((sum, item) => sum + Number(item.weightTons || 0), 0)

    const currentRevenue = paidAmount(currentPayments)
    const previousRevenue = paidAmount(previousPayments)
    const currentDelivered = deliveredCount(currentConsignments)
    const previousDelivered = deliveredCount(previousConsignments)
    const currentTons = tons(currentConsignments)
    const previousTons = tons(previousConsignments)
    const completionRate = currentConsignments.length ? Math.round((currentDelivered / currentConsignments.length) * 100) : 0
    const paidPayments = currentPayments.filter((item) => item.status === 'verified' || item.status === 'paid').length
    const collectionRate = currentPayments.length ? Math.round((paidPayments / currentPayments.length) * 100) : 0

    return {
      dispatchChange: percentChange(currentConsignments.length, previousConsignments.length),
      revenueChange: percentChange(currentRevenue, previousRevenue),
      deliveredChange: percentChange(currentDelivered, previousDelivered),
      tonsChange: percentChange(currentTons, previousTons),
      completionRate,
      collectionRate,
      averageLoad: currentConsignments.length ? currentTons / currentConsignments.length : 0,
      revenuePerOrder: currentConsignments.length ? currentRevenue / currentConsignments.length : 0,
    }
  }, [consignments, payments, periodFilter])

  const dispatchTrendData = useMemo(() => {
    const days = 7
    const now = new Date()
    return Array.from({ length: days }, (_, index) => {
      const day = new Date(now)
      day.setHours(0, 0, 0, 0)
      day.setDate(day.getDate() - (days - 1 - index))
      const nextDay = new Date(day)
      nextDay.setDate(nextDay.getDate() + 1)
      const count = consignments.filter((item) => {
        const time = new Date(item.createdAt).getTime()
        return time >= day.getTime() && time < nextDay.getTime()
      }).length

      return {
        label: day.toLocaleDateString('en-PK', { weekday: 'short' }),
        count,
      }
    })
  }, [consignments])

  const maxDispatchCount = Math.max(...dispatchTrendData.map((item) => item.count), 1)

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

  const recentScans = useMemo(
    () => [...scans].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [scans],
  )

  const latestScan = recentScans[0] || null
  const latestScanConsignment = latestScan
    ? consignments.find((item) => String(item.id) === String(latestScan.consignmentId))
    : null

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <WorkflowGuide
        title="CEO control flow"
        items={[
          { label: '1. Review alerts', description: 'Check critical flags first so suspicious drivers, trucks, or consignments are not missed.' },
          { label: '2. Approve records', description: 'Open approvals to clear pending drivers and trucks for daily operations.' },
          { label: '3. Watch money', description: 'Use accounts and analytics to confirm paid, pending, and held revenue.' },
        ]}
      />

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

      <section className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-5 lg:gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KPIStatCard
          title="Today's Dispatches"
          value={dashboardStats.loadedToday}
          tone="primary"
          onClick={() => navigate(`${OWNER_ROUTES.CONSIGNMENTS}?status=scan-pending`)}
        />
        <KPIStatCard
          title="Active Consignments"
          value={dashboardStats.onWay}
          tone="secondary"
          onClick={() => navigate(`${OWNER_ROUTES.CONSIGNMENTS}?status=in-transit`)}
        />
        <KPIStatCard
          title="Pending Approvals"
          value={dashboardStats.pendingApprovals}
          tone="secondary"
          onClick={() => navigate(OWNER_ROUTES.APPROVALS)}
        />
        <KPIStatCard
          title="Pending Payments"
          value={`PKR ${formatPkr(dashboardStats.pendingReceivables)}`}
          onClick={() => navigate(`${OWNER_ROUTES.CONSIGNMENTS}?payment=pending`)}
        />
        <KPIStatCard
          title="Delivered Today"
          value={dashboardStats.delivered}
          tone="success"
          onClick={() => navigate(`${OWNER_ROUTES.CONSIGNMENTS}?status=delivered`)}
        />
        <KPIStatCard
          title="Revenue Today"
          value={`PKR ${formatPkr(dashboardStats.revenue)}`}
          onClick={() => navigate(OWNER_ROUTES.ANALYTICS)}
        />
        <KPIStatCard
          title="Tons Moved Today"
          value={dashboardStats.tonsMoved}
          tone="primary"
          onClick={() => navigate(OWNER_ROUTES.ANALYTICS)}
        />
        <KPIStatCard
          title="Flagged Issues"
          value={dashboardStats.criticalAlerts}
          tone="danger"
          onClick={() => navigate(OWNER_ROUTES.ALERTS)}
        />
      </section>

      <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Recurring Performance</p>
          <h4 className="mt-1 font-headline text-xl font-black text-on-surface">Executive Period Comparison</h4>
          <p className="text-xs font-medium text-on-surface-variant">Current selected period compared with the immediately previous matching period.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ExecutiveMetric label="Dispatch Growth" value={formatChange(executiveStats.dispatchChange)} tone={executiveStats.dispatchChange} />
          <ExecutiveMetric label="Revenue Growth" value={formatChange(executiveStats.revenueChange)} tone={executiveStats.revenueChange} />
          <ExecutiveMetric label="Delivered Growth" value={formatChange(executiveStats.deliveredChange)} tone={executiveStats.deliveredChange} />
          <ExecutiveMetric label="Tonnage Growth" value={formatChange(executiveStats.tonsChange)} tone={executiveStats.tonsChange} />
          <ExecutiveMetric label="Completion Rate" value={`${executiveStats.completionRate}%`} helper="Delivered or closed orders" />
          <ExecutiveMetric label="Payment Collection" value={`${executiveStats.collectionRate}%`} helper="Verified payments in period" />
          <ExecutiveMetric label="Average Load" value={`${executiveStats.averageLoad.toFixed(1)} tons`} helper="Average weight per dispatch" />
          <ExecutiveMetric label="Revenue Per Order" value={`PKR ${formatPkr(Math.round(executiveStats.revenuePerOrder))}`} helper="Verified revenue efficiency" />
        </div>
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
          <p className="mb-4 text-xs text-primary-fixed-dim/80">Actual dispatch volume for the last 7 days</p>
          <div className="flex h-32 items-end gap-2">
            {dispatchTrendData.map((point, idx) => (
              <div key={point.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[10px] font-black text-white">{point.count}</span>
                <div
                  className={`w-full rounded-t ${idx === dispatchTrendData.length - 1 ? 'bg-secondary' : 'bg-primary-fixed-dim/30'}`}
                  style={{ height: `${Math.max(8, Math.round((point.count / maxDispatchCount) * 85))}%` }}
                />
                <span className="text-[9px] font-bold text-primary-fixed-dim/80">{point.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-primary-fixed-dim/70">7-Day Total</p>
              <p className="mt-1 font-headline text-xl font-black">{dispatchTrendData.reduce((sum, item) => sum + item.count, 0)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-primary-fixed-dim/70">Daily Average</p>
              <p className="mt-1 font-headline text-xl font-black">{(dispatchTrendData.reduce((sum, item) => sum + item.count, 0) / 7).toFixed(1)}</p>
            </div>
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

      <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Gate Security</p>
            <h4 className="mt-1 font-headline text-xl font-black text-on-surface">Latest QR Code Scanned</h4>
            <p className="text-xs font-medium text-on-surface-variant">Most recent QR verification recorded by the watchman.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(OWNER_ROUTES.GATE_LOGS)}
            className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
          >
            View Gate Logs
          </button>
        </div>

        {latestScan ? (
          <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
            <div className="flex justify-center rounded-2xl border border-outline-variant/15 bg-white p-4">
              {latestScan.qrCode ? (
                <QRCodeSVG value={latestScan.qrCode} size={180} level="H" includeMargin />
              ) : (
                <div className="flex h-[180px] w-[180px] items-center justify-center rounded-xl bg-surface-container-low text-center text-xs font-bold text-on-surface-variant">
                  QR token is no longer available
                </div>
              )}
            </div>

            <div className="grid content-start gap-3 sm:grid-cols-2">
              <ScanDetail label="Consignment" value={latestScanConsignment?.receiptId || latestScan.consignmentId || 'N/A'} />
              <ScanDetail label="Scan Result" value={String(latestScan.result || 'N/A').replaceAll('_', ' ')} />
              <ScanDetail label="Watchman" value={latestScan.actor || 'Watchman'} />
              <ScanDetail label="Gate" value={latestScan.gateName || 'Main Gate'} />
              <ScanDetail label="Truck" value={latestScanConsignment?.vehicleNo || 'N/A'} />
              <ScanDetail label="Scanned At" value={new Date(latestScan.createdAt).toLocaleString()} />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-6 text-center">
            <p className="text-sm font-bold text-on-surface">No QR scans recorded yet.</p>
            <p className="mt-1 text-sm text-on-surface-variant">The latest watchman scan will appear here automatically.</p>
          </div>
        )}
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

function ScanDetail({ label, value }) {
  return (
    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">{label}</p>
      <p className="mt-2 break-words text-sm font-black text-on-surface">{value}</p>
    </div>
  )
}

function ExecutiveMetric({ label, value, helper, tone }) {
  const toneClass = typeof tone === 'number'
    ? tone > 0
      ? 'text-tertiary'
      : tone < 0
        ? 'text-error'
        : 'text-on-surface'
    : 'text-primary'

  return (
    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">{label}</p>
      <p className={`mt-2 font-headline text-lg font-black ${toneClass}`}>{value}</p>
      {helper ? <p className="mt-1 text-xs font-medium text-on-surface-variant">{helper}</p> : null}
    </div>
  )
}
