import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { getPublicQrPassAPI } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'
import StatusTimeline from '../../components/StatusTimeline'

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
      <main className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="bg-slate-900 px-6 py-6 text-center text-white">
          <img src="/sandtrack-logo.jpg" alt="SandTrack" className="mx-auto h-auto w-64 object-contain" />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-slate-300">Secure Gate Pass</p>
        </header>

        <section className="grid gap-6 p-5 lg:grid-cols-[0.9fr_1.1fr] lg:p-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">One-time gate clearance</p>
            <div className="mt-4 flex justify-center">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <QRCodeSVG value={qrValue} size={280} level="H" includeMargin />
              </div>
            </div>
            <p className="mt-4 break-all text-xs font-bold text-slate-500">{token}</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Consignment</p>
                  <h1 className="mt-1 font-headline text-2xl font-black text-slate-950">{pass.consignment_number}</h1>
                </div>
                <StatusBadge status={pass.status} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
              <Detail label="Driver" value={pass.driver_name || 'N/A'} />
              <Detail label="Truck" value={pass.truck_registration || 'N/A'} />
              <Detail label="Destination" value={pass.destination || 'N/A'} />
              <Detail label="Material" value={pass.material_type || 'Sand'} />
              <Detail label="Weight" value={`${Number(pass.weight_tons || 0)} tons`} />
              <Detail label="Expires" value={formatDate(pass.qr_expires_at)} />
            </div>

            <StatusTimeline status={pass.status} hasQr />
          </div>

          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-xs font-bold uppercase tracking-wider text-amber-800 lg:col-span-2">
            This pass is valid only for one-time gate clearance.
          </p>
        </section>
      </main>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-950">{value}</p>
    </div>
  )
}
