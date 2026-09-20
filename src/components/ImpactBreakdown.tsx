import { ArrowDownRight, ArrowUpRight, MoveUpRight, SlidersHorizontal } from 'lucide-react'
import type { Simulation } from '../lib/simulator'
import { formatCurrency, formatImpact } from '../lib/format'

export function ImpactBreakdown({ simulation }: { simulation: Simulation }) {
  return <section className="panel impact-panel" aria-labelledby="impact-title"><div className="panel-heading"><div><h2 id="impact-title">What’s changing?</h2><p className="muted text-xs mt-1">Every change, accounted for.</p></div><MoveUpRight size={18} className="muted" /></div>
    {simulation.hasChanges ? <><ul className="impact-list">{simulation.impacts.map(item => <li key={item.key}><span className={`impact-icon ${item.total < 0 ? 'negative' : 'positive'}`}>{item.total < 0 ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}</span><div><strong>{item.label}</strong><span className="muted">{item.monthlyAmount !== undefined ? `${formatImpact(item.key === 'income' ? item.monthlyAmount : -item.monthlyAmount)} / month${item.key === 'income' ? ' income' : ' spending'}` : 'One-time expense'}</span></div><strong className={item.total < 0 ? 'negative' : 'positive'}>{formatImpact(item.total)}</strong></li>)}</ul><div className="impact-total"><span>Net six-month impact</span><strong className={simulation.totalImpact < 0 ? 'negative' : 'positive'} data-testid="breakdown-total">{formatImpact(simulation.totalImpact)}</strong></div></> : <div className="empty-impact"><span className="empty-icon"><SlidersHorizontal size={24} /></span><strong>A new future starts with one change.</strong><p>Adjust a scenario to see its impact.<br />Your six-month breakdown will appear here.</p></div>}
    {simulation.hasChanges && <p className="muted text-xs mt-3">{formatCurrency(simulation.baselineEnding)} baseline {simulation.totalImpact < 0 ? '−' : '+'} {formatCurrency(Math.abs(simulation.totalImpact))} impact = {formatCurrency(simulation.scenarioEnding)} scenario.</p>}
  </section>
}
