import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { clsx } from "clsx";
import {
  LineChart, Line, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

import { formatCompact } from "../../utils/format";
import { CustomTooltip } from "../ui";
import { OutcomeCard } from "./OutcomeCard";
import { ScenarioSelector } from "./ScenarioSelector";
import { AdvancedInsights } from "./AdvancedInsights";

const fmtK = formatCompact;

// Chart theme colors (needed for Recharts which requires inline styles)
const CHART_COLORS = {
  forfaitair: "#3b82f6",
  werkelijk: "#10b981",
  // Tax payment sources
  uitSpaar: "#eab308",      // yellow - savings
  uitBijdragen: "#f97316",  // orange - reduced ETF/crypto contributions
  uitPensioen: "#ec4899",   // pink - reduced pension contributions
  uitInvestments: "#ef4444", // red - sold investments
};

/**
 * Dashboard component with charts (lazy loaded)
 */
export function Dashboard({
  // State
  jaren,
  bijPensioen,
  bijSpaar,
  fiscaalPartner, setFiscaalPartner,
  // Simulation data
  fMet, wMet,
  selectedScenario, setSelectedScenario,
  scenarioResults,
  startSpaar,
  onCustomScenarioClick,
  // Monte Carlo (enabled via custom scenario modal)
  mcResults,
  // Actions
  handleShare,
  showCopied,
  goToInfo,
  goToWizard,
  goToLanding,
  darkMode, setDarkMode,
  theme,
}) {
  const [activeTab, setActiveTab] = useState("vermogen");
  const [showCumulative, setShowCumulative] = useState(false);

  // Monte Carlo is enabled when mcResults exists
  const mcEnabled = !!mcResults;

  // Use selected scenario results for display (fallback to base simulations if scenario not ready)
  const currentScenario = scenarioResults[selectedScenario];
  const displayFMet = currentScenario?.forfaitair || fMet;
  const displayWMet = currentScenario?.werkelijk || wMet;

  // Chart data - deterministic (exclude 2026 starting point)
  // Vermogen: show werkelijk from 2028+ only (before that it equals forfaitair)
  const chartVermogenCumul = useMemo(() => displayFMet.data.slice(1).map((d, i) => ({
    jaar: d.jaar,
    "Forfaitair": d.totaal,
    "Werkelijk 2028+": d.jaar >= 2028 ? displayWMet.data[i + 1]?.totaal : null,
  })), [displayFMet, displayWMet]);

  // Per-year growth: 2027 shows forfaitair only, 2028+ shows both
  const chartVermogenYear = useMemo(() => displayFMet.data.slice(1).map((d, i) => ({
    jaar: d.jaar,
    "Forfaitair": d.totaal - displayFMet.data[i].totaal,
    "Werkelijk 2028+": d.jaar >= 2028 ? (displayWMet.data[i + 1]?.totaal ?? 0) - (displayWMet.data[i]?.totaal ?? 0) : null,
  })), [displayFMet, displayWMet]);

  // Belasting charts: werkelijk only applies from 2028, show null before that
  const chartBelCumul = useMemo(() => displayFMet.data.slice(1).map((d, i) => ({
    jaar: d.jaar,
    "Belasting Forfaitair": d.cumulBelasting,
    "Belasting Werkelijk 2028+": d.jaar >= 2028 ? displayWMet.data[i + 1]?.cumulBelasting : null,
  })), [displayFMet, displayWMet]);

  const chartBelYear = useMemo(() => displayFMet.data.slice(1).map((d, i) => ({
    jaar: d.jaar,
    "Belasting Forfaitair": d.belasting,
    "Belasting Werkelijk 2028+": d.jaar >= 2028 ? displayWMet.data[i + 1]?.belasting : null,
  })), [displayFMet, displayWMet]);

  // Tax payment sources - stacked bar chart data
  const chartTaxSourcesF = useMemo(() => displayFMet.data.slice(1).map((d) => ({
    jaar: d.jaar,
    "Spaargeld": d.uitSpaar,
    "Inleg ETF/crypto": d.uitBijdragen,
    "Inleg pensioen": d.uitPensioen,
    "Verkoop beleggingen": d.uitInvestments,
  })), [displayFMet]);

  const chartTaxSourcesW = useMemo(() => displayWMet.data.slice(1).map((d) => ({
    jaar: d.jaar,
    "Spaargeld": d.uitSpaar,
    "Inleg ETF/crypto": d.uitBijdragen,
    "Inleg pensioen": d.uitPensioen,
    "Verkoop beleggingen": d.uitInvestments,
  })), [displayWMet]);

  // Calculate shared Y-axis max for tax sources charts (to enable visual comparison)
  const taxSourcesMaxY = useMemo(() => {
    const sumRow = (d) => (d["Spaargeld"] || 0) + (d["Inleg ETF/crypto"] || 0) + (d["Inleg pensioen"] || 0) + (d["Verkoop beleggingen"] || 0);
    const maxF = Math.max(...chartTaxSourcesF.map(sumRow));
    const maxW = Math.max(...chartTaxSourcesW.map(sumRow));
    return Math.max(maxF, maxW);
  }, [chartTaxSourcesF, chartTaxSourcesW]);

  // Monte Carlo chart data - add percentile bands when MC is enabled
  const mcChartData = useMemo(() => {
    if (!mcEnabled || !mcResults) return null;

    // Extract percentile data from MC results
    // mcResults has structure: { forfaitair: {...}, werkelijk: {...}, diff: [...] }
    const { forfaitair: mcF, werkelijk: mcW } = mcResults;

    // Prepare vermogen data with P10/P90 bands
    const vermogenData = mcF.data.slice(1).map((d, i) => {
      const wData = mcW.data[i + 1];
      return {
        jaar: d.jaar,
        // Forfaitair (deterministic, no bands needed - use totaalP50)
        "Forfaitair": d.totaalP50,
        // Werkelijk with confidence bands (all years - use totaalP10/P50/P90)
        "Werkelijk P10": wData?.totaalP10 || null,
        "Werkelijk P50": wData?.totaalP50 || null,
        "Werkelijk P90": wData?.totaalP90 || null,
      };
    });

    // Prepare belasting data with P10/P90 bands
    const belastingData = mcF.data.slice(1).map((d, i) => {
      const wData = mcW.data[i + 1];
      return {
        jaar: d.jaar,
        // Forfaitair cumulative tax (use cumBelP50)
        "Belasting Forfaitair": d.cumBelP50,
        // Werkelijk cumulative tax with confidence bands (2028+ only - use cumBelP10/P50/P90)
        "Belasting Werkelijk P10": d.jaar >= 2028 ? wData?.cumBelP10 : null,
        "Belasting Werkelijk P50": d.jaar >= 2028 ? wData?.cumBelP50 : null,
        "Belasting Werkelijk P90": d.jaar >= 2028 ? wData?.cumBelP90 : null,
      };
    });

    return {
      vermogen: vermogenData,
      belasting: belastingData,
    };
  }, [mcEnabled, mcResults]);

  // Derived values - use MC results if enabled, otherwise deterministic
  const eindF = mcEnabled && mcResults
    ? mcResults.forfaitair.data[mcResults.forfaitair.data.length - 1]
    : displayFMet.data[displayFMet.data.length - 1];
  const eindW = mcEnabled && mcResults
    ? mcResults.werkelijk.data[mcResults.werkelijk.data.length - 1]
    : displayWMet.data[displayWMet.data.length - 1];

  // Asset breakdown for OutcomeCard tooltips
  const breakdownF = eindF ? {
    etf: mcEnabled ? eindF.etfP50 : eindF.etf,
    crypto: mcEnabled ? eindF.cryptoP50 : eindF.crypto,
    spaar: mcEnabled ? eindF.spaarP50 : eindF.spaar,
    pensioen: mcEnabled ? eindF.pensioenP50 : eindF.pensioen,
  } : null;

  const breakdownW = eindW ? {
    etf: mcEnabled ? eindW.etfP50 : eindW.etf,
    crypto: mcEnabled ? eindW.cryptoP50 : eindW.crypto,
    spaar: mcEnabled ? eindW.spaarP50 : eindW.spaar,
    pensioen: mcEnabled ? eindW.pensioenP50 : eindW.pensioen,
  } : null;

  // MC uncertainty ranges for OutcomeCard
  const mcUncertainty = mcEnabled && mcResults ? {
    forfaitairP10: eindF.totaalP10,
    forfaitairP50: eindF.totaalP50,
    forfaitairP90: eindF.totaalP90,
    werkelijkP10: eindW.totaalP10,
    werkelijkP50: eindW.totaalP50,
    werkelijkP90: eindW.totaalP90,
  } : null;

  // Chart line configurations
  const DET_LINES = [
    { k: "Forfaitair", c: CHART_COLORS.forfaitair, d: false },
    { k: "Werkelijk 2028+", c: CHART_COLORS.werkelijk, d: false },
  ];

  const BEL_LINES = [
    { k: "Belasting Forfaitair", c: CHART_COLORS.forfaitair, d: false },
    { k: "Belasting Werkelijk 2028+", c: CHART_COLORS.werkelijk, d: false },
  ];

  const tooltipProps = {
    content: (props) => <CustomTooltip {...props} theme={theme} />
  };

  // Chart styling based on dark mode
  const isDark = darkMode === "dark" || (darkMode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const gridLineColor = isDark ? "#374151" : "#e5e7eb";
  const axisLineColor = isDark ? "#4b5563" : "#d1d5db";
  const axisTickColor = isDark ? "#9ca3af" : "#6b7280";

  return (
    <>
      <div className="max-w-[960px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold text-mist-950 dark:text-mist-50 m-0 tracking-tight">
              Box 3 Calculator
            </h1>
            <div className="text-[13px] text-mist-500 dark:text-mist-400 mt-1">
              Forfaitair 2027 vs Werkelijk 2028+
            </div>
          </div>
          <div className="flex gap-2.5 items-center">
            <button
              onClick={goToInfo}
              className="bg-transparent border-none cursor-pointer text-[13px] text-mist-950 dark:text-mist-50 font-sans font-semibold py-2.5 px-2 hover:text-accent transition-colors"
            >
              ℹ️ Info
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 py-2.5 px-3.5 bg-white dark:bg-mist-800 border border-mist-200 dark:border-mist-700 rounded-xl cursor-pointer text-[13px] font-semibold text-mist-950 dark:text-mist-50 font-sans hover:border-mist-300 dark:hover:border-mist-600 transition-colors"
            >
              {showCopied ? "✓ Gekopieerd" : "📤 Delen"}
            </button>
            <button
              onClick={goToWizard}
              className="flex items-center gap-2 py-2.5 px-4 bg-white dark:bg-mist-800 border border-mist-200 dark:border-mist-700 rounded-xl cursor-pointer text-sm font-semibold text-mist-950 dark:text-mist-50 font-sans hover:border-mist-300 dark:hover:border-mist-600 transition-colors"
            >
              ✏️ Aanpassen
            </button>
            <button
              onClick={() => setDarkMode(darkMode === "dark" ? "light" : darkMode === "light" ? "system" : "dark")}
              className="w-[42px] h-[42px] rounded-xl border border-mist-200 dark:border-mist-700 bg-white dark:bg-mist-800 cursor-pointer text-lg flex items-center justify-center hover:border-mist-300 dark:hover:border-mist-600 transition-colors"
            >
              {darkMode === "dark" ? "🌙" : darkMode === "light" ? "☀️" : "💻"}
            </button>
          </div>
        </div>

        {/* Outcome Card */}
        <OutcomeCard
          forfaitair={mcEnabled ? eindF?.totaalP50 ?? 0 : eindF?.totaal ?? 0}
          werkelijk={mcEnabled ? eindW?.totaalP50 ?? 0 : eindW?.totaal ?? 0}
          breakdownF={breakdownF}
          breakdownW={breakdownW}
          jaren={jaren}
          fiscaalPartner={fiscaalPartner}
          setFiscaalPartner={setFiscaalPartner}
          scenarioName={currentScenario?.name}
          mcEnabled={mcEnabled}
          mcUncertainty={mcUncertainty}
        />

        {/* Scenario Selector - Phase 1: Scenario Uncertainty */}
        <ScenarioSelector
          selectedScenario={selectedScenario}
          onScenarioChange={setSelectedScenario}
          onCustomClick={onCustomScenarioClick}
        />

        {/* Spaargeld uitgeput warning */}
        {(() => {
          const spaarUitgeputJaar = displayWMet.spaarUitgeputJaar;
          if (!spaarUitgeputJaar) return null;
          return (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <div className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  Spaargeld raakt op in {spaarUitgeputJaar}
                </div>
                <div className="text-sm text-amber-800 dark:text-amber-300/90">
                  Vanaf dat jaar wordt belasting betaald door minder in te leggen in ETF, crypto en pensioen. Als dat niet voldoende is, worden beleggingen verkocht.
                </div>
              </div>
            </div>
          );
        })()}

        {/* Pension impact warning - compare werkelijk vs forfaitair */}
        {(() => {
          // Only show if user has pension contributions
          if (bijPensioen <= 0) return null;

          const wPensioen = eindW?.cumulGemistePensioen || 0;
          const fPensioen = eindF?.cumulGemistePensioen || 0;

          const extraGemist = wPensioen - fPensioen;
          if (extraGemist <= 0) return null;
          return (
            <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/30 flex items-start gap-3">
              <span className="text-lg">🎯</span>
              <div>
                <div className="text-sm font-bold text-red-700 dark:text-red-400">
                  Pensioenopbouw geraakt: {fmtK(extraGemist)} minder ingelegd
                </div>
                <div className="text-sm text-red-800 dark:text-red-300/90">
                  Onder werkelijk rendement gaat er over {jaren} jaar {fmtK(extraGemist)} extra naar belasting die anders naar je pensioenbelegging zou gaan (ten opzichte van forfaitair).
                </div>
              </div>
            </div>
          );
        })()}

        {/* Charts */}
        <div className="bg-white dark:bg-mist-900 rounded-2xl border border-mist-200 dark:border-mist-700 overflow-hidden mb-4 shadow-sm">
          {/* Tab bar */}
          <div className="flex border-b border-mist-200 dark:border-mist-700 overflow-x-auto">
            {[
              { k: "vermogen", l: "Vermogen" },
              { k: "belasting", l: "Belasting" },
              { k: "bronnen", l: "Betaling belasting" },
            ].map(({ k, l }) => (
              <button
                key={k}
                onClick={() => setActiveTab(k)}
                className={clsx(
                  "flex-1 min-w-[100px] py-3 px-4",
                  "text-[13px] font-bold font-sans",
                  "border-none cursor-pointer",
                  "border-b-2 transition-colors",
                  activeTab === k
                    ? "bg-white dark:bg-mist-900 text-accent border-b-accent"
                    : "bg-transparent text-mist-500 dark:text-mist-400 border-b-transparent hover:text-mist-700 dark:hover:text-mist-300"
                )}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Chart content */}
          <div className="p-4">
            {activeTab === "vermogen" && (
              <>
                <div className="px-2 pb-3 flex items-center justify-end">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowCumulative(false)}
                      className={clsx(
                        "py-1 px-2.5 text-xs font-semibold rounded-md transition-colors cursor-pointer border",
                        !showCumulative
                          ? "bg-accent text-white border-accent"
                          : "bg-transparent text-mist-500 dark:text-mist-400 border-mist-200 dark:border-mist-700 hover:border-mist-300 dark:hover:border-mist-600"
                      )}
                    >
                      Per jaar
                    </button>
                    <button
                      onClick={() => setShowCumulative(true)}
                      className={clsx(
                        "py-1 px-2.5 text-xs font-semibold rounded-md transition-colors cursor-pointer border",
                        showCumulative
                          ? "bg-accent text-white border-accent"
                          : "bg-transparent text-mist-500 dark:text-mist-400 border-mist-200 dark:border-mist-700 hover:border-mist-300 dark:hover:border-mist-600"
                      )}
                    >
                      Cumulatief
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={mcEnabled && mcChartData && showCumulative ? mcChartData.vermogen : (showCumulative ? chartVermogenCumul : chartVermogenYear)}
                    margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                    <XAxis dataKey="jaar" stroke={axisLineColor} tick={{ fill: axisTickColor, fontSize: 12 }} />
                    <YAxis stroke={axisLineColor} tick={{ fill: axisTickColor, fontSize: 12 }} tickFormatter={fmtK} width={72} />
                    <Tooltip {...tooltipProps} />

                    {/* Monte Carlo: Show confidence bands */}
                    {mcEnabled && mcChartData && showCumulative ? (
                      <>
                        {/* P10-P90 confidence band for Werkelijk - render as single band */}
                        <defs>
                          <linearGradient id="werkelijkBand" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS.werkelijk} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={CHART_COLORS.werkelijk} stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        {/* Band visualization using two Areas */}
                        <Area
                          type="monotone"
                          dataKey="Werkelijk P90"
                          stroke="none"
                          fill="url(#werkelijkBand)"
                          fillOpacity={1}
                          isAnimationActive={false}
                        />
                        <Area
                          type="monotone"
                          dataKey="Werkelijk P10"
                          stroke="none"
                          fill="white"
                          fillOpacity={1}
                          isAnimationActive={false}
                        />
                        {/* Median lines */}
                        <Line
                          type="monotone"
                          dataKey="Forfaitair"
                          stroke={CHART_COLORS.forfaitair}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="Werkelijk P50"
                          stroke={CHART_COLORS.werkelijk}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                          isAnimationActive={false}
                        />
                        {/* P90 and P10 as dashed lines for clarity */}
                        <Line
                          type="monotone"
                          dataKey="Werkelijk P90"
                          stroke={CHART_COLORS.werkelijk}
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                          strokeOpacity={0.4}
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="Werkelijk P10"
                          stroke={CHART_COLORS.werkelijk}
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                          strokeOpacity={0.4}
                          isAnimationActive={false}
                        />
                      </>
                    ) : (
                      /* Deterministic: Show regular lines */
                      DET_LINES.map(({ k, c, d }) => (
                        <Line
                          key={k}
                          type="monotone"
                          dataKey={k}
                          stroke={c}
                          strokeWidth={2.5}
                          strokeDasharray={d ? "5 3" : "0"}
                          dot={false}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                      ))
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}

            {activeTab === "belasting" && (
              <>
                <div className="px-2 pb-3 flex items-center justify-end">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowCumulative(false)}
                      className={clsx(
                        "py-1 px-2.5 text-xs font-semibold rounded-md transition-colors cursor-pointer border",
                        !showCumulative
                          ? "bg-accent text-white border-accent"
                          : "bg-transparent text-mist-500 dark:text-mist-400 border-mist-200 dark:border-mist-700 hover:border-mist-300 dark:hover:border-mist-600"
                      )}
                    >
                      Per jaar
                    </button>
                    <button
                      onClick={() => setShowCumulative(true)}
                      className={clsx(
                        "py-1 px-2.5 text-xs font-semibold rounded-md transition-colors cursor-pointer border",
                        showCumulative
                          ? "bg-accent text-white border-accent"
                          : "bg-transparent text-mist-500 dark:text-mist-400 border-mist-200 dark:border-mist-700 hover:border-mist-300 dark:hover:border-mist-600"
                      )}
                    >
                      Cumulatief
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={mcEnabled && mcChartData && showCumulative ? mcChartData.belasting : (showCumulative ? chartBelCumul : chartBelYear)}
                    margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                    <XAxis dataKey="jaar" stroke={axisLineColor} tick={{ fill: axisTickColor, fontSize: 12 }} />
                    <YAxis stroke={axisLineColor} tick={{ fill: axisTickColor, fontSize: 12 }} tickFormatter={fmtK} width={72} />
                    <Tooltip {...tooltipProps} />

                    {/* Monte Carlo: Show confidence bands */}
                    {mcEnabled && mcChartData && showCumulative ? (
                      <>
                        {/* P10-P90 confidence band for Werkelijk */}
                        <defs>
                          <linearGradient id="werkelijkBandBel" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS.werkelijk} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={CHART_COLORS.werkelijk} stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="Belasting Werkelijk P90"
                          stroke="none"
                          fill="url(#werkelijkBandBel)"
                          fillOpacity={1}
                          isAnimationActive={false}
                        />
                        <Area
                          type="monotone"
                          dataKey="Belasting Werkelijk P10"
                          stroke="none"
                          fill="white"
                          fillOpacity={1}
                          isAnimationActive={false}
                        />
                        {/* Median lines */}
                        <Line
                          type="monotone"
                          dataKey="Belasting Forfaitair"
                          stroke={CHART_COLORS.forfaitair}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="Belasting Werkelijk P50"
                          stroke={CHART_COLORS.werkelijk}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                          isAnimationActive={false}
                        />
                        {/* P90 and P10 as dashed lines */}
                        <Line
                          type="monotone"
                          dataKey="Belasting Werkelijk P90"
                          stroke={CHART_COLORS.werkelijk}
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                          strokeOpacity={0.4}
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="Belasting Werkelijk P10"
                          stroke={CHART_COLORS.werkelijk}
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                          strokeOpacity={0.4}
                          isAnimationActive={false}
                        />
                      </>
                    ) : (
                      /* Deterministic: Show regular lines */
                      BEL_LINES.map(({ k, c, d }) => (
                        <Line
                          key={k}
                          type="monotone"
                          dataKey={k}
                          stroke={c}
                          strokeWidth={2.5}
                          strokeDasharray={d ? "5 3" : "0"}
                          dot={false}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                      ))
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}

            {activeTab === "bronnen" && (
              <>
                <div className="px-2 pb-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs text-mist-500 dark:text-mist-400">
                    Waaruit wordt de belasting betaald?
                  </div>
                  <div className="flex items-center gap-3 text-[11px] flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: CHART_COLORS.uitSpaar }} />
                      <span className="text-mist-600 dark:text-mist-300">Spaargeld</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: CHART_COLORS.uitBijdragen }} />
                      <span className="text-mist-600 dark:text-mist-300">Inleg ETF/crypto</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: CHART_COLORS.uitPensioen }} />
                      <span className="text-mist-600 dark:text-mist-300">Inleg pensioen</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: CHART_COLORS.uitInvestments }} />
                      <span className="text-mist-600 dark:text-mist-300">Verkoop</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Forfaitair sources */}
                  <div>
                    <div className="text-xs font-bold text-forfaitair uppercase tracking-wide mb-2 px-2">
                      Forfaitair
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartTaxSourcesF} margin={{ top: 4, right: 10, left: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                        <XAxis dataKey="jaar" stroke={axisLineColor} tick={{ fill: axisTickColor, fontSize: 10 }} />
                        <YAxis stroke={axisLineColor} tick={{ fill: axisTickColor, fontSize: 10 }} tickFormatter={fmtK} width={50} domain={[0, taxSourcesMaxY]} />
                        <Tooltip {...tooltipProps} />
                        <Bar dataKey="Spaargeld" stackId="a" fill={CHART_COLORS.uitSpaar} />
                        <Bar dataKey="Inleg ETF/crypto" stackId="a" fill={CHART_COLORS.uitBijdragen} />
                        <Bar dataKey="Inleg pensioen" stackId="a" fill={CHART_COLORS.uitPensioen} />
                        <Bar dataKey="Verkoop beleggingen" stackId="a" fill={CHART_COLORS.uitInvestments} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Werkelijk sources */}
                  <div>
                    <div className="text-xs font-bold text-werkelijk uppercase tracking-wide mb-2 px-2">
                      Werkelijk 2028+
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartTaxSourcesW} margin={{ top: 4, right: 10, left: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                        <XAxis dataKey="jaar" stroke={axisLineColor} tick={{ fill: axisTickColor, fontSize: 10 }} />
                        <YAxis stroke={axisLineColor} tick={{ fill: axisTickColor, fontSize: 10 }} tickFormatter={fmtK} width={50} domain={[0, taxSourcesMaxY]} />
                        <Tooltip {...tooltipProps} />
                        <Bar dataKey="Spaargeld" stackId="a" fill={CHART_COLORS.uitSpaar} />
                        <Bar dataKey="Inleg ETF/crypto" stackId="a" fill={CHART_COLORS.uitBijdragen} />
                        <Bar dataKey="Inleg pensioen" stackId="a" fill={CHART_COLORS.uitPensioen} />
                        <Bar dataKey="Verkoop beleggingen" stackId="a" fill={CHART_COLORS.uitInvestments} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="text-xs text-mist-500 dark:text-mist-400 mt-3 px-2">
                  Geel = spaargeld (incl. jaarlijkse inleg). Oranje/roze = minder inleg. Rood = verkoop van beleggingen.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Advanced Insights - Below charts with neutral styling */}
        <AdvancedInsights
          scenarioResults={scenarioResults}
          selectedScenario={selectedScenario}
          startSpaar={startSpaar}
          bijSpaar={bijSpaar}
          jaren={jaren}
        />

        {/* Footer */}
        <div className="text-xs text-mist-500 dark:text-mist-400 leading-loose pb-5">
          * Forfait: 5.88% overige bezittingen, 1.37% spaargeld, heffingsvrij €57.684/persoon (2025 tarieven).
          Werkelijk 2028+: wetsvoorstel bij Eerste Kamer — ongerealiseerde koerswinsten jaarlijks belast à 36%, heffingsvrij ~€1.800 (schatting).
          {" "}Pensioenbeleggingen vrijgesteld van box 3.
          {" "}Alle rendementen zijn reëel (na inflatie, ~7% voor aandelen historisch).
          {" "}Geen financiëel advies.
        </div>

        <div className="flex items-center gap-3 pb-5 flex-wrap">
          <span className="text-xs text-mist-500 dark:text-mist-400">
            Geen cookies. Geen trackers. Alles blijft in je browser.
          </span>
          <button
            onClick={goToInfo}
            className="bg-transparent border-none cursor-pointer text-xs text-accent font-sans font-semibold p-0 hover:underline"
          >
            Meer informatie
          </button>
          <span className="text-mist-400 dark:text-mist-500">·</span>
          <button
            onClick={goToLanding}
            className="bg-transparent border-none cursor-pointer text-xs text-accent font-sans font-semibold p-0 hover:underline"
          >
            Opnieuw beginnen
          </button>
        </div>
      </div>
    </>
  );
}

Dashboard.propTypes = {
  jaren: PropTypes.number.isRequired,
  bijPensioen: PropTypes.number.isRequired,
  bijSpaar: PropTypes.number.isRequired,
  fiscaalPartner: PropTypes.bool.isRequired,
  setFiscaalPartner: PropTypes.func.isRequired,
  fMet: PropTypes.object.isRequired,
  wMet: PropTypes.object.isRequired,
  selectedScenario: PropTypes.string.isRequired,
  setSelectedScenario: PropTypes.func.isRequired,
  scenarioResults: PropTypes.object.isRequired,
  startSpaar: PropTypes.number.isRequired,
  onCustomScenarioClick: PropTypes.func.isRequired,
  mcResults: PropTypes.object, // Optional - enabled via custom scenario modal
  handleShare: PropTypes.func.isRequired,
  showCopied: PropTypes.bool.isRequired,
  goToInfo: PropTypes.func.isRequired,
  goToWizard: PropTypes.func.isRequired,
  goToLanding: PropTypes.func.isRequired,
  darkMode: PropTypes.string.isRequired,
  setDarkMode: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired,
};
