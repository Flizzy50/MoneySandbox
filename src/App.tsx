import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { ProfileSetup } from './components/ProfileSetup'
import { clearProfile, loadProfile, saveProfile } from './lib/profile'
import { nextForecastMonth } from './lib/finance'
import type { FinancialProfile } from './types/finance'

export default function App() {
  const [loaded] = useState(loadProfile)
  const [profile, setProfile] = useState(loaded.profile)
  const [warning, setWarning] = useState(loaded.warning)
  const [editing, setEditing] = useState(false)
  const [forecastStart] = useState(nextForecastMonth)
  function save(next: FinancialProfile) { setWarning(saveProfile(next)); setProfile(next); setEditing(false) }
  function startOver() {
    if (!window.confirm('Clear your saved profile, baseline, and current scenario, and return to setup?')) return
    setWarning(clearProfile()); setProfile(null); setEditing(false)
  }
  return <>{warning && <div className="storage-warning" role="status">{warning}</div>}{(!profile || editing) && <ProfileSetup initial={profile ?? undefined} onSave={save} onCancel={() => setEditing(false)} />}{profile && <div hidden={editing}><Dashboard active={!editing} profile={profile} forecastStart={forecastStart} onEdit={() => setEditing(true)} onStartOver={startOver} /></div>}</>
}
