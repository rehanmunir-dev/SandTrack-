import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import SectionCard from '../../components/common/SectionCard'
import StatusBadge from '../../components/common/StatusBadge'
import { useAppState } from '../../context/AppStateContext'

export default function DigitalReceiptPage() {
  const { consignmentId } = useParams()
  const { consignments, payments } = useAppState()

  const consignment = consignments.find((item) => item.id === consignmentId)
  const linkedPayment = useMemo(() => {
    return payments.find((item) => item.consignmentId === consignmentId)
  }, [payments, consignmentId])

  if (!consignment) {
    return (
      <SectionCard title="Digital Receipt">
        <p className="text-sm text-slate-600">Consignment not found.</p>
      </SectionCard>
    )
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={`Digital Receipt ${consignment.receiptId}`}
        subtitle="Share and verification record"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500">Consignment</p>
            <p className="font-semibold">{consignment.receiptId}</p>
          </div>
          <div>
            <p className="text-slate-500">Vehicle</p>
            <p className="font-semibold">{consignment.vehicleNo}</p>
          </div>
          <div>
            <p className="text-slate-500">Driver</p>
            <p className="font-semibold">{consignment.driverName}</p>
          </div>
          <div>
            <p className="text-slate-500">Dispatch Status</p>
            <StatusBadge status={consignment.status} />
          </div>
          <div>
            <p className="text-slate-500">Payment Status</p>
            <StatusBadge status={consignment.paymentStatus} />
          </div>
          <div>
            <p className="text-slate-500">QR Payload</p>
            <p className="font-semibold">{consignment.qrCode}</p>
          </div>
        </div>

        {linkedPayment ? (
          <div className="mt-4 rounded border border-slate-200 p-3 text-sm">
            <p className="font-semibold">Latest Payment</p>
            <p>Payer: {linkedPayment.payerName}</p>
            <p>Method: {linkedPayment.method}</p>
            <p>Entered Amount: {linkedPayment.amountEntered}</p>
            <p>OCR Amount: {linkedPayment.ocrAmount}</p>
            <p>Status: <StatusBadge status={linkedPayment.status} /></p>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded border border-slate-300 px-3 py-2 text-sm">Download</button>
          <button className="rounded border border-slate-300 px-3 py-2 text-sm">Share</button>
          <button className="rounded border border-slate-300 px-3 py-2 text-sm">Store</button>
        </div>
      </SectionCard>

      <Link className="underline text-sm" to={`/app/consignments/${consignment.id}`}>
        Back to consignment details
      </Link>
    </div>
  )
}
