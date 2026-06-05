import { useState } from 'react'
import SectionCard from '../../components/common/SectionCard'

export default function SupportPage() {
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Support" subtitle="Help and ticket placeholder flow">
        <ul className="list-disc pl-4 text-sm text-slate-600 space-y-1">
          <li>Field support hotline: +92 300 0000000</li>
          <li>Email: support@sandtrack.local</li>
          <li>Priority incidents should be raised from alerts page.</li>
        </ul>
      </SectionCard>

      <SectionCard title="Submit Issue" subtitle="Simple support interaction">
        {submitted ? (
          <p className="text-sm text-emerald-700">
            Support request submitted. A ticket ID can be returned once backend endpoint is connected.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Describe the issue"
            />
            <button className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              Submit Support Request
            </button>
          </form>
        )}
      </SectionCard>
    </div>
  )
}
