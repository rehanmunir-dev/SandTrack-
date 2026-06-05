import SectionCard from '../../components/common/SectionCard'
import StatusBadge from '../../components/common/StatusBadge'
import { useAppState } from '../../context/AppStateContext'
import { useAuth } from '../../context/AuthContext'

export default function AlertsPage() {
  const { currentUser } = useAuth()
  const { alerts, resolveAlert } = useAppState()

  return (
    <div className="space-y-4">
      <SectionCard title="Alerts" subtitle="System exceptions and fraud flags">
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={alert.severity} />
                <StatusBadge status={alert.status} />
                <span className="text-xs text-slate-500">{new Date(alert.createdAt).toLocaleString()}</span>
              </div>
              <p className="font-semibold mt-2">{alert.title}</p>
              <p className="text-slate-600">{alert.message}</p>
              {alert.status !== 'RESOLVED' ? (
                <button
                  type="button"
                  onClick={() => resolveAlert({ alertId: alert.id, actor: currentUser.name })}
                  className="mt-2 rounded border border-slate-300 px-3 py-2 text-xs"
                >
                  Resolve
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
