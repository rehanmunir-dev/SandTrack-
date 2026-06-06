import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionCard from '../../../components/common/SectionCard'
import StatusBadge from '../../../components/common/StatusBadge'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'

function StatCard({ label, value, tone = 'text-primary' }) {
  const accent = tone === 'text-secondary' ? '#fb7800' : '#041534'
  return (
    <div className="dashboard-stat" style={{ '--stat-accent': accent }}>
      <p className="dashboard-stat-label">{label}</p>
      <p className={`dashboard-stat-value ${tone}`}>{value}</p>
    </div>
  )
}

export default function OperatorDashboardPage() {
  const navigate = useNavigate()
  const { consignments, trucks, drivers, operatorSummary } = useRoleSystem()

  const recentConsignments = useMemo(() => [...consignments].slice(0, 5), [consignments])

  return (
    <div className="space-y-6">
      <SectionCard title="Operator Dashboard" subtitle="Create consignments, manage trucks and drivers, and generate QR records.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Consignments Today" value={operatorSummary.consignmentsCreatedToday} />
          <StatCard label="Trucks Active" value={operatorSummary.trucksActive} />
          <StatCard label="Drivers Active" value={operatorSummary.driversActive} />
          <StatCard label="Pending Dispatches" value={operatorSummary.pendingDispatches} tone="text-secondary" />
        </div>
      </SectionCard>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Quick Actions" subtitle="Operator workflow shortcuts">
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
            <div className="app-table-scroll">
              <table className="app-table text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">ID</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Driver</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Truck</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {recentConsignments.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low">
                      <td className="px-4 py-3 font-semibold text-primary">{item.consignmentId}</td>
                      <td className="px-4 py-3 text-on-surface">{drivers.find((driver) => driver.id === item.driverId)?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-on-surface">{trucks.find((truck) => truck.id === item.truckId)?.vehicleNo || 'N/A'}</td>
                      <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </section>
    </div>
  )
}
