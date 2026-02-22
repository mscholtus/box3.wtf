import PropTypes from 'prop-types';
import { clsx } from 'clsx';

/**
 * Range slider with label and formatted value display
 */
export function Slider({ label, value, min, max, step, onChange, format, accent }) {
  // Use accent color for value display if provided
  const valueColorClass = accent ? '' : 'text-accent';

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-bold text-mist-500 dark:text-mist-400 tracking-wider uppercase">
          {label}
        </span>
        <span
          className={clsx("text-sm font-extrabold", valueColorClass)}
          style={accent ? { color: accent } : undefined}
        >
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 cursor-pointer"
        style={{ accentColor: accent || 'var(--color-accent)' }}
      />
      <div className="flex justify-between text-[11px] text-mist-500 dark:text-mist-400 mt-1">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

Slider.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  format: PropTypes.func.isRequired,
  accent: PropTypes.string,
};
