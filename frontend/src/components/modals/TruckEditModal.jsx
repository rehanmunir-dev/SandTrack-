import { useState, useEffect } from 'react'

export default function TruckEditModal({ truck, onClose, onSave, onDelete, trucks = [], drivers = [] }) {
  const [form, setForm] = useState({
    vehicleNo: '',
    ownershipType: 'own',
    assignedDriverId: '',
  })

  useEffect(() => {
    if (truck) {
      setForm({
        vehicleNo: truck.vehicleNo || '',
        ownershipType: truck.ownershipType || 'own',
        assignedDriverId: truck.assignedDriverId || truck.driverProfileId || '',
      })
    }
  }, [truck])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.vehicleNo.trim()) {
      alert('Vehicle number is required')
      return
    }
    onSave({
      vehicleNo: form.vehicleNo.trim(),
      ownershipType: form.ownershipType,
      assignedDriverId: form.assignedDriverId || null,
    })
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this truck?')) {
      onDelete()
    }
  }

  if (!truck) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-md rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl">
        <div className="flex items-center justify-between border-b border-outline-variant/20 p-4">
          <div>
            <h4 className="font-headline text-lg font-bold">Edit Truck</h4>
            <p className="text-xs text-on-surface-variant">{truck.vehicleNo}</p>
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
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Vehicle Number</label>
            <input
              required
              value={form.vehicleNo}
              onChange={(e) => setForm((prev) => ({ ...prev, vehicleNo: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="Vehicle number"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Ownership Type</label>
            <select
              value={form.ownershipType}
              onChange={(e) => setForm((prev) => ({ ...prev, ownershipType: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="own">Own Truck</option>
              <option value="other">Other Truck</option>
              <option value="guest">Guest Truck</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Assigned Driver</label>
            <select
              value={form.assignedDriverId}
              onChange={(e) => setForm((prev) => ({ ...prev, assignedDriverId: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Unassigned</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.fullName || driver.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
            >
              Save Truck
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
            Delete Truck
          </button>
        </form>
      </div>
    </div>
  )
}
