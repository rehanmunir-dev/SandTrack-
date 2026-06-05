import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DetailCard from '../../components/owner/DetailCard'
import OwnerStatusBadge from '../../components/owner/OwnerStatusBadge'
import EmptyState from '../../components/owner/EmptyState'
import DateRangeFilterButton from '../../components/common/DateRangeFilterButton'
import { useOwnerData } from '../../context/owner/OwnerContext'
import { isInDateRange } from '../../utils/dateRange'

export default function OwnerAlertsPage() {
  const {
    alerts,
    selectedAlert,
    selectedAlertId,
    setSelectedAlertId,
    setAlertAction,
    markAlertRead,
  } = useOwnerData()

  const [searchParams] = useSearchParams()
  const [severityFilter, setSeverityFilter] = useState('all')
  const [readFilter, setReadFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('active')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  useEffect(() => {
    const alertId = searchParams.get('alertId')
    if (alertId) {
      setSelectedAlertId(alertId)
      markAlertRead(alertId)
    }
  }, [markAlertRead, searchParams, setSelectedAlertId])

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (!isInDateRange(alert.createdAt, dateRange)) {
        return false
      }
      if (severityFilter !== 'all' && alert.severity !== severityFilter) {
        return false
      }
      if (readFilter === 'read' && !alert.isRead) {
        return false
      }
      if (readFilter === 'unread' && alert.isRead) {
        return false
      }
      if (stateFilter === 'active' && (alert.reviewState === 'resolved' || alert.reviewState === 'dismissed')) {
        return false
      }
      if (stateFilter === 'resolved' && !(alert.reviewState === 'resolved' || alert.reviewState === 'dismissed')) {
        return false
      }
      return true
    })
  }, [alerts, severityFilter, readFilter, stateFilter, dateRange])

  function selectAlert(alertId) {
    setSelectedAlertId(alertId)
    markAlertRead(alertId)
  }

  function runAction(actionType) {
    if (!selectedAlert) {
      return
    }
    setAlertAction(selectedAlert.id, 'Owner', actionType)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm lg:col-span-1">
        <div className="space-y-3 border-b border-outline-variant/20 p-4">
          <h4 className="font-headline text-lg font-bold">Alert Feed</h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="rounded border border-outline-variant px-2 py-1 text-xs">
              <option value="all">Severity</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            <select value={readFilter} onChange={(e) => setReadFilter(e.target.value)} className="rounded border border-outline-variant px-2 py-1 text-xs">
              <option value="all">Read</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="rounded border border-outline-variant px-2 py-1 text-xs">
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
            <DateRangeFilterButton value={dateRange} onChange={setDateRange} label="Custom Date" />
          </div>
        </div>

        <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3">
          {filteredAlerts.map((alert) => (
            <button
              key={alert.id}
              type="button"
              onClick={() => selectAlert(alert.id)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedAlertId === alert.id ? 'border-primary bg-surface-container-low' : 'border-outline-variant/20 bg-white hover:bg-surface-container-low'}`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <OwnerStatusBadge status={alert.severity} />
                {!alert.isRead ? <span className="h-2 w-2 rounded-full bg-error" /> : null}
              </div>
              <p className="text-sm font-semibold text-on-surface">{alert.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">{alert.message}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        {!selectedAlert ? (
          <EmptyState title="Select an alert to inspect details" />
        ) : (
          <div className="space-y-4">
            <DetailCard title={selectedAlert.title} right={<OwnerStatusBadge status={selectedAlert.reviewState} />}>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <OwnerStatusBadge status={selectedAlert.severity} />
                  <OwnerStatusBadge status={selectedAlert.reviewState} />
                  <span className="text-xs text-on-surface-variant">{new Date(selectedAlert.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-on-surface">{selectedAlert.message}</p>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <button type="button" onClick={() => runAction('dispatch_security')} className="rounded-lg bg-error px-3 py-2 text-xs font-bold text-white">Dispatch Security</button>
                  <button type="button" onClick={() => runAction('escalate_incident')} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">Escalate Incident</button>
                  <button type="button" onClick={() => runAction('clear_false_alarm')} className="rounded-lg border border-outline-variant px-3 py-2 text-xs font-bold">Clear False Alarm</button>
                </div>
              </div>
            </DetailCard>

            <DetailCard title="Audit Trail">
              {selectedAlert.actions?.length ? (
                <div className="space-y-2">
                  {selectedAlert.actions.map((row, idx) => (
                    <div key={`${row.at}-${idx}`} className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
                      <p className="text-sm font-semibold text-on-surface">{row.action}</p>
                      <p className="text-xs text-on-surface-variant">By {row.by} at {new Date(row.at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No actions recorded yet" subtitle="Use action buttons to update alert workflow." />
              )}
            </DetailCard>
          </div>
        )}
      </div>
    </div>
  )
}
