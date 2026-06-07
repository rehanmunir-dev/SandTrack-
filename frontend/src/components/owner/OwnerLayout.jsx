import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { OWNER_NAV_ITEMS, OWNER_ROUTES } from '../../constants/owner/routes'
import { useOwnerData } from '../../context/owner/OwnerContext'
import { useAuth } from '../../context/AuthContext'
import { ROLE_LABELS } from '../../rbac/roles'
import SearchBar from './SearchBar'
import NotificationBell from '../NotificationBell'

function isActive(pathname, itemPath) {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

export default function OwnerLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  useOwnerData()
  const { currentUser, logout } = useAuth()
  const [globalSearch, setGlobalSearch] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const title = OWNER_NAV_ITEMS.find((item) => isActive(location.pathname, item.path))?.label || 'Owner'
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

  function submitGlobalSearch() {
    const query = globalSearch.trim()
    navigate(`${OWNER_ROUTES.SEARCH}?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="app-theme min-h-screen bg-slate-50 font-body text-on-background selection:bg-primary-fixed selection:text-on-primary-fixed">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-slate-200 bg-white/95 px-5 py-6 shadow-[8px_0_34px_rgba(4,21,52,0.045)] backdrop-blur lg:flex">
        <div className="mb-7 border-b border-slate-100 pb-6">
          <div className="flex justify-center">
            <img src="/sandtrack-logo.jpg" alt="SandTrack" className="h-auto w-44 object-contain" />
          </div>
        </div>

        <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto pr-2">
          {OWNER_NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-all ${
                isActive(location.pathname, item.path)
                  ? 'bg-blue-950 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-blue-950'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/90 p-4 shadow-inner">
          <p className="text-[11px] font-extrabold uppercase text-slate-500">Signed in as</p>
          <p className="mt-1 text-sm font-extrabold text-blue-950">
            {ROLE_LABELS[currentUser?.role] || currentUser?.role || 'Owner'}
          </p>
          <button
            type="button"
            onClick={() => navigate(OWNER_ROUTES.PROFILE)}
            className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-base">manage_accounts</span>
            Profile settings
          </button>
        </div>
      </aside>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
          />
          <aside className="relative z-10 h-full w-72 max-w-[80vw] bg-slate-50 p-6 shadow-2xl">
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
              {OWNER_NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    isActive(location.pathname, item.path)
                      ? 'border-l-4 border-blue-900 bg-slate-100 text-blue-900'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-6 space-y-2 border-t border-outline-variant/20 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  navigate(OWNER_ROUTES.PROFILE)
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
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 shadow-[0_8px_30px_rgba(4,21,52,0.035)] backdrop-blur">
          <div className="px-3 py-4 sm:px-5 md:px-7 lg:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
                      {title}
                    </h2>
                    <p className="mt-1 text-xs font-medium text-slate-600 sm:text-sm">Owner and super admin control center</p>
                  </div>
                </div>
              </div>
              <div className="w-full sm:w-auto sm:max-w-sm md:max-w-md lg:max-w-2xl">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex-1 sm:flex-initial sm:min-w-0">
                    <SearchBar
                      value={globalSearch}
                      onChange={setGlobalSearch}
                      placeholder="Search: receipt, vehicle"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={submitGlobalSearch}
                    className="hidden flex-shrink-0 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-md sm:block"
                  >
                    Search
                  </button>
                  <NotificationBell owner />
                  <button
                    type="button"
                    onClick={() => navigate(OWNER_ROUTES.PROFILE)}
                    className="hidden flex-shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-2 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md sm:flex sm:gap-3 sm:px-3"
                    aria-label="Open profile"
                  >
                    <div className="flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center overflow-hidden rounded-full bg-primary text-xs sm:text-sm font-bold text-on-primary">
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
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1600px] p-3 sm:p-5 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
