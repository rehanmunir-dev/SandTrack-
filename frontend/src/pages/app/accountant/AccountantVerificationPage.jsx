import SectionCard from '../../../components/common/SectionCard'
import StatusBadge from '../../../components/common/StatusBadge'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'
import { PAYMENT_STATUS } from '../../../constants/roleSystemStatus'

export default function AccountantVerificationPage() {
  const { payments, consignments, verifyPayment, flagPayment, markArrived, verifyDelivery, closeLedger } = useRoleSystem()
  const pending = payments.filter((payment) => payment.status === PAYMENT_STATUS.PENDING || payment.status === PAYMENT_STATUS.HELD)
  const inTransit = consignments.filter((item) => item.status === 'IN_TRANSIT')
  const arrived = consignments.filter((item) => item.status === 'ARRIVED' || item.status === 'DELIVERY_PENDING_VERIFICATION')
  const delivered = consignments.filter((item) => item.status === 'DELIVERED')
  const flagged = consignments.filter((item) => item.status === 'FLAGGED' || item.isFlagged)

  return (
    <div className="space-y-6">
      <SectionCard title="Payment Verification" subtitle="Verify or flag pending payment records.">
        <div className="space-y-3">
          {pending.map((payment) => (
            <div key={payment.id} className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-on-surface">{payment.consignmentId}</p>
                <StatusBadge status={payment.status} />
              </div>
              <p className="text-xs text-on-surface-variant">Amount: {payment.amount}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => verifyPayment(payment.id)} className="w-full sm:w-auto rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">Verify Payment</button>
                <button type="button" onClick={() => flagPayment(payment.id, PAYMENT_STATUS.HELD)} className="w-full sm:w-auto rounded-lg border border-error px-3 py-2 text-xs font-bold text-error">Hold</button>
              </div>
            </div>
          ))}
          {!pending.length ? <p className="text-sm text-on-surface-variant">No pending payments.</p> : null}
        </div>
      </SectionCard>

      <SectionCard title="Delivery Review" subtitle="Mark arrivals, verify delivery, and close ledgers.">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Queue title="In Transit" items={inTransit} actionLabel="Mark Arrived" onAction={markArrived} />
          <Queue title="Arrived" items={arrived} actionLabel="Verify Delivery" onAction={verifyDelivery} />
          <Queue title="Delivered" items={delivered} actionLabel="Close Ledger" onAction={closeLedger} />
          <Queue title="Flagged Issues" items={flagged} />
        </div>
      </SectionCard>
    </div>
  )
}

function Queue({ title, items, actionLabel, onAction }) {
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4">
      <h3 className="font-headline text-base font-bold text-on-surface">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-outline-variant/15 bg-surface-container-low p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{item.consignmentId}</p>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">{item.destination} - {item.netWeight} tons</p>
            {actionLabel && onAction ? (
              <button type="button" onClick={() => onAction(item.id)} className="mt-3 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">
                {actionLabel}
              </button>
            ) : null}
          </div>
        ))}
        {!items.length ? <p className="text-xs text-on-surface-variant">No records.</p> : null}
      </div>
    </div>
  )
}
