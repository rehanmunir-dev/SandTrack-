import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { PERMISSIONS } from '../../rbac/permissions'
import { ROLE_LABELS, ROLES } from '../../rbac/roles'
import NotificationBell from '../NotificationBell'

const ROLE_MENUS = {
  [ROLES.TERMINAL_OPERATOR]: [
    { label: 'Dashboard', path: '/app/operator/dashboard', icon: 'dashboard', subtitle: 'Dispatch workspace overview', permissions: [PERMISSIONS.OPERATOR_DASHBOARD_VIEW] },
    { label: 'Consignments', path: '/app/operator/consignments', icon: 'local_shipping', subtitle: 'Create and manage dispatches', permissions: [PERMISSIONS.CONSIGNMENT_READ] },
    { label: 'Drivers', path: '/app/operator/drivers', icon: 'badge', subtitle: 'Driver registry and status', permissions: [PERMISSIONS.OPERATOR_DRIVER_MANAGE] },
    { label: 'Trucks', path: '/app/operator/trucks', icon: 'local_taxi', subtitle: 'Truck registry and assignments', permissions: [PERMISSIONS.OPERATOR_TRUCK_MANAGE] },
  ],
  [ROLES.DRIVER]: [
    { label: 'Dashboard', path: '/app/driver/dashboard', icon: 'dashboard', subtitle: 'Trip and consignment overview', permissions: [PERMISSIONS.DRIVER_DASHBOARD_VIEW] },
    { label: 'Consignments', path: '/app/driver/consignments', icon: 'assignment', subtitle: 'Assigned dispatches and QR', permissions: [PERMISSIONS.DRIVER_CONSIGNMENT_READ] },
  ],
  [ROLES.WATCHMAN]: [
    { label: 'Dashboard', path: '/app/watchman/dashboard', icon: 'dashboard', subtitle: 'Gate activity overview', permissions: [PERMISSIONS.WATCHMAN_DASHBOARD_VIEW] },
    { label: 'Scan', path: '/app/watchman/scan', icon: 'qr_code_scanner', subtitle: 'QR validation and exit control', permissions: [PERMISSIONS.WATCHMAN_SCAN] },
  ],
  [ROLES.ACCOUNTANT]: [
    { label: 'Dashboard', path: '/app/accountant/dashboard', icon: 'dashboard', subtitle: 'Finance overview and alerts', permissions: [PERMISSIONS.ACCOUNTANT_DASHBOARD_VIEW] },
    { label: 'Ledger', path: '/app/accountant/ledger', icon: 'account_balance', subtitle: 'Payments and ledger records', permissions: [PERMISSIONS.ACCOUNTANT_LEDGER_VIEW] },
    { label: 'Delivered', path: '/app/accountant/delivered', icon: 'inventory_2', subtitle: 'Delivered and paid consignments', permissions: [PERMISSIONS.ACCOUNTANT_LEDGER_VIEW] },
    { label: 'Verification', path: '/app/accountant/verification', icon: 'fact_check', subtitle: 'Pending payment approvals', permissions: [PERMISSIONS.ACCOUNTANT_VERIFICATION_VIEW] },
    { label: 'Expenses', path: '/app/accountant/expenses', icon: 'receipt_long', subtitle: 'Manage office expenses and salaries', permissions: [PERMISSIONS.ACCOUNTANT_LEDGER_VIEW] },
  ],
}

const DEFAULT_MENU_ITEMS = [
  {
    label: 'Dashboard',
    path: '/app/dashboard',
    icon: 'dashboard',
    subtitle: 'Logistics intelligence and anti-fraud overview',
    permissions: [PERMISSIONS.DASHBOARD_VIEW],
  },
  {
    label: 'Consignments',
    path: '/app/consignments',
    icon: 'local_shipping',
    subtitle: 'Dispatch creation and status lifecycle control',
    permissions: [PERMISSIONS.CONSIGNMENT_READ],
  },
  {
    label: 'Gate Scan',
    path: '/app/gate/scan',
    icon: 'qr_code_scanner',
    subtitle: 'Watchman verification and release checks',
    permissions: [PERMISSIONS.GATE_SCAN],
  },
  {
    label: 'Live Tracking',
    path: '/app/tracking/live',
    icon: 'location_on',
    subtitle: 'Truck movement and route deviation readiness',
    permissions: [PERMISSIONS.TRACKING_VIEW],
  },
  {
    label: 'Payment Entry',
    path: '/app/payments/entry',
    icon: 'payments',
    subtitle: 'Mobile payment submission and receipt capture',
    permissions: [PERMISSIONS.PAYMENT_CREATE],
  },
  {
    label: 'Payment Verification',
    path: '/app/payments/verification',
    icon: 'fact_check',
    subtitle: 'Accountant verification queue workspace',
    permissions: [PERMISSIONS.PAYMENT_VERIFY],
  },
  {
    label: 'Ledger',
    path: '/app/ledger',
    icon: 'account_balance',
    subtitle: 'Finance records and exports',
    permissions: [PERMISSIONS.LEDGER_VIEW],
  },
  {
    label: 'Reconciliation',
    path: '/app/reconciliation',
    icon: 'rule',
    subtitle: 'Leakage audit and discrepancy actions',
    permissions: [PERMISSIONS.RECONCILIATION_VIEW],
  },
  {
    label: 'Alerts',
    path: '/app/alerts',
    icon: 'warning',
    subtitle: 'Priority incidents and exception resolution',
    permissions: [PERMISSIONS.ALERTS_VIEW],
  },
  {
    label: 'Users',
    path: '/app/users',
    icon: 'group',
    subtitle: 'Role and access administration',
    permissions: [PERMISSIONS.USERS_MANAGE],
  },
]

function resolveActiveMeta(pathname) {
  const matched = [...Object.values(ROLE_MENUS).flat(), ...DEFAULT_MENU_ITEMS].find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  )

  if (matched) {
    return {
      title: matched.label,
      subtitle: matched.subtitle,
    }
  }

  if (pathname.includes('/receipt')) {
    return {
      title: 'Digital Receipt',
      subtitle: 'Dispatch proof and verification summary',
    }
  }

  if (pathname.includes('/consignments/')) {
    return {
      title: 'Consignment Details',
      subtitle: 'Lifecycle, tracking, and audit events',
    }
  }

  return {
    title: 'SandTrack',
    subtitle: 'Digital Ghazi Sand Thia operational console',
  }
}

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, canAny, logout } = useAuth()

  const roleMenu = ROLE_MENUS[currentUser?.role]
  const filteredMenu = roleMenu
    ? roleMenu.filter((item) => !item.permissions || canAny(item.permissions))
    : DEFAULT_MENU_ITEMS.filter((item) => canAny(item.permissions))
  const activeMeta = resolveActiveMeta(location.pathname)
  const initials = (currentUser?.name || 'ST')
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const apiOrigin = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : window.location.origin
  const profilePictureSrc = currentUser?.profilePictureUrl
    ? `${apiOrigin}${currentUser.profilePictureUrl}`
    : ''

  return (
    <div className="app-theme min-h-screen bg-slate-50 font-body text-on-background selection:bg-primary-fixed selection:text-on-primary-fixed">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
        <div className="mb-7 border-b border-slate-100 pb-6">
          <div className="flex justify-center">
            <img src="/sandtrack-logo.jpg" alt="SandTrack" className="h-auto w-44 object-contain" />
          </div>
        </div>

        <nav className="no-scrollbar flex-grow space-y-1 overflow-y-auto pr-1">
          {filteredMenu.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`)

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-950 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-blue-950'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

      </aside>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
          />
          <aside className="relative z-10 h-full w-72 max-w-[80vw] bg-surface-container-lowest p-6 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <img src="/sandtrack-logo.jpg" alt="SandTrack" className="h-10 w-auto object-contain" />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-full border border-outline-variant/30 p-2 text-on-surface-variant"
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto pr-1">
              {filteredMenu.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`)

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'border-l-4 border-primary bg-surface-container-low text-primary'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-6 space-y-2 border-t border-outline-variant/20 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  navigate('/app/profile')
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-outline-variant/30 px-4 py-3 text-sm font-semibold text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">account_circle</span>
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  logout()
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-error/40 px-4 py-3 text-sm font-semibold text-error"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Log out
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <main className="min-h-screen lg:ml-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="px-3 py-4 sm:px-5 md:px-7 lg:px-10">
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="inline-flex items-center justify-center rounded-full border border-outline-variant/30 p-2 text-on-surface-variant lg:hidden"
                    aria-label="Open menu"
                  >
                    <span className="material-symbols-outlined text-base">menu</span>
                  </button>
                  <div className="min-w-0">
                    <h2 className="truncate font-headline text-xl font-extrabold text-slate-950 sm:text-2xl md:text-3xl">
                      {activeMeta.title}
                    </h2>
                    <p className="mt-1 text-xs font-medium text-slate-600 sm:text-sm">{activeMeta.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <NotificationBell />
                <button
                  type="button"
                  onClick={() => navigate('/app/profile')}
                  className="hidden items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-low px-2 py-2 transition-colors hover:bg-surface-container sm:flex sm:gap-3 sm:px-3"
                  aria-label="Open profile"
                >
                  <div className="flex h-8 sm:h-10 w-8 sm:w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs sm:text-sm font-bold text-on-primary">
                    {profilePictureSrc ? (
                      <img src={profilePictureSrc} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="hidden text-right xl:block">
                    <p className="text-xs sm:text-sm font-bold text-on-background">{currentUser?.name}</p>
                    <p className="text-[11px] font-bold uppercase text-slate-600">
                      {ROLE_LABELS[currentUser?.role] || currentUser?.role}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="no-scrollbar mt-3 sm:mt-4 flex gap-2 overflow-x-auto lg:hidden">
              {filteredMenu.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`)

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1600px] p-3 sm:p-5 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
