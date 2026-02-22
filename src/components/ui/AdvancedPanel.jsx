import PropTypes from 'prop-types';

/**
 * Collapsible panel for advanced settings
 */
export function AdvancedPanel({ open, onToggle, children, theme }) {
  return (
    <div
      style={{
        marginBottom: 16,
        borderRadius: 10,
        border: `1px solid ${theme.advBorder}`,
        overflow: "hidden",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: theme.advBg,
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
        aria-expanded={open}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 13 }}>🎲</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: theme.accentMc,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Geavanceerde instellingen
          </span>
        </div>
        <span
          style={{
            fontSize: 13,
            color: theme.textMuted,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            display: "inline-block",
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div
          style={{
            background: theme.advBg,
            borderTop: `1px solid ${theme.advBorder}`,
            padding: "14px 14px 4px",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

AdvancedPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  theme: PropTypes.object.isRequired,
};
