# FIXES_ROUND_4.md — Audit Round 4 Remediation Log

All fixes applied in a single session. Server confirmed healthy post-fix.

---

## S01 — Deactivated users retain valid JWTs
**File:** `backend/src/middleware/auth.js`
**Fix:** Converted `authenticate` to `async`, added live DB check after JWT verification. If the user does not exist or `active = FALSE`, returns `401 INVALID_TOKEN` immediately.

---

## S02 + S26 — No audit logging for login / login_failed
**File:** `backend/src/controllers/auth.controller.js`
**Fix:** Added `auditService.log(...)` calls after successful login (`action: 'login'`) and after each failed attempt (`action: 'login_failed'`).

---

## S03 — Returns do not update customer credit_balance
**File:** `backend/src/controllers/returns.controller.js`
**Fix:** Inside the existing `withTransaction`, after inserting return items, added `UPDATE customers SET credit_balance = credit_balance + $1` when `so.customer_id` is present and `totalRefund > 0`.

---

## S04 — Purchase order status transition is not protected by a transaction
**File:** `backend/src/controllers/purchase-orders.controller.js`
**Fix:** Wrapped `updateStatus` in `withTransaction`. Changed the initial `pool.query` to `client.query(...FOR UPDATE)` to lock the row before checking and applying the transition.

---

## S05 — Health check does not probe the database
**File:** `backend/server.js`
**Fix:** Replaced the static health endpoint with an `async` handler that executes `pool.query('SELECT 1')`, measures latency, and returns `{ db: 'ok', latencyMs }` on success or HTTP 503 with `db: 'unreachable'` on failure.

---

## S06 — No graceful SIGTERM/SIGINT shutdown
**File:** `backend/server.js`
**Fix:** Added `process.on('SIGTERM')` and `process.on('SIGINT')` handlers that call `server.close()` followed by `pool.end()`, with a 10-second forced exit fallback.

---

## S07 — No uncaughtException / unhandledRejection handlers
**File:** `backend/server.js`
**Fix:** Added `process.on('uncaughtException', ...)` and `process.on('unhandledRejection', ...)` handlers that log and call `process.exit(1)`.

---

## S08 — No startup environment variable validation
**File:** `backend/server.js`
**Fix:** Added validation at module load time for `DATABASE_URL` and `JWT_SECRET`. Missing variables cause `console.error` + `process.exit(1)` before Express initializes.

---

## S09 — JWT expiry is 7 days
**File:** `backend/src/controllers/auth.controller.js`
**Fix:** Changed `issueToken` `expiresIn` from `'7d'` to `'24h'`.

---

## S10 — Manual transitions to paid/partially_paid allowed
**File:** `backend/src/controllers/sales-orders.controller.js`
**Fix:** Added an early guard in `updateStatus` that returns `422 BUSINESS_RULE` if `status === 'paid'` or `status === 'partially_paid'`. Also removed these values from the `validTransitions` map.

---

## S11 — GET /api/stock has no pagination
**File:** `backend/src/controllers/stock.controller.js`
**Fix:** Added `page`, `limit` (max 200, default 50), and `offset` parameters. Added a COUNT subquery for total. Response now includes `pagination` object.

---

## S12 — Morgan always uses 'dev' format; no request ID
**File:** `backend/server.js`
**Fix:** Added request ID middleware (uses incoming `X-Request-ID` header or generates `crypto.randomUUID()`; echoes it in the response). Changed morgan to use `'combined'` in production and `'dev'` in development/test.

---

## S13 — Customer check in sales order create doesn't verify active = TRUE
**File:** `backend/src/controllers/sales-orders.controller.js`
**Fix:** Added `AND active = TRUE` to the customer existence check query.

---

## S14 — Locations list includes locations in inactive branches
**File:** `backend/src/controllers/locations.controller.js`
**Fix:** Added `AND l.active = TRUE AND b.active = TRUE` to the WHERE clause in `list`, `getOne`, `update`, and `remove`.

---

## S15 — No account lockout on repeated login failures
**File:** `backend/src/controllers/auth.controller.js`
**Fix:** Added in-memory lockout using a `Map`. After 5 failed attempts within 15 minutes, further login attempts for that email return `429 RATE_LIMITED`. Successful login clears the counter.

---

## S16 — Unused bundles/bundle_items tables in schema
**Files:** `backend/db/migrations/004_drop_bundles.sql`
**Fix:** Created migration to `DROP TABLE IF EXISTS bundle_items CASCADE` and `DROP TABLE IF EXISTS bundles CASCADE`.

---

## S17 — getOrgStockSummary never called
**Files:** `backend/src/controllers/stock.controller.js`, `backend/src/routes/stock.routes.js`
**Fix:** Added `getSummary` controller function that returns per-product inventory value. Wired to `GET /api/stock/summary` route.

---

## S18 — changePassword not wrapped in transaction
**File:** `backend/src/controllers/auth.controller.js`
**Fix:** Wrapped entire `changePassword` body in `withTransaction`. Uses `SELECT ... FOR UPDATE` to lock the user row before verifying and updating the password.

---

## S19 — Error responses missing data: null field
**File:** `backend/src/middleware/errorHandler.js`
**Fix:** Added `data: null` to all error response objects in the global error handler.

---

## S20 — unit_id not validated against org on product create/update
**File:** `backend/src/controllers/products.controller.js`
**Fix:** Added a query to validate `unit_id` exists in `units` where `organization_id = $orgId OR organization_id IS NULL` in both `create` and `update` handlers.

---

## S21 — No from <= to validation in reports and expenses
**Files:** `backend/src/controllers/reports.controller.js`, `backend/src/controllers/expenses.controller.js`
**Fix:** Added a shared `getDateRange` helper in reports controller that returns `400 VALIDATION_ERROR` if `from > to`. Applied to all five date-ranged report endpoints. Added inline check to expenses `list`.

---

## S22 — getOne customer doesn't check active = TRUE
**File:** `backend/src/controllers/customers.controller.js`
**Fix:** Added `AND active = TRUE` to the SELECT in `getOne`.

---

## S23 — getOne branch doesn't check active = TRUE
**File:** `backend/src/controllers/branches.controller.js`
**Fix:** Added `AND active = TRUE` to the SELECT in `getOne`.

---

## S24 — Locations table has no active column; remove is a hard DELETE
**Files:** `backend/src/controllers/locations.controller.js`, `backend/db/migrations/003_add_locations_active.sql`
**Fix:** Changed `remove` from `DELETE FROM locations` to `UPDATE locations SET active = FALSE`. Added `AND l.active = TRUE` to all location queries. Created migration to `ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE`.

---

## S25 — schema.sql has no IF NOT EXISTS / no migrations directory
**Files:** `backend/db/migrations/README.md`
**Fix:** Created `backend/db/migrations/` directory with README describing numbered migration files and how to apply them.

---

## S27 — No getOneCategory or updateCategory in expenses
**Files:** `backend/src/controllers/expenses.controller.js`, `backend/src/routes/expenses.routes.js`
**Fix:** Added `getOneCategory` and `updateCategory` controller functions. Added `GET /api/expenses/categories/:id` and `PATCH /api/expenses/categories/:id` routes.

---

## S28 — No getOnePayment endpoint
**Files:** `backend/src/controllers/payments.controller.js`, `backend/src/routes/payments.routes.js`
**Fix:** Added `getOne` controller function. Added `GET /api/payments/:id` route (requires staff+).

---

## S29 — SELECT * in auth controller login and changePassword
**File:** `backend/src/controllers/auth.controller.js`
**Fix:** Replaced `SELECT u.*` in login with explicit column list: `id, organization_id, name, email, password_hash, active, role_name`. Replaced `SELECT *` in changePassword with `SELECT id, password_hash`.

---

## S30 — jwt.verify missing algorithm restriction
**File:** `backend/src/middleware/auth.js`
**Fix:** Added `{ algorithms: ['HS256'] }` as the third argument to `jwt.verify()`.

---

## S31 — uuid package in dependencies but never used
**File:** `backend/package.json`
**Fix:** Removed `"uuid": "^9.0.1"` from `dependencies`. Ran `npm install` to clean node_modules.

---

## S32 — cancellation not in stock_ledger.movement_type CHECK
**Files:** `backend/src/controllers/sales-orders.controller.js`, `backend/db/migrations/002_add_cancellation_movement_type.sql`
**Fix:** Changed order cancellation stock restoration to use `movementType: 'cancellation'`. Created migration to drop and re-add the CHECK constraint including `'cancellation'`. Updated stock ledger route movement_type validator.

---

## S33 — No audit log read endpoint
**Files:** `backend/src/controllers/audit-log.controller.js`, `backend/src/routes/audit-log.routes.js`, `backend/server.js`
**Fix:** Created `audit-log.controller.js` with paginated `list` function supporting `entity`, `action`, `user_id`, `from`, `to` filters. Created route file requiring `admin` role. Mounted at `GET /api/audit-log`.

---

## S34 — No README; .env.example lacks comments
**Files:** `README.md`, `backend/.env.example`
**Fix:** Expanded `README.md` with stack info, quick-start steps, migration instructions, full API route table, and response format docs. Updated `.env.example` with inline comments for each variable.

---

## Post-Fix Verification

- `npm install` — completed successfully, `uuid` removed (420 packages, 0 vulnerabilities)
- Migrations — all 3 applied successfully to remote PostgreSQL
- Server start — confirmed running on port 3001
- `GET /health` — returned `{ "status": "ok", "db": "ok", "latencyMs": 1483 }`
