const COLOR_MAP = {
  CREATED: 'bg-surface-container-high text-on-surface',
  LOADED: 'bg-primary-container text-on-primary',
  IN_TRANSIT: 'bg-secondary-container/20 text-secondary',
  ARRIVED: 'bg-primary-container text-primary',
  DELIVERY_PENDING_VERIFICATION: 'bg-secondary-fixed text-on-secondary-container',
  AT_GATE: 'bg-secondary-fixed text-on-secondary-container',
  VERIFIED_FOR_RELEASE: 'bg-primary-fixed text-on-primary-fixed-variant',
  DELIVERED: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  FLAGGED: 'bg-error-container text-on-error-container',
  BILLED: 'bg-teal-50 text-teal-700',
  CLOSED: 'bg-surface-variant text-on-surface-variant',

  created: 'bg-surface-container-high text-on-surface',
  gate_verified: 'bg-primary-container text-on-primary',
  on_way: 'bg-secondary-container/20 text-secondary',
  delivered: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  flagged: 'bg-error-container text-on-error-container',

  NOT_SUBMITTED: 'bg-surface-container-high text-on-surface-variant',
  PENDING_VERIFICATION: 'bg-secondary-fixed text-on-secondary-container',
  VERIFIED: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  REJECTED: 'bg-error-container text-on-error-container',

  pending: 'bg-surface-container-high text-on-surface-variant',
  paid: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  held: 'bg-error-container text-on-error-container',
  overdue: 'bg-error text-white',

  valid: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  used: 'bg-surface-container-high text-on-surface-variant',
  invalid: 'bg-error-container text-on-error-container',

  waiting: 'bg-surface-container-high text-on-surface-variant',
  approved: 'bg-primary-container text-on-primary',
  'on route': 'bg-secondary-fixed text-on-secondary-container',

  INFO: 'bg-primary-fixed text-on-primary-fixed-variant',
  WARNING: 'bg-secondary-fixed text-on-secondary-container',
  CRITICAL: 'bg-error-container text-on-error-container',
  RESOLVED: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',

  OPEN: 'bg-error-container text-on-error-container',
}

export default function StatusBadge({ status }) {
  const classes = COLOR_MAP[status] || 'bg-surface-container-high text-on-surface-variant'
  const label = typeof status === 'string' ? status.replaceAll('_', ' ') : status

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${classes}`}>
      {label}
    </span>
  )
}
