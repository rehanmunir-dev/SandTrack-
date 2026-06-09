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
      <section className="rounded-2xl border border-outline-variant/15 bg-gradient-to-br from-primary/10 via-surface-container-lowest to-tertiary/10 p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tertiary">Accountant Work Queues</p>
        <h1 className="mt-2 font-headline text-2xl font-black text-on-surface">Verification Center</h1>
        <p className="mt-1 text-sm font-medium text-on-surface-variant">
          Verify delivery, confirm payment, and close ledgers without changing the order lifecycle manually.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Metric label="In Transit" value={inTransit.length} />
          <Metric label="Arrived" value={arrived.length} />
          <Metric label="Payments" value={pending.length} />
          <Metric label="Delivered" value={delivered.length} />
          <Metric label="Flagged" value={flagged.length} tone="text-error" />
        </div>
      </section>

      <SectionCard title="Payment Verification" subtitle="Verify or flag pending payment records.">
        <div className="space-y-3">
          {pending.map((payment) => (
            <div key={payment.id} className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 text-sm shadow-sm">
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
          {!pending.length ? (
            <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-6 text-center">
              <p className="text-sm font-bold text-on-surface">No payments pending.</p>
              <p className="mt-1 text-sm text-on-surface-variant">All clear for now.</p>
            </div>
          ) : null}
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
          <div key={item.id} className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-3 text-sm shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{item.consignmentId}</p>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">{item.destination} - {item.netWeight} tons</p>
            <p className="mt-2 text-xs font-bold text-primary">
              Next action: {actionLabel || 'Review issue'}
            </p>
            {actionLabel && onAction ? (
              <button type="button" onClick={() => onAction(item.id)} className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white sm:w-auto">
                {actionLabel}
              </button>
            ) : null}
          </div>
        ))}
        {!items.length ? (
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 text-center">
            <p className="text-xs font-bold text-on-surface">No records.</p>
            <p className="mt-1 text-xs text-on-surface-variant">This queue is clear.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Metric({ label, value, tone = 'text-primary' }) {
  return (
    <div className="rounded-xl border border-outline-variant/15 bg-white/70 p-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-on-surface-variant">{label}</p>
      <p className={`mt-1 font-headline text-2xl font-black ${tone}`}>{value}</p>
    </div>
  )
}
