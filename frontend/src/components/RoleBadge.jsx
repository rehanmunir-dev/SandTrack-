import React from 'react'
import { ROLES } from '../rbac/roles'

const ROLE_STYLE_MAP = {
  SUPER_ADMIN: {
    classes: 'bg-amber-100 text-amber-800 border-amber-200',
    label: '👑 CEO / Owner',
  },
  [ROLES.SUPER_ADMIN]: {
    classes: 'bg-amber-100 text-amber-800 border-amber-200',
    label: '👑 CEO / Owner',
  },
  ADMIN: {
    classes: 'bg-amber-100 text-amber-800 border-amber-200',
    label: '👑 CEO / Owner',
  },
  OPERATOR: {
    classes: 'bg-blue-100 text-blue-800 border-blue-200',
    label: '🚛 Terminal Operator',
  },
  [ROLES.TERMINAL_OPERATOR]: {
    classes: 'bg-blue-100 text-blue-800 border-blue-200',
    label: '🚛 Terminal Operator',
  },
  DRIVER: {
    classes: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    label: '👤 Driver',
  },
  [ROLES.DRIVER]: {
    classes: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    label: '👤 Driver',
  },
  WATCHMAN: {
    classes: 'bg-orange-100 text-orange-800 border-orange-200',
    label: '👮 Watchman',
  },
  [ROLES.WATCHMAN]: {
    classes: 'bg-orange-100 text-orange-800 border-orange-200',
    label: '👮 Watchman',
  },
  ACCOUNTANT: {
    classes: 'bg-violet-100 text-violet-800 border-violet-200',
    label: '🧾 Accountant',
  },
  [ROLES.ACCOUNTANT]: {
    classes: 'bg-violet-100 text-violet-800 border-violet-200',
    label: '🧾 Accountant',
  },
}

export default function RoleBadge({ role }) {
  const item = ROLE_STYLE_MAP[role] || {
    classes: 'bg-slate-100 text-slate-800 border-slate-200',
    label: role,
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-bold ${item.classes}`}>
      {item.label}
    </span>
  )
}
