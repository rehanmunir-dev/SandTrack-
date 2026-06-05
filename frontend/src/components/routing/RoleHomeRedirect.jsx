import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../rbac/roles'

const ROLE_HOME = {
  [ROLES.SUPER_ADMIN]: '/owner/dashboard',
  [ROLES.ADMIN]: '/owner/dashboard',
  [ROLES.ACCOUNTANT]: '/app/accountant/dashboard',
  [ROLES.TERMINAL_OPERATOR]: '/app/operator/dashboard',
  [ROLES.DRIVER]: '/app/driver/dashboard',
  [ROLES.WATCHMAN]: '/app/watchman/dashboard',
}

export default function RoleHomeRedirect() {
  const { currentUser } = useAuth()
  const targetPath = ROLE_HOME[currentUser?.role] || '/app/dashboard'

  return <Navigate to={targetPath} replace />
}
