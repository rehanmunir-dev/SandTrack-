import { useMemo, useState } from 'react'
import SectionCard from '../../components/common/SectionCard'
import StatusBadge from '../../components/common/StatusBadge'
import { useAppState } from '../../context/AppStateContext'
import { useAuth } from '../../context/AuthContext'
import { PAYMENT_STATUSES } from '../../constants/statusModels'

export default function PaymentVerificationPage() {
  const { currentUser } = useAuth()
  const { payments, consignments, selectedPaymentId, selectPayment, verifyPayment } = useAppState()

  const [remarks, setRemarks] = useState('')

  const queue = useMemo(() => {
    return payments.filter((item) => {
      return [
        PAYMENT_STATUSES.PENDING_VERIFICATION,
        PAYMENT_STATUSES.FLAGGED,
      ].includes(item.status)
    })
  }, [payments])

  const selected = queue.find((item) => item.id === selectedPaymentId) || queue[0] || null
  const linkedConsignment = consignments.find(
    (item) => item.id === selected?.consignmentId,
  )

  function makeDecision(decision) {
    if (!selected) {
      return
    }

    verifyPayment({
      paymentId: selected.id,
      decision,
      remarks,
      actor: currentUser.name,
    })

    setRemarks('')
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Payment Verification" subtitle="Accountant review queue">
        <p className="text-sm text-slate-600">Pending queue: {queue.length}</p>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Pending List" subtitle="Select item to review">
          <div className="space-y-2">
            {queue.length === 0 ? (
              <p className="text-sm text-slate-500">No pending items.</p>
            ) : (
              queue.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectPayment(item.id)}
                  className={`w-full rounded border p-3 text-left ${
                    selected?.id === item.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
                  }`}
                >
                  <p className="text-sm font-semibold">{item.id}</p>
                  <p className="text-xs text-slate-600">Consignment: {item.consignmentId}</p>
                  <StatusBadge status={item.status} />
                </button>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Verification Workspace" subtitle="Compare submitted vs expected vs OCR">
          {!selected ? (
            <p className="text-sm text-slate-500">Select a queue item.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-slate-500">Consignment:</span>{' '}
                {linkedConsignment?.receiptId || selected.consignmentId}
              </p>
              <p><span className="text-slate-500">Payer:</span> {selected.payerName}</p>
              <p><span className="text-slate-500">Method:</span> {selected.method}</p>
              <p><span className="text-slate-500">Receipt:</span> {selected.receiptFileName || 'N/A'}</p>
              <div className="rounded border border-slate-200 p-3">
                <p>System amount: <strong>{selected.expectedAmount}</strong></p>
                <p>Submitted amount: <strong>{selected.amountEntered}</strong></p>
                <p>OCR amount: <strong>{selected.ocrAmount}</strong></p>
                <p className="mt-1">
                  Difference: <strong>{Math.abs(selected.ocrAmount - selected.expectedAmount)}</strong>
                </p>
              </div>
              <textarea
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2"
                rows={3}
                placeholder="Add accountant remarks"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => makeDecision(PAYMENT_STATUSES.VERIFIED)}
                  className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => makeDecision(PAYMENT_STATUSES.FLAGGED)}
                  className="rounded bg-orange-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Flag
                </button>
                <button
                  type="button"
                  onClick={() => makeDecision(PAYMENT_STATUSES.REJECTED)}
                  className="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Queue Behavior" subtitle="Realtime-ready frontend strategy">
          <ul className="list-disc pl-4 text-sm text-slate-600 space-y-2">
            <li>Queue auto refresh can be added using polling or sockets.</li>
            <li>Decisions are non-optimistic to prevent false approvals.</li>
            <li>After decision, next queue item is selected automatically.</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  )
}
