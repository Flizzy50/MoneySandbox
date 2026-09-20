import type { Transaction, TransactionCategory } from '../types/finance'

export const alexProfile = {
  name: 'Alex', description: 'College student · Part-time income', startingSavings: 900,
  historyStart: '2026-03', historyEnd: '2026-08', forecastStart: '2026-09',
} as const

// A fixed transaction schedule, expanded across six complete months. No randomness,
// external records, or clock-dependent data. Each amount is a positive dollar value.
type Template = [day: number, merchant: string, amount: number, category: TransactionCategory, variation?: number]
const schedule: Template[] = [
  [1, 'Campus bookstore payroll', 825, 'income', 5],
  [15, 'Campus bookstore payroll', 825, 'income', 5],
  [2, 'Maple Court · Shared rent', 750, 'housing'],
  [3, 'Neighborhood Market', 62, 'groceries', 3],
  [10, 'Fresh Basket', 54, 'groceries'], [18, 'Neighborhood Market', 71, 'groceries'], [25, 'Fresh Basket', 63, 'groceries'],
  [2, 'Campus Coffee', 8.5, 'dining'], [4, 'Noodle House', 22, 'dining', 4],
  [6, 'Campus Café', 16.5, 'dining'], [8, 'Friday takeout', 39, 'dining'],
  [11, 'Corner Deli', 12, 'dining'], [13, 'Green Bowl', 28, 'dining'],
  [16, 'Campus Coffee', 9, 'dining'], [19, 'Pizza with friends', 35, 'dining'],
  [21, 'Corner Deli', 18, 'dining'], [24, 'Weekend dinner', 42, 'dining'], [27, 'Noodle House', 30, 'dining'],
  [1, 'Student bus pass', 50, 'transportation'], [9, 'Rideshare', 18, 'transportation', 1],
  [17, 'Bike share', 12, 'transportation'], [26, 'Rideshare', 15, 'transportation'],
  [4, 'Spotify', 12, 'subscriptions'], [7, 'Netflix', 16, 'subscriptions'],
  [12, 'Cloud storage', 3, 'subscriptions'], [20, 'Campus gym', 24, 'subscriptions'],
  [6, 'Cinema', 16, 'entertainment'], [14, 'Bowling night', 24, 'entertainment', 2], [23, 'Local live music', 45, 'entertainment'],
  [8, 'Campus supplies', 32, 'shopping', 2], [22, 'Secondhand clothing', 58, 'shopping'],
  [5, 'Laundry', 18, 'other'], [19, 'Household essentials', 22, 'other', 1],
]
const monthlyVariation = [-2, 1, 3, -1, -3, 2]
export const alexTransactions: Transaction[] = monthlyVariation.flatMap((variation, monthIndex) =>
  schedule.map<Transaction>(([day, merchant, amount, category, multiplier = 0], index) => ({
    id: `alex-${monthIndex + 1}-${String(index + 1).padStart(2, '0')}`,
    date: `2026-${String(monthIndex + 3).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    merchant, amount: Math.round((amount + variation * multiplier) * 100) / 100,
    type: category === 'income' ? 'income' : 'expense', category,
  })),
).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
