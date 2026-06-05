import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SectionCard from '../../components/common/SectionCard'
import StatusBadge from '../../components/common/StatusBadge'
import PermissionGate from '../../components/rbac/PermissionGate'
import { useAppState } from '../../context/AppStateContext'
import { useAuth } from '../../context/AuthContext'
import { CONSIGNMENT_TRANSITIONS } from '../../constants/statusModels'
import { PERMISSIONS } from '../../rbac/permissions'

export default function ConsignmentDetailsPage() {
  const { consignmentId } = useParams()
  const { currentUser, can } = useAuth()
  const {
    consignments,
    auditLogs,
    assignConsignment,
    transitionConsignment,
    ingestTrackingPoint,
  } = useAppState()

  const consignment = consignments.find((item) => item.id === consignmentId)
  const [vehicleNo, setVehicleNo] = useState(consignment?.vehicleNo || '')
  const [driverName, setDriverName] = useState(consignment?.driverName || '')
  const [notice, setNotice] = useState('')

  const timeline = consignment?.timeline || []
  const nextStatuses = CONSIGNMENT_TRANSITIONS[consignment?.status] || []

  const entityAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => log.entityId === consignmentId).slice(0, 8)
  }, [auditLogs, consignmentId])

  if (!consignment) {
    return (
      <SectionCard title="Consignment Details">
        <p className="text-sm text-slate-600">Consignment not found.</p>
        <Link className="underline text-sm" to="/app/consignments">
          Back to consignments
        </Link>
      </SectionCard>
    )
  }

  function handleAssign(event) {
    event.preventDefault()

    assignConsignment({
      consignmentId: consignment.id,
      vehicleNo,
      driverName,
      actor: currentUser.name,
    })

    setNotice('Vehicle/driver assignment updated.')
  }

  function handleTransition(nextStatus) {
    transitionConsignment({
      consignmentId: consignment.id,
      nextStatus,
      actor: currentUser.name,
    })
    setNotice(`Status moved to ${nextStatus} (if valid).`)
  }

  function handleMockTrackingPoint() {
    ingestTrackingPoint({
      consignmentId: consignment.id,
      point: {
        lat: 33.9 + Math.random() * 0.15,
        lng: 72.5 + Math.random() * 0.15,
      },
      actor: currentUser.name,
    })

    setNotice('New GPS point ingested.')
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={`Consignment ${consignment.receiptId}`}
        subtitle={`${consignment.sourceMine} -> ${consignment.destination}`}
        right={<StatusBadge status={consignment.status} />}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-slate-500">Vehicle</p>
            <p className="font-semibold">{consignment.vehicleNo}</p>
          </div>
          <div>
            <p className="text-slate-500">Driver</p>
            <p className="font-semibold">{consignment.driverName}</p>
          </div>
          <div>
            <p className="text-slate-500">Payment</p>
            <StatusBadge status={consignment.paymentStatus} />
          </div>
          <div>
            <p className="text-slate-500">QR</p>
            <p className="font-semibold">{consignment.qrCode}</p>
          </div>
        </div>
      </SectionCard>

      {notice ? (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      <PermissionGate permissions={[PERMISSIONS.CONSIGNMENT_ASSIGN]}>
        <SectionCard title="Assign Vehicle and Driver">
          <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={vehicleNo}
              onChange={(event) => setVehicleNo(event.target.value)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Vehicle number"
            />
            <input
              value={driverName}
              onChange={(event) => setDriverName(event.target.value)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Driver name"
            />
            <button className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              Save Assignment
            </button>
          </form>
        </SectionCard>
      </PermissionGate>

      <SectionCard title="Lifecycle Timeline" subtitle="Current status and allowed actions">
        <div className="flex gap-2 flex-wrap mb-4">
          {timeline.map((event) => (
            <div key={`${event.status}-${event.at}`} className="rounded border border-slate-200 px-3 py-2">
              <p className="text-xs text-slate-500">{new Date(event.at).toLocaleString()}</p>
              <p className="text-sm font-semibold">{event.status}</p>
              <p className="text-xs text-slate-600">{event.actor}</p>
            </div>
          ))}
        </div>

        <PermissionGate permissions={[PERMISSIONS.CONSIGNMENT_TRANSITION]}>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.length === 0 ? (
              <p className="text-sm text-slate-500">No next status available.</p>
            ) : (
              nextStatuses.map((nextStatus) => (
                <button
                  key={nextStatus}
                  type="button"
                  onClick={() => handleTransition(nextStatus)}
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  Move to {nextStatus}
                </button>
              ))
            )}
          </div>
        </PermissionGate>
      </SectionCard>

      <SectionCard title="Route Monitoring" subtitle="Tracking points and deviation readiness">
        <div className="mb-3">
          <button
            type="button"
            onClick={handleMockTrackingPoint}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            Add GPS Point
          </button>
        </div>
        <div className="space-y-2">
          {consignment.routePoints.slice(-6).map((point, index) => (
            <div key={`${point.lat}-${point.lng}-${index}`} className="rounded border border-slate-200 p-2 text-sm">
              Lat {point.lat.toFixed(4)} | Lng {point.lng.toFixed(4)} | {new Date(point.at).toLocaleString()}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Weight Correlation and Evidence">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded border border-slate-200 p-3">
            <p className="text-slate-500">Source Weight</p>
            <p className="font-semibold">{consignment.sourceWeight} MT</p>
          </div>
          <div className="rounded border border-slate-200 p-3">
            <p className="text-slate-500">Destination Weight</p>
            <p className="font-semibold">
              {consignment.destinationWeight == null
                ? 'Pending'
                : `${consignment.destinationWeight} MT`}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-sm font-medium mb-2">Photo evidence</p>
          <div className="flex flex-wrap gap-2">
            {consignment.evidencePhotos.map((name) => (
              <span key={name} className="rounded bg-slate-100 px-2 py-1 text-xs">
                {name}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <Link className="underline text-sm" to={`/app/consignments/${consignment.id}/receipt`}>
            Open digital receipt
          </Link>
        </div>
      </SectionCard>

      <SectionCard title="Audit Trail">
        {entityAuditLogs.length === 0 ? (
          <p className="text-sm text-slate-500">No audit actions yet.</p>
        ) : (
          <div className="space-y-2">
            {entityAuditLogs.map((log) => (
              <div key={log.id} className="rounded border border-slate-200 p-2">
                <p className="text-sm font-medium">{log.action}</p>
                <p className="text-xs text-slate-600">{log.detail}</p>
                <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()} by {log.actor}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <PermissionGate permissions={[PERMISSIONS.CONSIGNMENT_CLOSE]}>
        {can(PERMISSIONS.CONSIGNMENT_CLOSE) ? (
          <button
            type="button"
            onClick={() => handleTransition('CLOSED')}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            Attempt Close Consignment
          </button>
        ) : null}
      </PermissionGate>
    </div>
  )
}
