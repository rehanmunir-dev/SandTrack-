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
  [LOGISTICS_STATUS.LOADED]: 'bg-primary-container text-white',
  [LOGISTICS_STATUS.ON_WAY]: 'bg-secondary-container text-on-secondary-container',
  [LOGISTICS_STATUS.DELIVERED]: 'bg-tertiary-container text-on-tertiary-container',
  [LOGISTICS_STATUS.FLAGGED]: 'bg-error-container text-on-error-container',
  [LOGISTICS_STATUS.DELAYED]: 'bg-error text-white',
  [LOGISTICS_STATUS.GATE_CLEARED]: 'bg-primary-fixed text-on-primary-fixed',
  [PAYMENT_STATUS.PAID]: 'bg-tertiary-container text-on-tertiary-container',
  [PAYMENT_STATUS.PENDING]: 'bg-secondary-container/20 text-on-secondary-fixed-variant',
  [PAYMENT_STATUS.HELD]: 'bg-error-container text-on-error-container',
  [PAYMENT_STATUS.OVERDUE]: 'bg-error text-white',
  [USER_STATUS.ACTIVE]: 'bg-tertiary-container text-on-tertiary-container',
  [USER_STATUS.INACTIVE]: 'bg-surface-container-highest text-on-surface-variant',
  [USER_STATUS.SUSPENDED]: 'bg-error-container text-on-error-container',
  [TERMINAL_STATUS.OPERATIONAL]: 'bg-tertiary-container text-on-tertiary-container',
  [TERMINAL_STATUS.CAUTION]: 'bg-secondary-container text-on-secondary-container',
  [TERMINAL_STATUS.STANDBY]: 'bg-surface-container-highest text-on-surface-variant',
  [TERMINAL_STATUS.OFFLINE]: 'bg-error-container text-on-error-container',
  [ALERT_SEVERITY.INFO]: 'bg-surface-container-highest text-on-surface-variant',
  [ALERT_SEVERITY.WARNING]: 'bg-secondary-container text-on-secondary-container',
  [ALERT_SEVERITY.CRITICAL]: 'bg-error text-white',
  [ALERT_REVIEW_STATE.NEW]: 'bg-primary-fixed text-on-primary-fixed',
  [ALERT_REVIEW_STATE.IN_REVIEW]: 'bg-secondary-container text-on-secondary-container',
  [ALERT_REVIEW_STATE.RESOLVED]: 'bg-tertiary-container text-on-tertiary-container',
  [ALERT_REVIEW_STATE.DISMISSED]: 'bg-surface-container-highest text-on-surface-variant',
}
