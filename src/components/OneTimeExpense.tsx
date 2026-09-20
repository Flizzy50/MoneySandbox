import { useState, type FormEvent } from 'react'
import { Plus, ReceiptText, X, Check } from 'lucide-react'
import type { ForecastPoint, Scenario } from '../types/finance'
import { MAX_ONE_TIME_EXPENSE } from '../lib/simulator'
import { formatCurrency, monthLabel } from '../lib/format'

export function OneTimeExpense({ expense, forecast, onChange }: { expense: Scenario['oneTimeExpense']; forecast: ForecastPoint[]; onChange: (expense: Scenario['oneTimeExpense']) => void }) {
  const [label, setLabel] = useState(expense?.label ?? 'Laptop')
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '700')
  const [monthIndex, setMonthIndex] = useState(expense?.monthIndex ?? 2)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    const value = Number(amount)
    if (amount.trim() === '' || !Number.isFinite(value) || value < 0 || value > MAX_ONE_TIME_EXPENSE) { setError('Enter an amount from $0 to $1,000,000.'); return }
    if (Math.abs(value * 100 - Math.round(value * 100)) > .00001) { setError('Use no more than two decimal places.'); return }
    if (!label.trim()) { setError('Add a short description for this expense.'); return }
    setError('')
    onChange(value === 0 ? undefined : { label: label.trim(), amount: value, monthIndex })
    setNotice(value === 0 ? 'A $0 expense has no effect on your forecast.' : `${label.trim()} applied in ${monthLabel(forecast[monthIndex].month)}.`)
  }
  const isSaved = expense && expense.label === label.trim() && expense.amount === Number(amount) && expense.monthIndex === monthIndex
  return <section className="panel expense-panel" aria-labelledby="expense-title"><div className="flex items-center gap-2"><ReceiptText size={17} className="lavender-text" /><h2 id="expense-title">Add a one-time expense</h2></div><p className="muted text-xs mt-2 mb-5">Plan a purchase. See the tradeoff.</p>
    <form noValidate onSubmit={submit}>
      <label className="field-label" htmlFor="expense-description">Description</label><input className="text-input" id="expense-description" value={label} maxLength={60} onChange={event => { setLabel(event.target.value); setNotice('') }} placeholder="e.g. Laptop" />
      <div className="expense-inputs"><div><label className="field-label" htmlFor="expense-amount">Amount ($)</label><input className="text-input" id="expense-amount" type="number" min="0" max={MAX_ONE_TIME_EXPENSE} step="0.01" value={amount} aria-invalid={Boolean(error)} aria-describedby={error ? 'expense-error' : undefined} onChange={event => { setAmount(event.target.value); setError(''); setNotice('') }} /></div><div><label className="field-label" htmlFor="expense-month">Month</label><select className="text-input" id="expense-month" value={monthIndex} onChange={event => { setMonthIndex(Number(event.target.value)); setNotice('') }}>{forecast.map((point, index) => <option key={point.month} value={index}>{monthLabel(point.month, true)}</option>)}</select></div></div>
      {error && <p className="field-error" id="expense-error" role="alert">{error}</p>}
      <div className="flex items-center gap-2 mt-4"><button type="submit" className="button expense-button" disabled={Boolean(isSaved)}>{isSaved ? <Check size={15} /> : <Plus size={15} />}{isSaved ? 'Expense applied' : expense ? 'Update expense' : 'Add to scenario'}</button>{expense && <button type="button" className="icon-button" aria-label="Remove one-time expense" onClick={() => { onChange(undefined); setNotice('Expense removed.'); setError('') }}><X size={17} /></button>}</div>
      <p className="expense-status" role="status">{notice || (expense ? `${formatCurrency(expense.amount)} included in your scenario.` : 'Only your scenario will change.')}</p>
    </form>
  </section>
}
