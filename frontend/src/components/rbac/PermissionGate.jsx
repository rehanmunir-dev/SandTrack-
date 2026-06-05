import { useAuth } from '../../context/AuthContext'

export default function PermissionGate({
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
}) {
  const { canAll, canAny } = useAuth()
  const hasAccess = requireAll ? canAll(permissions) : canAny(permissions)

  if (!hasAccess) {
    return fallback
  }

  return children
}
