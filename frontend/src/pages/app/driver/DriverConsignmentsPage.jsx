import { useMemo } from 'react'
import SectionCard from '../../../components/common/SectionCard'
import StatusBadge from '../../../components/common/StatusBadge'
import { useAuth } from '../../../context/AuthContext'
import { useRoleSystem } from '../../../context/roleSystem/RoleSystemContext'

export default function DriverConsignmentsPage() {
  const { currentUser } = useAuth()
  const { consignments, drivers, trucks, payments } = useRoleSystem()
  const driver = useMemo(() => {
    if (!currentUser) {
      return null
    }

    // 1. Match by database user ID first (100% exact match)
    const byUserId = drivers.find((item) => Number(item.userId) === Number(currentUser.id))
    if (byUserId) {
      return byUserId
    }

    if (currentUser.driverProfileId) {
      const byProfileId = drivers.find((item) => item.id === currentUser.driverProfileId)
      if (byProfileId) {
        return byProfileId
      }
    }

    if (currentUser.username) {
      const byUsername = drivers.find((item) => item.name?.trim().toLowerCase() === currentUser.username.trim().toLowerCase())
      if (byUsername) {
        return byUsername
      }
    }

    return drivers.find((item) => item.name?.trim().toLowerCase() === currentUser.name?.trim().toLowerCase()) || null
  }, [drivers, currentUser])
  const assigned = consignments
    .filter((item) => item.driverId === driver?.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  function getSimpleTripStatus(status) {
    return String(status).toUpperCase() === 'DELIVERED' ? 'Delivered' : 'On The Way'
  }

  function getPaymentMethod(consignmentInternalId) {
    const payment = payments.find((item) => item.consignmentId === consignmentInternalId)
    return payment?.method || 'Cash'
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Driver Consignments" subtitle="Past consignments with weight, origin, destination, and status.">
        {assigned.length ? (
          <div className="app-table-scroll rounded-lg border border-outline-variant/20">
            <table className="app-table text-left text-sm">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Consignment</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Truck</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Weight</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Origin</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Destination</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Payment</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {assigned.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low">
                    <td className="px-4 py-3 font-semibold text-on-surface">{item.consignmentId}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{trucks.find((truck) => truck.id === item.truckId)?.vehicleNo || 'N/A'}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{item.netWeight || 'N/A'}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{item.originTerminal || 'N/A'}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{item.destination || 'N/A'}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{getPaymentMethod(item.id)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getSimpleTripStatus(item.status) === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                        {getSimpleTripStatus(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{item.qrCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">No consignments assigned yet.</p>
        )}
      </SectionCard>
    </div>
  )
}
