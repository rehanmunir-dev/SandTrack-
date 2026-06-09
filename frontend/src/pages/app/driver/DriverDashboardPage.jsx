import { useMemo, useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import SectionCard from '../../../components/common/SectionCard'
import StatusBadge from '../../../components/StatusBadge'
import WorkflowGuide from '../../../components/WorkflowGuide'
import { useAuth } from '../../../context/AuthContext'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'
import StatusTimeline from '../../../components/StatusTimeline'

export default function DriverDashboardPage() {
  const { currentUser } = useAuth()
  const { consignments, drivers } = useRoleSystem()

  const [urlSessionCode, setUrlSessionCode] = useState(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const session = params.get('session')
    const expires = params.get('expires')

    if (session && expires) {
      if (Date.now() > Number(expires)) {
        setSessionExpired(true)
      } else {
        setUrlSessionCode(session)
      }
    }
  }, [])

  const assignedDriver = useMemo(() => {
    if (!currentUser) {
      return null
    }

    // 1. Match by database user ID first (100% exact match)
    const byUserId = drivers.find((driver) => Number(driver.userId) === Number(currentUser.id))
    if (byUserId) {
      return byUserId
    }

    if (currentUser.driverProfileId) {
      const byProfileId = drivers.find((driver) => driver.id === currentUser.driverProfileId)
      if (byProfileId) {
        return byProfileId
      }
    }

    return drivers.find((driver) => driver.name?.trim().toLowerCase() === currentUser.name?.trim().toLowerCase()) || null
  }, [drivers, currentUser])

  const assignedConsignments = useMemo(() => consignments.filter((item) => item.driverId === assignedDriver?.id), [consignments, assignedDriver])
  
  const currentTrip = useMemo(() => {
    if (urlSessionCode && !sessionExpired) {
      return consignments.find(c => c.qrCode === urlSessionCode) || assignedConsignments[0] || null
    }
    return assignedConsignments[0] || null
  }, [urlSessionCode, sessionExpired, consignments, assignedConsignments])

  // Mock Activity Log
  const activityLog = useMemo(() => {
    if (!currentTrip) return []
    const log = [
      { time: currentTrip.createdAt, text: 'Consignment created and assigned' }
    ]
    if (currentTrip.gateVerifiedAt) log.push({ time: currentTrip.gateVerifiedAt, text: 'Gate entry verified' })
    if (currentTrip.onWayAt) log.push({ time: currentTrip.onWayAt, text: 'In transit to destination' })
    if (currentTrip.deliveredAt) log.push({ time: currentTrip.deliveredAt, text: 'Delivered successfully' })
    if (currentTrip.isFlagged) log.push({ time: new Date().toISOString(), text: `Flagged: ${currentTrip.flagReason || 'Issue detected'}` })
    return log.sort((a, b) => new Date(b.time) - new Date(a.time))
  }, [currentTrip])

  return (
    <div className="space-y-6">
      {sessionExpired && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm">
          <p className="font-bold text-lg">QR Session Expired</p>
          <p className="text-sm">The 5-minute link has expired. Please request a new link from the operator.</p>
        </div>
      )}
      
      <section className="rounded-2xl border border-outline-variant/15 bg-gradient-to-br from-primary/10 via-surface-container-lowest to-secondary/10 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Driver Trip Desk</p>
            <h1 className="mt-2 font-headline text-2xl font-black text-on-surface">Driver Dashboard</h1>
            <p className="mt-1 text-sm font-medium text-on-surface-variant">One trip at a time. Show the assigned QR at the gate.</p>
          </div>
          {currentTrip && !sessionExpired ? <StatusBadge status={currentTrip.status} size="lg" /> : null}
        </div>
      </section>

      <SectionCard title="Current Trip" subtitle="Confirm the truck, destination, and QR before reaching the gate.">
        <WorkflowGuide
          title="Driver flow"
          items={[
            { label: '1. Open QR', description: 'Keep the QR visible before reaching the security gate.' },
            { label: '2. Match truck', description: 'Make sure your truck and destination details are correct.' },
            { label: '3. Gate scan', description: 'Show the QR to the watchman and wait for gate clearance.' },
          ]}
        />
        {currentTrip && !sessionExpired ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-5 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
              <div className="flex flex-col items-center text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Active QR</p>
                <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-5 shadow-md">
                  <QRCodeSVG value={currentTrip.qrCode} size={240} level="M" includeMargin />
                </div>
                <p className="mt-4 break-all text-sm font-semibold text-on-surface-variant">{currentTrip.qrCode}</p>
                <p className="mt-2 text-xs text-on-surface-variant">Consignment {currentTrip.consignmentId}</p>
                {currentTrip.isFlagged && <p className="mt-2 rounded-xl border border-error/20 bg-error/10 px-3 py-2 text-xs font-black text-error">THIS CONSIGNMENT IS FLAGGED</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 text-sm text-on-surface sm:grid-cols-2">
                <p><strong>Driver:</strong> {assignedDriver?.name || 'N/A'}</p>
                <p><strong>Truck:</strong> {currentTrip.truckId}</p>
                <p><strong>Origin:</strong> {currentTrip.originTerminal || 'N/A'}</p>
                <p><strong>Destination:</strong> {currentTrip.destination || 'N/A'}</p>
                <p><strong>Status:</strong> <StatusBadge status={currentTrip.status} /></p>
                <p><strong>Net Wt:</strong> {currentTrip.netWeight} Tons</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <StatusTimeline status={currentTrip.status} hasQr={Boolean(currentTrip.qrCode)} />
              <h3 className="border-b border-outline-variant/20 pb-3 font-headline text-lg font-extrabold text-on-surface">Trip Activity</h3>
              <div className="space-y-3">
                {activityLog.map((log, index) => (
                  <div key={index} className="flex gap-4 rounded-r-lg border-l-4 border-primary bg-surface-container-lowest py-3 pl-4 pr-3 shadow-sm">
                    <div className="text-xs text-on-surface-variant whitespace-nowrap w-20">
                      {new Date(log.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="text-sm font-medium text-on-surface">
                      {log.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !sessionExpired ? (
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 text-center">
            <p className="text-sm font-semibold text-on-surface">No active consignment assigned yet.</p>
            <p className="mt-2 text-sm text-on-surface-variant">Wait for the operator to assign your trip, then the QR will appear here.</p>
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}
