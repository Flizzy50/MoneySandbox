import { expenseCategories, type FinancialProfile } from '../types/finance'
import { alexProfile, alexTransactions } from '../data/alexTransactions'
import { calculateBaseline } from './finance'

export const PROFILE_KEY = 'moneysandbox.profile.v1'
export const MAX_BUDGET_AMOUNT = 1_000_000
export const isBudgetAmount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_BUDGET_AMOUNT && Math.abs(value * 100 - Math.round(value * 100)) < .00001

export function isFinancialProfile(value: unknown): value is FinancialProfile {
  if (!value || typeof value !== 'object') return false
  const profile = value as FinancialProfile
  return typeof profile.name === 'string' && profile.name.trim().length > 0 && profile.name.length <= 60
    && isBudgetAmount(profile.monthlyIncome) && isBudgetAmount(profile.startingSavings)
    && (profile.source === 'manual' || profile.source === 'demo')
    && Boolean(profile.monthlySpending) && expenseCategories.every(category => isBudgetAmount(profile.monthlySpending[category]))
}

export function loadProfile(): { profile: FinancialProfile | null; warning: string } {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return { profile: null, warning: '' }
    const saved = JSON.parse(raw)
    if (saved?.version === 1 && isFinancialProfile(saved.profile)) return { profile: saved.profile, warning: '' }
    return { profile: null, warning: 'Your saved setup could not be read. Create a new setup below.' }
  } catch {
    return { profile: null, warning: 'Saved setup is unavailable. You can still use the sandbox in this session.' }
  }
}

export function saveProfile(profile: FinancialProfile): string {
  if (!isFinancialProfile(profile)) return 'This setup contains invalid values and was not saved.'
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ version: 1, profile }))
    return ''
  } catch {
    return 'Your changes work in this session, but this browser could not save them for next time.'
  }
}

export function clearProfile(): string {
  try { localStorage.removeItem(PROFILE_KEY); return '' }
  catch { return 'Started over for this session. Browser storage could not be cleared; your previous setup may return after a reload.' }
}

export function demoProfile(): FinancialProfile {
  const baseline = calculateBaseline(alexTransactions, alexProfile.historyStart, alexProfile.historyEnd)
  return { name: alexProfile.name, monthlyIncome: baseline.averageMonthlyIncome, startingSavings: alexProfile.startingSavings, monthlySpending: { ...baseline.categoryAverages }, source: 'demo' }
}
