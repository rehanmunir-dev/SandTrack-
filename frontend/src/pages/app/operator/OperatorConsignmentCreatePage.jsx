import { useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
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
])

export default function OperatorConsignmentCreatePage() {
  const { drivers, trucks, consignments, createConsignment } = useRoleSystem()
  const busyDriverIds = useMemo(
    () => new Set(consignments.filter((item) => BUSY_CONSIGNMENT_STATUSES.has(String(item.status).toUpperCase())).map((item) => String(item.driverId))),
    [consignments]
  )
  const busyTruckIds = useMemo(
    () => new Set(consignments.filter((item) => BUSY_CONSIGNMENT_STATUSES.has(String(item.status).toUpperCase())).map((item) => String(item.truckId))),
    [consignments]
  )
  const assignableDrivers = useMemo(
    () => drivers.filter((driver) => driver.approvalStatus === 'approved' && driver.status === DRIVER_STATUS.ACTIVE && !busyDriverIds.has(String(driver.id))),
    [drivers, busyDriverIds]
  )
  const assignableTrucks = useMemo(
    () => trucks.filter((truck) => truck.approvalStatus === 'approved' && truck.status === TRUCK_STATUS.ACTIVE && !busyTruckIds.has(String(truck.id))),
    [trucks, busyTruckIds]
  )
  const [form, setForm] = useState({
    driverId: '',
    truckId: '',
    netWeight: '',
    destination: TERMINALS[1],
    originTerminal: TERMINALS[0],
    notes: '',
    price: '',
    discount: '',
  })
  const [created, setCreated] = useState(null)
  const [error, setError] = useState('')

  const selectedDriver = useMemo(() => assignableDrivers.find((driver) => String(driver.id) === String(form.driverId)) || null, [assignableDrivers, form.driverId])
  const selectedTruck = useMemo(() => assignableTrucks.find((truck) => String(truck.id) === String(form.truckId)) || null, [assignableTrucks, form.truckId])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      const driverSnapshot = selectedDriver
      const truckSnapshot = selectedTruck
      const result = await createConsignment(form)
      setCreated({
        ...result,
        driverName: driverSnapshot?.name || 'N/A',
        driverPhone: driverSnapshot?.phone || 'N/A',
        truckVehicleNo: truckSnapshot?.vehicleNo || 'N/A',
        truckType: truckSnapshot?.type || 'N/A',
        materialType: form.notes || 'Sand Load',
        ...form,
      })
      setForm({ driverId: '', truckId: '', netWeight: '', destination: TERMINALS[1], originTerminal: TERMINALS[0], notes: '', price: '', discount: '' })
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Create Consignment" subtitle="Operator creates dispatch and generates a unique QR code.">
        <div className="mb-4 rounded-xl border border-primary/15 bg-primary/10 p-4 text-sm font-medium text-primary">
          Only CEO-approved, active, and currently free drivers/trucks are shown here. If a driver or truck is missing, check approval, active status, or whether it already has an open consignment.
        </div>
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-3">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Driver</label>
            <select required name="driverId" value={form.driverId} onChange={handleChange} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
              <option value="">Select driver</option>
              {assignableDrivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
            </select>
            {!assignableDrivers.length ? <p className="mt-2 text-xs font-bold text-secondary">No available drivers right now. Approve one or wait until an active trip closes.</p> : null}
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Truck</label>
            <select required name="truckId" value={form.truckId} onChange={handleChange} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
              <option value="">Select truck</option>
              {assignableTrucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.vehicleNo}</option>)}
            </select>
            {!assignableTrucks.length ? <p className="mt-2 text-xs font-bold text-secondary">No available trucks right now. Approve one or wait until an active trip closes.</p> : null}
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Net Weight (Tons)</label>
            <input required name="netWeight" type="number" step="0.1" value={form.netWeight} onChange={handleChange} placeholder="Enter net weight" className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Price (PKR)</label>
              <input required name="price" type="number" value={form.price} onChange={handleChange} placeholder="Price" className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Discount (PKR)</label>
              <input name="discount" type="number" value={form.discount} onChange={handleChange} placeholder="Discount" className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Destination</label>
            <select required name="destination" value={form.destination} onChange={handleChange} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
              {TERMINALS.map((terminal) => <option key={terminal} value={terminal}>{terminal}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Origin Terminal</label>
            <select required name="originTerminal" value={form.originTerminal} onChange={handleChange} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
              {TERMINALS.map((terminal) => <option key={terminal} value={terminal}>{terminal}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Notes (Optional)</label>
            <input name="notes" value={form.notes} onChange={handleChange} placeholder="Enter optional notes" className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="w-full rounded-xl bg-primary px-4 py-4 text-sm font-bold text-white shadow-sm">Generate QR & Create</button>
        </form>
        {error ? <p className="mt-3 rounded-lg border border-error bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p> : null}
      </SectionCard>

      {created ? (
        <SectionCard title="Created Consignment" subtitle="Share, print, or scan this secure QR pass">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Driver QR Pass</p>
              <p className="text-sm text-on-surface-variant">Send the pass to WhatsApp or print a high-quality gate copy.</p>
            </div>
            <OperatorQrPassActions pass={created} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4 text-center lg:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">QR Code</p>
              <div className="mx-auto mt-4 inline-flex rounded-2xl bg-white p-3 shadow-sm">
                <QRCodeSVG value={`${window.location.origin}/public/qr-pass/${created.qrCode}`} size={220} level="H" includeMargin />
              </div>
              <p className="mt-3 break-all text-[11px] font-semibold text-on-surface-variant">{created.qrCode}</p>
              <p className="mt-2 text-xs text-on-surface-variant">Consignment: {created.consignmentId}</p>
            </div>
            <div className="lg:col-span-2 rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4 text-sm">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Order Information</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <p><strong>Driver:</strong> {created.driverName || 'N/A'}</p>
                <p><strong>Driver Number:</strong> {created.driverPhone || 'N/A'}</p>
                <p><strong>Truck:</strong> {created.truckVehicleNo || 'N/A'}</p>
                <p><strong>Net Weight:</strong> {created.netWeight || 'N/A'}</p>
                <p><strong>Destination:</strong> {created.destination || 'N/A'}</p>
                <p><strong>Origin Terminal:</strong> {created.originTerminal || 'N/A'}</p>
                <p><strong>Price:</strong> PKR {Number(created.price || 0).toLocaleString()}</p>
                <p><strong>Discount:</strong> PKR {Number(created.discount || 0).toLocaleString()}</p>
                <p><strong>Net Payable:</strong> PKR {Number((created.price || 0) - (created.discount || 0)).toLocaleString()}</p>
                <p className="md:col-span-2"><strong>Notes:</strong> {created.notes || 'N/A'}</p>
                <p><strong>Consignment ID:</strong> {created.consignmentId}</p>
                <p><strong>Status:</strong> <StatusBadge status={created.status} /></p>
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}
