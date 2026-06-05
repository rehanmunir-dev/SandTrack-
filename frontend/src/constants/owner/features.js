export const OWNER_FEATURE_KEYS = [
  'dashboard',
  'consignments',
  'consignment_detail',
  'alerts',
  'terminal',
  'users',
  'trucks',
  'global_search',
]

export const OWNER_FEATURE_LABELS = {
  dashboard: 'Dashboard',
  consignments: 'Consignments',
  consignment_detail: 'Consignment Detail',
  alerts: 'Alerts',
  terminal: 'Terminal Monitoring',
  users: 'User Management',
  trucks: 'Trucks Registry',
  global_search: 'Global Search',
}

export const ROLE_DEFAULT_FEATURES = {
  SUPER_ADMIN: OWNER_FEATURE_KEYS,
  ACCOUNTANT: ['dashboard', 'consignments', 'consignment_detail', 'global_search'],
  TERMINAL_OPERATOR: ['dashboard', 'consignments', 'consignment_detail', 'terminal', 'alerts'],
  WATCHMAN: ['dashboard', 'consignments', 'consignment_detail', 'terminal'],
}
