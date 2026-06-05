import SectionCard from '../../../components/common/SectionCard'
import StatusBadge from '../../../components/common/StatusBadge'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'

export default function WatchmanDashboardPage() {
  const { scans, consignments } = useRoleSystem()
  const recentScans = scans.slice(0, 5)
  const flagged = consignments.filter((item) => item.status === 'flagged').length

  return (
    <div className="space-y-6">
      <SectionCard title="Watchman Dashboard" subtitle="Gate verification and scan monitoring.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Recent Scans</p>
            <p className="mt-2 font-headline text-3xl font-extrabold text-primary">{recentScans.length}</p>
          </div>
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Flagged Entries</p>
            <p className="mt-2 font-headline text-3xl font-extrabold text-error">{flagged}</p>
          </div>
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Quick Scan</p>
            <a href="/app/watchman/scan" className="mt-2 inline-block rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white">Open Scanner</a>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Recent Gate Results" subtitle="Latest QR validation events">
        <div className="space-y-2">
          {recentScans.map((scan) => (
            <div key={scan.id} className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3 text-sm">
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
