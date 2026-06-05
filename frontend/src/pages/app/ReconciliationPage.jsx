import { useMemo } from 'react'
import SectionCard from '../../components/common/SectionCard'
import StatusBadge from '../../components/common/StatusBadge'
import { useAppState } from '../../context/AppStateContext'
import { useAuth } from '../../context/AuthContext'

export default function ReconciliationPage() {
  const { currentUser } = useAuth()
  const { payments, alerts, resolveAlert } = useAppState()

  const mismatchedPayments = useMemo(() => {
    return payments.filter((payment) => {
      return Math.abs(payment.ocrAmount - payment.expectedAmount) > 0
    })
  }, [payments])

  const impactAmount = mismatchedPayments.reduce((acc, payment) => {
    return acc + Math.abs(payment.ocrAmount - payment.expectedAmount)
  }, 0)

  const flaggedAlerts = useMemo(() => {
    return alerts.filter((alert) => alert.status !== 'RESOLVED')
  }, [alerts])

  return (
    <div className="space-y-4">
      <SectionCard title="Reconciliation / Leakage Audit" subtitle="Mismatch and discrepancy handling">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded border border-slate-200 p-3">
            <p className="text-slate-500">Mismatched payments</p>
            <p className="text-2xl font-semibold">{mismatchedPayments.length}</p>
          </div>
          <div className="rounded border border-slate-200 p-3">
            <p className="text-slate-500">Open alerts</p>
            <p className="text-2xl font-semibold">{flaggedAlerts.length}</p>
          </div>
          <div className="rounded border border-slate-200 p-3">
            <p className="text-slate-500">Discrepancy impact</p>
            <p className="text-2xl font-semibold">{impactAmount}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Flagged Transactions" subtitle="Review and reconcile">
        <div className="space-y-2 text-sm">
          {mismatchedPayments.length === 0 ? (
            <p className="text-slate-500">No mismatches found.</p>
          ) : (
            mismatchedPayments.map((payment) => (
              <div key={payment.id} className="rounded border border-slate-200 p-3">
                <p className="font-semibold">{payment.id}</p>
                <p>Consignment: {payment.consignmentId}</p>
                <p>Expected: {payment.expectedAmount} | OCR: {payment.ocrAmount}</p>
                <p>Difference: {Math.abs(payment.expectedAmount - payment.ocrAmount)}</p>
                <StatusBadge status={payment.status} />
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard title="Alert Action History" subtitle="Resolve or export discrepancies">
        <div className="space-y-2">
          {flaggedAlerts.map((alert) => (
            <div key={alert.id} className="rounded border border-slate-200 p-3 text-sm">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-slate-600">{alert.message}</p>
                </div>
                <StatusBadge status={alert.severity} />
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => resolveAlert({ alertId: alert.id, actor: currentUser.name })}
                  className="rounded border border-slate-300 px-3 py-2 text-xs"
                >
                  Reconcile / Resolve
                </button>
                <button className="rounded border border-slate-300 px-3 py-2 text-xs">
                  Export Record
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
