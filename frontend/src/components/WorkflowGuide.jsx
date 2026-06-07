export default function WorkflowGuide({ title = 'Next steps', items = [] }) {
  if (!items.length) {
    return null
  }

  return (
    <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/70 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-blue-950">
        <span className="material-symbols-outlined text-xl">tips_and_updates</span>
        <p className="text-sm font-extrabold">{title}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="rounded-lg border border-blue-100 bg-white px-3 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs font-extrabold uppercase text-blue-800">{item.label}</p>
            <p className="mt-1 text-sm font-medium leading-5 text-slate-700">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
