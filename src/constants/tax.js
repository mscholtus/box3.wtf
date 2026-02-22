/**
 * Box 3 tax constants for Dutch tax system
 * Forfaitair (2027): fictional return-based taxation
 * Werkelijk (2028+): actual return-based taxation (pending Eerste Kamer approval)
 */

// Forfaitair system rates (2027 estimate, based on 2025 actuals)
// 2025 actuals: spaargeld 1.37%, beleggingen 5.88%, heffingsvrij €57.684
// 2027 estimates assume slight adjustments
export const FORFAIT_OVERIG = 0.0588;    // ~5.88% fictional return on investments
export const FORFAIT_SPAAR = 0.0137;     // ~1.37% fictional return on savings
export const FORFAIT_TARIEF = 0.36;      // 36% tax rate
export const HEFFINGSVRIJ_F = 57684;     // Tax-free capital threshold per person (2025)

// Werkelijk rendement system rates (2028+, estimated)
export const WERKELIJK_TARIEF = 0.36;    // 36% tax rate on actual returns
export const HEFFINGSVRIJ_W = 1800;      // Tax-free income threshold per person (estimated)
export const VERLIES_DREMPEL = 500;      // Loss threshold - only losses > €500 qualify for carry-forward

// Simulation defaults
export const DEFAULT_JAREN = 25;
export const DEFAULT_REND_ETF = 0.07;
export const DEFAULT_REND_CRYPTO = 0.10;
export const DEFAULT_REND_SPAAR = 0.02;
export const DEFAULT_VOL_ETF = 0.15;
export const DEFAULT_VOL_CRYPTO = 0.40;

// Default asset values (CBS/DNB-based median box 3 portfolio)
export const DEFAULT_START_ETF = 50000;
export const DEFAULT_START_CRYPTO = 0;
export const DEFAULT_START_SPAAR = 25000;
export const DEFAULT_START_PENSIOEN = 20000;
export const DEFAULT_BIJ_ETF = 3000;
export const DEFAULT_BIJ_CRYPTO = 0;
export const DEFAULT_BIJ_SPAAR = 0;
export const DEFAULT_BIJ_PENSIOEN = 2000;
export const DEFAULT_FISCAAL_PARTNER = false;
export const DEFAULT_BETAAL_UIT_SPAAR = true;
export const DEFAULT_ADVANCED_MODE = false;
export const DEFAULT_MC_SEED = 42;

// Monte Carlo settings
export const MC_SIMULATIONS = 1000;
export const MC_RETURN_FLOOR = -0.6;     // Maximum loss per year (-60%)
