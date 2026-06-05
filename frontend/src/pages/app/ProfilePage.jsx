import { useEffect, useRef, useState } from 'react'
import ProfilePictureEditor from '../../components/ProfilePictureEditor'
import SectionCard from '../../components/common/SectionCard'
import StatusBadge from '../../components/common/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useAppState } from '../../context/AppStateContext'
import { ROLE_LABELS } from '../../rbac/roles'

export default function ProfilePage() {
  const { currentUser, logout, updateProfilePicture } = useAuth()
  const { counters } = useAppState()
  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [selectedPicture, setSelectedPicture] = useState(null)
  const [instantPreviewUrl, setInstantPreviewUrl] = useState('')

  const apiOrigin = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : window.location.origin
  const profilePictureSrc = currentUser?.profilePictureUrl
    ? `${apiOrigin}${currentUser.profilePictureUrl}`
    : ''
  const visibleProfilePictureSrc = instantPreviewUrl || profilePictureSrc

  const initials = (currentUser?.name || 'ST')
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  useEffect(() => () => {
    if (instantPreviewUrl) {
      URL.revokeObjectURL(instantPreviewUrl)
    }
  }, [instantPreviewUrl])

  function handleProfilePictureChange(event) {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedPicture(file)
    }
    event.target.value = ''
  }

  async function handleProfilePictureSave(file) {
    setUploadError('')
    setIsUploading(true)

    try {
      const previewUrl = URL.createObjectURL(file)
      await updateProfilePicture(file)
      setInstantPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl)
        }
        return previewUrl
      })
      setSelectedPicture(null)
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Could not update profile picture.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Profile" subtitle="Your login identity, role, and quick account actions.">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <div className="relative rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 text-center shadow-sm">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant/30 bg-surface-container-high text-primary transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Edit profile picture"
              title="Edit profile picture"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePictureChange}
            />
            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary text-2xl font-black text-on-primary">
              {visibleProfilePictureSrc ? (
                <img src={visibleProfilePictureSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <h3 className="mt-4 font-headline text-2xl font-extrabold text-on-surface">{currentUser?.name}</h3>
            <p className="text-sm text-on-surface-variant">{currentUser?.username}</p>
            {uploadError ? <p className="mt-3 text-xs font-semibold text-error">{uploadError}</p> : null}
            {isUploading ? <p className="mt-3 text-xs font-semibold text-primary">Uploading picture...</p> : null}
            <div className="mt-4 flex justify-center">
              <StatusBadge status={currentUser?.isActive ? 'active' : 'inactive'} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Role</p>
                <p className="mt-2 font-headline text-xl font-bold text-on-surface">{ROLE_LABELS[currentUser?.role] || currentUser?.role}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Terminal</p>
                <p className="mt-2 font-headline text-xl font-bold text-on-surface">{currentUser?.terminal || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Active Consignments</p>
                <p className="mt-2 font-headline text-3xl font-extrabold text-primary">{counters.activeConsignments}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Pending Payments</p>
                <p className="mt-2 font-headline text-3xl font-extrabold text-secondary">{counters.pendingPayments}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Open Alerts</p>
                <p className="mt-2 font-headline text-3xl font-extrabold text-error">{counters.openAlerts}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={logout}
                className="rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </SectionCard>
      {selectedPicture ? (
        <ProfilePictureEditor
          file={selectedPicture}
          onCancel={() => setSelectedPicture(null)}
          onSave={handleProfilePictureSave}
        />
      ) : null}
    </div>
  )
}
