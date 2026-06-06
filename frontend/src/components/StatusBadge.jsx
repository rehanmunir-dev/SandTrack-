import React from 'react'

const BADGE_MAP = {
  // Consignment statuses
  SCAN_PENDING: {
    classes: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
    label: '⏳ Scan Pending',
  },
  scan_pending: {
    classes: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
    label: '⏳ Scan Pending',
  },
  PENDING: {
    classes: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
    label: '⏳ Pending',
  },
  CREATED: {
    classes: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
    label: '⏳ Pending',
  },
  created: {
    classes: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
    label: '⏳ Pending',
  },
  IN_TRANSIT: {
    classes: 'border-blue-200 bg-blue-50 text-blue-800',
    label: '🚛 In Transit',
  },
  ARRIVED: {
    classes: 'bg-primary-container text-primary border-primary/20',
    label: 'Arrived',
  },
  DELIVERY_PENDING_VERIFICATION: {
    classes: 'bg-secondary-fixed text-on-secondary-container border-secondary/20',
    label: 'Delivery Review',
  },
  on_way: {
    classes: 'border-blue-200 bg-blue-50 text-blue-800',
    label: '🚛 In Transit',
  },
  GATE_CLEARED: {
    classes: 'bg-primary-container text-primary border-primary/20',
    label: '🔓 Gate Cleared',
  },
  gate_verified: {
    classes: 'bg-primary-container text-primary border-primary/20',
    label: '🔓 Gate Cleared',
  },
  DELIVERED: {
    classes: 'border-emerald-700 bg-emerald-700 text-white',
    label: '✅ Delivered',
  },
  delivered: {
    classes: 'border-emerald-700 bg-emerald-700 text-white',
    label: '✅ Delivered',
  },
  BILLED: {
    classes: 'bg-teal-50 text-teal-700 border-teal-200',
    label: '🧾 Billed',
  },
  CLOSED: {
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    label: 'Closed',
  },
  FLAGGED: {
    classes: 'bg-error-container text-error border-error/20',
    label: 'Flagged',
  },
  CANCELLED: {
    classes: 'bg-error-container text-error border-error/20',
    label: '❌ Cancelled',
  },

  // Payment statuses
  PAID: {
    classes: 'border-emerald-700 bg-emerald-700 text-white',
    label: '✅ Paid',
  },
  paid: {
    classes: 'border-emerald-700 bg-emerald-700 text-white',
    label: '✅ Paid',
  },
  pending: {
    classes: 'border-amber-200 bg-amber-50 text-amber-800',
    label: '⏳ Pending',
  },
  held: {
    classes: 'bg-error-container text-error border-error/20',
    label: '⚠️ Held',
  },
  overdue: {
    classes: 'bg-error text-white border-transparent',
    label: '🚨 Overdue',
  },

  // Driver/Truck approvals
  approved: {
    classes: 'bg-tertiary-container text-tertiary border-tertiary/20',
    label: '✅ Approved',
  },
}

export default function StatusBadge({ status, size = 'md' }) {
  const normalized = String(status || '').toUpperCase()
  const exactNormalized = String(status || '')

  const item = BADGE_MAP[exactNormalized] || BADGE_MAP[normalized] || {
    classes: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
    label: typeof status === 'string' ? status.replaceAll('_', ' ') : status,
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  }

  return (
    <span className={`inline-flex items-center rounded-full border font-bold uppercase tracking-wider transition-all duration-200 ${sizeClasses[size] || sizeClasses.md} ${item.classes}`}>
      {item.label}
    </span>
  )
}
