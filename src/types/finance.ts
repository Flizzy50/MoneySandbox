export const expenseCategories = ['housing', 'groceries', 'dining', 'transportation', 'subscriptions', 'entertainment', 'shopping', 'other'] as const
export type ExpenseCategory = typeof expenseCategories[number]
export type TransactionCategory = 'income' | ExpenseCategory
export interface Transaction {
  id: string
  date: string
  merchant: string
  amount: number
  type: 'income' | 'expense'
  category: TransactionCategory
}
export const adjustableCategories = ['dining', 'entertainment', 'subscriptions', 'shopping', 'groceries', 'transportation', 'housing', 'other'] as const
export type AdjustableCategory = typeof adjustableCategories[number]
export interface Scenario {
  categoryAdjustments: Record<AdjustableCategory, number>
  monthlyIncomeDelta: number
  oneTimeExpense?: { amount: number; monthIndex: number; label: string }
}
export interface MonthlySummary { month: string; income: number; expenses: number }
export interface BudgetBaseline {
  averageMonthlyIncome: number
  averageMonthlyExpenses: number
  monthlySurplus: number
  categoryAverages: Record<ExpenseCategory, number>
}
export interface Baseline extends BudgetBaseline {
  totalHistoricalSpending: number
  months: MonthlySummary[]
}
export interface FinancialProfile {
  name: string
  monthlyIncome: number
  startingSavings: number
  monthlySpending: Record<ExpenseCategory, number>
  source: 'manual' | 'demo'
}
export interface ForecastPoint {
  month: string
  monthLabel: string
  baselineBalance: number
  scenarioBalance: number
}
export interface ImpactItem {
  key: string
  label: string
  monthlyAmount?: number
  total: number
}
