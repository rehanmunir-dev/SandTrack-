export default function TimelineList({ items }) {
  if (!items?.length) {
    return null
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.title}-${item.at}-${index}`} className="relative rounded-lg border border-slate-200 border-l-4 border-l-blue-950 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm font-bold text-slate-900">{item.title || item.action}</p>
          <p className="mt-1 text-xs font-medium text-slate-600">{item.actor || item.by}</p>
          <p className="mt-1 text-xs text-slate-500">{new Date(item.at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}
