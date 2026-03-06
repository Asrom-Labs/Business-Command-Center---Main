# run_verification.md — BCC Backend Verification Protocol

This document defines the exact process for executing a full sign-off audit of the BCC backend
before any testing milestone. Follow every step in order. Do not skip files.

---

## Scope

- Verify every fix listed in FIXES_ROUND_4.md (S01–S34) was correctly implemented in code.
- Run a fresh audit for regressions and new issues not present in prior rounds (B01–B20 minimum).
- Produce VERIFICATION_ROUND_4.md with a final production-readiness verdict.

---

## Step 1 — Read context documents first

Read in this order:
1. FIXES_ROUND_4.md — the claimed fixes to verify
2. AUDIT_ROUND_4.md — the original findings that drove those fixes
3. README.md — documented API surface and response format
4. backend/.env.example — expected environment variables
5. backend/package.json — dependency list

---

## Step 2 — Read every source file (no skipping)

### Infrastructure
- backend/server.js
- backend/src/db/pool.js

### Middleware
- backend/src/middleware/auth.js
- backend/src/middleware/errorHandler.js
- backend/src/middleware/validate.js

### Services
- backend/src/services/audit.service.js
- backend/src/services/stock.service.js

### Controllers (all of them)
- backend/src/controllers/auth.controller.js
- backend/src/controllers/organizations.controller.js
- backend/src/controllers/branches.controller.js
- backend/src/controllers/locations.controller.js
- backend/src/controllers/users.controller.js
- backend/src/controllers/categories.controller.js
- backend/src/controllers/units.controller.js
- backend/src/controllers/products.controller.js
- backend/src/controllers/product-variants.controller.js
- backend/src/controllers/transfers.controller.js
- backend/src/controllers/customers.controller.js
- backend/src/controllers/suppliers.controller.js
- backend/src/controllers/purchase-orders.controller.js
- backend/src/controllers/sales-orders.controller.js
- backend/src/controllers/returns.controller.js
- backend/src/controllers/payments.controller.js
- backend/src/controllers/expenses.controller.js
- backend/src/controllers/stock.controller.js
- backend/src/controllers/reports.controller.js
- backend/src/controllers/audit-log.controller.js

### Routes (all of them)
- backend/src/routes/auth.routes.js
- backend/src/routes/organizations.routes.js
- backend/src/routes/branches.routes.js
- backend/src/routes/locations.routes.js
- backend/src/routes/users.routes.js
- backend/src/routes/categories.routes.js
- backend/src/routes/units.routes.js
- backend/src/routes/products.routes.js
- backend/src/routes/product-variants.routes.js
- backend/src/routes/transfers.routes.js
- backend/src/routes/customers.routes.js
- backend/src/routes/suppliers.routes.js
- backend/src/routes/purchase-orders.routes.js
- backend/src/routes/sales-orders.routes.js
- backend/src/routes/returns.routes.js
- backend/src/routes/payments.routes.js
- backend/src/routes/expenses.routes.js
- backend/src/routes/stock.routes.js
- backend/src/routes/reports.routes.js
- backend/src/routes/audit-log.routes.js

### Database
- backend/db/schema.sql
- backend/db/migrations/002_add_cancellation_movement_type.sql
- backend/db/migrations/003_add_locations_active.sql
- backend/db/migrations/004_drop_bundles.sql
- backend/db/migrations/README.md

---

## Step 3 — Part A: Verify each S-series fix

For each S01–S34 item, find the exact file and line(s) where the fix was applied.
Assign one of:
- VERIFIED — fix is present and correct
- PARTIAL  — fix exists but incomplete (e.g., only one of multiple locations updated)
- FAILED   — fix is absent or incorrectly applied

Record file:line for every finding.

---

## Step 4 — Part B: Fresh audit

Investigate every item in the B01–B20 list:

B01  BOLA / tenant isolation — every parameterized query must include organization_id from JWT
B02  SQL injection — no raw string interpolation in any query
B03  Role gaps — every write/delete endpoint must have requireMinRole at correct level
B04  loginAttempts Map cleanup — must have periodic GC or TTL eviction
B05  Transaction integrity — multi-step mutations must use withTransaction
B06  credit_balance concurrency — customer row must be locked before update
B07  Hard-coded values / magic numbers — check for hard-coded secrets or org IDs
B08  Audit-log date range validation — from <= to guard must exist
B09  JWT_SECRET entropy enforcement — minimum length checked at startup
B10  schema.sql vs migrations drift — schema must be consistent with applied migrations
B11  Soft-delete consistency — getOne/update must check active = TRUE everywhere
B12  Pagination max-limit consistency — check for outlier limits
B13  Error response shape — data: null must be present in ALL error paths
B14  Password not returned in any response — verify no password_hash in response body
B15  Graceful shutdown correctness — server.close then pool.end ordering
B16  Request ID echoed on all responses — X-Request-ID in every response
B17  Health check correctness — returns 503 with db: unreachable on DB failure
B18  Sales order validator vs controller alignment — isIn must match allowed transitions
B19  Dead code — identify any exported functions never imported elsewhere
B20  Schema FKs and CHECK constraints — verify all constraints align with code behavior

---

## Step 5 — Write output

Write VERIFICATION_ROUND_4.md to the project root containing:
1. Full Part A table (ID | Verdict | File:Line | Notes)
2. Grouped Part B findings with severity and exact file:line
3. Top 5 most urgent fixes
4. Final verdict: READY FOR POSTMAN TESTING / NOT READY (with blockers listed)
