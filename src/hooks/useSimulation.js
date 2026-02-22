import { useMemo } from 'react';
import { calcTax, payTax, getHeffingsvrij, randn, clampReturn, resetRng } from '../utils/tax';
import { MC_SIMULATIONS } from '../constants/tax';

/**
 * Run a single simulation over the specified time horizon
 * @param {Object} params - Simulation parameters
 * @param {'forfaitair'|'werkelijk'} stelsel - Tax system
 * @param {boolean} metBijstorting - Include annual contributions
 * @param {boolean} betaalUitSpaar - Pay tax from savings first
 * @param {Array|null} overrideReturns - Override returns for Monte Carlo
 * @returns {Object} Simulation results
 */
export function simulate(params, stelsel, metBijstorting, betaalUitSpaar, overrideReturns) {
  const {
    startEtf,
    startCrypto,
    startSpaar,
    startPensioen,
    bijEtf,
    bijCrypto,
    bijSpaar,
    bijPensioen,
    rendEtf,
    rendCrypto,
    rendSpaar,
    jaren,
    fiscaalPartner,
  } = params;

  // Get both thresholds - forfaitair is used for 2027, then switch to actual stelsel
  const hvForfaitair = getHeffingsvrij('forfaitair', fiscaalPartner);
  const hvWerkelijk = getHeffingsvrij('werkelijk', fiscaalPartner);

  let etf = startEtf;
  let crypto = startCrypto;
  let spaar = startSpaar;
  let pensioen = startPensioen;
  let cumulB = 0;
  let cumulGemistePensioen = 0; // Track pension contributions lost to taxes
  let spaarUitgeputJaar = null;
  let verliesVoorraad = 0; // Loss carry-forward (werkelijk only)

  const data = [{
    jaar: 2026,
    etf,
    crypto,
    spaar,
    pensioen,
    totaal: etf + crypto + spaar + pensioen,
    belasting: 0,
    cumulBelasting: 0,
    verliesVoorraad: 0,
    gemistePensioen: 0,
    cumulGemistePensioen: 0,
    // Tax payment sources
    uitSpaar: 0,
    uitBijdragen: 0,
    uitPensioen: 0,
    uitInvestments: 0,
  }];

  for (let j = 1; j <= jaren; j++) {
    const currentYear = 2026 + j;
    const rEtf = overrideReturns ? overrideReturns[j - 1].etf : rendEtf;
    const rCrypto = overrideReturns ? overrideReturns[j - 1].crypto : rendCrypto;
    const rSpaar = overrideReturns ? overrideReturns[j - 1].spaar : rendSpaar;

    const etfGr = etf * rEtf;
    const cryptoGr = crypto * rCrypto;
    const spaarGr = spaar * Math.max(0, rSpaar);
    const pensioenGr = pensioen * rEtf;

    // 2027 uses forfaitair for both scenarios (werkelijk rendement starts 2028)
    const effectiveStelsel = currentYear <= 2027 ? 'forfaitair' : stelsel;
    const effectiveHv = effectiveStelsel === 'forfaitair' ? hvForfaitair : hvWerkelijk;
    const taxResult = calcTax(effectiveStelsel, etf, crypto, spaar, etfGr, cryptoGr, spaarGr, effectiveHv, verliesVoorraad);
    const belasting = taxResult.belasting;
    verliesVoorraad = taxResult.verliesVoorraadNieuw;

    etf = Math.max(0, etf + etfGr);
    crypto = Math.max(0, crypto + cryptoGr);
    spaar = Math.max(0, spaar + spaarGr);
    pensioen = Math.max(0, pensioen + pensioenGr);

    const paid = payTax(
      etf,
      crypto,
      spaar,
      belasting,
      betaalUitSpaar,
      metBijstorting ? bijEtf : 0,
      metBijstorting ? bijCrypto : 0,
      metBijstorting ? bijPensioen : 0,
      metBijstorting ? bijSpaar : 0
    );

    etf = paid.etf;
    crypto = paid.crypto;
    spaar = paid.spaar;

    if (paid.spaarUitgeput && !spaarUitgeputJaar) {
      spaarUitgeputJaar = currentYear;
    }

    // Track how much pension contribution was lost to taxes this year
    const gemistePensioenDitJaar = metBijstorting ? (bijPensioen - paid.bijPensioenRest) : 0;
    cumulGemistePensioen += gemistePensioenDitJaar;

    if (metBijstorting) {
      etf += paid.bijEtfRest;
      crypto += paid.bijCryptoRest;
      spaar += paid.bijSpaarRest; // Now reduced if tax ate into savings contribution
      pensioen += paid.bijPensioenRest;
    }

    cumulB += belasting;

    data.push({
      jaar: 2026 + j,
      etf: Math.round(etf),
      crypto: Math.round(crypto),
      spaar: Math.round(spaar),
      pensioen: Math.round(pensioen),
      totaal: Math.round(etf + crypto + spaar + pensioen),
      belasting: Math.round(belasting),
      cumulBelasting: Math.round(cumulB),
      verliesVoorraad: Math.round(verliesVoorraad),
      gemistePensioen: Math.round(gemistePensioenDitJaar),
      cumulGemistePensioen: Math.round(cumulGemistePensioen),
      // Tax payment sources
      uitSpaar: Math.round(paid.uitSpaar),
      uitBijdragen: Math.round(paid.uitBijdragen),
      uitPensioen: Math.round(paid.uitPensioen),
      uitInvestments: Math.round(paid.uitInvestments),
    });
  }

  return { data, spaarUitgeputJaar };
}

/**
 * Generate Monte Carlo scenarios (random return sequences)
 * Separated from simulation to allow same scenarios for both tax systems
 */
export function generateMCScenarios(params, volEtf, volCrypto, n = MC_SIMULATIONS) {
  const { rendEtf, rendCrypto, rendSpaar, jaren } = params;

  // Reset RNG to session seed for consistent results with same parameters
  resetRng();

  return Array.from({ length: n }, () =>
    Array.from({ length: jaren }, () => ({
      etf: clampReturn(rendEtf + volEtf * randn()),
      crypto: clampReturn(rendCrypto + volCrypto * randn()),
      spaar: Math.max(0, rendSpaar + 0.005 * randn()),
    }))
  );
}

/**
 * Run Monte Carlo simulation with pre-generated scenarios
 * @param {Object} params - Simulation parameters
 * @param {'forfaitair'|'werkelijk'} stelsel - Tax system
 * @param {boolean} betaalUitSpaar - Pay tax from savings first
 * @param {Array} scenarios - Pre-generated return scenarios from generateMCScenarios
 * @param {Object} externalIndices - Optional: use these simulation indices instead of computing new ones
 * @returns {Object} Percentile data per year plus spaarUitgeputJaar per percentile
 */
export function runMonteCarloWithScenarios(params, stelsel, betaalUitSpaar, scenarios, externalIndices = null) {
  const { jaren } = params;
  const results = [];
  const spaarUitgeputJaren = [];

  for (let s = 0; s < scenarios.length; s++) {
    const simResult = simulate(params, stelsel, true, betaalUitSpaar, scenarios[s]);
    spaarUitgeputJaren.push(simResult.spaarUitgeputJaar);
    results.push(simResult.data.map((d) => ({
      totaal: d.totaal,
      etf: d.etf,
      crypto: d.crypto,
      spaar: d.spaar,
      pensioen: d.pensioen,
      belasting: d.belasting,
      cumulBelasting: d.cumulBelasting,
      cumulGemistePensioen: d.cumulGemistePensioen,
      uitSpaar: d.uitSpaar,
      uitBijdragen: d.uitBijdragen,
      uitPensioen: d.uitPensioen,
      uitInvestments: d.uitInvestments,
    })));
  }

  return aggregateMCResults(results, spaarUitgeputJaren, jaren, externalIndices);
}

/**
 * Run paired Monte Carlo simulation - computes per-scenario differences between tax systems
 * This is the statistically correct way to compare: P50(werkelijk - forfaitair) rather than P50(werkelijk) - P50(forfaitair)
 * @param {Object} params - Simulation parameters
 * @param {boolean} betaalUitSpaar - Pay tax from savings first
 * @param {Array} scenarios - Pre-generated return scenarios from generateMCScenarios
 * @returns {Object} Results for both systems plus per-scenario difference percentiles
 */
export function runPairedMonteCarlo(params, betaalUitSpaar, scenarios) {
  const { jaren } = params;

  // Run both simulations storing raw per-scenario results
  const forfaitairResults = [];
  const werkelijkResults = [];
  const spaarUitgeputJarenF = [];
  const spaarUitgeputJarenW = [];

  for (let s = 0; s < scenarios.length; s++) {
    const fResult = simulate(params, 'forfaitair', true, betaalUitSpaar, scenarios[s]);
    const wResult = simulate(params, 'werkelijk', true, betaalUitSpaar, scenarios[s]);

    spaarUitgeputJarenF.push(fResult.spaarUitgeputJaar);
    spaarUitgeputJarenW.push(wResult.spaarUitgeputJaar);

    forfaitairResults.push(fResult.data.map((d) => ({
      totaal: d.totaal,
      etf: d.etf,
      crypto: d.crypto,
      spaar: d.spaar,
      pensioen: d.pensioen,
      belasting: d.belasting,
      cumulBelasting: d.cumulBelasting,
      cumulGemistePensioen: d.cumulGemistePensioen,
      uitSpaar: d.uitSpaar,
      uitBijdragen: d.uitBijdragen,
      uitPensioen: d.uitPensioen,
      uitInvestments: d.uitInvestments,
    })));

    werkelijkResults.push(wResult.data.map((d) => ({
      totaal: d.totaal,
      etf: d.etf,
      crypto: d.crypto,
      spaar: d.spaar,
      pensioen: d.pensioen,
      belasting: d.belasting,
      cumulBelasting: d.cumulBelasting,
      cumulGemistePensioen: d.cumulGemistePensioen,
      uitSpaar: d.uitSpaar,
      uitBijdragen: d.uitBijdragen,
      uitPensioen: d.uitPensioen,
      uitInvestments: d.uitInvestments,
    })));
  }

  // Compute per-scenario differences for each year
  // diffVermogen = werkelijk.totaal - forfaitair.totaal (positive = werkelijk better)
  // diffBelasting = werkelijk.cumulBelasting - forfaitair.cumulBelasting (positive = werkelijk pays more tax)
  const pct = (arr, p) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor((p / 100) * (s.length - 1))];
  };

  // Helper to get the INDEX of the simulation at a given percentile for wealth difference
  const pctIndexForDiff = (p) => {
    const finalDiffs = scenarios.map((_, s) => ({
      idx: s,
      val: werkelijkResults[s][jaren].totaal - forfaitairResults[s][jaren].totaal
    }));
    finalDiffs.sort((a, b) => a.val - b.val);
    return finalDiffs[Math.floor((p / 100) * (finalDiffs.length - 1))].idx;
  };

  // Get scenario indices for each percentile of the difference distribution
  const diffIdxP10 = pctIndexForDiff(10);
  const diffIdxP25 = pctIndexForDiff(25);
  const diffIdxP50 = pctIndexForDiff(50);
  const diffIdxP75 = pctIndexForDiff(75);
  const diffIdxP90 = pctIndexForDiff(90);

  // For each year, compute percentiles of the per-scenario differences
  // AND the actual values from the median-difference scenario (for consistent display)
  const diffData = Array.from({ length: jaren + 1 }, (_, i) => {
    // Per-scenario differences in final wealth
    const diffVermogenArr = scenarios.map((_, s) =>
      werkelijkResults[s][i].totaal - forfaitairResults[s][i].totaal
    );
    // Per-scenario differences in cumulative tax
    const diffBelastingArr = scenarios.map((_, s) =>
      werkelijkResults[s][i].cumulBelasting - forfaitairResults[s][i].cumulBelasting
    );

    return {
      jaar: 2026 + i,
      // Median of differences (the key statistic)
      diffVermogenP50: Math.round(pct(diffVermogenArr, 50)),
      diffBelastingP50: Math.round(pct(diffBelastingArr, 50)),
      // Other percentiles for showing range
      diffVermogenP10: Math.round(pct(diffVermogenArr, 10)),
      diffVermogenP25: Math.round(pct(diffVermogenArr, 25)),
      diffVermogenP75: Math.round(pct(diffVermogenArr, 75)),
      diffVermogenP90: Math.round(pct(diffVermogenArr, 90)),
      diffBelastingP10: Math.round(pct(diffBelastingArr, 10)),
      diffBelastingP25: Math.round(pct(diffBelastingArr, 25)),
      diffBelastingP75: Math.round(pct(diffBelastingArr, 75)),
      diffBelastingP90: Math.round(pct(diffBelastingArr, 90)),
      // Actual values FROM the median-difference scenario (these add up correctly!)
      forfaitairAtDiffP50: Math.round(forfaitairResults[diffIdxP50][i].totaal),
      werkelijkAtDiffP50: Math.round(werkelijkResults[diffIdxP50][i].totaal),
      forfaitairAtDiffP10: Math.round(forfaitairResults[diffIdxP10][i].totaal),
      werkelijkAtDiffP10: Math.round(werkelijkResults[diffIdxP10][i].totaal),
      forfaitairAtDiffP25: Math.round(forfaitairResults[diffIdxP25][i].totaal),
      werkelijkAtDiffP25: Math.round(werkelijkResults[diffIdxP25][i].totaal),
      forfaitairAtDiffP75: Math.round(forfaitairResults[diffIdxP75][i].totaal),
      werkelijkAtDiffP75: Math.round(werkelijkResults[diffIdxP75][i].totaal),
      forfaitairAtDiffP90: Math.round(forfaitairResults[diffIdxP90][i].totaal),
      werkelijkAtDiffP90: Math.round(werkelijkResults[diffIdxP90][i].totaal),
    };
  });

  // Aggregate individual system results (using forfaitair's percentile indices for consistent breakdown display)
  const forfaitairAggregated = aggregateMCResults(forfaitairResults, spaarUitgeputJarenF, jaren, null);
  const werkelijkAggregated = aggregateMCResults(werkelijkResults, spaarUitgeputJarenW, jaren, {
    simIdxP10: forfaitairAggregated.simIdxP10,
    simIdxP25: forfaitairAggregated.simIdxP25,
    simIdxP50: forfaitairAggregated.simIdxP50,
    simIdxP75: forfaitairAggregated.simIdxP75,
    simIdxP90: forfaitairAggregated.simIdxP90,
  });

  return {
    forfaitair: forfaitairAggregated,
    werkelijk: werkelijkAggregated,
    diff: diffData,
  };
}

/**
 * Run Monte Carlo simulation (legacy API - generates own scenarios)
 * @param {Object} params - Simulation parameters
 * @param {'forfaitair'|'werkelijk'} stelsel - Tax system
 * @param {boolean} betaalUitSpaar - Pay tax from savings first
 * @param {number} volEtf - ETF volatility
 * @param {number} volCrypto - Crypto volatility
 * @param {number} n - Number of simulations
 * @returns {Object} Percentile data per year
 */
export function runMonteCarlo(params, stelsel, betaalUitSpaar, volEtf, volCrypto, n = MC_SIMULATIONS) {
  const scenarios = generateMCScenarios(params, volEtf, volCrypto, n);
  return runMonteCarloWithScenarios(params, stelsel, betaalUitSpaar, scenarios);
}

/**
 * Aggregate MC results into percentile data
 * @param {Array} results - Raw simulation results
 * @param {Array} spaarUitgeputJaren - spaarUitgeputJaar for each simulation
 * @param {number} jaren - Number of years
 * @param {Object} externalIndices - Optional: use these simulation indices instead of computing new ones
 */
function aggregateMCResults(results, spaarUitgeputJaren, jaren, externalIndices = null) {

  // Helper to get percentile value
  const pct = (arr, p) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor((p / 100) * (s.length - 1))];
  };

  // Helper to get the INDEX of the simulation at a given percentile for final cumulative
  const pctIndex = (p) => {
    const finalCumul = results.map((r, idx) => ({ idx, val: r[jaren].cumulBelasting }));
    finalCumul.sort((a, b) => a.val - b.val);
    return finalCumul[Math.floor((p / 100) * (finalCumul.length - 1))].idx;
  };

  // Use external indices if provided (for consistent comparison), otherwise compute from this system
  const simIdxP10 = externalIndices?.simIdxP10 ?? pctIndex(10);
  const simIdxP25 = externalIndices?.simIdxP25 ?? pctIndex(25);
  const simIdxP50 = externalIndices?.simIdxP50 ?? pctIndex(50);
  const simIdxP75 = externalIndices?.simIdxP75 ?? pctIndex(75);
  const simIdxP90 = externalIndices?.simIdxP90 ?? pctIndex(90);

  const yearData = Array.from({ length: jaren + 1 }, (_, i) => {
    const totaalVals = results.map((r) => r[i].totaal);
    const belastingVals = results.map((r) => r[i].belasting);
    const cumBelVals = results.map((r) => r[i].cumulBelasting);

    return {
      jaar: 2026 + i,
      // True percentiles across all simulations (for statistical accuracy)
      p10: Math.round(pct(totaalVals, 10)),
      p25: Math.round(pct(totaalVals, 25)),
      p50: Math.round(pct(totaalVals, 50)),
      p75: Math.round(pct(totaalVals, 75)),
      p90: Math.round(pct(totaalVals, 90)),
      // True percentiles for tax (per-year and cumulative)
      belTrueP10: Math.round(pct(belastingVals, 10)),
      belTrueP25: Math.round(pct(belastingVals, 25)),
      belTrueP50: Math.round(pct(belastingVals, 50)),
      belTrueP75: Math.round(pct(belastingVals, 75)),
      belTrueP90: Math.round(pct(belastingVals, 90)),
      cumBelTrueP10: Math.round(pct(cumBelVals, 10)),
      cumBelTrueP25: Math.round(pct(cumBelVals, 25)),
      cumBelTrueP50: Math.round(pct(cumBelVals, 50)),
      cumBelTrueP75: Math.round(pct(cumBelVals, 75)),
      cumBelTrueP90: Math.round(pct(cumBelVals, 90)),
      // Fixed-scenario totals (for apples-to-apples comparison between tax systems)
      totaalP10: Math.round(results[simIdxP10][i].totaal),
      totaalP25: Math.round(results[simIdxP25][i].totaal),
      totaalP50: Math.round(results[simIdxP50][i].totaal),
      totaalP75: Math.round(results[simIdxP75][i].totaal),
      totaalP90: Math.round(results[simIdxP90][i].totaal),
      // Per-asset breakdown (from same percentile simulation)
      etfP10: Math.round(results[simIdxP10][i].etf),
      etfP25: Math.round(results[simIdxP25][i].etf),
      etfP50: Math.round(results[simIdxP50][i].etf),
      etfP75: Math.round(results[simIdxP75][i].etf),
      etfP90: Math.round(results[simIdxP90][i].etf),
      cryptoP10: Math.round(results[simIdxP10][i].crypto),
      cryptoP25: Math.round(results[simIdxP25][i].crypto),
      cryptoP50: Math.round(results[simIdxP50][i].crypto),
      cryptoP75: Math.round(results[simIdxP75][i].crypto),
      cryptoP90: Math.round(results[simIdxP90][i].crypto),
      spaarP10: Math.round(results[simIdxP10][i].spaar),
      spaarP25: Math.round(results[simIdxP25][i].spaar),
      spaarP50: Math.round(results[simIdxP50][i].spaar),
      spaarP75: Math.round(results[simIdxP75][i].spaar),
      spaarP90: Math.round(results[simIdxP90][i].spaar),
      pensioenP10: Math.round(results[simIdxP10][i].pensioen),
      pensioenP25: Math.round(results[simIdxP25][i].pensioen),
      pensioenP50: Math.round(results[simIdxP50][i].pensioen),
      pensioenP75: Math.round(results[simIdxP75][i].pensioen),
      pensioenP90: Math.round(results[simIdxP90][i].pensioen),
      // Per-year belasting from the SAME simulation that's at the percentile for cumulative
      // This ensures per-year values sum to cumulative
      belP10: Math.round(results[simIdxP10][i].belasting),
      belP25: Math.round(results[simIdxP25][i].belasting),
      belP50: Math.round(results[simIdxP50][i].belasting),
      belP75: Math.round(results[simIdxP75][i].belasting),
      belP90: Math.round(results[simIdxP90][i].belasting),
      cumBelP10: Math.round(results[simIdxP10][i].cumulBelasting),
      cumBelP25: Math.round(results[simIdxP25][i].cumulBelasting),
      cumBelP50: Math.round(results[simIdxP50][i].cumulBelasting),
      cumBelP75: Math.round(results[simIdxP75][i].cumulBelasting),
      cumBelP90: Math.round(results[simIdxP90][i].cumulBelasting),
      // Pension contributions lost to taxes (from same percentile simulation)
      pensP10: Math.round(results[simIdxP10][i].cumulGemistePensioen),
      pensP25: Math.round(results[simIdxP25][i].cumulGemistePensioen),
      pensP50: Math.round(results[simIdxP50][i].cumulGemistePensioen),
      pensP75: Math.round(results[simIdxP75][i].cumulGemistePensioen),
      pensP90: Math.round(results[simIdxP90][i].cumulGemistePensioen),
      // Tax payment sources (from same percentile simulation)
      uitSpaarP10: Math.round(results[simIdxP10][i].uitSpaar),
      uitSpaarP25: Math.round(results[simIdxP25][i].uitSpaar),
      uitSpaarP50: Math.round(results[simIdxP50][i].uitSpaar),
      uitSpaarP75: Math.round(results[simIdxP75][i].uitSpaar),
      uitSpaarP90: Math.round(results[simIdxP90][i].uitSpaar),
      uitBijdragenP10: Math.round(results[simIdxP10][i].uitBijdragen),
      uitBijdragenP25: Math.round(results[simIdxP25][i].uitBijdragen),
      uitBijdragenP50: Math.round(results[simIdxP50][i].uitBijdragen),
      uitBijdragenP75: Math.round(results[simIdxP75][i].uitBijdragen),
      uitBijdragenP90: Math.round(results[simIdxP90][i].uitBijdragen),
      uitPensioenP10: Math.round(results[simIdxP10][i].uitPensioen),
      uitPensioenP25: Math.round(results[simIdxP25][i].uitPensioen),
      uitPensioenP50: Math.round(results[simIdxP50][i].uitPensioen),
      uitPensioenP75: Math.round(results[simIdxP75][i].uitPensioen),
      uitPensioenP90: Math.round(results[simIdxP90][i].uitPensioen),
      uitInvestmentsP10: Math.round(results[simIdxP10][i].uitInvestments),
      uitInvestmentsP25: Math.round(results[simIdxP25][i].uitInvestments),
      uitInvestmentsP50: Math.round(results[simIdxP50][i].uitInvestments),
      uitInvestmentsP75: Math.round(results[simIdxP75][i].uitInvestments),
      uitInvestmentsP90: Math.round(results[simIdxP90][i].uitInvestments),
    };
  });

  // Return object with data array, spaarUitgeputJaar per percentile, and simulation indices
  return {
    data: yearData,
    spaarUitgeputJaarP10: spaarUitgeputJaren[simIdxP10],
    spaarUitgeputJaarP25: spaarUitgeputJaren[simIdxP25],
    spaarUitgeputJaarP50: spaarUitgeputJaren[simIdxP50],
    spaarUitgeputJaarP75: spaarUitgeputJaren[simIdxP75],
    spaarUitgeputJaarP90: spaarUitgeputJaren[simIdxP90],
    // Export simulation indices so they can be reused for consistent comparisons
    simIdxP10,
    simIdxP25,
    simIdxP50,
    simIdxP75,
    simIdxP90,
  };
}

/**
 * Custom hook for running simulations
 * @param {Object} params - Simulation parameters
 * @param {boolean} betaalUitSpaar
 * @returns {Object} Simulation results for both tax systems
 */
export function useSimulation(params, betaalUitSpaar) {
  const key = JSON.stringify({ ...params, betaalUitSpaar });

  const forfaitair = useMemo(
    () => simulate(params, "forfaitair", true, betaalUitSpaar, null),
    [key]
  );

  const werkelijk = useMemo(
    () => simulate(params, "werkelijk", true, betaalUitSpaar, null),
    [key]
  );

  return { forfaitair, werkelijk };
}

/**
 * Custom hook for Monte Carlo simulation
 * @param {Object} params
 * @param {'forfaitair'|'werkelijk'} stelsel
 * @param {boolean} betaalUitSpaar
 * @param {number} volEtf
 * @param {number} volCrypto
 * @returns {Array} Monte Carlo results
 */
export function useMonteCarlo(params, stelsel, betaalUitSpaar, volEtf, volCrypto) {
  const key = JSON.stringify({ ...params, stelsel, betaalUitSpaar, volEtf, volCrypto });

  return useMemo(
    () => runMonteCarlo(params, stelsel, betaalUitSpaar, volEtf, volCrypto),
    [key]
  );
}
