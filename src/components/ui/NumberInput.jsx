import { useState } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';

/**
 * Currency number input with Euro prefix
 */
export function NumberInput({ label, hint, value, onChange, step = 1000 }) {
  const [raw, setRaw] = useState(String(value));
  const [focus, setFocus] = useState(false);

  // Sync external value changes when not focused
  if (!focus && raw !== String(value)) {
    setRaw(String(value));
  }

  const handleChange = (e) => {
    setRaw(e.target.value);
    const n = parseFloat(e.target.value);
    if (!isNaN(n) && n >= 0) {
      onChange(n);
    }
  };

  const handleFocus = (e) => {
    setFocus(true);
    e.target.select();
  };

  const handleBlur = () => {
    setFocus(false);
    const n = parseFloat(raw);
    const cleaned = isNaN(n) || n < 0 ? 0 : n;
    setRaw(String(cleaned));
    onChange(cleaned);
  };

  return (
    <div className="mb-3.5">
      <label className="block text-xs font-bold tracking-wider uppercase text-mist-500 dark:text-mist-400 mb-1.5">
        {label}
        {hint && (
          <span className="font-medium normal-case tracking-normal text-mist-400 dark:text-mist-500 ml-1.5">
            ({hint})
          </span>
        )}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mist-500 dark:text-mist-400 text-[15px] pointer-events-none">
          €
        </span>
        <input
          type="number"
          value={raw}
          step={step}
          min={0}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={clsx(
            "w-full box-border py-3 pr-3 pl-7",
            "bg-mist-100 dark:bg-mist-800",
            "border-2 border-mist-200 dark:border-mist-700",
            "rounded-lg",
            "text-mist-950 dark:text-mist-50",
            "text-base font-sans",
            "outline-none",
            "transition-colors duration-150",
            "focus:border-accent dark:focus:border-accent"
          )}
        />
      </div>
    </div>
  );
}

NumberInput.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  step: PropTypes.number,
};
