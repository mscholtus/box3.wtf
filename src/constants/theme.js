/**
 * Theme definitions for dark and light mode
 * All colors use accessible contrast ratios
 */

export const DARK = {
  bg:          "#060b14",
  sidebar:     "#080d17",
  card:        "#0d1424",
  cardBorder:  "#1a2235",
  border:      "#1f2937",
  borderSub:   "#0f172a",
  inputBg:     "#111827",
  inputBorder: "#1f2937",
  text:        "#f1f5f9",
  textSub:     "#94a3b8",
  textMuted:   "#64748b",
  textFaint:   "#4b5563",
  gridLine:    "#0f172a",
  axisLine:    "#1f2937",
  axisTick:    "#6b7280",
  tooltipBg:   "#0a0f1a",
  toggleOff:   "#1f2937",
  advBg:       "#060b14",
  advBorder:   "#1a2235",
  footerText:  "#475569",
  accent:      "#f97316",
  accentMc:    "#a78bfa",
  mcFill:      "#060b14",
  backdrop:    "rgba(0,0,0,0.5)",
};

export const LIGHT = {
  bg:          "#f8fafc",
  sidebar:     "#ffffff",
  card:        "#ffffff",
  cardBorder:  "#e2e8f0",
  border:      "#e2e8f0",
  borderSub:   "#f1f5f9",
  inputBg:     "#f8fafc",
  inputBorder: "#e2e8f0",
  text:        "#0f172a",
  textSub:     "#475569",
  textMuted:   "#64748b",
  textFaint:   "#94a3b8",
  gridLine:    "#f1f5f9",
  axisLine:    "#e2e8f0",
  axisTick:    "#64748b",
  tooltipBg:   "#ffffff",
  toggleOff:   "#e2e8f0",
  advBg:       "#f1f5f9",
  advBorder:   "#e2e8f0",
  footerText:  "#94a3b8",
  accent:      "#ea6c00",
  accentMc:    "#7c3aed",
  mcFill:      "#f8fafc",
  backdrop:    "rgba(0,0,0,0.3)",
};

/**
 * Get theme object based on dark mode preference
 * @param {boolean} darkMode
 * @returns {typeof DARK}
 */
export function getTheme(darkMode) {
  return darkMode ? DARK : LIGHT;
}
