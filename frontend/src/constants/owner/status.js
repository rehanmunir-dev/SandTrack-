export const LOGISTICS_STATUS = {
  LOADED: 'loaded',
  ON_WAY: 'on-way',
  DELIVERED: 'delivered',
  FLAGGED: 'flagged',
  DELAYED: 'delayed',
  GATE_CLEARED: 'gate-cleared',
}

export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  HELD: 'held',
  OVERDUE: 'overdue',
}

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
}

export const TERMINAL_STATUS = {
  OPERATIONAL: 'operational',
  CAUTION: 'caution',
  STANDBY: 'standby',
  OFFLINE: 'offline',
}

export const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
}

export const ALERT_REVIEW_STATE = {
  NEW: 'new',
  IN_REVIEW: 'in-review',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
}

export const STATUS_LABELS = {
  [LOGISTICS_STATUS.LOADED]: 'Loaded',
  [LOGISTICS_STATUS.ON_WAY]: 'On Way',
  [LOGISTICS_STATUS.DELIVERED]: 'Delivered',
  [LOGISTICS_STATUS.FLAGGED]: 'Flagged',
  [LOGISTICS_STATUS.DELAYED]: 'Delayed',
  [LOGISTICS_STATUS.GATE_CLEARED]: 'Gate Cleared',
  [PAYMENT_STATUS.PAID]: 'Paid',
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.HELD]: 'Held',
  [PAYMENT_STATUS.OVERDUE]: 'Overdue',
  [USER_STATUS.ACTIVE]: 'Active',
  [USER_STATUS.INACTIVE]: 'Inactive',
  [USER_STATUS.SUSPENDED]: 'Suspended',
  [TERMINAL_STATUS.OPERATIONAL]: 'Operational',
  [TERMINAL_STATUS.CAUTION]: 'Caution',
  [TERMINAL_STATUS.STANDBY]: 'Standby',
  [TERMINAL_STATUS.OFFLINE]: 'Offline',
  [ALERT_SEVERITY.INFO]: 'Info',
  [ALERT_SEVERITY.WARNING]: 'Warning',
  [ALERT_SEVERITY.CRITICAL]: 'Critical',
  [ALERT_REVIEW_STATE.NEW]: 'New',
  [ALERT_REVIEW_STATE.IN_REVIEW]: 'In Review',
  [ALERT_REVIEW_STATE.RESOLVED]: 'Resolved',
  [ALERT_REVIEW_STATE.DISMISSED]: 'Dismissed',
}

export const STATUS_BADGE_CLASS = {
  [LOGISTICS_STATUS.LOADED]: 'bg-blue-950 text-white',
  [LOGISTICS_STATUS.ON_WAY]: 'bg-blue-50 text-blue-800',
  [LOGISTICS_STATUS.DELIVERED]: 'bg-emerald-700 text-white',
  [LOGISTICS_STATUS.FLAGGED]: 'bg-red-50 text-red-800',
  [LOGISTICS_STATUS.DELAYED]: 'bg-red-700 text-white',
  [LOGISTICS_STATUS.GATE_CLEARED]: 'bg-indigo-50 text-indigo-800',
  [PAYMENT_STATUS.PAID]: 'bg-emerald-700 text-white',
  [PAYMENT_STATUS.PENDING]: 'bg-amber-50 text-amber-800',
  [PAYMENT_STATUS.HELD]: 'bg-orange-50 text-orange-800',
  [PAYMENT_STATUS.OVERDUE]: 'bg-red-700 text-white',
  [USER_STATUS.ACTIVE]: 'bg-emerald-50 text-emerald-800',
  [USER_STATUS.INACTIVE]: 'bg-slate-100 text-slate-700',
  [USER_STATUS.SUSPENDED]: 'bg-red-50 text-red-800',
  [TERMINAL_STATUS.OPERATIONAL]: 'bg-emerald-50 text-emerald-800',
  [TERMINAL_STATUS.CAUTION]: 'bg-amber-50 text-amber-800',
  [TERMINAL_STATUS.STANDBY]: 'bg-slate-100 text-slate-700',
  [TERMINAL_STATUS.OFFLINE]: 'bg-red-50 text-red-800',
  [ALERT_SEVERITY.INFO]: 'bg-blue-50 text-blue-800',
  [ALERT_SEVERITY.WARNING]: 'bg-amber-50 text-amber-800',
  [ALERT_SEVERITY.CRITICAL]: 'bg-red-700 text-white',
  [ALERT_REVIEW_STATE.NEW]: 'bg-blue-50 text-blue-800',
  [ALERT_REVIEW_STATE.IN_REVIEW]: 'bg-amber-50 text-amber-800',
  [ALERT_REVIEW_STATE.RESOLVED]: 'bg-emerald-50 text-emerald-800',
  [ALERT_REVIEW_STATE.DISMISSED]: 'bg-slate-100 text-slate-700',
}
