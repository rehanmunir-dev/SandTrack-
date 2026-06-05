import { useEffect, useMemo, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import SectionCard from '../../../components/common/SectionCard'
import StatusBadge from '../../../components/common/StatusBadge'
import { useAuth } from '../../../context/AuthContext'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'

export default function WatchmanScanPage() {
  const { currentUser } = useAuth()
  const { scanQrCode } = useRoleSystem()
  const [result, setResult] = useState(null)
  const [scanError, setScanError] = useState('')

  const scannerId = useMemo(() => 'watchman-qr-scanner', [])

  useEffect(() => {
    let scanner = null

    try {
      scanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          supportedScanTypes: [1],
        },
        false,
      )

      scanner.render(
        (decodedText) => {
          const next = scanQrCode(decodedText.trim(), currentUser?.name || 'Watchman', 'Main Gate')
          setResult(next)
          setScanError('')
        },
        () => {
          setScanError('')
        },
      )
    } catch (_error) {
      setScanError('Camera scanner could not be initialized in this browser.')
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {})
      }
    }
  }, [scannerId, scanQrCode, currentUser?.name])

  return (
    <div className="space-y-6">
      <SectionCard title="Gate Scanner" subtitle="Use the camera to scan the QR code shown on the driver or operator screen.">
        <div className="space-y-3">
          <div id={scannerId} className="overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest" />
          <p className="text-xs text-on-surface-variant">
            Allow camera access and point it at the QR image. If camera is blocked, use the browser permission prompt.
          </p>
          {scanError ? <p className="text-xs text-error">{scanError}</p> : null}
        </div>
      </SectionCard>

      {result ? (
        <SectionCard title="Scan Result" subtitle="Validation feedback">
          <div className="space-y-3">
            <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4 text-sm">
              <p className="font-semibold">Result: <StatusBadge status={result.result} /></p>
              <p className="text-xs text-on-surface-variant">{result.entry.qrCode}</p>
            </div>
            {result.result === 'valid' ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Valid scan. Consignment is now gate verified and marked on way.</p>
            ) : result.result === 'used' ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">Duplicate scan detected.</p>
            ) : (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Invalid QR. No matching consignment found.</p>
            )}
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}
