import { useState } from 'react'
import { Flag, ArrowRight, Check } from 'lucide-react'
import { calculateGoal, MAX_ONE_TIME_EXPENSE, type Simulation } from '../lib/simulator'
import { formatCurrency } from '../lib/format'

export function GoalCalculator({ startingSavings, simulation }: { startingSavings: number; simulation: Simulation }) {
  const [input, setInput] = useState('2000')
  const [target, setTarget] = useState(2000)
  const value = Number(input)
  const valid = input.trim() !== '' && Number.isFinite(value) && value >= 0 && value <= MAX_ONE_TIME_EXPENSE
  const goal = calculateGoal(target, startingSavings, simulation.scenarioEnding)
  return <section className="panel goal-panel" aria-labelledby="goal-title"><div className="goal-top"><div className="flex items-center gap-3"><span className="goal-icon"><Flag size={19} /></span><div><h2 id="goal-title">A future to aim for</h2><p className="muted text-xs mt-1">Set a savings goal for the next 6 months.</p></div></div><div className="goal-input"><label className="field-label" htmlFor="savings-goal">Target savings ($)</label><input id="savings-goal" type="number" className="text-input" min="0" max={MAX_ONE_TIME_EXPENSE} step="1" value={input} aria-invalid={!valid} aria-describedby={!valid ? 'goal-error' : undefined} onChange={event => { const next = event.target.value; setInput(next); const parsed = Number(next); if (next.trim() !== '' && Number.isFinite(parsed) && parsed >= 0 && parsed <= MAX_ONE_TIME_EXPENSE) setTarget(parsed) }} /></div></div>
    {!valid && <p role="alert" id="goal-error" className="field-error">Enter a target from $0 to $1,000,000. Showing the last valid goal.</p>}
    <div className="goal-progress" role="progressbar" aria-label="Scenario toward savings goal" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(goal.progress)}><span style={{ width: `${goal.progress}%` }} /></div>
    <div className="goal-result"><span>{goal.gap > 0 ? <ArrowRight size={15} /> : <Check size={15} />}{goal.gap > 0 ? <>You’re projected to be <strong>{formatCurrency(goal.gap)} short</strong> of this goal.</> : goal.excess > 0 ? <>You’re projected to beat this goal by <strong>{formatCurrency(goal.excess)}.</strong></> : <strong>You’re projected to meet this goal.</strong>}</span><span className="muted text-xs">{Math.round(goal.progress)}% of goal</span></div>
    <div className="goal-metrics"><span>Baseline <strong>{formatCurrency(simulation.baselineEnding)}</strong></span><span>Scenario <strong>{formatCurrency(simulation.scenarioEnding)}</strong></span><span>Required savings <strong>{formatCurrency(goal.requiredMonthlySavings)} / mo</strong></span></div>
  </section>
}
