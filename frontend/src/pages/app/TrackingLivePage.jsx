import { useState } from 'react'
import SectionCard from '../../components/common/SectionCard'
import StatusBadge from '../../components/common/StatusBadge'
import { useAppState } from '../../context/AppStateContext'
import { useAuth } from '../../context/AuthContext'

export default function TrackingLivePage() {
  const { currentUser } = useAuth()
  const { consignments, ingestTrackingPoint } = useAppState()
  const [consignmentId, setConsignmentId] = useState(consignments[0]?.id || '')
  const [lat, setLat] = useState('33.90')
  const [lng, setLng] = useState('72.52')

  const selected = consignments.find((item) => item.id === consignmentId)

  function handleIngest(event) {
    event.preventDefault()

    if (!selected) {
      return
    }

    ingestTrackingPoint({
      consignmentId: selected.id,
      point: {
        lat: Number(lat),
        lng: Number(lng),
      },
      actor: currentUser.name,
    })
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Live Tracking" subtitle="GPS point ingest and route checks">
        <form onSubmit={handleIngest} className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select
            value={consignmentId}
            onChange={(event) => setConsignmentId(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {consignments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.receiptId}
              </option>
            ))}
          </select>
          <input
            value={lat}
            onChange={(event) => setLat(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Latitude"
          />
          <input
            value={lng}
            onChange={(event) => setLng(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Longitude"
          />
          <button className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            Ingest Point
          </button>
        </form>
      </SectionCard>

      {selected ? (
        <SectionCard
          title={`Route points for ${selected.receiptId}`}
          subtitle={`Current status: ${selected.status}`}
          right={<StatusBadge status={selected.status} />}
        >
          <div className="space-y-2">
            {selected.routePoints.slice(-10).map((point, index) => (
              <div key={`${point.lat}-${point.lng}-${index}`} className="rounded border border-slate-200 p-2 text-sm">
                Lat {point.lat.toFixed(4)} | Lng {point.lng.toFixed(4)} | {new Date(point.at).toLocaleString()}
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}
