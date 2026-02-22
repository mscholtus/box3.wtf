import PropTypes from 'prop-types';
import { clsx } from 'clsx';

/**
 * Toggle switch with label and optional subtitle
 */
export function Toggle({ label, sub, value, onChange }) {
  return (
    <div className="flex items-start gap-3 mb-3.5">
      <button
        onClick={() => onChange(!value)}
        className={clsx(
          "w-11 h-6 rounded-xl border-none cursor-pointer",
          "relative shrink-0 mt-0.5",
          "transition-colors duration-200",
          value ? "bg-accent" : "bg-mist-300 dark:bg-mist-600"
        )}
        aria-pressed={value}
        aria-label={label}
      >
        <div
          className={clsx(
            "w-[18px] h-[18px] rounded-full bg-white",
            "absolute top-[3px]",
            "transition-[left] duration-200"
          )}
          style={{ left: value ? 23 : 3 }}
        />
      </button>
      <div>
        <div className="text-[13px] text-mist-700 dark:text-mist-300 font-semibold">
          {label}
        </div>
        {sub && (
          <div className="text-xs text-mist-500 dark:text-mist-400 mt-0.5 leading-relaxed">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

Toggle.propTypes = {
  label: PropTypes.string.isRequired,
  sub: PropTypes.string,
  value: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};
