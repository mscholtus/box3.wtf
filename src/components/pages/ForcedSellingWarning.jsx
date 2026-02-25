import { useState } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { formatCompact } from '../../utils/format';
import { analyzeForcedSellingAcrossScenarios } from '../../utils/forcedSelling';

/**
 * Warning card showing forced selling scenarios
 */
export function ForcedSellingWarning({ scenarioResults, selectedScenario }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!scenarioResults || Object.keys(scenarioResults).length === 0) {
    return null;
  }

  const analysis = analyzeForcedSellingAcrossScenarios(scenarioResults);
  const currentAnalysis = analysis.scenarios[selectedScenario];

  // Don't show if current scenario has no forced selling
  if (!currentAnalysis?.hasForcedSelling) {
    return null;
  }

  const { yearsAffected, years, totalSold, largestShortfall, largestShortfallYear, name, icon } = currentAnalysis;

  return (
    <div className={clsx(
      'mb-5 rounded-2xl border',
      'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
    )}>
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <div className="font-bold text-base text-blue-700 dark:text-blue-400 mb-1">
              Beleggingen verkopen nodig
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
              In het scenario <span className="font-semibold">{icon} {name}</span> is
              in <span className="font-bold">{yearsAffected} {yearsAffected === 1 ? 'jaar' : 'jaar'}</span> je
              spaargeld en jaarlijkse inleg niet voldoende om de belasting te betalen. Dan moet je beleggingen verkopen.
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
              Totaal verkocht
            </div>
            <div className="text-xl font-black text-blue-700 dark:text-blue-300">
              {formatCompact(totalSold)}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
              Grootste tekort
            </div>
            <div className="text-xl font-black text-blue-700 dark:text-blue-300">
              {formatCompact(largestShortfall)}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              in {largestShortfallYear}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
              Jaren getroffen
            </div>
            <div className="text-xl font-black text-blue-700 dark:text-blue-300">
              {yearsAffected}
            </div>
          </div>
        </div>

        {/* Impact explanation */}
        <div className={clsx(
          'p-3.5 rounded-lg mb-3',
          'bg-mist-100 dark:bg-mist-800'
        )}>
          <div className="text-sm text-mist-700 dark:text-mist-300 leading-relaxed">
            <span className="font-bold">Oplossingen:</span> Spaar meer per jaar om je belastingverplichtingen
            te dekken, of leg minder in zodat je meer spaargeld overhoudt. Als verkopen onvermijdelijk is,
            let dan op transactiekosten en timing.
          </div>
        </div>

        {/* Toggle details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={clsx(
            'w-full text-sm font-semibold py-2 px-3 rounded-lg transition-colors',
            'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300',
            'hover:bg-blue-200 dark:hover:bg-blue-900/70'
          )}
        >
          {showDetails ? '▼ Verberg details' : '▶ Toon jaar-voor-jaar details'}
        </button>
      </div>

      {/* Year-by-year breakdown */}
      {showDetails && (
        <div className="border-t border-blue-200 dark:border-blue-800 p-5 bg-blue-100/50 dark:bg-blue-900/20">
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
            Jaar-voor-jaar overzicht
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-blue-200 dark:border-blue-800">
                  <th className="text-left py-2 px-2 font-semibold text-blue-700 dark:text-blue-400">Jaar</th>
                  <th className="text-right py-2 px-2 font-semibold text-blue-700 dark:text-blue-400">Belasting</th>
                  <th className="text-right py-2 px-2 font-semibold text-blue-700 dark:text-blue-400">Uit spaargeld</th>
                  <th className="text-right py-2 px-2 font-semibold text-blue-700 dark:text-blue-400">Uit inleg</th>
                  <th className="text-right py-2 px-2 font-semibold text-blue-700 dark:text-blue-400">Verkocht</th>
                </tr>
              </thead>
              <tbody>
                {years.map(({ jaar, amount, totalTax, availableFromSpaar, availableFromContributions }) => (
                  <tr key={jaar} className="border-b border-blue-100 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                    <td className="py-2 px-2 font-semibold text-blue-700 dark:text-blue-400">{jaar}</td>
                    <td className="py-2 px-2 text-right text-mist-700 dark:text-mist-300">{formatCompact(totalTax)}</td>
                    <td className="py-2 px-2 text-right text-mist-700 dark:text-mist-300">{formatCompact(availableFromSpaar)}</td>
                    <td className="py-2 px-2 text-right text-mist-700 dark:text-mist-300">{formatCompact(availableFromContributions)}</td>
                    <td className="py-2 px-2 text-right font-bold text-blue-700 dark:text-blue-300">{formatCompact(amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

ForcedSellingWarning.propTypes = {
  scenarioResults: PropTypes.objectOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      werkelijk: PropTypes.object.isRequired,
    })
  ),
  selectedScenario: PropTypes.string.isRequired,
};
