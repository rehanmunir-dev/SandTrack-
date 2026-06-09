const DEFAULT_STEPS = [
  { key: 'CREATED', label: 'Created', description: 'Consignment record created' },
  { key: 'QR_GENERATED', label: 'QR Generated', description: 'Gate pass prepared' },
  { key: 'GATE_CLEARED', label: 'Gate Cleared', description: 'Watchman cleared the gate' },
  { key: 'IN_TRANSIT', label: 'In Transit', description: 'Truck is on the way' },
  { key: 'ARRIVED', label: 'Arrived', description: 'Load reached destination' },
  { key: 'DELIVERED', label: 'Delivered', description: 'Delivery verified' },
  { key: 'PAYMENT_VERIFIED', label: 'Payment Verified', description: 'Payment confirmed' },
  { key: 'CLOSED', label: 'Ledger Closed', description: 'Finance closed the order' },
]

const STATUS_INDEX = {
  CREATED: 0,
  SCAN_PENDING: 1,
  QR_GENERATED: 1,
  GATE_CLEARED: 2,
  IN_TRANSIT: 3,
  ARRIVED: 4,
  DELIVERY_PENDING_VERIFICATION: 4,
  DELIVERED: 5,
  PAYMENT_VERIFIED: 6,
  BILLED: 7,
  CLOSED: 7,
}

function getProgressIndex(status, paymentStatus, hasQr) {
  const normalizedStatus = String(status || '').toUpperCase()
  const normalizedPayment = String(paymentStatus || '').toUpperCase()
  let index = STATUS_INDEX[normalizedStatus] ?? 0

  if (hasQr && index < 1) {
    index = 1
  }

  if ((normalizedPayment === 'VERIFIED' || normalizedPayment === 'PAID') && index < 6) {
    index = 6
  }

  return index
}

export default function StatusTimeline({ status, paymentStatus, hasQr = false, steps = DEFAULT_STEPS }) {
  const progressIndex = getProgressIndex(status, paymentStatus, hasQr)

  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="font-headline text-lg font-black text-on-surface">Status Timeline</h3>
        <p className="text-xs font-medium text-on-surface-variant">Simple view of the current order lifecycle.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const isDone = index <= progressIndex
          const isCurrent = index === progressIndex

          return (
            <div
              key={step.key}
              className={`rounded-xl border p-3 ${
                isDone
                  ? 'border-primary/20 bg-primary/10'
                  : 'border-outline-variant/15 bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                  isDone ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                }`}>
                  {isDone ? 'OK' : index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black uppercase tracking-[0.12em] text-on-surface">{step.label}</p>
                  {isCurrent ? <p className="text-[10px] font-bold text-secondary">Current step</p> : null}
                </div>
              </div>
              <p className="mt-2 text-xs font-medium text-on-surface-variant">{step.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
