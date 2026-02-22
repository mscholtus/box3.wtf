import PropTypes from 'prop-types';

/**
 * Key performance indicator card with colored top border
 */
export function KpiCard({ label, value, sub, color, theme }) {
  return (
    <div
      style={{
        background: theme.card,
        borderRadius: 14,
        padding: "16px 18px",
        border: `1px solid ${theme.cardBorder}`,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: color,
          borderRadius: "14px 14px 0 0",
        }}
      />
      <div
        style={{
          fontSize: 11,
          color: theme.textMuted,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 900,
          color: theme.text,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 5 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

KpiCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  sub: PropTypes.string,
  color: PropTypes.string.isRequired,
  theme: PropTypes.object.isRequired,
};
