import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  loginAPI,
  logoutAPI,
  updateProfilePictureAPI,
} from '../services/api'
import {
  getPermissionsForUser,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from '../rbac/accessControl'
import { PERMISSIONS } from '../rbac/permissions'
import { ROLES } from '../rbac/roles'

const AuthContext = createContext(null)

const ALL_PERMISSION_KEYS = Object.values(PERMISSIONS)

function buildCustomPermissionsFromObject(permissionObject) {
  const allow = []
  const deny = []

  for (const permission of ALL_PERMISSION_KEYS) {
    const value = permissionObject?.[permission]
    if (value === true) {
      allow.push(permission)
    }
    if (value === false) {
      deny.push(permission)
    }
  }

  return { allow, deny }
}

function mapApiUser(apiUser, accessToken) {
  if (!apiUser) {
    return null
  }

  let mappedRole = apiUser.role
  if (mappedRole === 'OPERATOR') {
    mappedRole = 'TERMINAL_OPERATOR'
  }

  return {
    id: apiUser.id,
    name: apiUser.fullName || apiUser.full_name || apiUser.username,
    fullName: apiUser.fullName || apiUser.full_name || apiUser.username,
    username: apiUser.username,
    role: mappedRole,
    isActive: apiUser.isActive ?? apiUser.is_active ?? true,
    profilePictureUrl: apiUser.profilePictureUrl || apiUser.profile_picture_url || '',
    accessToken,
    permissionObject: apiUser.permissions || {},
    customPermissions: buildCustomPermissionsFromObject(apiUser.permissions || {}),
  }
}

const STATIC_USERS = [
  {
    id: 'static-admin',
    username: 'admin',
    password: 'admin',
    fullName: 'System Administrator',
    role: ROLES.ADMIN,
    permissions: {},
  },
  {
    id: 'static-accountant',
    username: 'accountant',
    password: 'accountant',
    fullName: 'Chief Accountant',
    role: ROLES.ACCOUNTANT,
    permissions: {},
  },
  {
    id: 'static-operator',
    username: 'operator',
    password: 'operator',
    fullName: 'Terminal Operator',
    role: ROLES.TERMINAL_OPERATOR,
    permissions: {},
  },
  {
    id: 'static-driver',
    username: 'driver',
    password: 'driver',
    fullName: 'Lead Driver',
    role: ROLES.DRIVER,
    permissions: {},
  },
  {
    id: 'static-watchman',
    username: 'watchman',
    password: 'watchman',
    fullName: 'Gate Security',
    role: ROLES.WATCHMAN,
    permissions: {},
  },
]

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isHydrating, setIsHydrating] = useState(true)

  // On App Mount: Restore persistent session from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('sandtrack_user')
      const savedToken = localStorage.getItem('sandtrack_token')
      if (savedUser && savedToken) {
        setCurrentUser(JSON.parse(savedUser))
      }
    } catch (err) {
      console.error('Error hydrating user session:', err)
    } finally {
      setIsHydrating(false)
    }
  }, [])

  const isAuthenticated = useMemo(() => Boolean(currentUser), [currentUser])

  const permissions = useMemo(
    () => getPermissionsForUser(currentUser),
    [currentUser]
  )

  // Login handler
  const login = async ({ username, password }) => {
    const normalizedUsername = String(username || '').trim().toLowerCase()
    const normalizedPassword = String(password || '').trim()

    // 1. If in DEV mode, allow static bypass check (Disabled to connect to live mock DB API)
    if (false && import.meta.env.DEV) {
      const staticUser = STATIC_USERS.find(
        (u) => u.username === normalizedUsername && u.password === normalizedPassword
      )
      if (staticUser) {
        const mappedUser = mapApiUser(staticUser, `static-token-${staticUser.id}`)
        localStorage.setItem('sandtrack_token', mappedUser.accessToken)
        localStorage.setItem('sandtrack_user', JSON.stringify(mappedUser))
        setCurrentUser(mappedUser)
        return mappedUser
      }
    }

    // 2. Real API login
    const res = await loginAPI(username, password)
    const dataObj = res.data?.data || res.data || {}
    const token = dataObj.token || dataObj.accessToken
    const user = dataObj.user
    
    if (!user || !token) {
      throw new Error('API Login failed: Invalid user payload response.')
    }

    const mappedUser = mapApiUser(user, token)
    localStorage.setItem('sandtrack_token', token)
    localStorage.setItem('sandtrack_user', JSON.stringify(mappedUser))
    setCurrentUser(mappedUser)
    return mappedUser
  }

  // Login by Role (Static Selector support)
  const loginByRole = (role) => {
    const staticUser = STATIC_USERS.find(
      (user) => user.role === role
    )

    if (!staticUser) {
      throw new Error('No user found for this role.')
    }

    const mappedUser = mapApiUser(staticUser, `static-token-${staticUser.id}`)
    localStorage.setItem('sandtrack_token', mappedUser.accessToken)
    localStorage.setItem('sandtrack_user', JSON.stringify(mappedUser))
    setCurrentUser(mappedUser)
  }

  // Logout handler
  const logout = async () => {
    try {
      await logoutAPI()
    } catch (err) {
      console.warn('Backend logout failed or already logged out:', err)
    }
    localStorage.removeItem('sandtrack_token')
    localStorage.removeItem('sandtrack_user')
    setCurrentUser(null)
  }

  const updateProfilePicture = async (file) => {
    const formData = new FormData()
    formData.append('profilePicture', file)

    const res = await updateProfilePictureAPI(formData)
    const dataObj = res.data?.data || res.data || {}
    const apiUser = dataObj.user

    if (!apiUser) {
      throw new Error('Profile picture update failed: invalid response.')
    }

    const token = localStorage.getItem('sandtrack_token') || currentUser?.accessToken
    const mappedUser = mapApiUser(apiUser, token)
    localStorage.setItem('sandtrack_user', JSON.stringify(mappedUser))
    setCurrentUser(mappedUser)
    return mappedUser
  }

  const createUser = () => {}

  const updateUser = () => {}

  const setUserPermissionOverrides = () => {}

  const value = {
    isHydrating,
    isAuthenticated,
    session: currentUser ? { token: localStorage.getItem('sandtrack_token'), accessToken: localStorage.getItem('sandtrack_token') || currentUser.accessToken, user: currentUser } : null,
    currentUser,
    permissions,
    userDirectory: STATIC_USERS,
    login,
    loginByRole,
    logout,
    updateProfilePicture,
    createUser,
    updateUser,
    setUserPermissionOverrides,
    can: (permission) => hasPermission(currentUser, permission),
    canAny: (requiredPermissions) => hasAnyPermission(currentUser, requiredPermissions),
    canAll: (requiredPermissions) => hasAllPermissions(currentUser, requiredPermissions),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
