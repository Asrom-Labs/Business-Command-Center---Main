-- Migration 005: Expand sales_orders.channel to include walk_in and phone
-- W5 / BUG-11 fix: the frontend offers walk_in and phone as essential MENA retail
-- channels, but the CHECK constraint (and express validator) rejected both.
-- This expands the allowed set to the canonical union and makes walk_in the default.
-- Legacy values (in_store, snapchat, tiktok) are KEPT valid so existing rows survive.
--
-- Safe to run on Railway production. Idempotent: re-running is a no-op after the first run.
-- Run with:  psql "$DATABASE_URL" -f backend/db/migrations/005_expand_sales_order_channels.sql

BEGIN;

-- Drop the old constraint (name follows Postgres's default <table>_<column>_check convention).
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_channel_check;

-- Recreate with the canonical union set.
ALTER TABLE sales_orders
  ADD CONSTRAINT sales_orders_channel_check
  CHECK (channel IN ('walk_in','phone','in_store','whatsapp','instagram','snapchat','tiktok','online','other'));

-- Make walk_in the new default (matches the frontend's primary channel).
ALTER TABLE sales_orders ALTER COLUMN channel SET DEFAULT 'walk_in';

COMMIT;
