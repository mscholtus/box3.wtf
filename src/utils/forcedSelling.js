/**
 * Forced selling analysis utilities
 *
 * Analyzes when simulations require liquidating investments to pay taxes
 */

/**
 * Analyze forced selling for a single scenario
 * @param {Object} werkelijkResult - Simulation result for werkelijk rendement
 * @returns {Object} Forced selling analysis
 */
export function analyzeForcedSelling(werkelijkResult) {
  const { data } = werkelijkResult;

  const forcedSellingYears = [];
  let totalSold = 0;
  let largestShortfall = 0;
  let largestShortfallYear = null;

  for (let i = 1; i < data.length; i++) {
    const year = data[i];
    if (year.jaar < 2028) continue; // Only werkelijk years

    // Check if investments were sold (uitInvestments > 0)
    if (year.uitInvestments > 0) {
      forcedSellingYears.push({
        jaar: year.jaar,
        amount: year.uitInvestments,
        totalTax: year.belasting,
        availableFromSpaar: year.uitSpaar,
        availableFromContributions: year.uitBijdragen + year.uitPensioen,
      });

      totalSold += year.uitInvestments;

      if (year.uitInvestments > largestShortfall) {
        largestShortfall = year.uitInvestments;
        largestShortfallYear = year.jaar;
      }
    }
  }

  return {
    hasForcedSelling: forcedSellingYears.length > 0,
    yearsAffected: forcedSellingYears.length,
    years: forcedSellingYears,
    totalSold: Math.round(totalSold),
    largestShortfall: Math.round(largestShortfall),
    largestShortfallYear,
  };
}

/**
 * Analyze forced selling across all scenarios
 * @param {Object} scenarioResults - All scenario simulation results
 * @returns {Object} Comprehensive forced selling analysis
 */
export function analyzeForcedSellingAcrossScenarios(scenarioResults) {
  const scenarios = Object.keys(scenarioResults);
  const analyses = {};

  let scenariosWithForcedSelling = 0;
  let worstScenario = null;
  let maxYearsAffected = 0;

  scenarios.forEach(id => {
    const result = scenarioResults[id];
    const analysis = analyzeForcedSelling(result.werkelijk);

    analyses[id] = {
      ...analysis,
      name: result.name,
      icon: result.icon,
    };

    if (analysis.hasForcedSelling) {
      scenariosWithForcedSelling++;

      if (analysis.yearsAffected > maxYearsAffected) {
        maxYearsAffected = analysis.yearsAffected;
        worstScenario = id;
      }
    }
  });

  return {
    scenarios: analyses,
    scenariosWithForcedSelling,
    totalScenarios: scenarios.length,
    worstScenario,
    maxYearsAffected,
  };
}
