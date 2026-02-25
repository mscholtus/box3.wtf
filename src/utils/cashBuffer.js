/**
 * Cash buffer analysis utilities
 *
 * Calculates how much cash investors need to keep uninvested to avoid forced selling
 * when paying werkelijk rendement taxes.
 */

/**
 * Calculate required cash buffer for a given scenario
 * @param {Object} werkelijkResult - Simulation result for werkelijk rendement
 * @param {number} startSpaar - Initial savings amount
 * @returns {Object} Buffer analysis
 */
export function analyzeBufferForScenario(werkelijkResult, startSpaar) {
  const { data } = werkelijkResult;

  let maxAnnualTax = 0;
  let maxTaxYear = null;
  let yearsWithTax = 0;

  // Find maximum annual tax payment and count years with taxes
  for (let i = 1; i < data.length; i++) {
    const year = data[i];
    if (year.jaar < 2028) continue; // Only werkelijk years

    if (year.belasting > 0) {
      yearsWithTax++;
      if (year.belasting > maxAnnualTax) {
        maxAnnualTax = year.belasting;
        maxTaxYear = year.jaar;
      }
    }
  }

  // Check if savings were depleted
  const spaarUitgeput = werkelijkResult.spaarUitgeputJaar !== null;

  return {
    maxAnnualTax: Math.round(maxAnnualTax),
    maxTaxYear,
    yearsWithTax,
    spaarUitgeput,
    recommendedBuffer: Math.round(maxAnnualTax * 1.2), // 20% safety margin
  };
}

/**
 * Calculate buffer requirements across all scenarios
 * @param {Object} scenarioResults - All scenario simulation results
 * @param {number} startSpaar - Initial savings amount
 * @returns {Object} Comprehensive buffer analysis
 */
export function analyzeBufferAcrossScenarios(scenarioResults, startSpaar) {
  const scenarios = Object.keys(scenarioResults);
  const analyses = {};

  let maxBufferNeeded = 0;
  let worstScenario = null;
  let scenariosWithDepletion = 0;

  scenarios.forEach(id => {
    const result = scenarioResults[id];
    const analysis = analyzeBufferForScenario(result.werkelijk, startSpaar);

    analyses[id] = {
      ...analysis,
      name: result.name,
      icon: result.icon,
    };

    if (analysis.recommendedBuffer > maxBufferNeeded) {
      maxBufferNeeded = analysis.recommendedBuffer;
      worstScenario = id;
    }

    if (analysis.spaarUitgeput) {
      scenariosWithDepletion++;
    }
  });

  // Calculate opportunity cost of keeping buffer uninvested
  // Assuming 7% annual return over time horizon
  const calculateOpportunityCost = (buffer, years, annualReturn = 0.07) => {
    // Future value of invested buffer minus the buffer itself
    const futureValue = buffer * Math.pow(1 + annualReturn, years);
    return Math.round(futureValue - buffer);
  };

  const jaren = scenarioResults[scenarios[0]]?.werkelijk.data.length - 1 || 25;
  const opportunityCost = calculateOpportunityCost(maxBufferNeeded, jaren);

  return {
    scenarios: analyses,
    maxBufferNeeded: Math.round(maxBufferNeeded),
    worstScenario,
    scenariosWithDepletion,
    totalScenarios: scenarios.length,
    opportunityCost,
    jaren,
  };
}

/**
 * Calculate percentile-based buffer recommendations
 * For Monte Carlo simulations (future use)
 * @param {Array} annualTaxes - Array of annual tax amounts across all simulations
 * @returns {Object} Percentile-based recommendations
 */
export function calculatePercentileBuffers(annualTaxes) {
  const sorted = [...annualTaxes].sort((a, b) => a - b);
  const getPercentile = (p) => {
    const index = Math.floor((p / 100) * (sorted.length - 1));
    return Math.round(sorted[index]);
  };

  return {
    p50: getPercentile(50), // Covers 50% of scenarios
    p80: getPercentile(80), // Covers 80% of scenarios
    p95: getPercentile(95), // Covers 95% of scenarios
    p99: getPercentile(99), // Covers 99% of scenarios
  };
}
