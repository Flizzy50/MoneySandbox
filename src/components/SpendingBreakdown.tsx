import type { BudgetBaseline, FinancialProfile } from '../types/finance'
import { categoryLabels } from '../lib/simulator'
import { formatCurrency } from '../lib/format'
import type { ExpenseCategory } from '../types/finance'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const colors: Record<ExpenseCategory, string> = { housing: '#8c9cce', groceries: '#a3c8b1', dining: '#c2aaed', transportation: '#78b6c5', subscriptions: '#b8be8e', entertainment: '#d4ae82', shopping: '#c18aa4', other: '#6d7b91' }
export function SpendingBreakdown({ baseline, source }: { baseline: BudgetBaseline; source: FinancialProfile['source'] }) {
  const categories = (Object.entries(baseline.categoryAverages) as [ExpenseCategory, number][]).sort((a, b) => b[1] - a[1])
  const chartData = categories.map(([category, amount]) => ({ name: categoryLabels[category], value: amount, category }))
  return <section className="panel spending-panel" aria-labelledby="spending-title"><div className="panel-heading"><div><h2 id="spending-title">Where it goes</h2><p className="muted text-xs mt-1">Your baseline monthly spending</p></div><span className="small-tag">Baseline / mo</span></div>
    <div className="spending-chart" role="img" aria-label={`Baseline spending pie chart totaling ${formatCurrency(baseline.averageMonthlyExpenses)} per month`}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 240, height: 180 }}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="54%" outerRadius="82%" paddingAngle={2} stroke="#121b29" strokeWidth={2} isAnimationActive={false}>
            {chartData.map(item => <Cell key={item.category} fill={colors[item.category as ExpenseCategory]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: '#192331', border: '1px solid #384657', borderRadius: 10, fontSize: 11, color: '#f1f5f9' }} formatter={(value) => [formatCurrency(Number(value)), 'Monthly']} />
        </PieChart>
      </ResponsiveContainer>
      <div className="spending-chart-total"><strong>{formatCurrency(baseline.averageMonthlyExpenses)}</strong><span>/ month</span></div>
    </div>
    <ul className="spending-list">{categories.map(([category, amount]) => <li key={category}><span><i style={{ background: colors[category] }} />{categoryLabels[category]}</span><strong>{formatCurrency(amount)}</strong></li>)}</ul><div className="spending-total"><span>Total monthly spending</span><strong>{formatCurrency(baseline.averageMonthlyExpenses)}</strong></div>
    <details className="data-details"><summary>How is this calculated?</summary><p>{source === 'demo' ? 'Demo estimates are calculated from six complete months of fictional transactions (March–August 2026).' : 'Your baseline uses the monthly income and category estimates you entered. Edit profile & baseline to change them.'} These amounts repeat for the next six months. Scenario controls change only the scenario forecast. Forecasts exclude interest, inflation and unexpected costs.</p></details>
  </section>
}
