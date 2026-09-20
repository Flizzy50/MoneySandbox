import { Bike, Clapperboard, Coffee, Headphones, ShoppingBag, ShoppingBasket, SlidersHorizontal, TrendingUp } from 'lucide-react'
import type { CSSProperties } from 'react'
import { adjustableCategories, type AdjustableCategory, type Baseline, type Scenario } from '../types/finance'
import { categoryLabels, reductionLimits, type Simulation } from '../lib/simulator'
import { formatCurrency, formatPercent } from '../lib/format'

const icons = { dining: Coffee, entertainment: Clapperboard, subscriptions: Headphones, shopping: ShoppingBag, groceries: ShoppingBasket, transportation: Bike }
export function ScenarioControls({ baseline, simulation, onCategory, onIncome }: { baseline: Baseline; simulation: Simulation; onCategory: (category: AdjustableCategory, value: number) => void; onIncome: (value: number) => void }) {
  const scenario: Scenario = simulation.scenario
  return <section className="panel controls-panel" aria-labelledby="controls-title">
    <div className="panel-heading"><div><div className="eyebrow">CHANGE THE INPUTS</div><h2 id="controls-title">What if I…</h2></div><SlidersHorizontal size={19} className="muted" /></div>
    <p className="muted text-xs control-intro">Small adjustments. A different six months.</p>
    <div className="controls-list">{adjustableCategories.map(category => {
      const Icon = icons[category]
      const reduction = Math.round(-scenario.categoryAdjustments[category] * 100)
      const max = reductionLimits[category] * 100
      const saving = simulation.impacts.find(item => item.key === category)?.monthlyAmount ?? 0
      return <div className={`slider-control ${reduction > 0 ? 'is-active' : ''}`} key={category}>
        <div className="control-label"><label htmlFor={`slider-${category}`}><Icon size={15} /> {categoryLabels[category]}</label><span>{reduction > 0 ? `Spend ${reduction}% less` : 'Unchanged'}</span></div>
        <input id={`slider-${category}`} type="range" min="0" max={max} step="5" value={reduction} onChange={event => onCategory(category, -Number(event.target.value) / 100)} aria-valuetext={`${reduction}% reduction, saves ${formatCurrency(saving)} per month`} style={{ '--range-progress': `${reduction / max * 100}%` } as CSSProperties} />
        <div className="control-meta"><span>{formatCurrency(baseline.categoryAverages[category])}<span className="dim"> / mo baseline</span></span><span className={saving > 0 ? 'positive' : 'dim'}>{saving > 0 ? `Saves ${formatCurrency(saving)} / mo` : `Up to ${formatPercent(reductionLimits[category])} less`}</span></div>
      </div>
    })}</div>
    <div className={`income-control ${scenario.monthlyIncomeDelta > 0 ? 'is-active' : ''}`}><div className="control-label"><label htmlFor="income-slider"><TrendingUp size={16} /> Earn extra each month</label><strong className="positive">+{formatCurrency(scenario.monthlyIncomeDelta)}</strong></div><input id="income-slider" type="range" min="0" max="500" step="25" value={scenario.monthlyIncomeDelta} onChange={event => onIncome(Number(event.target.value))} aria-valuetext={`${formatCurrency(scenario.monthlyIncomeDelta)} extra per month`} style={{ '--range-progress': `${scenario.monthlyIncomeDelta / 5}%` } as CSSProperties} /><div className="control-meta"><span>$0</span><span>$500 / month</span></div></div>
    <div className="monthly-impact"><span>Monthly cash flow</span><strong className={simulation.monthlySurplus < 0 ? 'negative' : 'positive'}>{simulation.monthlySurplus > 0 ? '+' : ''}{formatCurrency(simulation.monthlySurplus)}<span> / mo</span></strong></div>
  </section>
}
