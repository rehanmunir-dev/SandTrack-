import { useState } from 'react'
import SectionCard from '../../../components/common/SectionCard'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'
import { TRUCK_STATUS } from '../../../constants/roleSystemStatus'

export default function OperatorTrucksPage() {
  const { trucks, drivers, createTruck, updateTruck, deleteTruck } = useRoleSystem()
  const [form, setForm] = useState({ vehicleNo: '', type: 'Damper', ownershipType: 'own', assignedDriverId: '', status: TRUCK_STATUS.ACTIVE })
  const [editId, setEditId] = useState('')
  const [showModal, setShowModal] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function reset() {
    setForm({ vehicleNo: '', type: 'Damper', ownershipType: 'own', assignedDriverId: '', status: TRUCK_STATUS.ACTIVE })
    setEditId('')
  }

  async function submitTruck(event) {
    event.preventDefault()
    if (editId) {
      await updateTruck(editId, { ...form, assignedDriverId: form.assignedDriverId || null })
    } else {
      await createTruck({ ...form, assignedDriverId: form.assignedDriverId || null })
    }
    reset()
    setShowModal(false)
  }

  function openAddModal() {
    reset()
    setShowModal(true)
  }

  function openEditModal(truck) {
    setEditId(truck.id)
    setForm({ vehicleNo: truck.vehicleNo, type: truck.type, ownershipType: truck.ownershipType, assignedDriverId: truck.assignedDriverId || '', status: truck.status })
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Truck Management" subtitle="Current truck registry">
        <div className="mb-4 flex justify-end">
          <button type="button" onClick={openAddModal} className="rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white">Add Truck</button>
        </div>
        <div className="app-table-scroll rounded-lg border border-outline-variant/20">
          <table className="app-table text-left text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Vehicle</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Type</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Wheels</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Ownership</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Driver</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Approval</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {trucks.map((truck) => (
                <tr key={truck.id} className="hover:bg-surface-container-low">
                  <td className="px-4 py-3 font-semibold text-on-surface">{truck.vehicleNo}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{truck.type}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{truck.wheels || '-'}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{truck.ownershipType}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{drivers.find((driver) => driver.id === truck.assignedDriverId)?.name || 'Unassigned'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${truck.status === TRUCK_STATUS.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {truck.status === TRUCK_STATUS.ACTIVE ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${truck.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {truck.approvalStatus === 'approved' ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEditModal(truck)} className="rounded border border-outline-variant px-2 py-1 text-[11px] font-semibold">Edit</button>
                      <button type="button" onClick={() => deleteTruck(truck.id)} className="rounded border border-error px-2 py-1 text-[11px] font-semibold text-error">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
            <div className="w-full max-w-2xl rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl">
              <div className="flex items-center justify-between border-b border-outline-variant/20 p-4">
                <div>
                  <h4 className="font-headline text-lg font-bold">{editId ? 'Edit Truck' : 'Add Truck'}</h4>
                  <p className="text-xs text-on-surface-variant">Popup truck form</p>
                </div>
                <button type="button" onClick={() => { reset(); setShowModal(false) }} className="rounded border border-outline-variant px-3 py-1 text-xs font-semibold hover:bg-surface-container-low transition-colors">Close</button>
              </div>
              <form onSubmit={submitTruck} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                <input name="vehicleNo" value={form.vehicleNo} onChange={handleChange} placeholder="Vehicle number" className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm" />
                <select name="type" value={form.type} onChange={handleChange} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                  <option value="Damper">Damper</option>
                  <option value="Truck">Truck</option>
                  <option value="Mazda">Mazda</option>
                  <option value="Suzuki">Suzuki</option>
                </select>
                <select name="wheels" value={form.wheels || ''} onChange={handleChange} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                  <option value="">Select Wheels</option>
                  <option value="8">8 Wheeler</option>
                  <option value="14">14 Wheeler</option>
                  <option value="16">16 Wheeler</option>
                  <option value="18">18 Wheeler</option>
                  <option value="20">20 Wheeler</option>
                  <option value="22">22 Wheeler</option>
                </select>
                <select name="ownershipType" value={form.ownershipType} onChange={handleChange} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                  <option value="own">Own</option>
                  <option value="other">Other</option>
                  <option value="guest">Guest</option>
                </select>
                <select name="assignedDriverId" value={form.assignedDriverId} onChange={handleChange} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                  <option value="">Unassigned driver</option>
                  {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                </select>
                <select name="status" value={form.status} onChange={handleChange} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm md:col-span-2">
                  <option value={TRUCK_STATUS.ACTIVE}>Active</option>
                  <option value={TRUCK_STATUS.INACTIVE}>Inactive</option>
                </select>
                <div className="md:col-span-2 flex gap-2 pt-2">
                  <button type="submit" className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white">{editId ? 'Update Truck' : 'Add Truck'}</button>
                  <button type="button" onClick={() => { reset(); setShowModal(false) }} className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}
