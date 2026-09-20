import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { baselineFromProfile, nextForecastMonth } from './finance'
import { clearProfile, demoProfile, isFinancialProfile, loadProfile, PROFILE_KEY, saveProfile } from './profile'
import { defaultScenario, simulate } from './simulator'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())
describe('editable budgets and signed scenarios', () => {
  it('calculates a custom budget using every category and preserves cents', () => {
    const profile = demoProfile(); profile.monthlyIncome = 2000.25; profile.monthlySpending.housing = 1000.10
    const baseline = baselineFromProfile(profile)
    expect(baseline.averageMonthlyExpenses).toBe(1875.10)
    expect(baseline.monthlySurplus).toBe(125.15)
    expect(simulate(baseline, 900, '2026-10', defaultScenario()).baselineEnding).toBe(1650.90)
  })
  it('increases spending, decreases income, and reconciles all impacts', () => {
    const scenario = defaultScenario(); scenario.categoryAdjustments.dining = .3; scenario.categoryAdjustments.housing = .1; scenario.categoryAdjustments.other = -1; scenario.monthlyIncomeDelta = -150
    const result = simulate(baselineFromProfile(demoProfile()), 900, '2026-10', scenario)
    expect(result.adjustedCategories.dining).toBe(338)
    expect(result.adjustedCategories.housing).toBe(825)
    expect(result.adjustedCategories.other).toBe(0)
    expect(result.totalImpact).toBe(-1578)
    expect(result.impacts.reduce((total, item) => total + item.total, 0)).toBe(result.totalImpact)
    expect(result.impacts.find(item => item.key === 'income')?.label).toBe('Reduced income')
  })
  it('clamps both directions and prevents negative total income, including cents', () => {
    const profile = demoProfile(); profile.monthlyIncome = 123.45
    const scenario = defaultScenario(); scenario.categoryAdjustments.dining = 5; scenario.categoryAdjustments.housing = -5; scenario.monthlyIncomeDelta = -500
    const result = simulate(baselineFromProfile(profile), 900, '2026-10', scenario)
    expect(result.scenario.categoryAdjustments.dining).toBe(1)
    expect(result.scenario.categoryAdjustments.housing).toBe(-1)
    expect(result.scenario.monthlyIncomeDelta).toBe(-123.45)
  })
  it('derives the next six-month start from the local calendar including December', () => {
    expect(nextForecastMonth(new Date(2026, 8, 19))).toBe('2026-10')
    expect(nextForecastMonth(new Date(2026, 11, 31))).toBe('2027-01')
  })
})
describe('profile persistence', () => {
  it('round-trips and clears a complete profile', () => {
    expect(loadProfile().profile).toBeNull()
    const profile = demoProfile(); profile.name = 'Sam'; profile.source = 'manual'
    expect(saveProfile(profile)).toBe('')
    expect(loadProfile().profile).toEqual(profile)
    expect(clearProfile()).toBe('')
    expect(loadProfile().profile).toBeNull()
  })
  it('rejects malformed, incomplete, out-of-range and unsupported saved data', () => {
    for (const raw of ['{broken', JSON.stringify({ version: 2, profile: demoProfile() }), JSON.stringify({ version: 1, profile: { ...demoProfile(), monthlySpending: {} } })]) {
      localStorage.setItem(PROFILE_KEY, raw)
      expect(loadProfile().profile).toBeNull()
      expect(loadProfile().warning).not.toBe('')
    }
    for (const monthlyIncome of [-1, Infinity, NaN, 1e10, .001]) expect(isFinancialProfile({ ...demoProfile(), monthlyIncome })).toBe(false)
    expect(isFinancialProfile({ ...demoProfile(), name: ' ' })).toBe(false)
  })
  it('continues safely when browser storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked') })
    expect(loadProfile().profile).toBeNull()
    expect(saveProfile(demoProfile())).toContain('session')
    expect(clearProfile()).toContain('could not be cleared')
  })
})
