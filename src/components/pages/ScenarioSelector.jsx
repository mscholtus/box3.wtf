import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { SCENARIOS, getScenarioIds, isCustomizableScenario } from '../../data/scenarios';

/**
 * Scenario selector dropdown for choosing market conditions
 */
export function ScenarioSelector({ selectedScenario, onScenarioChange, onCustomClick }) {
  const scenarioIds = getScenarioIds();

  return (
    <div className="bg-white dark:bg-mist-900 rounded-2xl p-5 border border-mist-200 dark:border-mist-700 mb-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-bold text-mist-500 dark:text-mist-400 tracking-wider uppercase mb-1">
            Marktscenario
          </h3>
          <p className="text-xs text-mist-600 dark:text-mist-400">
            Zie hoe verschillende marktomstandigheden je belasting beïnvloeden
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {scenarioIds.map((id) => {
          const scenario = SCENARIOS[id];
          const isSelected = selectedScenario === id;

          const isCustomizable = isCustomizableScenario(id);

          return (
            <div
              key={id}
              className={clsx(
                'relative rounded-xl border-2 transition-all flex flex-col',
                isSelected
                  ? `${scenario.bgColor} ${scenario.borderColor} shadow-sm`
                  : 'bg-mist-50 dark:bg-mist-800 border-mist-200 dark:border-mist-700'
              )}
            >
              {/* Selection area */}
              <button
                onClick={() => onScenarioChange(id)}
                className={clsx(
                  'w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-werkelijk rounded-t-lg flex-1',
                  !isCustomizable && 'hover:opacity-80 rounded-b-lg'
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className={clsx(
                      'w-5 h-5 rounded-full flex items-center justify-center text-xs',
                      scenario.bgColor,
                      scenario.color
                    )}>
                      ✓
                    </div>
                  </div>
                )}

                <div className="text-2xl mb-2">{scenario.icon}</div>
                <div className={clsx(
                  'font-bold text-sm mb-1',
                  isSelected ? scenario.color : 'text-mist-950 dark:text-mist-50'
                )}>
                  {scenario.name}
                </div>
                <div className={clsx(
                  'text-xs leading-relaxed',
                  isSelected ? 'text-mist-700 dark:text-mist-300' : 'text-mist-600 dark:text-mist-400'
                )}>
                  {scenario.description}
                </div>
              </button>

              {/* Settings button for customizable scenarios */}
              {isCustomizable && (
                <button
                  onClick={onCustomClick}
                  className={clsx(
                    'w-full py-1.5 px-4 text-xs font-semibold transition-colors border-t',
                    'border-mist-300 dark:border-mist-600',
                    'bg-white dark:bg-mist-800 text-mist-700 dark:text-mist-300',
                    'hover:bg-mist-100 dark:hover:bg-mist-700',
                    'rounded-b-lg'
                  )}
                >
                  ⚙️ Instellen
                </button>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

ScenarioSelector.propTypes = {
  selectedScenario: PropTypes.string.isRequired,
  onScenarioChange: PropTypes.func.isRequired,
  onCustomClick: PropTypes.func.isRequired,
};
