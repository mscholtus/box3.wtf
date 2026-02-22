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

  const hv = getHeffingsvrij(stelsel, fiscaalPartner);

  let etf = startEtf;
  let crypto = startCrypto;
  let spaar = startSpaar;
  let pensioen = startPensioen;
  let cumulB = 0;
  let spaarUitgeputJaar = null;
  let verliesVoorraad = 0; // Loss carry-forward (werkelijk only)

  const data = [{
    jaar: 2027,
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
    const rEtf = overrideReturns ? overrideReturns[j - 1].etf : rendEtf;
    const rCrypto = overrideReturns ? overrideReturns[j - 1].crypto : rendCrypto;
    const rSpaar = overrideReturns ? overrideReturns[j - 1].spaar : rendSpaar;

    const etfGr = etf * rEtf;
    const cryptoGr = crypto * rCrypto;
    const spaarGr = spaar * Math.max(0, rSpaar);
    const pensioenGr = pensioen * rEtf;

    const taxResult = calcTax(stelsel, etf, crypto, spaar, etfGr, cryptoGr, spaarGr, hv, verliesVoorraad);
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
      spaarUitgeputJaar = 2027 + j;
    }

    if (metBijstorting) {
      etf += paid.bijEtfRest;
      crypto += paid.bijCryptoRest;
      pensioen += bijPensioen;
    }

    cumulB += belasting;

    data.push({
      jaar: 2027 + j,
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
    results.push(simulate(params, stelsel, true, betaalUitSpaar, ov).data.map((d) => d.totaal));
  }

  const pct = (arr, p) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor((p / 100) * (s.length - 1))];
  };

  return Array.from({ length: jaren + 1 }, (_, i) => {
    const vals = results.map((r) => r[i]);
    return {
      jaar: 2027 + i,
      p10: Math.round(pct(vals, 10)),
      p25: Math.round(pct(vals, 25)),
      p50: Math.round(pct(vals, 50)),
      p75: Math.round(pct(vals, 75)),
      p90: Math.round(pct(vals, 90)),
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
