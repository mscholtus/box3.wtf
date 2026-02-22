/**
 * Number formatting utilities for Dutch locale
 */

const currencyFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/**
 * Format number as Euro currency
 * @param {number} n
 * @returns {string}
 */
export function formatCurrency(n) {
  return currencyFormatter.format(n ?? 0);
}

/**
 * Format number as compact currency (K/M suffix) - for axis labels
 * @param {number} n
 * @returns {string}
 */
export function formatCompact(n) {
  if (n == null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return formatCurrency(n);
}

/**
 * Format number for tooltips - full value up to 1K, one decimal for larger
 * @param {number} n
 * @returns {string}
 */
export function formatTooltip(n) {
  if (n == null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `€${(n / 1_000).toFixed(1)}K`;
  return formatCurrency(n);
}

/**
 * Format percentage
 * @param {number} n - Decimal value (0.07 = 7%)
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercent(n, decimals = 1) {
  return `${(n * 100).toFixed(decimals)}%`;
}

const numberFormatter = new Intl.NumberFormat("nl-NL", {
  maximumFractionDigits: 0,
});

/**
 * Format number with thousands separator (Dutch: periods)
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
  return numberFormatter.format(n ?? 0);
}

/**
 * Parse Dutch-formatted number string back to number
 * @param {string} s
 * @returns {number}
 */
export function parseNumber(s) {
  if (!s) return 0;
  // Remove thousands separators (periods) and handle comma as decimal
  const cleaned = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}
