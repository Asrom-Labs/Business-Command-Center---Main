# Database Migrations

Migrations are numbered sequentially. Run them in order against the target database.

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Baseline — run `schema.sql` directly for fresh installs |
| `002_add_cancellation_movement_type.sql` | Adds `'cancellation'` to `stock_ledger.movement_type` CHECK |
| `003_add_locations_active.sql` | Adds `active` column to `locations` table |
| `004_drop_bundles.sql` | Drops unused `bundles` and `bundle_items` tables |

## How to apply

```bash
psql "$DATABASE_URL" -f backend/db/migrations/002_add_cancellation_movement_type.sql
psql "$DATABASE_URL" -f backend/db/migrations/003_add_locations_active.sql
psql "$DATABASE_URL" -f backend/db/migrations/004_drop_bundles.sql
```
