import DetailCard from '../../components/owner/DetailCard'

export default function OwnerSettingsPage() {
  return (
    <div className="space-y-6">
      <DetailCard title="Settings">
        <p className="text-sm text-on-surface-variant">
          Configure owner-level preferences, operational thresholds, and dashboard behavior.
        </p>
      </DetailCard>

      <DetailCard title="System Controls">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-center justify-between rounded-lg border border-outline-variant/20 bg-surface-container-low p-3 text-sm">
            <span>Enable alert sounds</span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-outline-variant/20 bg-surface-container-low p-3 text-sm">
            <span>Auto-refresh dashboard</span>
            <input type="checkbox" defaultChecked />
          </label>
        </div>
      </DetailCard>
    </div>
  )
}
