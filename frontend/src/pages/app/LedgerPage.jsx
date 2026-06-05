import { useMemo, useState } from 'react'
import SectionCard from '../../components/common/SectionCard'
import StatusBadge from '../../components/common/StatusBadge'
import { useAppState } from '../../context/AppStateContext'

export default function LedgerPage() {
  const { payments } = useAppState()
  const [status, setStatus] = useState('ALL')
  const [method, setMethod] = useState('ALL')
  const [exportMessage, setExportMessage] = useState('')

  const rows = useMemo(() => {
    return payments.filter((item) => {
      const statusPass = status === 'ALL' || item.status === status
      const methodPass = method === 'ALL' || item.method === method
      return statusPass && methodPass
    })
  }, [payments, status, method])

  const total = rows.reduce((acc, item) => acc + Number(item.amountEntered || 0), 0)

  function handleExport(type) {
    setExportMessage(`Export queued: ${type} (${rows.length} rows)`) 
    setTimeout(() => setExportMessage(''), 2000)
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Ledger / Finance" subtitle="Transaction overview and export controls">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING_VERIFICATION">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="FLAGGED">Flagged</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">All methods</option>
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
            <option value="JAZZCASH">JazzCash</option>
            <option value="EASYPAISA">EasyPaisa</option>
          </select>

          <button
            type="button"
            onClick={() => handleExport('CSV')}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport('PDF')}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            Export PDF
          </button>
        </div>

        <div className="mt-3 rounded border border-slate-200 p-3 text-sm">
          <p>Total amount in current filter: <strong>{total}</strong></p>
          <p>Transaction count: <strong>{rows.length}</strong></p>
          {exportMessage ? <p className="text-emerald-700">{exportMessage}</p> : null}
        </div>
      </SectionCard>

      <SectionCard title="Transactions">
        <div className="app-table-scroll">
          <table className="app-table text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2">Payment ID</th>
                <th className="py-2">Consignment</th>
                <th className="py-2">Payer</th>
                <th className="py-2">Method</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="py-2">{item.id}</td>
                  <td className="py-2">{item.consignmentId}</td>
                  <td className="py-2">{item.payerName}</td>
                  <td className="py-2">{item.method}</td>
                  <td className="py-2">{item.amountEntered}</td>
                  <td className="py-2"><StatusBadge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
