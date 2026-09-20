import { Bike, Clapperboard, Coffee, Headphones, House, Package, ShoppingBag, ShoppingBasket, SlidersHorizontal, TrendingUp } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { adjustableCategories, type AdjustableCategory, type BudgetBaseline } from '../types/finance'
import { categoryLabels, type Simulation } from '../lib/simulator'
import { formatCurrency, formatImpact } from '../lib/format'

const icons = { dining: Coffee, entertainment: Clapperboard, subscriptions: Headphones, shopping: ShoppingBag, groceries: ShoppingBasket, transportation: Bike, housing: House, other: Package }
function track(value: number): CSSProperties {
  const position = (value + 100) / 2
  return { background: `linear-gradient(to right, #344053 ${Math.min(50, position)}%, #a3e8bc ${Math.min(50, position)}%, #a3e8bc ${Math.max(50, position)}%, #344053 ${Math.max(50, position)}%)` }
}
export function ScenarioControls({ baseline, simulation, onCategory, onIncome, onEdit }: { baseline: BudgetBaseline; simulation: Simulation; onCategory: (category: AdjustableCategory, value: number) => void; onIncome: (value: number) => void; onEdit: () => void }) {
  const { scenario } = simulation
  const minIncome = -Math.min(500, baseline.averageMonthlyIncome)
  const [incomeDraft, setIncomeDraft] = useState(String(scenario.monthlyIncomeDelta))
  const [previousIncome, setPreviousIncome] = useState(scenario.monthlyIncomeDelta)
  if (previousIncome !== scenario.monthlyIncomeDelta) {
    setPreviousIncome(scenario.monthlyIncomeDelta)
    setIncomeDraft(String(scenario.monthlyIncomeDelta))
  }
  return <section className="panel controls-panel" aria-labelledby="controls-title">
    <div className="panel-heading"><div><div className="eyebrow">CHANGE THE INPUTS</div><h2 id="controls-title">What if I…</h2></div><SlidersHorizontal size={19} className="muted" /></div>
    <p className="muted text-xs control-intro">Spend less or more. Zero keeps your baseline.</p>
    <div className="controls-list">{adjustableCategories.map(category => {
      const Icon = icons[category]
      const percent = Math.round(scenario.categoryAdjustments[category] * 100)
      const saving = simulation.impacts.find(item => item.key === category)?.monthlyAmount ?? 0
      const zeroBaseline = baseline.categoryAverages[category] === 0
      const label = percent === 0 ? 'Unchanged' : `Spend ${Math.abs(percent)}% ${percent < 0 ? 'less' : 'more'}`
      return <div className={`slider-control ${percent !== 0 ? 'is-active' : ''}`} key={category}>
        <div className="control-label"><label htmlFor={`slider-${category}`}><Icon size={15} />{categoryLabels[category]}</label><span>{zeroBaseline ? 'No baseline spending' : label}</span></div>
        <div className="signed-range"><input id={`slider-${category}`} type="range" min="-100" max="100" step="5" value={zeroBaseline ? 0 : percent} disabled={zeroBaseline} onChange={event => onCategory(category, Number(event.target.value) / 100)} aria-valuetext={`${label}, scenario spending ${formatCurrency(simulation.adjustedCategories[category])} per month`} aria-describedby={zeroBaseline ? `zero-${category}` : undefined} style={track(zeroBaseline ? 0 : percent)} /><span className="range-zero" aria-hidden="true">0</span></div>
        <div className="control-meta"><span>{formatCurrency(baseline.categoryAverages[category])} → <strong>{formatCurrency(simulation.adjustedCategories[category])}</strong> / mo</span><span className={saving > 0 ? 'positive' : saving < 0 ? 'negative' : 'dim'}>{saving > 0 ? `Saves ${formatCurrency(saving)}` : saving < 0 ? `Adds ${formatCurrency(-saving)}` : '−100% to +100%'}</span></div>
        {zeroBaseline && <p className="zero-baseline-note" id={`zero-${category}`}>A percentage of $0 stays $0. <button type="button" onClick={onEdit}>Edit baseline</button> to set a starting amount.</p>}
      </div>
    })}</div>
    <div className={`income-control ${scenario.monthlyIncomeDelta !== 0 ? 'is-active' : ''}`}>
      <div className="control-label"><label htmlFor="income-slider"><TrendingUp size={16} />Change monthly income</label><strong className={scenario.monthlyIncomeDelta < 0 ? 'negative' : 'positive'}>{formatImpact(scenario.monthlyIncomeDelta)}</strong></div>
      <div className="signed-range"><input id="income-slider" type="range" min="-500" max="500" step="0.01" value={scenario.monthlyIncomeDelta} onChange={event => onIncome(Math.max(minIncome, Number(event.target.value)))} aria-valuetext={`${formatImpact(scenario.monthlyIncomeDelta)} per month, resulting income ${formatCurrency(baseline.averageMonthlyIncome + scenario.monthlyIncomeDelta)}`} style={track(scenario.monthlyIncomeDelta / 5)} /><span className="range-zero" aria-hidden="true">0</span></div>
      <div className="income-exact"><label htmlFor="income-amount">Monthly income change ($)</label><input className="text-input" id="income-amount" type="number" min={minIncome} max="500" step="0.01" value={incomeDraft} onChange={event => { const value = event.target.value; setIncomeDraft(value); if (value.trim() && Number.isFinite(Number(value))) onIncome(Math.min(500, Math.max(minIncome, Number(value)))) }} onBlur={() => setIncomeDraft(String(scenario.monthlyIncomeDelta))} /></div>
      <div className="control-meta"><span>{formatCurrency(baseline.averageMonthlyIncome)} → {formatCurrency(baseline.averageMonthlyIncome + scenario.monthlyIncomeDelta)} / mo</span><span>±$500</span></div>
      {minIncome > -500 && <p className="zero-baseline-note">Decrease limited to {formatCurrency(-minIncome)} so total income stays at or above $0.</p>}
    </div>
    <div className="monthly-impact"><span>Monthly cash flow</span><strong className={simulation.monthlySurplus < 0 ? 'negative' : 'positive'}>{formatImpact(simulation.monthlySurplus)}<span> / mo</span></strong></div>
  </section>
}
