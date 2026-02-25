import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { formatCompact, formatCurrency } from '../../utils/format';
import { analyzeBufferAcrossScenarios } from '../../utils/cashBuffer';

/**
 * Card showing cash buffer requirements to avoid forced selling
 */
export function CashBufferCard({ scenarioResults, startSpaar, bijSpaar, selectedScenario }) {
  if (!scenarioResults || Object.keys(scenarioResults).length === 0) {
    return null;
  }

  const analysis = analyzeBufferAcrossScenarios(scenarioResults, startSpaar);
  const {
    maxBufferNeeded,
    worstScenario,
    scenariosWithDepletion,
    totalScenarios,
    opportunityCost,
    jaren,
    scenarios,
  } = analysis;

  const worstScenarioData = scenarios[worstScenario];
  const currentScenarioData = scenarios[selectedScenario];

  // Calculate annual savings needed vs actual
  const annualSavingsNeeded = currentScenarioData?.maxAnnualTax || 0;
  const savingsShortfall = Math.max(0, annualSavingsNeeded - bijSpaar);
  const hasSufficientSavings = bijSpaar >= annualSavingsNeeded;

  return (
    <div className="bg-white dark:bg-mist-900 rounded-2xl p-6 border border-mist-200 dark:border-mist-700 mb-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-mist-500 dark:text-mist-400 tracking-wider uppercase mb-2">
          💰 Sparen voor belasting
        </h3>
        <p className="text-sm text-mist-700 dark:text-mist-300 leading-relaxed">
          Scenario: {currentScenarioData?.icon} {currentScenarioData?.name}
        </p>
      </div>

      {/* Savings vs Tax comparison */}
      <div className={clsx(
        'mb-5 p-5 rounded-xl border-2',
        hasSufficientSavings
          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
      )}>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs font-semibold text-mist-600 dark:text-mist-400 uppercase tracking-wide mb-1">
              Je spaart per jaar
            </div>
            <div className="text-2xl font-black text-mist-950 dark:text-mist-50">
              {formatCompact(bijSpaar)}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-mist-600 dark:text-mist-400 uppercase tracking-wide mb-1">
              Max belasting per jaar
            </div>
            <div className={clsx(
              "text-2xl font-black",
              hasSufficientSavings ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"
            )}>
              {formatCompact(annualSavingsNeeded)}
            </div>
          </div>
        </div>

        {hasSufficientSavings ? (
          <div className="text-sm text-green-800 dark:text-green-300 leading-relaxed">
            ✓ Je spaart <span className="font-bold">voldoende</span> om je belastingverplichtingen te dekken in dit scenario.
            Let op: dit spaargeld moet beschikbaar blijven en kun je niet aan andere doelen (vakantie, etc.) uitgeven.
          </div>
        ) : (
          <div className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            ⚠️ Je spaart <span className="font-bold">te weinig</span>. Je moet <span className="font-bold">{formatCompact(savingsShortfall)} meer per jaar</span> sparen
            om je belasting uit spaargeld te kunnen betalen zonder beleggingen te verkopen.
          </div>
        )}
      </div>

      {/* Scenario breakdown */}
      <div className="mb-4">
        <div className="text-xs font-bold text-mist-500 dark:text-mist-400 uppercase tracking-wide mb-3">
          Buffer per scenario
        </div>
        <div className="space-y-2">
          {Object.entries(scenarios)
            .sort((a, b) => b[1].recommendedBuffer - a[1].recommendedBuffer)
            .map(([id, data]) => {
              const pct = maxBufferNeeded > 0 ? (data.recommendedBuffer / maxBufferNeeded) * 100 : 0;

              return (
                <div key={id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{data.icon}</span>
                      <span className="font-semibold text-mist-950 dark:text-mist-50">
                        {data.name}
                      </span>
                      {data.spaarUitgeput && (
                        <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
                          ⚠️ Spaar raakt op
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-mist-950 dark:text-mist-50">
                        {formatCompact(data.recommendedBuffer)}
                      </span>
                      <span className="text-xs text-mist-600 dark:text-mist-400">
                        ({data.yearsWithTax} jaar met belasting)
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-mist-200 dark:bg-mist-800 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        data.spaarUitgeput ? 'bg-red-500' : 'bg-blue-500'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Warning if savings depleted in some scenarios */}
      {scenariosWithDepletion > 0 && (
        <div className={clsx(
          'p-4 rounded-xl border',
          'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
        )}>
          <div className="font-bold text-base text-red-700 dark:text-red-400 mb-2">
            ⚠️ Buffer niet altijd voldoende
          </div>
          <div className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
            In {scenariosWithDepletion} van de {totalScenarios} scenario's raakt je spaargeld op,
            ondanks de aanbevolen buffer. In die gevallen moet je beleggingen verkopen of
            minder inleggen om belasting te betalen.
          </div>
        </div>
      )}

      {/* Key insight */}
      <div className={clsx(
        'mt-5 p-4 rounded-xl border',
        'bg-mist-50 dark:bg-mist-800 border-mist-200 dark:border-mist-700'
      )}>
        <div className="font-bold text-base text-mist-900 dark:text-mist-200 mb-2">
          De cash trap
        </div>
        <div className="text-sm text-mist-700 dark:text-mist-300 leading-relaxed">
          Om niet gedwongen te hoeven verkopen, moet je geld cash houden dat je niet kunt beleggen.
          Dit kost je op lange termijn vermogen ({formatCompact(opportunityCost)} gemiste groei),
          maar ook met deze buffer kun je in extreme jaren nog steeds gedwongen worden te verkopen.
        </div>
      </div>
    </div>
  );
}

CashBufferCard.propTypes = {
  scenarioResults: PropTypes.objectOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      werkelijk: PropTypes.object.isRequired,
    })
  ),
  startSpaar: PropTypes.number.isRequired,
  bijSpaar: PropTypes.number.isRequired,
  selectedScenario: PropTypes.string.isRequired,
};
