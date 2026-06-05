export default function KPIStatCard({ title, value, helper, onClick, tone = 'default' }) {
  const toneClass =
    tone === 'primary'
      ? 'text-primary'
      : tone === 'secondary'
        ? 'text-secondary'
        : tone === 'success'
          ? 'text-on-tertiary-container'
          : 'text-on-surface'

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 text-left shadow-sm transition-all hover:shadow-md"
    >
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{title}</p>
      <p className={`font-headline text-4xl font-extrabold ${toneClass}`}>{value}</p>
      {helper ? <p className="mt-2 text-xs font-medium text-on-surface-variant">{helper}</p> : null}
    </button>
  )
}
