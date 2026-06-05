import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import SectionCard from '../../../components/common/SectionCard'
import CredentialCard from '../../../components/CredentialCard'
import {
  getUsersAPI,
  createUserAPI,
  toggleUserStatusAPI,
  resetUserPasswordAPI,
  deleteUserAPI
} from '../../../services/api'

export default function UserManagementPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [form, setForm] = useState({
    fullName: '',
    role: 'OPERATOR',
    phone: ''
  })

  // Credential Modal State
  const [credModal, setCredModal] = useState({
    isOpen: false,
    name: '',
    role: '',
    username: '',
    password: '',
    extraInfo: ''
  })

  // Filters State
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await getUsersAPI()
      if (res.data?.success) {
        setUsers(res.data.data)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch staff accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    document.title = 'SandTrack — Staff Management'
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Create Staff
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await createUserAPI(form)
      if (res.data?.success) {
        const newUser = res.data.data
        toast.success(res.data.message || 'Staff created successfully!')
        
        // Show secure credential card
        setCredModal({
          isOpen: true,
          name: newUser.fullName,
          role: newUser.role,
          username: newUser.username,
          password: newUser.plainPassword,
          extraInfo: 'Account is active. Note credentials now.'
        })

        // Reset form
        setForm({
          fullName: '',
          role: 'OPERATOR',
          phone: ''
        })

        fetchUsers()
      }
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.message || 'Failed to create staff account'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle Status
  const handleToggleStatus = async (id, currentActive) => {
    try {
      const nextActive = !currentActive
      const res = await toggleUserStatusAPI(id, nextActive)
      if (res.data?.success) {
        toast.success(res.data.message || `User status updated!`)
        fetchUsers()
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to toggle staff status')
    }
  }

  // Reset Password
  const handleResetPassword = async (id) => {
    if (!window.confirm('Are you sure you want to reset the password for this staff member?')) {
      return
    }
    try {
      const res = await resetUserPasswordAPI(id)
      if (res.data?.success) {
        const u = res.data.data
        toast.success(res.data.message || 'Password reset successfully!')
        
        // Show new credentials
        setCredModal({
          isOpen: true,
          name: u.fullName,
          role: u.role,
          username: u.username,
          password: u.newPassword,
          extraInfo: 'Password updated. Share credentials immediately.'
        })
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to reset password')
    }
  }

  // Delete Staff
  const handleDeleteUser = async (user) => {
    const displayName = user.fullName || user.username
    if (!window.confirm(`Delete ${displayName}? This removes their login access permanently.`)) {
      return
    }

    try {
      const res = await deleteUserAPI(user.id)
      if (res.data?.success) {
        toast.success(res.data.message || 'Staff member deleted successfully')
        fetchUsers()
      }
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.message || 'Failed to delete staff member'
      toast.error(msg)
    }
  }

  // Filter logic
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = u.fullName || u.full_name || '';
      const uname = u.username || '';
      const matchSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        uname.toLowerCase().includes(search.toLowerCase())
      
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter
      
      return matchSearch && matchRole
    })
  }, [users, search, roleFilter])

  // Badge mapping helper
  const roleBadgeStyles = {
    OPERATOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ACCOUNTANT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    WATCHMAN: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    DRIVER: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400'
  }

  return (
    <div className="space-y-6">
      
      {/* Credential display modal */}
      <CredentialCard
        isOpen={credModal.isOpen}
        name={credModal.name}
        role={credModal.role}
        username={credModal.username}
        password={credModal.password}
        extraInfo={credModal.extraInfo}
        onClose={() => setCredModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Header Banner */}
      <div className="border-b border-outline-variant/10 pb-4">
        <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-background tracking-tight">
          Staff & User Management
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">
          CEO Terminal Control: Provision roles, toggle statuses, and reset passwords.
        </p>
      </div>

      {/* Section A: Create New Staff */}
      <SectionCard
        title="Create New Staff Account"
        subtitle="Auto-generates clean secure usernames and passwords for new staff recruits."
      >
        <form onSubmit={handleSubmit} className="max-w-xl grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 md:col-span-2">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Full Name <span className="text-error">*</span>
              </label>
              <input
                required
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter full name (e.g. Muhammad Rehan)"
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Role <span className="text-error">*</span>
              </label>
              <select
                required
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
              >
                <option value="OPERATOR">Operator</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="WATCHMAN">Watchman</option>
                <option value="DRIVER">Driver</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone (optional)"
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="app-btn-primary px-5 py-2.5 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              {submitting ? 'Generating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Section B: Manage Existing Staff */}
      <SectionCard
        title="Manage Existing Staff"
        subtitle="Provision accounts, deactivate users instantly, or reissue secure passwords."
      >
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="w-full sm:max-w-xs relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant/80">
                <span className="material-symbols-outlined text-base">search</span>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or username..."
                className="w-full pl-9 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
              />
            </div>
            
            <div className="w-full sm:max-w-xs flex gap-2 items-center justify-end">
              <label className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">Filter Role:</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
              >
                <option value="ALL">All Roles</option>
                <option value="OPERATOR">Operator</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="WATCHMAN">Watchman</option>
                <option value="DRIVER">Driver</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="py-12 text-center text-on-surface-variant font-medium">
              Loading staff profiles...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant font-medium">
              No staff members found matching filters.
            </div>
          ) : (
            <div className="app-table-scroll rounded-2xl border border-outline-variant/15">
              <table className="app-table border-collapse text-left">
                <thead className="bg-surface-container-high text-on-surface-variant uppercase text-xs font-bold border-b border-outline-variant/15">
                  <tr>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-sm">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{u.username}</td>
                      <td className="px-4 py-3 font-semibold">{u.fullName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${roleBadgeStyles[u.role] || 'bg-slate-100 text-slate-800'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {/* Active / Inactive switch toggle */}
                          <button
                            onClick={() => handleToggleStatus(u.id, u.isActive)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                              u.isActive
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 hover:bg-rose-500/25'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/25'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          
                          {/* Reset password trigger */}
                          <button
                            onClick={() => handleResetPassword(u.id)}
                            className="app-btn-secondary px-3 py-1.5 border border-outline-variant hover:bg-surface-container-high text-xs font-bold"
                          >
                            Reset Password
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-500/20 bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-300 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </SectionCard>

    </div>
  )
}
