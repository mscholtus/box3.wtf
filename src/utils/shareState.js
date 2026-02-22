/**
 * Utilities for encoding/decoding app state to/from URL
 * Ultra-compact format: only non-default values, single-char keys, packed array
 */

import {
  DEFAULT_JAREN,
  DEFAULT_REND_ETF,
  DEFAULT_REND_CRYPTO,
  DEFAULT_REND_SPAAR,
  DEFAULT_VOL_ETF,
  DEFAULT_VOL_CRYPTO,
  DEFAULT_START_ETF,
  DEFAULT_START_CRYPTO,
  DEFAULT_START_SPAAR,
  DEFAULT_START_PENSIOEN,
  DEFAULT_BIJ_ETF,
  DEFAULT_BIJ_CRYPTO,
  DEFAULT_BIJ_PENSIOEN,
  DEFAULT_FISCAAL_PARTNER,
  DEFAULT_BETAAL_UIT_SPAAR,
  DEFAULT_ADVANCED_MODE,
  DEFAULT_MC_SEED,
} from '../constants/tax';

// Default values - only encode if different from these
const DEFAULTS = {
  startEtf: DEFAULT_START_ETF,
  startCrypto: DEFAULT_START_CRYPTO,
  startSpaar: DEFAULT_START_SPAAR,
  startPensioen: DEFAULT_START_PENSIOEN,
  bijEtf: DEFAULT_BIJ_ETF,
  bijCrypto: DEFAULT_BIJ_CRYPTO,
  bijPensioen: DEFAULT_BIJ_PENSIOEN,
  rendEtf: DEFAULT_REND_ETF,
  rendCrypto: DEFAULT_REND_CRYPTO,
  rendSpaar: DEFAULT_REND_SPAAR,
  jaren: DEFAULT_JAREN,
  fiscaalPartner: DEFAULT_FISCAAL_PARTNER,
  betaalUitSpaar: DEFAULT_BETAAL_UIT_SPAAR,
  advancedMode: DEFAULT_ADVANCED_MODE,
  volEtf: DEFAULT_VOL_ETF,
  volCrypto: DEFAULT_VOL_CRYPTO,
  mcSeed: DEFAULT_MC_SEED,
};

// Single character keys (order matters for decode)
const KEYS = ['e','c','s','p','E','C','P','r','R','S','j','f','b','m','v','V','x'];
const KEY_NAMES = [
  'startEtf','startCrypto','startSpaar','startPensioen',
  'bijEtf','bijCrypto','bijPensioen',
  'rendEtf','rendCrypto','rendSpaar',
  'jaren','fiscaalPartner','betaalUitSpaar','advancedMode',
  'volEtf','volCrypto','mcSeed'
];

/**
 * Encode state to compact URL string
 * Format: key=value pairs separated by dots, only non-defaults
 */
export function encodeState(state) {
  const parts = [];

  for (let i = 0; i < KEY_NAMES.length; i++) {
    const name = KEY_NAMES[i];
    const key = KEYS[i];
    let value = state[name];
    const defaultVal = DEFAULTS[name];

    // Skip if same as default
    if (value === defaultVal) continue;
    if (value === undefined) continue;

    // Compress values
    if (name.startsWith('start')) {
      value = Math.round(value / 1000); // thousands
    } else if (name.startsWith('bij')) {
      value = Math.round(value / 100); // hundreds
    } else if (name.startsWith('rend') || name.startsWith('vol')) {
      value = Math.round(value * 100); // percentage (2 decimals)
    } else if (typeof value === 'boolean') {
      value = value ? 1 : 0;
    }

    parts.push(`${key}${value}`);
  }

  return parts.join('.');
}

// Validation bounds for numeric parameters
const BOUNDS = {
  startEtf: { min: 0, max: 100_000_000 },
  startCrypto: { min: 0, max: 100_000_000 },
  startSpaar: { min: 0, max: 100_000_000 },
  startPensioen: { min: 0, max: 100_000_000 },
  bijEtf: { min: 0, max: 1_000_000 },
  bijCrypto: { min: 0, max: 1_000_000 },
  bijPensioen: { min: 0, max: 1_000_000 },
  rendEtf: { min: -0.5, max: 0.5 },
  rendCrypto: { min: -0.9, max: 1.0 },
  rendSpaar: { min: 0, max: 0.2 },
  jaren: { min: 1, max: 50 },
  volEtf: { min: 0.01, max: 1.0 },
  volCrypto: { min: 0.01, max: 2.0 },
  mcSeed: { min: 1, max: 2147483647 },
};

/**
 * Validate and clamp a numeric value within bounds
 * @param {string} name - Parameter name
 * @param {number} value - Value to validate
 * @returns {number|null} - Validated value or null if invalid
 */
function validateValue(name, value) {
  // Check for NaN or Infinity
  if (!Number.isFinite(value)) return null;

  const bounds = BOUNDS[name];
  if (!bounds) return value; // No bounds defined, accept as-is

  // Clamp to bounds
  return Math.max(bounds.min, Math.min(bounds.max, value));
}

/**
 * Decode URL string back to state object
 */
export function decodeState(encoded) {
  if (!encoded) return null;

  try {
    const state = { ...DEFAULTS };
    const parts = encoded.split('.');

    for (const part of parts) {
      if (part.length < 2) continue;

      const key = part[0];
      const rawValue = part.slice(1);
      const idx = KEYS.indexOf(key);
      if (idx === -1) continue;

      const name = KEY_NAMES[idx];
      let value = parseFloat(rawValue);

      // Early validation - reject NaN/Infinity
      if (!Number.isFinite(value)) continue;

      // Decompress
      if (name.startsWith('start')) {
        value = value * 1000;
      } else if (name.startsWith('bij')) {
        value = value * 100;
      } else if (name.startsWith('rend') || name.startsWith('vol')) {
        value = value / 100;
      } else if (name === 'fiscaalPartner' || name === 'betaalUitSpaar' || name === 'advancedMode') {
        value = value === 1;
      } else if (name === 'mcSeed') {
        value = Math.floor(value); // Ensure integer
      } else if (name === 'jaren') {
        value = Math.floor(value); // Ensure integer
      }

      // Validate and clamp numeric values
      if (typeof value === 'number') {
        const validated = validateValue(name, value);
        if (validated === null) continue; // Skip invalid values
        value = validated;
      }

      state[name] = value;
    }

    return state;
  } catch {
    return null;
  }
}

/**
 * Get shareable URL with current state
 */
export function getShareUrl(state) {
  const encoded = encodeState(state);
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  // Use shorter param name
  return encoded ? `${url.origin}${url.pathname}?d=${encoded}` : `${url.origin}${url.pathname}`;
}

/**
 * Read state from current URL
 */
export function readStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('d') || params.get('s'); // support old 's' param too
  if (!encoded) return null;
  return decodeState(encoded);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}
