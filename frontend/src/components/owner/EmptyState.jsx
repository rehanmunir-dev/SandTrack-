export default function EmptyState({ title = 'No data found', subtitle = 'Try updating filters.' }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
      <span className="material-symbols-outlined text-3xl text-slate-400">inbox</span>
      <p className="mt-2 font-extrabold text-slate-900">{title}</p>
      <p className="mt-1 text-sm font-medium text-slate-600">{subtitle}</p>
    </div>
  )
}
