import { useState, useEffect } from 'react'
import { ROLES, ROLE_LABELS } from '../../rbac/roles'
import { USER_STATUS } from '../../constants/owner/status'
import { OWNER_FEATURE_KEYS, OWNER_FEATURE_LABELS } from '../../constants/owner/features'

export default function UserEditModal({ user, terminals = [], onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    role: ROLES.TERMINAL_OPERATOR,
    assignedTerminalId: '',
    status: USER_STATUS.ACTIVE,
    featureAccess: [],
  })
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        username: user.username || '',
        password: user.password || '',
        phone: user.phone || '',
        role: user.role || ROLES.TERMINAL_OPERATOR,
        assignedTerminalId: user.assignedTerminalId || '',
        status: user.status || USER_STATUS.ACTIVE,
        featureAccess: user.featureAccess || [],
      })
    }
  }, [user])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.username.trim() || !form.password.trim() || !form.assignedTerminalId) {
      setValidationError('Name, username, password, and terminal are required.')
      return
    }
    setValidationError('')
    onSave({
      name: form.name.trim(),
      username: form.username.trim(),
      password: form.password.trim(),
      phone: form.phone.trim(),
      role: form.role,
      assignedTerminalId: form.assignedTerminalId,
      status: form.status,
      featureAccess: form.featureAccess,
    })
  }

  const toggleFeature = (featureKey) => {
    setForm((prev) => {
      const current = new Set(prev.featureAccess || [])
      if (current.has(featureKey)) {
        current.delete(featureKey)
      } else {
        current.add(featureKey)
      }
      return { ...prev, featureAccess: [...current] }
    })
  }

  if (!user) return null

  const roleOptions = [ROLES.SUPER_ADMIN, ROLES.ACCOUNTANT, ROLES.TERMINAL_OPERATOR, ROLES.WATCHMAN]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-5xl rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl">
        <div className="flex items-center justify-between border-b border-outline-variant/20 p-4">
          <div>
            <h4 className="font-headline text-lg font-bold">Edit User</h4>
            <p className="text-xs text-on-surface-variant">{user.username}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-outline-variant px-3 py-1 text-xs font-semibold hover:bg-surface-container-low transition-colors"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Full Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Username</label>
                <input
                  required
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Username"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Password</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Password"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Phone"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    {roleOptions.map((item) => (
                      <option key={item} value={item}>
                        {ROLE_LABELS[item]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value={USER_STATUS.ACTIVE}>Active</option>
                    <option value={USER_STATUS.INACTIVE}>Inactive</option>
                    <option value={USER_STATUS.SUSPENDED}>Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Terminal</label>
                <select
                  required
                  value={form.assignedTerminalId}
                  onChange={(e) => setForm((prev) => ({ ...prev, assignedTerminalId: e.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Select a terminal</option>
                  {terminals.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Feature Access</p>
              <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {OWNER_FEATURE_KEYS.map((featureKey) => {
                  const checked = form.featureAccess.includes(featureKey)
                  return (
                    <label key={featureKey} className="flex cursor-pointer items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFeature(featureKey)}
                        className="cursor-pointer"
                      />
                      <span>{OWNER_FEATURE_LABELS[featureKey]}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {validationError ? <p className="text-xs font-medium text-error">{validationError}</p> : null}

          <div className="flex gap-2 border-t border-outline-variant/20 pt-3">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
