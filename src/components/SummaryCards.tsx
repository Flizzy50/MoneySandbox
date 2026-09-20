import { ArrowDownLeft, ArrowUpRight, Wallet, PiggyBank } from 'lucide-react'
import type { BudgetBaseline } from '../types/finance'
import { formatCurrency, formatImpact } from '../lib/format'

export function SummaryCards({ baseline, savings }: { baseline: BudgetBaseline; savings: number }) {
  const cards = [
    { label: 'Monthly income', value: formatCurrency(baseline.averageMonthlyIncome), detail: 'Baseline take-home income', icon: ArrowDownLeft, color: 'mint' },
    { label: 'Monthly spending', value: formatCurrency(baseline.averageMonthlyExpenses), detail: 'Baseline across all categories', icon: ArrowUpRight, color: 'lavender' },
    { label: 'Monthly surplus', value: formatImpact(baseline.monthlySurplus), detail: 'Income minus spending', icon: PiggyBank, color: 'amber' },
    { label: 'Current savings', value: formatCurrency(savings), detail: 'Your simulation starts here', icon: Wallet, color: 'blue' },
  ]
  return <section className="summary-grid" aria-label="Your current finances">{cards.map(({ label, value, detail, icon: Icon, color }) =>
    <article className="summary-card" key={label}><div className="flex items-center justify-between"><span className="muted text-sm">{label}</span><span className={`icon-tile ${color}`}><Icon size={17} /></span></div><p className="summary-value">{value}</p><p className="muted text-xs">{detail}</p></article>,
  )}</section>
}
