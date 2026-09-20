# MoneySandbox

**See the financial consequences of a decision before you make it.**

A financial hackathon MVP for students and people with tight monthly budgets. Budgeting tools explain past spending; MoneySandbox lets you change a few assumptions and compare two possible futures immediately.

Start with a short questionnaire: your name, monthly take-home income, current savings, and spending in all eight categories. Review the totals, then open your personalized sandbox. **Edit profile & baseline** lets you change any answer later.

Or choose **Try Alex’s demo**: a fictional college student with $900 in savings. Six months of synthetic transactions produce $1,650 average monthly income, $1,625 spending, and a $25 surplus. These demo numbers are calculated from the records.

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
- Four-step setup, personalized name/avatar, and editable baseline amounts for all eight categories.
- Spending sliders from **−100% to +100%**, with zero clearly marked, for housing, dining, entertainment, subscriptions, shopping, groceries, transportation, and other spending.
- Income changes from **−$500 to +$500/month**, with a slider and exact dollar input. Total income cannot become negative.
- One optional expense with a description, amount, and selected month; add, update, or remove it.
- Live ending balances and an itemized six-month impact breakdown.
- Category spending breakdown and calculation assumptions.
- Six-month savings goal with required monthly savings, progress, and projected gap or excess.
- Saving baseline edits recalculates both forecasts while preserving scenario percentages, the one-time expense, and the goal. Income adjustments are clamped if necessary to keep total income nonnegative.
- Reset restores all scenario controls and removes the expense while keeping your profile, baseline, and goal.
- Profile and baseline persist locally. Start over clears them after confirmation. Scenario and goal edits reset on reload.
- Responsive dark dashboard, keyboard-operable controls, input validation, and negative-balance handling.

## Architecture

React + TypeScript + Vite, Tailwind CSS plus component CSS, Recharts, and Lucide icons. React state owns the scenario; pure functions own the financial calculations. Everything runs in the browser. Tooling follows the official [Vite setup](https://vite.dev/guide/) and [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite).

| File | Responsibility |
| --- | --- |
| `src/App.tsx` | Setup/edit/dashboard flow, saved profile, and start-over action |
| `src/components/ProfileSetup.tsx` | Questionnaire, validation, review, and editable profile form |
| `src/lib/profile.ts` | Profile validation, versioned localStorage, safe fallback, and demo profile |
| `src/data/alexTransactions.ts` | Deterministic transaction history and fictional profile |
| `src/types/finance.ts` | Transaction, baseline, scenario, forecast, and impact types |
| `src/lib/finance.ts` | Entered-budget baseline, historical aggregation, next-month dates, cent arithmetic |
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
| `src/lib/profile.test.ts` | Custom budgets, signed impacts, dates, storage validation/failures |
| `src/components/ProfileSetup.test.tsx` | Setup, validation, editing, cancellation, preservation, and start over |
| `src/components/Dashboard.test.tsx` | React interaction and validation tests |
| `e2e/demo.spec.ts` | Complete judging flow and mobile/large-expense browser tests |

## Calculation methodology

Personal baselines use the monthly amounts entered during setup. They do not fabricate transaction history. The forecast starts in the **next calendar month** relative to the browser’s local date when the app opens, then runs for exactly six months. Chart labels and expense choices derive from those dates.

Only the optional demo uses **March–August 2026** history: 198 deterministic positive-amount transactions with small fixed monthly variations. No randomness is used. Historical aggregation remains separate from the entered-budget baseline; both supply the same monthly assumptions to the simulator.

1. For a personal profile, baseline monthly income and category spending come directly from the validated inputs. For the demo, transactions are grouped by month across the explicit six-month window, counting missing months as zero and excluding records outside the window.
2. Demo averages divide income/category totals by six. For either profile source, total monthly spending is the sum of all eight category amounts; surplus is income minus spending.
3. Current savings is an entered starting balance ($900 in the demo), separate from income and transaction history.
4. A category adjustment is a fraction: `-0.30` means 30% less; `+0.30` means 30% more. Adjusted category spending is `baseline × (1 + adjustment)`. All eight categories are adjustable. A category with a $0 baseline has a disabled percentage slider and a link to edit its starting amount, because a percentage of zero is still zero.
5. Starting at current savings, exactly six month-end balances are calculated:

   ```text
   baseline balance = prior baseline + baseline income − baseline expenses
   scenario balance = prior scenario + baseline income + income change
                      − adjusted expenses − expense scheduled for this month
   ```

6. Each recurring change contributes `monthly improvement × 6`. The one-time expense contributes its negative amount once. Their sum equals scenario ending balance minus baseline ending balance, to the cent.
7. Required monthly savings for a goal is `max(0, target − current savings) / 6`. Gap and excess compare the goal with the scenario ending balance, including the one-time expense.

Amounts are accumulated in integer cents. Category averages and adjusted category amounts are rounded to cents once, then reused throughout the forecast and breakdown. Increased spending and reduced income contribute negative impacts; their signs are retained in the explanation. Dashboard labels display whole dollars, so independently rounded labels can occasionally differ by a dollar even though internal values reconcile. After selecting the starting month from the local calendar, month arithmetic and labels use UTC to avoid timezone shifts. Goal progress is capped at 0–100%; an exceeded goal still shows its full dollar excess.

## Two-minute demo

1. At setup choose **Try Alex’s demo** (use **Start over** first if a profile is already saved). Alex earns **$1,650**, spends **$1,625**, and saves **$25/month**.
2. Baseline savings rise slowly from **$900** to **$1,050** over six months.
3. Reduce **Dining by 30%**: save **$78/month**, contributing **+$468** over six months.
4. Reduce **Subscriptions by 40%**: save **$22/month**, contributing **+$132**.
5. Add **$150/month** income: **+$900** over six months. Scenario now ends at **$2,550**.
6. Click **Add to scenario** with the prefilled **Laptop / $700 / third forecast month**. These values are only a draft until applied. The third month drops from the second month’s **$1,450** to **$1,025**.
7. Final comparison: **$1,050 baseline**, **$1,850 scenario**, **+$800 net impact**. Breakdown: `$468 + $132 + $900 − $700 = $800`.
8. The default **$2,000** goal has a **$150** remaining gap. Change the goal to $1,500 to see a $350 projected excess.
9. Reset the scenario. Both forecasts return to **$1,050**.
10. Edit the profile name and a baseline category. Save to see the personalized dashboard and both forecasts recalculate. Try moving a spending slider above zero or entering a negative monthly income adjustment.

## Validation and tradeoffs

- Unit tests cover historical aggregation, entered budgets, both adjustment directions, nonnegative income, expense timing, cent rounding, reconciliation, goals, calendar rollover, profile validation, and unavailable storage.
- React tests cover setup, review, personalization, save/cancel edits, preserved scenario/goal state, reset, start over, expense validation/removal, and large negative balances.
- Browser tests cover both the demo and personal setup, signed changes, editing, profile restoration after reload, start over, chart rendering, console errors, and mobile layouts.
- Only profile and baseline persist, under the versioned `moneysandbox.profile.v1` key. Invalid or incompatible saved data returns to setup. If storage fails, the app works in memory and displays a status message. A failed clear also warns that the old saved profile may return on reload. No other localStorage keys are altered.
- Setup requires a nonblank name (up to 60 characters) and a nonnegative amount up to $1,000,000 for income, savings, and each category, with at most two decimal places. Use an explicit 0 for unused categories.
- One expense only. Expenses and goals are limited to $1,000,000; negative/nonfinite inputs are rejected. An applied $0 expense removes its financial effect. Draft edits take effect only when applied.
- This is a deterministic cash-flow projection. Income and expenses repeat at their baseline estimates; interest, inflation, taxes beyond entered take-home pay, debt, and uncertainty are outside this MVP.
- Chart lines update immediately without animation so rapid slider input stays precise; progress and focus/hover transitions remain subtle. The vertical axis starts at zero unless a scenario becomes negative and expands for larger balances.
- Desktop is the primary judging layout; smaller screens stack the forecast, controls, goal, and breakdowns.

## Local data and optional synthetic demo

Personal profile values are manually entered estimates, saved only in this browser. Alex’s optional demo and transaction history are entirely fictional. Editing a demo profile switches its label to entered estimates. There are **no bank connections, financial account integrations, authentication, payment features, analytics, LLMs, or financial recommendations**. Profile data is never sent to a server. The app uses local assets and client-side calculations only.
