import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 space-y-4">
        <h1 className="text-xl font-bold">Reset Access Placeholder</h1>
        <p className="text-sm text-slate-600">
          This page is wired for future backend reset integration.
        </p>

        {submitted ? (
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Reset request recorded for {email}. The backend reset flow can now be connected.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
            <button className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              Submit Request
            </button>
          </form>
        )}

        <Link className="text-sm underline" to="/login">
          Back to login
        </Link>
      </div>
    </div>
  )
}
