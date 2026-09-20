import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Box, Check, ShieldCheck } from 'lucide-react'
import { expenseCategories, type ExpenseCategory, type FinancialProfile } from '../types/finance'
import { categoryLabels } from '../lib/simulator'
import { baselineFromProfile } from '../lib/finance'
import { demoProfile, isBudgetAmount, MAX_BUDGET_AMOUNT } from '../lib/profile'
import { formatCurrency, formatImpact } from '../lib/format'

type Field = 'name' | 'monthlyIncome' | 'startingSavings' | ExpenseCategory
type Draft = Record<Field, string>
const steps = ['About you', 'Your starting point', 'Monthly spending', 'Review']

export function ProfileSetup({ initial, onSave, onCancel }: { initial?: FinancialProfile; onSave: (profile: FinancialProfile) => void; onCancel?: () => void }) {
  const editing = Boolean(initial)
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(() => ({ name: initial?.name ?? '', monthlyIncome: initial ? String(initial.monthlyIncome) : '', startingSavings: initial ? String(initial.startingSavings) : '', ...Object.fromEntries(expenseCategories.map(category => [category, initial ? String(initial.monthlySpending[category]) : ''])) }) as Draft)
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const profile: FinancialProfile = { name: draft.name.trim(), monthlyIncome: Number(draft.monthlyIncome), startingSavings: Number(draft.startingSavings), monthlySpending: Object.fromEntries(expenseCategories.map(category => [category, Number(draft[category])])) as Record<ExpenseCategory, number>, source: 'manual' }
  const fields: Field[] = editing ? ['name', 'monthlyIncome', 'startingSavings', ...expenseCategories] : step === 0 ? ['name'] : step === 1 ? ['monthlyIncome', 'startingSavings'] : step === 2 ? [...expenseCategories] : []
  function change(field: Field, value: string) { setDraft(previous => ({ ...previous, [field]: value })); setErrors(previous => ({ ...previous, [field]: undefined })) }
  function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: Partial<Record<Field, string>> = {}
    for (const field of fields) {
      if (field === 'name') { if (!draft.name.trim() || draft.name.trim().length > 60) nextErrors.name = 'Enter a name from 1 to 60 characters.' }
      else if (!draft[field].trim() || !isBudgetAmount(Number(draft[field]))) nextErrors[field] = 'Enter $0–$1,000,000, with at most two decimal places.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { document.getElementById(`setup-${Object.keys(nextErrors)[0]}`)?.focus(); return }
    if (editing || step === 3) onSave(profile)
    else setStep(previous => previous + 1)
  }
  function moneyField(field: Exclude<Field, 'name'>, label: string) {
    return <div key={field}><label className="field-label" htmlFor={`setup-${field}`}>{label} ($)</label><input className="text-input" id={`setup-${field}`} type="number" inputMode="decimal" min="0" max={MAX_BUDGET_AMOUNT} step="0.01" value={draft[field]} placeholder="0" onChange={event => change(field, event.target.value)} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `error-${field}` : undefined} />{errors[field] && <p className="field-error" id={`error-${field}`}>{errors[field]}</p>}</div>
  }
  const reviewedBaseline = step === 3 && !editing ? baselineFromProfile(profile) : null
  return <main className="setup-page"><div className="setup-brand"><span className="brand-mark"><Box size={23} /></span><span>MoneySandbox</span></div><section className="panel setup-card" aria-labelledby="setup-title">
    <div className="eyebrow">{editing ? 'YOUR SAVED STARTING POINT' : `LET’S MAKE THIS YOURS · STEP ${step + 1} OF 4`}</div>
    <h1 id="setup-title">{editing ? 'Edit profile & baseline' : ['What should we call you?', 'Where are you starting?', 'What do you spend each month?', 'Ready to explore your next six months?'][step]}</h1>
    <p className="setup-intro">{editing ? 'Save to update both forecasts. Your scenario adjustments and savings goal will stay in place.' : ['Your name will appear on your personal financial sandbox.', 'Add your monthly take-home income and the savings you have today.', 'Enter a monthly estimate for each category. Use 0 where you don’t spend. You can edit every amount later.', 'Check your starting point. You can change these estimates anytime.'][step]}</p>
    {!editing && <ol className="setup-steps" aria-label="Setup progress">{steps.map((label, index) => <li key={label} className={index === step ? 'current' : index < step ? 'complete' : ''} aria-current={index === step ? 'step' : undefined}><span>{index < step ? <Check size={12} /> : index + 1}</span>{label}</li>)}</ol>}
    <form noValidate onSubmit={submit}>
      {(editing || step === 0) && <div className="setup-name"><label className="field-label" htmlFor="setup-name">Your name</label><input autoFocus className="text-input" id="setup-name" autoComplete="given-name" maxLength={60} value={draft.name} onChange={event => change('name', event.target.value)} placeholder="e.g. Sam" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'error-name' : undefined} />{errors.name && <p className="field-error" id="error-name">{errors.name}</p>}</div>}
      {(editing || step === 1) && <div className="setup-fields">{moneyField('monthlyIncome', 'Monthly take-home income')}{moneyField('startingSavings', 'Current savings')}</div>}
      {(editing || step === 2) && <><h2 className="setup-section-title">Baseline monthly spending</h2><div className="setup-fields">{expenseCategories.map(category => moneyField(category, categoryLabels[category]))}</div></>}
      {reviewedBaseline && <div className="setup-review"><h2>{profile.name}’s starting point</h2><dl><div><dt>Monthly income</dt><dd>{formatCurrency(profile.monthlyIncome)}</dd></div><div><dt>Monthly spending</dt><dd>{formatCurrency(reviewedBaseline.averageMonthlyExpenses)}</dd></div><div><dt>Monthly surplus</dt><dd className={reviewedBaseline.monthlySurplus < 0 ? 'negative' : 'positive'}>{formatImpact(reviewedBaseline.monthlySurplus)}</dd></div><div><dt>Current savings</dt><dd>{formatCurrency(profile.startingSavings)}</dd></div>{expenseCategories.map(category => <div key={category}><dt>{categoryLabels[category]}</dt><dd>{formatCurrency(profile.monthlySpending[category])} / mo</dd></div>)}</dl></div>}
      <div className="setup-actions">{editing ? <button type="button" className="button" onClick={onCancel}>Cancel</button> : step > 0 ? <button type="button" className="button" onClick={() => { setStep(previous => previous - 1); setErrors({}) }}><ArrowLeft size={15} />Back</button> : <button type="button" className="button" onClick={() => onSave(demoProfile())}>Try Alex’s demo</button>}<button type="submit" className="button primary-button">{editing ? 'Save changes' : step === 3 ? 'Open my sandbox' : 'Continue'}<ArrowRight size={15} /></button></div>
      {Object.keys(errors).some(key => errors[key as Field]) && <p role="alert" className="field-error">Check the highlighted fields before continuing.</p>}
    </form>
    <p className="setup-privacy"><ShieldCheck size={15} />Your setup is saved in this browser. No accounts are connected and nothing is sent to a server. Scenario changes reset on reload.</p>
  </section></main>
}
