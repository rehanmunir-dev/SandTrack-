import React, { useState, useMemo, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import SectionCard from '../../components/common/SectionCard'
import { useRoleSystem } from '../../context/roleSystem/RoleSystemContext'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { formatPKR } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

// Constant color mappings for Donut and Status Charts
const DONUT_COLORS = ['#3b82f6', '#10b981'] // Bank vs Cash
const STATUS_COLORS = {
  PENDING: '#94a3b8',
  SCAN_PENDING: '#94a3b8',
  CREATED: '#94a3b8',
  created: '#94a3b8',
  IN_TRANSIT: '#3b82f6',
  on_way: '#3b82f6',
  GATE_CLEARED: '#a855f7',
  gate_verified: '#a855f7',
  ARRIVED: '#0ea5e9',
  DELIVERY_PENDING_VERIFICATION: '#f59e0b',
  DELIVERED: '#10b981',
  delivered: '#10b981',
  BILLED: '#14b8a6',
  CLOSED: '#0f766e',
  FLAGGED: '#ef4444',
  CANCELLED: '#ef4444',
}

const RANGE_OPTIONS = [
  { value: '7D', label: '7 Days', days: 7 },
  { value: '30D', label: '30 Days', days: 30 },
  { value: '90D', label: '90 Days', days: 90 },
  { value: 'ALL', label: 'All Time', days: null },
]

function isPaidPayment(payment) {
  const status = String(payment?.status || '').toUpperCase()
  return status === 'PAID' || status === 'VERIFIED'
}

function isPendingPayment(payment) {
  return String(payment?.status || '').toUpperCase() === 'PENDING'
}

function isFlaggedPayment(payment) {
  const status = String(payment?.status || '').toUpperCase()
  return status === 'HELD' || status === 'OVERDUE' || status === 'FLAGGED'
}

function normalizeStatus(status) {
  const normalized = String(status || '').toUpperCase().replaceAll('-', '_')
  const legacyMap = {
    CREATED: 'PENDING',
    GATE_VERIFIED: 'GATE_CLEARED',
    ON_WAY: 'IN_TRANSIT',
  }

  return legacyMap[normalized] || normalized
}

function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function changeLabel(change) {
  if (change === null || change === undefined) return 'All-time total'
  if (change === 0) return 'No change'
  return `${change > 0 ? '+' : ''}${change}% vs prior period`
}

export default function AnalyticsDashboardPage() {
  const { consignments, payments, drivers, trucks } = useRoleSystem()

  // State
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [rangeFilter, setRangeFilter] = useState('30D')
  const [selectedConsignmentForModal, setSelectedConsignmentForModal] = useState(null)

  // Document Title
  useEffect(() => {
    document.title = 'SandTrack - Analytics Dashboard'
  }, [])

  const selectedRange = RANGE_OPTIONS.find((option) => option.value === rangeFilter) || RANGE_OPTIONS[1]

  const rangeData = useMemo(() => {
    if (!selectedRange.days) {
      return {
        consignments,
        payments,
        previousConsignments: [],
        previousPayments: [],
      }
    }

    const now = Date.now()
    const duration = selectedRange.days * 24 * 60 * 60 * 1000
    const currentStart = now - duration
    const previousStart = currentStart - duration
    const inRange = (value, start, end) => {
      const time = new Date(value).getTime()
      return Number.isFinite(time) && time >= start && time < end
    }

    return {
      consignments: consignments.filter((item) => inRange(item.createdAt, currentStart, now)),
      payments: payments.filter((item) => inRange(item.verifiedAt || item.createdAt, currentStart, now)),
      previousConsignments: consignments.filter((item) => inRange(item.createdAt, previousStart, currentStart)),
      previousPayments: payments.filter((item) => inRange(item.verifiedAt || item.createdAt, previousStart, currentStart)),
    }
  }, [consignments, payments, selectedRange.days])

  // 1. KPI Aggregators
  const kpis = useMemo(() => {
    const totalConsignments = rangeData.consignments.length
    
    const totalRevenue = rangeData.payments
      .filter(isPaidPayment)
      .reduce((sum, p) => sum + p.amount, 0)
      
    const pendingPaymentsCount = rangeData.payments
      .filter(isPendingPayment)
      .length
      
    const flaggedPaymentsCount = rangeData.payments
      .filter(isFlaggedPayment)
      .length

    const previousRevenue = rangeData.previousPayments
      .filter(isPaidPayment)
      .reduce((sum, p) => sum + p.amount, 0)
    const delivered = rangeData.consignments.filter((item) => ['DELIVERED', 'CLOSED', 'BILLED'].includes(normalizeStatus(item.status))).length
    const previousDelivered = rangeData.previousConsignments.filter((item) => ['DELIVERED', 'CLOSED', 'BILLED'].includes(normalizeStatus(item.status))).length
    const totalTons = rangeData.consignments.reduce((sum, item) => sum + Number(item.netWeight || 0), 0)
    const previousTons = rangeData.previousConsignments.reduce((sum, item) => sum + Number(item.netWeight || 0), 0)
    const verifiedPayments = rangeData.payments.filter(isPaidPayment).length
    const hasComparison = Boolean(selectedRange.days)

    return {
      consignments: { value: totalConsignments, change: hasComparison ? percentChange(totalConsignments, rangeData.previousConsignments.length) : null },
      revenue: { value: totalRevenue, change: hasComparison ? percentChange(totalRevenue, previousRevenue) : null },
      pending: { value: pendingPaymentsCount, change: hasComparison ? percentChange(pendingPaymentsCount, rangeData.previousPayments.filter(isPendingPayment).length) : null },
      flagged: { value: flaggedPaymentsCount, change: hasComparison ? percentChange(flaggedPaymentsCount, rangeData.previousPayments.filter(isFlaggedPayment).length) : null },
      delivered,
      deliveredChange: hasComparison ? percentChange(delivered, previousDelivered) : null,
      totalTons,
      tonsChange: hasComparison ? percentChange(totalTons, previousTons) : null,
      completionRate: totalConsignments ? Math.round((delivered / totalConsignments) * 100) : 0,
      collectionRate: rangeData.payments.length ? Math.round((verifiedPayments / rangeData.payments.length) * 100) : 0,
      averageLoad: totalConsignments ? totalTons / totalConsignments : 0,
      revenuePerOrder: totalConsignments ? totalRevenue / totalConsignments : 0,
    }
  }, [rangeData, selectedRange.days])

  // 2. Chart 1: Daily Revenue last 30 days
  const dailyRevenueData = useMemo(() => {
    const dailyMap = {}
    const now = Date.now()
    const chartDays = selectedRange.days ? Math.min(selectedRange.days, 30) : 30
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000)
      const label = d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })
      dailyMap[label] = 0
    }

    rangeData.payments.forEach(p => {
      if (isPaidPayment(p)) {
        const dateLabel = new Date(p.verifiedAt || p.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })
        if (dailyMap[dateLabel] !== undefined) {
          dailyMap[dateLabel] += p.amount
        }
      }
    })

    // Fallback: If all are zero (e.g. fresh seed), use 0
    const hasData = Object.values(dailyMap).some(v => v > 0)
    return Object.entries(dailyMap).map(([date, amount]) => ({
      date,
      amount: hasData ? amount : 0
    }))
  }, [rangeData.payments, selectedRange.days])

  // 3. Chart 2: Cash vs Bank Donut Data
  const paymentSplitData = useMemo(() => {
    let cashCount = 0
    let bankCount = 0
    
    rangeData.payments.forEach((p) => {
      if (!isPaidPayment(p)) {
        return
      }

      if (String(p.method).toLowerCase().includes('cash')) {
        cashCount++
      } else {
        bankCount++
      }
    })

    return [
      { name: 'Bank Transfer', value: bankCount },
      { name: 'Cash Payment', value: cashCount },
    ]
  }, [rangeData.payments])

  // 4. Chart 3: Consignments by Status Bar Chart Data
  const statusChartData = useMemo(() => {
    const counts = {
      PENDING: 0,
      SCAN_PENDING: 0,
      IN_TRANSIT: 0,
      ARRIVED: 0,
      DELIVERY_PENDING_VERIFICATION: 0,
      DELIVERED: 0,
      BILLED: 0,
      CLOSED: 0,
      FLAGGED: 0,
      CANCELLED: 0,
    }

    rangeData.consignments.forEach(c => {
      const normalized = normalizeStatus(c.status)
      if (counts[normalized] !== undefined) {
        counts[normalized]++
      }
    })

    return Object.entries(counts).map(([name, count]) => ({
      name: name.replaceAll('_', ' '),
      count,
      color: STATUS_COLORS[name] || '#64748b'
    }))
  }, [rangeData.consignments])

  const executiveInsights = useMemo(() => {
    const pendingAmount = rangeData.payments
      .filter(isPendingPayment)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const activeConsignments = rangeData.consignments.filter((item) =>
      ['SCAN_PENDING', 'IN_TRANSIT', 'ARRIVED', 'DELIVERY_PENDING_VERIFICATION'].includes(normalizeStatus(item.status))
    ).length
    const mostCommonStatus = statusChartData.reduce(
      (highest, item) => item.count > highest.count ? item : highest,
      { name: 'NO DATA', count: 0 }
    )
    const bestRevenueDay = dailyRevenueData.reduce(
      (highest, item) => item.amount > highest.amount ? item : highest,
      { date: 'N/A', amount: 0 }
    )

    const healthMessages = []
    if (kpis.completionRate >= 80) {
      healthMessages.push('Delivery completion is strong for the selected period.')
    } else if (kpis.consignments.value > 0) {
      healthMessages.push('Delivery completion is below 80%; review active and arrived consignments.')
    } else {
      healthMessages.push('No consignments were created in the selected period.')
    }

    if (kpis.collectionRate >= 80) {
      healthMessages.push('Payment collection is healthy.')
    } else if (rangeData.payments.length > 0) {
      healthMessages.push('Payment collection needs attention from the accountant.')
    } else {
      healthMessages.push('No payment records exist in this period.')
    }

    return {
      pendingAmount,
      activeConsignments,
      mostCommonStatus,
      bestRevenueDay,
      healthMessages,
    }
  }, [dailyRevenueData, kpis, rangeData.consignments, rangeData.payments, statusChartData])

  // Click handler on Bar Chart to filter the consignment list
  const handleBarClick = (data) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedStatus = data.activePayload[0].payload.name.replaceAll(' ', '_')
      setStatusFilter(clickedStatus === statusFilter ? 'ALL' : clickedStatus)
      setCurrentPage(1)
    }
  }

  // 5. Paginated Consignment Table Logic
  const filteredConsignments = useMemo(() => {
    return rangeData.consignments.filter(c => {
      if (statusFilter === 'ALL') return true
      return normalizeStatus(c.status) === statusFilter.toUpperCase()
    })
  }, [rangeData.consignments, statusFilter])

  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(filteredConsignments.length / ITEMS_PER_PAGE) || 1
  const paginatedConsignments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredConsignments.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredConsignments, currentPage])

  // Resolve Driver name
  const getDriverName = (driverId) => {
    const driver = drivers.find(d => d.id === driverId)
    return driver ? driver.name : 'N/A'
  }

  // Resolve Truck Registration
  const getTruckReg = (truckId) => {
    const truck = trucks.find(t => t.id === truckId)
    return truck ? truck.vehicleNo : 'N/A'
  }

  // Find associated payment
  const getPaymentStatus = (consignmentId) => {
    const payment = payments.find((p) =>
      String(p.consignmentDbId || p.consignmentId) === String(consignmentId)
    )
    return payment ? payment.status : 'PENDING'
  }

  // Export to CSV utility
  const handleExportCSV = () => {
    const headers = 'ID,Driver,Truck,Weight (Tons),Status,Date,Payment Status\n'
    const rows = filteredConsignments.map(c => {
      const driver = (c.driverName || getDriverName(c.driverId)).replace(',', ' ')
      const truck = c.truckRegistration || getTruckReg(c.truckId)
      const payStatus = getPaymentStatus(c.id)
      return `${c.consignmentId},${driver},${truck},${c.netWeight},${c.status},${new Date(c.createdAt).toLocaleDateString()},${payStatus}`
    }).join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `SandTrack_Analytics_Report_${Date.now()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col gap-4 border-b border-outline-variant/10 pb-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-background tracking-tight">
            Terminal Intelligence & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">
            Real-time logistical throughput, cash flows, and payment audits.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2 rounded-xl border border-outline-variant/15 bg-surface-container-low p-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setRangeFilter(option.value)
                  setCurrentPage(1)
                }}
                className={`rounded-lg px-3 py-2 text-xs font-black transition-colors ${
                  rangeFilter === option.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportCSV}
            className="app-btn-secondary px-4 py-2.5 flex items-center justify-center gap-2 border border-outline-variant hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Export to CSV
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-outline-variant/15 bg-gradient-to-br from-primary/10 via-surface-container-lowest to-secondary/10 p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Executive Reading</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="font-headline text-xl font-black text-on-surface">
              {selectedRange.label} performance overview
            </h2>
            <div className="mt-3 space-y-2">
              {executiveInsights.healthMessages.map((message) => (
                <p key={message} className="flex items-start gap-2 text-sm font-medium text-on-surface">
                  <span className="material-symbols-outlined mt-0.5 text-base text-primary">insights</span>
                  {message}
                </p>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InsightMetric label="Active Orders" value={executiveInsights.activeConsignments} />
            <InsightMetric label="Pending Amount" value={formatPKR(executiveInsights.pendingAmount)} />
            <InsightMetric label="Largest Queue" value={executiveInsights.mostCommonStatus.name.replaceAll('_', ' ')} />
            <InsightMetric label="Best Revenue Day" value={executiveInsights.bestRevenueDay.date} />
          </div>
        </div>
      </section>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI 1 */}
        <div className="app-kpi-card flex items-start justify-between border-l-4 border-l-primary shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total Consignments</p>
            <p className="font-headline text-3xl font-black text-on-surface mt-1">{kpis.consignments.value}</p>
            <span className={`text-[10px] font-bold ${kpis.consignments.change >= 0 ? 'text-tertiary' : 'text-error'}`}>{changeLabel(kpis.consignments.change)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="app-kpi-card flex items-start justify-between border-l-4 border-l-tertiary shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total Revenue (PKR)</p>
            <p className="font-headline text-lg sm:text-xl md:text-2xl font-black text-on-surface mt-1.5 truncate">
              {formatPKR(kpis.revenue.value)}
            </p>
            <span className={`text-[10px] font-bold ${kpis.revenue.change >= 0 ? 'text-tertiary' : 'text-error'}`}>{changeLabel(kpis.revenue.change)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined">payments</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="app-kpi-card flex items-start justify-between border-l-4 border-l-amber-500 shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Pending Payments</p>
            <p className="font-headline text-3xl font-black text-on-surface mt-1">{kpis.pending.value}</p>
            <span className={`text-[10px] font-bold ${kpis.pending.change <= 0 ? 'text-tertiary' : 'text-error'}`}>{changeLabel(kpis.pending.change)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="app-kpi-card flex items-start justify-between border-l-4 border-l-error shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Flagged / Held Payments</p>
            <p className="font-headline text-3xl font-black text-on-surface mt-1">{kpis.flagged.value}</p>
            <span className={`text-[10px] font-bold ${kpis.flagged.change <= 0 ? 'text-tertiary' : 'text-error'}`}>{changeLabel(kpis.flagged.change)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error">
            <span className="material-symbols-outlined">gpp_maybe</span>
          </div>
        </div>

      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DetailMetric label="Delivered / Closed" value={kpis.delivered} change={kpis.deliveredChange} helper="Completed orders in period" />
        <DetailMetric label="Total Tons Moved" value={`${kpis.totalTons.toFixed(1)} tons`} change={kpis.tonsChange} helper="Total dispatched weight" />
        <DetailMetric label="Completion Rate" value={`${kpis.completionRate}%`} helper="Completed orders divided by total orders" />
        <DetailMetric label="Payment Collection" value={`${kpis.collectionRate}%`} helper="Verified payments divided by all payments" />
        <DetailMetric label="Average Load" value={`${kpis.averageLoad.toFixed(1)} tons`} helper="Average weight per consignment" />
        <DetailMetric label="Revenue Per Order" value={formatPKR(Math.round(kpis.revenuePerOrder))} helper="Verified revenue efficiency" />
        <DetailMetric label="Verified Transactions" value={rangeData.payments.filter(isPaidPayment).length} helper="Paid payment records" />
        <DetailMetric label="Fleet Availability" value={`${trucks.filter((item) => item.status === 'active').length} trucks`} helper={`${drivers.filter((item) => item.status === 'active').length} active drivers`} />
      </section>

      {/* Row 1 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Revenue Area Chart (2/3 width) */}
        <div className="lg:col-span-2">
          <SectionCard 
            title="Daily Revenue Trend" 
            subtitle={`PKR value from verified payments within ${selectedRange.label.toLowerCase()}`}
          >
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(225,226,236,0.3)" />
                  <XAxis dataKey="date" stroke="#75777f" fontSize={10} tickLine={false} />
                  <YAxis 
                    stroke="#75777f" 
                    fontSize={10} 
                    tickLine={false} 
                    tickFormatter={(val) => `${val/1000}k`} 
                  />
                  <Tooltip 
                    formatter={(val) => [formatPKR(val), 'Revenue']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(225, 226, 236, 0.5)' }} 
                  />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Cash vs Bank Donut (1/3 width) */}
        <div>
          <SectionCard 
            title="Payment Methods Split" 
            subtitle="Volume percentage share of cash vs direct bank ledger deposits"
          >
            <div className="h-[280px] flex flex-col items-center justify-center">
              {paymentSplitData.some((item) => item.value > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={paymentSplitData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {paymentSplitData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-sm font-semibold text-on-surface-variant">
                  No verified payment methods yet.
                </div>
              )}
              <p className="text-xs font-semibold text-on-surface-variant mt-2">
                Verified Transaction Volume: {rangeData.payments.filter(isPaidPayment).length} Payments
              </p>
            </div>
          </SectionCard>
        </div>

      </div>

      {/* Row 2 Chart: Consignments by Status Bar Chart */}
      <SectionCard 
        title="Consignments Lifecycle Breakdown" 
        subtitle="Current status distribution. Click any bar to filter details table below."
      >
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={statusChartData} 
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onClick={handleBarClick}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(225,226,236,0.3)" />
              <XAxis dataKey="name" stroke="#75777f" fontSize={10} tickLine={false} />
              <YAxis stroke="#75777f" fontSize={10} tickLine={false} allowDecimals={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(225, 226, 236, 0.1)' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(225, 226, 236, 0.5)' }} 
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Table Section */}
      <SectionCard 
        title={statusFilter === 'ALL' ? 'All Consignments' : `${statusFilter.replaceAll('_', ' ')} Consignments`}
        subtitle="Logistical load ledgers, assignments, and payments audits."
        right={
          statusFilter !== 'ALL' && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="rounded-lg bg-surface-container-high px-3 py-1.5 text-xs font-bold text-primary hover:bg-surface-container-highest"
            >
              Clear Status Filter
            </button>
          )
        }
      >
        {filteredConsignments.length === 0 ? (
          <EmptyState 
            icon="drafts" 
            title="No consignments found" 
            message="No dispatch listings correspond to the selected filters." 
          />
        ) : (
          <div className="space-y-4">
            <div className="app-table-scroll overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="app-table border-collapse text-left">
                <thead className="border-b border-blue-950 bg-blue-950 text-xs font-bold uppercase text-white">
                  <tr>
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Driver</th>
                    <th className="px-5 py-4">Truck</th>
                    <th className="px-5 py-4">Weight</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {paginatedConsignments.map((c) => (
                    <tr 
                      key={c.id} 
                      onClick={() => setSelectedConsignmentForModal(c)}
                      className="cursor-pointer transition-colors odd:bg-white even:bg-slate-50 hover:bg-blue-50"
                    >
                      <td className="px-5 py-4 font-bold text-blue-950">{c.consignmentId}</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{c.driverName || getDriverName(c.driverId)}</td>
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">{c.truckRegistration || getTruckReg(c.truckId)}</td>
                      <td className="px-5 py-4 font-medium text-slate-700">{c.netWeight} Tons</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-700">{formatDate(c.createdAt)}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={getPaymentStatus(c.id)} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-outline-variant/10 pt-3">
                <p className="text-xs text-on-surface-variant">
                  Showing page {currentPage} of {totalPages} ({filteredConsignments.length} items)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="app-btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="app-btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Consignment Details Modal */}
      {selectedConsignmentForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedConsignmentForModal(null)} />
          <div className="relative w-full max-w-lg bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 shadow-2xl animate-scale-up text-sm text-on-surface">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3 mb-4">
              <h3 className="font-headline text-lg font-bold text-on-background">
                Consignment Details: {selectedConsignmentForModal.consignmentId}
              </h3>
              <button 
                onClick={() => setSelectedConsignmentForModal(null)}
                className="material-symbols-outlined text-outline/80 hover:text-on-surface"
              >
                close
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface-container-high p-4 border border-outline-variant/15">
                <p><strong>Driver Profile:</strong> {selectedConsignmentForModal.driverName || getDriverName(selectedConsignmentForModal.driverId)}</p>
                <p><strong>Truck Registered:</strong> {selectedConsignmentForModal.truckRegistration || getTruckReg(selectedConsignmentForModal.truckId)}</p>
                <p><strong>Origin:</strong> {selectedConsignmentForModal.originTerminal || 'Hazro'}</p>
                <p><strong>Destination:</strong> {selectedConsignmentForModal.destination}</p>
                <p><strong>Net Load weight:</strong> {selectedConsignmentForModal.netWeight} Tons</p>
                <p><strong>Lifecycle:</strong> <span className="ml-1 inline-block"><StatusBadge status={selectedConsignmentForModal.status} /></span></p>
              </div>

              {selectedConsignmentForModal.notes && (
                <div className="p-3 bg-surface-container-highest rounded-xl text-xs text-on-surface-variant font-medium italic">
                  Notes: "{selectedConsignmentForModal.notes}"
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-outline-variant/15 pt-3">
              <button
                onClick={() => setSelectedConsignmentForModal(null)}
                className="app-btn-secondary px-4 py-2 text-xs"
              >
                Close detail view
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function InsightMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/70 p-3 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-on-surface-variant">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-on-surface">{value}</p>
    </div>
  )
}

function DetailMetric({ label, value, helper, change }) {
  const changeTone = typeof change === 'number'
    ? change > 0
      ? 'text-tertiary'
      : change < 0
        ? 'text-error'
        : 'text-on-surface-variant'
    : ''

  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">{label}</p>
      <p className="mt-2 font-headline text-xl font-black text-primary">{value}</p>
      {change !== undefined ? <p className={`mt-1 text-xs font-bold ${changeTone || 'text-on-surface-variant'}`}>{changeLabel(change)}</p> : null}
      <p className="mt-1 text-xs font-medium text-on-surface-variant">{helper}</p>
    </div>
  )
}
