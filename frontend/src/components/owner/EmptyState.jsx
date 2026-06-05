export default function EmptyState({ title = 'No data found', subtitle = 'Try updating filters.' }) {
  return (
    <div className="rounded-lg border border-dashed border-outline-variant/40 bg-surface-container-low p-6 text-center">
      <p className="font-semibold text-on-surface">{title}</p>
      <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
    </div>
  )
}
