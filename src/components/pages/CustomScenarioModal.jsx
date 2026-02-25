import { useState } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';

/**
 * Simple percentage input component
 */
function PercentInput({ value, onChange, min, max, step }) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className={clsx(
          "w-full box-border py-2 pr-8 pl-3",
          "bg-mist-100 dark:bg-mist-800",
          "border border-mist-300 dark:border-mist-700",
          "rounded-lg",
          "text-mist-950 dark:text-mist-50",
          "text-base font-sans",
          "outline-none",
          "transition-colors duration-150",
          "focus:border-accent dark:focus:border-accent"
        )}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-mist-500 dark:text-mist-400 text-sm pointer-events-none">
        %
      </span>
    </div>
  );
}

PercentInput.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
};

/**
 * Modal for creating custom scenario with user-defined returns
 */
export function CustomScenarioModal({ isOpen, onClose, onSave, defaultReturns }) {
  const [etfReturn, setEtfReturn] = useState(Math.round(defaultReturns.etf * 100 * 10) / 10);
  const [cryptoReturn, setCryptoReturn] = useState(Math.round(defaultReturns.crypto * 100 * 10) / 10);
  const [spaarReturn, setSpaarReturn] = useState(Math.round(defaultReturns.spaar * 100 * 10) / 10);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      etf: etfReturn / 100,
      crypto: cryptoReturn / 100,
      spaar: spaarReturn / 100,
    });
    onClose();
  };

  const handleReset = () => {
    setEtfReturn(Math.round(defaultReturns.etf * 100 * 10) / 10);
    setCryptoReturn(Math.round(defaultReturns.crypto * 100 * 10) / 10);
    setSpaarReturn(Math.round(defaultReturns.spaar * 100 * 10) / 10);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-mist-900 rounded-2xl shadow-xl max-w-lg w-full border-2 border-mist-300 dark:border-mist-700">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-mist-950 dark:text-mist-50">
                ⚙️ Vast rendement instellen
              </h2>
              <p className="text-xs text-mist-600 dark:text-mist-400 mt-1">
                Stel constante rendementen in voor alle jaren
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-mist-500 hover:text-mist-700 dark:hover:text-mist-300 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 mb-5">
            {/* Rendementen in grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* ETF/Aandelen */}
              <div>
                <label className="block text-xs font-semibold text-mist-700 dark:text-mist-300 mb-1.5">
                  📈 ETF/Aandelen
                </label>
                <PercentInput
                  value={etfReturn}
                  onChange={setEtfReturn}
                  min={-50}
                  max={50}
                  step={0.5}
                />
                <p className="text-[10px] text-mist-600 dark:text-mist-400 mt-1">
                  ~7% gemiddeld
                </p>
              </div>

              {/* Crypto */}
              <div>
                <label className="block text-xs font-semibold text-mist-700 dark:text-mist-300 mb-1.5">
                  🪙 Crypto
                </label>
                <PercentInput
                  value={cryptoReturn}
                  onChange={setCryptoReturn}
                  min={-80}
                  max={100}
                  step={1}
                />
                <p className="text-[10px] text-mist-600 dark:text-mist-400 mt-1">
                  Hoge volatiliteit
                </p>
              </div>

              {/* Spaargeld */}
              <div>
                <label className="block text-xs font-semibold text-mist-700 dark:text-mist-300 mb-1.5">
                  💶 Spaarrente
                </label>
                <PercentInput
                  value={spaarReturn}
                  onChange={setSpaarReturn}
                  min={0}
                  max={10}
                  step={0.1}
                />
                <p className="text-[10px] text-mist-600 dark:text-mist-400 mt-1">
                  ~2.5% nu
                </p>
              </div>
            </div>
          </div>

          {/* Info message */}
          <div className={clsx(
            'mb-4 p-2.5 rounded-lg text-xs',
            'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
          )}>
            💡 Deze rendementen worden constant toegepast. Voor variabele rendementen, gebruik Bull, Crash of Volatiel.
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5">
            <button
              onClick={handleReset}
              className={clsx(
                'py-2 px-3 rounded-lg text-sm font-semibold',
                'border border-mist-300 dark:border-mist-700',
                'bg-mist-100 dark:bg-mist-800 text-mist-700 dark:text-mist-300',
                'hover:bg-mist-200 dark:hover:bg-mist-700 transition-colors'
              )}
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className={clsx(
                'flex-1 py-2 px-3 rounded-lg text-sm font-semibold',
                'border border-mist-300 dark:border-mist-700',
                'bg-white dark:bg-mist-900 text-mist-700 dark:text-mist-300',
                'hover:bg-mist-50 dark:hover:bg-mist-800 transition-colors'
              )}
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              className={clsx(
                'flex-1 py-2 px-3 rounded-lg text-sm font-semibold',
                'bg-werkelijk text-white',
                'hover:bg-werkelijk/90 transition-colors'
              )}
            >
              Toepassen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

CustomScenarioModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  defaultReturns: PropTypes.shape({
    etf: PropTypes.number.isRequired,
    crypto: PropTypes.number.isRequired,
    spaar: PropTypes.number.isRequired,
  }).isRequired,
};
