import React from 'react'

const BADGE_MAP = {
  SCAN_PENDING: {
    classes: 'border-blue-200 bg-blue-50 text-blue-800',
    label: 'Scan Pending',
  },
  PAYMENT_PENDING: {
    classes: 'border-amber-200 bg-amber-50 text-amber-800',
    label: 'Payment Pending',
  },
  PAYMENT_VERIFIED: {
    classes: 'border-emerald-700 bg-emerald-700 text-white',
    label: 'Payment Verified',
  },
  PENDING: {
    classes: 'border-amber-200 bg-amber-50 text-amber-800',
    label: 'Pending',
  },
  CREATED: {
    classes: 'border-slate-300 bg-slate-100 text-slate-700',
    label: 'Pending',
  },
  IN_TRANSIT: {
    classes: 'border-orange-200 bg-orange-50 text-orange-800',
    label: 'On The Way',
  },
  ARRIVED: {
    classes: 'border-violet-200 bg-violet-50 text-violet-800',
    label: 'Arrived',
  },
  DELIVERY_PENDING_VERIFICATION: {
    classes: 'border-violet-200 bg-violet-50 text-violet-800',
    label: 'Delivery Review',
  },
  ON_WAY: {
    classes: 'border-blue-200 bg-blue-50 text-blue-800',
    label: 'In Transit',
  },
  GATE_CLEARED: {
    classes: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    label: 'Gate Cleared',
  },
  GATE_VERIFIED: {
    classes: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    label: 'Gate Cleared',
  },
  DELIVERED: {
    classes: 'border-emerald-700 bg-emerald-700 text-white',
    label: 'Delivered',
  },
  BILLED: {
    classes: 'border-teal-200 bg-teal-50 text-teal-800',
    label: 'Billed',
  },
  CLOSED: {
    classes: 'border-emerald-900 bg-emerald-900 text-white',
    label: 'Closed',
  },
  FLAGGED: {
    classes: 'border-red-200 bg-red-50 text-red-800',
    label: 'Flagged',
  },
  CANCELLED: {
    classes: 'border-red-700 bg-red-700 text-white',
    label: 'Cancelled',
  },
  PAID: {
    classes: 'border-emerald-700 bg-emerald-700 text-white',
    label: 'Paid',
  },
  VERIFIED: {
    classes: 'border-emerald-700 bg-emerald-700 text-white',
    label: 'Verified',
  },
  HELD: {
    classes: 'border-orange-200 bg-orange-50 text-orange-800',
    label: 'Held',
  },
  OVERDUE: {
    classes: 'border-red-700 bg-red-700 text-white',
    label: 'Overdue',
  },
  APPROVED: {
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    label: 'Approved',
  },
  ACTIVE: {
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    label: 'Active',
  },
  INACTIVE: {
    classes: 'border-slate-300 bg-slate-100 text-slate-700',
    label: 'Inactive',
  },
  VALID: {
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    label: 'Valid',
  },
  INVALID: {
    classes: 'border-red-200 bg-red-50 text-red-800',
    label: 'Invalid',
  },
}

export default function StatusBadge({ status, size = 'md' }) {
  const normalized = String(status || '').toUpperCase()
  const item = BADGE_MAP[normalized] || {
    classes: 'border-slate-300 bg-slate-100 text-slate-700',
    label: typeof status === 'string' ? status.replaceAll('_', ' ') : status,
  }

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm',
  }

  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border font-extrabold uppercase ${sizeClasses[size] || sizeClasses.md} ${item.classes}`}>
      {item.label}
    </span>
  )
}
