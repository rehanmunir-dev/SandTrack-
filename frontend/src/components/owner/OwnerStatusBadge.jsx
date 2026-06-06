import { STATUS_BADGE_CLASS, STATUS_LABELS } from '../../constants/owner/status'

export default function OwnerStatusBadge({ status }) {
  if (!status) {
    return null
  }

  const label = STATUS_LABELS[status] || status
  const toneClass = STATUS_BADGE_CLASS[status] || 'bg-surface-container-highest text-on-surface-variant'

  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border border-current/10 px-2.5 py-1 text-[11px] font-extrabold uppercase ${toneClass}`}>
      {label}
    </span>
  )
}
