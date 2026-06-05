import { STATUS_BADGE_CLASS, STATUS_LABELS } from '../../constants/owner/status'

export default function OwnerStatusBadge({ status }) {
  if (!status) {
    return null
  }

  const label = STATUS_LABELS[status] || status
  const toneClass = STATUS_BADGE_CLASS[status] || 'bg-surface-container-highest text-on-surface-variant'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${toneClass}`}>
      {label}
    </span>
  )
}
