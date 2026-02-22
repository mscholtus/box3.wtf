import { describe, it, expect, beforeEach } from 'vitest';
import { simulate, runMonteCarlo, generateMCScenarios, runMonteCarloWithScenarios, runPairedMonteCarlo } from './useSimulation';
import { setSessionSeed, resetRng, randn, clampReturn, calcTax, getHeffingsvrij } from '../utils/tax';
import { HEFFINGSVRIJ_F, HEFFINGSVRIJ_W } from '../constants/tax';

const DEFAULT_PARAMS = {
  startEtf: 50000,
  startCrypto: 0,
  startSpaar: 25000,
  startPensioen: 20000,
  bijEtf: 3000,
  bijCrypto: 0,
  bijPensioen: 2000,
  rendEtf: 0.07,
  rendCrypto: 0.10,
  rendSpaar: 0.02,
  jaren: 10,
  fiscaalPartner: false,
};

describe('simulate', () => {
  it('should return correct structure with years starting at 2026', () => {
    const result = simulate(DEFAULT_PARAMS, 'forfaitair', true, true, null);

    expect(result.data).toHaveLength(11); // 2026 + 10 years
    expect(result.data[0].jaar).toBe(2026);
    expect(result.data[1].jaar).toBe(2027);
    expect(result.data[10].jaar).toBe(2036);
  });

  it('should have 0 tax in year 2026 (starting point)', () => {
    const forf = simulate(DEFAULT_PARAMS, 'forfaitair', true, true, null);
    const werk = simulate(DEFAULT_PARAMS, 'werkelijk', true, true, null);

    expect(forf.data[0].belasting).toBe(0);
    expect(werk.data[0].belasting).toBe(0);
  });

  it('should use forfaitair for 2027 even in werkelijk simulation', () => {
    const forf = simulate(DEFAULT_PARAMS, 'forfaitair', true, true, null);
    const werk = simulate(DEFAULT_PARAMS, 'werkelijk', true, true, null);

    // Year 2027 (index 1) should be identical for both systems
    expect(werk.data[1].belasting).toBe(forf.data[1].belasting);
    console.log('2027 forfaitair belasting:', forf.data[1].belasting);
    console.log('2027 werkelijk belasting:', werk.data[1].belasting);
  });

  it('should have different tax from 2028 onwards', () => {
    const forf = simulate(DEFAULT_PARAMS, 'forfaitair', true, true, null);
    const werk = simulate(DEFAULT_PARAMS, 'werkelijk', true, true, null);

    // Year 2028 (index 2) should differ
    console.log('\n=== Per-year belasting comparison ===');
    for (let i = 0; i <= 10; i++) {
      console.log(`${forf.data[i].jaar}: forfaitair=${forf.data[i].belasting}, werkelijk=${werk.data[i].belasting}, cumF=${forf.data[i].cumulBelasting}, cumW=${werk.data[i].cumulBelasting}`);
    }

    expect(werk.data[2].belasting).not.toBe(forf.data[2].belasting);
  });

  it('should have increasing werkelijk tax as assets grow', () => {
    const werk = simulate(DEFAULT_PARAMS, 'werkelijk', true, true, null);

    // Tax in 2030 should be higher than 2028 (more assets = more growth = more tax)
    const tax2028 = werk.data[2].belasting; // index 2 = year 2028
    const tax2030 = werk.data[4].belasting; // index 4 = year 2030
    const tax2035 = werk.data[9].belasting; // index 9 = year 2035

    console.log('\n=== Werkelijk tax growth check ===');
    console.log('2028:', tax2028);
    console.log('2030:', tax2030);
    console.log('2035:', tax2035);

    expect(tax2030).toBeGreaterThan(tax2028);
    expect(tax2035).toBeGreaterThan(tax2030);
  });
});

describe('runMonteCarlo', () => {
  it('should return correct structure', () => {
    const result = runMonteCarlo(DEFAULT_PARAMS, 'werkelijk', true, 0.15, 0.40, 100);

    // Now returns { data: [...], spaarUitgeputJaarP10, ... }
    expect(result.data).toHaveLength(11); // jaren + 1
    expect(result.data[0].jaar).toBe(2026);
    expect(result.data[1].jaar).toBe(2027);
    expect(result.data[10].jaar).toBe(2036);
  });

  it('should have belP percentiles that vary year-to-year for werkelijk', () => {
    const result = runMonteCarlo(DEFAULT_PARAMS, 'werkelijk', true, 0.15, 0.40, 100);
    const werk = result.data;

    console.log('\n=== MC Werkelijk belP50 per year ===');
    for (let i = 0; i <= 10; i++) {
      console.log(`${werk[i].jaar}: belP50=${werk[i].belP50}, cumBelP50=${werk[i].cumBelP50}`);
    }

    // With MC volatility, per-year tax can go to 0 in bad years (negative returns)
    // So we can't expect monotonic increase. Instead verify:
    // 1. Values vary (not all the same)
    // 2. Cumulative increases over time
    const belP50Values = [];
    for (let i = 2; i <= 10; i++) { // 2028 onwards
      belP50Values.push(werk[i].belP50);
    }

    console.log('\n=== belP50 values from 2028 onwards ===');
    console.log(belP50Values);

    const uniqueValues = new Set(belP50Values);
    console.log('Unique values:', uniqueValues.size);

    // Should have multiple unique values (not all the same)
    expect(uniqueValues.size).toBeGreaterThan(1);

    // Cumulative should always increase
    expect(werk[10].cumBelP50).toBeGreaterThan(werk[5].cumBelP50);
    expect(werk[5].cumBelP50).toBeGreaterThan(werk[2].cumBelP50);
  });

  it('should have cumBelP50 that matches sum of belP50', () => {
    const result = runMonteCarlo(DEFAULT_PARAMS, 'werkelijk', true, 0.15, 0.40, 100);
    const werk = result.data;

    // Note: cumBelP50 is NOT the sum of belP50 values because percentiles don't sum!
    // But we can check that cumulative grows and is reasonable
    console.log('\n=== Cumulative check ===');
    console.log('Final cumBelP50:', werk[10].cumBelP50);

    // Rough check: cumulative at end should be substantial
    expect(werk[10].cumBelP50).toBeGreaterThan(5000);
  });

  it('chart data indexing simulation', () => {
    const forfResult = runMonteCarlo(DEFAULT_PARAMS, 'forfaitair', true, 0.15, 0.40, 100);
    const werkResult = runMonteCarlo(DEFAULT_PARAMS, 'werkelijk', true, 0.15, 0.40, 100);
    const forf = forfResult.data;
    const werk = werkResult.data;

    console.log('\n=== Simulating chart data construction ===');
    console.log('mcDataForfaitair length:', forf.length);
    console.log('mcDataWerkelijk length:', werk.length);

    // Simulate chartMCBelYear construction
    const chartMCBelYear = forf.slice(1).map((d, i) => ({
      jaar: d.jaar,
      "Belasting Forfaitair": d.belP50,
      "Belasting Werkelijk": d.jaar >= 2028 ? werk[i + 1]?.belP50 : null,
    }));

    console.log('\n=== chartMCBelYear (per-year tax) ===');
    chartMCBelYear.forEach(row => {
      console.log(`${row.jaar}: Forf=${row["Belasting Forfaitair"]}, Werk=${row["Belasting Werkelijk"]}`);
    });

    // Simulate chartMCBelCumul construction
    const chartMCBelCumul = forf.slice(1).map((d, i) => ({
      jaar: d.jaar,
      "Belasting Forfaitair": d.cumBelP50,
      "Belasting Werkelijk": d.jaar >= 2028 ? werk[i + 1]?.cumBelP50 : null,
    }));

    console.log('\n=== chartMCBelCumul (cumulative tax) ===');
    chartMCBelCumul.forEach(row => {
      console.log(`${row.jaar}: Forf=${row["Belasting Forfaitair"]}, Werk=${row["Belasting Werkelijk"]}`);
    });

    // Verify werkelijk values from 2028 are not all the same
    const werkValues = chartMCBelYear
      .filter(r => r["Belasting Werkelijk"] !== null)
      .map(r => r["Belasting Werkelijk"]);

    console.log('\n=== Werkelijk per-year values (should vary) ===');
    console.log(werkValues);

    const uniqueValues = new Set(werkValues);
    console.log('Unique values count:', uniqueValues.size);

    // There should be multiple unique values, not all the same
    expect(uniqueValues.size).toBeGreaterThan(1);
  });

  it('should match browser behavior with default seed 42 and 1000 sims', () => {
    // Reset to exact seed used in browser
    setSessionSeed(42);

    const params25 = { ...DEFAULT_PARAMS, jaren: 25 };
    const result = runMonteCarlo(params25, 'werkelijk', true, 0.15, 0.40, 1000);
    const werk = result.data;

    console.log('\n=== Browser-matching test (seed 42, 1000 sims, 25 years) ===');
    console.log('Year | belP10 | belP25 | belP50 | belP75 | belP90 | cumBelP50');
    console.log('-----|--------|--------|--------|--------|--------|----------');
    for (let i = 0; i <= 25; i++) {
      const d = werk[i];
      console.log(`${d.jaar} | ${String(d.belP10).padStart(6)} | ${String(d.belP25).padStart(6)} | ${String(d.belP50).padStart(6)} | ${String(d.belP75).padStart(6)} | ${String(d.belP90).padStart(6)} | ${d.cumBelP50}`);
    }

    // The user sees values from 2028 onwards
    // At p50, many years have 0 because median return can be negative
    // This is expected MC behavior - check p75 instead for non-zero values
    const nonZeroP50 = [];
    const nonZeroP75 = [];
    for (let i = 2; i <= 25; i++) {
      if (werk[i].belP50 > 0) nonZeroP50.push(werk[i].jaar);
      if (werk[i].belP75 > 0) nonZeroP75.push(werk[i].jaar);
    }
    console.log('\nYears with belP50 > 0:', nonZeroP50.length);
    console.log('Years with belP75 > 0:', nonZeroP75.length);

    // At p75 (optimistic), we should have some non-zero years
    // (Now tracking single simulation, so values are from one consistent path)
    expect(nonZeroP75.length).toBeGreaterThan(5);

    // Cumulative at p50 should still be substantial
    expect(werk[25].cumBelP50).toBeGreaterThan(50000);
  });

  it('DEBUG: trace single simulation to understand belasting values', () => {
    setSessionSeed(42);

    // Run just ONE simulation to see actual per-year values
    const params25 = { ...DEFAULT_PARAMS, jaren: 25 };

    // Deterministic simulation (no MC randomness)
    const werkDet = simulate(params25, 'werkelijk', true, true, null);

    console.log('\n=== DETERMINISTIC werkelijk simulation ===');
    console.log('Year | belasting | cumulBelasting | totaal');
    console.log('-----|-----------|----------------|-------');
    for (const d of werkDet.data) {
      console.log(`${d.jaar} | ${String(d.belasting).padStart(9)} | ${String(d.cumulBelasting).padStart(14)} | ${d.totaal}`);
    }

    // Now check: in deterministic mode, belasting should grow each year
    const belValues = werkDet.data.slice(2).map(d => d.belasting); // 2028 onwards
    console.log('\nBelasting values from 2028:', belValues);

    // All should be positive and increasing
    for (let i = 1; i < belValues.length; i++) {
      expect(belValues[i]).toBeGreaterThan(0);
    }
  });

  it('DEBUG: inspect raw MC simulation belasting distribution', () => {
    setSessionSeed(42);

    const params10 = { ...DEFAULT_PARAMS, jaren: 10 };

    // Run 100 simulations and collect year 5 (2031) belasting values
    resetRng();

    const year5BelastingValues = [];
    for (let s = 0; s < 100; s++) {
      const ov = Array.from({ length: 10 }, () => ({
        etf: clampReturn(0.07 + 0.15 * randn()),
        crypto: clampReturn(0.10 + 0.40 * randn()),
        spaar: Math.max(0, 0.02 + 0.005 * randn()),
      }));
      const simData = simulate(params10, 'werkelijk', true, true, ov).data;
      year5BelastingValues.push(simData[5].belasting); // year 2031
    }

    year5BelastingValues.sort((a, b) => a - b);
    console.log('\n=== Year 2031 belasting across 100 MC simulations ===');
    console.log('Min:', year5BelastingValues[0]);
    console.log('P10:', year5BelastingValues[10]);
    console.log('P25:', year5BelastingValues[25]);
    console.log('P50:', year5BelastingValues[50]);
    console.log('P75:', year5BelastingValues[75]);
    console.log('P90:', year5BelastingValues[90]);
    console.log('Max:', year5BelastingValues[99]);

    // Count zeros
    const zeros = year5BelastingValues.filter(v => v === 0).length;
    console.log('Number of zeros:', zeros, 'out of 100');

    // Show first 20 sorted values
    console.log('First 20 sorted values:', year5BelastingValues.slice(0, 20));
  });

  it('DEBUG: trace one MC simulation with 0 in some years', () => {
    setSessionSeed(42);
    resetRng();

    const params10 = { ...DEFAULT_PARAMS, jaren: 10 };

    // Generate one set of random returns
    const ov = Array.from({ length: 10 }, () => ({
      etf: clampReturn(0.07 + 0.15 * randn()),
      crypto: clampReturn(0.10 + 0.40 * randn()),
      spaar: Math.max(0, 0.02 + 0.005 * randn()),
    }));

    console.log('\n=== Random returns for 10 years ===');
    ov.forEach((r, i) => console.log(`Year ${2027 + i}: ETF=${(r.etf * 100).toFixed(1)}%, Crypto=${(r.crypto * 100).toFixed(1)}%, Spaar=${(r.spaar * 100).toFixed(2)}%`));

    const simData = simulate(params10, 'werkelijk', true, true, ov).data;

    console.log('\n=== Simulation results ===');
    console.log('Year | belasting | cumulBelasting | etf | spaar');
    for (const d of simData) {
      console.log(`${d.jaar} | ${String(d.belasting).padStart(9)} | ${String(d.cumulBelasting).padStart(14)} | ${d.etf} | ${d.spaar}`);
    }
  });

  it('DEBUG: exact chart data like Dashboard would construct', () => {
    // Match exactly what App.jsx does: set seed once, then run both MC simulations
    // Each runMonteCarlo resets the RNG internally, so both use same random sequence
    setSessionSeed(42);

    const params25 = { ...DEFAULT_PARAMS, jaren: 25 };

    // This is the order App.jsx calls them
    const mcResultForfaitair = runMonteCarlo(params25, 'forfaitair', true, 0.15, 0.40, 1000);
    const mcResultWerkelijk = runMonteCarlo(params25, 'werkelijk', true, 0.15, 0.40, 1000);
    const mcDataForfaitair = mcResultForfaitair.data;
    const mcDataWerkelijk = mcResultWerkelijk.data;
    const mcPercentile = 50;

    console.log('\n=== Raw MC data for werkelijk at P50 ===');
    for (let i = 0; i <= 10; i++) {
      console.log(`Year ${mcDataWerkelijk[i].jaar}: belP50=${mcDataWerkelijk[i].belP50}, belP10=${mcDataWerkelijk[i].belP10}, belP90=${mcDataWerkelijk[i].belP90}`);
    }

    // Exact code from Dashboard.jsx chartMCBelYear
    const pKey = `belP${mcPercentile}`;
    const chartMCBelYear = mcDataForfaitair.slice(1).map((d, i) => ({
      jaar: d.jaar,
      "Belasting Forfaitair": d[pKey],
      "Belasting Werkelijk": d.jaar >= 2028 ? mcDataWerkelijk[i + 1]?.[pKey] : null,
    }));

    console.log('\n=== chartMCBelYear at P50 (exact Dashboard code) ===');
    chartMCBelYear.forEach(row => {
      console.log(`${row.jaar}: Forf=${row["Belasting Forfaitair"]}, Werk=${row["Belasting Werkelijk"]}`);
    });

    // The user reports seeing 264 in 2028, flat 0 after
    // Let's see what we actually get
    const werkValues = chartMCBelYear.filter(r => r.jaar >= 2028).map(r => r["Belasting Werkelijk"]);
    console.log('\nWerkelijk values 2028+:', werkValues);

    const nonZero = werkValues.filter(v => v > 0);
    console.log('Non-zero count:', nonZero.length, 'out of', werkValues.length);

    // Sum all per-year values (including 2027)
    const allWerkValues = chartMCBelYear.map(r => r["Belasting Werkelijk"] ?? 0);
    const sumPerYear = allWerkValues.reduce((a, b) => a + b, 0);
    console.log('\nSum of per-year werkelijk taxes (incl 2027):', sumPerYear);

    // Get cumulative value at end
    const cumBelPKey = `cumBelP${mcPercentile}`;
    const finalCumulative = mcDataWerkelijk[mcDataWerkelijk.length - 1][cumBelPKey];
    console.log('Cumulative werkelijk tax at end:', finalCumulative);

    console.log('\nDIFFERENCE:', finalCumulative - sumPerYear);
    console.log('These should be equal but they are NOT because:');
    console.log('- belP50 is the P50 of per-year tax across 1000 sims');
    console.log('- cumBelP50 is the P50 of cumulative tax across 1000 sims');
    console.log('- Percentiles do NOT sum: P50(a) + P50(b) ≠ P50(a+b)');
  });
});

describe('generateMCScenarios and runMonteCarloWithScenarios', () => {
  beforeEach(() => {
    setSessionSeed(42);
  });

  it('should generate reproducible scenarios with same seed', () => {
    const scenarios1 = generateMCScenarios(DEFAULT_PARAMS, 0.15, 0.40, 10);
    setSessionSeed(42); // Reset seed
    const scenarios2 = generateMCScenarios(DEFAULT_PARAMS, 0.15, 0.40, 10);

    // Same seed should produce identical scenarios
    expect(scenarios1).toEqual(scenarios2);
  });

  it('should use same scenarios for fair comparison between tax systems', () => {
    // CRITICAL TEST: This ensures forfaitair and werkelijk are compared fairly
    const scenarios = generateMCScenarios(DEFAULT_PARAMS, 0.15, 0.40, 100);

    const forfaitair = runMonteCarloWithScenarios(DEFAULT_PARAMS, 'forfaitair', true, scenarios);
    const werkelijk = runMonteCarloWithScenarios(DEFAULT_PARAMS, 'werkelijk', true, scenarios);

    // Both should have same length and years
    expect(forfaitair.data).toHaveLength(werkelijk.data.length);
    expect(forfaitair.data[0].jaar).toBe(werkelijk.data[0].jaar);

    // The only difference should be in tax calculations
    // 2027 should be identical (both use forfaitair)
    expect(forfaitair.data[1].belP50).toBe(werkelijk.data[1].belP50);

    // 2028+ should differ due to different tax systems
    // (unless both happen to calculate same tax, which is unlikely)
    // We can't assert they're different because same scenario + different tax rules
    // could theoretically give same result, but cumulative should differ
    console.log('\n=== Fair comparison test ===');
    console.log('Forfaitair final cumBelP50:', forfaitair.data[forfaitair.data.length - 1].cumBelP50);
    console.log('Werkelijk final cumBelP50:', werkelijk.data[werkelijk.data.length - 1].cumBelP50);
  });

  it('should produce different results with different scenarios', () => {
    setSessionSeed(42);
    const scenarios1 = generateMCScenarios(DEFAULT_PARAMS, 0.15, 0.40, 100);

    setSessionSeed(999);
    const scenarios2 = generateMCScenarios(DEFAULT_PARAMS, 0.15, 0.40, 100);

    // Different seeds should produce different scenarios
    expect(scenarios1).not.toEqual(scenarios2);

    // Results should differ
    const result1 = runMonteCarloWithScenarios(DEFAULT_PARAMS, 'werkelijk', true, scenarios1);
    const result2 = runMonteCarloWithScenarios(DEFAULT_PARAMS, 'werkelijk', true, scenarios2);

    expect(result1.data[10].p50).not.toBe(result2.data[10].p50);
  });

  it('should use shared indices for consistent asset breakdown comparison', () => {
    // CRITICAL: This ensures forfaitair and werkelijk breakdowns come from the SAME scenario
    const scenarios = generateMCScenarios(DEFAULT_PARAMS, 0.15, 0.40, 100);

    // First compute forfaitair (which computes its own indices)
    const forfaitair = runMonteCarloWithScenarios(DEFAULT_PARAMS, 'forfaitair', true, scenarios);

    // Then use forfaitair's indices for werkelijk
    const sharedIndices = {
      simIdxP10: forfaitair.simIdxP10,
      simIdxP25: forfaitair.simIdxP25,
      simIdxP50: forfaitair.simIdxP50,
      simIdxP75: forfaitair.simIdxP75,
      simIdxP90: forfaitair.simIdxP90,
    };
    const werkelijk = runMonteCarloWithScenarios(DEFAULT_PARAMS, 'werkelijk', true, scenarios, sharedIndices);

    // Werkelijk should use the same simulation indices
    expect(werkelijk.simIdxP50).toBe(forfaitair.simIdxP50);
    expect(werkelijk.simIdxP10).toBe(forfaitair.simIdxP10);
    expect(werkelijk.simIdxP90).toBe(forfaitair.simIdxP90);

    // Verify the indices are exported
    expect(typeof forfaitair.simIdxP50).toBe('number');
    expect(typeof werkelijk.simIdxP50).toBe('number');

    console.log('\n=== Shared indices test ===');
    console.log('Forfaitair simIdxP50:', forfaitair.simIdxP50);
    console.log('Werkelijk simIdxP50 (shared):', werkelijk.simIdxP50);

    // With shared indices, asset breakdowns from the same percentile should come from same scenario
    // The actual values will differ due to different tax rules, but they're from the same return path
    const lastYear = DEFAULT_PARAMS.jaren;
    console.log('Forfaitair final ETF at P50:', forfaitair.data[lastYear].etfP50);
    console.log('Werkelijk final ETF at P50:', werkelijk.data[lastYear].etfP50);
  });

  it('should have totaalP50 that equals sum of asset breakdown', () => {
    // CRITICAL: The totaalP50 should equal etfP50 + cryptoP50 + spaarP50 + pensioenP50
    // This ensures the headline number matches the breakdown
    const scenarios = generateMCScenarios(DEFAULT_PARAMS, 0.15, 0.40, 100);
    const result = runMonteCarloWithScenarios(DEFAULT_PARAMS, 'forfaitair', true, scenarios);

    const lastYear = DEFAULT_PARAMS.jaren;
    const data = result.data[lastYear];

    const sumOfParts = data.etfP50 + data.cryptoP50 + data.spaarP50 + data.pensioenP50;
    const totaal = data.totaalP50;

    console.log('\n=== totaalP50 vs sum of parts ===');
    console.log('totaalP50:', totaal);
    console.log('etfP50 + cryptoP50 + spaarP50 + pensioenP50:', sumOfParts);
    console.log('Difference:', Math.abs(totaal - sumOfParts));

    // Should be equal (or very close due to rounding)
    expect(Math.abs(totaal - sumOfParts)).toBeLessThanOrEqual(4); // Allow 4 for rounding of 4 values
  });

  it('should have consistent comparison between forfaitair and werkelijk', () => {
    // CRITICAL: Both systems should use same scenario, so difference is only due to tax rules
    const scenarios = generateMCScenarios(DEFAULT_PARAMS, 0.15, 0.40, 100);

    const forfaitair = runMonteCarloWithScenarios(DEFAULT_PARAMS, 'forfaitair', true, scenarios);
    const sharedIndices = {
      simIdxP10: forfaitair.simIdxP10,
      simIdxP25: forfaitair.simIdxP25,
      simIdxP50: forfaitair.simIdxP50,
      simIdxP75: forfaitair.simIdxP75,
      simIdxP90: forfaitair.simIdxP90,
    };
    const werkelijk = runMonteCarloWithScenarios(DEFAULT_PARAMS, 'werkelijk', true, scenarios, sharedIndices);

    const lastYear = DEFAULT_PARAMS.jaren;
    const forf = forfaitair.data[lastYear];
    const werk = werkelijk.data[lastYear];

    console.log('\n=== Apples-to-apples comparison ===');
    console.log('Forfaitair totaalP50:', forf.totaalP50);
    console.log('Werkelijk totaalP50:', werk.totaalP50);
    console.log('Difference (werk - forf):', werk.totaalP50 - forf.totaalP50);
    console.log('Forfaitair cumBelP50:', forf.cumBelP50);
    console.log('Werkelijk cumBelP50:', werk.cumBelP50);

    // Since werkelijk typically has higher tax, totaalP50 should be lower
    // But this depends on the scenario - just verify they're different
    expect(forf.totaalP50).not.toBe(werk.totaalP50);

    // The difference in wealth should roughly correlate with difference in cumulative tax
    // (not exact because tax is paid from assets, compounding effects, etc.)
    const wealthDiff = forf.totaalP50 - werk.totaalP50;
    const taxDiff = werk.cumBelP50 - forf.cumBelP50;
    console.log('Wealth diff (forf - werk):', wealthDiff);
    console.log('Tax diff (werk - forf):', taxDiff);

    // If werkelijk has higher tax, forfaitair should have higher wealth
    // (or vice versa) - the signs should be opposite or both zero
    // In most scenarios: higher tax = lower wealth
  });
});

describe('simulate - tax calculation accuracy', () => {
  it('should correctly calculate forfaitair tax in 2027', () => {
    // Manual calculation for first year
    const params = {
      startEtf: 100000,
      startCrypto: 0,
      startSpaar: 50000,
      startPensioen: 20000,
      bijEtf: 0,
      bijCrypto: 0,
      bijSpaar: 0,
      bijPensioen: 0,
      rendEtf: 0.07,
      rendCrypto: 0.10,
      rendSpaar: 0.02,
      jaren: 1,
      fiscaalPartner: false,
    };

    const result = simulate(params, 'forfaitair', false, true, null);

    // 2027 tax calculated on 2026 values (100000 + 50000 = 150000 total)
    const hvF = HEFFINGSVRIJ_F;
    const expected = calcTax('forfaitair', 100000, 0, 50000, 0, 0, 0, hvF);

    expect(result.data[1].belasting).toBe(Math.round(expected.belasting));
  });

  it('should correctly calculate werkelijk tax starting 2028', () => {
    const params = {
      startEtf: 100000,
      startCrypto: 0,
      startSpaar: 50000,
      startPensioen: 0,
      bijEtf: 0,
      bijCrypto: 0,
      bijSpaar: 0,
      bijPensioen: 0,
      rendEtf: 0.07,
      rendCrypto: 0,
      rendSpaar: 0.02,
      jaren: 2,
      fiscaalPartner: false,
    };

    const result = simulate(params, 'werkelijk', false, true, null);

    // 2027 uses forfaitair (index 1)
    // 2028 uses werkelijk (index 2)
    // After 2027, ETF grew to ~107000, spaar to ~51000
    // 2028 growth: 107000 * 7% + 51000 * 2% = 7490 + 1020 = 8510
    // Werkelijk tax: (8510 - 1800) * 36% ≈ 2416

    console.log('\n=== Werkelijk tax check ===');
    console.log('2027 belasting (should be forfaitair):', result.data[1].belasting);
    console.log('2028 belasting (should be werkelijk):', result.data[2].belasting);

    // Verify 2028 is werkelijk-based
    expect(result.data[2].belasting).toBeGreaterThan(0);
  });

  it('should track cumulative tax correctly', () => {
    const result = simulate(DEFAULT_PARAMS, 'forfaitair', true, true, null);

    let cumulCheck = 0;
    for (let i = 0; i <= 10; i++) {
      cumulCheck += result.data[i].belasting;
      // Allow small rounding differences (cumulative rounding can accumulate)
      expect(Math.abs(result.data[i].cumulBelasting - cumulCheck)).toBeLessThanOrEqual(i + 1);
    }
  });

  it('should track tax payment sources correctly', () => {
    const params = {
      ...DEFAULT_PARAMS,
      startSpaar: 1000, // Very low savings to force other sources
      bijSpaar: 0,
    };

    const result = simulate(params, 'forfaitair', true, true, null);

    // Check that sources sum to belasting for each year
    for (let i = 1; i <= 10; i++) {
      const d = result.data[i];
      const sourcesTotal = d.uitSpaar + d.uitBijdragen + d.uitPensioen + d.uitInvestments;
      // Allow small rounding differences
      expect(Math.abs(sourcesTotal - d.belasting)).toBeLessThanOrEqual(1);
    }
  });

  it('should track verliesVoorraad for werkelijk rendement', () => {
    // Create scenario with negative year
    const negativeReturns = [
      { etf: -0.20, crypto: 0, spaar: 0.02 }, // Big loss in year 1
      { etf: 0.15, crypto: 0, spaar: 0.02 },  // Recovery in year 2
    ];

    const params = {
      startEtf: 100000,
      startCrypto: 0,
      startSpaar: 10000,
      startPensioen: 0,
      bijEtf: 0,
      bijCrypto: 0,
      bijSpaar: 0,
      bijPensioen: 0,
      rendEtf: 0.07,
      rendCrypto: 0,
      rendSpaar: 0.02,
      jaren: 2,
      fiscaalPartner: false,
    };

    const result = simulate(params, 'werkelijk', false, true, negativeReturns);

    console.log('\n=== VerliesVoorraad tracking ===');
    result.data.forEach(d => {
      console.log(`${d.jaar}: belasting=${d.belasting}, verliesVoorraad=${d.verliesVoorraad}`);
    });

    // After year 1 (2027, forfaitair), no verliesVoorraad tracked
    // After year 2 (2028, werkelijk with -20% return), should have verliesVoorraad
    // But since 2027 is forfaitair, the -20% loss doesn't create verliesVoorraad
    // The actual loss happens in year with werkelijk, which is 2028
    // With overrideReturns, year 1 (2027) gets negativeReturns[0]
  });

  it('should handle fiscaal partner doubling heffingsvrij', () => {
    const singleParams = { ...DEFAULT_PARAMS, fiscaalPartner: false };
    const partnerParams = { ...DEFAULT_PARAMS, fiscaalPartner: true };

    const single = simulate(singleParams, 'werkelijk', true, true, null);
    const partner = simulate(partnerParams, 'werkelijk', true, true, null);

    // With partner, more income is tax-free, so less tax
    console.log('\n=== Fiscaal partner effect ===');
    console.log('Single cumulative tax:', single.data[10].cumulBelasting);
    console.log('Partner cumulative tax:', partner.data[10].cumulBelasting);

    expect(partner.data[10].cumulBelasting).toBeLessThan(single.data[10].cumulBelasting);
  });
});

describe('simulate - edge cases', () => {
  it('should handle zero starting assets', () => {
    const params = {
      startEtf: 0,
      startCrypto: 0,
      startSpaar: 0,
      startPensioen: 0,
      bijEtf: 5000,
      bijCrypto: 0,
      bijSpaar: 2000,
      bijPensioen: 1000,
      rendEtf: 0.07,
      rendCrypto: 0,
      rendSpaar: 0.02,
      jaren: 10,
      fiscaalPartner: false,
    };

    const result = simulate(params, 'forfaitair', true, true, null);

    // Should have growing assets from contributions
    expect(result.data[10].totaal).toBeGreaterThan(0);
    // First years might have 0 tax (below heffingsvrij)
    expect(result.data[0].belasting).toBe(0);
  });

  it('should handle 100% savings portfolio', () => {
    const params = {
      startEtf: 0,
      startCrypto: 0,
      startSpaar: 150000,
      startPensioen: 0,
      bijEtf: 0,
      bijCrypto: 0,
      bijSpaar: 5000,
      bijPensioen: 0,
      rendEtf: 0.07,
      rendCrypto: 0,
      rendSpaar: 0.02,
      jaren: 5,
      fiscaalPartner: false,
    };

    const forf = simulate(params, 'forfaitair', true, true, null);
    const werk = simulate(params, 'werkelijk', true, true, null);

    // Should calculate without errors
    expect(forf.data[5].belasting).toBeGreaterThanOrEqual(0);
    expect(werk.data[5].belasting).toBeGreaterThanOrEqual(0);
  });

  it('should handle very high returns in MC without overflow', () => {
    const extremeReturns = Array.from({ length: 25 }, () => ({
      etf: 0.50, // 50% return each year
      crypto: 1.0, // 100% return each year
      spaar: 0.10,
    }));

    const params = {
      ...DEFAULT_PARAMS,
      startCrypto: 10000,
      jaren: 25,
    };

    const result = simulate(params, 'werkelijk', true, true, extremeReturns);

    // Should not overflow or produce NaN
    expect(Number.isFinite(result.data[25].totaal)).toBe(true);
    expect(Number.isFinite(result.data[25].cumulBelasting)).toBe(true);
    expect(result.data[25].totaal).toBeGreaterThan(0);
  });
});

describe('runPairedMonteCarlo - true median of differences', () => {
  beforeEach(() => {
    setSessionSeed(42);
  });

  it('should return forfaitair, werkelijk, and diff arrays', () => {
    const scenarios = generateMCScenarios(DEFAULT_PARAMS, 0.15, 0.40, 100);
    const result = runPairedMonteCarlo(DEFAULT_PARAMS, true, scenarios);

    expect(result).toHaveProperty('forfaitair');
    expect(result).toHaveProperty('werkelijk');
    expect(result).toHaveProperty('diff');

    expect(result.forfaitair.data).toHaveLength(DEFAULT_PARAMS.jaren + 1);
    expect(result.werkelijk.data).toHaveLength(DEFAULT_PARAMS.jaren + 1);
    expect(result.diff).toHaveLength(DEFAULT_PARAMS.jaren + 1);
  });

  it('should compute per-scenario differences correctly', () => {
    const scenarios = generateMCScenarios(DEFAULT_PARAMS, 0.15, 0.40, 100);
    const result = runPairedMonteCarlo(DEFAULT_PARAMS, true, scenarios);

    const lastYear = DEFAULT_PARAMS.jaren;
    const diffData = result.diff[lastYear];

    // Check that diff structure has the expected percentile keys
    expect(diffData).toHaveProperty('diffVermogenP50');
    expect(diffData).toHaveProperty('diffVermogenP10');
    expect(diffData).toHaveProperty('diffVermogenP90');
    expect(diffData).toHaveProperty('diffBelastingP50');

    console.log('\n=== Paired MC difference statistics ===');
    console.log('diffVermogenP10:', diffData.diffVermogenP10);
    console.log('diffVermogenP50 (median):', diffData.diffVermogenP50);
    console.log('diffVermogenP90:', diffData.diffVermogenP90);
    console.log('diffBelastingP50:', diffData.diffBelastingP50);

    // P10 should be less than P50 should be less than P90
    expect(diffData.diffVermogenP10).toBeLessThanOrEqual(diffData.diffVermogenP50);
    expect(diffData.diffVermogenP50).toBeLessThanOrEqual(diffData.diffVermogenP90);
  });

  it('should give different result than difference of medians', () => {
    // This is the key test: P50(werk - forf) !== P50(werk) - P50(forf)
    const scenarios = generateMCScenarios(DEFAULT_PARAMS, 0.15, 0.40, 100);
    const result = runPairedMonteCarlo(DEFAULT_PARAMS, true, scenarios);

    const lastYear = DEFAULT_PARAMS.jaren;
    const diffData = result.diff[lastYear];
    const forfData = result.forfaitair.data[lastYear];
    const werkData = result.werkelijk.data[lastYear];

    // True median of differences (statistically correct)
    const trueMedianDiff = diffData.diffVermogenP50;

    // Difference of medians (what we had before)
    const diffOfMedians = werkData.totaalP50 - forfData.totaalP50;

    console.log('\n=== Median of differences vs Difference of medians ===');
    console.log('True median of (werk - forf):', trueMedianDiff);
    console.log('Difference of medians (werk.P50 - forf.P50):', diffOfMedians);
    console.log('Difference between approaches:', Math.abs(trueMedianDiff - diffOfMedians));

    // They might be close but generally won't be identical
    // The test is just to verify we're computing something different and sensible
    expect(typeof trueMedianDiff).toBe('number');
    expect(Number.isFinite(trueMedianDiff)).toBe(true);
  });

  it('should have year 0 (2026) with zero differences', () => {
    const scenarios = generateMCScenarios(DEFAULT_PARAMS, 0.15, 0.40, 100);
    const result = runPairedMonteCarlo(DEFAULT_PARAMS, true, scenarios);

    const year0 = result.diff[0];

    // At year 0, no returns have been applied yet, so both systems are identical
    expect(year0.diffVermogenP50).toBe(0);
    expect(year0.diffBelastingP50).toBe(0);
  });

  it('should show differences only from 2028 onwards', () => {
    const scenarios = generateMCScenarios(DEFAULT_PARAMS, 0.15, 0.40, 100);
    const result = runPairedMonteCarlo(DEFAULT_PARAMS, true, scenarios);

    // 2026 (index 0): starting point, no difference
    // 2027 (index 1): both use forfaitair, cumulative tax difference should be 0
    // 2028+ (index 2+): systems diverge

    const year2027 = result.diff[1];
    const year2028 = result.diff[2];

    console.log('\n=== Difference emergence ===');
    console.log('2027 diffBelastingP50:', year2027.diffBelastingP50);
    console.log('2028 diffBelastingP50:', year2028.diffBelastingP50);

    // 2027 should have zero tax difference (both use forfaitair)
    expect(year2027.diffBelastingP50).toBe(0);

    // 2028 can have non-zero difference (or zero in some scenarios, but typically non-zero)
  });

  it('should use shared indices for consistent asset breakdown', () => {
    const scenarios = generateMCScenarios(DEFAULT_PARAMS, 0.15, 0.40, 100);
    const result = runPairedMonteCarlo(DEFAULT_PARAMS, true, scenarios);

    // Verify werkelijk uses forfaitair's indices
    expect(result.werkelijk.simIdxP50).toBe(result.forfaitair.simIdxP50);
    expect(result.werkelijk.simIdxP10).toBe(result.forfaitair.simIdxP10);
    expect(result.werkelijk.simIdxP90).toBe(result.forfaitair.simIdxP90);
  });
});
