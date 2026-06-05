import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function PermissionRoute({ permissions = [], requireAll = false }) {
  const { canAll, canAny } = useAuth()
  const location = useLocation()

  const hasAccess = requireAll ? canAll(permissions) : canAny(permissions)

  if (!hasAccess) {
    return <Navigate to="/403" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
