import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 space-y-3 shadow-sm">
        <h1 className="font-headline text-2xl font-bold text-on-background">404 - Page Not Found</h1>
        <p className="text-sm text-on-surface-variant">
          The requested page does not exist or has been moved.
        </p>
        <Link to="/app" className="inline-block rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary">
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
