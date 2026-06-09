const COLOR_MAP = {
  CREATED: 'border-slate-300 bg-slate-100 text-slate-700',
  LOADED: 'border-blue-950 bg-blue-950 text-white',
  SCAN_PENDING: 'border-blue-200 bg-blue-50 text-blue-800',
  IN_TRANSIT: 'border-orange-200 bg-orange-50 text-orange-800',
  ARRIVED: 'border-violet-200 bg-violet-50 text-violet-800',
  DELIVERY_PENDING_VERIFICATION: 'border-violet-200 bg-violet-50 text-violet-800',
  AT_GATE: 'border-amber-200 bg-amber-50 text-amber-800',
  VERIFIED_FOR_RELEASE: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  DELIVERED: 'border-emerald-700 bg-emerald-700 text-white',
  FLAGGED: 'border-red-200 bg-red-50 text-red-800',
  BILLED: 'border-teal-200 bg-teal-50 text-teal-800',
  CLOSED: 'border-emerald-900 bg-emerald-900 text-white',
  NOT_SUBMITTED: 'border-slate-300 bg-slate-100 text-slate-700',
  PENDING_VERIFICATION: 'border-amber-200 bg-amber-50 text-amber-800',
  VERIFIED: 'border-emerald-700 bg-emerald-700 text-white',
  REJECTED: 'border-red-700 bg-red-700 text-white',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  PAID: 'border-emerald-700 bg-emerald-700 text-white',
  PAYMENT_PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  PAYMENT_VERIFIED: 'border-emerald-700 bg-emerald-700 text-white',
  HELD: 'border-orange-200 bg-orange-50 text-orange-800',
  OVERDUE: 'border-red-700 bg-red-700 text-white',
  VALID: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  USED: 'border-slate-300 bg-slate-100 text-slate-700',
  INVALID: 'border-red-200 bg-red-50 text-red-800',
  WAITING: 'border-slate-300 bg-slate-100 text-slate-700',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  'ON ROUTE': 'border-blue-200 bg-blue-50 text-blue-800',
  INFO: 'border-blue-200 bg-blue-50 text-blue-800',
  WARNING: 'border-amber-200 bg-amber-50 text-amber-800',
  CRITICAL: 'border-red-700 bg-red-700 text-white',
  RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  OPEN: 'border-red-200 bg-red-50 text-red-800',
}

export default function StatusBadge({ status }) {
  const normalized = String(status || '').toUpperCase()
  const classes = COLOR_MAP[normalized] || 'border-slate-300 bg-slate-100 text-slate-700'
  const labelMap = {
    SCAN_PENDING: 'Scan Pending',
    IN_TRANSIT: 'On The Way',
    ARRIVED: 'Arrived',
    DELIVERED: 'Delivered',
    CLOSED: 'Closed',
    FLAGGED: 'Flagged',
    PAYMENT_PENDING: 'Payment Pending',
    PAYMENT_VERIFIED: 'Payment Verified',
  }
  const label = labelMap[normalized] || (typeof status === 'string' ? status.replaceAll('_', ' ') : status)

  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase ${classes}`}>
      {label}
    </span>
  )
}
