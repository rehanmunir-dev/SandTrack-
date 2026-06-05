import SectionCard from '../../../components/common/SectionCard'
import StatusBadge from '../../../components/common/StatusBadge'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'

export default function AccountantReconciliationPage() {
  const { payments } = useRoleSystem()
  const mismatches = payments.filter((payment) => payment.status === 'held' || payment.status === 'overdue')

  return (
    <SectionCard title="Reconciliation" subtitle="Mismatch detection and flagged transactions.">
      <div className="space-y-3">
        {mismatches.map((payment) => (
          <div key={payment.id} className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-on-surface">{payment.consignmentId}</p>
              <StatusBadge status={payment.status} />
            </div>
            <p className="text-xs text-on-surface-variant">Difference requires manual review.</p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
