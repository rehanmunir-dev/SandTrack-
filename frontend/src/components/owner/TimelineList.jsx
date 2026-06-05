export default function TimelineList({ items }) {
  if (!items?.length) {
    return null
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.title}-${item.at}-${index}`} className="relative rounded-lg border border-outline-variant/20 bg-surface-container-low px-4 py-3">
          <p className="text-sm font-semibold text-on-surface">{item.title || item.action}</p>
          <p className="text-xs text-on-surface-variant">{item.actor || item.by}</p>
          <p className="text-[11px] text-on-surface-variant">{new Date(item.at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}
