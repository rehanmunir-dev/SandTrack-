import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionCard from '../../../components/common/SectionCard'
import StatusBadge from '../../../components/common/StatusBadge'
import WorkflowGuide from '../../../components/WorkflowGuide'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'

function StatCard({ label, value, tone = 'text-primary' }) {
  const accent = tone === 'text-secondary' ? '#fb7800' : '#041534'
  return (
    <div className="relative overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm" style={{ '--stat-accent': accent }}>
      <div className="absolute left-0 top-0 h-full w-1 bg-[var(--stat-accent)]" />
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
      <p className={`mt-3 font-headline text-2xl font-black ${tone}`}>{value}</p>
    </div>
  )
}

export default function OperatorDashboardPage() {
  const navigate = useNavigate()
  const { consignments, trucks, drivers, operatorSummary } = useRoleSystem()

  const recentConsignments = useMemo(() => [...consignments].slice(0, 5), [consignments])
  const queueStats = useMemo(() => ({
    needingQr: consignments.filter((item) => item.status === 'SCAN_PENDING' && !item.qrCode).length,
    inTransit: consignments.filter((item) => item.status === 'IN_TRANSIT').length,
    completed: consignments.filter((item) => ['DELIVERED', 'CLOSED'].includes(String(item.status).toUpperCase())).length,
    pendingDriverApprovals: drivers.filter((item) => item.approvalStatus === 'pending').length,
    pendingTruckApprovals: trucks.filter((item) => item.approvalStatus === 'pending').length,
  }), [consignments, drivers, trucks])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-outline-variant/15 bg-gradient-to-br from-primary/10 via-surface-container-lowest to-secondary/10 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Dispatch Control</p>
            <h1 className="mt-2 font-headline text-2xl font-black text-on-surface">Operator Dashboard</h1>
            <p className="mt-1 text-sm font-medium text-on-surface-variant">Create consignments, manage trucks and drivers, and generate QR records.</p>
          </div>
          <button type="button" onClick={() => navigate('/app/operator/consignments/create')} className="app-btn-primary">
            <span className="material-symbols-outlined text-xl">add_box</span>
            Create Consignment
          </button>
        </div>
      </section>

      <SectionCard title="Next Actions" subtitle="What needs operator attention right now.">
        <WorkflowGuide
          title="Operator flow"
          items={[
            { label: '1. Add records', description: 'Register the driver and truck before assigning a load.' },
            { label: '2. Create consignment', description: 'Choose an available driver and truck, then generate the QR pass.' },
            { label: '3. Share QR', description: 'Print or send the public QR link to the driver for gate clearance.' },
          ]}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Consignments Today" value={operatorSummary.consignmentsCreatedToday} />
          <StatCard label="Trucks Active" value={operatorSummary.trucksActive} />
          <StatCard label="Drivers Active" value={operatorSummary.driversActive} />
          <StatCard label="Pending Dispatches" value={operatorSummary.pendingDispatches} tone="text-secondary" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <QueueCard label="Driver approvals" value={queueStats.pendingDriverApprovals} />
          <QueueCard label="Truck approvals" value={queueStats.pendingTruckApprovals} />
          <QueueCard label="Needs QR" value={queueStats.needingQr} />
          <QueueCard label="In transit" value={queueStats.inTransit} />
          <QueueCard label="Delivered / closed" value={queueStats.completed} />
        </div>
      </SectionCard>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Quick Actions" subtitle="Most-used operator tasks">
          <div className="space-y-3">
            <button type="button" onClick={() => navigate('/app/operator/consignments/create')} className="app-btn-primary w-full">
              <span className="material-symbols-outlined text-xl">add_box</span>
              Create Consignment
            </button>
            <button type="button" onClick={() => navigate('/app/operator/drivers')} className="app-btn-secondary w-full">
              <span className="material-symbols-outlined text-xl">person_add</span>
              Add Driver
            </button>
            <button type="button" onClick={() => navigate('/app/operator/trucks')} className="app-btn-secondary w-full">
              <span className="material-symbols-outlined text-xl">add_road</span>
              Add Truck
            </button>
          </div>
        </SectionCard>

        <div className="lg:col-span-2">
          <SectionCard title="Recent Consignments" subtitle="Latest operator-created records">
            <div className="grid gap-3">
              {recentConsignments.map((item) => (
                <div key={item.id} className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">Consignment</p>
                      <p className="mt-1 font-headline text-lg font-black text-primary">{item.consignmentId}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <p><span className="font-bold text-on-surface-variant">Driver:</span> {drivers.find((driver) => driver.id === item.driverId)?.name || 'N/A'}</p>
                    <p><span className="font-bold text-on-surface-variant">Truck:</span> {trucks.find((truck) => truck.id === item.truckId)?.vehicleNo || 'N/A'}</p>
                  </div>
                </div>
              ))}
              {!recentConsignments.length ? (
                <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-6 text-center">
                  <p className="text-sm font-bold text-on-surface">No active consignments yet.</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Create your first consignment to begin dispatch tracking.</p>
                </div>
              ) : null}
            </div>
          </SectionCard>
        </div>
      </section>
    </div>
  )
}

function QueueCard({ label, value }) {
  return (
    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">{label}</p>
      <p className="mt-2 font-headline text-2xl font-black text-primary">{value}</p>
    </div>
  )
}
