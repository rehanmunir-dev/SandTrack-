import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { resetPasswordAPI } from '../../services/api'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    try {
      await resetPasswordAPI(token, password)
      setMessage('Password reset successfully. You can now log in.')
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Password reset failed. The link may be invalid or expired.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 space-y-4"
      >
        <h1 className="text-xl font-bold">Reset Password</h1>
        <p className="text-sm text-slate-600">Enter a new password for your SandTrack account.</p>

        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="New password"
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm password"
          className="w-full rounded border border-slate-300 px-3 py-2"
        />

        {message ? (
          <p className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {message}
          </p>
        ) : null}

        <button className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Reset Password
        </button>

        <Link className="text-sm underline" to="/login">
          Back to login
        </Link>
      </form>
    </div>
  )
}
