import { useMemo, useState } from 'react'
import DateRangeFilterButton from '../../components/common/DateRangeFilterButton'
import SearchBar from '../../components/owner/SearchBar'
import EmptyState from '../../components/owner/EmptyState'
import TruckEditModal from '../../components/modals/TruckEditModal'
import DriverEditModal from '../../components/modals/DriverEditModal'
import TruckCreateModal from '../../components/modals/TruckCreateModal'
import CredentialCard from '../../components/CredentialCard'
import { useOwnerData } from '../../context/owner/OwnerContext'
import { isInDateRange } from '../../utils/dateRange'

export default function OwnerTrucksPage() {
  const { trucks, driverProfiles, addDriverProfile, addTruck, updateTruck, deleteTruck, updateDriverProfile, deleteDriverProfile } = useOwnerData()
  const [search, setSearch] = useState('')
  const [ownershipFilter, setOwnershipFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [notice, setNotice] = useState('')
  
  // Modal states
  const [isCreateDriverModalOpen, setIsCreateDriverModalOpen] = useState(false)
  const [isCreateTruckModalOpen, setIsCreateTruckModalOpen] = useState(false)
  const [isTruckEditModalOpen, setIsTruckEditModalOpen] = useState(false)
  const [isDriverEditModalOpen, setIsDriverEditModalOpen] = useState(false)
  const [selectedTruckForEdit, setSelectedTruckForEdit] = useState(null)
  const [selectedDriverForEdit, setSelectedDriverForEdit] = useState(null)
  const [credModal, setCredModal] = useState({
    isOpen: false,
    name: '',
    cnic: '',
    username: '',
    password: '',
    extraInfo: '',
  })
  
  const [driverForm, setDriverForm] = useState({
    fullName: '',
    phone: '',
    cnic: '',
    licenseNo: '',
    assignedTruckId: trucks[0]?.id || '',
    notes: '',
  })


  const filteredTrucks = useMemo(() => {
    const q = search.trim().toLowerCase()
    return trucks.filter((truck) => {
      if (!isInDateRange(truck.lastSeenAt || truck.createdAt, dateRange)) {
        return false
      }
      if (q && !(`${truck.vehicleNo} ${truck.driverName || ''}`.toLowerCase().includes(q))) {
        return false
      }
      if (ownershipFilter !== 'all' && truck.ownershipType !== ownershipFilter) {
        return false
      }
      return true
    })
  }, [trucks, search, ownershipFilter, dateRange])

  // Get drivers for a specific truck
  const getDriversForTruck = (truckId) => {
    return driverProfiles.filter((driver) => String(driver.assignedTruckId) === String(truckId))
  }

  const filteredDrivers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return driverProfiles
    return driverProfiles.filter((driver) =>
      `${driver.fullName} ${driver.phone}`.toLowerCase().includes(q)
    )
  }, [driverProfiles, search])

  const linkedTruckCount = useMemo(
    () => trucks.filter((truck) => driverProfiles.some((driver) => String(driver.assignedTruckId) === String(truck.id))).length,
    [trucks, driverProfiles]
  )

  const unassignedDriverCount = useMemo(
    () => driverProfiles.filter((driver) => !driver.assignedTruckId).length,
    [driverProfiles]
  )

  const ownTruckCount = useMemo(
    () => trucks.filter((truck) => truck.ownershipType === 'own').length,
    [trucks]
  )


  function openCreateDriverModal() {
    setDriverForm((prev) => ({
      ...prev,
      assignedTruckId: trucks[0]?.id || '',
    }))
    setIsCreateDriverModalOpen(true)
  }

  function openCreateTruckModal() {
    setIsCreateTruckModalOpen(true)
  }

  function openTruckEditModal(truck) {
    setSelectedTruckForEdit(truck)
    setIsTruckEditModalOpen(true)
  }

  function openDriverEditModal(driver) {
    setSelectedDriverForEdit(driver)
    setIsDriverEditModalOpen(true)
  }

  async function handleCreateDriverProfile(event) {
    event.preventDefault()

    if (!driverForm.fullName.trim() || !driverForm.phone.trim() || !driverForm.cnic.trim() || !driverForm.assignedTruckId) {
      setNotice('Driver name, phone, CNIC, and truck are required.')
      return
    }

    const selectedTruckForDriver = trucks.find((truck) => truck.id === driverForm.assignedTruckId)
    try {
      const created = await addDriverProfile({
        ...driverForm,
        fullName: driverForm.fullName.trim(),
        phone: driverForm.phone.trim(),
        cnic: driverForm.cnic.trim(),
        licenseNo: driverForm.licenseNo.trim(),
        notes: driverForm.notes.trim(),
        assignedTerminalId: selectedTruckForDriver?.assignedTerminalId || null,
      })

      if (created?.loginCredentials) {
        setCredModal({
          isOpen: true,
          name: created.fullName || driverForm.fullName,
          cnic: created.cnic || driverForm.cnic,
          username: created.loginCredentials.username,
          password: created.loginCredentials.plainPassword,
          extraInfo: 'Pending Admin Approval',
        })
      }

      setDriverForm({
        fullName: '',
        phone: '',
        cnic: '',
        licenseNo: '',
        assignedTruckId: trucks[0]?.id || '',
        notes: '',
      })
      setIsCreateDriverModalOpen(false)
      setNotice('Driver profile created successfully and sent to approvals.')
    } catch (error) {
      setNotice(error.response?.data?.message || 'Driver profile could not be created.')
    }
  }

  async function handleSaveTruck(updatedData) {
    if (!selectedTruckForEdit) {
      return
    }

    try {
      await updateTruck(selectedTruckForEdit.id, updatedData)
      setIsTruckEditModalOpen(false)
      setSelectedTruckForEdit(null)
      setNotice('Truck details updated successfully.')
    } catch (error) {
      setNotice(error.response?.data?.message || 'Truck details could not be updated.')
    }
  }

  async function handleCreateTruck(truckData) {
    try {
      await addTruck(truckData)
      setIsCreateTruckModalOpen(false)
      setNotice('Truck created successfully and sent to approvals.')
    } catch (error) {
      setNotice(error.response?.data?.message || 'Truck could not be created.')
    }
  }

  async function handleSaveDriverProfile(updatedData) {
    if (!selectedDriverForEdit) {
      return
    }

    try {
      await updateDriverProfile(selectedDriverForEdit.id, updatedData)
      setIsDriverEditModalOpen(false)
      setSelectedDriverForEdit(null)
      setNotice('Driver profile updated successfully.')
    } catch (error) {
      setNotice(error.response?.data?.message || 'Driver profile could not be updated.')
    }
  }

  function handleDeleteTruck() {
    if (!selectedTruckForEdit || !window.confirm('Delete this truck?')) {
      return
    }

    deleteTruck(selectedTruckForEdit.id)
    setIsTruckEditModalOpen(false)
    setSelectedTruckForEdit(null)
    setNotice('Truck deleted successfully.')
  }

  function handleDeleteDriverProfile() {
    if (!selectedDriverForEdit || !window.confirm('Delete this driver profile?')) {
      return
    }

    deleteDriverProfile(selectedDriverForEdit.id)
    setIsDriverEditModalOpen(false)
    setSelectedDriverForEdit(null)
    setNotice('Driver profile deleted successfully.')
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-gradient-to-br from-primary/10 via-surface-container-lowest to-secondary/10 shadow-sm">
        <div className="grid gap-4 p-5 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              Fleet Control
            </div>
            <div>
              <h4 className="font-headline text-2xl font-black text-on-surface">Trucks and Drivers Management</h4>
              <p className="mt-1 max-w-2xl text-sm font-medium text-on-surface-variant">
                Manage separate truck fleet and driver profiles. One driver can be assigned to multiple trucks.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openCreateTruckModal}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-secondary/90"
              >
                Add Truck
              </button>
              <button
                type="button"
                onClick={openCreateDriverModal}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90"
              >
                Add Driver
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ['Total Trucks', trucks.length],
              ['Total Drivers', driverProfiles.length],
              ['Linked Trucks', linkedTruckCount],
              ['Unassigned Drivers', unassignedDriverCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
                <p className="mt-2 font-headline text-2xl font-black text-primary">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-4 shadow-sm md:grid-cols-4">
        <div className="md:col-span-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by vehicle or driver" />
        </div>
        <select value={ownershipFilter} onChange={(e) => setOwnershipFilter(e.target.value)} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none">
          <option value="all">All Trucks</option>
          <option value="own">Own Truck</option>
          <option value="other">Other Truck</option>
          <option value="guest">Guest Truck</option>
        </select>
        <DateRangeFilterButton value={dateRange} onChange={setDateRange} label="Custom Date" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h4 className="font-headline text-xl font-black text-on-surface">Trucks Fleet</h4>
              <p className="text-xs font-medium text-on-surface-variant">{filteredTrucks.length} truck(s) found</p>
            </div>
            <div className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-black text-secondary">
              {ownTruckCount} Own Truck(s)
            </div>
          </div>

          {filteredTrucks.length === 0 ? (
            <div className="p-4"><EmptyState title="No trucks found" subtitle="Change filters and try again." /></div>
          ) : (
            <div className="grid gap-3">
              {filteredTrucks.map((truck) => {
                const assignedDrivers = getDriversForTruck(truck.id)
                return (
                  <article
                    key={truck.id}
                    className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Vehicle</p>
                        <h5 className="mt-1 font-headline text-xl font-black text-primary">{truck.vehicleNo}</h5>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary">
                          {truck.ownershipType}
                        </span>
                        <button
                          type="button"
                          onClick={() => openTruckEditModal(truck)}
                          className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs font-bold text-on-surface transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">Assigned Drivers</p>
                        <span className="rounded-full bg-surface-container px-2 py-1 text-[10px] font-black text-on-surface-variant">
                          {assignedDrivers.length}
                        </span>
                      </div>
                      {assignedDrivers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {assignedDrivers.map((driver) => (
                            <span key={driver.id} className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                              {driver.fullName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-on-surface-variant">No drivers</p>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h4 className="font-headline text-xl font-black text-on-surface">Driver Profiles</h4>
              <p className="text-xs font-medium text-on-surface-variant">{filteredDrivers.length} driver(s) found</p>
            </div>
            <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
              {driverProfiles.length - unassignedDriverCount} Assigned
            </div>
          </div>

          {filteredDrivers.length === 0 ? (
            <div className="p-4"><EmptyState title="No drivers found" subtitle="Create a new driver profile." /></div>
          ) : (
            <div className="grid gap-3">
              {filteredDrivers.map((driver) => {
                const assignedTruck = trucks.find((t) => t.id === driver.assignedTruckId)
                return (
                  <article
                    key={driver.id}
                    className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 transition-all hover:-translate-y-0.5 hover:border-secondary/25 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Driver</p>
                        <h5 className="mt-1 truncate font-headline text-lg font-black text-on-surface">{driver.fullName}</h5>
                        <p className="mt-1 text-sm font-semibold text-on-surface-variant">{driver.phone}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openDriverEditModal(driver)}
                        className="shrink-0 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs font-bold text-on-surface transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">Assigned Truck</p>
                      {assignedTruck ? (
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                          {assignedTruck.vehicleNo}
                        </span>
                      ) : (
                        <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">Unassigned</span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </section>

      {/* MODALS */}
      {isCreateTruckModalOpen && (
        <div>
          <TruckCreateModal
            trucks={trucks}
            onClose={() => setIsCreateTruckModalOpen(false)}
            onSave={handleCreateTruck}
          />
        </div>
      )}

      {isTruckEditModalOpen && (
        <div>
          <TruckEditModal
            truck={selectedTruckForEdit}
            trucks={trucks}
            drivers={driverProfiles}
            onClose={() => {
              setIsTruckEditModalOpen(false)
              setSelectedTruckForEdit(null)
            }}
            onSave={handleSaveTruck}
            onDelete={handleDeleteTruck}
          />
          {selectedTruckForEdit && (
            <div className="fixed inset-0 z-40" onClick={() => setIsTruckEditModalOpen(false)} />
          )}
        </div>
      )}

      {isDriverEditModalOpen && (
        <div>
          <DriverEditModal
            driver={selectedDriverForEdit}
            trucks={trucks}
            onClose={() => {
              setIsDriverEditModalOpen(false)
              setSelectedDriverForEdit(null)
            }}
            onSave={handleSaveDriverProfile}
            onDelete={handleDeleteDriverProfile}
          />
          {selectedDriverForEdit && (
            <div className="fixed inset-0 z-40" onClick={() => setIsDriverEditModalOpen(false)} />
          )}
        </div>
      )}

      {isCreateDriverModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 p-4">
              <div>
                <h4 className="font-headline text-lg font-bold">Create Driver Profile</h4>
                <p className="text-xs text-on-surface-variant">Assign a driver to a truck. A driver can be assigned to multiple trucks.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateDriverModalOpen(false)}
                className="rounded border border-outline-variant px-3 py-1 text-xs font-semibold hover:bg-surface-container-low transition-colors"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateDriverProfile} className="space-y-3 p-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Full Name</label>
                <input
                  required
                  value={driverForm.fullName}
                  onChange={(e) => setDriverForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Driver full name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Phone</label>
                <input
                  required
                  value={driverForm.phone}
                  onChange={(e) => setDriverForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Phone"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">CNIC</label>
                <input
                  required
                  value={driverForm.cnic}
                  onChange={(e) => setDriverForm((prev) => ({ ...prev, cnic: e.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="CNIC"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">License Number</label>
                <input
                  value={driverForm.licenseNo}
                  onChange={(e) => setDriverForm((prev) => ({ ...prev, licenseNo: e.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="License no"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Assign Truck</label>
                <select
                  required
                  value={driverForm.assignedTruckId}
                  onChange={(e) => setDriverForm((prev) => ({ ...prev, assignedTruckId: e.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Select a truck</option>
                  {trucks.map((truck) => (
                    <option key={truck.id} value={truck.id}>{truck.vehicleNo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Notes</label>
                <textarea
                  value={driverForm.notes}
                  onChange={(e) => setDriverForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
                  placeholder="Notes"
                  rows="3"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
                  Create Driver
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateDriverModalOpen(false)}
                  className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {notice ? (
        <p className="rounded-xl border border-primary/15 bg-primary/10 px-4 py-3 text-xs font-bold text-primary shadow-sm">
          {notice}
        </p>
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
    </div>
  )
}
