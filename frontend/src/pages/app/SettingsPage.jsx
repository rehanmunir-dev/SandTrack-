import { useState } from 'react'
import SectionCard from '../../components/common/SectionCard'

export default function SettingsPage() {
  const [theme, setTheme] = useState('Light')
  const [language, setLanguage] = useState('English')
  const [notice, setNotice] = useState('')

  function handleSave() {
    setNotice('Settings saved successfully.')
    setTimeout(() => setNotice(''), 1800)
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Settings" subtitle="Personal preferences and system options">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block text-slate-600 mb-1">Theme</span>
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option>Light</option>
              <option>Dark</option>
              <option>Auto</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="block text-slate-600 mb-1">Language</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option>English</option>
              <option>Urdu</option>
            </select>
          </label>

          <button
            type="button"
            onClick={handleSave}
            className="md:col-span-2 rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            Save Settings
          </button>
        </div>

        {notice ? <p className="mt-3 text-sm text-emerald-700">{notice}</p> : null}
      </SectionCard>
    </div>
  )
}
