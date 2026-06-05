import React, { useState, useMemo, useEffect } from 'react'
import SectionCard from '../../components/common/SectionCard'
import { useRoleSystem } from '../../context/roleSystem/RoleSystemContext'
import StatusBadge from '../../components/StatusBadge'
import ConfirmModal from '../../components/ConfirmModal'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../components/ToastProvider'
import { formatDate } from '../../utils/formatDate'

export default function OwnerApprovalsPage() {
  const {
    drivers,
    trucks,
    pendingApprovals,
    approveDriver,
    rejectDriver,
    approveTruck,
    rejectTruck,
    approveAllPendingDrivers,
    approveAllPendingTrucks,
  } = useRoleSystem()

  const toast = useToast()

  // State
  const [activeTab, setActiveTab] = useState('drivers') // 'drivers' | 'trucks'
  const [isAccordionOpen, setIsAccordionOpen] = useState(false)

  // Confirm/Reject modals state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    confirmVariant: 'primary',
    type: '', // 'approve-driver' | 'reject-driver' | 'approve-truck' | 'reject-truck'
    targetId: null,
    showInput: false,
  })

  // Set Document Title
  useEffect(() => {
    document.title = 'SandTrack — Owner Approvals'
  }, [])

  // Approved subsets
  const approvedDrivers = useMemo(() => 
    drivers.filter(d => d.approvalStatus === 'approved'), 
    [drivers]
  )

  const approvedTrucks = useMemo(() => 
    trucks.filter(t => t.approvalStatus === 'approved'), 
    [trucks]
  )

  // Trigger Action handlers
  const handleOpenConfirm = (type, targetId, extra = {}) => {
    if (type === 'approve-driver') {
      const driver = drivers.find(d => d.id === targetId)
      setConfirmModal({
        isOpen: true,
        title: 'Approve Driver Registration',
        message: `Are you sure you want to approve driver ${driver?.name || 'N/A'}? This will authorize them to lead dispatches.`,
        confirmLabel: 'Approve ✅',
        confirmVariant: 'success',
        type,
        targetId,
        showInput: false,
      })
    } else if (type === 'reject-driver') {
      const driver = drivers.find(d => d.id === targetId)
      setConfirmModal({
        isOpen: true,
        title: 'Reject Driver Registration',
        message: `Please specify the rejection reason for driver ${driver?.name || 'N/A'}. This feedback will be sent to terminal operators.`,
        confirmLabel: 'Reject ❌',
        confirmVariant: 'danger',
        type,
        targetId,
        showInput: true,
      })
    } else if (type === 'approve-truck') {
      const truck = trucks.find(t => t.id === targetId)
      setConfirmModal({
        isOpen: true,
        title: 'Approve Truck Registration',
        message: `Authorize vehicle ${truck?.vehicleNo || 'N/A'} for logistics dispatches?`,
        confirmLabel: 'Approve ✅',
        confirmVariant: 'success',
        type,
        targetId,
        showInput: false,
      })
    } else if (type === 'reject-truck') {
      const truck = trucks.find(t => t.id === targetId)
      setConfirmModal({
        isOpen: true,
        title: 'Reject Truck Registration',
        message: `Specify the rejection reason for truck ${truck?.vehicleNo || 'N/A'}:`,
        confirmLabel: 'Reject ❌',
        confirmVariant: 'danger',
        type,
        targetId,
        showInput: true,
      })
    }
  }

  const handleExecuteAction = async (reason) => {
    const { type, targetId } = confirmModal
    setConfirmModal(prev => ({ ...prev, isOpen: false }))

    if (type === 'approve-driver') {
      await approveDriver(targetId)
      toast.success('Driver registered successfully')
    } else if (type === 'reject-driver') {
      await rejectDriver(targetId)
      toast.success(`Driver registration rejected (Reason: ${reason || 'N/A'})`)
    } else if (type === 'approve-truck') {
      await approveTruck(targetId)
      toast.success('Truck registered successfully')
    } else if (type === 'reject-truck') {
      await rejectTruck(targetId)
      toast.success(`Truck registration rejected (Reason: ${reason || 'N/A'})`)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Row */}
      <SectionCard 
        title="Owner Approvals Portal" 
        subtitle="Manage secure audits and clearance for staff vehicles and driver profiles."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="app-kpi-card flex flex-col justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Pending Drivers</p>
            <p className="font-headline text-3xl font-black text-primary mt-2">{pendingApprovals.drivers.length}</p>
          </div>
          <div className="app-kpi-card flex flex-col justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Pending Trucks</p>
            <p className="font-headline text-3xl font-black text-primary mt-2">{pendingApprovals.trucks.length}</p>
          </div>
          
          <button
            onClick={() => {
              approveAllPendingDrivers()
              toast.success('All pending driver profiles successfully approved!')
            }}
            disabled={pendingApprovals.drivers.length === 0}
            className="app-btn-primary flex items-center justify-center gap-2 bg-primary text-on-primary font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">done_all</span>
            Approve All Drivers
          </button>

          <button
            onClick={() => {
              approveAllPendingTrucks()
              toast.success('All pending truck registrations successfully approved!')
            }}
            disabled={pendingApprovals.trucks.length === 0}
            className="app-btn-primary flex items-center justify-center gap-2 bg-primary text-on-primary font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">done_all</span>
            Approve All Trucks
          </button>
        </div>
      </SectionCard>

      {/* Tabs Layout */}
      <div className="flex border-b border-outline-variant/20">
        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-6 py-3 font-headline text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'drivers' 
              ? 'border-primary text-primary bg-primary/5' 
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-lg">person_search</span>
          Drivers Pending ({pendingApprovals.drivers.length})
        </button>
        <button
          onClick={() => setActiveTab('trucks')}
          className={`px-6 py-3 font-headline text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'trucks' 
              ? 'border-primary text-primary bg-primary/5' 
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-lg">local_shipping</span>
          Trucks Pending ({pendingApprovals.trucks.length})
        </button>
      </div>

      {/* Main Lists */}
      {activeTab === 'drivers' ? (
        <div className="space-y-4">
          {pendingApprovals.drivers.length === 0 ? (
            <EmptyState 
              icon="sentiment_satisfied" 
              title="All Caught Up!" 
              message="No drivers are currently pending approval." 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApprovals.drivers.map((driver) => (
                <div key={driver.id} className="app-card border-outline-variant/15 flex flex-col sm:flex-row gap-4 justify-between bg-surface-container-low">
                  <div className="flex gap-4">
                    {/* Face Photo Thumbnail */}
                    <div className="w-16 h-16 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center overflow-hidden flex-shrink-0">
                      <span className="material-symbols-outlined text-4xl text-outline/50">account_circle</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-on-background">{driver.name}</h4>
                      <p className="text-xs text-on-surface-variant font-mono">CNIC: {driver.cnic || 'N/A'}</p>
                      <p className="text-xs text-on-surface-variant">License: {driver.licenseNumber || 'PRO-93282-C'}</p>
                      <p className="text-[10px] text-primary/80 font-semibold">
                        Registered by {driver.addedBy || 'Operator'} on {formatDate(driver.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    <button
                      onClick={() => handleOpenConfirm('approve-driver', driver.id)}
                      className="app-btn-primary px-3 py-1.5 text-xs bg-tertiary text-white flex items-center gap-1"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleOpenConfirm('reject-driver', driver.id)}
                      className="rounded-xl border border-error bg-error-container/10 px-3 py-1.5 text-xs font-semibold text-error hover:bg-error-container/20 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {pendingApprovals.trucks.length === 0 ? (
            <EmptyState 
              icon="sentiment_satisfied" 
              title="All Caught Up!" 
              message="No trucks are currently pending approval." 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApprovals.trucks.map((truck) => (
                <div key={truck.id} className="app-card border-outline-variant/15 flex flex-col sm:flex-row gap-4 justify-between bg-surface-container-low">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-on-background font-mono text-base">{truck.vehicleNo}</h4>
                      <span className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {truck.type}
                      </span>
                      <span className="bg-secondary-container/20 text-secondary border border-secondary-container/30 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {truck.wheelCount || 6} wheels
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant font-medium">
                      Registered by {truck.addedBy || 'Operator'} on {formatDate(truck.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    <button
                      onClick={() => handleOpenConfirm('approve-truck', truck.id)}
                      className="app-btn-primary px-3 py-1.5 text-xs bg-tertiary text-white flex items-center gap-1"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleOpenConfirm('reject-truck', truck.id)}
                      className="rounded-xl border border-error bg-error-container/10 px-3 py-1.5 text-xs font-semibold text-error hover:bg-error-container/20 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* APPROVED SECTION (COLLAPSIBLE ACCORDION) */}
      <div className="app-card border border-outline-variant/15 mt-6">
        <button
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className="w-full flex items-center justify-between font-headline text-base font-bold text-on-background py-2"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">check_circle</span>
            View Approved Archives ({activeTab === 'drivers' ? approvedDrivers.length : approvedTrucks.length} Approved)
          </span>
          <span className="material-symbols-outlined transform transition-transform duration-200">
            {isAccordionOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {isAccordionOpen && (
          <div className="mt-4 border-t border-outline-variant/10 pt-4 animate-fade-in space-y-3">
            {activeTab === 'drivers' ? (
              approvedDrivers.length === 0 ? (
                <p className="text-xs text-on-surface-variant font-medium">No approved driver records in history.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {approvedDrivers.map(driver => (
                    <div key={driver.id} className="rounded-xl border border-outline-variant/10 bg-surface-container-highest p-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-on-surface">{driver.name}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">CNIC: {driver.cnic || 'N/A'}</p>
                      </div>
                      <StatusBadge status="approved" size="sm" />
                    </div>
                  ))}
                </div>
              )
            ) : (
              approvedTrucks.length === 0 ? (
                <p className="text-xs text-on-surface-variant font-medium">No approved truck records in history.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {approvedTrucks.map(truck => (
                    <div key={truck.id} className="rounded-xl border border-outline-variant/10 bg-surface-container-highest p-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-on-surface font-mono">{truck.vehicleNo}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">{truck.type} • {truck.wheelCount || 6} wheels</p>
                      </div>
                      <StatusBadge status="approved" size="sm" />
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Confirm & Rejection Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmVariant={confirmModal.confirmVariant}
        onConfirm={handleExecuteAction}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        showInput={confirmModal.showInput}
        inputPlaceholder="Provide a reason for rejection..."
        requiredInput={true}
      />

    </div>
  )
}