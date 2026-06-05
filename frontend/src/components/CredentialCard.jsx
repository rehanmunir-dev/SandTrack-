import { toast } from 'react-hot-toast'

const CredentialCard = ({ 
  isOpen,
  name,
  role,
  username,
  password,
  extraInfo,
  onClose,
  loginUrl
}) => {

  const handleCopy = () => {
    const text = `
SandTrack Login Credentials
━━━━━━━━━━━━━━━━━━━━
Name:     ${name}
Role:     ${role}
Username: ${username}
Password: ${password}
${extraInfo ? extraInfo + '\n' : ''}
Login at: ${loginUrl || window.location.origin + '/login'}
━━━━━━━━━━━━━━━━━━━━
⚠️ Please change your password after first login.
    `.trim()
    navigator.clipboard.writeText(text)
    toast.success('Credentials copied to clipboard!')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Card Container */}
      <div className="relative w-full max-w-md bg-surface-container-lowest border border-outline-variant/20 rounded-3xl overflow-hidden shadow-2xl animate-scale-up text-sm text-on-surface">
        
        {/* Success Header Banner */}
        <div className="bg-emerald-600 dark:bg-emerald-700 px-6 py-5 text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">check_circle</span>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold">Generated Successfully</h3>
            <p className="text-emerald-100 text-xs mt-0.5">Secure transient credentials are ready</p>
          </div>
        </div>

        {/* Credentials Details Box */}
        <div className="p-6 space-y-4">
          
          <div className="rounded-2xl bg-surface-container-high p-4 border border-outline-variant/15 font-mono text-xs space-y-2.5 text-on-surface-variant">
            <div className="flex justify-between border-b border-outline-variant/10 pb-1.5">
              <span className="font-bold text-on-surface">NAME:</span>
              <span>{name}</span>
            </div>
            <div className="flex justify-between border-b border-outline-variant/10 pb-1.5">
              <span className="font-bold text-on-surface">ROLE:</span>
              <span className="text-primary font-semibold">{role}</span>
            </div>
            <div className="flex justify-between border-b border-outline-variant/10 pb-1.5">
              <span className="font-bold text-on-surface">USERNAME:</span>
              <span className="bg-surface-container-highest px-1.5 py-0.5 rounded text-primary font-bold">{username}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-on-surface">PASSWORD:</span>
              <span className="bg-surface-container-highest px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 font-bold">{password}</span>
            </div>
          </div>

          {/* Warning banner */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-semibold">
            <span className="material-symbols-outlined text-sm mt-0.5">warning</span>
            <div className="flex-1">
              <p>Save these credentials now. The password is transient and will NOT be shown again!</p>
            </div>
          </div>

          {extraInfo && (
            <p className="text-xs text-on-surface-variant italic text-center font-medium bg-surface-container/50 py-1.5 px-3 rounded-lg">
              Status: {extraInfo}
            </p>
          )}

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 app-btn-primary px-4 py-2.5 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">content_copy</span>
              Copy Credentials
            </button>
            <button
              onClick={onClose}
              className="app-btn-secondary px-4 py-2.5 border border-outline-variant hover:bg-surface-container-high"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}

export default CredentialCard
