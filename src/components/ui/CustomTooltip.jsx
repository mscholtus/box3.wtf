import PropTypes from 'prop-types';
import { formatTooltip } from '../../utils/format';

/**
 * Custom tooltip for Recharts
 * Note: Uses theme prop as Recharts requires inline styles for proper rendering
 */
export function CustomTooltip({ active, payload, label, theme }) {
  if (!active || !payload?.length) return null;

  const items = payload
    .filter((p) => p.value != null && p.dataKey && !p.dataKey.startsWith("__") && !p.dataKey.includes("Range"))
    .sort((a, b) => b.value - a.value);

  return (
    <div
      className="rounded-xl p-3 min-w-[210px] shadow-lg"
      style={{
        background: theme.tooltipBg,
        border: `1px solid ${theme.border}`,
      }}
    >
      <div className="text-xs font-bold text-mist-500 dark:text-mist-400 mb-2">
        {label}
      </div>
      {items.map((p) => (
        <div
          key={p.dataKey}
          className="flex items-center gap-2 mb-1"
        >
          <div
            className="w-2 h-2 rounded-sm shrink-0"
            style={{ background: p.stroke || p.color }}
          />
          <span className="text-xs text-mist-600 dark:text-mist-300 flex-1">
            {p.name || p.dataKey}
          </span>
          <span className="text-xs font-bold text-mist-950 dark:text-mist-50">
            {formatTooltip(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  theme: PropTypes.object.isRequired,
};
