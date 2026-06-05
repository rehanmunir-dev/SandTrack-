import { useState } from 'react'
import SectionCard from '../../../components/common/SectionCard'
import CredentialCard from '../../../components/CredentialCard'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'
import { DRIVER_STATUS } from '../../../constants/roleSystemStatus'

export default function OperatorDriversPage() {
  const { drivers, createDriver, updateDriver, deleteDriver, trucks } = useRoleSystem()
  const [form, setForm] = useState({ name: '', phone: '', cnic: '', status: DRIVER_STATUS.ACTIVE, assignedTruckId: '' })
  const [editId, setEditId] = useState('')
  const [showModal, setShowModal] = useState(false)
  
  const [credModal, setCredModal] = useState({
    isOpen: false,
    name: '',
    cnic: '',
    username: '',
    password: '',
    extraInfo: ''
  })

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function reset() {
    setForm({ name: '', phone: '', cnic: '', status: DRIVER_STATUS.ACTIVE, assignedTruckId: '' })
    setEditId('')
  }

  async function submitDriver(event) {
    event.preventDefault()
    if (editId) {
      await updateDriver(editId, { ...form, assignedTruckId: form.assignedTruckId || null })
      reset()
      setShowModal(false)
    } else {
      const result = await createDriver({ ...form, assignedTruckId: form.assignedTruckId || null })
      reset()
      setShowModal(false)
      if (result && result.loginCredentials) {
        setCredModal({
          isOpen: true,
          name: result.fullName || form.name,
          cnic: result.cnic || form.cnic,
          username: result.loginCredentials.username,
          password: result.loginCredentials.plainPassword,
          extraInfo: 'Pending Admin Approval'
        })
      }
    }
  }

  function openAddModal() {
    reset()
    setShowModal(true)
  }

  function openEditModal(driver) {
    setEditId(driver.id)
    setForm({ name: driver.name, phone: driver.phone, cnic: driver.cnic || '', status: driver.status, assignedTruckId: driver.assignedTruckId || '' })
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Driver Management" subtitle="Current driver registry">
        <div className="mb-4 flex justify-end">
          <button type="button" onClick={openAddModal} className="rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white">Add Driver</button>
        </div>
        <div className="app-table-scroll rounded-lg border border-outline-variant/20">
          <table className="app-table text-left text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Name</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Phone</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Truck</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Approval</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-surface-container-low">
                  <td className="px-4 py-3 font-semibold text-on-surface">{driver.name}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{driver.phone}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{trucks.find((truck) => truck.id === driver.assignedTruckId)?.vehicleNo || 'Unassigned'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${driver.status === DRIVER_STATUS.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {driver.status === DRIVER_STATUS.ACTIVE ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${driver.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {driver.approvalStatus === 'approved' ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEditModal(driver)} className="rounded border border-outline-variant px-2 py-1 text-[11px] font-semibold">Edit</button>
                      <button type="button" onClick={() => deleteDriver(driver.id)} className="rounded border border-error px-2 py-1 text-[11px] font-semibold text-error">Delete</button>
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
                  <h4 className="font-headline text-lg font-bold">{editId ? 'Edit Driver' : 'Add Driver'}</h4>
                  <p className="text-xs text-on-surface-variant">Popup driver form</p>
                </div>
                <button type="button" onClick={() => { reset(); setShowModal(false) }} className="rounded border border-outline-variant px-3 py-1 text-xs font-semibold hover:bg-surface-container-low transition-colors">Close</button>
              </div>
              <form onSubmit={submitDriver} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                <input name="name" value={form.name} onChange={handleChange} placeholder="Driver name" className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm" />
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm" />
                <input name="cnic" value={form.cnic} onChange={handleChange} placeholder="CNIC (optional)" className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm" />
                <select name="status" value={form.status} onChange={handleChange} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                  <option value={DRIVER_STATUS.ACTIVE}>Active</option>
                  <option value={DRIVER_STATUS.INACTIVE}>Inactive</option>
                </select>
                <select name="assignedTruckId" value={form.assignedTruckId} onChange={handleChange} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm md:col-span-2">
                  <option value="">Unassigned truck</option>
                  {trucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.vehicleNo}</option>)}
                </select>
                <div className="md:col-span-2 flex gap-2 pt-2">
                  <button type="submit" className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white">{editId ? 'Update Driver' : 'Add Driver'}</button>
                  <button type="button" onClick={() => { reset(); setShowModal(false) }} className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        <CredentialCard
          isOpen={credModal.isOpen}
          name={credModal.name}
          role="DRIVER"
          username={credModal.username}
          password={credModal.password}
          extraInfo={credModal.cnic ? `CNIC: ${credModal.cnic} | Status: ${credModal.extraInfo}` : credModal.extraInfo}
          onClose={() => setCredModal((prev) => ({ ...prev, isOpen: false }))}
        />
      </SectionCard>
    </div>
  )
}
