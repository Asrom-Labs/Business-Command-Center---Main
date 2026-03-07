# BCC Version History

**Project:** Business Command Center — Backend
**Stack:** Node.js 20+ / Express 4 / PostgreSQL / pg
**Repository branch:** `main`

---

## v0.6.0 — Final Production Audit
**Date:** March 7, 2026
**Commit:** `976982d`

Final audit and hardening pass before Postman integration testing.

**P1 — Auth lockout audit logging:**
- `auth.controller.js`: Added `auditService.log()` call inside the 429 lockout branch, wrapped in try/catch so a logging failure cannot suppress the 429 response. Lockout events are now permanently recorded.

**P2 — Graceful shutdown force-exit timer:**
- `server.js`: Changed `setTimeout(…, 10000)` to `setTimeout(…, 10000).unref()` on the force-exit timer. Prevents the timer from keeping the Node.js event loop alive if the server closes cleanly before the 10-second timeout.

**P3 — Branches 404 responses:**
- `branches.controller.js`: Added `data: null` to both 404 responses (`getOne` and `update`) that were missing it.

**P4 — Suppliers `remove` active guard:**
- `suppliers.controller.js` `remove`: Added `AND active = TRUE` to the pre-delete ownership check, consistent with `getOne` and `update`. Previously an already-inactive supplier could be "deleted" again without error.

**RC5 — Global RC sweep (all controllers):**
- Grep found 40+ 404 responses missing `data: null` across 12 controllers not covered by P1–P4.
- Applied batch fix to: `categories`, `organizations`, `locations`, `expenses`, `product-variants`, `purchase-orders`, `sales-orders`, `transfers`, `users`, `units`, `customers`, `payments`.
- Final grep confirmed: zero 404 responses without `data: null` remain in the codebase.

**Files changed:** 18 files, 52 insertions(+), 48 deletions(-)

---

## v0.5.0 — Third Audit Round (interrupted)
**Date:** March 6, 2026

Partial application of P1–P4 fixes from the third audit round. Session was interrupted before all fixes were fully verified and committed. The complete and verified state was carried forward to v0.6.0.

---

## v0.4.0 — Second Audit: Security Hardening & Race Condition Fixes
**Date:** Late February 2026
**Commit:** `4dfd502`

Comprehensive security hardening pass and race condition elimination.

**Security fixes:**
- B08: Startup validation — server exits immediately if `DATABASE_URL` or `JWT_SECRET` is missing, or if `JWT_SECRET` is shorter than 32 characters.
- B09: JWT live `active` check — `authenticate` middleware now queries the database on every request to confirm the user is still active. Deactivated users are rejected even if their token has not expired.
- B10: Login attempts — in-memory lockout map: 5 failed attempts within 15 minutes → 429 for the remaining window. Lockout map is cleaned up every 5 minutes via `setInterval(...).unref()`.
- Rate limiters: Auth routes capped at 20 requests/15 min; all other API routes at 500 requests/15 min.
- Password input length capped at 72 characters (bcrypt maximum).
- S12: Request ID middleware — `X-Request-ID` header propagated on all responses.
- Conditional Morgan logging: `combined` format in production, `dev` in development, disabled in test.

**Race condition fixes:**
- B06: Returns double-credit — `SELECT ... FOR UPDATE` on customer row before updating `credit_balance` during a return.
- B07: Concurrent negative stock movements — `pg_advisory_xact_lock(hashtext(key))` in `stock.service.js:insertLedgerEntry` serializes concurrent stock writes for the same product/location.
- Stock adjust: Wrapped in `withTransaction` to use advisory lock.
- `SELECT ... FOR UPDATE` added to all confirm/cancel/payment/return operations that read-then-modify shared rows.

**Other fixes:**
- B11: `locations.active` column added to schema. List and getOne filter by `active = TRUE`.
- `cancellation` movement type added to `stock_ledger` CHECK constraint.
- Supplier `remove` now filters `active = TRUE`.

---

## v0.3.0 — First Comprehensive Audit
**Date:** Early February 2026
**Commit:** `f8fad17`

First full audit of the backend codebase after initial build. All modules reviewed.

**Key fixes:**
- Organization isolation: All database queries confirmed to filter by `req.user.org_id`.
- `withTransaction` pattern: All multi-step operations wrapped in explicit transactions.
- Stock ledger entries: Confirmed append-only (no UPDATE on stock_ledger anywhere).
- Input validation: `express-validator` applied consistently across all routes.
- Error handling: `isAppError` pattern established for controlled error responses.
- Response shape: `{ success, data, message }` enforced across all success paths.
- Error shape: `{ success: false, data: null, error: CODE, message }` established.
- `errorHandler` middleware in `src/middleware/errorHandler.js` handles all uncaught errors.
- Audit logging: `auditService.log()` called consistently across all create/update/delete operations.
- Soft-delete pattern confirmed: users, customers, branches, locations, suppliers, products, variants all use `active = FALSE`.
- `validate` middleware centralized: Reusable `src/middleware/validate.js` handles express-validator errors.

---

## v0.2.0 — Complete Backend Build
**Date:** January 2026
**Commit:** `5b1a368`

Full backend implementation across all 19 modules. 48 files added.

**Modules built:**
- Auth (register, login, me, password change)
- Organizations, Branches, Locations
- Users, Roles
- Categories, Units
- Products, Product Variants
- Stock (ledger, on-hand, adjust, summary)
- Transfers (create, confirm, cancel)
- Customers (with notes and credit balance)
- Suppliers
- Purchase Orders (with goods receipts)
- Sales Orders (with multi-channel support)
- Payments (with credit/store_credit logic)
- Returns (with stock restoration and customer credit)
- Expenses (with categories)
- Reports (dashboard, sales-by-day, top-products, sales-by-channel, expenses-by-category, low-stock)
- Audit Log

**Infrastructure:**
- `src/db/pool.js`: pg connection pool, `withTransaction` helper
- `src/services/stock.service.js`: `insertLedgerEntry`, `getStockOnHand`
- `src/services/audit.service.js`: `auditService.log`
- `src/middleware/auth.js`: `authenticate`, `requireRole`, `requireMinRole`
- `src/middleware/errorHandler.js`: Global error handler
- `src/middleware/validate.js`: express-validator integration
- `server.js`: Express app with helmet, cors, morgan, rate limiting, health check, graceful shutdown

**Database schema:** `db/schema.sql` v1.x — 27 tables, 53+ indexes, seed data

---

## v0.1.0 — Project Bootstrap
**Date:** January 2026
**Commit:** `671d814`

Initial commit. Repository structure established.

**Created:**
- `backend/` directory with `package.json`
- `.gitignore` (excludes `node_modules/`, `.env`)
- Base directory layout (`src/`, `db/`, `Docs/`, `Logs/`, `Audit-reports/`)
- Node.js project initialized with Express, pg, bcryptjs, jsonwebtoken, express-validator, helmet, cors, morgan, express-rate-limit, dotenv

---

## Upcoming (v0.7.0 — Postman Testing Phase)

**Status:** Planned
**Phase:** 2 — Integration Testing

- Postman collection covering all 20 modules
- Environment variable configuration (dev + Railway)
- Test scripts for auth token chaining
- Bug fixes discovered during testing
- Full regression run before frontend integration
