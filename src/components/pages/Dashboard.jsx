import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { clsx } from "clsx";
import {
  ComposedChart, Line, Area, LineChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

import { formatCompact } from "../../utils/format";
import { CustomTooltip, TableTooltip } from "../ui";
import { OutcomeCard } from "./OutcomeCard";

const fmtK = formatCompact;

// Chart theme colors (needed for Recharts which requires inline styles)
const CHART_COLORS = {
  forfaitair: "#3b82f6",
  werkelijk: "#10b981",
  werkelijkAlt: "#a855f7",
  belastingAlt: "#ef4444",
};

/**
 * Dashboard component with charts (lazy loaded)
 */
export function Dashboard({
  // State
  jaren,
  fiscaalPartner, setFiscaalPartner,
  advancedMode, setAdvancedMode,
  mcPercentile, setMcPercentile,
  volEtf, setVolEtf,
  volCrypto, setVolCrypto,
  // Simulation data
  fMet, wMet,
  mcDataForfaitair, mcDataWerkelijk,
  // Actions
  regenerateMC,
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

  // Chart data - deterministic (exclude 2026 starting point)
  // Vermogen: show werkelijk from 2028+ only (before that it equals forfaitair)
  const chartVermogenCumul = useMemo(() => fMet.data.slice(1).map((d, i) => ({
    jaar: d.jaar,
    "Forfaitair": d.totaal,
    "Werkelijk 2028+": d.jaar >= 2028 ? wMet.data[i + 1]?.totaal : null,
  })), [fMet, wMet]);

  // Per-year growth: 2027 shows forfaitair only, 2028+ shows both
  const chartVermogenYear = useMemo(() => fMet.data.slice(1).map((d, i) => ({
    jaar: d.jaar,
    "Forfaitair": d.totaal - fMet.data[i].totaal,
    "Werkelijk 2028+": d.jaar >= 2028 ? (wMet.data[i + 1]?.totaal ?? 0) - (wMet.data[i]?.totaal ?? 0) : null,
  })), [fMet, wMet]);

  // Belasting charts: werkelijk only applies from 2028, show null before that
  const chartBelCumul = useMemo(() => fMet.data.slice(1).map((d, i) => ({
    jaar: d.jaar,
    "Belasting Forfaitair": d.cumulBelasting,
    "Belasting Werkelijk 2028+": d.jaar >= 2028 ? wMet.data[i + 1]?.cumulBelasting : null,
  })), [fMet, wMet]);

  const chartBelYear = useMemo(() => fMet.data.slice(1).map((d, i) => ({
    jaar: d.jaar,
    "Belasting Forfaitair": d.belasting,
    "Belasting Werkelijk 2028+": d.jaar >= 2028 ? wMet.data[i + 1]?.belasting : null,
  })), [fMet, wMet]);

  // Chart data - Monte Carlo (exclude 2026 starting point)
  // Cumulative vermogen
  const chartMCCumul = useMemo(() => {
    const pKey = `p${mcPercentile}`;
    return mcDataForfaitair.slice(1).map((d, i) => ({
      jaar: d.jaar,
      "MC Forfaitair": d[pKey],
      "MC Werkelijk": d.jaar >= 2028 ? mcDataWerkelijk[i + 1]?.[pKey] : null,
      "Forfaitair Range": [d.p10, d.p90],
      "Werkelijk Range": d.jaar >= 2028 ? [mcDataWerkelijk[i + 1]?.p10, mcDataWerkelijk[i + 1]?.p90] : null,
    }));
  }, [mcDataForfaitair, mcDataWerkelijk, mcPercentile]);

  // Per-year vermogen growth for MC
  const chartMCYear = useMemo(() => {
    const pKey = `p${mcPercentile}`;
    return mcDataForfaitair.slice(1).map((d, i) => ({
      jaar: d.jaar,
      "MC Forfaitair": d[pKey] - mcDataForfaitair[i][pKey],
      "MC Werkelijk": d.jaar >= 2028
        ? mcDataWerkelijk[i + 1]?.[pKey] - mcDataWerkelijk[i]?.[pKey]
        : null,
    }));
  }, [mcDataForfaitair, mcDataWerkelijk, mcPercentile]);

  const chartMCBelCumul = useMemo(() => {
    const pKey = `cumBelP${mcPercentile}`;
    return mcDataForfaitair.slice(1).map((d, i) => ({
      jaar: d.jaar,
      "Belasting Forfaitair": d[pKey],
      "Belasting Werkelijk": d.jaar >= 2028 ? mcDataWerkelijk[i + 1]?.[pKey] : null,
    }));
  }, [mcDataForfaitair, mcDataWerkelijk, mcPercentile]);

  const chartMCBelYear = useMemo(() => {
    const pKey = `belP${mcPercentile}`;
    return mcDataForfaitair.slice(1).map((d, i) => ({
      jaar: d.jaar,
      "Belasting Forfaitair": d[pKey],
      "Belasting Werkelijk": d.jaar >= 2028 ? mcDataWerkelijk[i + 1]?.[pKey] : null,
    }));
  }, [mcDataForfaitair, mcDataWerkelijk, mcPercentile]);

  // Derived values
  const eindF = fMet.data[fMet.data.length - 1];
  const eindW = wMet.data[wMet.data.length - 1];
  const pKey = `p${mcPercentile}`;
  const eindMCF = mcDataForfaitair[mcDataForfaitair.length - 1]?.[pKey];
  const eindMCW = mcDataWerkelijk[mcDataWerkelijk.length - 1]?.[pKey];
  // Generate milestones: show every year up to 10, then use consistent steps
  const MILESTONES = (() => {
    if (jaren <= 10) {
      return Array.from({ length: jaren }, (_, i) => i + 1);
    }
    // Use step of 5 for <= 25 years, step of 10 for longer
    const step = jaren <= 25 ? 5 : 10;
    const points = [];
    for (let y = step; y <= jaren; y += step) {
      points.push(y);
    }
    // Always include final year if not already included
    if (points[points.length - 1] !== jaren) {
      points.push(jaren);
    }
    return points;
  })();

  // Chart line configurations
  const DET_LINES = [
    { k: "Forfaitair", c: CHART_COLORS.forfaitair, d: false },
    { k: "Werkelijk 2028+", c: CHART_COLORS.werkelijk, d: false },
  ];

  const BEL_LINES = [
    { k: "Belasting Forfaitair", c: CHART_COLORS.forfaitair, d: false },
    { k: "Belasting Werkelijk 2028+", c: CHART_COLORS.werkelijk, d: false },
  ];

  const MC_BEL_LINES = [
    { k: "Belasting Forfaitair", c: CHART_COLORS.forfaitair, d: false },
    { k: "Belasting Werkelijk", c: CHART_COLORS.werkelijk, d: false },
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
          forfaitair={advancedMode ? eindMCF : eindF.totaal}
          werkelijk={advancedMode ? eindMCW : eindW.totaal}
          jaren={jaren}
          isMonteCarlo={advancedMode}
          fiscaalPartner={fiscaalPartner}
          setFiscaalPartner={setFiscaalPartner}
        />

        {/* Spaargeld uitgeput warning */}
        {wMet.spaarUitgeputJaar && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <div className="text-sm font-bold text-amber-700 dark:text-amber-400">
                Spaargeld raakt op in {wMet.spaarUitgeputJaar}
              </div>
              <div className="text-sm text-amber-800 dark:text-amber-300/90">
                De berekening na dat jaar is gebaseerd op het verkopen van beleggingen om belasting te betalen.
              </div>
            </div>
          </div>
        )}

        {/* Advanced mode controls */}
        {advancedMode && (
          <div className="bg-white dark:bg-mist-900 rounded-2xl border border-mist-200 dark:border-mist-700 p-4 mb-4 flex flex-col gap-4">
            {/* Row 1: Percentile and chart controls */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Percentile slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-mist-500 dark:text-mist-400">Pessimistisch</span>
                  <input
                    type="range"
                    min={0}
                    max={4}
                    step={1}
                    value={[10, 25, 50, 75, 90].indexOf(mcPercentile)}
                    onChange={(e) => setMcPercentile([10, 25, 50, 75, 90][Number(e.target.value)])}
                    className="w-[100px] cursor-pointer"
                    style={{ accentColor: CHART_COLORS.werkelijk }}
                  />
                  <span className="text-[11px] text-mist-500 dark:text-mist-400">Optimistisch</span>
                </div>
                <span className="text-xs font-semibold text-mist-600 dark:text-mist-300">
                  {mcPercentile === 50 ? "Mediaan" : `P${mcPercentile}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Per jaar / Cumulatief toggle */}
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
                {/* Regenerate button */}
                <button
                  onClick={regenerateMC}
                  title="Genereer nieuwe simulatie"
                  className="py-1 px-2.5 text-xs font-semibold font-sans bg-mist-100 dark:bg-mist-800 text-mist-500 dark:text-mist-400 border border-mist-200 dark:border-mist-700 rounded-md cursor-pointer flex items-center gap-1 hover:bg-mist-200 dark:hover:bg-mist-700 transition-colors"
                >
                  🎲 Nieuwe simulatie
                </button>
              </div>
            </div>
            {/* Row 2: Volatility sliders */}
            <div className="flex items-center gap-6 flex-wrap border-t border-mist-100 dark:border-mist-800 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-mist-500 dark:text-mist-400 w-20">ETF volatiliteit</span>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={Math.round(volEtf * 100)}
                  onChange={(e) => setVolEtf(Number(e.target.value) / 100)}
                  className="w-[80px] cursor-pointer"
                  style={{ accentColor: CHART_COLORS.forfaitair }}
                />
                <span className="text-xs font-semibold text-mist-600 dark:text-mist-300 w-8">{Math.round(volEtf * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-mist-500 dark:text-mist-400 w-24">Crypto volatiliteit</span>
                <input
                  type="range"
                  min={20}
                  max={80}
                  step={5}
                  value={Math.round(volCrypto * 100)}
                  onChange={(e) => setVolCrypto(Number(e.target.value) / 100)}
                  className="w-[80px] cursor-pointer"
                  style={{ accentColor: CHART_COLORS.werkelijk }}
                />
                <span className="text-xs font-semibold text-mist-600 dark:text-mist-300 w-8">{Math.round(volCrypto * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="bg-white dark:bg-mist-900 rounded-2xl border border-mist-200 dark:border-mist-700 overflow-hidden mb-4 shadow-sm">
          {/* Tab bar */}
          <div className="flex border-b border-mist-200 dark:border-mist-700 overflow-x-auto">
            {[
              { k: "vermogen", l: "Vermogen" },
              { k: "belasting", l: "Belasting" },
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
                {/* Per jaar / Cumulatief toggle - only in simple mode */}
                {!advancedMode && (
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
                )}
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={advancedMode ? (showCumulative ? chartMCCumul : chartMCYear) : (showCumulative ? chartVermogenCumul : chartVermogenYear)} margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                    <XAxis dataKey="jaar" stroke={axisLineColor} tick={{ fill: axisTickColor, fontSize: 12 }} />
                    <YAxis stroke={axisLineColor} tick={{ fill: axisTickColor, fontSize: 12 }} tickFormatter={fmtK} width={72} />
                    <Tooltip {...tooltipProps} />
                    {advancedMode ? (
                      <>
                        {showCumulative && (
                          <>
                            <Area
                              type="monotone"
                              dataKey="Forfaitair Range"
                              fill={CHART_COLORS.forfaitair}
                              fillOpacity={0.12}
                              stroke="none"
                            />
                            <Area
                              type="monotone"
                              dataKey="Werkelijk Range"
                              fill={CHART_COLORS.werkelijk}
                              fillOpacity={0.12}
                              stroke="none"
                            />
                          </>
                        )}
                        <Line
                          type="monotone"
                          dataKey="MC Forfaitair"
                          stroke={CHART_COLORS.forfaitair}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="MC Werkelijk"
                          stroke={CHART_COLORS.werkelijk}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                      </>
                    ) : (
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
                  </ComposedChart>
                </ResponsiveContainer>
              </>
            )}

            {activeTab === "belasting" && (
              <>
                {/* Per jaar / Cumulatief toggle - only in simple mode (advanced has it above) */}
                {!advancedMode && (
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
                )}
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={advancedMode ? (showCumulative ? chartMCBelCumul : chartMCBelYear) : (showCumulative ? chartBelCumul : chartBelYear)} margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                    <XAxis dataKey="jaar" stroke={axisLineColor} tick={{ fill: axisTickColor, fontSize: 12 }} />
                    <YAxis stroke={axisLineColor} tick={{ fill: axisTickColor, fontSize: 12 }} tickFormatter={fmtK} width={72} />
                    <Tooltip {...tooltipProps} />
                    {(advancedMode ? MC_BEL_LINES : BEL_LINES).map(({ k, c, d }) => (
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
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="bg-white dark:bg-mist-900 rounded-2xl border border-mist-200 dark:border-mist-700 py-5 px-6 mb-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm font-bold text-mist-950 dark:text-mist-50 mb-1">
              {advancedMode ? "📊 Eenvoudige weergave" : "🎲 Geavanceerde weergave"}
            </div>
            <div className="text-[13px] text-mist-500 dark:text-mist-400">
              {advancedMode
                ? "Vaste rendementen zonder volatiliteit."
                : "Monte Carlo simuleert 1000 scenario's met variërende rendementen."}
            </div>
          </div>
          <button
            onClick={() => setAdvancedMode(!advancedMode)}
            className={clsx(
              "py-2.5 px-5 text-[13px] font-bold font-sans border-none rounded-lg cursor-pointer whitespace-nowrap transition-colors",
              advancedMode
                ? "bg-mist-200 dark:bg-mist-700 text-mist-700 dark:text-mist-200 hover:bg-mist-300 dark:hover:bg-mist-600"
                : "bg-werkelijk text-white hover:opacity-90"
            )}
          >
            {advancedMode ? "Naar eenvoudig" : "Naar geavanceerd"}
          </button>
        </div>

        {/* Milestones table - only in advanced mode */}
        {advancedMode && (
          <div className="bg-white dark:bg-mist-900 rounded-2xl border border-mist-200 dark:border-mist-700 overflow-hidden mb-4 shadow-sm">
            <div className="px-4 py-3 border-b border-mist-200 dark:border-mist-700 text-xs font-extrabold text-accent tracking-widest uppercase">
              Mijlpalen — met bijstorting
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-mist-50 dark:bg-mist-800">
                    {[
                      { label: "Jaar", tooltip: "Kalenderjaar" },
                      { label: "MC Forf.", tooltip: "Monte Carlo mediaan onder forfaitair stelsel (1000 simulaties)" },
                      { label: "MC Werk.", tooltip: "Monte Carlo mediaan onder werkelijk rendement (1000 simulaties)" },
                      { label: "Verschil", tooltip: "Werkelijk minus forfaitair: positief = je houdt meer over onder werkelijk rendement" },
                    ].map((col) => (
                      <TableTooltip
                        key={col.label}
                        label={col.label}
                        tooltip={col.tooltip}
                        className="py-2.5 px-3.5 text-right text-[11px] text-mist-500 dark:text-mist-400 font-bold tracking-wider uppercase whitespace-nowrap cursor-help"
                      />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MILESTONES.map((y, i) => {
                    const mcF = mcDataForfaitair[y];
                    const mcW = mcDataWerkelijk[y];
                    if (!mcF || !mcW) return null;
                    const valF = mcF[pKey];
                    const valW = mcW[pKey];
                    const d = valW - valF;
                    return (
                      <tr
                        key={y}
                        className={clsx(
                          "border-b border-mist-100 dark:border-mist-800",
                          i % 2 ? "bg-transparent" : "bg-mist-50/50 dark:bg-mist-800/30"
                        )}
                      >
                        <td className="py-2.5 px-3.5 text-mist-500 dark:text-mist-400 text-right font-mono">{mcF.jaar}</td>
                        <td className="py-2.5 px-3.5 text-forfaitair font-bold text-right">{fmtK(valF)}</td>
                        <td className="py-2.5 px-3.5 text-werkelijk font-bold text-right">{fmtK(valW)}</td>
                        <td className={clsx(
                          "py-2.5 px-3.5 font-bold text-right",
                          d > 0 ? "text-werkelijk" : d < 0 ? "text-accent" : "text-mist-500 dark:text-mist-400"
                        )}>
                          {d > 0 ? "+" : ""}{fmtK(d)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-mist-500 dark:text-mist-400 leading-loose pb-5">
          * Forfait: 5.88% overige bezittingen, 1.37% spaargeld, heffingsvrij €57.684/persoon (2025 tarieven).
          Werkelijk 2028+: wetsvoorstel bij Eerste Kamer — ongerealiseerde koerswinsten jaarlijks belast à 36%, heffingsvrij ~€1.800 (schatting).
          {advancedMode && " Monte Carlo: normaalverdeling rondom gemiddelden, 1000 simulaties, rendementsfloor −60%."}
          {" "}Pensioenbeleggingen vrijgesteld van box 3. Geen financiëel advies.
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
  fiscaalPartner: PropTypes.bool.isRequired,
  setFiscaalPartner: PropTypes.func.isRequired,
  advancedMode: PropTypes.bool.isRequired,
  setAdvancedMode: PropTypes.func.isRequired,
  mcPercentile: PropTypes.number.isRequired,
  setMcPercentile: PropTypes.func.isRequired,
  volEtf: PropTypes.number.isRequired,
  setVolEtf: PropTypes.func.isRequired,
  volCrypto: PropTypes.number.isRequired,
  setVolCrypto: PropTypes.func.isRequired,
  fMet: PropTypes.object.isRequired,
  wMet: PropTypes.object.isRequired,
  mcDataForfaitair: PropTypes.array.isRequired,
  mcDataWerkelijk: PropTypes.array.isRequired,
  regenerateMC: PropTypes.func.isRequired,
  handleShare: PropTypes.func.isRequired,
  showCopied: PropTypes.bool.isRequired,
  goToInfo: PropTypes.func.isRequired,
  goToWizard: PropTypes.func.isRequired,
  goToLanding: PropTypes.func.isRequired,
  darkMode: PropTypes.string.isRequired,
  setDarkMode: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired,
};
