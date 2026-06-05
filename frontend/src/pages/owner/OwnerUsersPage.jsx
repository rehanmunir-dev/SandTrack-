import { useMemo, useState } from 'react'
import OwnerStatusBadge from '../../components/owner/OwnerStatusBadge'
import SearchBar from '../../components/owner/SearchBar'
import EmptyState from '../../components/owner/EmptyState'
import DateRangeFilterButton from '../../components/common/DateRangeFilterButton'
import UserEditModal from '../../components/modals/UserEditModal'
import { useOwnerData } from '../../context/owner/OwnerContext'
import { ROLES, ROLE_LABELS } from '../../rbac/roles'
import { USER_STATUS } from '../../constants/owner/status'
import { OWNER_FEATURE_KEYS, OWNER_FEATURE_LABELS, ROLE_DEFAULT_FEATURES } from '../../constants/owner/features'
import { isInDateRange } from '../../utils/dateRange'

const roleOptions = [ROLES.SUPER_ADMIN, ROLES.ACCOUNTANT, ROLES.TERMINAL_OPERATOR, ROLES.WATCHMAN]

const blankForm = {
  name: '',
  username: '',
  password: '',
  phone: '',
  role: ROLES.TERMINAL_OPERATOR,
  assignedTerminalId: '',
  status: USER_STATUS.ACTIVE,
  featureAccess: ROLE_DEFAULT_FEATURES[ROLES.TERMINAL_OPERATOR],
}

export default function OwnerUsersPage() {
  const { users, terminals, updateUser, addUser } = useOwnerData()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [terminal, setTerminal] = useState('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null)
  const [addForm, setAddForm] = useState({ ...blankForm, assignedTerminalId: terminals[0]?.id || '' })
  const [validationError, setValidationError] = useState('')

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((user) => {
      if (!isInDateRange(user.lastLoginAt || user.createdAt, dateRange)) {
        return false
      }
      if (q && !(`${user.name} ${user.username} ${user.phone}`.toLowerCase().includes(q))) {
        return false
      }
      if (role !== 'all' && user.role !== role) {
        return false
      }
      if (status !== 'all' && user.status !== status) {
        return false
      }
      if (terminal !== 'all' && user.assignedTerminalId !== terminal) {
        return false
      }
      return true
    })
  }, [users, search, role, status, terminal, dateRange])

  function handleEditUser(user) {
    setSelectedUserForEdit(user)
    setShowEditModal(true)
  }

  async function handleSaveEditedUser(updatedData) {
    if (!selectedUserForEdit) {
      return
    }
    try {
      await updateUser(selectedUserForEdit.id, updatedData)
      setShowEditModal(false)
      setSelectedUserForEdit(null)
      setValidationError('')
    } catch (error) {
      setValidationError(error.message)
    }
  }

  async function handleAddUser() {
    if (!addForm.name.trim() || !addForm.username.trim() || !addForm.password.trim() || !addForm.assignedTerminalId) {
      setValidationError('Name, username, password, and terminal are required.')
      return
    }

    try {
      await addUser({
        ...addForm,
        name: addForm.name.trim(),
        username: addForm.username.trim().toLowerCase(),
        password: addForm.password.trim(),
        status: USER_STATUS.ACTIVE,
        featureAccess: addForm.featureAccess,
      })

      setShowAddModal(false)
      setAddForm({ ...blankForm, assignedTerminalId: terminals[0]?.id || '' })
      setValidationError('')
    } catch (error) {
      setValidationError(error.message)
    }
  }

  function toggleAddFeature(featureKey) {
    setAddForm((prev) => {
      const current = new Set(prev.featureAccess || [])
      if (current.has(featureKey)) {
        current.delete(featureKey)
      } else {
        current.add(featureKey)
      }
      return { ...prev, featureAccess: [...current] }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 rounded-xl bg-surface-container-low p-4 md:grid-cols-6">
        <div className="md:col-span-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, username, phone" />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
          <option value="all">All Roles</option>
          {roleOptions.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}
        </select>
        <select value={terminal} onChange={(e) => setTerminal(e.target.value)} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
          <option value="all">All Terminals</option>
          {terminals.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
          <option value="all">All Status</option>
          <option value={USER_STATUS.ACTIVE}>Active</option>
          <option value={USER_STATUS.INACTIVE}>Inactive</option>
          <option value={USER_STATUS.SUSPENDED}>Suspended</option>
        </select>
        <DateRangeFilterButton value={dateRange} onChange={setDateRange} label="Custom Date" />
      </div>

      <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant/20 p-4">
          <h4 className="font-headline text-lg font-bold">User Directory</h4>
          <button type="button" onClick={() => setShowAddModal(true)} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors">
            Add User
          </button>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-4"><EmptyState title="No users matched current filters" /></div>
        ) : (
          <div className="app-table-scroll">
            <table className="app-table text-left text-sm">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Identity</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Role</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Terminal</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredUsers.map((user) => {
                  const terminalName = terminals.find((item) => item.id === user.assignedTerminalId)?.name || 'Unassigned'
                  return (
                    <tr key={user.id} className="transition-colors hover:bg-surface-container-low">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-on-surface">{user.name}</p>
                        <p className="text-xs text-on-surface-variant">{user.username}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-on-surface">{ROLE_LABELS[user.role] || user.role}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{terminalName}</td>
                      <td className="px-4 py-3"><OwnerStatusBadge status={user.status} /></td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleEditUser(user)}
                          className="rounded border border-outline-variant px-2 py-1 text-[11px] font-semibold hover:bg-surface-container-low transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showEditModal && (
        <div>
          <UserEditModal
            user={selectedUserForEdit}
            terminals={terminals}
            onClose={() => {
              setShowEditModal(false)
              setSelectedUserForEdit(null)
            }}
            onSave={handleSaveEditedUser}
          />
        </div>
      )}

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-5xl rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 p-4">
              <div>
                <h4 className="font-headline text-lg font-bold">Add User</h4>
                <p className="text-xs text-on-surface-variant">Create a new user account</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded border border-outline-variant px-3 py-1 text-xs font-semibold hover:bg-surface-container-low transition-colors"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Full Name</label>
                    <input
                      value={addForm.name}
                      onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Username</label>
                    <input
                      value={addForm.username}
                      onChange={(e) => setAddForm((p) => ({ ...p, username: e.target.value }))}
                      className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      placeholder="Username"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Password</label>
                    <input
                      type="password"
                      value={addForm.password}
                      onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
                      className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      placeholder="Password"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Phone</label>
                    <input
                      value={addForm.phone}
                      onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      placeholder="Phone"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">Role</label>
                      <select
                        value={addForm.role}
                        onChange={(e) => setAddForm((p) => ({ ...p, role: e.target.value }))}
                        className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      >
                        {roleOptions.map((item) => (
                          <option key={item} value={item}>
                            {ROLE_LABELS[item]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">Terminal</label>
                      <select
                        value={addForm.assignedTerminalId}
                        onChange={(e) => setAddForm((p) => ({ ...p, assignedTerminalId: e.target.value }))}
                        className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm focus:border-primary focus:outline-none"
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
                </div>

                <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Feature Access</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-80 overflow-y-auto pr-1">
                    {OWNER_FEATURE_KEYS.map((featureKey) => {
                      const checked = (addForm.featureAccess || []).includes(featureKey)
                      return (
                        <label key={featureKey} className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAddFeature(featureKey)}
                            className="cursor-pointer"
                          />
                          <span>{OWNER_FEATURE_LABELS[featureKey]}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>

              {validationError ? <p className="text-xs text-error font-medium">{validationError}</p> : null}

              <div className="flex gap-2 border-t border-outline-variant/20 pt-3">
                <button
                  type="button"
                  onClick={handleAddUser}
                  className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
                >
                  Add User
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
