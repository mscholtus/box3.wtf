import PropTypes from 'prop-types';
import { clsx } from 'clsx';

/**
 * Toggle to enable/disable Monte Carlo uncertainty visualization
 */
export function MonteCarloToggle({ enabled, onToggle, hasData }) {
  return (
    <div className="bg-white dark:bg-mist-900 rounded-2xl p-5 border border-mist-200 dark:border-mist-700 mb-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-mist-500 dark:text-mist-400 tracking-wider uppercase mb-2">
            📊 Onzekerheid tonen
          </h3>
          <p className="text-sm text-mist-700 dark:text-mist-300 leading-relaxed mb-3">
            Schakel Monte Carlo simulatie in om een bereik van mogelijke uitkomsten te zien in plaats van één enkel scenario.
            Dit geeft een realistischer beeld van de onvoorspelbaarheid van werkelijk rendement.
          </p>
          {!hasData && (
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              ⚠️ Monte Carlo simulatie is nog niet beschikbaar. Deze functie wordt binnenkort toegevoegd.
            </p>
          )}
        </div>

        <button
          onClick={onToggle}
          disabled={!hasData}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold',
            'border transition-colors',
            enabled
              ? 'bg-werkelijk/10 border-werkelijk/30 text-werkelijk'
              : 'bg-mist-100 dark:bg-mist-800 border-mist-200 dark:border-mist-700 text-mist-600 dark:text-mist-400',
            !hasData && 'opacity-50 cursor-not-allowed',
            hasData && 'cursor-pointer hover:border-werkelijk/50'
          )}
        >
          <span className={clsx(
            'w-10 h-5 rounded-full relative transition-colors',
            enabled ? 'bg-werkelijk' : 'bg-mist-300 dark:bg-mist-600'
          )}>
            <span
              className={clsx(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all',
                enabled ? 'left-[22px]' : 'left-0.5'
              )}
            />
          </span>
          <span>{enabled ? 'Aan' : 'Uit'}</span>
        </button>
      </div>

      {enabled && hasData && (
        <div className={clsx(
          'mt-4 p-3.5 rounded-xl',
          'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
        )}>
          <div className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
            <span className="font-bold">Grafiekweergave:</span> De grafieken tonen nu banden met
            percentielwaarden (P10, P25, P50, P75, P90) uit 1000 simulaties. Hoe breder de band,
            hoe onzekerder de uitkomst.
          </div>
        </div>
      )}
    </div>
  );
}

MonteCarloToggle.propTypes = {
  enabled: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  hasData: PropTypes.bool,
};

MonteCarloToggle.defaultProps = {
  hasData: false,
};
