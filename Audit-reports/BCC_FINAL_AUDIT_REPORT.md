# BCC Backend — Final Audit Report

**Date:** 2026-03-07
**Auditor:** Claude (claude-sonnet-4-6)
**Backend Version:** v0.6.0 (commit `976982d`)
**Scope:** Complete pre-frontend audit — 54 files across all layers

---

## Audit Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 0 | — |
| HIGH | 1 | Open |
| MEDIUM | 4 | Open |
| LOW | 4 | Open |
| **Total** | **9** | |

**Overall Verdict: READY FOR FRONTEND — no critical blockers. Apply HIGH fix before first frontend release; MEDIUM and LOW can be batched into v0.7.x.**

---

## Issue Index

| ID | Severity | Area | Title |
|----|----------|------|-------|
| H-01 | HIGH | API Correctness | Missing `data: null` in non-404 error responses (~15 sites) |
| M-01 | MEDIUM | Business Logic | Inactive products returned in list and getOne |
| M-02 | MEDIUM | Business Logic | Inactive variants returned in list |
| M-03 | MEDIUM | Data Integrity | `variant_id` not validated to belong to `product_id` |
| M-04 | MEDIUM | Data Integrity | PO create accepts deactivated suppliers |
| L-01 | LOW | API Correctness | PATCH variant response missing `effective_price`/`effective_cost` |
| L-02 | LOW | Business Logic | Low-stock filter includes products with zero threshold |
| L-03 | LOW | Business Logic | Notes can be added to deactivated customers |
| L-04 | LOW | Security | Weak JWT_SECRET in .env — must be replaced before production |

---

## Clean Areas

| Area | Verdict | Notes |
|------|---------|-------|
| Security — Authentication | PASS | JWT HS256, 24h expiry, live `active` DB check on every request |
| Security — Authorization | PASS | All routes use `authenticate`; role gates use `requireMinRole` |
| Security — Injection | PASS | All queries fully parameterized — zero string concatenation of user input |
| Security — Rate Limiting | PASS | Global 100/15min + auth 10/15min; login lockout 5/15min in-memory |
| Security — Headers | PASS | Helmet enabled with sensible defaults |
| Security — CORS | PASS | Explicit allowlist via `ALLOWED_ORIGINS`; credentials allowed |
| Security — Error Leakage | PASS | `errorHandler` hides stack/message in production for 500s |
| Data Integrity — Transactions | PASS | All multi-step writes use `withTransaction`; ROLLBACK on error |
| Data Integrity — Row Locking | PASS | `SELECT ... FOR UPDATE` in payments, returns, transfers, PO status |
| Data Integrity — Stock Ledger | PASS | Advisory lock (`pg_advisory_xact_lock`) serializes concurrent negative movements |
| Data Integrity — Org Isolation | PASS | Every query filters `organization_id = req.user.org_id` from JWT |
| Data Integrity — Tenant Leakage | PASS | org_id sourced from JWT exclusively — never from request body |
| Business Logic — Status Machines | PASS | PO, sales order, transfer, return status transitions fully validated |
| Business Logic — Stock Deduction | PASS | Sales orders deduct stock atomically within transaction |
| Business Logic — Goods Receipts | PASS | Stock added via `insertLedgerEntry`; PO status auto-updates |
| Business Logic — Transfers | PASS | Stock moves on confirm only; advisory lock prevents race |
| Code Quality — Response Contract | PARTIAL | See H-01 — success paths follow contract; some error paths do not |
| Code Quality — Error Handling | PASS | All controllers use `try/catch → next(err)`; centralized handler |
| Code Quality — Startup | PASS | `process.exit(1)` on missing/short JWT_SECRET or DATABASE_URL |
| Code Quality — Graceful Shutdown | PASS | SIGTERM/SIGINT → `server.close()` → `pool.end()` → 10s fallback |
| Database Schema — Constraints | PASS | FKs, NOT NULL, partial unique indexes all appropriate |
| Database Schema — Indexes | PASS | 53 indexes covering all FK columns and high-frequency filter columns |
| Validation — Input Sanitization | PASS | `express-validator` on all mutation routes; `validate` middleware returns 422 |
| Services — Audit Log | PASS | All create/update/delete/status-change actions logged |
| Services — Stock | PASS | `insertLedgerEntry` validates stock before deduction; never modifies ledger rows |
| Dependencies | PASS | No known vulnerable packages; `bcryptjs` rounds=12; no dev deps in prod |

---

## Detailed Findings

---

### H-01 — Missing `data: null` in Non-404 Error Responses

**Severity:** HIGH
**Area:** API Correctness
**Status:** Open

**Description:**
The documented API envelope contract requires all error responses to include `data: null`. This is enforced correctly for 404 responses (`res.status(404).json({ success: false, data: null, ... })`), but is systematically absent from inline 400, 403, 409, and 422 error responses across multiple controllers. Frontend code that expects `response.data` to always be present (even `null`) will fail unpredictably.

**Affected files and approximate sites:**

| Controller | Response Type | Missing `data: null` |
|------------|--------------|----------------------|
| `branches.controller.js` | 400 NO_CHANGES | Yes |
| `locations.controller.js` | 400 NO_CHANGES | Yes |
| `organizations.controller.js` | 400 NO_CHANGES | Yes |
| `products.controller.js` | 400 NO_CHANGES | Yes |
| `product-variants.controller.js` | 400 NO_CHANGES | Yes |
| `customers.controller.js` | 400 NO_CHANGES | Yes |
| `suppliers.controller.js` | 400 NO_CHANGES | Yes |
| `expenses.controller.js` | 400 NO_CHANGES (×2) | Yes |
| `expenses.controller.js` | 409 DUPLICATE_ENTRY (expense_categories) | Yes |
| `transfers.controller.js` | 422 inline errors | Yes |
| `stock.controller.js` | 400 VALIDATION_ERROR (×2) | Yes |
| `users.controller.js` | 400 NO_CHANGES | Yes |

**Example (products.controller.js — typical pattern):**
```javascript
// Current (wrong):
return res.status(400).json({ success: false, error: 'NO_CHANGES', message: '...' });

// Correct:
return res.status(400).json({ success: false, data: null, error: 'NO_CHANGES', message: '...' });
```

**Fix:** Add `data: null` to every inline error response that is missing it. Approximately 15 sites. A global search for `success: false` without `data: null` on the same line will locate all instances.

**Why HIGH:** Frontend code will destructure `response.data` on error paths. Without `data: null`, the field is `undefined`, not `null`, which breaks null checks (`if (response.data === null)`) and may cause runtime errors in frontend state management.

---

### M-01 — Inactive Products Returned in List and GetOne

**Severity:** MEDIUM
**Area:** Business Logic
**Status:** Open

**Description:**
`products.controller.js` does not filter by `active = TRUE` in the `list` function by default, nor does `getOne` verify the product is active. Deactivated products are visible to all users unless the frontend explicitly filters them. This inconsistency can surface deleted products in search results and product pickers.

**Affected code:**

`list` — current WHERE clause:
```sql
WHERE p.organization_id = $1
-- missing: AND p.active = TRUE (as default, unless caller sets active=false filter)
```

`getOne` — current WHERE clause:
```sql
WHERE p.id = $1 AND p.organization_id = $2
-- missing: AND p.active = TRUE
```

**Note:** The `active` query param is supported in `list` but defaults to returning all records regardless of `active` state. The intent of soft-delete is that deactivated records do not appear in normal lookups.

**Fix:**
- `list`: Default `active` filter to `TRUE` unless caller explicitly passes `?active=false` (staff/admin use case for viewing deactivated products).
- `getOne`: Add `AND p.active = TRUE`. Return 404 for deactivated products (same behavior as hard-deleted).

---

### M-02 — Inactive Variants Returned in List

**Severity:** MEDIUM
**Area:** Business Logic
**Status:** Open

**Description:**
`product-variants.controller.js` `list` function returns all variants for a product including those with `active = FALSE`. Deactivated variants (which are soft-deleted via `DELETE /api/products/:productId/variants/:id`) appear in the response.

**Affected code (`list` query):**
```sql
SELECT pv.*, ...
FROM product_variants pv
JOIN products p ON p.id = pv.product_id
WHERE pv.product_id = $1 ORDER BY pv.name ASC
-- missing: AND pv.active = TRUE
```

**Fix:** Add `AND pv.active = TRUE` to the WHERE clause in `list`. Add `AND pv.active = TRUE` to `getOne` as well, returning 404 for deactivated variants.

---

### M-03 — `variant_id` Not Validated to Belong to `product_id`

**Severity:** MEDIUM
**Area:** Data Integrity
**Status:** Open

**Description:**
In `sales-orders.controller.js`, `transfers.controller.js`, and `purchase-orders.controller.js`, when a caller supplies both `product_id` and `variant_id` for a line item, only `product_id` is validated against the organization. `variant_id` is inserted into the ledger without verifying it belongs to `product_id`. A caller could pair Product A's `product_id` with Product B's `variant_id`, creating corrupted stock ledger entries.

**Affected create functions:**
- `sales-orders.controller.js` → sales order items loop
- `transfers.controller.js` → transfer items loop
- `purchase-orders.controller.js` → PO items loop

**Example fix (add to item validation loop when `variant_id` is provided):**
```javascript
if (variant_id) {
  const varChk = await client.query(
    `SELECT id FROM product_variants WHERE id = $1 AND product_id = $2 AND active = TRUE`,
    [variant_id, product_id]
  );
  if (!varChk.rows.length) {
    const err = new Error('Variant does not belong to the specified product');
    err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
  }
}
```

---

### M-04 — Purchase Order Create Accepts Deactivated Suppliers

**Severity:** MEDIUM
**Area:** Data Integrity
**Status:** Open

**Description:**
`purchase-orders.controller.js` `create` validates that the supplier belongs to the organization but does not check `active = TRUE`. A PO can be created against a soft-deleted (deactivated) supplier.

**Affected code:**
```javascript
// Current:
const supChk = await client.query(
  `SELECT id FROM suppliers WHERE id = $1 AND organization_id = $2`,
  [supplier_id, orgId]
);

// Fix:
const supChk = await client.query(
  `SELECT id FROM suppliers WHERE id = $1 AND organization_id = $2 AND active = TRUE`,
  [supplier_id, orgId]
);
```

**Note:** Update error message to `'Supplier not found or is inactive'` to give the caller actionable feedback.

---

### L-01 — PATCH Variant Response Missing `effective_price`/`effective_cost`

**Severity:** LOW
**Area:** API Correctness
**Status:** Open

**Description:**
`product-variants.controller.js` `update` uses `RETURNING *` which does not include the computed `effective_price`/`effective_cost` fields. All other variant endpoints (list, create, getOne) now return these fields (fixed in v0.6.0), but `update` is inconsistent.

**Affected code:**
```javascript
// Current:
const result = await pool.query(
  `UPDATE product_variants SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, vals
);
```

**Fix:** After the UPDATE, run the same SELECT as `getOne` using the returned `id`, or add a subquery to the RETURNING clause:
```sql
UPDATE product_variants SET ... WHERE id = $n
RETURNING *,
  COALESCE(price, (SELECT price FROM products WHERE id = product_id)) AS effective_price,
  COALESCE(cost,  (SELECT cost  FROM products WHERE id = product_id)) AS effective_cost
```

---

### L-02 — Low-Stock Filter Includes Products with Zero Threshold

**Severity:** LOW
**Area:** Business Logic
**Status:** Open

**Description:**
`stock.controller.js` `getStock` with `?low_stock=true` uses the condition:
```sql
AND COALESCE(SUM(sl.qty_change), 0) <= p.low_stock_threshold
```

This includes products where `low_stock_threshold = 0` and `stock_on_hand = 0`. These products have never had a threshold configured and should not appear as "low stock" alerts — they are simply out-of-stock products with no threshold set.

**Fix:** Add `AND p.low_stock_threshold > 0` to the low-stock filter condition so only products with an intentional threshold trigger the alert.

---

### L-03 — Notes Can Be Added to Deactivated Customers

**Severity:** LOW
**Area:** Business Logic
**Status:** Open

**Description:**
`customers.controller.js` `addNote` does not verify the customer is active before inserting a note. Notes can be attached to soft-deleted customers.

**Affected code:**
```javascript
// Current:
const chk = await pool.query(
  `SELECT id FROM customers WHERE id = $1 AND organization_id = $2`,
  [req.params.id, orgId]
);

// Fix:
const chk = await pool.query(
  `SELECT id FROM customers WHERE id = $1 AND organization_id = $2 AND active = TRUE`,
  [req.params.id, orgId]
);
```

---

### L-04 — Weak JWT_SECRET in .env

**Severity:** LOW (CRITICAL in production)
**Area:** Security
**Status:** Open — development environment only

**Description:**
The `.env` file contains:
```
JWT_SECRET=bcc_super_secret_jwt_key_2024_do_not_share
```

This is a predictable, dictionary-based string. Any attacker who knows this value can forge valid JWTs for any user or organization. The value is 44 characters (meets the 32-char minimum enforced by `server.js`) but is not cryptographically random.

**The file is untracked by git (`?? backend/.env`) — it has never been committed. This is correct.**

**Fix (before any production deployment):**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Replace the current `JWT_SECRET` value with the output (128-char hex string). Rotate all existing JWTs after the change by incrementing a token version or simply deploying — all existing tokens will immediately become invalid.

**Note for development:** The current value is acceptable for local development only. It must be replaced with a cryptographically random value for any staging or production environment.

---

## Detailed Findings by Audit Area

### Area 1 — Security

| Check | Result | Notes |
|-------|--------|-------|
| SQL injection | PASS | All queries use parameterized `$1..$n` — no string concatenation of user input anywhere |
| JWT verification | PASS | `jsonwebtoken.verify` with secret; malformed/expired tokens → 401 |
| Password hashing | PASS | bcryptjs with saltRounds=12 |
| Auth middleware coverage | PASS | All non-auth routes have `router.use(authenticate)` |
| Role enforcement | PASS | `requireMinRole` uses ROLE_HIERARCHY map; no role bypasses found |
| Live account check | PASS | `authenticate` queries `users.active` on every request — deactivated users cannot use valid tokens |
| Rate limiting | PASS | `express-rate-limit` global + auth-specific; login lockout in-memory |
| CORS | PASS | Explicit origin allowlist; wildcard `*` not used |
| Helmet | PASS | Enabled with defaults |
| Error message leakage | PASS | 500 errors show generic message in production; stack never sent to client |
| .env not in git | PASS | `?? backend/.env` — confirmed untracked |
| JWT_SECRET strength | FAIL (L-04) | Current value is human-readable; must be replaced for production |
| XSS | PASS | No HTML rendering; all responses are JSON |
| IDOR | PASS | Every resource lookup includes `organization_id = $orgId` from JWT |

---

### Area 2 — Data Integrity

| Check | Result | Notes |
|-------|--------|-------|
| Multi-step writes use transactions | PASS | auth.register, transfers, PO, sales orders, returns, payments all use `withTransaction` |
| Row locking for concurrent writes | PASS | `SELECT ... FOR UPDATE` in payments, returns, transfers confirm, PO status |
| Advisory lock for stock | PASS | `pg_advisory_xact_lock(hashtext(product_id || location_id))` in `insertLedgerEntry` |
| Stock ledger append-only | PASS | No UPDATE/DELETE on `stock_ledger` anywhere in codebase |
| Org isolation | PASS | JWT org_id used exclusively; never from request body |
| FK validation before insert | PASS | supplier, location, product validated before PO items inserted |
| Active supplier check on PO create | FAIL (M-04) | Missing `AND active = TRUE` on supplier lookup |
| variant_id cross-product validation | FAIL (M-03) | variant_id not checked against product_id in SO/Transfer/PO |
| Duplicate prevention | PASS | Unique constraints + application-level checks (e.g., units system name check) |

---

### Area 3 — API Correctness

| Check | Result | Notes |
|-------|--------|-------|
| Response envelope — success paths | PASS | All success responses: `{ success: true, data, message }` |
| Response envelope — 404 paths | PASS | All 404s include `data: null` |
| Response envelope — other error paths | FAIL (H-01) | ~15 non-404 error responses missing `data: null` |
| HTTP status codes | PASS | 200/201/400/401/403/404/409/422/429/500 used correctly |
| Pagination shape | PASS | `{ page, limit, total, totalPages }` consistent across all list endpoints |
| effective_price/effective_cost on list | PASS | Fixed in v0.6.0 |
| effective_price/effective_cost on create | PASS | Fixed in v0.6.0 |
| effective_price/effective_cost on getOne | PASS | Fixed in v0.6.0 |
| effective_price/effective_cost on update | FAIL (L-01) | RETURNING * — computed fields absent from PATCH response |
| unit_cost alias on PO getOne | PASS | Fixed in v0.6.0 |

---

### Area 4 — Business Logic

| Check | Result | Notes |
|-------|--------|-------|
| Active filter — products list | FAIL (M-01) | No default `active = TRUE` filter |
| Active filter — products getOne | FAIL (M-01) | No `active = TRUE` check |
| Active filter — variants list | FAIL (M-02) | No `active = TRUE` filter |
| Active filter — variants getOne | FAIL (M-02) | No `active = TRUE` check |
| Active filter — customers/suppliers/users | PASS | Soft-delete via `active = FALSE`; list endpoints filter correctly |
| Transfer status machine | PASS | pending → confirmed/cancelled only; no invalid transitions |
| PO status machine | PASS | draft → submitted → partially_received/received/cancelled |
| Sales order status machine | PASS | Valid transitions enforced |
| PO auto-status after receive | PASS | `partially_received` vs `received` computed from actual quantities |
| Stock not moved on transfer create | PASS | Stock moves only on confirm |
| Stock deducted on sales order create | PASS | `insertLedgerEntry` called for each item in transaction |
| Return stock restoration | PASS | `return` movement type adds stock back via ledger |
| Low-stock threshold=0 false positives | FAIL (L-02) | Products with threshold=0 appear as low-stock when qty=0 |
| Notes on deactivated customers | FAIL (L-03) | No `active = TRUE` check in `addNote` |

---

### Area 5 — Code Quality

| Check | Result | Notes |
|-------|--------|-------|
| Consistent error handling | PASS | All controllers: `try/catch → next(err)` |
| Centralized error handler | PASS | `errorHandler.js` handles all known PG codes + app errors + JWT errors |
| No direct `res.send` bypass of envelope | PASS | All responses use `res.json({ success, ... })` |
| Dead code / unused imports | PASS | No dead code found |
| Startup validation | PASS | Missing env vars → `process.exit(1)` with clear message |
| Graceful shutdown | PASS | SIGTERM/SIGINT handled; pool closed; 10s fallback timer uses `.unref()` |
| In-memory lockout cleanup | PASS | `setInterval(...).unref()` — won't prevent process exit |

---

### Area 6 — Database Schema

| Check | Result | Notes |
|-------|--------|-------|
| All 27 tables present | PASS | Verified against schema.sql |
| FK constraints | PASS | All FK relationships defined with appropriate ON DELETE behavior |
| Partial unique indexes | PASS | SKU/barcode unique per-org, null-excluded (`WHERE sku IS NOT NULL`) |
| 53 indexes | PASS | All FK columns and common filter columns indexed |
| UUID PKs | PASS | All tables use `uuid DEFAULT gen_random_uuid()` |
| TIMESTAMPTZ timestamps | PASS | `created_at`, `updated_at` use TIMESTAMPTZ |
| Seed data | PASS | roles, system units, return_reasons seeded correctly |
| Migrations | PASS | 002 (cancellation type), 003 (locations.active), 004 (drop bundles) — all consistent with schema.sql |

---

### Area 7 — Validation Layer

| Check | Result | Notes |
|-------|--------|-------|
| All mutation routes validated | PASS | `express-validator` `body()` chains on all POST/PATCH routes |
| Query params validated | PASS | `query()` chains on list endpoints |
| `validate` middleware response shape | PASS | Returns `{ success: false, data: null, error: 'VALIDATION_ERROR', fields: [...] }` |
| Numeric range validation | PASS | `isInt({ min: 1 })` / `isFloat({ min: 0 })` on quantity/price/cost fields |
| UUID format validation | PASS | `isUUID(4)` on all ID params and body IDs |
| String length limits | PASS | `.isLength({ max: N })` on name/note fields |

---

### Area 8 — Services Layer

| Check | Result | Notes |
|-------|--------|-------|
| `stock.service.insertLedgerEntry` | PASS | Advisory lock, pre-deduction stock check, parameterized INSERT |
| `stock.service.getStockOnHand` | PASS | SUM(qty_change) with correct filter |
| `stock.service.getOrgStockSummary` | PASS | Aggregation query correct |
| `audit.service.log` | PASS | Simple parameterized INSERT; all mutation endpoints call it |
| `pool.withTransaction` | PASS | BEGIN/COMMIT/ROLLBACK/release pattern correct; client always released in finally |
| Pool configuration | PASS | SSL for remote hosts; 30s query_timeout; connection pool defaults |

---

## Files Audited

### Controllers (20)
`auth.controller.js`, `organizations.controller.js`, `branches.controller.js`, `locations.controller.js`, `users.controller.js`, `categories.controller.js`, `units.controller.js`, `products.controller.js`, `product-variants.controller.js`, `customers.controller.js`, `suppliers.controller.js`, `transfers.controller.js`, `purchase-orders.controller.js`, `sales-orders.controller.js`, `payments.controller.js`, `returns.controller.js`, `stock.controller.js`, `expenses.controller.js`, `reports.controller.js`, `audit-log.controller.js`

### Routes (20)
`auth.routes.js`, `organizations.routes.js`, `branches.routes.js`, `locations.routes.js`, `users.routes.js`, `categories.routes.js`, `units.routes.js`, `products.routes.js`, `product-variants.routes.js`, `customers.routes.js`, `suppliers.routes.js`, `transfers.routes.js`, `purchase-orders.routes.js`, `sales-orders.routes.js`, `payments.routes.js`, `returns.routes.js`, `stock.routes.js`, `expenses.routes.js`, `reports.routes.js`, `audit-log.routes.js`

### Middleware (3)
`auth.js`, `validate.js`, `errorHandler.js`

### Services (2)
`stock.service.js`, `audit.service.js`

### Infrastructure (6)
`db/pool.js`, `db/schema.sql`, `db/migrations/002_add_cancellation_movement_type.sql`, `db/migrations/003_add_locations_active.sql`, `db/migrations/004_drop_bundles.sql`, `server.js`

### Configuration (3)
`package.json`, `.env`, `package-lock.json`

**Total files audited: 54**

---

*Report generated by automated audit session. All findings are based on direct source code reads — no assumptions.*
