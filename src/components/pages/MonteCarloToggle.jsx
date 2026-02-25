import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { SCENARIOS } from '../../data/scenarios';

/**
 * Toggle for enabling/disabling Monte Carlo simulation
 * Shows confidence bands (P10-P90) on charts when enabled
 */
export function MonteCarloToggle({ enabled, onToggle, selectedScenario }) {
  const scenario = SCENARIOS[selectedScenario];
  const mcAvailable = scenario?.mcEnabled;

  if (!mcAvailable) {
    return null; // Don't show toggle for scenarios where MC doesn't make sense
  }

  return (
    <div className="mb-5">
      <div
        className={clsx(
          'p-4 rounded-xl border transition-all',
          enabled
            ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800'
            : 'bg-mist-50 dark:bg-mist-900 border-mist-200 dark:border-mist-700'
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🎲</span>
              <h3 className="font-semibold text-base text-mist-950 dark:text-mist-50">
                Monte Carlo simulatie
              </h3>
            </div>
            <p className="text-sm text-mist-600 dark:text-mist-400 mb-2">
              Voeg onzekerheidsmarges toe aan dit scenario door 1.000 simulaties te draaien met
              realistische marktvolatiliteit.
            </p>
            <div className="text-xs text-mist-500 dark:text-mist-400">
              {enabled ? (
                <span className="text-purple-600 dark:text-purple-400 font-semibold">
                  ✓ Grafiek toont P10-P50-P90 banden
                </span>
              ) : (
                <span>
                  Grafieken tonen één lijn voor {scenario.name}
                </span>
              )}
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={onToggle}
            className={clsx(
              'relative inline-flex h-8 w-14 items-center rounded-full transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
              enabled
                ? 'bg-purple-600 dark:bg-purple-500'
                : 'bg-mist-300 dark:bg-mist-700'
            )}
            aria-label="Toggle Monte Carlo simulatie"
          >
            <span
              className={clsx(
                'inline-block h-6 w-6 transform rounded-full bg-white transition-transform',
                enabled ? 'translate-x-7' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Additional info when enabled */}
        {enabled && (
          <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
            <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
              <div>
                <strong>P10 (pessimistisch):</strong> Slechter dan 90% van de simulaties
              </div>
              <div>
                <strong>P50 (mediaan):</strong> Midden van alle simulaties
              </div>
              <div>
                <strong>P90 (optimistisch):</strong> Beter dan 90% van de simulaties
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

MonteCarloToggle.propTypes = {
  enabled: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  selectedScenario: PropTypes.string.isRequired,
};
