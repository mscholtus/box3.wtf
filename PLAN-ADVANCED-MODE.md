# Plan: Advanced Mode - Impact Analysis & Tax Planning

## Goal

Help Dutch investors **understand the consequences of werkelijk rendement (2028)** by showing:
1. **Unpredictable tax bills** - You only know what you owe after the year ends
2. **Forced selling** - May need to liquidate investments to pay taxes on paper gains
3. **Reduced investing** - People will invest less to keep cash reserves for unknown tax bills
4. **Illiquid asset risk** - Real estate, private equity, unlisted shares: taxed on gains you can't access

## The Core Problem

### You Can't Plan for Unknown Tax Bills

With forfaitair, you know roughly what you'll owe:
- ~2% of assets × 36% = predictable annual amount
- You can budget monthly

With werkelijk rendement:
- Tax depends on market performance you can't predict
- You only know your tax bill **after December 31**
- Filing deadline is months later, but the damage is done
- Good year? Surprise €10.000 tax bill. Bad year? €0.

**This is not how responsible financial planning works.**

### The Perverse Incentives

1. **Keep cash on the sidelines** - Invest less, keep buffer for unknown tax
2. **Forced selling at worst time** - If markets drop in January, you sell low to pay last year's tax
3. **Penalizes buy-and-hold** - Taxed on paper gains you never realized
4. **Illiquid assets become toxic** - Can't sell a rental property to pay €20K tax on paper appreciation

### Who Gets Hurt Most

| Investor Type | Problem |
|---------------|---------|
| **Long-term ETF investor** | Taxed on unrealized gains every year, forced to sell or keep large cash buffer |
| **Property owner** | Paper gains on house, but can't sell a bedroom to pay taxes |
| **Startup founder** | Shares worth €500K on paper, €0 liquidity, €50K+ tax bill |
| **Retiree** | Fixed income, variable tax bill, may need to liquidate retirement assets |
| **Crypto holder** | Extreme volatility = extreme tax swings, potentially huge bills in bull years |

---

## What This Tool Should Show

### 1. The Uncertainty Problem

**Scenario comparison:**
Show same portfolio under different market conditions:

| Market Scenario | Tax Bill | But You Didn't Know This in January |
|-----------------|----------|-------------------------------------|
| ETF +20% | €7.200 | ❌ |
| ETF +7% | €2.520 | ❌ |
| ETF -15% | €0 | ❌ |
| ETF +35% | €12.600 | ❌ |

**Key message:** "Je weet pas na afloop van het jaar hoeveel belasting je moet betalen."

### 2. The Cash Buffer Trap

To avoid forced selling, you need to keep cash uninvested:

```
┌─────────────────────────────────────────────────────┐
│  💰 Hoeveel cash moet je aanhouden?                 │
│                                                     │
│  Om in 95% van de marktscenario's belasting te      │
│  kunnen betalen zonder te verkopen:                 │
│                                                     │
│  Aanbevolen buffer: €15.000                         │
│                                                     │
│  Dit is geld dat je NIET kunt beleggen.             │
│  Opportuniteitskosten over 25 jaar: ~€45.000        │
│                                                     │
│  ⚠️ En nog steeds kun je in extreme jaren           │
│  gedwongen worden te verkopen.                      │
└─────────────────────────────────────────────────────┘
```

### 3. Forced Selling Scenarios

Show when the simulation requires selling investments:

```
┌─────────────────────────────────────────────────────┐
│  🔴 Gedwongen verkoop in simulatie                  │
│                                                     │
│  In dit scenario moet je in 8 van de 25 jaar        │
│  beleggingen verkopen om belasting te betalen.      │
│                                                     │
│  Grootste tekort: €4.200 in 2031                    │
│  (na een jaar met +22% rendement)                   │
│                                                     │
│  Dit betekent:                                      │
│  • Verkopen op een moment dat je niet kiest         │
│  • Mogelijk transactiekosten                        │
│  • Minder vermogensopbouw                           │
└─────────────────────────────────────────────────────┘
```


### 5. Impact on Investment Behavior

Show the rational response to this system:

```
┌─────────────────────────────────────────────────────┐
│  📉 Gevolgen voor je beleggingsstrategie            │
│                                                     │
│  Rationele reacties op werkelijk rendement:         │
│                                                     │
│  1. Minder beleggen, meer cash aanhouden            │
│     → Lagere vermogensopbouw                        │
│                                                     │
│  2. Minder risico nemen (minder ETF, meer sparen)   │
│     → Lager verwacht rendement                      │
│                                                     │
│  3. Belasting uit spaargeld of inkomen betalen      │
│     → Minder beschikbaar voor andere doelen         │
│                                                     │
│  Geen van deze opties maakt je rijker.              │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Scenario Uncertainty (MVP) ✅ IMPLEMENTED

Show the same portfolio under different market outcomes:

**Scenarios:**
1. Verwacht (7%/jaar) - baseline
2. Bull market (15%/jaar) - high tax scenario
3. Crash (-30% first year) - low tax but also low wealth, then recovery
4. Volatiel (alternating +20%, -15%, +25%, -10%...) - unpredictable taxes
5. Stagnatie (2%/jaar) - low tax, low growth

**UI (Implemented):**
- ✅ ScenarioSelector component - Grid of 5 scenario cards with visual selection
- ✅ TaxUncertaintyCard component - Shows tax range across all scenarios with gradient bar
- ✅ Scenario state in App.jsx - Runs simulations for all 5 scenarios
- ✅ Dashboard integration - Charts update based on selected scenario
- ✅ OutcomeCard shows scenario name
- ✅ Warning message: "Je weet pas achteraf welk scenario het werd"

**Files Created:**
- `src/data/scenarios.js` - Scenario definitions and return generation
- `src/components/pages/ScenarioSelector.jsx` - Interactive scenario picker
- `src/components/pages/TaxUncertaintyCard.jsx` - Tax uncertainty visualization

**Files Modified:**
- `src/App.jsx` - Added scenario state and simulation logic
- `src/components/pages/Dashboard.jsx` - Integrated scenario components and data
- `src/components/pages/OutcomeCard.jsx` - Added scenario name display
- `src/components/pages/index.js` - Exported new components

### Phase 2: Cash Buffer Analysis ✅ IMPLEMENTED

Calculate required buffer to avoid forced selling:

**Metrics (Implemented):**
- ✅ Maximum buffer needed across all scenarios
- ✅ Worst scenario identification
- ✅ Opportunity cost calculation (7% annual return over time horizon)
- ✅ Scenarios with savings depletion tracking
- ✅ Per-scenario buffer requirements

**UI (Implemented):**
- ✅ CashBufferCard component showing recommended buffer
- ✅ Opportunity cost display with explanation
- ✅ Scenario breakdown sorted by required buffer
- ✅ Warning when buffer insufficient in some scenarios
- ✅ Key insight: "De cash trap" explanation

**Files Created:**
- `src/utils/cashBuffer.js` - Buffer calculation utilities
- `src/components/pages/CashBufferCard.jsx` - Buffer analysis visualization

**Key Features:**
- Shows maximum annual tax across scenarios
- Calculates opportunity cost of uninvested buffer
- Identifies which scenarios deplete savings despite buffer
- Visual bars showing buffer requirements per scenario

### Phase 3: Forced Selling Detector ✅ IMPLEMENTED

Analyze when simulation requires liquidating investments:

**Metrics (Implemented):**
- ✅ Years with forced selling detection
- ✅ Largest shortfall and year identification
- ✅ Total value sold calculation
- ✅ Tax payment source breakdown per year

**UI (Implemented):**
- ✅ ForcedSellingWarning component (only shows for affected scenarios)
- ✅ Summary statistics: total sold, largest shortfall, years affected
- ✅ Impact explanation (timing risk, transaction costs, compound interest loss)
- ✅ Year-by-year expandable breakdown
- ✅ Shows tax, available cash, and shortfall for each year

**Files Created:**
- `src/utils/forcedSelling.js` - Forced selling analysis utilities
- `src/components/pages/ForcedSellingWarning.jsx` - Warning component

**Key Features:**
- Only displays when current scenario has forced selling
- Collapsible year-by-year details
- Shows exactly when and how much needs to be sold
- Explains consequences of forced liquidation

### Phase 4: Monte Carlo Uncertainty ✅ UI READY (MC integration pending)

Use existing MC code to show range of outcomes:

**UI (Implemented):**
- ✅ MonteCarloToggle component with on/off state
- ✅ Explanation of what MC shows (percentile bands)
- ✅ Disabled state with "coming soon" message
- ✅ Visual toggle switch

**Status:**
- Monte Carlo simulation code exists in `useSimulation.js`
- UI framework ready to receive MC data
- Full MC integration deferred for future update
- Currently shows disabled toggle with explanation

**Files Created:**
- `src/components/pages/MonteCarloToggle.jsx` - Toggle component

**Next Steps (Future):**
- Connect MC simulation to scenarios
- Add percentile bands to charts
- Show probability-based insights
- Enable toggle when MC data ready

---

## Key Messages

### Primary Message
"Je weet pas na afloop van het jaar hoeveel belasting je verschuldigd bent. Dit maakt financiële planning onmogelijk."

### Secondary Messages

1. **Cash trap:** "Om niet gedwongen te hoeven verkopen, moet je geld cash houden dat je niet kunt beleggen."

2. **Forced selling:** "In goede beursjaren kun je gedwongen worden om beleggingen te verkopen om belasting te betalen."

3. **Unrealized gains:** "Je betaalt belasting over winsten die alleen op papier bestaan."

4. **Illiquid assets:** "Bezittingen die je niet kunt verkopen worden ook belast - maar waarmee betaal je?"

5. **Behavioral impact:** "De rationele reactie is minder beleggen en meer cash aanhouden - dat kost je op lange termijn vermogen."

---

## UI Components to Build

### 1. ScenarioSelector
- Dropdown with named scenarios
- Shows scenario description
- Triggers recalculation

### 2. TaxUncertaintyCard
- Shows tax range across scenarios
- Emphasizes unpredictability
- "Je weet dit pas achteraf"

### 3. CashBufferCard
- Required buffer calculation
- Opportunity cost display
- Safety vs growth trade-off

### 4. ForcedSellingWarning
- Appears when simulation shows selling
- Years affected
- Amounts involved

### 5. LiquidityTab (Dashboard)
- Year-by-year breakdown
- Tax vs available cash
- Shortfall highlighting

---

## Files to Create/Modify

### New Files
```
src/data/scenarios.js          - Scenario definitions
src/components/pages/
  ScenarioSelector.jsx         - Dropdown component
  TaxUncertaintyCard.jsx       - Tax range display
  CashBufferCard.jsx           - Buffer recommendation
  ForcedSellingWarning.jsx     - Liquidation warning
  LiquidityTab.jsx             - Detailed breakdown
```

### Modified Files
```
src/App.jsx                    - Add scenario state
src/components/pages/
  Dashboard.jsx                - Integrate new components
  OutcomeCard.jsx              - Show scenario context
```

---

## Success Metrics

1. **Awareness:** Users understand they can't predict their tax bill
2. **Concern:** Users recognize the forced selling risk
3. **Understanding:** Users see the trade-off between buffer and opportunity cost
4. **Sharing:** Users share results to inform others about this law

---

## Open Questions

1. How prominently should we criticize the system design vs just show facts?
   - **Answer:** Just show facts and likely consequences (no political messaging)
2. Should we suggest political action (contact representatives)?
   - **Answer:** No, just informing
3. How to handle edge cases (people with mostly illiquid assets)?
   - **Answer:** Only mention as side note/example - no hard data available
4. Should we show what happens if you can't pay (interest, penalties)?
   - **Answer:** No, let's not go into that

---

## Implementation Summary

### ✅ Completed Features

**Phase 1: Scenario Uncertainty**
- 5 market scenarios with different return patterns
- Interactive scenario selector
- Tax uncertainty visualization across scenarios
- Warning: "Je weet pas achteraf welk scenario het werd"

**Phase 2: Cash Buffer Analysis**
- Calculates required buffer to avoid forced selling
- Shows opportunity cost of uninvested cash (~€45K over 25 years for typical portfolio)
- Per-scenario buffer requirements
- Warning when buffer insufficient

**Phase 3: Forced Selling Detector**
- Detects when investments must be sold to pay taxes
- Year-by-year breakdown of forced liquidations
- Shows total sold, largest shortfall, years affected
- Explains consequences (timing risk, transaction costs)

**Phase 4: Monte Carlo Toggle**
- UI framework ready
- Toggle component implemented
- Currently disabled pending MC integration
- Can be enabled in future update

### 📊 Total Implementation

**Files Created:** 9
- `src/data/scenarios.js`
- `src/utils/cashBuffer.js`
- `src/utils/forcedSelling.js`
- `src/components/pages/ScenarioSelector.jsx`
- `src/components/pages/TaxUncertaintyCard.jsx`
- `src/components/pages/CashBufferCard.jsx`
- `src/components/pages/ForcedSellingWarning.jsx`
- `src/components/pages/MonteCarloToggle.jsx`

**Files Modified:** 4
- `src/App.jsx` - Scenario state and simulation logic
- `src/components/pages/Dashboard.jsx` - Integrated all new components
- `src/components/pages/OutcomeCard.jsx` - Shows scenario name
- `src/components/pages/index.js` - Exports

**Bundle Impact:**
- Before: 206KB main, 406KB Dashboard
- After: 220KB main, 407KB Dashboard
- Increase: ~14KB main (6.8%), ~1KB Dashboard (0.2%)

**Test Coverage:**
- All 72 tests passing
- No regressions
- Build successful
