-- Migration 002: Add 'cancellation' to stock_ledger.movement_type CHECK constraint
-- S32 fix: stock restoration on order cancellation now uses 'cancellation' movement type

ALTER TABLE stock_ledger DROP CONSTRAINT IF EXISTS stock_ledger_movement_type_check;

ALTER TABLE stock_ledger
  ADD CONSTRAINT stock_ledger_movement_type_check
  CHECK (movement_type IN ('purchase', 'sale', 'transfer_in', 'transfer_out', 'return', 'adjustment', 'cancellation'));
