import { useState } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { TaxUncertaintyCard } from './TaxUncertaintyCard';
import { CashBufferCard } from './CashBufferCard';
import { ForcedSellingWarning } from './ForcedSellingWarning';

/**
 * Collapsible advanced insights section
 */
export function AdvancedInsights({ scenarioResults, selectedScenario, startSpaar, bijSpaar, jaren }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          'w-full p-4 rounded-xl border transition-all text-left',
          'bg-mist-50 dark:bg-mist-900 border-mist-200 dark:border-mist-700',
          'hover:bg-mist-100 dark:hover:bg-mist-800'
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-base text-mist-700 dark:text-mist-300 mb-1">
              {isExpanded ? '▼' : '▶'} Geavanceerde analyse
            </div>
            <div className="text-sm text-mist-600 dark:text-mist-400">
              Bekijk gedetailleerde impact: cash buffer, gedwongen verkoop, en belastingonzekerheid
            </div>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-5 space-y-5">
          {/* Tax Uncertainty */}
          <TaxUncertaintyCard
            scenarioResults={scenarioResults}
            jaren={jaren}
          />

          {/* Cash Buffer */}
          <CashBufferCard
            scenarioResults={scenarioResults}
            startSpaar={startSpaar}
            bijSpaar={bijSpaar}
            selectedScenario={selectedScenario}
          />

          {/* Forced Selling */}
          <ForcedSellingWarning
            scenarioResults={scenarioResults}
            selectedScenario={selectedScenario}
          />
        </div>
      )}
    </div>
  );
}

AdvancedInsights.propTypes = {
  scenarioResults: PropTypes.object.isRequired,
  selectedScenario: PropTypes.string.isRequired,
  startSpaar: PropTypes.number.isRequired,
  bijSpaar: PropTypes.number.isRequired,
  jaren: PropTypes.number.isRequired,
};
