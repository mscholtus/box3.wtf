import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { formatCompact } from '../../utils/format';

const fmtK = formatCompact;

/**
 * Hero outcome card showing the comparison between forfaitair and werkelijk
 * with a single progress bar visualizing the difference
 */
export function OutcomeCard({
  forfaitair,
  werkelijk,
  jaren,
  isMonteCarlo = false,
  fiscaalPartner,
  setFiscaalPartner,
}) {
  const diff = forfaitair - werkelijk;
  const absDiff = Math.abs(diff);
  const pctChange = forfaitair > 0 ? ((diff / forfaitair) * 100) : 0;
  const werkelijkBetter = diff < 0;

  // For the combined bar: show overlap + difference
  const maxVal = Math.max(forfaitair, werkelijk);
  const minVal = Math.min(forfaitair, werkelijk);
  const overlapPct = maxVal > 0 ? (minVal / maxVal) * 100 : 0;

  return (
    <div className="bg-white dark:bg-mist-900 rounded-2xl p-6 sm:p-7 border border-mist-200 dark:border-mist-700 mb-5 shadow-sm">
      {/* Header with fiscaal partner toggle */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="text-sm font-bold text-mist-500 dark:text-mist-400 tracking-wider uppercase">
          Eindvermogen na {jaren} jaar
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
        <div>
          <div className="text-xs font-semibold text-forfaitair uppercase tracking-wide mb-1">
            {isMonteCarlo ? `Forfaitair (mediaan)` : "Forfaitair"}
          </div>
          <div className="text-3xl font-black text-mist-950 dark:text-mist-50 tracking-tight">
            {fmtK(forfaitair)}
          </div>
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
        <div className="text-right">
          <div className="text-xs font-semibold text-werkelijk uppercase tracking-wide mb-1">
            {isMonteCarlo ? `Werkelijk (mediaan)` : "Werkelijk"}
          </div>
          <div className="text-3xl font-black text-mist-950 dark:text-mist-50 tracking-tight">
            {fmtK(werkelijk)}
          </div>
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
    </div>
  );
}

OutcomeCard.propTypes = {
  forfaitair: PropTypes.number.isRequired,
  werkelijk: PropTypes.number.isRequired,
  jaren: PropTypes.number.isRequired,
  isMonteCarlo: PropTypes.bool,
  fiscaalPartner: PropTypes.bool,
  setFiscaalPartner: PropTypes.func,
};
