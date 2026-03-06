-- Migration 004: Drop unused bundles and bundle_items tables
-- S16 fix: these tables were scaffolded but never implemented

DROP TABLE IF EXISTS bundle_items CASCADE;
DROP TABLE IF EXISTS bundles CASCADE;
