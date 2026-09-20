import { adjustableCategories, expenseCategories, type BudgetBaseline, type ForecastPoint, type ImpactItem, type Scenario } from '../types/finance'
import { addMonths, fromCents, roundMoney, toCents } from './finance'
import { monthLabel } from './format'

export const FORECAST_MONTHS = 6
export const MAX_ONE_TIME_EXPENSE = 1_000_000
export const categoryLabels = { housing: 'Housing', dining: 'Dining', entertainment: 'Entertainment', subscriptions: 'Subscriptions', shopping: 'Shopping', groceries: 'Groceries', transportation: 'Transportation', other: 'Other' }
export const clamp = (value: number, min: number, max: number): number => Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min

export function defaultScenario(): Scenario {
  return { categoryAdjustments: { dining: 0, entertainment: 0, subscriptions: 0, shopping: 0, groceries: 0, transportation: 0, housing: 0, other: 0 }, monthlyIncomeDelta: 0 }
}
export function normalizeScenario(scenario: Scenario, monthlyIncome = 500): Scenario {
  const adjustments = { ...defaultScenario().categoryAdjustments }
  for (const category of adjustableCategories) {
    const value = scenario.categoryAdjustments[category]
    adjustments[category] = Number.isFinite(value) ? clamp(value, -1, 1) : 0
  }
  const incomeDelta = Number.isFinite(scenario.monthlyIncomeDelta) ? scenario.monthlyIncomeDelta : 0
  const result: Scenario = { categoryAdjustments: adjustments, monthlyIncomeDelta: roundMoney(clamp(incomeDelta, -Math.min(500, Math.max(0, monthlyIncome)), 500)) }
  const expense = scenario.oneTimeExpense
  if (expense && Number.isFinite(expense.amount) && expense.amount > 0 && Number.isInteger(expense.monthIndex) && expense.monthIndex >= 0 && expense.monthIndex < FORECAST_MONTHS) {
    result.oneTimeExpense = { amount: roundMoney(clamp(expense.amount, 0, MAX_ONE_TIME_EXPENSE)), monthIndex: expense.monthIndex, label: expense.label.trim().slice(0, 60) || 'One-time expense' }
  }
  return result
}
export function simulate(baseline: BudgetBaseline, startingSavings: number, forecastStart: string, input: Scenario) {
  if (!Number.isFinite(startingSavings) || Math.abs(startingSavings) > 1e9) throw new Error('Invalid starting savings.')
  const scenario = normalizeScenario(input, baseline.averageMonthlyIncome)
  const adjustedCategories = { ...baseline.categoryAverages }
  const impacts: ImpactItem[] = []
  for (const category of adjustableCategories) {
    adjustedCategories[category] = roundMoney(baseline.categoryAverages[category] * (1 + scenario.categoryAdjustments[category]))
    const savedCents = toCents(baseline.categoryAverages[category]) - toCents(adjustedCategories[category])
    if (savedCents !== 0) impacts.push({ key: category, label: categoryLabels[category], monthlyAmount: fromCents(savedCents), total: fromCents(savedCents * FORECAST_MONTHS) })
  }
  if (scenario.monthlyIncomeDelta !== 0) impacts.push({ key: 'income', label: scenario.monthlyIncomeDelta > 0 ? 'Extra income' : 'Reduced income', monthlyAmount: scenario.monthlyIncomeDelta, total: fromCents(toCents(scenario.monthlyIncomeDelta) * FORECAST_MONTHS) })
  if (scenario.oneTimeExpense) impacts.push({ key: 'expense', label: scenario.oneTimeExpense.label, total: -scenario.oneTimeExpense.amount })
  const expenseCents = expenseCategories.reduce((sum, category) => sum + toCents(adjustedCategories[category]), 0)
  const baselineSurplus = toCents(baseline.monthlySurplus)
  const scenarioSurplus = toCents(baseline.averageMonthlyIncome) + toCents(scenario.monthlyIncomeDelta) - expenseCents
  let baselineBalance = toCents(startingSavings)
  let scenarioBalance = baselineBalance
  const forecast: ForecastPoint[] = Array.from({ length: FORECAST_MONTHS }, (_, index) => {
    baselineBalance += baselineSurplus
    scenarioBalance += scenarioSurplus - (scenario.oneTimeExpense?.monthIndex === index ? toCents(scenario.oneTimeExpense.amount) : 0)
    const month = addMonths(forecastStart, index)
    return { month, monthLabel: monthLabel(month), baselineBalance: fromCents(baselineBalance), scenarioBalance: fromCents(scenarioBalance) }
  })
  return {
    scenario, forecast, impacts, adjustedCategories, adjustedMonthlyExpenses: fromCents(expenseCents),
    monthlySurplus: fromCents(scenarioSurplus), monthlyImprovement: fromCents(scenarioSurplus - baselineSurplus),
    baselineEnding: fromCents(baselineBalance), scenarioEnding: fromCents(scenarioBalance),
    totalImpact: fromCents(scenarioBalance - baselineBalance), hasChanges: impacts.length > 0,
    lowestBalance: Math.min(...forecast.map(point => point.scenarioBalance)),
  }
}
export type Simulation = ReturnType<typeof simulate>

export function calculateGoal(target: number, startingSavings: number, projectedBalance: number) {
  const safeTarget = roundMoney(clamp(target, 0, MAX_ONE_TIME_EXPENSE))
  return {
    target: safeTarget,
    requiredMonthlySavings: roundMoney(Math.max(0, safeTarget - startingSavings) / FORECAST_MONTHS),
    gap: roundMoney(Math.max(0, safeTarget - projectedBalance)),
    excess: roundMoney(Math.max(0, projectedBalance - safeTarget)),
    progress: safeTarget === 0 ? 100 : clamp(projectedBalance / safeTarget * 100, 0, 100),
  }
}
