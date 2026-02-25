/**
 * Predefined market scenarios for demonstrating werkelijk rendement uncertainty
 *
 * Each scenario shows how different market conditions lead to vastly different tax bills,
 * highlighting the core problem: you can't plan for unknown tax obligations.
 */

/**
 * Generate return sequence for a scenario
 * @param {string} type - Scenario type
 * @param {number} jaren - Number of years
 * @param {Object} baseReturns - Base returns {rendEtf, rendCrypto, rendSpaar}
 * @returns {Array} Array of {etf, crypto, spaar} returns for each year
 */
function generateScenarioReturns(type, jaren, baseReturns, customReturns = null) {
  const { rendEtf, rendCrypto, rendSpaar } = baseReturns;

  switch (type) {
    case 'custom':
      // Custom: user-defined constant returns
      if (!customReturns) {
        // Fallback to verwacht if no custom returns provided
        return generateScenarioReturns('verwacht', jaren, baseReturns);
      }
      return Array.from({ length: jaren }, () => ({
        etf: customReturns.etf,
        crypto: customReturns.crypto,
        spaar: customReturns.spaar,
      }));

    case 'verwacht':
      // Baseline: steady expected returns (7% ETF, current crypto/spaar)
      return Array.from({ length: jaren }, () => ({
        etf: rendEtf,
        crypto: rendCrypto,
        spaar: rendSpaar,
      }));

    case 'bull':
      // Bull market: good sustained returns (10%/jaar ETF, 15% crypto)
      return Array.from({ length: jaren }, () => ({
        etf: 0.10,
        crypto: 0.15,
        spaar: rendSpaar,
      }));

    case 'crash':
      // Market crash: -30% in 2029 (index 2), slow recovery, then normal
      const crashPattern = (i) => {
        if (i === 0) return rendEtf;  // 2027: normal
        if (i === 1) return rendEtf;  // 2028: normal
        if (i === 2) return -0.30;    // 2029: crash
        if (i === 3) return -0.05;    // 2030: still negative
        if (i === 4) return 0.15;     // 2031: recovery
        return rendEtf;               // 2032+: normal
      };
      return Array.from({ length: jaren }, (_, i) => ({
        etf: crashPattern(i),
        crypto: crashPattern(i) * 1.2, // Crypto slightly more extreme
        spaar: rendSpaar,
      }));

    case 'volatiel':
      // Volatile: alternating swings (+15%, -10%, +12%, -8%, ...)
      const pattern = [0.15, -0.10, 0.12, -0.08];
      return Array.from({ length: jaren }, (_, i) => ({
        etf: pattern[i % pattern.length],
        crypto: pattern[i % pattern.length] * 1.5, // Crypto more volatile
        spaar: rendSpaar,
      }));

    case 'stagnatie':
      // Stagnation: low growth (2%/jaar ETF, minimal crypto)
      return Array.from({ length: jaren }, () => ({
        etf: 0.02,
        crypto: 0.03,
        spaar: rendSpaar,
      }));

    default:
      return generateScenarioReturns('verwacht', jaren, baseReturns);
  }
}

/**
 * Scenario definitions with metadata
 */
export const SCENARIOS = {
  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'Stel je eigen rendementen in',
    icon: '🎯',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  verwacht: {
    id: 'verwacht',
    name: 'Vast rendement',
    description: 'Stel constante percentages in',
    icon: '⚙️',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  bull: {
    id: 'bull',
    name: 'Bull market',
    description: 'Goede jaren: 10%/jaar ETF',
    icon: '🚀',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  crash: {
    id: 'crash',
    name: 'Marktcrash',
    description: '-30% in 2029, geleidelijk herstel',
    icon: '📉',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  volatiel: {
    id: 'volatiel',
    name: 'Volatiel',
    description: 'Afwisselend +15%, -10%, +12%, -8%',
    icon: '📊',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  stagnatie: {
    id: 'stagnatie',
    name: 'Stagnatie',
    description: 'Lage groei: 2%/jaar ETF',
    icon: '➡️',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
};

/**
 * Get scenario metadata and returns
 * @param {string} scenarioId - Scenario identifier
 * @param {number} jaren - Number of years
 * @param {Object} baseReturns - Base returns {rendEtf, rendCrypto, rendSpaar}
 * @param {Object} customReturns - Optional custom returns for 'custom' scenario
 * @returns {Object} Scenario metadata and returns array
 */
export function getScenario(scenarioId, jaren, baseReturns, customReturns = null) {
  const metadata = SCENARIOS[scenarioId] || SCENARIOS.verwacht;
  const returns = generateScenarioReturns(scenarioId, jaren, baseReturns, customReturns);

  return {
    ...metadata,
    returns,
  };
}

/**
 * Get all scenario IDs in display order
 */
export function getScenarioIds() {
  return ['verwacht', 'bull', 'crash', 'volatiel', 'stagnatie'];
}

/**
 * Check if scenario should open custom modal
 */
export function isCustomizableScenario(scenarioId) {
  return scenarioId === 'verwacht' || scenarioId === 'custom';
}
