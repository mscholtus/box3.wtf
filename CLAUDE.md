# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Box 3 Calculator (box3.wtf) - A Dutch tax calculator comparing the "forfaitair" (fictional return) tax system with the proposed "werkelijk rendement" (actual return) system for Box 3 wealth taxation.

- **Forfaitair (current)**: Tax based on fictional returns (5.88% investments, 1.37% savings)
- **Werkelijk rendement (2028+)**: Proposed tax on actual realized and unrealized gains

## Tech Stack

- **React 18** with Vite
- **Recharts** for data visualization
- **No CSS framework** - inline styles with theme objects
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
│   └── useSimulation.js  # Simulation logic and Monte Carlo
└── utils/
    ├── format.js    # Number formatting (€1.2M, €50K)
    └── tax.js       # Tax calculation functions, RNG
```

### Key Files

- **`src/App.jsx`** - Main app with state management, routing, theme
- **`src/constants/tax.js`** - All tax constants (rates, thresholds)
- **`src/hooks/useSimulation.js`** - `simulate()` and `runMonteCarlo()` functions
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

### Monte Carlo Simulation
- 1000 simulations with seeded PRNG (Mulberry32)
- Normal distribution around expected returns
- Volatility: ETF 15%, Crypto 40%, Savings 0.5%
- Return floor: -60% per year
- Only runs when `advancedMode` is enabled

## Theming

Two themes defined in `App.jsx`: light and dark. Theme follows system preference by default. All colors referenced via `theme.{property}` (e.g., `theme.text`, `theme.accent`, `theme.card`).

## URL State

Calculator state is encoded in URL hash for sharing:
```
https://box3.wtf/#etf=50000&crypto=5000&spaar=25000&...
```

## Important Notes

- Tax rates are based on 2025 actuals (forfaitair) and estimates (werkelijk 2028+)
- Pension investments (pensioen) are exempt from Box 3
- The "werkelijk rendement" law is pending Eerste Kamer approval
- All calculations run client-side; no data is sent to servers
