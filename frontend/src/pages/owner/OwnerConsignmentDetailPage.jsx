import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import DetailCard from '../../components/owner/DetailCard'
import OwnerStatusBadge from '../../components/owner/OwnerStatusBadge'
import EmptyState from '../../components/owner/EmptyState'
import { useOwnerData } from '../../context/owner/OwnerContext'
import { getConsignmentFullDetailAPI } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'
import StatusTimeline from '../../components/StatusTimeline'

export default function OwnerConsignmentDetailPage() {
  const { id } = useParams()
  const { consignments, terminals, users, alerts } = useOwnerData()
  const [fullDetail, setFullDetail] = useState(null)

  const consignment = consignments.find((item) => String(item.id) === String(id))

  useEffect(() => {
    let isMounted = true

    async function loadFullDetail() {
      try {
        const res = await getConsignmentFullDetailAPI(id)
        if (isMounted) {
          setFullDetail(res.data?.data || null)
        }
      } catch (err) {
        console.error('Failed to load full consignment detail:', err)
      }
    }

    loadFullDetail()
    const interval = setInterval(loadFullDetail, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [id])

  if (!consignment) {
    return <EmptyState title="Consignment not found" subtitle="Please return to consignments list." />
  }

  const backendConsignment = fullDetail?.consignment
  const payments = fullDetail?.payments || []
  const gateLogs = fullDetail?.gateLogs || []
  const ledgerEntries = fullDetail?.ledgerEntries || []
  const activityLogs = fullDetail?.activityLogs || []
  const latestPayment = payments[0]
  const latestLedger = ledgerEntries[0]
  const terminal = terminals.find((item) => item.id === consignment.terminalId)
  const creator = users.find((item) => item.id === consignment.createdByUserId)
  const relatedAlerts = alerts.filter((alert) => alert.consignmentId === consignment.id)

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-outline-variant/15 bg-gradient-to-br from-primary/10 via-surface-container-lowest to-secondary/10 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">CEO Command Center</p>
            <h1 className="mt-2 font-headline text-2xl font-black text-on-surface">{consignment.receiptId}</h1>
            <p className="mt-1 text-sm font-medium text-on-surface-variant">
              Driver, truck, QR, gate, payment, ledger, and activity visibility in one place.
            </p>
          </div>
          <StatusBadge status={backendConsignment?.status || consignment.logisticsStatus} size="lg" />
        </div>
      </section>

      <StatusTimeline
        status={backendConsignment?.status || consignment.logisticsStatus}
        paymentStatus={latestPayment?.status}
        hasQr={Boolean(backendConsignment?.qr_token || consignment.qrCode)}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DetailCard title="Consignment Summary">
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold">Receipt:</span> {consignment.receiptId}</p>
            <p><span className="font-semibold">Vehicle:</span> {consignment.vehicleNo}</p>
            <p><span className="font-semibold">Driver:</span> {consignment.driverName}</p>
            <p><span className="font-semibold">Route:</span> {consignment.route}</p>
            <p><span className="font-semibold">Weight:</span> {consignment.weightTons} tons</p>
            <p><span className="font-semibold">Material:</span> {backendConsignment?.material_type || consignment.sourceMine}</p>
          </div>
        </DetailCard>

        <DetailCard title="Operational State">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Logistics</span>
              <OwnerStatusBadge status={consignment.logisticsStatus} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Payment</span>
              <OwnerStatusBadge status={consignment.paymentStatus} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Flagged</span>
              <OwnerStatusBadge status={consignment.flagged ? 'flagged' : 'delivered'} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Lifecycle</span>
              <StatusBadge status={backendConsignment?.status || consignment.logisticsStatus} />
            </div>
          </div>
        </DetailCard>

        <DetailCard title="Driver / Truck">
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold">Terminal:</span> {terminal?.name || 'N/A'}</p>
            <p><span className="font-semibold">Handled By:</span> {creator?.name || 'N/A'}</p>
            <p><span className="font-semibold">Driver CNIC:</span> {backendConsignment?.driver_cnic || 'N/A'}</p>
            <p><span className="font-semibold">Truck Type:</span> {backendConsignment?.vehicle_type || 'N/A'}</p>
            <p><span className="font-semibold">Destination:</span> {consignment.destination}</p>
          </div>
        </DetailCard>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DetailCard title="QR Status">
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold">Token:</span> {backendConsignment?.qr_token ? 'Active' : 'Used / Not active'}</p>
            <p><span className="font-semibold">Expires:</span> {formatDate(backendConsignment?.qr_expires_at)}</p>
          </div>
        </DetailCard>

        <DetailCard title="Payment Status">
          <ListRows rows={payments} empty="No payment record." render={(payment) => (
            <div>
              <p className="font-semibold">PKR {payment.amount}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                <span>{payment.payment_method}</span>
                <StatusBadge status={payment.status} size="sm" />
              </div>
            </div>
          )} />
        </DetailCard>

        <DetailCard title="Ledger Entries">
          <ListRows rows={ledgerEntries} empty="No ledger entries." render={(entry) => (
            <div>
              <p className="font-semibold">{entry.entry_type} - PKR {entry.amount}</p>
              <div className="mt-1">
                <StatusBadge status={entry.status} size="sm" />
              </div>
            </div>
          )} />
        </DetailCard>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DetailCard title="Gate Logs">
          <ListRows rows={gateLogs} empty="No gate logs." render={(log) => (
            <div>
              <p className="font-semibold">{log.scan_result} by {log.watchman_name || 'Watchman'}</p>
              <p className="text-xs text-on-surface-variant">{formatDate(log.scanned_at)}</p>
            </div>
          )} />
        </DetailCard>

        <DetailCard title="Recent Activity Log">
          <ListRows rows={activityLogs} empty="No activity yet." render={(log) => (
            <div>
              <p className="font-semibold">{log.action}</p>
              <p className="text-xs text-on-surface-variant">{log.actor_name || log.actor_role} - {formatDate(log.created_at)}</p>
            </div>
          )} />
        </DetailCard>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DetailCard title="Finance Summary">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Latest Payment</p>
              <p className="mt-2 font-headline text-xl font-black text-primary">PKR {latestPayment?.amount || 0}</p>
              <div className="mt-2"><StatusBadge status={latestPayment?.status || 'PENDING'} size="sm" /></div>
            </div>
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Ledger</p>
              <p className="mt-2 font-headline text-xl font-black text-primary">{latestLedger?.entry_type || 'Not closed'}</p>
              <div className="mt-2"><StatusBadge status={latestLedger?.status || 'OPEN'} size="sm" /></div>
            </div>
          </div>
        </DetailCard>

        <DetailCard title="Related Alerts / Fraud Flags">
          {!relatedAlerts.length ? (
            <EmptyState title="No alert linked" subtitle="No fraud/exception record for this consignment." />
          ) : (
            <div className="space-y-2">
              {relatedAlerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <OwnerStatusBadge status={alert.severity} />
                    <OwnerStatusBadge status={alert.reviewState} />
                  </div>
                  <p className="text-sm font-semibold text-on-surface">{alert.title}</p>
                  <p className="text-xs text-on-surface-variant">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </DetailCard>
      </section>

      <DetailCard title="Quick Links">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/owner/terminal" className="rounded-lg border border-outline-variant px-3 py-2">Open Terminal View</Link>
          <Link to="/owner/alerts" className="rounded-lg border border-outline-variant px-3 py-2">Open Alerts View</Link>
          <Link to="/owner/users" className="rounded-lg border border-outline-variant px-3 py-2">Open User Oversight</Link>
        </div>
      </DetailCard>
    </div>
  )
}

function formatDate(value) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString()
}

function ListRows({ rows, empty, render }) {
  if (!rows.length) {
    return <EmptyState title={empty} subtitle="" />
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3 text-sm">
          {render(row)}
        </div>
      ))}
    </div>
  )
}
