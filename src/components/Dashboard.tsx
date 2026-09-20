import { useMemo, useState } from 'react'
import { Box, Pencil, RotateCcw, ShieldCheck, CircleHelp, ArrowUpRight } from 'lucide-react'
import { baselineFromProfile } from '../lib/finance'
import { defaultScenario, normalizeScenario, simulate } from '../lib/simulator'
import type { AdjustableCategory, FinancialProfile, Scenario } from '../types/finance'
import { SummaryCards } from './SummaryCards'
import { ForecastChart } from './ForecastChart'
import { ScenarioControls } from './ScenarioControls'
import { OneTimeExpense } from './OneTimeExpense'
import { ImpactBreakdown } from './ImpactBreakdown'
import { SpendingBreakdown } from './SpendingBreakdown'
import { GoalCalculator } from './GoalCalculator'

export function Dashboard({ profile, forecastStart, onEdit, onStartOver, active }: { profile: FinancialProfile; forecastStart: string; onEdit: () => void; onStartOver: () => void; active: boolean }) {
  const baseline = useMemo(() => baselineFromProfile(profile), [profile])
  const [scenario, setScenario] = useState<Scenario>(defaultScenario)
  const [previousProfile, setPreviousProfile] = useState(profile)
  if (previousProfile !== profile) {
    setPreviousProfile(profile)
    setScenario(previous => normalizeScenario(previous, profile.monthlyIncome))
  }
  const [resetKey, setResetKey] = useState(0)
  const [resetNotice, setResetNotice] = useState('')
  const simulation = useMemo(() => simulate(baseline, profile.startingSavings, forecastStart, scenario), [baseline, profile.startingSavings, forecastStart, scenario])
  function changeCategory(category: AdjustableCategory, value: number) { setResetNotice(''); setScenario(previous => ({ ...previous, categoryAdjustments: { ...previous.categoryAdjustments, [category]: value } })) }
  function reset() { setScenario(defaultScenario()); setResetKey(key => key + 1); setResetNotice('Scenario reset. Your forecast matches the baseline.') }
  return <><a href="#main" className="skip-link">Skip to dashboard</a><header className="site-header"><div className="nav-inner"><a className="brand" href="#main" aria-label="MoneySandbox home"><span className="brand-mark"><Box size={23} strokeWidth={1.8} /></span><span>Money<span className="brand-light">Sandbox</span>{profile.source === 'demo' && <span className="beta-tag">DEMO</span>}</span></a><div className="nav-actions"><span className="synthetic-badge"><ShieldCheck size={14} />{profile.source === 'demo' ? 'Synthetic demo data' : 'Your entered estimates'}</span><button className="button reset-button" onClick={reset}><RotateCcw size={14} />Reset scenario</button></div></div></header>
    <main id="main" className="dashboard"><section className="profile-header"><div><div className="eyebrow">YOUR MONEY. YOUR POSSIBILITIES.</div><h1>{profile.name}’s financial sandbox<span className="heading-dot">.</span></h1><p>See how today’s choices change the next six months.</p><button className="button edit-profile-button" onClick={onEdit}><Pencil size={14} />Edit profile & baseline</button></div><div className="persona-chip"><span className="avatar">{Array.from(profile.name)[0].toLocaleUpperCase()}</span><div><strong>{profile.name}</strong><span>{profile.source === 'demo' ? 'Synthetic demo profile' : 'Your personal sandbox'}</span></div></div></section>
      <SummaryCards baseline={baseline} savings={profile.startingSavings} />
      <div className="workspace-heading"><span className="workspace-label"><span className="live-dot" /> THE SANDBOX</span><span className="muted text-xs">Change a variable. Explore a possibility.<ArrowUpRight size={13} /></span></div>
      <div className="workspace-grid"><div className="results-column">{active && <ForecastChart simulation={simulation} startingSavings={profile.startingSavings} />}<GoalCalculator startingSavings={profile.startingSavings} simulation={simulation} /><div className="breakdown-grid"><ImpactBreakdown simulation={simulation} /><SpendingBreakdown baseline={baseline} source={profile.source} /></div></div><aside className="controls-column" aria-label="Scenario builder"><ScenarioControls baseline={baseline} simulation={simulation} onCategory={changeCategory} onEdit={onEdit} onIncome={value => { setResetNotice(''); setScenario(previous => ({ ...previous, monthlyIncomeDelta: value })) }} /><OneTimeExpense key={resetKey} expense={scenario.oneTimeExpense} forecast={simulation.forecast} onChange={expense => { setResetNotice(''); setScenario(previous => ({ ...previous, oneTimeExpense: expense })) }} /><div className="sandbox-note"><CircleHelp size={16} /><p>A space to experiment.<br /><span>Adjustments explore possibilities. They’re never instructions on how to spend.</span></p></div></aside></div>
      <footer className="site-footer"><span><ShieldCheck size={13} />{profile.source === 'demo' ? 'Fictional profile.' : 'Manually entered estimates.'} No connected accounts.</span><button className="button" onClick={onStartOver}>Start over</button></footer><p role="status" className="sr-only">{resetNotice}</p>
    </main></>
}
