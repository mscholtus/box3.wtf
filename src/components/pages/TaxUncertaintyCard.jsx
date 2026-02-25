import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { formatCompact, formatCurrency } from '../../utils/format';

/**
 * Card showing tax bill uncertainty across different scenarios
 */
export function TaxUncertaintyCard({ scenarioResults, jaren }) {
  if (!scenarioResults || Object.keys(scenarioResults).length === 0) {
    return null;
  }

  // Extract final year total tax from each scenario
  const taxByScenario = Object.entries(scenarioResults).map(([id, result]) => {
    const finalYear = result.werkelijk.data[jaren];
    return {
      id,
      name: result.name,
      icon: result.icon,
      color: result.color,
      totalTax: finalYear.cumulBelasting,
      // Show tax difference vs forfaitair
      forfaitairTax: result.forfaitair.data[jaren].cumulBelasting,
    };
  });

  // Sort by total tax (low to high)
  taxByScenario.sort((a, b) => a.totalTax - b.totalTax);

  const minTax = taxByScenario[0].totalTax;
  const maxTax = taxByScenario[taxByScenario.length - 1].totalTax;
  const range = maxTax - minTax;

  return (
    <div className="bg-white dark:bg-mist-900 rounded-2xl p-6 border border-mist-200 dark:border-mist-700 mb-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-mist-500 dark:text-mist-400 tracking-wider uppercase mb-2">
          Onzekerheid belastingbedrag
        </h3>
        <p className="text-sm text-mist-700 dark:text-mist-300 leading-relaxed">
          Totale belasting na {jaren} jaar onder werkelijk rendement, afhankelijk van marktscenario:
        </p>
      </div>

      {/* Range visualization */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-black text-green-600 dark:text-green-400">
            {formatCompact(minTax)}
          </span>
          <span className="text-sm font-semibold text-mist-500 dark:text-mist-400">
            Bereik: {formatCompact(range)}
          </span>
          <span className="text-2xl font-black text-red-600 dark:text-red-400">
            {formatCompact(maxTax)}
          </span>
        </div>

        <div className="relative h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full">
          {/* Min marker */}
          <div className="absolute left-0 top-full mt-1 text-[10px] text-mist-500 dark:text-mist-400">
            {taxByScenario[0].icon} {taxByScenario[0].name}
          </div>
          {/* Max marker */}
          <div className="absolute right-0 top-full mt-1 text-[10px] text-mist-500 dark:text-mist-400 text-right">
            {taxByScenario[taxByScenario.length - 1].icon} {taxByScenario[taxByScenario.length - 1].name}
          </div>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="space-y-2.5">
        {taxByScenario.map((scenario) => {
          const diff = scenario.totalTax - scenario.forfaitairTax;
          const pct = maxTax > 0 ? (scenario.totalTax / maxTax) * 100 : 0;

          return (
            <div key={scenario.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{scenario.icon}</span>
                  <span className="font-semibold text-mist-950 dark:text-mist-50">
                    {scenario.name}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-mist-950 dark:text-mist-50">
                    {formatCompact(scenario.totalTax)}
                  </span>
                  <span className={clsx(
                    'text-xs font-semibold',
                    diff > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  )}>
                    ({diff > 0 ? '+' : ''}{formatCompact(diff)})
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-mist-200 dark:bg-mist-800 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all',
                    scenario.totalTax > scenario.forfaitairTax
                      ? 'bg-red-500'
                      : 'bg-green-500'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Key insight */}
      <div className={clsx(
        'mt-5 p-4 rounded-xl border',
        'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
      )}>
        <div className="font-bold text-base text-amber-900 dark:text-amber-200 mb-2">
          Je weet dit pas achteraf
        </div>
        <div className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
          Bij het begin van het jaar weet je niet welk scenario zich zal voordoen.
          Je belastingbedrag hangt volledig af van marktbewegingen die je niet kunt voorspellen.
          Dit maakt budgetteren voor belasting onmogelijk.
        </div>
      </div>
    </div>
  );
}

TaxUncertaintyCard.propTypes = {
  scenarioResults: PropTypes.objectOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      forfaitair: PropTypes.object.isRequired,
      werkelijk: PropTypes.object.isRequired,
    })
  ),
  jaren: PropTypes.number.isRequired,
};
