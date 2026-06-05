import { useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import StatusBadge from '../common/StatusBadge'

function formatDate(value) {
  if (!value) return 'N/A'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString()
}

function formatPhoneForWhatsApp(phone = '') {
  const digits = String(phone).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('0') && digits.length === 11) {
    return `92${digits.slice(1)}`
  }
  return digits
}

function buildShareMessage(pass, publicPassUrl) {
  return [
    'SandTrack QR Gate Pass',
    `Consignment: ${pass.consignmentId || 'N/A'}`,
    `Driver: ${pass.driverName || 'N/A'}`,
    `Truck: ${pass.truckVehicleNo || 'N/A'}`,
    `Destination: ${pass.destination || 'N/A'}`,
    `Weight: ${pass.netWeight || pass.weightTons || 'N/A'} tons`,
    '',
    `Open QR pass: ${publicPassUrl}`,
    '',
    'This pass is valid only for one-time gate clearance.'
  ].join('\n')
}

export default function OperatorQrPassActions({ pass, compact = false }) {
  const [printPass, setPrintPass] = useState(null)
  const publicPassUrl = useMemo(() => {
    if (!pass?.qrCode) return ''
    return `${window.location.origin}/public/qr-pass/${pass.qrCode}`
  }, [pass?.qrCode])

  if (!pass?.qrCode) return null

  const message = buildShareMessage(pass, publicPassUrl)
  const phone = formatPhoneForWhatsApp(pass.driverPhone)
  const whatsappUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`

  async function copyLink() {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(publicPassUrl)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = publicPassUrl
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    alert(`Public QR pass copied:\n${publicPassUrl}`)
  }

  function printQrPass() {
    setPrintPass(pass)
    window.setTimeout(() => {
      window.print()
      window.setTimeout(() => setPrintPass(null), 300)
    }, 80)
  }

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          [data-operator-print-pass="active"],
          [data-operator-print-pass="active"] * {
            visibility: visible !important;
          }
          [data-operator-print-pass="active"] {
            position: fixed !important;
            inset: 0 !important;
            display: block !important;
            background: white !important;
            color: #0f172a !important;
            padding: 28px !important;
            z-index: 99999 !important;
          }
          @page {
            size: A4;
            margin: 14mm;
          }
        }
      `}</style>

      <div className={`no-print flex flex-wrap gap-2 ${compact ? 'justify-end' : 'justify-start'}`}>
        <button
          type="button"
          onClick={copyLink}
          className="rounded border border-primary px-3 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-white"
        >
          Copy Link
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded border border-emerald-600 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white"
        >
          Send WhatsApp
        </a>
        <button
          type="button"
          onClick={printQrPass}
          className="rounded bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
        >
          Print Pass
        </button>
      </div>

      {printPass ? (
        <section data-operator-print-pass="active" className="hidden">
          <div style={{ maxWidth: '760px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            <header style={{ borderBottom: '3px solid #0f172a', paddingBottom: '16px', textAlign: 'center' }}>
              <img src="/sandtrack-logo.jpg" alt="SandTrack" style={{ width: '260px', height: 'auto', margin: '0 auto 10px' }} />
              <h1 style={{ fontSize: '28px', margin: 0, letterSpacing: '0.06em' }}>SECURE QR GATE PASS</h1>
              <p style={{ margin: '8px 0 0', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                Valid only for one-time gate clearance
              </p>
            </header>

            <main style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'center', paddingTop: '26px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-block', border: '2px solid #0f172a', padding: '16px', background: '#fff' }}>
                  <QRCodeSVG value={publicPassUrl} size={420} level="H" includeMargin />
                </div>
                <p style={{ marginTop: '12px', fontSize: '11px', wordBreak: 'break-all', color: '#475569' }}>{publicPassUrl}</p>
              </div>

              <div style={{ fontSize: '15px', lineHeight: 1.7 }}>
                <Detail label="Consignment" value={printPass.consignmentId} />
                <Detail label="Driver" value={printPass.driverName} />
                <Detail label="Driver Phone" value={printPass.driverPhone} />
                <Detail label="Truck" value={printPass.truckVehicleNo} />
                <Detail label="Truck Type" value={printPass.truckType} />
                <Detail label="Material" value={printPass.materialType || printPass.notes || 'Sand Load'} />
                <Detail label="Weight" value={`${printPass.netWeight || printPass.weightTons || 'N/A'} tons`} />
                <Detail label="Origin" value={printPass.originTerminal} />
                <Detail label="Destination" value={printPass.destination} />
                <Detail label="Expires" value={formatDate(printPass.qrExpiresAt)} />
                <div style={{ marginTop: '12px' }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</span>
                  <StatusBadge status={printPass.status} />
                </div>
              </div>
            </main>

            <footer style={{ marginTop: '28px', borderTop: '1px solid #cbd5e1', paddingTop: '14px', fontSize: '12px', color: '#475569', textAlign: 'center' }}>
              Scan this pass at the gate. QR reuse is blocked after gate clearance.
            </footer>
          </div>
        </section>
      ) : null}
    </>
  )
}

function Detail({ label, value }) {
  return (
    <p style={{ margin: '0 0 8px' }}>
      <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{label}</span>
      <strong>{value || 'N/A'}</strong>
    </p>
  )
}
