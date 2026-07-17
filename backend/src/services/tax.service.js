'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// Tax rate policy — single source of truth for allowed per-order tax rates.
//
// TEMPORARY / currency-driven. W7-P1 replaces this with org-configurable rates.
//
// D4 branch (Phase 0, W5.5-P2): the test org currency is JOD → { allowed: [16, 0],
// default: 16 }. SAR → { allowed: [15, 0], default: 15 }. Any other/unknown/NULL
// currency falls back to { allowed: [16, 0], default: 16 }.
//
// The frontend constant TAX_RATE_POLICY (src/lib/constants.js) mirrors this exactly.
// If you change rates here, change the frontend constant in the SAME commit.
// ─────────────────────────────────────────────────────────────────────────────

const TAX_POLICY = {
  JOD: { allowed: [16, 0], default: 16 },
  SAR: { allowed: [15, 0], default: 15 },
};

const FALLBACK = { allowed: [16, 0], default: 16 };

function policyFor(currency) {
  const key = String(currency || '').trim().toUpperCase();
  return TAX_POLICY[key] || FALLBACK;
}

/** Allowed tax-rate percentages for an org's currency, e.g. [16, 0]. */
function getAllowedTaxRates(currency) {
  return policyFor(currency).allowed;
}

/** Default tax-rate percentage for an org's currency, e.g. 16. */
function getDefaultTaxRate(currency) {
  return policyFor(currency).default;
}

module.exports = { getAllowedTaxRates, getDefaultTaxRate };
