import { ArrowUpRight, ChartNoAxesCombined, ChevronDown, TriangleAlert } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency, formatImpact, monthLabel } from '../lib/format'
import type { Simulation } from '../lib/simulator'

export function ForecastChart({ simulation, startingSavings }: { simulation: Simulation; startingSavings: number }) {
  const { forecast, baselineEnding, scenarioEnding, totalImpact, hasChanges, scenario } = simulation
  const expense = scenario.oneTimeExpense
  return <section className="panel forecast-panel" aria-labelledby="forecast-title">
    <div className="panel-heading"><div><div className="eyebrow">THE BIG PICTURE</div><h2 id="forecast-title">Your next 6 months</h2></div><span className="small-tag">{forecast[0].monthLabel} {forecast[0].month.slice(0, 4)} – {forecast[5].monthLabel} {forecast[5].month.slice(0, 4)}</span></div>
    <div className="forecast-numbers">
      <div><span className="muted text-xs">Baseline balance</span><p data-testid="baseline-ending">{formatCurrency(baselineEnding)}</p></div>
      <div><span className="muted text-xs">Scenario balance</span><p className={hasChanges ? (scenarioEnding < 0 ? 'negative' : 'positive') : ''} data-testid="scenario-ending">{formatCurrency(scenarioEnding)}</p></div>
      <div className={`impact-pill ${totalImpact < 0 ? 'loss' : ''}`} aria-live="polite">{hasChanges ? <><ArrowUpRight size={17} className={totalImpact < 0 ? 'rotate-90' : ''} /><strong data-testid="net-impact">{formatImpact(totalImpact)}</strong><span>vs. baseline</span></> : <><ChartNoAxesCombined size={17} /><span>Your future is ready to explore</span></>}</div>
    </div>
    <div className="chart-legend"><span><i className="legend-line baseline" /> Baseline</span><span className={!hasChanges ? 'muted' : ''}><i className="legend-line scenario" /> Your scenario</span><span className="chart-axis-caption">Savings balance · USD</span></div>
    <div className="chart-container" role="img" aria-label={`Six-month savings forecast. Baseline ends at ${formatCurrency(baselineEnding)}. Scenario ends at ${formatCurrency(scenarioEnding)}. Monthly values are available below.`}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 650, height: 260 }}>
        <LineChart data={forecast} margin={{ top: 18, right: 18, bottom: 3, left: 0 }} accessibilityLayer>
          <CartesianGrid stroke="#283241" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} tick={{ fill: '#9ba8bb', fontSize: 12 }} dy={9} padding={{ left: 15, right: 12 }} />
          <YAxis tickFormatter={value => formatCurrency(value)} width={76} tickLine={false} axisLine={false} tick={{ fill: '#9ba8bb', fontSize: 11 }} domain={[(min: number) => Math.min(0, Math.floor(min / 250) * 250), (max: number) => Math.max(2000, Math.ceil(max / 500) * 500)]} tickCount={5} />
          <Tooltip contentStyle={{ background: '#192331', border: '1px solid #384657', borderRadius: 10, fontSize: 12, color: '#f1f5f9' }} labelStyle={{ color: '#c4cedb', marginBottom: 6 }} formatter={(value, name) => [formatCurrency(Number(value)), name]} cursor={{ stroke: '#617087', strokeDasharray: '3 4' }} />
          {simulation.lowestBalance < 0 && <ReferenceLine y={0} stroke="#e99a91" strokeDasharray="5 5" />}
          {expense && <ReferenceLine x={forecast[expense.monthIndex].monthLabel} stroke="#77728b" strokeDasharray="3 5" />}
          <Line name="Baseline" type="linear" dataKey="baselineBalance" stroke="#98a7c1" strokeWidth={2} strokeDasharray={hasChanges ? '5 5' : undefined} dot={{ r: 3, fill: '#98a7c1', strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} />
          {hasChanges && <Line name="Your scenario" type="linear" dataKey="scenarioBalance" stroke="#a3e8bc" strokeWidth={3} dot={{ r: 4, fill: '#a3e8bc', stroke: '#14251e', strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
    <div className="chart-note"><span>Starting with <strong>{formatCurrency(startingSavings)}</strong> in savings</span>{expense ? <span className="expense-marker">{monthLabel(forecast[expense.monthIndex].month)} · {expense.label} <strong>{formatCurrency(-expense.amount)}</strong></span> : <span>Month-end balances</span>}</div>
    {simulation.lowestBalance < 0 && <p className="balance-warning"><TriangleAlert size={15} /> This scenario dips below $0. Lowest month-end balance: {formatCurrency(simulation.lowestBalance)}.</p>}
    <details className="forecast-details"><summary>View monthly forecast <ChevronDown size={13} /></summary><table><caption className="sr-only">Forecast month-end balances in US dollars</caption><thead><tr><th>Month</th><th>Baseline</th><th>Scenario</th><th>Difference</th></tr></thead><tbody>{forecast.map(point => <tr key={point.month}><th scope="row">{monthLabel(point.month, true)}</th><td>{formatCurrency(point.baselineBalance)}</td><td>{formatCurrency(point.scenarioBalance)}</td><td>{formatImpact(point.scenarioBalance - point.baselineBalance)}</td></tr>)}</tbody></table></details>
  </section>
}
