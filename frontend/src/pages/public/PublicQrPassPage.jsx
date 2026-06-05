import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { getPublicQrPassAPI } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'

function formatDate(value) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString()
}

export default function PublicQrPassPage() {
  const { token } = useParams()
  const [pass, setPass] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadPass() {
      try {
        const res = await getPublicQrPassAPI(token)
        if (isMounted) {
          setPass(res.data?.data || null)
          setError('')
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'This QR pass is not available.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPass()
    return () => {
      isMounted = false
    }
  }, [token])

  const qrValue = useMemo(() => token || '', [token])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <p className="text-sm font-bold uppercase tracking-widest text-slate-300">Loading secure pass...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-white">
        <div className="max-w-md rounded-2xl border border-red-400/30 bg-red-950/30 p-6">
          <img src="/sandtrack-logo.jpg" alt="SandTrack" className="mx-auto mb-5 h-auto w-56 object-contain" />
          <h1 className="text-2xl font-extrabold">QR Pass Unavailable</h1>
          <p className="mt-3 text-sm text-red-100">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-900 sm:p-6">
      <main className="mx-auto max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="bg-slate-900 px-6 py-6 text-center text-white">
          <img src="/sandtrack-logo.jpg" alt="SandTrack" className="mx-auto h-auto w-64 object-contain" />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-slate-300">Secure Gate Pass</p>
        </header>

        <section className="p-6">
          <div className="flex justify-center">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <QRCodeSVG value={qrValue} size={260} level="H" includeMargin />
            </div>
          </div>

          <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-500">Status</span>
              <StatusBadge status={pass.status} />
            </div>
            <p><span className="font-semibold text-slate-500">Consignment:</span> {pass.consignment_number}</p>
            <p><span className="font-semibold text-slate-500">Driver:</span> {pass.driver_name || 'N/A'}</p>
            <p><span className="font-semibold text-slate-500">Truck:</span> {pass.truck_registration || 'N/A'}</p>
            <p><span className="font-semibold text-slate-500">Destination:</span> {pass.destination || 'N/A'}</p>
            <p><span className="font-semibold text-slate-500">Material:</span> {pass.material_type || 'Sand'}</p>
            <p><span className="font-semibold text-slate-500">Weight:</span> {Number(pass.weight_tons || 0)} tons</p>
            <p><span className="font-semibold text-slate-500">Expires:</span> {formatDate(pass.qr_expires_at)}</p>
          </div>

          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-xs font-bold uppercase tracking-wider text-amber-800">
            This pass is valid only for one-time gate clearance.
          </p>
        </section>
      </main>
    </div>
  )
}
