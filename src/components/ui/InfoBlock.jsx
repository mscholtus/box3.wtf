import { useState } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';

/**
 * Collapsible information block
 */
export function InfoBlock({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-4 rounded-2xl border border-mist-200 dark:border-mist-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          "w-full flex items-center justify-between",
          "px-5 py-4",
          "bg-white dark:bg-mist-900",
          "border-none cursor-pointer"
        )}
        aria-expanded={open}
      >
        <span className="text-base font-bold text-mist-950 dark:text-mist-50">{title}</span>
        <span
          className={clsx(
            "text-sm text-mist-500 dark:text-mist-400",
            "transition-transform duration-200",
            open && "rotate-180"
          )}
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-2 bg-white dark:bg-mist-900 border-t border-mist-200 dark:border-mist-700">
          {children}
        </div>
      )}
    </div>
  );
}

InfoBlock.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  defaultOpen: PropTypes.bool,
};
