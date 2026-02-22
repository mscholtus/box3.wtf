/**
 * Tax calculation utilities for Box 3
 */

import {
  FORFAIT_OVERIG,
  FORFAIT_SPAAR,
  FORFAIT_TARIEF,
  HEFFINGSVRIJ_F,
  HEFFINGSVRIJ_W,
  WERKELIJK_TARIEF,
  VERLIES_DREMPEL,
  MC_RETURN_FLOOR,
} from '../constants/tax';

/**
 * Calculate Box 3 tax for a given year
 * @param {'forfaitair'|'werkelijk'} stelsel - Tax system
 * @param {number} etf - ETF/stock value
 * @param {number} crypto - Crypto value
 * @param {number} spaar - Savings value
 * @param {number} etfGr - ETF growth this year
 * @param {number} cryptoGr - Crypto growth this year
 * @param {number} spaarGr - Savings growth this year
 * @param {number} hv - Tax-free threshold
 * @param {number} verliesVoorraad - Carried-forward losses from previous years (werkelijk only)
 * @returns {Object} { belasting, verliesVoorraadNieuw } - Tax amount and updated loss carry-forward
 */
export function calcTax(stelsel, etf, crypto, spaar, etfGr, cryptoGr, spaarGr, hv, verliesVoorraad = 0) {
  if (stelsel === "forfaitair") {
    const overige = etf + crypto;
    const totaalB3 = overige + spaar;
    const fictief = spaar * FORFAIT_SPAAR + overige * FORFAIT_OVERIG;
    const grondslag = Math.max(0, totaalB3 - hv);
    const factor = totaalB3 > 0 ? grondslag / totaalB3 : 0;
    return {
      belasting: Math.max(0, fictief * factor * FORFAIT_TARIEF),
      verliesVoorraadNieuw: 0, // Forfaitair has no loss carry-forward
    };
  }

  // Werkelijk rendement with loss carry-forward
  const werkelijk = etfGr + cryptoGr + spaarGr;

  if (werkelijk < 0) {
    // Negative return: add to loss carry-forward if > €500 threshold
    const nieuwVerlies = Math.abs(werkelijk) > VERLIES_DREMPEL ? Math.abs(werkelijk) : 0;
    return {
      belasting: 0,
      verliesVoorraadNieuw: verliesVoorraad + nieuwVerlies,
    };
  }

  // Positive return: first offset with carried-forward losses, then apply threshold
  const naVerliesVerrekening = Math.max(0, werkelijk - verliesVoorraad);
  const gebruiktVerlies = werkelijk - naVerliesVerrekening;
  const resterendVerlies = Math.max(0, verliesVoorraad - gebruiktVerlies);

  const belastbaarInkomen = Math.max(0, naVerliesVerrekening - hv);
  return {
    belasting: belastbaarInkomen * WERKELIJK_TARIEF,
    verliesVoorraadNieuw: resterendVerlies,
  };
}

/**
 * Calculate first year tax comparison
 * @param {Object} assets - Asset values
 * @param {boolean} fiscaalPartner
 * @returns {Object} Tax comparison
 */
export function calcFirstYearTax(assets, fiscaalPartner) {
  const { etf, crypto, spaar, rendEtf, rendCrypto, rendSpaar } = assets;

  const hvF = fiscaalPartner ? HEFFINGSVRIJ_F * 2 : HEFFINGSVRIJ_F;
  const hvW = fiscaalPartner ? HEFFINGSVRIJ_W * 2 : HEFFINGSVRIJ_W;

  const etfGr = etf * rendEtf;
  const cryptoGr = crypto * rendCrypto;
  const spaarGr = spaar * rendSpaar;

  const forfaitair = calcTax("forfaitair", etf, crypto, spaar, etfGr, cryptoGr, spaarGr, hvF).belasting;
  const werkelijk = calcTax("werkelijk", etf, crypto, spaar, etfGr, cryptoGr, spaarGr, hvW).belasting;

  return { forfaitair, werkelijk, diff: forfaitair - werkelijk };
}

/**
 * Pay tax from assets (savings first, then reduce contributions, then sell investments)
 * @param {number} etf
 * @param {number} crypto
 * @param {number} spaar
 * @param {number} belasting - Tax to pay
 * @param {boolean} betaalUitSpaar - Pay from savings first
 * @param {number} bijEtf - ETF contribution
 * @param {number} bijCrypto - Crypto contribution
 * @param {number} bijPensioen - Pension contribution (also reduced when paying tax)
 * @returns {Object} Updated values including source breakdown
 */
export function payTax(etf, crypto, spaar, belasting, betaalUitSpaar, bijEtf, bijCrypto, bijPensioen = 0, bijSpaar = 0) {
  let rem = belasting;
  let spaarUitgeput = false;
  let invVerkocht = false;
  let bijEtfRest = bijEtf;
  let bijCryptoRest = bijCrypto;
  let bijPensioenRest = bijPensioen;
  let bijSpaarRest = bijSpaar;

  // Track where tax payment came from
  let uitSpaar = 0;          // Existing savings + savings contributions
  let uitBijdragen = 0;      // ETF + crypto contributions reduced
  let uitPensioen = 0;       // Pension contributions reduced
  let uitInvestments = 0;    // Sold investments

  if (rem <= 0) {
    return { etf, crypto, spaar, bijEtfRest, bijCryptoRest, bijPensioenRest, bijSpaarRest, spaarUitgeput, invVerkocht, uitSpaar, uitBijdragen, uitPensioen, uitInvestments };
  }

  if (betaalUitSpaar) {
    // Pay from existing savings first
    if (spaar >= rem) {
      spaar -= rem;
      uitSpaar = rem;
      rem = 0;
    } else {
      uitSpaar = spaar;
      rem -= spaar;
      spaar = 0;
    }

    // Then use savings contribution
    if (rem > 0 && bijSpaarRest > 0) {
      const fromBijSpaar = Math.min(rem, bijSpaarRest);
      bijSpaarRest -= fromBijSpaar;
      uitSpaar += fromBijSpaar;
      rem -= fromBijSpaar;
      if (bijSpaarRest === 0 && spaar === 0) {
        spaarUitgeput = true;
      }
    } else if (spaar === 0 && bijSpaarRest === 0) {
      spaarUitgeput = true;
    }

    // Then reduce investment contributions (ETF, crypto, pension) proportionally
    if (rem > 0) {
      const totalBij = bijEtfRest + bijCryptoRest + bijPensioenRest;
      if (totalBij > 0) {
        const absorb = Math.min(rem, totalBij);
        const f = absorb / totalBij;
        // Track pension separately from ETF/crypto contributions
        const pensionReduction = bijPensioenRest * f;
        const otherReduction = (bijEtfRest + bijCryptoRest) * f;
        bijEtfRest = Math.max(0, bijEtfRest - bijEtfRest * f);
        bijCryptoRest = Math.max(0, bijCryptoRest - bijCryptoRest * f);
        bijPensioenRest = Math.max(0, bijPensioenRest - bijPensioenRest * f);
        uitBijdragen = otherReduction;
        uitPensioen = pensionReduction;
        rem -= absorb;
      }
    }

    // Finally sell investments
    if (rem > 0) {
      invVerkocht = true;
      const totInv = etf + crypto;
      const actualFromInv = Math.min(rem, totInv);
      uitInvestments = actualFromInv;
      if (totInv > 0) {
        const sellFactor = actualFromInv / totInv;
        etf = Math.max(0, etf * (1 - sellFactor));
        crypto = Math.max(0, crypto * (1 - sellFactor));
      }
    }
  } else {
    // Pay proportionally from all assets
    const box3 = etf + crypto + spaar;
    if (box3 > 0) {
      const f = 1 - Math.min(rem / box3, 1);
      // Track proportional amounts
      const spaarPaid = spaar - spaar * f;
      const invPaid = (etf + crypto) - (etf + crypto) * f;
      uitSpaar = spaarPaid;
      uitInvestments = invPaid;
      etf *= f;
      crypto *= f;
      spaar *= f;
    }
  }

  return { etf, crypto, spaar, bijEtfRest, bijCryptoRest, bijPensioenRest, bijSpaarRest, spaarUitgeput, invVerkocht, uitSpaar, uitBijdragen, uitPensioen, uitInvestments };
}

/**
 * Get tax-free threshold for a given system
 * @param {'forfaitair'|'werkelijk'} stelsel
 * @param {boolean} fiscaalPartner
 * @returns {number}
 */
export function getHeffingsvrij(stelsel, fiscaalPartner) {
  const base = stelsel === "forfaitair" ? HEFFINGSVRIJ_F : HEFFINGSVRIJ_W;
  return fiscaalPartner ? base * 2 : base;
}

/**
 * Mulberry32 seeded PRNG - fast and good quality
 * @param {number} seed
 * @returns {function} Random number generator (0-1)
 */
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Session seed - fixed default for reproducibility, can be reset by user
const DEFAULT_SEED = 42;
let sessionSeed = DEFAULT_SEED;
let rng = mulberry32(sessionSeed);

/**
 * Get current session seed
 * @returns {number}
 */
export function getSessionSeed() {
  return sessionSeed;
}

/**
 * Set session seed to a specific value
 * @param {number} seed
 */
export function setSessionSeed(seed) {
  sessionSeed = seed;
  rng = mulberry32(sessionSeed);
}

/**
 * Reset session seed to a new random value
 * @returns {number} The new seed
 */
export function resetSessionSeed() {
  sessionSeed = Math.floor(Math.random() * 2147483647);
  rng = mulberry32(sessionSeed);
  return sessionSeed;
}

/**
 * Generate random normal number (Box-Muller transform) using seeded PRNG
 * @returns {number}
 */
export function randn() {
  let u = 0, v = 0;
  while (!u) u = rng();
  while (!v) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Reset RNG to session seed (for consistent results when params change)
 */
export function resetRng() {
  rng = mulberry32(sessionSeed);
}

/**
 * Clamp return to prevent extreme losses
 * @param {number} r
 * @returns {number}
 */
export function clampReturn(r) {
  return Math.max(MC_RETURN_FLOOR, r);
}
