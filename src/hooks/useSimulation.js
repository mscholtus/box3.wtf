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
      metBijstorting ? bijCrypto : 0
    );

    etf = paid.etf;
    crypto = paid.crypto;
    spaar = paid.spaar;

    if (paid.spaarUitgeput && !spaarUitgeputJaar) {
      spaarUitgeputJaar = currentYear;
    }

    if (metBijstorting) {
      etf += paid.bijEtfRest;
      crypto += paid.bijCryptoRest;
      pensioen += bijPensioen;
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
    });
  }

  return { data, spaarUitgeputJaar };
}

/**
 * Run Monte Carlo simulation
 * @param {Object} params - Simulation parameters
 * @param {'forfaitair'|'werkelijk'} stelsel - Tax system
 * @param {boolean} betaalUitSpaar - Pay tax from savings first
 * @param {number} volEtf - ETF volatility
 * @param {number} volCrypto - Crypto volatility
 * @param {number} n - Number of simulations
 * @returns {Array} Percentile data per year
 */
export function runMonteCarlo(params, stelsel, betaalUitSpaar, volEtf, volCrypto, n = MC_SIMULATIONS) {
  const { rendEtf, rendCrypto, rendSpaar, jaren } = params;
  const results = [];

  // Reset RNG to session seed for consistent results with same parameters
  resetRng();

  for (let s = 0; s < n; s++) {
    const ov = Array.from({ length: jaren }, () => ({
      etf: clampReturn(rendEtf + volEtf * randn()),
      crypto: clampReturn(rendCrypto + volCrypto * randn()),
      spaar: Math.max(0, rendSpaar + 0.005 * randn()),
    }));
    const simData = simulate(params, stelsel, true, betaalUitSpaar, ov).data;
    results.push(simData.map((d) => ({ totaal: d.totaal, belasting: d.belasting, cumulBelasting: d.cumulBelasting })));
  }

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

  // Find the simulation indices that represent each percentile based on final cumulative tax
  const simIdxP10 = pctIndex(10);
  const simIdxP25 = pctIndex(25);
  const simIdxP50 = pctIndex(50);
  const simIdxP75 = pctIndex(75);
  const simIdxP90 = pctIndex(90);

  return Array.from({ length: jaren + 1 }, (_, i) => {
    const totaalVals = results.map((r) => r[i].totaal);

    return {
      jaar: 2026 + i,
      p10: Math.round(pct(totaalVals, 10)),
      p25: Math.round(pct(totaalVals, 25)),
      p50: Math.round(pct(totaalVals, 50)),
      p75: Math.round(pct(totaalVals, 75)),
      p90: Math.round(pct(totaalVals, 90)),
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
    };
  });
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
