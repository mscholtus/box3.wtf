import { useState } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { formatCompact } from '../../utils/format';

const fmtK = formatCompact;

/**
 * Tooltip showing asset breakdown
 */
function BreakdownTooltip({ breakdown, position }) {
  if (!breakdown) return null;

  const items = [
    { label: "ETF/aandelen", value: breakdown.etf, color: "bg-blue-500" },
    { label: "Crypto", value: breakdown.crypto, color: "bg-purple-500" },
    { label: "Spaargeld", value: breakdown.spaar, color: "bg-yellow-500" },
    { label: "Pensioen", value: breakdown.pensioen, color: "bg-green-500" },
  ].filter(item => item.value > 0);

  return (
    <div
      className={clsx(
        "absolute z-50 bg-white dark:bg-mist-800 rounded-xl shadow-lg border border-mist-200 dark:border-mist-700 p-3 min-w-[160px]",
        position === "left" ? "right-0" : "left-0",
        "top-full mt-2"
      )}
    >
      <div className="text-[10px] font-bold text-mist-500 dark:text-mist-400 uppercase tracking-wide mb-2">
        Samenstelling
      </div>
      <div className="space-y-1.5">
        {items.map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <div className={clsx("w-2 h-2 rounded-sm", color)} />
              <span className="text-xs text-mist-600 dark:text-mist-300">{label}</span>
            </div>
            <span className="text-xs font-bold text-mist-950 dark:text-mist-50">{fmtK(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

BreakdownTooltip.propTypes = {
  breakdown: PropTypes.shape({
    etf: PropTypes.number,
    crypto: PropTypes.number,
    spaar: PropTypes.number,
    pensioen: PropTypes.number,
  }),
  position: PropTypes.oneOf(["left", "right"]),
};

/**
 * Hero outcome card showing the comparison between forfaitair and werkelijk
 */
export function OutcomeCard({
  forfaitair,
  werkelijk,
  breakdownF,
  breakdownW,
  jaren,
  fiscaalPartner,
  setFiscaalPartner,
  scenarioName,
  mcEnabled = false,
  mcUncertainty = null,
}) {
  const [showTooltipF, setShowTooltipF] = useState(false);
  const [showTooltipW, setShowTooltipW] = useState(false);

  const diff = werkelijk - forfaitair;
  const absDiff = Math.abs(diff);
  const pctChange = forfaitair > 0 ? ((diff / forfaitair) * 100) : 0;
  const werkelijkBetter = diff > 0;

  // For the combined bar
  const maxVal = Math.max(forfaitair, werkelijk);
  const minVal = Math.min(forfaitair, werkelijk);
  const overlapPct = maxVal > 0 ? (minVal / maxVal) * 100 : 0;

  return (
    <div className="bg-white dark:bg-mist-900 rounded-2xl p-6 sm:p-7 border border-mist-200 dark:border-mist-700 mb-5 shadow-sm">
      {/* Header with fiscaal partner toggle */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-sm font-bold text-mist-500 dark:text-mist-400 tracking-wider uppercase">
            Eindvermogen na {jaren} jaar
          </div>
          {scenarioName && (
            <div className="text-xs text-mist-600 dark:text-mist-400 mt-1">
              Scenario: {scenarioName}
            </div>
          )}
        </div>

        {/* Fiscaal partner toggle */}
        {setFiscaalPartner && (
          <button
            onClick={() => setFiscaalPartner(!fiscaalPartner)}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold",
              "border transition-colors cursor-pointer",
              fiscaalPartner
                ? "bg-werkelijk/10 border-werkelijk/30 text-werkelijk"
                : "bg-mist-100 dark:bg-mist-800 border-mist-200 dark:border-mist-700 text-mist-600 dark:text-mist-400"
            )}
          >
            <span className={clsx(
              "w-8 h-4 rounded-full relative transition-colors",
              fiscaalPartner ? "bg-werkelijk" : "bg-mist-300 dark:bg-mist-600"
            )}>
              <span
                className={clsx(
                  "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                  fiscaalPartner ? "left-[18px]" : "left-0.5"
                )}
              />
            </span>
            <span>Fiscaal partner</span>
          </button>
        )}
      </div>

      {/* Main stats row */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        {/* Forfaitair value */}
        <div
          className="relative cursor-help"
          onMouseEnter={() => setShowTooltipF(true)}
          onMouseLeave={() => setShowTooltipF(false)}
        >
          <div className="text-xs font-semibold text-forfaitair uppercase tracking-wide mb-1">
            Forfaitair
          </div>
          <div className="text-3xl font-black text-mist-950 dark:text-mist-50 tracking-tight flex items-center gap-1.5">
            {fmtK(forfaitair)}
            {breakdownF && <span className="text-mist-400 dark:text-mist-500 text-sm">ⓘ</span>}
          </div>
          {showTooltipF && <BreakdownTooltip breakdown={breakdownF} position="right" />}
        </div>

        {/* Difference indicator */}
        <div className="flex items-baseline gap-1.5 pb-1">
          <span className={clsx(
            "text-2xl font-extrabold tracking-tight",
            werkelijkBetter ? "text-werkelijk" : "text-accent"
          )}>
            {werkelijkBetter ? "+" : "−"}{fmtK(absDiff)}
          </span>
          <span className={clsx(
            "text-sm font-semibold opacity-70",
            werkelijkBetter ? "text-werkelijk" : "text-accent"
          )}>
            ({werkelijkBetter ? "+" : "−"}{Math.abs(pctChange).toFixed(1)}%)
          </span>
        </div>

        {/* Werkelijk value */}
        <div
          className="relative cursor-help text-right"
          onMouseEnter={() => setShowTooltipW(true)}
          onMouseLeave={() => setShowTooltipW(false)}
        >
          <div className="text-xs font-semibold text-werkelijk uppercase tracking-wide mb-1">
            Werkelijk
          </div>
          <div className="text-3xl font-black text-mist-950 dark:text-mist-50 tracking-tight flex items-center justify-end gap-1.5">
            {breakdownW && <span className="text-mist-400 dark:text-mist-500 text-sm">ⓘ</span>}
            {fmtK(werkelijk)}
          </div>
          {showTooltipW && <BreakdownTooltip breakdown={breakdownW} position="left" />}
        </div>
      </div>

      {/* Combined progress bar */}
      <div className="h-3 bg-mist-200 dark:bg-mist-800 rounded-md overflow-hidden relative">
        {/* Full bar (the larger value) */}
        <div
          className={clsx(
            "absolute inset-0 rounded-md",
            werkelijkBetter ? "bg-werkelijk" : "bg-forfaitair"
          )}
        />
        {/* Overlap bar (the smaller value) */}
        <div
          className={clsx(
            "absolute left-0 top-0 h-full rounded-md",
            werkelijkBetter ? "bg-forfaitair" : "bg-werkelijk"
          )}
          style={{ width: `${overlapPct}%` }}
        />
      </div>

      {/* Labels below bar */}
      <div className="flex justify-between mt-2 text-xs text-mist-500 dark:text-mist-400">
        <span>€0</span>
        <span>{fmtK(maxVal)}</span>
      </div>

      {/* Summary */}
      <div className={clsx(
        "mt-4 p-3.5 rounded-xl text-base font-semibold leading-relaxed",
        werkelijkBetter
          ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400"
          : "bg-amber-50 dark:bg-amber-950/30 text-accent"
      )}>
        {werkelijkBetter
          ? `Je houdt ${fmtK(absDiff)} meer over onder het werkelijke stelsel.`
          : `Je betaalt ${fmtK(absDiff)} meer belasting onder het werkelijke stelsel.`
        }
      </div>

      {/* Monte Carlo uncertainty ranges */}
      {mcEnabled && mcUncertainty && (
        <div className="mt-4 p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/30">
          <div className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-2.5">
            📊 Onzekerheidsmarges (Monte Carlo)
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="font-semibold text-forfaitair mb-1">Forfaitair</div>
              <div className="text-mist-600 dark:text-mist-400 space-y-0.5">
                <div>P10: {fmtK(mcUncertainty.forfaitairP10)}</div>
                <div className="font-semibold text-mist-950 dark:text-mist-50">P50: {fmtK(mcUncertainty.forfaitairP50)}</div>
                <div>P90: {fmtK(mcUncertainty.forfaitairP90)}</div>
              </div>
            </div>
            <div>
              <div className="font-semibold text-werkelijk mb-1">Werkelijk</div>
              <div className="text-mist-600 dark:text-mist-400 space-y-0.5">
                <div>P10: {fmtK(mcUncertainty.werkelijkP10)}</div>
                <div className="font-semibold text-mist-950 dark:text-mist-50">P50: {fmtK(mcUncertainty.werkelijkP50)}</div>
                <div>P90: {fmtK(mcUncertainty.werkelijkP90)}</div>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-purple-600 dark:text-purple-400">
            Bovenstaande waarden tonen het mediaan (P50) resultaat. P10 en P90 geven de onzekerheidsmarges aan.
          </div>
        </div>
      )}
    </div>
  );
}

const breakdownShape = PropTypes.shape({
  etf: PropTypes.number,
  crypto: PropTypes.number,
  spaar: PropTypes.number,
  pensioen: PropTypes.number,
});

OutcomeCard.propTypes = {
  forfaitair: PropTypes.number.isRequired,
  werkelijk: PropTypes.number.isRequired,
  breakdownF: breakdownShape,
  breakdownW: breakdownShape,
  jaren: PropTypes.number.isRequired,
  fiscaalPartner: PropTypes.bool,
  setFiscaalPartner: PropTypes.func,
  scenarioName: PropTypes.string,
  mcEnabled: PropTypes.bool,
  mcUncertainty: PropTypes.shape({
    forfaitairP10: PropTypes.number,
    forfaitairP50: PropTypes.number,
    forfaitairP90: PropTypes.number,
    werkelijkP10: PropTypes.number,
    werkelijkP50: PropTypes.number,
    werkelijkP90: PropTypes.number,
  }),
};
