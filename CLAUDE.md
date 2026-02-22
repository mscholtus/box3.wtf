# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Box 3 Calculator (box3.wtf) - A Dutch tax calculator comparing the "forfaitair" (fictional return) tax system with the proposed "werkelijk rendement" (actual return) system for Box 3 wealth taxation.

- **Forfaitair (current)**: Tax based on fictional returns (5.88% investments, 1.37% savings)
- **Werkelijk rendement (2028+)**: Proposed tax on actual realized and unrealized gains

## Tech Stack

- **React 18** with Vite
- **Tailwind CSS** for styling (with custom `mist` color palette)
- **Recharts** for data visualization
- **No state management library** - React useState with URL state sharing

## Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint
```

## Architecture

### Directory Structure

```
src/
├── components/
│   ├── pages/       # Page-level components (Dashboard, Wizard, InfoPage, etc.)
│   └── ui/          # Reusable UI components (NumberInput, Toggle, Slider, etc.)
├── constants/
│   └── tax.js       # Tax rates, thresholds, simulation defaults
├── hooks/
│   └── useSimulation.js  # Simulation logic (and Monte Carlo - currently disabled)
└── utils/
    ├── format.js    # Number formatting (€1.2M, €50K)
    ├── shareState.js # URL state encoding/decoding
    └── tax.js       # Tax calculation functions, RNG
```

### Key Files

- **`src/App.jsx`** - Main app with state management, routing, theme
- **`src/constants/tax.js`** - All tax constants (rates, thresholds)
- **`src/hooks/useSimulation.js`** - `simulate()` function (and `runMonteCarlo()` for future use)
- **`src/utils/tax.js`** - `calcTax()`, `payTax()`, seeded RNG functions

### Code Splitting

Dashboard.jsx is lazy-loaded via `React.lazy()` to reduce initial bundle size. Do not add Dashboard to the static exports in `components/pages/index.js`.

## Tax Calculation Logic

### Forfaitair System
```javascript
// Fictional return calculation
const fictief = spaar * 0.0137 + overige * 0.0588;
const grondslag = Math.max(0, totaalB3 - heffingsvrij);
const belasting = fictief * (grondslag / totaalB3) * 0.36;
```

### Werkelijk Rendement System
```javascript
// Actual return calculation
const werkelijk = etfGrowth + cryptoGrowth + spaarGrowth;
const belasting = Math.max(0, werkelijk - heffingsvrijInkomen) * 0.36;
```

## Theming

Dark mode support via Tailwind's `dark:` prefix. Theme follows system preference by default, with manual toggle. Custom colors defined in `tailwind.config.js`:
- `mist-50` to `mist-950` - grayscale palette
- `accent` - orange highlight color
- `forfaitair` - blue for forfaitair system
- `werkelijk` - green for werkelijk system

## URL State

Calculator state is encoded in URL query parameter for sharing:
```
https://box3.wtf/?d=<base64-encoded-state>
```

State includes: asset values, contributions, returns, jaren, fiscaalPartner, betaalUitSpaar.

## Important Notes

- Tax rates are based on 2025 actuals (forfaitair) and estimates (werkelijk 2028+)
- Pension investments (pensioen) are exempt from Box 3
- The "werkelijk rendement" law is pending Eerste Kamer approval
- All calculations run client-side; no data is sent to servers

---

## Backlog

### 1. Monte Carlo Simulations (code exists, UI disabled)

**Status**: Code implemented in `useSimulation.js`, but UI path removed. Need to design intuitive presentation.

**Challenge**: Showing probabilistic outcomes without confusing users. Previous implementation had issues:
- Selecting a specific percentile scenario defeats the purpose of MC
- P50(werkelijk - forfaitair) ≠ P50(werkelijk) - P50(forfaitair)
- Range visualizations were complex

**Existing code**:
- `generateMCScenarios()` - generates 1000 random return scenarios
- `runMonteCarlo()` - runs simulation across all scenarios
- `runPairedMonteCarlo()` - computes true median of differences (proper A/B testing)
- Seeded PRNG (Mulberry32) for reproducible results

**Design considerations for future**:
- Show confidence bands on charts rather than single lines
- Focus on probability statements: "In 80% of scenarios, werkelijk costs more"
- Use paired differences to show true comparison
- Consider simplified "optimistic/pessimistic/realistic" scenarios instead of full MC

### 2. Historical Backtests

**Goal**: Show tax impact during real historical events (2008 crash, dot-com, COVID). More tangible than random simulations because users lived through these events.

**Implementation approach**:
1. Create `src/data/historicalReturns.json` with annual returns:
   - ETF: MSCI World Total Return (1995-2024, ~30 years)
   - Savings: ECB deposit rates or Dutch savings rates
   - Crypto: BTC annual returns (2013-2024 only, earlier years N/A)

2. Add `runBacktest(params, stelsel, startYear)` in `useSimulation.js`:
   - Reuse existing `simulate()` with `overrideReturns` from historical data
   - Return simulation results with year annotations

3. Dashboard changes:
   - Add "Backtest" toggle or tab
   - Dropdown to select start year (1995, 2000, 2007, 2010, etc.)
   - Annotate chart with crisis events (vertical lines + labels)
   - Show specific impact: "2008: ETF -38%, tax €X vs forfaitair €Y"

**Key scenarios to highlight**:
- **2008 Credit Crisis**: ETF ~-40%, savings rates still positive
- **2000-2002 Dot-com**: Multi-year bear market, cumulative -45%
- **2020 COVID**: -30% March, +70% by December (net positive year)
- **2022 Rate hikes**: Both stocks and bonds negative

**Data sources**:
- MSCI World: `https://www.msci.com/end-of-day-data-search`
- ECB rates: `https://www.ecb.europa.eu/stats/policy_and_exchange_rates/`
- BTC: CoinGecko or CoinMarketCap historical data

**Considerations**:
- Crypto only available from ~2013, show N/A or exclude for earlier backtests
- Start year matters significantly - 2007 vs 2009 start = very different outcomes
- Could show "worst case start year" analysis automatically
- Historical forfaitair rates also changed - may need to use current rates for fair comparison

### 3. Intuitive Scenario Presentation (combines MC + Backtests)

**Goal**: Present both Monte Carlo and historical backtests in a unified, intuitive way.

**Ideas**:
- "What if" scenarios: "What if 2008 happens again?", "What if markets return 7% annually?"
- Risk tolerance selector: Conservative/Moderate/Aggressive affects displayed scenarios
- Side-by-side comparison mode: Show deterministic vs historical vs MC ranges
- Key insight summary: "In bear markets, werkelijk saves you €X. In bull markets, it costs €Y."
