import { Link, useLocation } from 'react-router-dom'

export default function UnauthorizedPage() {
  const location = useLocation()
  const from = location.state?.from || 'Restricted area'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 space-y-3 shadow-sm">
        <h1 className="font-headline text-2xl font-bold text-on-background">403 - Access Not Allowed</h1>
        <p className="text-sm text-on-surface-variant">
          You do not have permission to access this section: {from}
        </p>
        <div className="flex gap-3">
          <Link to="/app" className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary">
            Go to home
          </Link>
          <Link to="/login" className="rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold text-on-surface">
            Login as different user
          </Link>
        </div>
      </div>
    </div>
  )
}
