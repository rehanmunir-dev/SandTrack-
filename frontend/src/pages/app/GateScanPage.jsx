import { useMemo, useState } from 'react'
import SectionCard from '../../components/common/SectionCard'
import StatusBadge from '../../components/common/StatusBadge'
import { useAppState } from '../../context/AppStateContext'
import { useAuth } from '../../context/AuthContext'

export default function GateScanPage() {
  const { currentUser } = useAuth()
  const { scanHistory, consignments, scanGateQr, confirmGateRelease } = useAppState()
  const [qrCode, setQrCode] = useState('')
  const [gateName, setGateName] = useState('Gate-01')

  const lastScan = scanHistory[0] || null

  const targetConsignment = useMemo(() => {
    if (!lastScan?.consignmentId) {
      return null
    }

    return consignments.find((item) => item.id === lastScan.consignmentId) || null
  }, [lastScan, consignments])

  function handleScan(event) {
    event.preventDefault()

    if (!qrCode.trim()) {
      return
    }

    scanGateQr({
      qrCode: qrCode.trim(),
      actor: currentUser.name,
      gateName,
    })

    setQrCode('')
  }

  function handleConfirmRelease() {
    if (!targetConsignment) {
      return
    }

    confirmGateRelease({
      consignmentId: targetConsignment.id,
      actor: currentUser.name,
      gateName,
    })
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Live Gate Scan" subtitle="Mobile-first quick release verification">
        <form onSubmit={handleScan} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              value={qrCode}
              onChange={(event) => setQrCode(event.target.value)}
              className="rounded border border-slate-300 px-3 py-3 text-base md:col-span-2"
              placeholder="Scan or enter QR code"
            />
            <input
              value={gateName}
              onChange={(event) => setGateName(event.target.value)}
              className="rounded border border-slate-300 px-3 py-3 text-base"
              placeholder="Gate name"
            />
          </div>
          <button
            className="w-full md:w-auto rounded bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            type="submit"
          >
            Scan and Verify
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Latest Scan Result">
        {!lastScan ? (
          <p className="text-sm text-slate-500">No scans yet.</p>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <p className="font-semibold">Result:</p>
              <StatusBadge status={lastScan.result === 'VALID' ? 'VERIFIED' : 'FLAGGED'} />
            </div>
            <p>QR: {lastScan.qrCode}</p>
            <p>Gate: {lastScan.gateName}</p>
            <p>Time: {new Date(lastScan.at).toLocaleString()}</p>
            <p>Reason: {lastScan.reason || 'Checks passed'}</p>

            {targetConsignment ? (
              <div className="rounded border border-slate-200 p-3">
                <p className="font-semibold">Consignment {targetConsignment.receiptId}</p>
                <p>Status: <StatusBadge status={targetConsignment.status} /></p>
              </div>
            ) : null}

            {lastScan.result === 'VALID' && targetConsignment?.status === 'AT_GATE' ? (
              <button
                type="button"
                onClick={handleConfirmRelease}
                className="rounded bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Confirm Release
              </button>
            ) : (
              <p className="text-xs text-slate-500">
                Release is enabled only when QR is valid and consignment is at gate.
              </p>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
