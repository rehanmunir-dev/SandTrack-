import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RoleRoute({ roles = [] }) {
  const { currentUser } = useAuth()
  const location = useLocation()

  if (!currentUser || !roles.includes(currentUser.role)) {
    return <Navigate to="/403" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
