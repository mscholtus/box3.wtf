import PropTypes from 'prop-types';

/**
 * Section header with icon and title
 */
export function SectionHead({ icon, title, theme }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        paddingBottom: 10,
        marginBottom: 14,
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: theme.accent,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </span>
    </div>
  );
}

SectionHead.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  theme: PropTypes.object.isRequired,
};
