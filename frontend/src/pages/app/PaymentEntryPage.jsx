import { useMemo, useState } from 'react'
import SectionCard from '../../components/common/SectionCard'
import StatusBadge from '../../components/common/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useAppState } from '../../context/AppStateContext'
import { PAYMENT_METHODS } from '../../constants/statusModels'

const initialForm = {
  consignmentId: '',
  amountEntered: '',
  ocrAmount: '',
  payerName: '',
  method: PAYMENT_METHODS[0],
  receiptFileName: '',
}

export default function PaymentEntryPage() {
  const { currentUser } = useAuth()
  const { consignments, submitPayment } = useAppState()
  const [form, setForm] = useState(initialForm)
  const [submittedId, setSubmittedId] = useState('')

  const activeConsignments = useMemo(() => {
    return consignments.filter((item) => item.status !== 'CLOSED')
  }, [consignments])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    setForm((prev) => ({ ...prev, receiptFileName: file ? file.name : '' }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const selectedConsignment = consignments.find(
      (item) => item.id === form.consignmentId,
    )

    if (!selectedConsignment) {
      return
    }

    submitPayment({
      ...form,
      expectedAmount: selectedConsignment.amountDue,
      receiptId: selectedConsignment.receiptId,
      actor: currentUser.name,
      tolerance: 500,
    })

    setSubmittedId(selectedConsignment.receiptId)
    setForm({ ...initialForm, method: PAYMENT_METHODS[0] })
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Payment Entry" subtitle="Mobile-ready submission for verification queue">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            required
            name="consignmentId"
            value={form.consignmentId}
            onChange={handleChange}
            className="rounded border border-slate-300 px-3 py-3 text-base"
          >
            <option value="">Select active consignment</option>
            {activeConsignments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.receiptId} - {item.vehicleNo}
              </option>
            ))}
          </select>

          <input
            required
            name="payerName"
            value={form.payerName}
            onChange={handleChange}
            className="rounded border border-slate-300 px-3 py-3 text-base"
            placeholder="Payer name"
          />

          <input
            required
            name="amountEntered"
            type="number"
            value={form.amountEntered}
            onChange={handleChange}
            className="rounded border border-slate-300 px-3 py-3 text-base"
            placeholder="Entered amount"
          />

          <input
            required
            name="ocrAmount"
            type="number"
            value={form.ocrAmount}
            onChange={handleChange}
            className="rounded border border-slate-300 px-3 py-3 text-base"
            placeholder="OCR extracted amount"
          />

          <select
            name="method"
            value={form.method}
            onChange={handleChange}
            className="rounded border border-slate-300 px-3 py-3 text-base"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>

          {form.method.toLowerCase() !== 'cash' && (
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="rounded border border-slate-300 px-3 py-3 text-base"
            />
          )}

          <button className="rounded bg-slate-900 px-4 py-3 text-base font-semibold text-white md:col-span-2">
            Submit for Verification
          </button>
        </form>

        {submittedId ? (
          <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Payment for {submittedId} submitted successfully and moved to pending verification.
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Current Active Consignments" subtitle="Quick view before payment entry">
        <div className="space-y-2 text-sm">
          {activeConsignments.map((item) => (
            <div key={item.id} className="rounded border border-slate-200 p-3 flex justify-between gap-3">
              <p>
                <span className="font-semibold">{item.receiptId}</span> | {item.vehicleNo} | Due {item.amountDue}
              </p>
              <StatusBadge status={item.paymentStatus} />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
