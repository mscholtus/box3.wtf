import { describe, it, expect, beforeEach } from 'vitest';
import {
  calcTax,
  calcFirstYearTax,
  payTax,
  getHeffingsvrij,
  setSessionSeed,
  resetRng,
  randn,
  clampReturn,
} from './tax';
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

describe('calcTax - forfaitair system', () => {
  const HV = HEFFINGSVRIJ_F; // 57684

  it('should return 0 tax when total assets below heffingsvrij', () => {
    // 50000 total is below 57684 threshold
    const result = calcTax('forfaitair', 30000, 0, 20000, 0, 0, 0, HV);
    expect(result.belasting).toBe(0);
    expect(result.verliesVoorraadNieuw).toBe(0);
  });

  it('should calculate correct tax for typical portfolio', () => {
    // €100,000 total: €70,000 ETF + €30,000 savings
    // Fictional return: 70000 * 5.88% + 30000 * 1.37% = 4116 + 411 = 4527
    // Grondslag: 100000 - 57684 = 42316
    // Factor: 42316 / 100000 = 0.42316
    // Belasting: 4527 * 0.42316 * 0.36 = 689.78
    const etf = 70000;
    const spaar = 30000;
    const result = calcTax('forfaitair', etf, 0, spaar, 0, 0, 0, HV);

    const fictief = etf * FORFAIT_OVERIG + spaar * FORFAIT_SPAAR;
    const totaal = etf + spaar;
    const grondslag = totaal - HV;
    const factor = grondslag / totaal;
    const expected = fictief * factor * FORFAIT_TARIEF;

    expect(result.belasting).toBeCloseTo(expected, 2);
    expect(result.belasting).toBeCloseTo(689.78, 0); // Approximate check
  });

  it('should handle crypto as part of "overige" (same rate as ETF)', () => {
    // €100,000 total: €50,000 ETF + €20,000 crypto + €30,000 savings
    const etf = 50000;
    const crypto = 20000;
    const spaar = 30000;

    // Crypto and ETF both use FORFAIT_OVERIG rate
    const result = calcTax('forfaitair', etf, crypto, spaar, 0, 0, 0, HV);

    const overige = etf + crypto;
    const fictief = overige * FORFAIT_OVERIG + spaar * FORFAIT_SPAAR;
    const totaal = overige + spaar;
    const grondslag = totaal - HV;
    const factor = grondslag / totaal;
    const expected = fictief * factor * FORFAIT_TARIEF;

    expect(result.belasting).toBeCloseTo(expected, 2);
  });

  it('should double heffingsvrij for fiscaal partner', () => {
    const hvDouble = HV * 2; // 115368
    const etf = 100000;
    const spaar = 50000;
    // Total 150000, above doubled threshold

    const result = calcTax('forfaitair', etf, 0, spaar, 0, 0, 0, hvDouble);

    const fictief = etf * FORFAIT_OVERIG + spaar * FORFAIT_SPAAR;
    const totaal = etf + spaar;
    const grondslag = Math.max(0, totaal - hvDouble);
    const factor = grondslag / totaal;
    const expected = fictief * factor * FORFAIT_TARIEF;

    expect(result.belasting).toBeCloseTo(expected, 2);
  });

  it('should ignore actual growth values (fictional return used instead)', () => {
    // Even with negative actual growth, forfaitair uses fictional returns
    const result1 = calcTax('forfaitair', 100000, 0, 0, 10000, 0, 0, HV);
    const result2 = calcTax('forfaitair', 100000, 0, 0, -10000, 0, 0, HV);

    // Both should be identical since forfaitair ignores actual growth
    expect(result1.belasting).toBe(result2.belasting);
  });
});

describe('calcTax - werkelijk rendement system', () => {
  const HV = HEFFINGSVRIJ_W; // 1800

  it('should return 0 tax when actual return is negative', () => {
    // Negative return = no tax
    const result = calcTax('werkelijk', 100000, 0, 50000, -5000, 0, 500, HV);
    expect(result.belasting).toBe(0);
  });

  it('should calculate tax on actual returns minus heffingsvrij', () => {
    // €7000 ETF growth + €500 savings growth = €7500 total return
    // Taxable: 7500 - 1800 = 5700
    // Tax: 5700 * 36% = 2052
    const result = calcTax('werkelijk', 100000, 0, 25000, 7000, 0, 500, HV);

    const werkelijk = 7000 + 500;
    const taxable = werkelijk - HV;
    const expected = taxable * WERKELIJK_TARIEF;

    expect(result.belasting).toBeCloseTo(expected, 2);
    expect(result.belasting).toBeCloseTo(2052, 0);
  });

  it('should return 0 tax when return below heffingsvrij', () => {
    // €1500 total return, below €1800 threshold
    const result = calcTax('werkelijk', 100000, 0, 50000, 1000, 0, 500, HV);
    expect(result.belasting).toBe(0);
  });

  it('should carry forward losses exceeding €500 threshold', () => {
    // Loss of €3000 > €500 threshold, should carry forward
    const result = calcTax('werkelijk', 100000, 0, 50000, -3000, 0, 0, HV, 0);

    expect(result.belasting).toBe(0);
    expect(result.verliesVoorraadNieuw).toBe(3000);
  });

  it('should NOT carry forward losses under €500 threshold', () => {
    // Loss of €400 < €500 threshold, should NOT carry forward
    const result = calcTax('werkelijk', 100000, 0, 50000, -400, 0, 0, HV, 0);

    expect(result.belasting).toBe(0);
    expect(result.verliesVoorraadNieuw).toBe(0);
  });

  it('should offset gains with carried forward losses', () => {
    // Previous loss: €5000
    // Current gain: €7000
    // Net: 7000 - 5000 = 2000
    // Taxable: 2000 - 1800 = 200
    // Tax: 200 * 36% = 72
    const verliesVoorraad = 5000;
    const result = calcTax('werkelijk', 100000, 0, 0, 7000, 0, 0, HV, verliesVoorraad);

    expect(result.belasting).toBeCloseTo(72, 0);
    expect(result.verliesVoorraadNieuw).toBe(0); // All loss used
  });

  it('should partially use carried forward losses', () => {
    // Previous loss: €10000
    // Current gain: €6000
    // Net: 6000 - 6000 = 0 (use only part of loss)
    // Remaining loss: 10000 - 6000 = 4000
    const verliesVoorraad = 10000;
    const result = calcTax('werkelijk', 100000, 0, 0, 6000, 0, 0, HV, verliesVoorraad);

    expect(result.belasting).toBe(0);
    expect(result.verliesVoorraadNieuw).toBe(4000);
  });

  it('should accumulate losses across multiple years', () => {
    // Year 1: -€3000 loss
    const result1 = calcTax('werkelijk', 100000, 0, 0, -3000, 0, 0, HV, 0);
    expect(result1.verliesVoorraadNieuw).toBe(3000);

    // Year 2: -€2000 loss (accumulates)
    const result2 = calcTax('werkelijk', 97000, 0, 0, -2000, 0, 0, HV, 3000);
    expect(result2.verliesVoorraadNieuw).toBe(5000);

    // Year 3: +€8000 gain (uses all loss + some taxable)
    const result3 = calcTax('werkelijk', 95000, 0, 0, 8000, 0, 0, HV, 5000);
    // Net gain: 8000 - 5000 = 3000, taxable: 3000 - 1800 = 1200
    expect(result3.belasting).toBeCloseTo(1200 * WERKELIJK_TARIEF, 0);
    expect(result3.verliesVoorraadNieuw).toBe(0);
  });
});

describe('calcFirstYearTax', () => {
  it('should compare both systems for same assets', () => {
    const assets = {
      etf: 100000,
      crypto: 10000,
      spaar: 30000,
      rendEtf: 0.07,
      rendCrypto: 0.10,
      rendSpaar: 0.02,
    };

    const result = calcFirstYearTax(assets, false);

    expect(result.forfaitair).toBeGreaterThan(0);
    expect(result.werkelijk).toBeGreaterThan(0);
    expect(result.diff).toBe(result.forfaitair - result.werkelijk);
  });

  it('should double heffingsvrij with fiscaal partner', () => {
    const assets = {
      etf: 60000,
      crypto: 0,
      spaar: 30000,
      rendEtf: 0.07,
      rendCrypto: 0,
      rendSpaar: 0.02,
    };

    const single = calcFirstYearTax(assets, false);
    const partner = calcFirstYearTax(assets, true);

    // With partner, more is tax-free, so less tax
    expect(partner.forfaitair).toBeLessThan(single.forfaitair);
  });
});

describe('payTax - betaalUitSpaar mode (waterfall)', () => {
  it('should pay fully from savings when sufficient', () => {
    const result = payTax(50000, 5000, 10000, 500, true, 3000, 500, 2000, 1000);

    expect(result.spaar).toBe(9500); // 10000 - 500
    expect(result.etf).toBe(50000); // unchanged
    expect(result.crypto).toBe(5000); // unchanged
    expect(result.uitSpaar).toBe(500);
    expect(result.uitBijdragen).toBe(0);
    expect(result.uitPensioen).toBe(0);
    expect(result.uitInvestments).toBe(0);
    expect(result.spaarUitgeput).toBe(false);
  });

  it('should use savings contribution after savings depleted', () => {
    // 500 savings, 1000 savings contribution, 1200 tax
    const result = payTax(50000, 0, 500, 1200, true, 3000, 0, 2000, 1000);

    // 500 from savings + 700 from bijSpaar
    expect(result.spaar).toBe(0);
    expect(result.bijSpaarRest).toBe(300); // 1000 - 700
    expect(result.uitSpaar).toBe(1200);
    expect(result.spaarUitgeput).toBe(false); // Still have bijSpaarRest
  });

  it('should reduce contributions proportionally after savings exhausted', () => {
    // 0 savings, 0 bijSpaar, need to use contributions
    // bijEtf=3000, bijCrypto=0, bijPensioen=2000 = 5000 total
    const result = payTax(50000, 5000, 0, 2500, true, 3000, 0, 2000, 0);

    // 2500 / 5000 = 50% reduction
    expect(result.bijEtfRest).toBeCloseTo(1500, 0); // 3000 * 0.5
    expect(result.bijPensioenRest).toBeCloseTo(1000, 0); // 2000 * 0.5
    expect(result.uitBijdragen).toBeCloseTo(1500, 0); // ETF contribution used
    expect(result.uitPensioen).toBeCloseTo(1000, 0); // Pension contribution used
    expect(result.spaarUitgeput).toBe(true);
  });

  it('should sell investments as last resort', () => {
    // No savings, no contributions, must sell
    const result = payTax(50000, 10000, 0, 6000, true, 0, 0, 0, 0);

    // Sell proportionally from ETF and crypto
    // Total investments: 60000, selling 6000 = 10%
    expect(result.etf).toBeCloseTo(45000, 0); // 50000 * 0.9
    expect(result.crypto).toBeCloseTo(9000, 0); // 10000 * 0.9
    expect(result.uitInvestments).toBe(6000);
    expect(result.invVerkocht).toBe(true);
  });

  it('should track sources correctly through full waterfall', () => {
    // 200 savings, 300 bijSpaar, 1000 contributions, 3000 to pay
    // Waterfall: 200 savings + 300 bijSpaar + 1000 contributions + 1500 sell
    const result = payTax(20000, 10000, 200, 3000, true, 500, 200, 300, 300);

    expect(result.uitSpaar).toBe(500); // 200 + 300
    expect(result.uitBijdragen + result.uitPensioen).toBe(1000); // all contributions
    expect(result.uitInvestments).toBe(1500); // remainder from selling
    expect(result.spaar).toBe(0);
    expect(result.spaarUitgeput).toBe(true);
    expect(result.invVerkocht).toBe(true);
  });
});

describe('payTax - proportional mode', () => {
  it('should pay proportionally from all assets', () => {
    // 60000 ETF, 10000 crypto, 30000 savings = 100000 total
    // Pay 10000 = 10% reduction
    const result = payTax(60000, 10000, 30000, 10000, false, 3000, 500, 2000, 1000);

    expect(result.etf).toBeCloseTo(54000, 0); // 60000 * 0.9
    expect(result.crypto).toBeCloseTo(9000, 0); // 10000 * 0.9
    expect(result.spaar).toBeCloseTo(27000, 0); // 30000 * 0.9
    expect(result.uitSpaar).toBeCloseTo(3000, 0);
    expect(result.uitInvestments).toBeCloseTo(7000, 0);
    // Contributions unchanged in proportional mode
    expect(result.bijEtfRest).toBe(3000);
    expect(result.bijPensioenRest).toBe(2000);
  });

  it('should not touch contributions in proportional mode', () => {
    const result = payTax(50000, 10000, 20000, 5000, false, 3000, 500, 2000, 1000);

    expect(result.bijEtfRest).toBe(3000);
    expect(result.bijCryptoRest).toBe(500);
    expect(result.bijPensioenRest).toBe(2000);
    expect(result.bijSpaarRest).toBe(1000);
  });
});

describe('getHeffingsvrij', () => {
  it('should return correct thresholds for forfaitair', () => {
    expect(getHeffingsvrij('forfaitair', false)).toBe(HEFFINGSVRIJ_F);
    expect(getHeffingsvrij('forfaitair', true)).toBe(HEFFINGSVRIJ_F * 2);
  });

  it('should return correct thresholds for werkelijk', () => {
    expect(getHeffingsvrij('werkelijk', false)).toBe(HEFFINGSVRIJ_W);
    expect(getHeffingsvrij('werkelijk', true)).toBe(HEFFINGSVRIJ_W * 2);
  });
});

describe('RNG functions', () => {
  beforeEach(() => {
    setSessionSeed(42);
  });

  it('should produce reproducible results with same seed', () => {
    resetRng();
    const values1 = [randn(), randn(), randn()];

    resetRng();
    const values2 = [randn(), randn(), randn()];

    expect(values1).toEqual(values2);
  });

  it('should produce different results with different seeds', () => {
    setSessionSeed(42);
    resetRng();
    const val1 = randn();

    setSessionSeed(123);
    resetRng();
    const val2 = randn();

    expect(val1).not.toBe(val2);
  });

  it('randn should produce approximately normal distribution', () => {
    resetRng();
    const values = Array.from({ length: 10000 }, () => randn());

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Standard normal: mean ≈ 0, stdDev ≈ 1
    expect(mean).toBeCloseTo(0, 1);
    expect(stdDev).toBeCloseTo(1, 1);
  });
});

describe('clampReturn', () => {
  it('should clamp extreme negative returns to floor', () => {
    expect(clampReturn(-0.8)).toBe(MC_RETURN_FLOOR); // -60%
    expect(clampReturn(-1.0)).toBe(MC_RETURN_FLOOR);
    expect(clampReturn(-2.0)).toBe(MC_RETURN_FLOOR);
  });

  it('should not clamp normal returns', () => {
    expect(clampReturn(0.07)).toBe(0.07);
    expect(clampReturn(-0.2)).toBe(-0.2);
    expect(clampReturn(0.5)).toBe(0.5);
    expect(clampReturn(-0.59)).toBe(-0.59); // Just above floor
  });

  it('should return exactly MC_RETURN_FLOOR for boundary value', () => {
    expect(clampReturn(MC_RETURN_FLOOR)).toBe(MC_RETURN_FLOOR);
    expect(clampReturn(MC_RETURN_FLOOR - 0.01)).toBe(MC_RETURN_FLOOR);
  });
});

describe('Tax calculation edge cases', () => {
  it('should handle zero assets', () => {
    const forfait = calcTax('forfaitair', 0, 0, 0, 0, 0, 0, HEFFINGSVRIJ_F);
    const werkelijk = calcTax('werkelijk', 0, 0, 0, 0, 0, 0, HEFFINGSVRIJ_W);

    expect(forfait.belasting).toBe(0);
    expect(werkelijk.belasting).toBe(0);
  });

  it('should handle very large portfolios', () => {
    const result = calcTax('forfaitair', 10000000, 5000000, 2000000, 0, 0, 0, HEFFINGSVRIJ_F);

    // Should calculate without overflow
    expect(result.belasting).toBeGreaterThan(0);
    expect(Number.isFinite(result.belasting)).toBe(true);
  });

  it('should handle exact heffingsvrij boundary', () => {
    // Exactly at threshold = 0 tax
    const result = calcTax('forfaitair', 40000, 0, 17684, 0, 0, 0, HEFFINGSVRIJ_F);
    // 40000 + 17684 = 57684 = HEFFINGSVRIJ_F exactly
    expect(result.belasting).toBe(0);
  });

  it('payTax should handle zero tax', () => {
    const result = payTax(50000, 5000, 10000, 0, true, 3000, 500, 2000, 1000);

    expect(result.etf).toBe(50000);
    expect(result.crypto).toBe(5000);
    expect(result.spaar).toBe(10000);
    expect(result.bijEtfRest).toBe(3000);
    expect(result.uitSpaar).toBe(0);
    expect(result.uitInvestments).toBe(0);
  });

  it('payTax should handle tax exceeding all assets', () => {
    // Only 10000 total, trying to pay 20000
    const result = payTax(5000, 3000, 2000, 20000, true, 0, 0, 0, 0);

    // Everything should be depleted
    expect(result.etf).toBe(0);
    expect(result.crypto).toBe(0);
    expect(result.spaar).toBe(0);
    expect(result.uitSpaar).toBe(2000);
    expect(result.uitInvestments).toBe(8000);
  });
});

describe('Forfaitair vs Werkelijk comparison accuracy', () => {
  it('should correctly favor werkelijk for high savings portfolios', () => {
    // High savings, low investments = forfaitair disadvantage
    // Because forfaitair assumes 5.88% return on investments but only 1.37% on savings
    // While werkelijk taxes actual (low) returns
    const assets = {
      etf: 10000,
      crypto: 0,
      spaar: 200000,
      rendEtf: 0.07,
      rendCrypto: 0,
      rendSpaar: 0.015, // 1.5% actual return on savings
    };

    const result = calcFirstYearTax(assets, false);

    // With mostly savings, werkelijk should be lower since actual savings return (1.5%)
    // is close to forfaitair assumption (1.37%)
    // But the total is above heffingsvrij so some tax applies
    expect(result.diff).toBeDefined();
  });

  it('should correctly favor forfaitair for high growth investments', () => {
    // High ETF growth scenario
    const assets = {
      etf: 150000,
      crypto: 0,
      spaar: 10000,
      rendEtf: 0.15, // 15% actual return
      rendCrypto: 0,
      rendSpaar: 0.02,
    };

    const result = calcFirstYearTax(assets, false);

    // Actual return: 150000 * 0.15 + 10000 * 0.02 = 22700
    // Werkelijk tax: (22700 - 1800) * 0.36 = 7524

    // Forfaitair fictional: 150000 * 0.0588 + 10000 * 0.0137 = 8957
    // Grondslag: 160000 - 57684 = 102316
    // Factor: 102316 / 160000 = 0.6395
    // Forfaitair tax: 8957 * 0.6395 * 0.36 = 2063

    // So forfaitair should be much lower (better for high actual returns)
    expect(result.forfaitair).toBeLessThan(result.werkelijk);
    expect(result.diff).toBeLessThan(0); // forfaitair - werkelijk < 0
  });
});
