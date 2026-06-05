import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ROLE_HOME = {
  ADMIN: '/owner/dashboard',
  SUPER_ADMIN: '/owner/dashboard',
  TERMINAL_OPERATOR: '/app/operator/dashboard',
  DRIVER: '/app/driver/dashboard',
  WATCHMAN: '/app/watchman/dashboard',
  ACCOUNTANT: '/app/accountant/dashboard',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()

  const [form, setForm] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  function updateForm(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const user = await login(form)
      navigate(ROLE_HOME[user?.role] || '/app/dashboard', { replace: true })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-y-auto bg-background font-body text-on-background antialiased lg:overflow-hidden">
      <main className="min-h-screen flex">
        <section className="hidden relative overflow-hidden bg-primary-container lg:flex lg:w-3/5">
          <div className="absolute inset-0 z-0">
            <img
              src="/login-bg.jpg.png"
              alt="Heavy industrial logistics terminal in Pakistan"
              className="h-full w-full object-cover opacity-60 grayscale transition-all duration-700 hover:grayscale-0"
            />
          </div>

          <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary/50 via-primary/20 to-white/35" />
          <div className="absolute inset-0 z-10 bg-white/25" />

          <div className="relative z-20 flex h-full w-full flex-col justify-between p-20">
            <div className="flex flex-1 flex-col items-center justify-center text-center drop-shadow-2xl">
              <div className="mb-2 flex justify-center">
                <img src="/sandtrack-logo.jpg" alt="SandTrack" className="h-auto w-[520px] max-w-full object-contain xl:w-[620px]" />
              </div>
            </div>

            <div className="grid max-w-lg grid-cols-2 gap-8 text-left">
              <div className="space-y-2">
                <p
                  className="font-label text-xs font-extrabold uppercase tracking-[0.2em] text-[#ff8a00]"
                  style={{ textShadow: '0 2px 10px rgba(0,0,0,0.65)' }}
                >
                  Daily Verified Tonnage
                </p>
                <p
                  className="font-headline text-5xl font-extrabold text-[#ff8a00]"
                  style={{ textShadow: '0 3px 12px rgba(0,0,0,0.65)' }}
                >
                  12,450 <span className="text-lg font-semibold italic text-[#ffd7aa]">tons</span>
                </p>
              </div>
              <div className="space-y-2">
                <p
                  className="font-label text-xs font-extrabold uppercase tracking-[0.2em] text-[#8fb8ff]"
                  style={{ textShadow: '0 2px 10px rgba(0,0,0,0.65)' }}
                >
                  Dispatch Terminals
                </p>
                <p
                  className="font-headline text-5xl font-extrabold text-[#8fb8ff]"
                  style={{ textShadow: '0 3px 12px rgba(0,0,0,0.65)' }}
                >
                  84 <span className="text-lg font-semibold italic text-[#d6e5ff]">active</span>
                </p>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-secondary-container/10 blur-3xl" />
        </section>

        <section className="flex w-full items-center justify-center bg-surface p-6 sm:p-12 lg:w-2/5">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary">
                Login to Portal
              </h2>
              <p className="font-medium text-on-surface-variant">
                Secure QR-Verified Dispatch Control.
              </p>
            </div>

            <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-[0_20px_40px_rgba(25,27,34,0.04)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="block font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
                      person
                    </span>
                    <input
                      id="username"
                      name="username"
                      required
                      value={form.username}
                      onChange={updateForm}
                      className="w-full rounded-lg border-0 bg-surface-container-highest py-3.5 pl-12 pr-4 font-medium text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary"
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
                      lock
                    </span>
                    <input
                      id="password"
                      name="password"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={updateForm}
                      className="w-full rounded-lg border-0 bg-surface-container-highest py-3.5 pl-12 pr-12 font-medium text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                      aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {error ? (
                  <p className="rounded-lg border border-error bg-error-container px-3 py-2 text-sm font-medium text-on-error-container">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-primary to-primary-container py-4 font-headline font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                  <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>
              </form>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-surface-container-highest" />
                <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-outline">
                  Terminal Identity
                </span>
                <div className="h-px flex-1 bg-surface-container-highest" />
              </div>

              <div className="flex flex-col items-center gap-2 text-center">
                <div className="group cursor-pointer rounded-xl border border-outline-variant/10 bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high">
                  <span className="material-symbols-outlined text-3xl text-primary">
                    qr_code_scanner
                  </span>
                </div>
                <p className="text-sm font-semibold text-primary">Every Load Verified. No Leakage.</p>
                <p className="max-w-[240px] text-xs text-on-surface-variant">
                  Access to this system is monitored. Unauthorized attempts will be flagged and
                  reported.
                </p>
              </div>
            </div>

            <div className="flex justify-center pb-2 pt-8 opacity-90 lg:hidden">
              <div className="flex items-center gap-2">
                <img src="/sandtrack-logo.jpg" alt="SandTrack" className="h-auto w-56 max-w-full object-contain" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="pointer-events-none fixed left-0 top-0 -z-10 h-full w-full opacity-5">
        <svg width="100%" height="100%">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  )
}
