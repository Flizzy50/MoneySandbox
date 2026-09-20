const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
export function formatCurrency(value: number): string { return dollars.format(Number.isFinite(value) ? value : 0) }
export function formatImpact(value: number): string { return `${value > 0 ? '+' : ''}${formatCurrency(value)}` }
export function formatPercent(value: number): string { return `${Math.round(value * 100)}%` }
export function monthLabel(month: string, long = false): string {
  return new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-US', { month: long ? 'long' : 'short', year: long ? 'numeric' : undefined, timeZone: 'UTC' })
}
