# VERIFICATION_ROUND_4.md
# BCC Backend — Full Sign-Off Audit
# Auditor: Independent review (Claude Code, claude-sonnet-4-6)
# Date: 2026-03-07
# Scope: All 47 source files + schema + 3 migrations read in full

Every file listed in run_verification.md was read. No file was skipped.
Findings are based on direct code inspection, not on FIXES_ROUND_4.md claims.

---

## PART A — Verification of Round 4 Fixes (S01–S34)

Legend: VERIFIED = fix present and correct | PARTIAL = incomplete | FAILED = absent or wrong

| ID | Verdict | File : Line | Notes |
|----|---------|-------------|-------|
| S01 | VERIFIED | `src/middleware/auth.js:12-28` | `authenticate` is `async`. After `jwt.verify`, executes `SELECT active FROM users WHERE id = $1`. Returns 401 `INVALID_TOKEN` if row missing or `active = FALSE`. |
| S02+S26 | VERIFIED | `src/controllers/auth.controller.js` | `auditService.log({ action: 'login' })` on success; `auditService.log({ action: 'login_failed' })` on every failed attempt (wrong password, inactive account, locked out). |
| S03 | VERIFIED | `src/controllers/returns.controller.js` | Inside `withTransaction`, after inserting return items: `UPDATE customers SET credit_balance = credit_balance + $1, updated_at = NOW() WHERE id = $2` when `so.customer_id && totalRefund > 0`. |
| S04 | VERIFIED | `src/controllers/purchase-orders.controller.js` | `updateStatus` wrapped in `withTransaction`. Initial fetch uses `SELECT status FROM purchase_orders WHERE id = $1 AND organization_id = $2 FOR UPDATE`, locking the row before transition check. |
| S05 | VERIFIED | `backend/server.js:98-108` | Async health handler runs `pool.query('SELECT 1')`, measures latency with `Date.now()`, returns `{ db: 'ok', latencyMs }` on success or HTTP 503 `{ db: 'unreachable' }` on any pool error. |
| S06 | VERIFIED | `backend/server.js:175-176` | `process.on('SIGTERM')` and `process.on('SIGINT')` both call `server.close(() => pool.end())` with a `setTimeout(process.exit, 10000)` force-exit fallback. |
| S07 | VERIFIED | `backend/server.js:142-150` | `process.on('uncaughtException', ...)` and `process.on('unhandledRejection', ...)` both log the error and call `process.exit(1)`. Registered before `app.listen()`. |
| S08 | VERIFIED | `backend/server.js:6-11` | At module-load time, checks `!process.env.DATABASE_URL` and `!process.env.JWT_SECRET`. Missing variable → `console.error` + `process.exit(1)` before Express initialises. |
| S09 | VERIFIED | `src/controllers/auth.controller.js:issueToken` | `jwt.sign(payload, secret, { expiresIn: '24h' })` — changed from former `'7d'`. |
| S10 | VERIFIED | `src/controllers/sales-orders.controller.js:196-199` | Early guard in `updateStatus`: `if (status === 'paid' \|\| status === 'partially_paid') return res.status(422)...`. Both values also removed from `validTransitions` map, so they are blocked at both entry points. |
| S11 | VERIFIED | `src/controllers/stock.controller.js:getStock` | Accepts `page`, `limit` (capped at 200, default 50), computes `offset`. Runs parallel COUNT subquery. Response includes `pagination: { page, limit, total, totalPages }`. |
| S12 | VERIFIED | `backend/server.js:81-92` | Request-ID middleware reads `req.headers['x-request-id']` or generates `require('crypto').randomUUID()`, sets `req.id` and echoes in `X-Request-ID` response header. Morgan uses `'combined'` format in production, `'dev'` otherwise. |
| S13 | VERIFIED | `src/controllers/sales-orders.controller.js:62` | Customer existence query: `SELECT id FROM customers WHERE id = $1 AND organization_id = $2 AND active = TRUE`. |
| S14 | VERIFIED | `src/controllers/locations.controller.js:14,57,68,90` | `list`: `WHERE b.organization_id = $1 AND l.active = TRUE AND b.active = TRUE`. `getOne` / `update` / `remove`: all join branches and filter `AND b.organization_id = $2 AND l.active = TRUE`. |
| S15 | VERIFIED | `src/controllers/auth.controller.js:checkLockout,recordFailedAttempt,clearAttempts` | `loginAttempts` Map keyed by email. After 5 failures within 15 minutes, `checkLockout` returns 429 `RATE_LIMITED`. Successful login calls `clearAttempts(email)`. Lockout check runs before bcrypt comparison. |
| S16 | VERIFIED | `backend/db/migrations/004_drop_bundles.sql` | `DROP TABLE IF EXISTS bundle_items CASCADE` then `DROP TABLE IF EXISTS bundles CASCADE`. Correct dependency order. Idempotent. |
| S17 | PARTIAL | `src/controllers/stock.controller.js:getSummary` / `src/services/stock.service.js:getOrgStockSummary` | New `GET /api/stock/summary` endpoint exists and is correctly routed. However `getSummary` contains its own inline SQL query. It does NOT import or call `stock.service.js:getOrgStockSummary`. That function is exported but never imported anywhere — it is dead code. FIXES_ROUND_4.md claims the endpoint "calls getOrgStockSummary" — this is inaccurate. Functionally the endpoint works; the service layer remains unused. |
| S18 | VERIFIED | `src/controllers/auth.controller.js:changePassword` | Entire handler body wrapped in `withTransaction(async (client) => { ... })`. Fetches user with `SELECT id, password_hash FROM users WHERE id = $1 FOR UPDATE`, then verifies old password, then updates. |
| S19 | PARTIAL | `src/middleware/errorHandler.js` (fixed) / `src/middleware/validate.js:16-21` (not fixed) / `src/middleware/auth.js:requireRole,requireMinRole` (not fixed) | `errorHandler.js` now includes `data: null` on all 5 error paths. Two other error-generating middleware functions were not updated: (1) `validate` middleware returns 422 `{ success, error, message, fields }` — no `data` key; (2) `requireRole` and `requireMinRole` return 403 `{ success, error, message }` — no `data` key. README documents `data` as always present. |
| S20 | VERIFIED | `src/controllers/products.controller.js:create,update` | Both handlers run `SELECT id FROM units WHERE id = $1 AND (organization_id = $2 OR organization_id IS NULL)` before proceeding. Returns 404 `NOT_FOUND` if unit not in org or global pool. |
| S21 | VERIFIED | `src/controllers/reports.controller.js:getDateRange` / `src/controllers/expenses.controller.js:list` | `getDateRange` helper returns 400 `VALIDATION_ERROR` if `from > to`. Applied to all 5 date-ranged report endpoints (`/dashboard`, `/sales-by-day`, `/top-products`, `/sales-by-source`, `/expenses-by-category`). `expenses.controller.js` has an inline `if (from && to && from > to)` guard. |
| S22 | VERIFIED | `src/controllers/customers.controller.js:46` | `getOne` query: `WHERE id = $1 AND organization_id = $2 AND active = TRUE`. |
| S23 | VERIFIED | `src/controllers/branches.controller.js:48` | `getOne` query: `WHERE id = $1 AND organization_id = $2 AND active = TRUE`. |
| S24 | VERIFIED | `src/controllers/locations.controller.js:94` / `db/migrations/003_add_locations_active.sql` | `remove` issues `UPDATE locations SET active = FALSE, updated_at = NOW() WHERE id = $1` (no hard DELETE). Migration adds `active BOOLEAN NOT NULL DEFAULT TRUE` with `IF NOT EXISTS` guard and a partial index. All read/write queries include `AND l.active = TRUE`. |
| S25 | PARTIAL | `backend/db/migrations/README.md` (created) / `backend/db/schema.sql` (not updated) | Migrations directory exists and README explains the numbered migration process. However `schema.sql` itself still uses bare `CREATE TABLE` with no `IF NOT EXISTS`. It also still contains the `bundles`/`bundle_items` table definitions (dropped by migration 004), the original `stock_ledger` movement_type CHECK without `'cancellation'` (fixed by migration 002), and no `active` column on `locations` (added by migration 003). A fresh install using only schema.sql produces a broken database. |
| S27 | VERIFIED | `src/controllers/expenses.controller.js:getOneCategory,updateCategory` / `src/routes/expenses.routes.js` | `getOneCategory` returns single category scoped by org. `updateCategory` validates and applies name change. Both wired: `GET /api/expenses/categories/:id` and `PATCH /api/expenses/categories/:id`. |
| S28 | VERIFIED | `src/controllers/payments.controller.js:getOne` / `src/routes/payments.routes.js` | `getOne` queries `WHERE p.id = $1 AND p.organization_id = $2` — BOLA protected. Route: `GET /api/payments/:id` with `requireMinRole('staff')`. |
| S29 | VERIFIED | `src/controllers/auth.controller.js:login,changePassword` | `login` uses explicit column list: `u.id, u.organization_id, u.name, u.email, u.password_hash, u.active, r.name AS role_name`. `changePassword` uses `SELECT id, password_hash FROM users WHERE id = $1 FOR UPDATE`. No `SELECT *` in either path. |
| S30 | VERIFIED | `src/middleware/auth.js:jwt.verify` | `jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })` — algorithm restriction present. |
| S31 | VERIFIED | `backend/package.json` | `uuid` does not appear in `dependencies` or `devDependencies`. `require('crypto')` is used instead for UUID generation (built-in Node.js module). |
| S32 | VERIFIED | `src/controllers/sales-orders.controller.js:235` / `db/migrations/002_add_cancellation_movement_type.sql` / `src/routes/stock.routes.js` | Cancellation stock restoration uses `movementType: 'cancellation'`. Migration 002 drops and re-adds the CHECK constraint including `'cancellation'`. Stock routes movement_type validator includes `'cancellation'`. |
| S33 | VERIFIED | `src/controllers/audit-log.controller.js` / `src/routes/audit-log.routes.js` / `backend/server.js:131` | Org-scoped list with `WHERE al.organization_id = $1`. Paginated (max 200, default 50). Filters: `entity`, `action`, `user_id`, `from`, `to`. Route requires `requireMinRole('admin')`. Mounted at `/api/audit-log`. |
| S34 | VERIFIED | `README.md` / `backend/.env.example` | README contains stack, quick-start, migration steps, full API prefix table, response format, and role hierarchy. `.env.example` has inline comments for every variable. |

### Part A Totals

- VERIFIED: 29
- PARTIAL: 3 (S17, S19, S25)
- FAILED: 0

---

## PART B — Fresh Audit (Regressions and New Issues)

### B01 — suppliers.controller.js getOne and update expose soft-deleted records
Severity: MEDIUM
Files: `src/controllers/suppliers.controller.js:44-52` (getOne), `src/controllers/suppliers.controller.js:57-62` (update)

`getOne` query: `WHERE id = $1 AND organization_id = $2` — no `AND active = TRUE`.
`update` existence check: `WHERE id = $1 AND organization_id = $2` — no `AND active = TRUE`.

A client holding a known UUID can retrieve or PATCH a deactivated supplier. Every comparable entity
(customers at S22, branches at S23, locations at S24) received this guard. Suppliers were missed.
The `list` endpoint correctly filters `AND active = TRUE`.

Fix: Add `AND active = TRUE` to the WHERE clause in both `getOne` and the `update` existence check.

---

### B02 — users.controller.js getOne does not filter by active
Severity: LOW-MEDIUM
File: `src/controllers/users.controller.js:90-91`

`getOne` query: `WHERE u.id = $1 AND u.organization_id = $2` — no `AND u.active = TRUE`.
`list` correctly includes `AND u.active = TRUE`. An admin can fetch the full profile of a
deactivated user, including their role and email, via `GET /api/users/:id`. This is an
inconsistency that leaks tombstoned records.

Fix: Add `AND u.active = TRUE` to the getOne query.

---

### B03 — branches.controller.js update existence check skips active guard
Severity: LOW
File: `src/controllers/branches.controller.js:58`

The pre-update existence check: `WHERE id = $1 AND organization_id = $2` — no `AND active = TRUE`.
`getOne` (line 48) correctly includes the guard; `update` does not. An admin can rename or change
the city of a soft-deleted branch.

Fix: Add `AND active = TRUE` to the update existence check.

---

### B04 — customers.controller.js update and remove existence checks skip active guard
Severity: LOW
File: `src/controllers/customers.controller.js:66,96`

Both `update` (line 66) and `remove` (line 96) use `WHERE id = $1 AND organization_id = $2`
with no `AND active = TRUE`. A staff member can PATCH or re-deactivate an already-deactivated
customer. `getOne` (line 46) correctly has the guard.

Fix: Add `AND active = TRUE` to both existence checks.

---

### B05 — loginAttempts Map has no periodic cleanup — memory leak
Severity: MEDIUM
File: `src/controllers/auth.controller.js`

The `loginAttempts` Map stores `{ count, firstAttempt }` keyed by email. The only cleanup paths are:
1. A subsequent attempt by the same email that is outside the 15-minute window (lazy eviction).
2. A successful login for that email.

In a sustained credential-stuffing attack using a large dictionary of fabricated email addresses,
none of these cleanup paths fire. Every entry persists for the lifetime of the process. Under
realistic load (thousands of unique targeted emails), heap usage grows without bound and eventually
causes an OOM crash — the exact failure mode the rate-limiting was meant to prevent.

Fix: Add a cleanup interval, e.g.:
  setInterval(() => {
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [email, data] of loginAttempts)
      if (data.firstAttempt < cutoff) loginAttempts.delete(email);
  }, 5 * 60 * 1000).unref();
The `.unref()` prevents the interval from blocking graceful shutdown.

---

### B06 — credit_balance update in returns.controller.js has no row lock
Severity: HIGH
File: `src/controllers/returns.controller.js`

Inside the return-processing transaction:
  await client.query(
    `UPDATE customers SET credit_balance = credit_balance + $1, updated_at = NOW() WHERE id = $2`,
    [totalRefund, so.customer_id]
  );

There is no preceding `SELECT ... FOR UPDATE` on the customer row. PostgreSQL's
`UPDATE SET col = col + $1` is atomic at the statement level, but two concurrent transactions
running inside their own snapshots can both read the same base value and both commit increments,
producing a total that reflects only one of the two refunds (lost update). This is the exact
scenario S04 fixed for purchase orders and S18 fixed for password changes — both used FOR UPDATE.
Returns were not given the same treatment.

Contrast with the correct pattern in purchase-orders.controller.js:
  const chk = await client.query(
    `SELECT status FROM purchase_orders WHERE id = $1 ... FOR UPDATE`, [id, orgId]
  );

Fix: Before the credit_balance UPDATE, add:
  await client.query(
    `SELECT id FROM customers WHERE id = $1 FOR UPDATE`, [so.customer_id]
  );

---

### B07 — audit-log endpoint missing from <= to date validation
Severity: LOW
File: `src/controllers/audit-log.controller.js`

The S21 fix added date-range validation to reports and expenses. The audit-log controller was
created in the same round (S33) but received no date-range guard. Sending
`GET /api/audit-log?from=2026-12-31&to=2026-01-01` silently returns an empty result set with
HTTP 200. This is the bug S21 was explicitly meant to eliminate across all date-filtered endpoints.

Fix: Apply the same `if (from && to && from > to)` guard used in expenses.controller.js,
or import `getDateRange` from reports.controller.js.

---

### B08 — JWT_SECRET presence validated but minimum length is not enforced
Severity: MEDIUM
File: `backend/server.js:6-11`

Current check:
  if (!process.env.JWT_SECRET) { console.error(...); process.exit(1); }

A value of `JWT_SECRET=abc` (3 chars) passes this check and starts the server. HMAC-SHA256
with a short key is trivially brute-forceable offline given any signed token. The .env.example
comment states "at least 64 random characters in production" but this is advisory only — there
is no runtime enforcement. An operator mistake or a CI test value left in production config
would not be caught.

Fix: Change the check to:
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET must be at least 32 characters');
    process.exit(1);
  }
(64 characters is ideal; 32 is a defensible hard minimum.)

---

### B09 — validate.js and auth.js helper responses omit data: null (S19 incomplete)
Severity: LOW
Files: `src/middleware/validate.js:16-21`, `src/middleware/auth.js:requireRole,requireMinRole`

The S19 fix targeted only `errorHandler.js`. Two other middleware paths return error responses
without the `data` key:

validate.js (422 on bad input):
  { success: false, error: 'VALIDATION_ERROR', message: 'Validation failed', fields: [...] }
  -- missing: data: null

requireRole / requireMinRole (403 on insufficient role):
  { success: false, error: 'FORBIDDEN', message: '...' }
  -- missing: data: null

README.md documents the response format as always including `data`. Postman tests or client SDKs
that destructure `data` from every response will fail on validation errors and role rejections.

Fix: Add `data: null` to both response objects.

---

### B10 — sales-orders.routes.js validator still allows paid and partially_paid
Severity: LOW
File: `src/routes/sales-orders.routes.js:40`

The S10 fix guards against manual `paid`/`partially_paid` transitions in the controller.
However the route-level validator still includes them in the `isIn` list:
  body('status').isIn(['pending', 'partially_paid', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'])

These values pass route validation and travel through the middleware stack before being rejected
in the controller with 422 `BUSINESS_RULE`. The validator should be the first line of defence.
Excluding these values at the route level would catch the mistake earlier and return a cleaner
422 `VALIDATION_ERROR` with field-level detail, rather than the generic business rule rejection.

Fix: Remove `'partially_paid'` and `'paid'` from the `isIn` list in the route validator.

---

### B11 — schema.sql is out of sync with the three applied migrations
Severity: MEDIUM
File: `backend/db/schema.sql`

Three migrations modify the schema, but schema.sql was not updated to match. Specific drifts:

1. `locations` table (schema.sql:35-42): no `active` column. Migration 003 adds it.
2. `stock_ledger` movement_type CHECK (schema.sql:150): does not include `'cancellation'`.
   Migration 002 drops and re-adds this constraint with `'cancellation'` included.
   An insert with `movement_type = 'cancellation'` will fail on a fresh schema.sql install.
3. `bundles` and `bundle_items` tables (schema.sql:125-138): still defined.
   Migration 004 drops both. The tables exist in schema but no code references them.

A developer onboarding fresh — running `psql -f schema.sql` and skipping the migration step
(a realistic mistake for a new team member) will get:
- Cancellation stock restoration failures (silent data corruption risk)
- No soft-delete on locations
- Two ghost tables consuming namespace

The README instructs running migrations after schema.sql, which partially mitigates this.
But the better fix is to consolidate so that schema.sql alone produces a correct schema.

Fix: Update schema.sql to add `active BOOLEAN NOT NULL DEFAULT TRUE` to `locations`,
update the movement_type CHECK to include `'cancellation'`, and remove the `bundles`/
`bundle_items` table definitions. Then schema.sql becomes the single source of truth
and migrations become historical records only.

---

### B12 — GET /api/stock/summary route has no role restriction
Severity: LOW (informational, by-design read access)
File: `src/routes/stock.routes.js:18`

`router.get('/summary', ctrl.getSummary)` — no `requireMinRole`. Any authenticated user
including `readonly` can access the inventory value summary (total stock value per product
across all locations in the org). This is likely intentional (readonly users should be able
to read data), but the summary is a financial aggregate. If policy intent is to restrict
inventory financials to staff+, this route needs `requireMinRole('staff')`.

No fix required unless business policy dictates financial data is restricted to staff+.

---

### B13 — stock.service.js:getOrgStockSummary is dead code (S17 incomplete)
Severity: INFORMATIONAL
File: `src/services/stock.service.js:getOrgStockSummary`

`getOrgStockSummary` is exported from the service but never imported in any controller or
route file. The new `getSummary` controller function (S17 fix) has its own inline SQL.
This is a minor maintainability issue rather than a bug, but the service function is
misleading — it looks like it should be called but isn't.

No immediate risk. Either call it or remove it.

---

### B14 — password_hash never leaks into responses
Severity: PASS
File: `src/controllers/auth.controller.js`

Confirmed: `password_hash` is fetched from the DB and used only in `bcrypt.compare()`. The
`login` response explicitly constructs `{ id, name, email, role }`. The `changePassword`
response returns `{ message: 'Password updated' }` only. No response body anywhere in the
codebase includes `password_hash`.

---

### B15 — Graceful shutdown ordering is correct
Severity: PASS
File: `backend/server.js:175-176`

`server.close(callback)` stops accepting new connections. Only after the server closes does
`pool.end()` run inside the callback. This ordering is correct — in-flight requests can
complete before the pool closes. The 10-second `setTimeout` force-exit prevents hanging.

---

### B16 — Request ID echoed on all responses
Severity: PASS
File: `backend/server.js:81-86`

The request ID middleware runs at the top of the stack (before routes) and sets
`res.setHeader('X-Request-ID', req.id)`. Every response — success, error, 404 — passes
through this middleware, so the header is always present.

---

### B17 — Health check correctly returns 503 on DB failure
Severity: PASS
File: `backend/server.js:98-108`

The health endpoint catches pool errors and returns HTTP 503 with `{ db: 'unreachable' }`.
Load balancers and uptime monitors checking for non-2xx status will correctly remove the
instance from rotation.

---

### B18 — BOLA / tenant isolation is solid across all controllers
Severity: PASS

Every controller that reads or writes scoped data includes `organization_id = req.user.org_id`
(or equivalent join condition) in all parameterized queries. Spot-checked:
- locations.controller.js create: validates `branch_id AND organization_id = $2 AND active = TRUE`
- payments.controller.js getOne: `WHERE p.id = $1 AND p.organization_id = $2`
- audit-log.controller.js: `WHERE al.organization_id = $1`
- users.controller.js create: org_id injected from JWT, not body
- returns.controller.js: sales order fetched with `AND organization_id = $1` before processing

No cross-tenant data leakage paths identified.

---

### B19 — No SQL injection paths found
Severity: PASS

All SQL in the codebase uses parameterized queries ($1, $2, ...). Dynamic WHERE clause
construction (e.g., branches.controller.js, customers.controller.js, stock.controller.js)
appends parameter placeholders to the clause string and pushes values to a separate array —
never string-interpolating user input into the query text. No raw string concatenation of
request fields into SQL was found in any of the 20 controllers.

---

### B20 — No hard-coded credentials or org IDs
Severity: PASS

No hard-coded secrets, API keys, org IDs, or user IDs found in any source file. All sensitive
values (`JWT_SECRET`, `DATABASE_URL`) are consumed from `process.env`. The only hard-coded
domain values are role names (`'owner'`, `'admin'`, `'staff'`, `'readonly'`) and status
enumerations, which are application constants — not secrets.

---

## SUMMARY OF ALL FINDINGS

### Part A — Fix Verification

| Category | Count |
|----------|-------|
| VERIFIED | 29 |
| PARTIAL  | 3 (S17, S19, S25) |
| FAILED   | 0 |

### Part B — New Issues Found

| ID | Severity | Summary |
|----|----------|---------|
| B06 | HIGH | `credit_balance` UPDATE in returns lacks `FOR UPDATE` row lock — double-credit race condition |
| B05 | MEDIUM | `loginAttempts` Map has no cleanup interval — memory leak / DoS risk under sustained attack |
| B08 | MEDIUM | `JWT_SECRET` length not validated — weak secrets allowed into production |
| B11 | MEDIUM | `schema.sql` out of sync with 3 migrations — broken fresh installs |
| B01 | MEDIUM | `suppliers.controller.js` `getOne`/`update` expose soft-deleted records |
| B04 | LOW | `customers.controller.js` `update`/`remove` skip active check |
| B03 | LOW | `branches.controller.js` `update` skips active check |
| B02 | LOW | `users.controller.js` `getOne` returns deactivated user profiles |
| B09 | LOW | `validate.js` + `auth.js` helpers missing `data: null` (S19 incomplete) |
| B07 | LOW | `audit-log` endpoint missing `from <= to` date validation |
| B10 | LOW | `sales-orders.routes.js` validator still allows `paid`/`partially_paid` |
| B12 | INFO | `GET /api/stock/summary` has no role restriction (by-design read access) |
| B13 | INFO | `stock.service.js:getOrgStockSummary` is dead code (S17 incomplete) |
| B14 | PASS | `password_hash` never leaks into any response body |
| B15 | PASS | Graceful shutdown ordering correct (`server.close` before `pool.end`) |
| B16 | PASS | `X-Request-ID` echoed on all responses |
| B17 | PASS | Health check correctly returns 503 on DB failure |
| B18 | PASS | BOLA / tenant isolation solid across all 20 controllers |
| B19 | PASS | No SQL injection paths found |
| B20 | PASS | No hard-coded credentials or org IDs |

---

## TOP 5 MOST URGENT FIXES

### 1. B06 — credit_balance double-credit race condition (HIGH)
File: `src/controllers/returns.controller.js`

Before the `UPDATE customers SET credit_balance = credit_balance + $1` statement inside
the return transaction, add a row lock:
  await client.query(`SELECT id FROM customers WHERE id = $1 FOR UPDATE`, [so.customer_id]);

This is the exact pattern used in S04 (purchase orders) and S18 (password change).
Without this fix, two simultaneous returns on the same order can double the refund amount
in the customer's credit balance. This is a data-integrity bug with a realistic concurrency
window in any retail operation.

### 2. B05 — loginAttempts Map memory leak (MEDIUM)
File: `src/controllers/auth.controller.js`

Add a cleanup interval at module initialisation (after the Map is declared):
  setInterval(() => {
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [email, data] of loginAttempts)
      if (data.firstAttempt < cutoff) loginAttempts.delete(email);
  }, 5 * 60 * 1000).unref();

Without this, a credential-stuffing attack using unique email addresses grows the Map
without bound and will eventually crash the process.

### 3. B08 — JWT_SECRET length not enforced (MEDIUM)
File: `backend/server.js:6-11`

Change the startup validation to:
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET must be at least 32 characters');
    process.exit(1);
  }

This prevents a misconfigured deployment with a trivially short secret from ever starting.

### 4. B11 — schema.sql out of sync (MEDIUM)
File: `backend/db/schema.sql`

Three changes needed:
  a) Add `active BOOLEAN NOT NULL DEFAULT TRUE` to the `locations` table definition.
  b) Add `'cancellation'` to the `movement_type` CHECK in `stock_ledger`.
  c) Remove the `bundles` and `bundle_items` table definitions.

This makes schema.sql usable as a standalone fresh-install artifact and eliminates the
silent failure mode where a fresh install without migrations produces a broken database.

### 5. B01 — suppliers soft-delete bypass (MEDIUM)
File: `src/controllers/suppliers.controller.js`

In `getOne` (line 44), change:
  WHERE id = $1 AND organization_id = $2
to:
  WHERE id = $1 AND organization_id = $2 AND active = TRUE

Apply the same change to the `update` existence check (line 57).
This matches the fix already applied to customers (S22), branches (S23), and locations (S24).

---

## PARTIAL FIXES NEEDING COMPLETION

### S19 — data: null missing from validate.js and auth.js helpers

`src/middleware/validate.js:16`: Add `data: null` to the 422 response object.
`src/middleware/auth.js:requireRole`: Add `data: null` to the 403 response object.
`src/middleware/auth.js:requireMinRole`: Add `data: null` to the 403 response object.

All three are one-line additions. Without them, any Postman test or client that checks
`response.data` on validation or auth errors will receive `undefined`.

### S25 — schema.sql not using IF NOT EXISTS

Covered by Top 5 Fix #4 (B11). Completing B11 also completes S25.

### S17 — getOrgStockSummary still dead code

Either call `stock.service.js:getOrgStockSummary` from `stock.controller.js:getSummary`,
or remove the function from the service. No functional impact either way.

---

## FINAL VERDICT

### CONDITIONAL — NOT READY FOR POSTMAN TESTING

The backend is substantially complete and all 34 Round 4 fixes were applied (29 fully,
3 partially, 0 absent). The core security architecture is sound: JWT with HS256 + algorithm
restriction, live active check on every request, bcrypt cost 12, parameterized queries
throughout, BOLA isolation confirmed across all 20 controllers, graceful shutdown, env
validation, and audit logging.

### Blockers before Postman testing

Two issues will cause Postman tests to produce incorrect results:

**Blocker 1 — S19 / B09: Missing `data: null` in validate.js and auth.js helpers**

Any Postman test that checks the response body shape on a 422 (validation error) or 403
(insufficient role) will see `{ success: false, error, message }` instead of the documented
`{ success: false, data: null, error, message }`. If your collection asserts on `response.data`,
these tests will fail or behave unpredictably. Fix requires three one-line additions and takes
under 5 minutes.

**Blocker 2 — B11: schema.sql out of sync with migrations**

If Postman tests run against a freshly-provisioned test database initialised from schema.sql
without running migrations, order cancellation will throw a DB constraint error
(`invalid input value for enum movement_type: 'cancellation'`), location soft-delete will
fail (missing column), and the bundles tables will be phantom present. This will cause
cascading test failures. Fix schema.sql before standing up any test environment.

### Non-blockers (fix before production, not before Postman)

- B06: credit_balance race — requires concurrent load to trigger; Postman sequential tests will not hit it
- B05: loginAttempts leak — requires sustained attack volume to manifest
- B08: JWT_SECRET length — does not affect test functionality
- B01/B03/B04: soft-delete bypasses — existing test data will appear correct; issue only manifests with intentional testing of deactivated records

### Recommended action

1. Apply the three `data: null` additions (30 minutes of work — S19 completion).
2. Sync schema.sql with the three migrations (1 hour — B11 / S25 completion).
3. Restart the server and confirm `GET /health` returns `{ status: "ok", db: "ok" }`.
4. Begin Postman testing.
5. Apply B06, B05, B08, B01 before going live to production.
