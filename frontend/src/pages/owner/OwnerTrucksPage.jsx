import { useEffect, useMemo, useState } from 'react'
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

  function handleSaveTruck(updatedData) {
    if (!selectedTruckForEdit) {
      return
    }

    updateTruck(selectedTruckForEdit.id, updatedData)
    setIsTruckEditModalOpen(false)
    setSelectedTruckForEdit(null)
    setNotice('Truck details updated successfully.')
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

  function handleSaveDriverProfile(updatedData) {
    if (!selectedDriverForEdit) {
      return
    }

    updateDriverProfile(selectedDriverForEdit.id, updatedData)
    setIsDriverEditModalOpen(false)
    setSelectedDriverForEdit(null)
    setNotice('Driver profile updated successfully.')
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
      <section className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-headline text-lg font-bold">Trucks and Drivers Management</h4>
            <p className="text-xs text-on-surface-variant">Manage separate truck fleet and driver profiles. One driver can be assigned to multiple trucks.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={openCreateTruckModal}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-white hover:bg-secondary/90 transition-colors"
            >
              Add Truck
            </button>
            <button
              type="button"
              onClick={openCreateDriverModal}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
            >
              Add Driver
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 rounded-xl bg-surface-container-low p-4 md:grid-cols-4">
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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* TRUCKS TABLE */}
        <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant/20 p-4">
            <h4 className="font-headline text-lg font-bold">Trucks Fleet</h4>
            <p className="text-xs text-on-surface-variant">{filteredTrucks.length} truck(s) found</p>
          </div>

          {filteredTrucks.length === 0 ? (
            <div className="p-4"><EmptyState title="No trucks found" subtitle="Change filters and try again." /></div>
          ) : (
            <div className="app-table-scroll">
              <table className="app-table text-left text-sm">
                <thead className="bg-surface-container-low text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Vehicle</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Type</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Drivers</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredTrucks.map((truck) => {
                    const assignedDrivers = getDriversForTruck(truck.id)
                    return (
                      <tr key={truck.id} className="transition-colors hover:bg-surface-container-low">
                        <td className="px-4 py-3 font-headline font-bold text-primary">{truck.vehicleNo}</td>
                        <td className="px-4 py-3 text-xs font-semibold uppercase text-on-surface-variant">{truck.ownershipType}</td>
                        <td className="px-4 py-3">
                          {assignedDrivers.length > 0 ? (
                            <div className="space-y-1">
                              {assignedDrivers.map((driver) => (
                                <p key={driver.id} className="text-xs text-on-surface">
                                  • {driver.fullName}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-on-surface-variant">No drivers</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openTruckEditModal(truck)}
                            className="rounded border border-outline-variant px-2 py-1 text-[11px] font-semibold hover:bg-surface-container-low transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* DRIVERS TABLE */}
        <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant/20 p-4">
            <h4 className="font-headline text-lg font-bold">Driver Profiles</h4>
            <p className="text-xs text-on-surface-variant">{filteredDrivers.length} driver(s) found</p>
          </div>

          {filteredDrivers.length === 0 ? (
            <div className="p-4"><EmptyState title="No drivers found" subtitle="Create a new driver profile." /></div>
          ) : (
            <div className="app-table-scroll">
              <table className="app-table text-left text-sm">
                <thead className="bg-surface-container-low text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Name</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Phone</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Assigned Truck</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredDrivers.map((driver) => {
                    const assignedTruck = trucks.find((t) => t.id === driver.assignedTruckId)
                    return (
                      <tr key={driver.id} className="transition-colors hover:bg-surface-container-low">
                        <td className="px-4 py-3 font-semibold text-on-surface">{driver.fullName}</td>
                        <td className="px-4 py-3 text-sm text-on-surface-variant">{driver.phone}</td>
                        <td className="px-4 py-3 text-sm">
                          {assignedTruck ? (
                            <span className="inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                              {assignedTruck.vehicleNo}
                            </span>
                          ) : (
                            <span className="text-xs text-on-surface-variant">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openDriverEditModal(driver)}
                            className="rounded border border-outline-variant px-2 py-1 text-[11px] font-semibold hover:bg-surface-container-low transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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

      {notice ? <p className="text-xs font-medium text-primary">{notice}</p> : null}
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
