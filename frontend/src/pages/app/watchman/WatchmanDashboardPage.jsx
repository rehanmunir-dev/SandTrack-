import SectionCard from '../../../components/common/SectionCard'
import StatusBadge from '../../../components/common/StatusBadge'
import WorkflowGuide from '../../../components/WorkflowGuide'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'

export default function WatchmanDashboardPage() {
  const { scans, consignments } = useRoleSystem()
  const recentScans = scans.slice(0, 5)
  const flagged = consignments.filter((item) => item.status === 'flagged').length

  return (
    <div className="space-y-6">
      <SectionCard title="Watchman Dashboard" subtitle="Gate verification and scan monitoring.">
        <WorkflowGuide
          title="Gate flow"
          items={[
            { label: '1. Scan QR', description: 'Use the camera scanner and confirm the consignment details.' },
            { label: '2. Inspect', description: 'Check driver, truck number, material, and destination before release.' },
            { label: '3. Clear or flag', description: 'Clear the gate only if everything matches. Flag any suspicious issue.' },
          ]}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="dashboard-stat" style={{ '--stat-accent': '#2563eb' }}>
            <p className="dashboard-stat-label">Recent Scans</p>
            <p className="dashboard-stat-value">{recentScans.length}</p>
          </div>
          <div className="dashboard-stat" style={{ '--stat-accent': '#dc2626' }}>
            <p className="dashboard-stat-label">Flagged Entries</p>
            <p className="dashboard-stat-value text-red-700">{flagged}</p>
          </div>
          <div className="dashboard-stat" style={{ '--stat-accent': '#059669' }}>
            <p className="dashboard-stat-label">Gate Control</p>
            <a href="/app/watchman/scan" className="app-btn-primary mt-3 w-full">
              <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
              Open Scanner
            </a>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Recent Gate Results" subtitle="Latest QR validation events">
        <div className="space-y-2">
          {recentScans.map((scan) => (
            <div key={scan.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm transition-colors hover:bg-slate-50">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-on-surface">{scan.qrCode}</p>
                <StatusBadge status={scan.result} />
              </div>
              <p className="text-xs text-on-surface-variant">{scan.gateName} • {scan.actor}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
