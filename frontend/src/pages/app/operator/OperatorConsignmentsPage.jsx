import { useState } from 'react'
import SectionCard from '../../../components/common/SectionCard'
import StatusBadge from '../../../components/common/StatusBadge'
import OperatorQrPassActions from '../../../components/operator/OperatorQrPassActions'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'
import { CONSIGNMENT_STATUS, DRIVER_STATUS, TRUCK_STATUS } from '../../../constants/roleSystemStatus'

const TERMINALS = [
  'Hazro Terminal',
  'Ghazi Terminal',
  'Sand Thia Terminal',
  'Taxila Terminal',
]

const BUSY_CONSIGNMENT_STATUSES = new Set([
  CONSIGNMENT_STATUS.SCAN_PENDING,
  CONSIGNMENT_STATUS.IN_TRANSIT,
  CONSIGNMENT_STATUS.ARRIVED,
  CONSIGNMENT_STATUS.DELIVERY_PENDING_VERIFICATION,
  CONSIGNMENT_STATUS.DELIVERED,
])

export default function OperatorConsignmentsPage() {
  const { consignments, drivers, trucks, createConsignment, flagConsignment } = useRoleSystem()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [flagModalConsignment, setFlagModalConsignment] = useState(null)
  const [form, setForm] = useState({ driverId: '', truckId: '', netWeight: '', destination: TERMINALS[1], originTerminal: TERMINALS[0], notes: '', price: '', discount: '' })

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function resetForm() {
    setForm({ driverId: '', truckId: '', netWeight: '', destination: TERMINALS[1], originTerminal: TERMINALS[0], notes: '', price: '', discount: '' })
  }

  function submitForm(event) {
    event.preventDefault()
    createConsignment(form)
    resetForm()
    setShowCreateModal(false)
  }

  const busyDriverIds = new Set(consignments.filter((item) => BUSY_CONSIGNMENT_STATUSES.has(String(item.status).toUpperCase())).map((item) => String(item.driverId)))
  const busyTruckIds = new Set(consignments.filter((item) => BUSY_CONSIGNMENT_STATUSES.has(String(item.status).toUpperCase())).map((item) => String(item.truckId)))
  const approvedDrivers = drivers.filter((driver) => driver.approvalStatus === 'approved' && driver.status === DRIVER_STATUS.ACTIVE && !busyDriverIds.has(String(driver.id)))
  const approvedTrucks = trucks.filter((truck) => truck.approvalStatus === 'approved' && truck.status === TRUCK_STATUS.ACTIVE && !busyTruckIds.has(String(truck.id)))

  function buildQrPass(item) {
    const driver = drivers.find((candidate) => candidate.id === item.driverId)
    const truck = trucks.find((candidate) => candidate.id === item.truckId)
    return {
      ...item,
      driverName: driver?.name || item.driverName || 'N/A',
      driverPhone: driver?.phone || 'N/A',
      truckVehicleNo: truck?.vehicleNo || item.truckRegistration || 'N/A',
      truckType: truck?.type || 'N/A',
      netWeight: item.netWeight,
      materialType: item.materialType || 'Sand Load',
      originTerminal: item.originTerminal,
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Operator Consignments" subtitle="All created records and QR assignments">
        <div className="flex justify-end">
          <button type="button" onClick={() => setShowCreateModal(true)} className="rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white">
            Create Consignment
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Consignment Registry" subtitle="Driver, truck, QR, and lifecycle state">
        <div className="app-table-scroll rounded-lg border border-outline-variant/20">
          <table className="app-table text-left text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Consignment</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Driver</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Truck</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {consignments.map((item) => (
                <tr key={item.id} className={`hover:bg-surface-container-low ${item.isFlagged ? 'bg-error-container/20' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-primary">
                    {item.consignmentId}
                    {item.isFlagged && <span className="ml-2 rounded bg-error px-1.5 py-0.5 text-[10px] font-bold text-white">FLAGGED</span>}
                  </td>
                  <td className="px-4 py-3 text-on-surface">{drivers.find((driver) => driver.id === item.driverId)?.name || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-on-surface">{trucks.find((truck) => truck.id === item.truckId)?.vehicleNo || 'Unassigned'}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <OperatorQrPassActions pass={buildQrPass(item)} compact />
                      {!item.isFlagged && (
                        <button 
                          onClick={() => setFlagModalConsignment(item)}
                          className="rounded border border-error px-2 py-1 text-[11px] font-semibold text-error hover:bg-error hover:text-white"
                        >
                          Flag Issue
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 p-4">
              <div>
                <h4 className="font-headline text-lg font-bold">Create Consignment</h4>
                <p className="text-xs text-on-surface-variant">Popup form for operator consignment creation</p>
              </div>
              <button type="button" onClick={() => { resetForm(); setShowCreateModal(false) }} className="rounded border border-outline-variant px-3 py-1 text-xs font-semibold hover:bg-surface-container-low transition-colors">
                Close
              </button>
            </div>
            <form onSubmit={submitForm} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Driver</label>
                <select name="driverId" value={form.driverId} onChange={handleChange} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                  <option value="">Select driver</option>
                  {approvedDrivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Truck</label>
                <select name="truckId" value={form.truckId} onChange={handleChange} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                  <option value="">Select truck</option>
                  {approvedTrucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.vehicleNo}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Net Weight (Tons)</label>
                <input name="netWeight" type="number" step="0.1" value={form.netWeight} onChange={handleChange} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Price (PKR)</label>
                  <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Price" className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Discount (PKR)</label>
                  <input name="discount" type="number" value={form.discount} onChange={handleChange} placeholder="Discount" className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Destination</label>
                <select name="destination" value={form.destination} onChange={handleChange} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                  {TERMINALS.map((terminal) => <option key={terminal} value={terminal}>{terminal}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Origin Terminal</label>
                <select name="originTerminal" value={form.originTerminal} onChange={handleChange} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                  {TERMINALS.map((terminal) => <option key={terminal} value={terminal}>{terminal}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Notes</label>
                <input name="notes" value={form.notes} onChange={handleChange} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2 flex gap-2 pt-2">
                <button type="submit" className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white">Create Consignment</button>
                <button type="button" onClick={() => { resetForm(); setShowCreateModal(false) }} className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {flagModalConsignment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-lg rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl">
            <div className="border-b border-outline-variant/20 p-4">
              <h4 className="font-headline text-lg font-bold text-error">Flag Consignment</h4>
              <p className="text-xs text-on-surface-variant">Review driver and details before flagging</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4 p-3 bg-surface-container-low rounded-lg">
                <div className="w-16 h-16 bg-slate-300 rounded-full flex items-center justify-center overflow-hidden border-2 border-outline-variant">
                   {/* Placeholder for driver face image */}
                   <span className="material-symbols-outlined text-4xl text-slate-500">face</span>
                </div>
                <div>
                  <p className="font-bold">{drivers.find(d => d.id === flagModalConsignment.driverId)?.name}</p>
                  <p className="text-xs text-on-surface-variant">Driver ID: {flagModalConsignment.driverId}</p>
                  <p className="text-xs text-on-surface-variant">Truck: {trucks.find(t => t.id === flagModalConsignment.truckId)?.vehicleNo}</p>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-on-surface-variant">Reason for Flagging</label>
                <textarea 
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm min-h-[80px]"
                  placeholder="E.g. Incorrect truck number, mismatched driver face, etc."
                  id="flag-reason-input"
                ></textarea>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-outline-variant/20">
              <button 
                onClick={() => {
                  const reason = document.getElementById('flag-reason-input').value
                  if (reason) {
                    flagConsignment(flagModalConsignment.id, reason)
                    setFlagModalConsignment(null)
                  } else {
                    alert('Please enter a reason')
                  }
                }}
                className="flex-1 rounded-lg bg-error px-4 py-2 text-sm font-bold text-white hover:bg-error/90"
              >
                Confirm Flag
              </button>
              <button 
                onClick={() => setFlagModalConsignment(null)}
                className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 text-sm font-bold text-on-surface"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
