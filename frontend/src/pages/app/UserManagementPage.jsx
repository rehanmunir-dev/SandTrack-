import { useMemo, useState } from 'react'
import SectionCard from '../../components/common/SectionCard'
import { useAuth } from '../../context/AuthContext'
import { ROLE_LOGIN_ORDER } from '../../rbac/roles'
import { PERMISSIONS } from '../../rbac/permissions'
import { getPermissionsForUser } from '../../rbac/accessControl'

const ACCESS_GROUPS = [
  {
    label: 'Dashboard & Alerts',
    keys: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ALERTS_VIEW],
  },
  {
    label: 'Consignments',
    keys: [
      PERMISSIONS.CONSIGNMENT_CREATE,
      PERMISSIONS.CONSIGNMENT_READ,
      PERMISSIONS.CONSIGNMENT_ASSIGN,
      PERMISSIONS.CONSIGNMENT_TRANSITION,
      PERMISSIONS.CONSIGNMENT_CLOSE,
      PERMISSIONS.CONSIGNMENT_RECEIPT,
    ],
  },
  {
    label: 'Gate & Tracking',
    keys: [
      PERMISSIONS.QR_SCAN,
      PERMISSIONS.GATE_SCAN,
      PERMISSIONS.GATE_RELEASE,
      PERMISSIONS.TRACKING_VIEW,
      PERMISSIONS.TRACKING_INGEST,
    ],
  },
  {
    label: 'Payments & Finance',
    keys: [
      PERMISSIONS.PAYMENT_CREATE,
      PERMISSIONS.PAYMENT_READ,
      PERMISSIONS.PAYMENT_VERIFY,
      PERMISSIONS.LEDGER_VIEW,
      PERMISSIONS.LEDGER_EXPORT,
      PERMISSIONS.RECONCILIATION_VIEW,
      PERMISSIONS.RECONCILIATION_ACTION,
    ],
  },
  {
    label: 'Administration',
    keys: [
      PERMISSIONS.USERS_MANAGE,
      PERMISSIONS.ROLES_MANAGE,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SUPPORT_VIEW,
      PERMISSIONS.AUDIT_VIEW,
    ],
  },
]

const ACCESS_KEYS = ACCESS_GROUPS.flatMap((group) => group.keys)

const initialForm = {
  name: '',
  username: '',
  password: '',
  role: ROLE_LOGIN_ORDER[0],
  terminal: '',
}

export default function UserManagementPage() {
  const {
    userDirectory,
    createUser,
    updateUser,
    setUserPermissionOverrides,
  } = useAuth()

  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [selectedUserId, setSelectedUserId] = useState(userDirectory[0]?.id || null)

  const selectedUser = useMemo(() => {
    return userDirectory.find((user) => user.id === selectedUserId) || null
  }, [userDirectory, selectedUserId])

  function handleCreate(event) {
    event.preventDefault()

    try {
      createUser({
        ...form,
        customPermissions: createAccess,
      })
      setMessage('User created successfully.')
      setForm(initialForm)
      setCreateAccess(createEmptyAccess())
    } catch (error) {
      setMessage(error.message)
    }
  }

  function toggleActive(user) {
    updateUser(user.id, { isActive: !user.isActive })
  }

  function updateRole(user, role) {
    updateUser(user.id, { role })
  }

  function handlePermissionToggle(permission, type) {
    if (!selectedUser) {
      return
    }

    const current = selectedUser.customPermissions || { allow: [], deny: [] }
    const bucket = new Set(current[type] || [])

    if (bucket.has(permission)) {
      bucket.delete(permission)
    } else {
      bucket.add(permission)
    }

    setUserPermissionOverrides(selectedUser.id, {
      ...current,
      [type]: [...bucket],
    })
  }

  function createEmptyAccess() {
    return { allow: [], deny: [] }
  }

  const [createAccess, setCreateAccess] = useState(createEmptyAccess)

  return (
    <div className="space-y-4">
      <SectionCard title="User Management" subtitle="Super admin control for roles and access">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Full name"
          />
          <input
            required
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Username"
          />
          <input
            required
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Password"
          />
          <select
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {ROLE_LOGIN_ORDER.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <input
            required
            value={form.terminal}
            onChange={(event) => setForm((prev) => ({ ...prev, terminal: event.target.value }))}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Assigned terminal"
          />
          <button className="md:col-span-5 rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            Add User
          </button>
        </form>

        <div className="mt-4 rounded-lg border border-slate-200 p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Feature Access for New User</p>
          <div className="space-y-3">
            {ACCESS_GROUPS.map((group) => (
              <div key={group.label} className="rounded border border-slate-100 p-2">
                <p className="mb-2 text-xs font-semibold text-slate-700">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.keys.map((permission) => {
                    const allowed = (createAccess.allow || []).includes(permission)
                    const denied = (createAccess.deny || []).includes(permission)

                    return (
                      <div key={permission} className="flex items-center gap-2 rounded border border-slate-200 px-2 py-1 text-xs">
                        <span className="font-medium">{permission}</span>
                        <button
                          type="button"
                          onClick={() => toggleCreatePermission(permission, 'allow')}
                          className={`rounded px-2 py-0.5 ${allowed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}
                        >
                          Allow
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCreatePermission(permission, 'deny')}
                          className={`rounded px-2 py-0.5 ${denied ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}
                        >
                          Deny
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Users List" subtitle="Edit role, terminal, and active state">
          <div className="space-y-2">
            {userDirectory.map((user) => (
              <div key={user.id} className="rounded border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.username}</p>
                  </div>
                  <button
                    type="button"
                    className="underline text-xs"
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    Edit access
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  <select
                    value={user.role}
                    onChange={(event) => updateRole(user, event.target.value)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                  >
                    {ROLE_LOGIN_ORDER.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>

                  <input
                    value={user.terminal}
                    onChange={(event) => updateUser(user.id, { terminal: event.target.value })}
                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                  />

                  <button
                    type="button"
                    onClick={() => toggleActive(user)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Feature Access Overrides" subtitle="Allow or deny specific permissions">
          {!selectedUser ? (
            <p className="text-sm text-slate-500">Select a user to edit access.</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="font-semibold">{selectedUser.name}</p>
              <p className="text-xs text-slate-500">Role base: {selectedUser.role}</p>
              <p className="text-xs text-slate-500">
                Super Admin can enable/disable what accountant, operator, and watchman can access.
              </p>

              <div className="rounded border border-slate-200 p-2">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Applied Access</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {getPermissionsForUser(selectedUser).map((permission) => (
                    <span key={permission} className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setUserPermissionOverrides(selectedUser.id, {
                      allow: [],
                      deny: [...new Set(ACCESS_KEYS)],
                    })
                  }
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                >
                  Disable All
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setUserPermissionOverrides(selectedUser.id, {
                      allow: [],
                      deny: [],
                    })
                  }
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                >
                  Reset To Role Default
                </button>
              </div>

              {ACCESS_GROUPS.map((group) => (
                <div key={group.label} className="rounded border border-slate-200 p-2">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">{group.label}</p>

                  <div className="space-y-2">
                    {group.keys.map((permission) => {
                      const customPermissions = selectedUser.customPermissions || { allow: [], deny: [] }
                      const allowed = (customPermissions.allow || []).includes(permission)
                      const denied = (customPermissions.deny || []).includes(permission)

                      return (
                        <div key={permission} className="rounded border border-slate-100 p-2">
                          <p className="mb-2 text-xs font-semibold">{permission}</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handlePermissionToggle(permission, 'allow')}
                              className={`rounded border px-2 py-1 text-xs ${
                                allowed ? 'border-emerald-300 bg-emerald-100' : 'border-slate-300'
                              }`}
                            >
                              Allow
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePermissionToggle(permission, 'deny')}
                              className={`rounded border px-2 py-1 text-xs ${
                                denied ? 'border-red-300 bg-red-100' : 'border-slate-300'
                              }`}
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
