# MoneySandbox

**See the financial consequences of a decision before you make it.**

A financial hackathon MVP for students and people with tight monthly budgets. Budgeting tools explain past spending; MoneySandbox lets you change a few assumptions and compare two possible futures immediately.

Meet Alex: a fictional college student with part-time income and $900 in current savings. Six months of synthetic transactions produce average monthly income of $1,650, spending of $1,625, and a $25 surplus. These summaries are calculated from the records, not hardcoded in the UI.

## Run it

Requires Node.js 22.12+ (tested with 22.20) and npm. From this directory:

```sh
npm install
npm run dev
```

Open **http://localhost:5173**. After dependencies are installed, `npm run dev` is the only startup command. No environment variables, API keys, database, or account setup are needed.

```sh
npm run test       # Financial engine and React interaction tests
npm run build      # TypeScript check + production build in dist/
npm run preview    # Serve the production build locally
```

Optional real-browser tests:

```sh
npx playwright install chromium
npm run test:e2e
```

Alternatively, use an installed Chrome browser in PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm run test:e2e
```

The browser suite starts Vite automatically, or reuses a server already running on port 5173. It captures desktop and mobile screenshots in `.verification/`; failed runs retain Playwright traces in `test-results/`.

## Features

- Six-month baseline and scenario chart with hover values, expense markers, and an accessible monthly forecast table.
- Dining, entertainment, subscriptions, shopping, groceries, and transportation reduction sliders.
- Extra income from $0 to $500 per month.
- One optional expense with a description, amount, and selected month; add, update, or remove it.
- Live ending balances and an itemized six-month impact breakdown.
- Category spending breakdown and calculation assumptions.
- Six-month savings goal with required monthly savings, progress, and projected gap or excess.
- Reset restores all scenario controls and removes the expense while keeping the goal.
- Responsive dark dashboard, keyboard-operable controls, input validation, and negative-balance handling.

## Architecture

React + TypeScript + Vite, Tailwind CSS plus component CSS, Recharts, and Lucide icons. React state owns the scenario; pure functions own the financial calculations. Everything runs in the browser. Tooling follows the official [Vite setup](https://vite.dev/guide/) and [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite).

| File | Responsibility |
| --- | --- |
| `src/data/alexTransactions.ts` | Deterministic transaction history and fictional profile |
| `src/types/finance.ts` | Transaction, baseline, scenario, forecast, and impact types |
| `src/lib/finance.ts` | Monthly/category aggregation, complete-month averaging, cent arithmetic |
| `src/lib/simulator.ts` | Input limits, adjusted spending, forecasts, impact reconciliation, goals |
| `src/lib/format.ts` | Shared currency, impact, percentage, and date formatting |
| `src/components/Dashboard.tsx` | Scenario state and dashboard composition |
| `src/components/ForecastChart.tsx` | Baseline/scenario lines, tooltips, monthly table |
| `src/components/ScenarioControls.tsx` | Spending and income sliders |
| `src/components/OneTimeExpense.tsx` | Validated expense draft, apply/update/remove actions |
| `src/components/GoalCalculator.tsx` | Goal input, gap/excess, progress |
| `src/components/ImpactBreakdown.tsx` | Explanation of every active change |
| `src/components/SpendingBreakdown.tsx` | Baseline category distribution |
| `src/lib/finance.test.ts` | Financial-engine unit tests |
| `src/components/Dashboard.test.tsx` | React interaction and validation tests |
| `e2e/demo.spec.ts` | Complete judging flow and mobile/large-expense browser tests |

## Calculation methodology

The fixed demo snapshot uses **March–August 2026** history and forecasts **September 2026–February 2027**. Dates do not move with the system clock, so the demo stays reproducible. A fixed schedule of 198 positive-amount transactions includes two paychecks each month, shared rent, groceries, coffee, takeout, transit, subscriptions, and other everyday expenses. Fixed month-to-month offsets create variation; no randomness is used.

1. Income and expenses are grouped by calendar month. The explicit six-month history window includes any missing month as zero; records outside it are excluded.
2. Average monthly income is total income divided by six. Each expense category is averaged across the same six months. Monthly spending is the sum of those category averages; surplus is income minus spending.
3. Current savings ($900) is a separate fictional profile balance, not an inference from transaction history.
4. A category adjustment is a fraction: `-0.30` means 30% less. Adjusted category spending is `baseline × (1 + adjustment)`. Housing and other spending remain fixed.
5. Starting at current savings, exactly six month-end balances are calculated:

   ```text
   baseline balance = prior baseline + average income − average expenses
   scenario balance = prior scenario + average income + extra income
                      − adjusted expenses − expense scheduled for this month
   ```

6. Each recurring change contributes `monthly improvement × 6`. The one-time expense contributes its negative amount once. Their sum equals scenario ending balance minus baseline ending balance, to the cent.
7. Required monthly savings for a goal is `max(0, target − current savings) / 6`. Gap and excess compare the goal with the scenario ending balance, including the one-time expense.

Amounts are accumulated in integer cents. Category averages and adjusted category amounts are rounded to cents once, then reused throughout the forecast and breakdown. Dashboard labels display whole dollars, so independently rounded labels can occasionally differ by a dollar even though internal values reconcile. All dates use UTC month calculations. Goal progress is capped at 0–100%; an exceeded goal still shows its full dollar excess.

## Two-minute demo

1. Open the dashboard: Alex earns **$1,650**, spends **$1,625**, and saves **$25/month**.
2. Baseline savings rise slowly from **$900** to **$1,050** over six months.
3. Reduce **Dining by 30%**: save **$78/month**, contributing **+$468** over six months.
4. Reduce **Subscriptions by 40%**: save **$22/month**, contributing **+$132**.
5. Add **$150/month** income: **+$900** over six months. Scenario now ends at **$2,550**.
6. Click **Add to scenario** with the prefilled **Laptop / $700 / November 2026**. These values are only a draft until applied. November drops from October’s **$1,450** to **$1,025**.
7. Final comparison: **$1,050 baseline**, **$1,850 scenario**, **+$800 net impact**. Breakdown: `$468 + $132 + $900 − $700 = $800`.
8. The default **$2,000** goal has a **$150** remaining gap. Change the goal to $1,500 to see a $350 projected excess.
9. Reset the scenario. Both forecasts return to **$1,050**.

## Validation and tradeoffs

- Unit tests cover aggregation, missing months, category averages, baseline forecasting, reductions, income, one-time expense timing, cent rounding, reconciliation, default/reset state, invalid values, zero-spend categories, negative balances, and goals.
- React tests cover the full demo, reset, input validation, removing an expense, goal edits, and a million-dollar expense.
- Browser tests exercise the actual sliders with keyboard input, the chart, the November dip, goal changes, validation, removal, reset, console errors, and a 390px mobile viewport without horizontal overflow.
- No persistence: refresh starts a fresh sandbox. This keeps repeated demonstrations predictable.
- One expense only. Expenses and goals are limited to $1,000,000; negative/nonfinite inputs are rejected. An applied $0 expense removes its financial effect. Draft edits take effect only when applied.
- This is a deterministic cash-flow projection. Income and expenses repeat at their historical averages; interest, inflation, taxes beyond recorded take-home pay, debt, and uncertainty are outside this MVP.
- Chart lines update immediately without animation so rapid slider input stays precise; progress and focus/hover transitions remain subtle. The vertical axis starts at zero unless a scenario becomes negative and expands for larger balances.
- Desktop is the primary judging layout; smaller screens stack the forecast, controls, goal, and breakdowns.

## Synthetic data only

All people, transactions, amounts, and balances are fictional demo data. There are **no bank connections, financial account integrations, authentication, payment features, LLMs, or financial recommendations**. No real financial data is read or sent anywhere. The installed app uses local assets and client-side calculations only.
