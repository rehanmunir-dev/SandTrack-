import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DetailCard from '../../components/owner/DetailCard'
import EmptyState from '../../components/owner/EmptyState'
import { useOwnerData } from '../../context/owner/OwnerContext'

function Section({ title, items, renderItem }) {
  return (
    <DetailCard title={title}>
      {!items.length ? (
        <EmptyState title={`No ${title.toLowerCase()} results`} subtitle="Try another keyword." />
      ) : (
        <div className="space-y-2">
          {items.map(renderItem)}
        </div>
      )}
    </DetailCard>
  )
}

export default function OwnerSearchPage() {
  const [searchParams] = useSearchParams()
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  const { consignments, alerts, terminals, users } = useOwnerData()

  const results = useMemo(() => {
    if (!q) {
      return { consignments: [], users: [], terminals: [], alerts: [] }
    }

    return {
      consignments: consignments.filter((item) => `${item.receiptId} ${item.vehicleNo} ${item.driverName}`.toLowerCase().includes(q)),
      users: users.filter((item) => `${item.name} ${item.username} ${item.phone}`.toLowerCase().includes(q)),
      terminals: terminals.filter((item) => item.name.toLowerCase().includes(q)),
      alerts: alerts.filter((item) => `${item.title} ${item.message}`.toLowerCase().includes(q)),
    }
  }, [alerts, consignments, terminals, users, q])

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
        <p className="font-semibold text-on-surface">Search query: {q || 'None'}</p>
      </div>

      <Section
        title="Consignments"
        items={results.consignments}
        renderItem={(item) => (
          <Link key={item.id} to={`/owner/consignments/${item.id}`} className="block rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
            <p className="text-sm font-semibold text-on-surface">{item.receiptId} • {item.vehicleNo}</p>
            <p className="text-xs text-on-surface-variant">{item.driverName}</p>
          </Link>
        )}
      />

      <Section
        title="Users"
        items={results.users}
        renderItem={(item) => (
          <Link key={item.id} to="/owner/users" className="block rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
            <p className="text-sm font-semibold text-on-surface">{item.name}</p>
            <p className="text-xs text-on-surface-variant">{item.username}</p>
          </Link>
        )}
      />

      <Section
        title="Terminals"
        items={results.terminals}
        renderItem={(item) => (
          <Link key={item.id} to="/owner/terminal" className="block rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
            <p className="text-sm font-semibold text-on-surface">{item.name}</p>
          </Link>
        )}
      />

      <Section
        title="Alerts"
        items={results.alerts}
        renderItem={(item) => (
          <Link key={item.id} to={`/owner/alerts?alertId=${item.id}`} className="block rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
            <p className="text-sm font-semibold text-on-surface">{item.title}</p>
            <p className="text-xs text-on-surface-variant">{item.message}</p>
          </Link>
        )}
      />
    </div>
  )
}
