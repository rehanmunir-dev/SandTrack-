import React, { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuth } from '../../../context/AuthContext'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'
import StatusBadge from '../../../components/StatusBadge'
import { useToast } from '../../../components/ToastProvider'
import { verifyQRAPI } from '../../../services/api'

export default function ScannerPage() {
  const { currentUser } = useAuth()
  const { consignments, drivers, trucks, clearGate, flagConsignment, flagDriver, flagTruck } = useRoleSystem()
  const toast = useToast()

  const [mode, setMode] = useState('camera') // 'manual' | 'camera'
  const [tokenInput, setTokenInput] = useState('')
  const [result, setResult] = useState(null) // { success: boolean, data?: any, errorType?: string, errorMessage?: string }
  const [gateCleared, setGateCleared] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [flagTarget, setFlagTarget] = useState(null)
  const [flagReason, setFlagReason] = useState('')

  const scannerRef = useRef(null)
  const scannerId = 'watchman-qr-scanner-feed'

  // Document Title
  useEffect(() => {
    document.title = 'SandTrack - Gate Scanner'
  }, [])

  // Keyboard Enter key shortcut to verify
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleVerify(tokenInput.trim())
    }
  }

  // Extract session token and check expiry if scanned string is a URL
  const parseToken = (input) => {
    try {
      if (input.startsWith('http://') || input.startsWith('https://')) {
        const url = new URL(input)
        const session = url.searchParams.get('session')
        const expires = url.searchParams.get('expires')
        const publicQrMatch = url.pathname.match(/\/public\/qr-pass\/([^/]+)/)
        return {
          token: session || publicQrMatch?.[1] || input,
          expires: expires ? Number(expires) : null
        }
      }
    } catch (_e) {}
    return { token: input, expires: null }
  }

  const handleVerify = async (rawInput) => {
    if (!rawInput.trim()) {
      toast.error('Please enter or scan a valid token.')
      return
    }

    setIsPending(true)
    setGateCleared(false)
    setResult(null)

    try {
      const { token, expires } = parseToken(rawInput)

      // 1. Check dynamic session expiration first
      if (expires && Date.now() > expires) {
        setResult({
          success: false,
          errorType: 'SESSION_EXPIRED',
          errorMessage: 'SESSION EXPIRED — Request driver to get new QR',
        })
        setIsPending(false)
        toast.error('Scan Failed: Session expired.')
        return
      }

      // 2. Perform real API validation on backend
      const res = await verifyQRAPI(token)
      if (res.data?.success && res.data?.valid) {
        const backendConsignment = res.data.data
        
        // Find in real loaded lists
        let consignment = consignments.find((item) => item.id === backendConsignment.id)
        if (!consignment) {
          consignment = {
            id: backendConsignment.id,
            consignmentId: backendConsignment.consignment_number,
            receiptId: backendConsignment.consignment_number,
            driverId: backendConsignment.driver_id,
            truckId: backendConsignment.truck_id,
            netWeight: Number(backendConsignment.weight_tons || 0),
            destination: backendConsignment.destination,
            originTerminal: backendConsignment.origin_location,
            materialType: backendConsignment.material_type,
            status: backendConsignment.status
          }
        }

        const driver = drivers.find((d) => d.id === consignment.driverId) || {
          id: backendConsignment.driver_id,
          name: backendConsignment.driver_name,
          cnic: backendConsignment.driver_cnic,
        }
        const truck = trucks.find((t) => t.id === consignment.truckId) || {
          id: backendConsignment.truck_id,
          vehicleNo: backendConsignment.truck_registration,
          type: backendConsignment.vehicle_type,
          wheelCount: backendConsignment.wheel_count,
        }

        setResult({
          success: true,
          consignment,
          driver,
          truck,
          rawToken: token,
        })
        toast.success('Consignment QR verified. Clear gate to release.')
      } else {
        const reason = res.data?.reason || 'QR_NOT_FOUND'
        const msg = res.data?.message || 'QR session token is invalid'
        setResult({
          success: false,
          errorType: reason,
          errorMessage: msg,
        })
        toast.error(`Scan Failed: ${msg}`)
      }
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.message || 'QR session token is invalid'
      setResult({
        success: false,
        errorType: 'QR_NOT_FOUND',
        errorMessage: msg,
      })
      toast.error('Security Alert: QR verification failed!')
    } finally {
      setIsPending(false)
    }
  }

  // Handle Gate Release and Log Creation
  const handleClearGate = async () => {
    if (!result?.success) return
    if (isPending || gateCleared) return
    setIsPending(true)

    try {
      await clearGate(result.consignment.id, result.rawToken)
      setGateCleared(true)
      toast.success('Gate cleared successfully! Green light active.')
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to clear gate.'
      toast.error(msg)
    } finally {
      setIsPending(false)
    }
  }

  const handleFlagSubmit = async (event) => {
    event.preventDefault()
    if (!flagTarget || !flagReason.trim()) {
      toast.error('Please enter a clear reason before flagging.')
      return
    }

    setIsPending(true)
    try {
      const reason = flagReason.trim()
      const targetId = flagTarget === 'driver'
        ? result?.driver?.id || result?.consignment?.driverId
        : flagTarget === 'truck'
          ? result?.truck?.id || result?.consignment?.truckId
          : result?.consignment?.id

      if (!targetId) {
        throw new Error(`The scanned pass does not contain a valid ${flagTarget} ID.`)
      }

      if (flagTarget === 'driver') {
        await flagDriver(targetId, reason)
      } else if (flagTarget === 'truck') {
        await flagTruck(targetId, reason)
      } else {
        await flagConsignment(targetId, reason)
      }

      setResult((previous) => ({
        ...previous,
        flaggedTargets: [...new Set([...(previous?.flaggedTargets || []), flagTarget])],
        lastFlagReason: reason,
      }))
      toast.success(`${flagTarget[0].toUpperCase()}${flagTarget.slice(1)} flagged. Operator and CEO have been notified.`)
      setFlagTarget(null)
      setFlagReason('')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unable to flag this issue.'
      toast.error(msg)
    } finally {
      setIsPending(false)
    }
  }

  // Camera Scanner Setup/Teardown
  useEffect(() => {
    if (mode !== 'camera') {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
      return
    }

    let scanner = null
    try {
      scanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          rememberLastUsedCamera: true,
          supportedScanTypes: [0], // Only allow camera scans
        },
        false
      )

      scanner.render(
        (decodedText) => {
          handleVerify(decodedText.trim())
          setMode('manual')
        },
        () => {}
      )
      scannerRef.current = scanner
    } catch (_error) {
      toast.error('Failed to initialize camera scanner.')
      setMode('manual')
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {})
      }
    }
  }, [mode])

  // Map invalid icons
  const getErrorIcon = (errorType) => {
    switch (errorType) {
      case 'SESSION_EXPIRED': return 'alarm'
      case 'QR_NOT_FOUND': return 'gpp_maybe'
      case 'WRONG_STATUS': return 'info'
      case 'ALREADY_USED': return 'block'
      default: return 'warning'
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center sm:text-left border-b border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 justify-center sm:justify-start">
                <span className="material-symbols-outlined text-3xl text-primary animate-pulse">security</span>
                Main Gate Security
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
                Hazro Terminal Outbound Clearance Gateway
              </p>
            </div>
          </div>
        </div>

        {/* MODE 2: Camera Scanner */}
        {mode === 'camera' && (
          <div className="app-card bg-slate-800 border-slate-700/60 p-6 flex flex-col items-center space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">photo_camera</span>
              Live Camera Feed
            </h3>
            <div 
              id={scannerId} 
              className="w-full max-w-sm overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-950 p-2 shadow-inner" 
            />
          </div>
        )}

        {/* Result Verification Cards */}
        {result && (
          <div className="space-y-6">
            
            {/* SUCCESS CARD */}
            {result.success && !gateCleared && (
              <div className="app-card border-2 border-emerald-500/30 bg-emerald-950/20 p-6 space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
                  <span className="material-symbols-outlined text-3xl text-emerald-400">verified</span>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-400">Consignment Authenticated</h3>
                    <p className="text-xs text-emerald-500/90 font-medium">Outbound load is clear for gate release</p>
                  </div>
                </div>

                {/* Driver Profile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="flex items-center gap-4 bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30">
                    <div className="w-16 h-16 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <span className="material-symbols-outlined text-4xl text-slate-400">person</span>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Assigned Driver</p>
                      <h4 className="text-base font-bold text-white mt-0.5">{result.driver?.name || 'N/A'}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">CNIC: {result.driver?.cnic || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Truck Info */}
                  <div className="flex items-center gap-4 bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30">
                    <div className="w-16 h-16 rounded-2xl bg-slate-700 border-2 border-slate-600 flex items-center justify-center flex-shrink-0 text-slate-400">
                      <span className="material-symbols-outlined text-4xl">local_shipping</span>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Truck Fleet Info</p>
                      <h4 className="text-base font-bold text-white mt-0.5">{result.truck?.vehicleNo || 'N/A'}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {result.truck?.type} • {result.truck?.wheelCount || 6} wheels
                      </p>
                    </div>
                  </div>

                  {/* Consignment load */}
                  <div className="col-span-1 md:col-span-2 rounded-2xl border border-slate-700/30 bg-slate-850 p-4 space-y-2.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-700 pb-1.5">Consignment Data</p>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs sm:text-sm text-slate-300">
                      <p><strong>Load Wt:</strong> {result.consignment?.netWeight} Tons</p>
                      <p><strong>Destination:</strong> {result.consignment?.destination}</p>
                      <p><strong>Origin:</strong> {result.consignment?.originTerminal || 'N/A'}</p>
                      <p><strong>Material:</strong> {result.consignment?.materialType || 'N/A'}</p>
                      <p><strong>Consignment No:</strong> {result.consignment?.consignmentId}</p>
                      <p><strong>Status:</strong> <span className="ml-1 inline-block"><StatusBadge status={result.consignment?.status} /></span></p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  {result.flaggedTargets?.length ? (
                    <div className="mb-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                      <p className="font-extrabold">Flag submitted to management</p>
                      <p className="mt-1 text-xs text-amber-200/80">
                        Flagged: {result.flaggedTargets.join(', ')}. Reason: {result.lastFlagReason}
                      </p>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      data-testid="clear-gate-btn"
                      onClick={handleClearGate}
                      disabled={isPending}
                      className="py-4 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-base sm:text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined font-extrabold text-2xl">check_circle</span>
                      {isPending ? 'CLEARING...' : 'CLEAR GATE'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlagTarget('consignment')}
                      disabled={isPending || result.flaggedTargets?.includes('consignment')}
                      className="py-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 text-amber-200 font-bold text-base sm:text-lg flex items-center justify-center gap-2 hover:bg-amber-500/20 transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-2xl">flag</span>
                      {result.flaggedTargets?.includes('consignment') ? 'CONSIGNMENT FLAGGED' : 'FLAG ISSUE'}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button type="button" disabled={isPending || result.flaggedTargets?.includes('driver')} onClick={() => setFlagTarget('driver')} className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                      {result.flaggedTargets?.includes('driver') ? 'Driver Flagged' : 'Flag Driver'}
                    </button>
                    <button type="button" disabled={isPending || result.flaggedTargets?.includes('truck')} onClick={() => setFlagTarget('truck')} className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                      {result.flaggedTargets?.includes('truck') ? 'Truck Flagged' : 'Flag Truck'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* GATE CLEARED FLASH SCREEN */}
            {gateCleared && (
              <div className="app-card border-2 border-emerald-500 bg-emerald-950 text-white p-8 text-center space-y-4 animate-scale-up">
                <span className="material-symbols-outlined text-7xl text-emerald-400 animate-pulse">
                  check_circle
                </span>
                <h2 className="font-headline text-3xl font-extrabold text-white">GATE CLEARED!</h2>
                <p className="text-sm sm:text-base font-semibold text-emerald-200/90 max-w-md mx-auto">
                  Truck outbound logs successfully finalized. Signal green light for exit release!
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setResult(null)
                      setTokenInput('')
                      setGateCleared(false)
                      setMode('camera')
                    }}
                    className="px-6 py-2.5 rounded-xl bg-white text-emerald-950 font-bold hover:bg-slate-100 transition-colors"
                  >
                    Scan Next Vehicle
                  </button>
                </div>
              </div>
            )}

            {/* INVALID/ERROR CARD */}
            {!result.success && (
              <div className="app-card border-2 border-error/30 bg-error-container/10 p-6 space-y-4 animate-shake">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-error">
                    {getErrorIcon(result.errorType)}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-error">Security Alert / Error</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Automated validation block logged</p>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-950/40 p-4 border border-slate-800 text-center font-bold text-sm sm:text-base text-error">
                  {result.errorMessage}
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => {
                      setResult(null)
                      setTokenInput('')
                      setMode('camera')
                    }}
                    className="app-btn-secondary px-4 py-2 bg-slate-850 border-slate-700 text-slate-300"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {flagTarget ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <form onSubmit={handleFlagSubmit} className="w-full max-w-lg rounded-2xl border border-amber-400/30 bg-slate-900 p-5 shadow-2xl">
              <div className="mb-4">
                <h3 className="text-lg font-extrabold text-amber-200">Flag {flagTarget}</h3>
                <p className="mt-1 text-xs text-slate-400">Use this when the driver, truck, QR pass, or consignment details look suspicious or incorrect.</p>
              </div>
              <textarea
                value={flagReason}
                onChange={(event) => setFlagReason(event.target.value)}
                className="min-h-28 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-amber-400"
                placeholder="Example: Driver face does not match, truck number mismatch, wrong destination, damaged QR, suspicious behavior..."
              />
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => { setFlagTarget(null); setFlagReason('') }} className="flex-1 rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-amber-400 px-4 py-3 text-sm font-extrabold text-slate-950 disabled:opacity-50">
                  Submit Flag
                </button>
              </div>
            </form>
          </div>
        ) : null}

      </div>
    </div>
  )
}
