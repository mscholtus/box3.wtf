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
 *
 * In deterministic mode: shows exact forfaitair vs werkelijk values with difference
 * In Monte Carlo mode: shows the difference distribution (median + range)
 */
export function OutcomeCard({
  forfaitair,
  werkelijk,
  breakdownF,
  breakdownW,
  jaren,
  isMonteCarlo = false,
  // MC difference data (only used when isMonteCarlo=true)
  diffP10,
  diffP25,
  diffP50,
  diffP75,
  diffP90,
  fiscaalPartner,
  setFiscaalPartner,
}) {
  const [showTooltipF, setShowTooltipF] = useState(false);
  const [showTooltipW, setShowTooltipW] = useState(false);

  // For deterministic mode
  const diff = werkelijk - forfaitair;
  const absDiff = Math.abs(diff);
  const pctChange = forfaitair > 0 ? ((diff / forfaitair) * 100) : 0;
  const werkelijkBetter = diff > 0;

  // For MC mode - use provided difference percentiles
  const mcDiff = diffP50 ?? 0;
  const mcAbsDiff = Math.abs(mcDiff);
  const mcWerkelijkBetter = mcDiff > 0;

  // For the combined bar in deterministic mode
  const maxVal = Math.max(forfaitair, werkelijk);
  const minVal = Math.min(forfaitair, werkelijk);
  const overlapPct = maxVal > 0 ? (minVal / maxVal) * 100 : 0;

  // For MC mode: show range visualization
  const mcMin = diffP10 ?? 0;
  const mcMax = diffP90 ?? 0;
  const mcRange = mcMax - mcMin;
  // Position of median within the range (0-100%)
  const mcMedianPos = mcRange > 0 ? ((mcDiff - mcMin) / mcRange) * 100 : 50;

  return (
    <div className="bg-white dark:bg-mist-900 rounded-2xl p-6 sm:p-7 border border-mist-200 dark:border-mist-700 mb-5 shadow-sm">
      {/* Header with fiscaal partner toggle */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="text-sm font-bold text-mist-500 dark:text-mist-400 tracking-wider uppercase">
          {isMonteCarlo ? "Verschil na" : "Eindvermogen na"} {jaren} jaar
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

      {isMonteCarlo ? (
        /* Monte Carlo mode: show difference distribution */
        <>
          {/* Main difference display */}
          <div className="text-center mb-6">
            <div className="text-xs font-semibold text-mist-500 dark:text-mist-400 uppercase tracking-wide mb-2">
              Werkelijk − Forfaitair (mediaan)
            </div>
            <div className={clsx(
              "text-4xl sm:text-5xl font-black tracking-tight",
              mcWerkelijkBetter ? "text-werkelijk" : "text-accent"
            )}>
              {mcWerkelijkBetter ? "+" : "−"}{fmtK(mcAbsDiff)}
            </div>
            <div className="text-sm text-mist-500 dark:text-mist-400 mt-2">
              {mcWerkelijkBetter ? "meer" : "minder"} eindvermogen met werkelijk rendement
            </div>
          </div>

          {/* Range visualization */}
          <div className="mb-4">
            <div className="h-4 bg-mist-100 dark:bg-mist-800 rounded-full overflow-hidden relative">
              {/* P25-P75 range (inner 50%) */}
              {mcRange > 0 && (
                <div
                  className="absolute top-1 bottom-1 bg-mist-300 dark:bg-mist-600 rounded-full"
                  style={{
                    left: `${((diffP25 - mcMin) / mcRange) * 100}%`,
                    width: `${((diffP75 - diffP25) / mcRange) * 100}%`,
                  }}
                />
              )}
              {/* Median marker */}
              <div
                className={clsx(
                  "absolute top-0 bottom-0 w-1 rounded-full",
                  mcWerkelijkBetter ? "bg-werkelijk" : "bg-accent"
                )}
                style={{ left: `calc(${mcMedianPos}% - 2px)` }}
              />
              {/* Zero line if it's within the range */}
              {mcMin < 0 && mcMax > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-mist-400 dark:bg-mist-500"
                  style={{ left: `${((0 - mcMin) / mcRange) * 100}%` }}
                />
              )}
            </div>
            {/* Range labels */}
            <div className="flex justify-between mt-1.5 text-xs text-mist-500 dark:text-mist-400">
              <span>P10: {mcMin >= 0 ? "+" : ""}{fmtK(mcMin)}</span>
              <span>P90: {mcMax >= 0 ? "+" : ""}{fmtK(mcMax)}</span>
            </div>
          </div>

          {/* Summary */}
          <div className={clsx(
            "p-3.5 rounded-xl text-base font-semibold leading-relaxed",
            mcWerkelijkBetter
              ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400"
              : "bg-amber-50 dark:bg-amber-950/30 text-accent"
          )}>
            {mcWerkelijkBetter
              ? `In de meeste scenario's houd je meer over met werkelijk rendement (mediaan +${fmtK(mcAbsDiff)}).`
              : `In de meeste scenario's betaal je meer met werkelijk rendement (mediaan −${fmtK(mcAbsDiff)}).`
            }
          </div>
        </>
      ) : (
        /* Deterministic mode: show exact values */
        <>
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
        </>
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
  isMonteCarlo: PropTypes.bool,
  // MC difference percentiles
  diffP10: PropTypes.number,
  diffP25: PropTypes.number,
  diffP50: PropTypes.number,
  diffP75: PropTypes.number,
  diffP90: PropTypes.number,
  fiscaalPartner: PropTypes.bool,
  setFiscaalPartner: PropTypes.func,
};
