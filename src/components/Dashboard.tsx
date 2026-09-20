import { useMemo, useState } from 'react'
import { Box, GraduationCap, RotateCcw, ShieldCheck, CircleHelp, ArrowUpRight } from 'lucide-react'
import { alexProfile, alexTransactions } from '../data/alexTransactions'
import { calculateBaseline } from '../lib/finance'
import { defaultScenario, simulate } from '../lib/simulator'
import type { AdjustableCategory, Scenario } from '../types/finance'
import { SummaryCards } from './SummaryCards'
import { ForecastChart } from './ForecastChart'
import { ScenarioControls } from './ScenarioControls'
import { OneTimeExpense } from './OneTimeExpense'
import { ImpactBreakdown } from './ImpactBreakdown'
import { SpendingBreakdown } from './SpendingBreakdown'
import { GoalCalculator } from './GoalCalculator'

const baseline = calculateBaseline(alexTransactions, alexProfile.historyStart, alexProfile.historyEnd)
export function Dashboard() {
  const [scenario, setScenario] = useState<Scenario>(defaultScenario)
  const [resetKey, setResetKey] = useState(0)
  const [resetNotice, setResetNotice] = useState('')
  const simulation = useMemo(() => simulate(baseline, alexProfile.startingSavings, alexProfile.forecastStart, scenario), [scenario])
  function changeCategory(category: AdjustableCategory, value: number) { setResetNotice(''); setScenario(previous => ({ ...previous, categoryAdjustments: { ...previous.categoryAdjustments, [category]: value } })) }
  function reset() { setScenario(defaultScenario()); setResetKey(key => key + 1); setResetNotice('Scenario reset. Your forecast matches the baseline.') }
  return <><a href="#main" className="skip-link">Skip to dashboard</a><header className="site-header"><div className="nav-inner"><a className="brand" href="#main" aria-label="MoneySandbox home"><span className="brand-mark"><Box size={23} strokeWidth={1.8} /></span><span>Money<span className="brand-light">Sandbox</span><span className="beta-tag">DEMO</span></span></a><div className="nav-actions"><span className="synthetic-badge"><ShieldCheck size={14} /> Synthetic Financial Data</span><button className="button reset-button" onClick={reset}><RotateCcw size={14} />Reset scenario</button></div></div></header>
    <main id="main" className="dashboard"><section className="profile-header"><div><div className="eyebrow">YOUR MONEY. YOUR POSSIBILITIES.</div><h1>Alex’s financial sandbox<span className="heading-dot">.</span></h1><p>See how today’s choices change the next six months.</p></div><div className="persona-chip"><span className="avatar">A</span><div><strong>Meet Alex</strong><span><GraduationCap size={13} /> College student · Part-time income</span></div></div></section>
      <SummaryCards baseline={baseline} savings={alexProfile.startingSavings} />
      <div className="workspace-heading"><span className="workspace-label"><span className="live-dot" /> THE SANDBOX</span><span className="muted text-xs">Change a variable. Explore a possibility.<ArrowUpRight size={13} /></span></div>
      <div className="workspace-grid"><div className="results-column"><ForecastChart simulation={simulation} startingSavings={alexProfile.startingSavings} /><GoalCalculator startingSavings={alexProfile.startingSavings} simulation={simulation} /><div className="breakdown-grid"><ImpactBreakdown simulation={simulation} /><SpendingBreakdown baseline={baseline} /></div></div><aside className="controls-column" aria-label="Scenario builder"><ScenarioControls baseline={baseline} simulation={simulation} onCategory={changeCategory} onIncome={value => { setResetNotice(''); setScenario(previous => ({ ...previous, monthlyIncomeDelta: value })) }} /><OneTimeExpense key={resetKey} expense={scenario.oneTimeExpense} forecast={simulation.forecast} onChange={expense => { setResetNotice(''); setScenario(previous => ({ ...previous, oneTimeExpense: expense })) }} /><div className="sandbox-note"><CircleHelp size={16} /><p>A space to experiment.<br /><span>Adjustments explore possibilities. They’re never instructions on how to spend.</span></p></div></aside></div>
      <footer className="site-footer"><span><ShieldCheck size={13} /> Fictional profile. Real calculations. No connected accounts.</span><span>MoneySandbox <span className="dim">/</span> Built for what’s next.</span></footer><p role="status" className="sr-only">{resetNotice}</p>
    </main></>
}
