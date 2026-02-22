import { useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

/**
 * Instant tooltip component for table headers
 * Shows immediately on hover instead of native title delay
 * Uses portal to escape overflow constraints
 */
export function TableTooltip({ label, tooltip, className }) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
    setShow(true);
  };

  return (
    <th
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
      className={className}
    >
      {label}
      {show && createPortal(
        <div
          className="fixed z-[10000] px-3 py-2 bg-mist-950 dark:bg-mist-100 text-mist-100 dark:text-mist-950 text-xs font-medium rounded-md whitespace-nowrap shadow-lg pointer-events-none"
          style={{
            top: position.top,
            left: position.left,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltip}
          {/* Arrow pointing down */}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-mist-950 dark:border-t-mist-100"
          />
        </div>,
        document.body
      )}
    </th>
  );
}

TableTooltip.propTypes = {
  label: PropTypes.string.isRequired,
  tooltip: PropTypes.string.isRequired,
  className: PropTypes.string,
};
