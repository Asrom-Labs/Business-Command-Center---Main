-- Migration 003: Add active column to locations table (soft delete support)
-- S24 fix: locations now use soft delete instead of hard DELETE

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- Backfill: all existing locations are active
UPDATE locations SET active = TRUE WHERE active IS NULL;

CREATE INDEX IF NOT EXISTS idx_locations_active ON locations (active);
