export default function KPIStatCard({ title, value, helper, onClick, tone = 'default' }) {
  const toneClass =
    tone === 'primary'
      ? 'text-primary'
      : tone === 'secondary'
        ? 'text-secondary'
        : tone === 'success'
          ? 'text-emerald-700'
          : 'text-on-surface'

  return (
    <button
      type="button"
      onClick={onClick}
      className="dashboard-stat w-full text-left transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      style={{ '--stat-accent': tone === 'secondary' ? '#fb7800' : tone === 'success' ? '#059669' : '#041534' }}
    >
      <p className="dashboard-stat-label">{title}</p>
      <p className={`dashboard-stat-value ${toneClass}`}>{value}</p>
      {helper ? <p className="mt-2 text-sm font-medium leading-5 text-slate-600">{helper}</p> : null}
    </button>
  )
}
