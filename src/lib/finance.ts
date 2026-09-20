import { expenseCategories, type Baseline, type BudgetBaseline, type FinancialProfile, type ExpenseCategory, type Transaction } from '../types/finance'

export const toCents = (amount: number): number => Math.round(amount * 100)
export const fromCents = (amount: number): number => amount / 100
export const roundMoney = (amount: number): number => fromCents(toCents(amount))

export function baselineFromProfile(profile: FinancialProfile): BudgetBaseline {
  const categoryAverages = { ...profile.monthlySpending }
  const expenseCents = expenseCategories.reduce((sum, category) => sum + toCents(categoryAverages[category]), 0)
  return {
    averageMonthlyIncome: profile.monthlyIncome,
    averageMonthlyExpenses: fromCents(expenseCents),
    monthlySurplus: fromCents(toCents(profile.monthlyIncome) - expenseCents),
    categoryAverages,
  }
}

export function nextForecastMonth(now = new Date()): string {
  return addMonths(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, 1)
}

export function addMonths(month: string, offset: number): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Use a valid YYYY-MM month.')
  const [year, index] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, index - 1 + offset, 1))
  return date.toISOString().slice(0, 7)
}

/** Inclusive, complete months; missing activity in a month counts as zero. */
export function calculateBaseline(transactions: readonly Transaction[], startMonth: string, endMonth: string): Baseline {
  addMonths(startMonth, 0); addMonths(endMonth, 0)
  if (endMonth < startMonth) throw new Error('History end must follow its start.')
  const months = []
  for (let month = startMonth; month <= endMonth; month = addMonths(month, 1)) {
    if (months.length >= 1200) throw new Error('History window is too large.')
    months.push({ month, income: 0, expenses: 0 })
  }
  const byMonth = new Map(months.map(month => [month.month, month]))
  const categoryCents = Object.fromEntries(expenseCategories.map(category => [category, 0])) as Record<ExpenseCategory, number>
  for (const transaction of transactions) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction.date) || !Number.isFinite(transaction.amount) || transaction.amount <= 0 || transaction.amount > 1e9) throw new Error('Invalid transaction.')
    const parsed = new Date(`${transaction.date}T12:00:00Z`)
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== transaction.date) throw new Error('Invalid transaction date.')
    if ((transaction.type !== 'income' && transaction.type !== 'expense') || (transaction.type === 'income' ? transaction.category !== 'income' : !expenseCategories.includes(transaction.category as ExpenseCategory))) throw new Error('Transaction category must match its type.')
    const month = byMonth.get(transaction.date.slice(0, 7))
    if (!month) continue
    const cents = toCents(transaction.amount)
    if (transaction.type === 'income') month.income += cents
    else { month.expenses += cents; categoryCents[transaction.category as ExpenseCategory] += cents }
  }
  const categoryAverages = Object.fromEntries(expenseCategories.map(category => [category, fromCents(Math.round(categoryCents[category] / months.length))])) as Record<ExpenseCategory, number>
  const incomeCents = Math.round(months.reduce((sum, month) => sum + month.income, 0) / months.length)
  // Round each category once; summing those cents keeps the budget and simulator reconciled.
  const expenseCents = expenseCategories.reduce((sum, category) => sum + toCents(categoryAverages[category]), 0)
  return {
    averageMonthlyIncome: fromCents(incomeCents), averageMonthlyExpenses: fromCents(expenseCents),
    monthlySurplus: fromCents(incomeCents - expenseCents), categoryAverages,
    totalHistoricalSpending: fromCents(months.reduce((sum, month) => sum + month.expenses, 0)),
    months: months.map(month => ({ month: month.month, income: fromCents(month.income), expenses: fromCents(month.expenses) })),
  }
}
