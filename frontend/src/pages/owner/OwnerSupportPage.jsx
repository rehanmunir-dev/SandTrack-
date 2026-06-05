import DetailCard from '../../components/owner/DetailCard'

export default function OwnerSupportPage() {
  return (
    <div className="space-y-6">
      <DetailCard title="Support Center">
        <p className="text-sm text-on-surface-variant">
          Owner support workspace for issue escalation, terminal incidents, and assistance logs.
        </p>
      </DetailCard>

      <DetailCard title="Quick Help Actions">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <button type="button" className="rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold">
            Raise Incident
          </button>
          <button type="button" className="rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold">
            Contact Technical Team
          </button>
          <button type="button" className="rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold">
            View Support Logs
          </button>
        </div>
      </DetailCard>
    </div>
  )
}
