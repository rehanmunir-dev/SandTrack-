import { useMemo, useState } from 'react'
import SectionCard from '../../../components/common/SectionCard'
import StatusBadge from '../../../components/common/StatusBadge'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'
import { CONSIGNMENT_STATUS, PAYMENT_STATUS } from '../../../constants/roleSystemStatus'

const DELIVERED_STATUSES = new Set([
  CONSIGNMENT_STATUS.DELIVERED,
  CONSIGNMENT_STATUS.BILLED,
  CONSIGNMENT_STATUS.CLOSED,
])

function toPaymentMethodFormValue(method) {
  const normalized = String(method || '').toUpperCase()
  if (normalized === 'BANK') return 'Bank Account'
  if (normalized === 'CASH') return 'Cash'
  return method || 'Cash'
}

export default function AccountantLedgerPage() {
  const { payments, consignments, drivers, trucks, ledgerEntries, updatePaymentDetails, closeLedger } = useRoleSystem()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [closingLedgerId, setClosingLedgerId] = useState(null)
  const [form, setForm] = useState({
    paymentId: '',
    method: 'Cash',
    amount: '',
    status: PAYMENT_STATUS.PENDING,
    remarks: '',
    receiptImage: '',
  })

  const rows = useMemo(() => {
    return payments
      .map((payment) => {
        const consignment = consignments.find((item) => item.consignmentId === payment.consignmentId)
        const driver = consignment ? drivers.find((item) => item.id === consignment.driverId) : null
        const truck = consignment ? trucks.find((item) => item.id === consignment.truckId) : null

        return {
          id: payment.id,
          consignmentDbId: consignment?.id || payment.consignmentDbId || null,
          ledgerRef: consignment?.consignmentId || payment.consignmentId,
          driverName: driver?.name || 'N/A',
          truckNo: truck?.vehicleNo || 'N/A',
          origin: consignment?.originTerminal || 'N/A',
          destination: consignment?.destination || 'N/A',
          netWeight: consignment?.netWeight ?? 'N/A',
          paymentMethod: payment.method || 'Cash',
          amount: payment.amount,
          paymentStatus: payment.status,
          deliveryStatus: DELIVERED_STATUSES.has(String(consignment?.status).toUpperCase()) ? 'Delivered' : 'On The Way',
          createdAt: consignment?.createdAt || payment.createdAt,
          deliveredAt: consignment?.deliveredAt || null,
          verifiedAt: payment.verifiedAt || null,
          remarks: payment.remarks || 'N/A',
          receiptImage: payment.receiptImage || '',
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [payments, consignments, drivers, trucks])

  function openFormForPayment(paymentId) {
    const selected = rows.find((item) => item.id === paymentId) || rows[0]
    if (!selected) {
      return
    }

    setForm({
      paymentId: selected.id,
      method: toPaymentMethodFormValue(selected.paymentMethod),
      amount: selected.amount,
      status: selected.paymentStatus,
      remarks: selected.remarks === 'N/A' ? '' : selected.remarks,
      receiptImage: selected.receiptImage,
    })
    setIsFormOpen(true)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSelectPayment(event) {
    const paymentId = Number(event.target.value)
    const selected = rows.find((item) => item.id === paymentId)
    if (!selected) {
      return
    }

    setForm({
      paymentId,
      method: toPaymentMethodFormValue(selected.paymentMethod),
      amount: selected.amount,
      status: selected.paymentStatus,
      remarks: selected.remarks === 'N/A' ? '' : selected.remarks,
      receiptImage: selected.receiptImage,
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.paymentId) {
      return
    }

    if (String(form.method).toUpperCase() !== 'CASH' && form.status === PAYMENT_STATUS.PAID && !form.receiptImage.trim()) {
      window.alert('Please attach the received payment proof for non-cash payments.')
      return
    }

    updatePaymentDetails(form.paymentId, {
      method: form.method,
      amount: Number(form.amount || 0),
      status: form.status,
      remarks: form.remarks.trim(),
      receiptImage: form.receiptImage.trim(),
    })

    setIsFormOpen(false)
  }

  function handleReceiptUpload(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, receiptImage: reader.result }))
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleCloseLedger(row) {
    if (!row?.consignmentDbId) {
      setNotice('Consignment record was not found for this payment. Please refresh and try again.')
      return
    }

    setClosingLedgerId(row.id)
    setNotice('')

    try {
      await closeLedger(row.consignmentDbId)
      setNotice('Ledger closed successfully.')
    } catch (error) {
      setNotice(error.response?.data?.message || 'Ledger could not be closed.')
    } finally {
      setClosingLedgerId(null)
    }
  }

  function formatDateTime(value) {
    if (!value) {
      return 'N/A'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return 'N/A'
    }

    return date.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Ledger" subtitle="Detailed ledger with consignment, payment, driver, truck, destination, timeline, and receipt image.">
        <div className="mb-4 flex justify-end">
          <button type="button" onClick={() => openFormForPayment(rows[0]?.id)} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">
            Add Payment Details
          </button>
        </div>
        <div className="app-table-scroll rounded-lg border border-outline-variant/20">
          <table className="app-table min-w-[1100px] text-left text-sm">
          <thead className="bg-surface-container-low text-on-surface-variant">
            <tr>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Consignment</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Driver</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Truck</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Origin</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Destination</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Weight</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Payment Method</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Amount</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Payment Status</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Delivery Status</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Created</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Delivered</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Verified</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Receipt</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Remarks</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-surface-container-low">
                <td className="px-4 py-3 font-semibold text-on-surface">{row.ledgerRef}</td>
                <td className="px-4 py-3 text-on-surface-variant">{row.driverName}</td>
                <td className="px-4 py-3 text-on-surface-variant">{row.truckNo}</td>
                <td className="px-4 py-3 text-on-surface-variant">{row.origin}</td>
                <td className="px-4 py-3 text-on-surface-variant">{row.destination}</td>
                <td className="px-4 py-3 text-on-surface-variant">{row.netWeight}</td>
                <td className="px-4 py-3 text-on-surface-variant">{row.paymentMethod}</td>
                <td className="px-4 py-3 text-on-surface-variant">{row.amount}</td>
                <td className="px-4 py-3"><StatusBadge status={row.paymentStatus} /></td>
                <td className="px-4 py-3 text-on-surface-variant">{row.deliveryStatus}</td>
                <td className="px-4 py-3 text-on-surface-variant">{formatDateTime(row.createdAt)}</td>
                <td className="px-4 py-3 text-on-surface-variant">{formatDateTime(row.deliveredAt)}</td>
                <td className="px-4 py-3 text-on-surface-variant">{formatDateTime(row.verifiedAt)}</td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {row.receiptImage ? (
                    <a href={row.receiptImage} target="_blank" rel="noreferrer" className="block">
                      <img src={row.receiptImage} alt="Payment receipt" className="h-12 w-12 rounded border border-outline-variant/30 object-cover" />
                    </a>
                  ) : 'N/A'}
                </td>
                <td className="px-4 py-3 text-on-surface-variant">{row.remarks}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openFormForPayment(row.id)} className="rounded border border-outline-variant px-2 py-1 text-xs font-semibold">
                      Update Payment
                    </button>
                    {row.deliveryStatus === 'Delivered' && row.paymentStatus === PAYMENT_STATUS.PAID ? (
                      <button
                        type="button"
                        onClick={() => handleCloseLedger(row)}
                        disabled={closingLedgerId === row.id}
                        className="rounded border border-primary px-2 py-1 text-xs font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {closingLedgerId === row.id ? 'Closing...' : 'Close Ledger'}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </SectionCard>

      {notice ? (
        <p className="rounded-xl border border-primary/15 bg-primary/10 px-4 py-3 text-xs font-bold text-primary shadow-sm">
          {notice}
        </p>
      ) : null}

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-lg rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-headline text-lg font-bold text-on-surface">Update Payment Details</h3>
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded px-2 py-1 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low">Close</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Select Consignment Payment</label>
                <select name="paymentId" value={form.paymentId} onChange={handleSelectPayment} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                  {rows.map((row) => (
                    <option key={row.id} value={row.id}>{row.ledgerRef}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Payment Method</label>
                <select name="method" value={form.method} onChange={handleChange} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                  <option value="Cash">Cash</option>
                  <option value="Bank Account">Bank Account</option>
                  <option value="Online Transfer">Online Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Amount</label>
                <input name="amount" type="number" value={form.amount} onChange={handleChange} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Payment Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                  <option value={PAYMENT_STATUS.PENDING}>Pending</option>
                  <option value={PAYMENT_STATUS.PAID}>Paid</option>
                  <option value={PAYMENT_STATUS.HELD}>Held</option>
                  <option value={PAYMENT_STATUS.OVERDUE}>Overdue</option>
                </select>
              </div>
              {String(form.method).toUpperCase() !== 'CASH' && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Upload Receipt Image (Proof of Payment)</label>
                  <input type="file" accept="image/*" onChange={handleReceiptUpload} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm" />
                  {form.receiptImage ? (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={form.receiptImage} alt="Receipt preview" className="h-14 w-14 rounded border border-outline-variant/30 object-cover" />
                      <button type="button" onClick={() => setForm((prev) => ({ ...prev, receiptImage: '' }))} className="rounded border border-outline-variant px-2 py-1 text-xs font-semibold">
                        Remove Image
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Remarks</label>
                <input name="remarks" value={form.remarks} onChange={handleChange} placeholder="Add remarks" className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm" />
              </div>
              <button type="submit" className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white">Save Payment Details</button>
            </form>
          </div>
        </div>
      ) : null}

      <SectionCard title="Ledger Entries" subtitle="Closed ledger records generated after delivery and payment verification.">
        <div className="app-table-scroll rounded-lg border border-outline-variant/20">
          <table className="app-table text-left text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Consignment</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Type</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Amount</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Credit</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {ledgerEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 font-semibold">{entry.consignmentNumber || entry.consignmentId}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{entry.entryType}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{entry.amount}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{entry.credit}</td>
                  <td className="px-4 py-3"><StatusBadge status={entry.status} /></td>
                  <td className="px-4 py-3 text-on-surface-variant">{formatDateTime(entry.verifiedAt)}</td>
                </tr>
              ))}
              {!ledgerEntries.length ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-sm text-on-surface-variant">No ledger entries yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
