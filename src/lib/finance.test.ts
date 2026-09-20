import { describe, expect, it } from 'vitest'
import { alexProfile, alexTransactions } from '../data/alexTransactions'
import { addMonths, calculateBaseline } from './finance'
import { calculateGoal, defaultScenario, normalizeScenario, simulate } from './simulator'
import type { Transaction } from '../types/finance'

const baseline = calculateBaseline(alexTransactions, alexProfile.historyStart, alexProfile.historyEnd)
const run = (scenario = defaultScenario()) => simulate(baseline, 900, '2026-09', scenario)
describe('historical aggregation', () => {
  it('uses six complete months and calculates income, expenses and surplus from records', () => {
    expect(baseline.months).toHaveLength(6)
    expect(baseline.averageMonthlyIncome).toBe(1650)
    expect(baseline.averageMonthlyExpenses).toBe(1625)
    expect(baseline.monthlySurplus).toBe(25)
    expect(baseline.totalHistoricalSpending).toBe(9750)
  })
  it('calculates category averages', () => {
    expect(baseline.categoryAverages).toEqual({ housing: 750, groceries: 250, dining: 260, transportation: 95, subscriptions: 55, entertainment: 85, shopping: 90, other: 40 })
  })
  it('counts missing months and categories as zero and filters outside the window', () => {
    const records: Transaction[] = [{ id: '1', date: '2026-03-01', merchant: 'Demo', amount: 100, type: 'income', category: 'income' }, { id: '2', date: '2026-05-01', merchant: 'Demo', amount: 200, type: 'income', category: 'income' }]
    expect(calculateBaseline(records, '2026-03', '2026-04').averageMonthlyIncome).toBe(50)
    expect(calculateBaseline([], '2026-03', '2026-08').categoryAverages.dining).toBe(0)
  })
  it('rejects invalid history and transaction data', () => {
    expect(() => calculateBaseline([], '2026-08', '2026-03')).toThrow()
    for (const amount of [-1, 0, NaN, Infinity]) expect(() => calculateBaseline([{ ...alexTransactions[0], amount }], '2026-03', '2026-08')).toThrow()
    expect(() => calculateBaseline([{ ...alexTransactions[0], date: '2026-02-30' }], '2026-03', '2026-08')).toThrow()
  })
  it('has unique IDs, varied months, and valid synthetic records', () => {
    expect(new Set(alexTransactions.map(t => t.id)).size).toBe(alexTransactions.length)
    expect(new Set(baseline.months.map(t => t.expenses)).size).toBe(6)
    expect(alexTransactions.every(t => t.amount > 0)).toBe(true)
  })
})
describe('six-month simulation', () => {
  it('forecasts six future months across a year boundary', () => {
    const result = run()
    expect(result.forecast.map(p => p.baselineBalance)).toEqual([925, 950, 975, 1000, 1025, 1050])
    expect(result.forecast.map(p => p.month)).toEqual(['2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02'])
    expect(addMonths('2026-12', 1)).toBe('2027-01')
  })
  it('default and reset scenarios equal baseline', () => {
    const result = run(defaultScenario())
    expect(result.forecast.every(p => p.baselineBalance === p.scenarioBalance)).toBe(true)
    expect(result.impacts).toEqual([])
    expect(result.totalImpact).toBe(0)
  })
  it('reduces dining 30% and saves $78 in each month', () => {
    const scenario = defaultScenario(); scenario.categoryAdjustments.dining = -.3
    const result = run(scenario)
    expect(result.adjustedCategories.dining).toBe(182)
    expect(result.adjustedMonthlyExpenses).toBe(1547)
    expect(result.totalImpact).toBe(468)
  })
  it('reproduces the $400 dining / 25% example', () => {
    const example = { ...baseline, categoryAverages: { ...baseline.categoryAverages, dining: 400 }, averageMonthlyExpenses: 1765, monthlySurplus: -115 }
    const scenario = defaultScenario(); scenario.categoryAdjustments.dining = -.25
    const result = simulate(example, 900, '2026-09', scenario)
    expect(result.adjustedCategories.dining).toBe(300)
    expect(result.totalImpact).toBe(600)
  })
  it('applies extra income every month', () => {
    const result = run({ ...defaultScenario(), monthlyIncomeDelta: 150 })
    expect(result.forecast.map(p => p.scenarioBalance - p.baselineBalance)).toEqual([150, 300, 450, 600, 750, 900])
  })
  it('applies a one-time cost only in its selected month, carrying it forward', () => {
    const result = run({ ...defaultScenario(), oneTimeExpense: { label: 'Laptop', amount: 700, monthIndex: 2 } })
    expect(result.forecast.map(p => p.scenarioBalance - p.baselineBalance)).toEqual([0, 0, -700, -700, -700, -700])
    expect(result.forecast.map(p => p.baselineBalance)).toEqual(run().forecast.map(p => p.baselineBalance))
  })
  it('reconciles the full demo and produces a visible month-three dip', () => {
    const scenario = defaultScenario()
    scenario.categoryAdjustments.dining = -.3; scenario.categoryAdjustments.subscriptions = -.4
    scenario.monthlyIncomeDelta = 150; scenario.oneTimeExpense = { label: 'Laptop', amount: 700, monthIndex: 2 }
    const result = run(scenario)
    expect(result.scenarioEnding).toBe(1850)
    expect(result.totalImpact).toBe(800)
    expect(result.impacts.reduce((sum, row) => sum + row.total, 0)).toBe(result.scenarioEnding - result.baselineEnding)
    expect(result.forecast[2].scenarioBalance).toBeLessThan(result.forecast[1].scenarioBalance)
  })
  it('keeps cent rounding consistent across categories, forecasts and impacts', () => {
    const scenario = defaultScenario()
    scenario.categoryAdjustments.transportation = -.17; scenario.categoryAdjustments.subscriptions = -.33
    scenario.oneTimeExpense = { amount: 700.43, label: 'Expense', monthIndex: 5 }
    const result = run(scenario)
    expect(result.impacts.reduce((sum, row) => sum + Math.round(row.total * 100), 0)).toBe(Math.round(result.totalImpact * 100))
  })
  it('clamps unsupported adjustments and income safely', () => {
    const scenario = defaultScenario(); scenario.categoryAdjustments.dining = -3; scenario.categoryAdjustments.groceries = .5; scenario.categoryAdjustments.shopping = NaN
    scenario.monthlyIncomeDelta = 9999
    const normalized = normalizeScenario(scenario)
    expect(normalized.categoryAdjustments.dining).toBe(-1)
    expect(normalized.categoryAdjustments.groceries).toBe(.5)
    expect(normalized.categoryAdjustments.shopping).toBe(0)
    expect(normalized.monthlyIncomeDelta).toBe(500)
    expect(run({ ...scenario, monthlyIncomeDelta: Infinity }).scenario.monthlyIncomeDelta).toBe(0)
  })
  it('ignores zero, negative and nonfinite expenses and invalid months', () => {
    for (const amount of [0, -3, NaN, Infinity]) expect(run({ ...defaultScenario(), oneTimeExpense: { amount, label: '', monthIndex: 2 } }).hasChanges).toBe(false)
    for (const monthIndex of [-1, 6, 1.5]) expect(run({ ...defaultScenario(), oneTimeExpense: { amount: 700, label: '', monthIndex } }).hasChanges).toBe(false)
  })
  it('supports negative balances and bounds enormous costs', () => {
    const result = run({ ...defaultScenario(), oneTimeExpense: { amount: 1e20, label: '', monthIndex: 0 } })
    expect(result.scenarioEnding).toBe(-998950)
    expect(result.forecast.every(p => Number.isFinite(p.scenarioBalance))).toBe(true)
  })
  it('handles no category spending', () => {
    const empty = calculateBaseline([], '2026-03', '2026-08')
    const scenario = defaultScenario(); scenario.categoryAdjustments.dining = -.5
    expect(simulate(empty, 0, '2026-09', scenario).totalImpact).toBe(0)
  })
  it('does not mutate baseline or scenario inputs', () => {
    const scenario = defaultScenario(); const before = JSON.stringify({ baseline, scenario })
    run(scenario)
    expect(JSON.stringify({ baseline, scenario })).toBe(before)
  })
})
describe('goals', () => {
  it('calculates required monthly savings and scenario gap', () => {
    expect(calculateGoal(2000, 900, 1850)).toMatchObject({ requiredMonthlySavings: 183.33, gap: 150, excess: 0, progress: 92.5 })
  })
  it('handles reached goals, targets below starting savings and zero', () => {
    expect(calculateGoal(500, 900, 1050)).toMatchObject({ requiredMonthlySavings: 0, gap: 0, excess: 550, progress: 100 })
    expect(calculateGoal(0, 900, 1050).progress).toBe(100)
    expect(calculateGoal(2000, 900, -50).progress).toBe(0)
  })
})
