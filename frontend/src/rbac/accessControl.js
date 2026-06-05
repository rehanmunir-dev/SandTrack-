import { PERMISSIONS } from './permissions'
import { ROLES } from './roles'

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.ACCOUNTANT_DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_VERIFY,
    PERMISSIONS.ACCOUNTANT_LEDGER_VIEW,
    PERMISSIONS.LEDGER_EXPORT,
    PERMISSIONS.ACCOUNTANT_RECONCILIATION_VIEW,
    PERMISSIONS.RECONCILIATION_ACTION,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SUPPORT_VIEW,
  ],
  [ROLES.TERMINAL_OPERATOR]: [
    PERMISSIONS.OPERATOR_DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW,
    PERMISSIONS.CONSIGNMENT_CREATE,
    PERMISSIONS.CONSIGNMENT_READ,
    PERMISSIONS.CONSIGNMENT_ASSIGN,
    PERMISSIONS.CONSIGNMENT_TRANSITION,
    PERMISSIONS.CONSIGNMENT_CLOSE,
    PERMISSIONS.CONSIGNMENT_RECEIPT,
    PERMISSIONS.TRACKING_VIEW,
    PERMISSIONS.TRACKING_INGEST,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.OPERATOR_DRIVER_MANAGE,
    PERMISSIONS.OPERATOR_TRUCK_MANAGE,
    PERMISSIONS.OPERATOR_QR_GENERATE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SUPPORT_VIEW,
  ],
  [ROLES.DRIVER]: [
    PERMISSIONS.DRIVER_DASHBOARD_VIEW,
    PERMISSIONS.DRIVER_CONSIGNMENT_READ,
    PERMISSIONS.CONSIGNMENT_RECEIPT,
    PERMISSIONS.TRACKING_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SUPPORT_VIEW,
  ],
  [ROLES.WATCHMAN]: [
    PERMISSIONS.WATCHMAN_DASHBOARD_VIEW,
    PERMISSIONS.CONSIGNMENT_READ,
    PERMISSIONS.CONSIGNMENT_RECEIPT,
    PERMISSIONS.QR_SCAN,
    PERMISSIONS.WATCHMAN_SCAN,
    PERMISSIONS.GATE_SCAN,
    PERMISSIONS.GATE_RELEASE,
    PERMISSIONS.TRACKING_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SUPPORT_VIEW,
  ],
}

export function getPermissionsForUser(user) {
  if (!user) {
    return []
  }

  const rolePermissions = ROLE_PERMISSIONS[user.role] || []
  const customAllow = user.customPermissions?.allow || []
  const customDeny = new Set(user.customPermissions?.deny || [])

  return [...new Set([...rolePermissions, ...customAllow])].filter(
    (permission) => !customDeny.has(permission),
  )
}

export function hasPermission(user, permission) {
  return getPermissionsForUser(user).includes(permission)
}

export function hasAnyPermission(user, requiredPermissions = []) {
  const userPermissions = new Set(getPermissionsForUser(user))
  return requiredPermissions.some((permission) => userPermissions.has(permission))
}

export function hasAllPermissions(user, requiredPermissions = []) {
  const userPermissions = new Set(getPermissionsForUser(user))
  return requiredPermissions.every((permission) => userPermissions.has(permission))
}
