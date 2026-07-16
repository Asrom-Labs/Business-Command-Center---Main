-- Migration 006: persist one-time customer names (BUG-14)
-- The frontend sends customer_name for walk-in/one-time orders
-- (customer_id null); the column never existed, so the name was
-- silently dropped and the UI rendered "—".
--
-- Additive and idempotent. Safe on Railway production.
-- Historical one-time orders keep NULL — their names were never
-- stored and cannot be recovered.
--
-- Run with:  psql "$DATABASE_URL" -f backend/db/migrations/006_add_sales_order_customer_name.sql

BEGIN;

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

COMMIT;
