import { useState } from 'react'

export default function TruckCreateModal({ trucks = [], onClose, onSave }) {
  const [form, setForm] = useState({
    vehicleNo: '',
    ownershipType: 'own',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.vehicleNo.trim()) {
      alert('Vehicle number is required')
      return
    }
    onSave({
      vehicleNo: form.vehicleNo.trim(),
      ownershipType: form.ownershipType,
    })
    setForm({
      vehicleNo: '',
      ownershipType: 'own',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-md rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl">
        <div className="flex items-center justify-between border-b border-outline-variant/20 p-4">
          <div>
            <h4 className="font-headline text-lg font-bold">Add New Truck</h4>
            <p className="text-xs text-on-surface-variant">Register a new truck in your fleet</p>
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
              placeholder="e.g., ABC-123"
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

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
            >
              Add Truck
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
