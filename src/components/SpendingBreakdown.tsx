import type { Baseline } from '../types/finance'
import { categoryLabels } from '../lib/simulator'
import { formatCurrency } from '../lib/format'
import type { ExpenseCategory } from '../types/finance'

const colors: Record<ExpenseCategory, string> = { housing: '#8c9cce', groceries: '#a3c8b1', dining: '#c2aaed', transportation: '#78b6c5', subscriptions: '#b8be8e', entertainment: '#d4ae82', shopping: '#c18aa4', other: '#6d7b91' }
export function SpendingBreakdown({ baseline }: { baseline: Baseline }) {
  const categories = (Object.entries(baseline.categoryAverages) as [ExpenseCategory, number][]).sort((a, b) => b[1] - a[1])
  return <section className="panel spending-panel" aria-labelledby="spending-title"><div className="panel-heading"><div><h2 id="spending-title">Where it goes</h2><p className="muted text-xs mt-1">Your baseline monthly spending</p></div><span className="small-tag">Average / mo</span></div>
    <div className="spending-stack" aria-hidden="true">{categories.map(([category, amount]) => <span key={category} style={{ width: `${baseline.averageMonthlyExpenses ? amount / baseline.averageMonthlyExpenses * 100 : 0}%`, background: colors[category] }} />)}</div>
    <ul className="spending-list">{categories.map(([category, amount]) => <li key={category}><span><i style={{ background: colors[category] }} />{categoryLabels[category]}</span><strong>{formatCurrency(amount)}</strong></li>)}</ul><div className="spending-total"><span>Total monthly spending</span><strong>{formatCurrency(baseline.averageMonthlyExpenses)}</strong></div>
    <details className="data-details"><summary>How is this calculated?</summary><p>Monthly averages from six complete months of fictional transactions (March–August 2026). Total historical spending: {formatCurrency(baseline.totalHistoricalSpending)}. Income, housing and other spending stay fixed unless a control changes them. Forecasts exclude interest, inflation and unexpected costs.</p></details>
  </section>
}
