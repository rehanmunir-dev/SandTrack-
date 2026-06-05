import { useState, useEffect } from 'react'

export default function DriverEditModal({ driver, trucks = [], onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    cnic: '',
    licenseNo: '',
    assignedTruckId: '',
    notes: '',
  })

  useEffect(() => {
    if (driver) {
      setForm({
        fullName: driver.fullName || '',
        phone: driver.phone || '',
        cnic: driver.cnic || '',
        licenseNo: driver.licenseNo || '',
        assignedTruckId: driver.assignedTruckId || '',
        notes: driver.notes || '',
      })
    }
  }, [driver])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.phone.trim()) {
      alert('Driver name and phone are required')
      return
    }
    onSave({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      cnic: form.cnic.trim(),
      licenseNo: form.licenseNo.trim(),
      assignedTruckId: form.assignedTruckId || null,
      notes: form.notes.trim(),
    })
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this driver profile?')) {
      onDelete()
    }
  }

  if (!driver) return null

  const assignedTruck = trucks.find((t) => t.id === form.assignedTruckId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-md rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl">
        <div className="flex items-center justify-between border-b border-outline-variant/20 p-4">
          <div>
            <h4 className="font-headline text-lg font-bold">Edit Driver</h4>
            <p className="text-xs text-on-surface-variant">{driver.fullName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-outline-variant px-3 py-1 text-xs font-semibold hover:bg-surface-container-low transition-colors"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Full Name</label>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="Driver full name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Phone</label>
            <input
              required
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="Phone"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">CNIC</label>
            <input
              value={form.cnic}
              onChange={(e) => setForm((prev) => ({ ...prev, cnic: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="CNIC"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">License Number</label>
            <input
              value={form.licenseNo}
              onChange={(e) => setForm((prev) => ({ ...prev, licenseNo: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="License number"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Assigned Truck</label>
            <select
              value={form.assignedTruckId}
              onChange={(e) => setForm((prev) => ({ ...prev, assignedTruckId: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Unassigned</option>
              {trucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {truck.vehicleNo}
                </option>
              ))}
            </select>
            {assignedTruck && (
              <p className="text-xs text-primary mt-1">Currently assigned to: {assignedTruck.vehicleNo}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
              placeholder="Notes"
              rows="3"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
            >
              Save Driver
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            className="w-full rounded-lg border border-error px-3 py-2 text-sm font-bold text-error hover:bg-error/5 transition-colors"
          >
            Delete Driver
          </button>
        </form>
      </div>
    </div>
  )
}
