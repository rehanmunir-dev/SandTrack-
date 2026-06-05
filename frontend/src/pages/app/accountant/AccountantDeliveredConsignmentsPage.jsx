import { useMemo, useState } from 'react'
import SectionCard from '../../../components/common/SectionCard'
import StatusBadge from '../../../components/common/StatusBadge'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'
import { CONSIGNMENT_STATUS, PAYMENT_STATUS } from '../../../constants/roleSystemStatus'

const FINAL_DELIVERY_STATUSES = new Set([
  CONSIGNMENT_STATUS.DELIVERED,
  CONSIGNMENT_STATUS.BILLED,
  CONSIGNMENT_STATUS.CLOSED,
])

export default function AccountantDeliveredConsignmentsPage() {
  const { consignments, payments, drivers, trucks, ledgerEntries } = useRoleSystem()
  const [selected, setSelected] = useState(null)

  const rows = useMemo(() => {
    return consignments
      .filter((consignment) => FINAL_DELIVERY_STATUSES.has(String(consignment.status).toUpperCase()))
      .map((consignment) => {
        const payment = payments.find((item) => item.consignmentDbId === consignment.id || item.consignmentId === consignment.consignmentId) || null
        const driver = drivers.find((item) => item.id === consignment.driverId) || null
        const truck = trucks.find((item) => item.id === consignment.truckId) || null
        const ledger = ledgerEntries.filter((item) => Number(item.consignmentId) === Number(consignment.id))

        return {
          consignment,
          payment,
          driver,
          truck,
          ledger,
          paymentComplete: payment?.status === PAYMENT_STATUS.PAID,
        }
      })
      .filter((row) => row.paymentComplete)
      .sort((a, b) => new Date(b.payment?.verifiedAt || b.consignment.createdAt).getTime() - new Date(a.payment?.verifiedAt || a.consignment.createdAt).getTime())
  }, [consignments, payments, drivers, trucks, ledgerEntries])

  function formatDateTime(value) {
    if (!value) return 'N/A'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'N/A'
    return date.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Delivered Consignments" subtitle="Delivered consignments with completed payments and proof records.">
        <div className="app-table-scroll rounded-lg border border-outline-variant/20">
          <table className="app-table min-w-[1000px] text-left text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Consignment</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Driver</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Truck</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Route</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Amount</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Payment</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {rows.map((row) => (
                <tr
                  key={row.consignment.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => setSelected(row)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelected(row)
                    }
                  }}
                  className="cursor-pointer transition-colors hover:bg-surface-container-low focus:bg-surface-container-low focus:outline-none"
                >
                  <td className="px-4 py-3 font-semibold text-on-surface">{row.consignment.consignmentId}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{row.driver?.name || row.consignment.driverName || 'N/A'}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{row.truck?.vehicleNo || row.consignment.truckRegistration || 'N/A'}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{row.consignment.originTerminal} to {row.consignment.destination}</td>
                  <td className="px-4 py-3 font-semibold text-primary">PKR {Number(row.payment?.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.payment?.status || PAYMENT_STATUS.PENDING} /></td>
                  <td className="px-4 py-3"><StatusBadge status={row.consignment.status} /></td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={(event) => { event.stopPropagation(); setSelected(row) }} className="rounded border border-primary px-3 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-white">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-sm text-on-surface-variant">
                    No delivered consignments with completed payments yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-3 border-b border-outline-variant/20 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Full Consignment Details</p>
                <h3 className="font-headline text-2xl font-extrabold text-on-surface">{selected.consignment.consignmentId}</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded border border-outline-variant px-3 py-2 text-xs font-bold text-on-surface">
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <DetailBlock title="Consignment">
                <Detail label="Status" value={<StatusBadge status={selected.consignment.status} />} />
                <Detail label="Material" value={selected.consignment.materialType || 'N/A'} />
                <Detail label="Weight" value={`${selected.consignment.netWeight || 0} tons`} />
                <Detail label="Origin" value={selected.consignment.originTerminal || 'N/A'} />
                <Detail label="Destination" value={selected.consignment.destination || 'N/A'} />
                <Detail label="Created" value={formatDateTime(selected.consignment.createdAt)} />
              </DetailBlock>

              <DetailBlock title="Driver & Truck">
                <Detail label="Driver" value={selected.driver?.name || selected.consignment.driverName || 'N/A'} />
                <Detail label="Driver Phone" value={selected.driver?.phone || 'N/A'} />
                <Detail label="Driver CNIC" value={selected.driver?.cnic || 'N/A'} />
                <Detail label="Truck Number" value={selected.truck?.vehicleNo || selected.consignment.truckRegistration || 'N/A'} />
                <Detail label="Truck Type" value={selected.truck?.type || 'N/A'} />
                <Detail label="Wheels" value={selected.truck?.wheels || selected.truck?.wheelCount || 'N/A'} />
              </DetailBlock>

              <DetailBlock title="Payment">
                <Detail label="Payment Status" value={<StatusBadge status={selected.payment?.status || PAYMENT_STATUS.PENDING} />} />
                <Detail label="Method" value={selected.payment?.method || 'N/A'} />
                <Detail label="Amount" value={`PKR ${Number(selected.payment?.amount || 0).toLocaleString()}`} />
                <Detail label="Verified At" value={formatDateTime(selected.payment?.verifiedAt)} />
                <Detail label="Remarks" value={selected.payment?.remarks || 'N/A'} />
              </DetailBlock>

              <DetailBlock title="Proof of Payment">
                {selected.payment?.receiptImage ? (
                  <a href={selected.payment.receiptImage} target="_blank" rel="noreferrer" className="inline-block">
                    <img src={selected.payment.receiptImage} alt="Proof of payment" className="max-h-64 rounded-lg border border-outline-variant/30 object-contain" />
                  </a>
                ) : (
                  <p className="text-sm text-on-surface-variant">No image proof attached. Cash payments may not require proof.</p>
                )}
              </DetailBlock>

              <div className="lg:col-span-2">
                <DetailBlock title="Ledger Entries">
                  {selected.ledger.length ? (
                    <div className="divide-y divide-outline-variant/20">
                      {selected.ledger.map((entry) => (
                        <div key={entry.id} className="grid grid-cols-1 gap-2 py-3 text-sm md:grid-cols-4">
                          <p><strong>Type:</strong> {entry.entryType}</p>
                          <p><strong>Amount:</strong> PKR {Number(entry.amount || 0).toLocaleString()}</p>
                          <p><strong>Status:</strong> {entry.status}</p>
                          <p><strong>Verified:</strong> {formatDateTime(entry.verifiedAt)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface-variant">No ledger entry has been closed for this consignment yet.</p>
                  )}
                </DetailBlock>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function DetailBlock({ title, children }) {
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
      <h4 className="mb-3 font-headline text-base font-bold text-on-surface">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="font-semibold text-on-surface-variant">{label}</span>
      <span className="text-right font-semibold text-on-surface">{value}</span>
    </div>
  )
}
