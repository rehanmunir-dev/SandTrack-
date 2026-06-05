import { useEffect, useMemo, useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import SectionCard from '../../../components/common/SectionCard'
import StatusBadge from '../../../components/StatusBadge'
import { useAuth } from '../../../context/AuthContext'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'
import { formatPKR } from '../../../utils/formatCurrency'
import { formatDate } from '../../../utils/formatDate'

export default function QRDisplayPage() {
  const { currentUser } = useAuth()
  const { consignments, drivers, trucks } = useRoleSystem()

  // Session state parameters
  const [sessionToken, setSessionToken] = useState(null)
  const [expiresAt, setExpiresAt] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0) // seconds
  const [totalDuration, setTotalDuration] = useState(300) // default 5 minutes
  const [hasParams, setHasParams] = useState(false)
  const [selectedInlineConsignment, setSelectedInlineConsignment] = useState(null)

  // Wake Lock state
  const wakeLockRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const session = params.get('session')
    const expires = params.get('expires')

    if (session && expires) {
      setHasParams(true)
      setSessionToken(session)
      const expiryEpoch = Number(expires)
      setExpiresAt(expiryEpoch)
      
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((expiryEpoch - now) / 1000))
      setTimeLeft(remaining)
      
      // Calculate total duration for progress bar (cap to 5 min/300s or difference from now)
      const duration = Math.max(300, Math.floor((expiryEpoch - (expiryEpoch - 300000)) / 1000))
      setTotalDuration(duration)
    } else {
      setHasParams(false)
    }
  }, [])

  // Timer tick
  useEffect(() => {
    if (!expiresAt) return

    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
      setTimeLeft(remaining)

      // Vibrate at exactly 30 seconds remaining
      if (remaining === 30 && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200])
      }

      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  // Screen Wake Lock setup
  useEffect(() => {
    async function requestWakeLock() {
      if (typeof navigator !== 'undefined' && navigator.wakeLock) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        } catch (err) {
          console.warn('Wake Lock request failed:', err)
        }
      }
    }

    if (hasParams && timeLeft > 0) {
      requestWakeLock()
    }

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && hasParams && timeLeft > 0) {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null
        })
      }
    }
  }, [hasParams, timeLeft])

  // Locate active driver profile
  const assignedDriver = useMemo(() => {
    if (!currentUser) return null
    if (currentUser.driverProfileId) {
      return drivers.find((driver) => driver.id === currentUser.driverProfileId) || null
    }
    return drivers.find((driver) => driver.name?.trim().toLowerCase() === currentUser.name?.trim().toLowerCase()) || null
  }, [drivers, currentUser])

  // Driver assigned consignments
  const assignedConsignments = useMemo(() => {
    if (!assignedDriver) return []
    return consignments.filter((item) => item.driverId === assignedDriver.id)
  }, [consignments, assignedDriver])

  // Find active session consignment
  const activeConsignment = useMemo(() => {
    if (sessionToken) {
      return consignments.find((item) => item.qrCode === sessionToken) || null
    }
    return null
  }, [sessionToken, consignments])

  // Expiration boolean
  const isExpired = timeLeft <= 0

  // Timer color mapping
  const timerColor = timeLeft < 60 ? 'text-error font-extrabold animate-pulse' : 'text-on-surface font-bold'

  // Time formatting string
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Progress Bar color & width
  const progressPercentage = Math.min(100, Math.max(0, (timeLeft / totalDuration) * 100))
  const progressBarColor = 
    timeLeft < 60 ? 'bg-error' :
    timeLeft < 120 ? 'bg-amber-500' :
    'bg-tertiary'

  // Look up truck details
  const getTruckDetails = (truckId) => {
    const truck = trucks.find(t => t.id === truckId)
    return truck ? `${truck.vehicleNo} (${truck.type}, ${truck.wheelCount || 6} wheels)` : truckId || 'N/A'
  }

  // Render Full Screen Valid QR Code Session
  if (hasParams && !isExpired) {
    const consignmentToShow = activeConsignment || {
      consignmentId: 'CON-PENDING',
      truckId: 'N/A',
      netWeight: 25.5,
      destination: 'Hazro Terminal',
      status: 'IN_TRANSIT'
    }

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl p-6 text-slate-900 border border-slate-200">
          <div className="text-center space-y-4">
            <h2 className="font-headline text-lg sm:text-xl font-bold tracking-tight text-slate-800">
              ⚡ GATE SCANNER SECURITY SESSION (Active)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Keep screen bright. Present the high-contrast QR code to gate security.
            </p>

            {/* QR image element */}
            <div 
              data-testid="qr-image" 
              className="my-6 inline-flex rounded-3xl bg-white p-6 border border-slate-200 shadow-md transform hover:scale-102 transition-transform duration-200"
            >
              <QRCodeSVG value={sessionToken} size={280} level="H" includeMargin />
            </div>

            {/* Live countdown timer */}
            <div data-testid="qr-countdown" className="space-y-2">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-500">Session validity</span>
                <span className={timerColor}>Expires in {formatTime(timeLeft)}</span>
              </div>
              
              {/* Depleting progress bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/50">
                <div 
                  className={`h-full transition-all duration-1000 ${progressBarColor}`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Consignment Details */}
            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-150 p-4 text-left space-y-3 text-xs sm:text-sm">
              <h4 className="font-bold border-b border-slate-200 pb-2 text-slate-800">
                Consignment Details
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-700">
                <p><strong>Number:</strong> {consignmentToShow.consignmentId}</p>
                <p><strong>Truck:</strong> {getTruckDetails(consignmentToShow.truckId)}</p>
                <p><strong>Weight:</strong> {consignmentToShow.netWeight} Tons</p>
                <p><strong>Destination:</strong> {consignmentToShow.destination}</p>
                <div className="col-span-2 pt-1">
                  <strong>Status:</strong> <span className="ml-1 inline-block"><StatusBadge status={consignmentToShow.status} /></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Full Screen Expired Session Banner
  if (hasParams && isExpired) {
    return (
      <div 
        data-testid="qr-expired-banner"
        className="min-h-screen bg-error/95 flex flex-col items-center justify-center p-6 text-white text-center"
      >
        <span className="material-symbols-outlined text-7xl animate-bounce mb-4">
          lock_clock
        </span>
        <h1 className="font-headline text-3xl sm:text-4xl font-extrabold tracking-tight">
          ⏰ SESSION EXPIRED
        </h1>
        <p className="mt-4 text-base sm:text-lg font-semibold max-w-md opacity-90">
          The 5-minute transient QR session link has elapsed. Ask your terminal operator to generate a new QR session.
        </p>
        {expiresAt && (
          <p className="mt-6 text-xs opacity-75 font-mono">
            Expired on: {new Date(expiresAt).toLocaleTimeString()}
          </p>
        )}
        <button
          onClick={() => window.location.href = '/app'}
          className="mt-8 px-6 py-3 rounded-xl bg-white text-error font-bold shadow-md hover:bg-slate-50 transition-all active:scale-[0.98]"
        >
          Go to My Dashboard
        </button>
      </div>
    )
  }

  // Render Normal Driver Dashboard fallback when no session params are provided
  return (
    <div className="space-y-6">
      <SectionCard 
        title="Driver Dispatch Registry" 
        subtitle="Manage and display secure QR tokens for active dispatches."
      >
        {assignedConsignments.length > 0 ? (
          <div className="space-y-4">
            <div className="app-table-scroll rounded-2xl border border-outline-variant/15">
              <table className="app-table border-collapse text-left">
                <thead className="bg-surface-container-high text-on-surface-variant uppercase text-xs font-bold border-b border-outline-variant/15">
                  <tr>
                    <th className="px-4 py-3">Consignment</th>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3">Weight</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-sm">
                  {assignedConsignments.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-4 py-3 font-semibold text-on-surface">
                        {item.consignmentId}
                      </td>
                      <td className="px-4 py-3 font-medium text-on-surface-variant">
                        {item.destination}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {item.netWeight} Tons
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedInlineConsignment(
                            selectedInlineConsignment?.id === item.id ? null : item
                          )}
                          className="app-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">qr_code</span>
                          {selectedInlineConsignment?.id === item.id ? 'Hide QR' : 'View QR'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Inline QR Display Panel */}
            {selectedInlineConsignment && (
              <div className="mt-4 app-card border border-outline-variant/20 p-6 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in bg-white text-slate-900 max-w-sm mx-auto rounded-3xl shadow-lg">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Consignment QR Display
                </p>
                <div className="inline-flex rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
                  <QRCodeSVG value={selectedInlineConsignment.qrCode} size={200} level="M" includeMargin />
                </div>
                <p className="font-mono text-xs text-slate-500 break-all font-semibold">
                  {selectedInlineConsignment.qrCode}
                </p>
                <span className="inline-block mt-2">
                  <StatusBadge status={selectedInlineConsignment.status} />
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-outline-variant/15 p-8 text-center bg-surface-container-lowest">
            <span className="material-symbols-outlined text-4xl text-outline/60 mb-2">
              local_shipping
            </span>
            <p className="text-sm font-bold text-on-surface">No assigned consignments</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Contact terminal operators to assign sand trips to your profile.
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
