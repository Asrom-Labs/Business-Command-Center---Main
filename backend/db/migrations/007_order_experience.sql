-- Migration 007: order experience (W5.5-P2)
-- Adds per-order tax rate, "other" channel free-text detail, and (idempotently)
-- confirms the per-line discount column exists.
--
-- Decisions carried from Phase 0 diagnostics:
--   D2 — money columns are NUMERIC(12,2); sales_order_items.discount already
--        exists at NUMERIC(12,2), so the ADD below is a no-op safety net.
--   D3 — sales_orders.tax already exists as a computed AMOUNT snapshot and is
--        KEPT untouched; tax_rate is added ALONGSIDE it (no tax amount column added).
--
-- tax_rate is NULLABLE with NO default on purpose: every order created before
-- this migration keeps tax_rate NULL forever. Its stored `tax` amount is frozen
-- audit truth — never backfilled, never recomputed. New orders always receive an
-- explicit rate from the API.
--
-- Additive and idempotent. Safe to re-run on Railway production.
--
-- Run with:  psql "$DATABASE_URL" -f backend/db/migrations/007_order_experience.sql

BEGIN;

-- Per-line discount amount (already present since the original schema; kept here
-- for a clean fresh-install migration trail and as an idempotent safety net).
ALTER TABLE sales_order_items
  ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Free-text detail for channel = 'other' (e.g. "Souq", a marketplace name).
-- NULL for every other channel. Per-order only; no per-item tax/detail in P2.
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS channel_detail VARCHAR(100);

-- Per-order tax rate as a percentage (e.g. 16.00). NULLABLE, no default:
-- historical orders stay NULL and keep their frozen `tax` amount.
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2);

COMMIT;
