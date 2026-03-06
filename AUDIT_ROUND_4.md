# BCC Backend — Full Security, Integrity & Quality Audit
**Audit Date:** 2026-03-07
**Auditor:** Claude Sonnet 4.6 (acting as senior security engineer, principal backend architect, and QA lead)
**Codebase:** Business Command Center backend — Node.js / Express / PostgreSQL
**Files Read:** All 50 files (excluding node_modules)

---

## SUMMARY TABLE

| ID | Severity | Section | File:Line | Description |
|----|----------|---------|-----------|-------------|
| S01 | **Critical** | 1f | auth.js:21 | Deactivated users retain valid JWTs for up to 7 days — no token invalidation on deactivation |
| S02 | **Critical** | 1g | auth.routes.js | No login/failed-login audit logging — security monitoring is blind |
| S03 | **Critical** | 2d / 4d | returns.controller.js | Returns do NOT update `customer.credit_balance` — financial data corrupted silently |
| S04 | **Critical** | 2b | purchase-orders.controller.js:139 | `updateStatus` has no `SELECT FOR UPDATE` — status transition race condition |
| S05 | **Critical** | 5b | server.js:78 | Health check does not test DB connectivity — Railway thinks service is healthy when DB is down |
| S06 | **Critical** | 5c | server.js:112 | No SIGTERM / graceful shutdown — Railway deploys drop in-flight requests and corrupt DB connections |
| S07 | **Critical** | 5e | server.js | No `uncaughtException` / `unhandledRejection` handlers — crashes are silent |
| S08 | **Critical** | 5a | server.js / pool.js | No startup validation of required env vars — missing `JWT_SECRET` causes silent auth breakage |
| S09 | **High** | 1f | auth.js | 7-day JWT with no revocation mechanism — compromised token is valid a full week |
| S10 | **High** | 1c / 4b | sales-orders.routes.js:38 | Staff can manually set `status='paid'` without any payment existing — financial inconsistency |
| S11 | **High** | 3d | stock.controller.js:12 | `GET /api/stock` has no pagination — returns all products x all locations as one response |
| S12 | **High** | 5d | server.js:70 | `morgan('dev')` runs in production — not structured JSON; no correlation IDs; PII in URLs logged |
| S13 | **High** | 2e | sales-orders.controller.js:62 | Deactivated customers can be linked to new orders — missing `AND active = TRUE` |
| S14 | **High** | 2e | locations.controller.js:14 | Locations under inactive branches are returned in list — no `b.active = TRUE` filter |
| S15 | **High** | 1g | server.js:59 | No account lockout — distributed brute force bypasses per-IP rate limiting |
| S16 | **High** | 6a | schema.sql:125-138 | `bundles`/`bundle_items` schema exists but no routes/controllers/services — orphaned tables |
| S17 | **High** | 6a | stock.service.js:52 | `getOrgStockSummary()` is defined but never called — dead exported function |
| S18 | **Medium** | 2a | auth.controller.js:178 | `changePassword`: two separate pool queries without transaction — race condition on concurrent password change |
| S19 | **Medium** | 3a | errorHandler.js | Error responses omit `data` field; validate responses add `fields` — shape is not consistent |
| S20 | **Medium** | 3c | products.routes.js | `unit_id` not validated against org on product create/update — FK error returned instead of friendly 422 |
| S21 | **Medium** | 3c | multiple | Date range filters (`from`, `to`) not validated for logical ordering (`from <= to`) |
| S22 | **Medium** | 2e | customers.controller.js:43 | `GET /customers/:id` returns deactivated customers — inconsistent with list which filters `active=TRUE` |
| S23 | **Medium** | 2e | branches.controller.js:45 | `GET /branches/:id` returns deactivated branches — inconsistent with list |
| S24 | **Medium** | 2f | locations.controller.js | Locations have no `active` column and use hard DELETE — inconsistent soft-delete design |
| S25 | **Medium** | 5g | schema.sql | No formal migration system — running schema.sql on existing DB causes CREATE TABLE failures |
| S26 | **Medium** | 4c | auth.controller.js | Login (success AND failure) not logged to audit_log — security audit trail incomplete |
| S27 | **Medium** | 4a | expenses.routes.js | Expense categories have no GET single / PATCH endpoints |
| S28 | **Medium** | 4a | payments.controller.js | No GET single payment endpoint — payments can only be fetched per order |
| S29 | **Low** | 1i | auth.controller.js:114,182 | `SELECT *` used in login and changePassword fetches `password_hash` into memory unnecessarily |
| S30 | **Low** | 1f | auth.js:21 | `jwt.verify()` called without `{ algorithms: ['HS256'] }` option — defence-in-depth gap |
| S31 | **Low** | 6e | package.json | `uuid` package is installed but never `require()`d anywhere in the codebase |
| S32 | **Low** | 4b | sales-orders.controller.js:196 | `cancelled` orders use `movementType: 'adjustment'` for stock restoration — misleading in ledger |
| S33 | **Low** | 4a | — | No audit log read endpoint — admins cannot query the audit trail via API |
| S34 | **Low** | 6f | — | No README, no Swagger/OpenAPI spec — zero onboarding or API documentation |
| S35 | **Info** | 4g | reports.controller.js | Missing reports: P&L, inventory valuation, aged receivables, sales by customer, returns analysis |
| S36 | **Info** | 4e | schema.sql | Tax field stored but not computed — no tax calculation logic anywhere |
| S37 | **Info** | 4f | — | No inventory valuation (qty x cost) report or weighted-average cost tracking |

---

## SECTION 1 — ATTACK SURFACE AND SECURITY

### 1a. Complete Route Security Map

| Method | Full Path | Auth | Min Role | Org-Scoped | Verdict |
|--------|-----------|------|----------|------------|---------|
| GET | `/health` | No | None | No | Secure (intentional) |
| POST | `/api/auth/register` | No | None | No | Secure (public by design) |
| POST | `/api/auth/login` | No | None | No | Secure (public by design) |
| GET | `/api/auth/me` | Yes | any | Yes | Secure |
| PATCH | `/api/auth/password` | Yes | any | Yes | Secure |
| GET | `/api/organizations/me` | Yes | any | Yes | Secure |
| PATCH | `/api/organizations/me` | Yes | admin | Yes | Secure |
| GET | `/api/branches` | Yes | any | Yes | Secure |
| POST | `/api/branches` | Yes | admin | Yes | Secure |
| GET | `/api/branches/:id` | Yes | any | Yes | Secure |
| PATCH | `/api/branches/:id` | Yes | admin | Yes | Secure |
| DELETE | `/api/branches/:id` | Yes | owner | Yes | Secure |
| GET | `/api/locations` | Yes | any | Yes | Investigate (S14) |
| POST | `/api/locations` | Yes | admin | Yes | Secure |
| GET | `/api/locations/:id` | Yes | any | Yes | Secure |
| PATCH | `/api/locations/:id` | Yes | admin | Yes | Secure |
| DELETE | `/api/locations/:id` | Yes | owner | Yes | Secure (FK-protected) |
| GET | `/api/users` | Yes | admin | Yes | Secure |
| POST | `/api/users` | Yes | admin | Yes | Secure |
| GET | `/api/users/:id` | Yes | admin | Yes | Secure |
| PATCH | `/api/users/:id` | Yes | admin | Yes | Secure |
| DELETE | `/api/users/:id` | Yes | owner | Yes | Secure |
| GET | `/api/categories` | Yes | any | Yes | Secure |
| POST | `/api/categories` | Yes | admin | Yes | Secure |
| GET | `/api/categories/:id` | Yes | any | Yes | Secure |
| PATCH | `/api/categories/:id` | Yes | admin | Yes | Secure |
| DELETE | `/api/categories/:id` | Yes | admin | Yes | Secure |
| GET | `/api/units` | Yes | any | Yes + global | Secure |
| POST | `/api/units` | Yes | admin | Yes | Secure |
| GET | `/api/units/:id` | Yes | any | Yes + global | Secure |
| PATCH | `/api/units/:id` | Yes | admin | Yes | Secure |
| DELETE | `/api/units/:id` | Yes | admin | Yes | Secure |
| GET | `/api/products` | Yes | any | Yes | Secure |
| POST | `/api/products` | Yes | admin | Yes | Secure |
| GET | `/api/products/:id` | Yes | any | Yes | Secure |
| PATCH | `/api/products/:id` | Yes | admin | Yes | Secure |
| DELETE | `/api/products/:id` | Yes | admin | Yes | Secure |
| GET | `/api/products/:pid/variants` | Yes | any | Yes (via product) | Secure |
| POST | `/api/products/:pid/variants` | Yes | admin | Yes (via product) | Secure |
| GET | `/api/products/:pid/variants/:id` | Yes | any | Yes (via product) | Secure |
| PATCH | `/api/products/:pid/variants/:id` | Yes | admin | Yes (via product) | Secure |
| DELETE | `/api/products/:pid/variants/:id` | Yes | admin | Yes (via product) | Secure |
| GET | `/api/transfers` | Yes | any | Yes | Secure |
| POST | `/api/transfers` | Yes | staff | Yes | Secure |
| GET | `/api/transfers/:id` | Yes | any | Yes | Secure |
| POST | `/api/transfers/:id/confirm` | Yes | admin | Yes | Secure |
| POST | `/api/transfers/:id/cancel` | Yes | admin | Yes | Secure |
| GET | `/api/customers` | Yes | any | Yes | Secure |
| POST | `/api/customers` | Yes | staff | Yes | Secure |
| GET | `/api/customers/:id` | Yes | any | Yes | Secure |
| PATCH | `/api/customers/:id` | Yes | staff | Yes | Secure |
| DELETE | `/api/customers/:id` | Yes | admin | Yes | Secure |
| POST | `/api/customers/:id/notes` | Yes | staff | Yes | Secure |
| GET | `/api/suppliers` | Yes | any | Yes | Secure |
| POST | `/api/suppliers` | Yes | admin | Yes | Secure |
| GET | `/api/suppliers/:id` | Yes | any | Yes | Secure |
| PATCH | `/api/suppliers/:id` | Yes | admin | Yes | Secure |
| DELETE | `/api/suppliers/:id` | Yes | admin | Yes | Secure |
| GET | `/api/purchase-orders` | Yes | any | Yes | Secure |
| POST | `/api/purchase-orders` | Yes | admin | Yes | Secure |
| GET | `/api/purchase-orders/:id` | Yes | any | Yes | Secure |
| PATCH | `/api/purchase-orders/:id/status` | Yes | admin | Yes | Needs Fix (S04) |
| POST | `/api/purchase-orders/:id/receive` | Yes | staff | Yes | Secure |
| GET | `/api/sales-orders` | Yes | any | Yes | Secure |
| POST | `/api/sales-orders` | Yes | staff | Yes | Secure |
| GET | `/api/sales-orders/:id` | Yes | any | Yes | Secure |
| PATCH | `/api/sales-orders/:id/status` | Yes | staff | Yes | Needs Fix (S10) |
| GET | `/api/returns/reasons` | Yes | any | No (global data) | Secure |
| GET | `/api/returns` | Yes | any | Yes | Secure |
| POST | `/api/returns` | Yes | staff | Yes | Needs Fix (S03) |
| GET | `/api/returns/:id` | Yes | any | Yes | Secure |
| GET | `/api/expenses/categories` | Yes | any | Yes | Secure |
| POST | `/api/expenses/categories` | Yes | admin | Yes | Secure |
| DELETE | `/api/expenses/categories/:id` | Yes | admin | Yes | Secure |
| GET | `/api/expenses` | Yes | any | Yes | Secure |
| POST | `/api/expenses` | Yes | staff | Yes | Secure |
| GET | `/api/expenses/:id` | Yes | any | Yes | Secure |
| PATCH | `/api/expenses/:id` | Yes | staff | Yes | Secure |
| DELETE | `/api/expenses/:id` | Yes | admin | Yes | Secure |
| GET | `/api/stock` | Yes | any | Yes | Needs Fix (S11) |
| GET | `/api/stock/ledger` | Yes | any | Yes | Secure |
| POST | `/api/stock/adjust` | Yes | admin | Yes | Secure |
| GET | `/api/payments/order/:orderId` | Yes | staff | Yes (via order) | Secure |
| POST | `/api/payments/order/:orderId` | Yes | staff | Yes (via order) | Secure |
| GET | `/api/reports/dashboard` | Yes | staff | Yes | Secure |
| GET | `/api/reports/sales-by-day` | Yes | staff | Yes | Secure |
| GET | `/api/reports/top-products` | Yes | staff | Yes | Secure |
| GET | `/api/reports/sales-by-channel` | Yes | staff | Yes | Secure |
| GET | `/api/reports/expenses-by-category` | Yes | staff | Yes | Secure |
| GET | `/api/reports/low-stock` | Yes | staff | Yes | Secure |

**No routes are publicly accessible without a token except: `/health`, `/api/auth/register`, `/api/auth/login`. All three are intentional.**

---

### 1b. BOLA/IDOR Analysis

All UUID-parameterized routes were checked. Every single `getOne`, `update`, and `remove` operation filters by both the record ID **and** `organization_id` (directly or transitively via JOIN). No cross-org data leakage was found through direct ID lookup.

**Indirect access paths — all clean:**
- `product-variants.controller.js` routes through product + org check
- `payments.controller.js` validates sales order belongs to org before querying payments
- `returns.controller.js` validates sales order item belongs to validated sales order
- `purchase-orders.controller.js receive` validates PO belongs to org before checking PO items

**No BOLA vulnerabilities found.** This is one of the strongest aspects of the codebase. Every query that accepts a UUID parameter also filters by organization_id, either directly or transitively through a JOIN chain that terminates at an org-scoped table.

---

### 1c. Broken Function Level Authorization

**S10 — High design flaw:** `PATCH /api/sales-orders/:id/status` requires only `staff` level. This means a staff user can transition an order to `paid` status without any payment record existing. The `amount_paid` field on the order would remain at `0.00` while status shows `paid`. Financial reports would show revenue without payment, causing P&L inaccuracies.

```js
// sales-orders.controller.js:195-206
const validTransitions = {
  pending: ['processing', 'partially_paid', 'paid', 'cancelled'],
  // ...
```

The status endpoint and the payment endpoint are completely independent. A staff member calling `PATCH /api/sales-orders/:id/status` with `{ status: 'paid' }` sets the order as paid with zero amount_paid recorded. No cross-check exists between the status machine and the actual payment records.

**All other role requirements appear correct and proportionate:** delete/admin operations require elevated roles, readonly users cannot write anything, owner-only operations are correctly gated.

---

### 1d. Mass Assignment

All controllers use explicit field whitelisting for PATCH operations using the `allowedFields` array pattern. No mass assignment vulnerabilities were found:

- `organization_id` is always taken from `req.user.org_id`, never from request body
- `credit_balance` is not in the `customers` update `allowedFields`
- `role` in user creation is validated against the DB roles table, not blindly trusted
- `password_hash` is never accepted from the request body anywhere in the codebase
- `active` field for soft-delete is only accepted in explicit user management endpoints (not, for example, in product variant create where it could bootstrap a deactivated entity)

---

### 1e. SQL Injection Surface

**No SQL injection vulnerabilities found.** Every query uses `pg` parameterized placeholders (`$1, $2, ...`). All dynamic `WHERE` clause construction appends only hardcoded column name strings (e.g., `AND column_name = $N`) and pushes user-provided values to the parameters array separately.

All `ORDER BY` clauses are hardcoded strings with no user input. Filter values for `movement_type`, `status`, and `channel` are validated against whitelists in route validators before reaching controllers. Even in the most complex dynamically-built queries (e.g., `users.list`, `sales-orders.list`), the pattern is:

```js
// Safe pattern used consistently throughout:
let where = 'WHERE so.organization_id = $1';
const vals = [req.user.org_id];
let idx = 2;
if (status) { where += ` AND so.status = $${idx++}`; vals.push(status); }
```

User-supplied values go only into the `vals` array (parameterized), never concatenated into the query string.

---

### 1f. Authentication Weaknesses

#### S01 — Critical: Deactivated users keep valid tokens

`auth.js:21` calls `jwt.verify()` only — it never checks `users.active`. When a user is deactivated via `DELETE /api/users/:id`, their JWT remains fully valid for up to 7 days. An employee who is fired can continue accessing the system with their existing token, reading financial data, creating orders, and processing payments.

```js
// auth.js — authenticate middleware — current code
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = {
  id: decoded.sub,
  org_id: decoded.org,
  role: decoded.role,
  name: decoded.name,
};
next(); // no database check for user.active
```

Fix requires either: (a) checking `users.active` in the authenticate middleware on every request (one indexed query per request — acceptable cost), or (b) implementing a token blocklist/revocation table. Option (a) is simpler and appropriate for this scale.

#### S09 — High: 7-day JWT with no revocation

`issueToken` sets `expiresIn: '7d'`. For a system handling financial transactions and employee access control, this is too long. There is no refresh token flow, no token blocklist, and no forced re-login. The industry standard for business applications is 15-60 minutes with a refresh token. A compromised JWT (e.g., extracted from a user's browser localStorage on a public computer) grants full access for up to a week.

#### S30 — Low: No explicit algorithm restriction

`jwt.verify(token, process.env.JWT_SECRET)` — no `{ algorithms: ['HS256'] }` option. In `jsonwebtoken` v9.x, the `'none'` algorithm is blocked by default, so this is not an exploitable vulnerability today. However, adding the explicit algorithms option is a defence-in-depth practice that protects against future library behaviour changes and algorithm downgrade attempts.

---

### 1g. Brute Force and Rate Limiting

Auth routes use `authLimiter`: 20 requests per 15 minutes per IP. This is reasonable for legitimate use and blocks trivial single-IP brute force.

#### S15 — High: No account lockout

The rate limit is IP-based only. A distributed attacker (botnet, residential proxies, cloud exit nodes) can attempt `20 * N_IPs` password guesses per 15 minutes against any specific user account. There is no failed-attempt counter per user, no account lockout after N consecutive failures, no CAPTCHA, and no notification to the account owner of failed login attempts from new locations.

For a business SaaS system with financial data, the combination of IP-only rate limiting + no account lockout means that a moderately resourced attacker could mount a successful credential stuffing attack on any known email address.

---

### 1h. Password Security Deep Audit

| Check | Result | Assessment |
|-------|--------|------------|
| bcrypt cost factor | **12** (BCRYPT_ROUNDS constant) | Good — industry minimum is 10, 12 is appropriate |
| Minimum password length | 8 characters | Marginal but acceptable for v1 |
| Maximum password length (bcrypt 72-byte limit) | **Enforced** — `isLength({ max: 72 })` in auth.routes.js | Correct — protects against false security of long passwords |
| Passwords in logs | None found anywhere | Secure |
| Passwords in API responses | None — hash never returned in any response shape | Secure |
| Plain text storage or transmission | No — always bcrypt hashed before storage | Secure |
| Password in audit log | No — changePassword audit only logs the action, not the new hash | Secure |

---

### 1i. Sensitive Data Exposure

All API responses from user endpoints omit `password_hash` — it is selected in login and changePassword for internal bcrypt comparison only and is never serialized into any response.

**S29 — Low:** `SELECT *` in `auth.controller.js:114` (login) and `auth.controller.js:182` (changePassword) pulls `password_hash` into Node.js heap memory unnecessarily. If an object inspection tool or memory dump were used, the hash would be visible. Use explicit column selection instead:

```js
// auth.controller.js login — should be:
`SELECT u.id, u.name, u.email, u.organization_id, u.active, u.password_hash, r.name AS role_name
 FROM users u ...`

// auth.controller.js changePassword — should be:
`SELECT id, password_hash FROM users WHERE id = $1`
```

Error handler correctly hides stack traces in production via `NODE_ENV === 'production'` check. PostgreSQL error codes are caught and mapped to generic messages — no raw DB error details (row data, column names, constraint names) leak to the client.

---

### 1j. Security Headers

`helmet()` is called at `server.js:35` with no custom configuration, which activates all helmet v7 defaults:

- `X-Content-Type-Options: nosniff` — enabled
- `X-Frame-Options: SAMEORIGIN` — enabled
- `X-XSS-Protection: 0` — correct (modern browsers ignore this; helmet disables the broken IE implementation)
- `Referrer-Policy: no-referrer` — enabled
- `Strict-Transport-Security` — enabled by default in helmet v7
- `Content-Security-Policy` — helmet default set, appropriate for a pure JSON API
- `Permissions-Policy` — enabled

**No security header issues found.**

---

### 1k. CORS Configuration

```js
// server.js:37-49
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
```

- No wildcard `*` used — origin is validated against an explicit whitelist
- `!origin` permits requests with no Origin header (server-to-server, curl, Postman, mobile apps) — standard practice for APIs
- `credentials: true` allows Authorization headers cross-origin — correct for this JWT-based architecture
- ALLOWED_ORIGINS is configurable via environment variable — correct for multi-environment deployment

**No CORS vulnerabilities found.**

---

### 1l. Request Security

- Body size limit: `express.json({ limit: '1mb' })` at `server.js:75` — protects against payload flood attacks
- No file upload endpoints exist anywhere in the codebase
- This is a pure JSON API; all data is returned as JSON, so XSS risk belongs entirely to the frontend rendering layer
- No HTML injection sanitization in text fields (notes, addresses, names) — since data is stored and returned as JSON strings, this is acceptable. If stored data is ever rendered as HTML (emails, PDFs, admin interfaces), the consuming layer must sanitize.

---

## SECTION 2 — DATA INTEGRITY

### 2a. Atomicity — Transaction Audit

| Operation | In Transaction | Uses FOR UPDATE | Verdict |
|-----------|---------------|-----------------|---------|
| `auth.register` | Yes — withTransaction | No (INSERT only) | Secure |
| `auth.changePassword` | **No — direct pool queries** | No | S18 — Race condition |
| `users.create` | Yes — withTransaction | No | Secure |
| `users.update` | Yes — withTransaction | No | Secure |
| `users.remove` | Yes — withTransaction | No | Secure |
| `products.create` | Yes — withTransaction | No | Secure |
| `products.update` | No — direct pool query | No | Low risk (single UPDATE) |
| `products.remove` | No — direct pool query | No | Low risk (single UPDATE) |
| `sales-orders.create` | Yes — withTransaction | No (advisory lock used) | Secure |
| `sales-orders.updateStatus` | Yes — withTransaction | Yes — FOR UPDATE | Secure |
| `purchase-orders.create` | Yes — withTransaction | No | Secure |
| `purchase-orders.updateStatus` | **No — direct pool queries** | **No** | S04 — Critical race condition |
| `purchase-orders.receive` | Yes — withTransaction | Yes — FOR UPDATE | Secure |
| `payments.create` | Yes — withTransaction | Yes — FOR UPDATE on order | Secure |
| `payments.create` (store_credit) | Yes — same transaction | Yes — FOR UPDATE on customer | Secure |
| `returns.create` | Yes — withTransaction | Yes — FOR UPDATE on order | Secure (but S03) |
| `transfers.create` | Yes — withTransaction | No | Secure |
| `transfers.confirm` | Yes — withTransaction | Yes — FOR UPDATE | Secure |
| `transfers.cancel` | Yes — withTransaction | Yes — FOR UPDATE | Secure |
| `stock.adjust` | Yes — withTransaction | No (advisory lock used) | Secure |
| `expenses.create` | No — direct pool query | No | Low risk (single INSERT) |
| `expenses.update` | No — direct pool query | No | Low risk (single UPDATE) |
| `expenses.remove` | No — direct pool query | No | Low risk (single DELETE) |

#### S04 — Critical: `purchase-orders.controller.js:139` — `updateStatus` race condition

```js
// Current code — NOT in a transaction, no FOR UPDATE
const chk = await pool.query(
  `SELECT status FROM purchase_orders WHERE id = $1 AND organization_id = $2`,
  [id, orgId]
);
// ... transition validation happens here ...
const result = await pool.query(
  `UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
  [status, id]
);
await auditService.log({ client: pool, ... });
```

Two concurrent requests could both read `status='submitted'`, both pass the transition validation independently, and both execute the UPDATE. If one requests transition to `received` and another to `cancelled`, the last write wins with no error thrown and no indication that a race occurred. The audit log would show one successful transition, hiding the conflict entirely.

Contrast this with `sales-orders.updateStatus` which correctly wraps the operation in `withTransaction` with `SELECT ... FOR UPDATE`. The purchase order version was not given the same treatment.

#### S18 — Medium: `auth.controller.js:178` — `changePassword` not in a transaction

```js
const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
// ... bcrypt compare ...
const newHash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);
await auditService.log({ client: pool, ... });
```

Three separate queries, no transaction. If a concurrent admin resets the user's password between the SELECT and the UPDATE, User A's password change silently overwrites the admin's reset. Additionally, if the audit log INSERT fails for any reason (DB timeout, constraint), the password has already been changed but no audit record exists.

---

### 2b. Race Conditions and Concurrency

| Scenario | Protected? | Mechanism | Notes |
|----------|-----------|-----------|-------|
| Two users selling the last unit simultaneously | Yes | `pg_advisory_xact_lock` in insertLedgerEntry + FOR UPDATE on sales order | Correct |
| Two payments on same order simultaneously | Yes | `SELECT ... FOR UPDATE` on sales order in payments.create | Correct |
| Two staff updating same PO status | **No** | Nothing | S04 — race condition |
| Concurrent password changes | **No** | Nothing | S18 — race condition |
| Two transfers confirming simultaneously | Yes | FOR UPDATE in transfers.confirm | Correct |
| Concurrent store credit payments | Yes | FOR UPDATE on customer in payments.create | Correct |
| Two adjustments to same stock simultaneously | Yes (for negative) | Advisory lock for outgoing movements | Positive movements are append-only, always correct |

**Note on advisory lock implementation:**

```js
// stock.service.js:29
await client.query(`SELECT pg_advisory_xact_lock(hashtext($1 || $2))`, [productId, locationId]);
```

`hashtext()` returns INT4 (32-bit integer). `pg_advisory_xact_lock` accepts bigint. The INT4 value is promoted to bigint automatically. The theoretical hash collision probability is 1 in ~4.3 billion product+location string combinations. A collision causes two unrelated product+location pairs to compete for the same lock (unnecessary contention) but does NOT cause data corruption — both transactions would still execute correctly, just serially. This is acceptable for this scale.

---

### 2c. Stock Ledger Integrity — Full Trace

| Event | Ledger Entry Created | Movement Type Used | Atomic with Event | Notes |
|-------|---------------------|-------------------|------------------|-------|
| Purchase order received | Yes | `purchase` | Yes — withTransaction + FOR UPDATE | Secure |
| Sales order created | Yes | `sale` (negative qty) | Yes — withTransaction + advisory lock | Secure |
| Sales order cancelled | Yes | `adjustment` (positive qty) | Yes — within updateStatus transaction | S32 — misleading type |
| Return processed | Yes | `return` (positive qty) | Yes — withTransaction + FOR UPDATE | Secure (but S03) |
| Manual adjustment | Yes | `adjustment` | Yes — withTransaction | Secure |
| Transfer confirmed | Yes — two entries | `transfer_out` + `transfer_in` | Yes — withTransaction + FOR UPDATE | Secure |

**S32 — Low:** When a sales order is cancelled, stock restoration uses `movementType: 'adjustment'` at `sales-orders.controller.js:230`:

```js
await stockService.insertLedgerEntry(client, {
  // ...
  movementType: 'adjustment',  // should ideally be 'cancellation' or similar
  referenceId: id,
  note: `Stock restored on order cancellation`,
  // ...
});
```

This means the stock ledger, when filtered by `movement_type = 'adjustment'`, will mix manual adjustments (made by admins) with automatic stock restorations from order cancellations. These are functionally different events and should be distinguishable in reporting. However, the current `movement_type` CHECK constraint in the schema only allows: `'purchase','sale','transfer_in','transfer_out','return','adjustment'`. Fixing this requires a schema change.

The return quantity validation correctly prevents returning more items than were originally sold:

```js
// returns.controller.js:79
if (quantity_returned > remainingReturnable) {
  throw new Error(`Return quantity (${quantity_returned}) exceeds remaining returnable quantity (${remainingReturnable})`);
}
```

This check queries the cumulative `quantity_returned` across all existing returns for the same order item, so repeat returns are also correctly bounded.

---

### 2d. Financial Integrity — Full Trace

#### S03 — Critical: Returns do not update customer credit balance

In `returns.controller.js create`, the complete flow is:

1. Validate sales order belongs to org and is not cancelled — correct
2. For each return item, validate quantity limits and refund amount ceiling — correct
3. Create the `returns` record with `total_refund_amount` — correct
4. Create `return_items` records — correct
5. Call `insertLedgerEntry` with `return` movement type to restore stock — correct
6. **No update to `customers.credit_balance` anywhere in the function**

The `refund_amount` values are stored in `return_items.refund_amount` and summed into `returns.total_refund_amount`. These numbers exist in the database and are visible in reports. However, they are never applied to the customer's actual spendable credit balance. The customer cannot use "store credit" that was supposedly refunded to them.

The complete missing code that should exist inside the returns transaction:

```js
// Should be added AFTER creating return items, INSIDE the withTransaction callback:
if (totalRefund > 0 && so.customer_id) {
  await client.query(
    `UPDATE customers SET credit_balance = credit_balance + $1, updated_at = NOW() WHERE id = $2`,
    [totalRefund, so.customer_id]
  );
}
```

**Payment flow integrity for all other paths:**

| Flow | Atomic | Correct | Notes |
|------|--------|---------|-------|
| Cash/card/bank_transfer payment recorded | Yes | Yes | withTransaction |
| Credit payment (adds to credit_balance) | Yes | Functionally correct | Increases balance, customer owes store |
| Store credit payment (deducts from credit_balance) | Yes with FOR UPDATE | Yes | Checks balance before deducting, atomically deducts |
| Overpayment blocked | Yes | Yes | Throws before any DB write if amount would exceed total |
| Concurrent payments on same order | Yes | Yes | FOR UPDATE on sales order prevents double-payment |

**Credit semantics note:** `method='credit'` INCREASES `credit_balance` (customer has taken goods on credit — they owe the store). `method='store_credit'` DECREASES `credit_balance` (customer is spending credit they previously received). This is internally consistent but the naming is counterintuitive — "credit balance" typically means "money the customer has available", but here it also tracks debt. The business logic works correctly given this convention, but it should be documented in a code comment.

---

### 2e. Soft Delete Completeness

| Entity | Soft Delete Implementation | Active Filter in List | Active Check When Referenced as FK |
|--------|---------------------------|----------------------|-------------------------------------|
| Users | `active = FALSE` | `WHERE active = TRUE` | Login checks `active`, JWT does not (S01) |
| Products | `active = FALSE` | Optional via `?active=` filter | Checked in sales order create, purchase order create |
| Product Variants | `active = FALSE` | NOT filtered in list | Not checked when referenced in orders |
| Customers | `active = FALSE` | `WHERE active = TRUE` | **NOT checked in sales order create (S13)** |
| Suppliers | `active = FALSE` | `WHERE active = TRUE` | Not checked (FK still exists, PO will reference inactive supplier) |
| Branches | `active = FALSE` | `WHERE active = TRUE` | **Locations list doesn't filter by branch.active (S14)** |
| Locations | No `active` column — hard DELETE | — | FK constraint prevents deletion if referenced |
| Expense Categories | No `active` column — hard DELETE | — | FK constraint prevents deletion if referenced |
| Categories | No `active` column — hard DELETE | — | FK constraint prevents deletion if referenced |

#### S13 — High: Deactivated customers can be linked to new orders

```js
// sales-orders.controller.js:62 — current code
if (customer_id) {
  const custChk = await client.query(
    `SELECT id FROM customers WHERE id = $1 AND organization_id = $2`,
    [customer_id, orgId]
    // Missing: AND active = TRUE
  );
```

A customer who was soft-deleted (deactivated) via `DELETE /api/customers/:id` can still be assigned to new sales orders. This creates data quality issues and is inconsistent with the intent of deactivation.

#### S14 — High: Locations under inactive branches appear in list

```js
// locations.controller.js:14 — current code
let where = 'WHERE b.organization_id = $1';
// Missing: AND b.active = TRUE
```

When a branch is deactivated, its locations continue to appear in `GET /api/locations`. Users can see and potentially reference locations that belong to a deactivated branch.

#### S22 — Medium: `GET /customers/:id` returns deactivated customers

```js
// customers.controller.js:43
const custRes = await pool.query(
  `SELECT * FROM customers WHERE id = $1 AND organization_id = $2`,
  [req.params.id, req.user.org_id]
  // Missing: AND active = TRUE (or intentional?)
);
```

The list endpoint filters by `active = TRUE` but `getOne` does not. A user who knows a deactivated customer's UUID can still retrieve their full record including credit_balance, address, and notes. This is inconsistent — if a customer is "deleted" from the list view, they should not be individually accessible either (or the system should be explicit that deactivated customers remain viewable).

The same inconsistency exists for branches (`GET /branches/:id` returns deactivated branches).

---

### 2f. Schema Integrity

| Check | Result | Assessment |
|-------|--------|------------|
| All monetary fields NUMERIC(12,2) | All money fields confirmed NUMERIC(12,2) | Correct — no FLOAT or REAL used for currency |
| All PKs UUID with gen_random_uuid() | Confirmed | Correct |
| All timestamps TIMESTAMPTZ DEFAULT NOW() | Confirmed | Correct |
| All FKs ON DELETE RESTRICT | All FK definitions use ON DELETE RESTRICT | Correct — prevents cascading deletes |
| Email uniqueness | UNIQUE constraint on users.email (global) | Correct |
| SKU uniqueness | Partial unique index per org (WHERE sku IS NOT NULL) | Correct |
| Category name uniqueness | UNIQUE(organization_id, name) | Correct |
| No DB-level negative stock constraint | Only application-level check in insertLedgerEntry | Acceptable pattern with advisory locks |
| sales_orders total fields CHECK constraints | No CHECK constraints on subtotal, total, amount_paid | Missing — application validates but no DB enforcement |
| products.price nullable | Yes — intentional (price can be set on variant level) | Correct |
| customers.credit_balance CHECK | CHECK(credit_balance >= 0) | Correct |
| payments.amount CHECK | CHECK(amount > 0) | Correct |
| purchase_order_items.cost CHECK | CHECK(cost >= 0) | Correct |
| transfer_items.quantity CHECK | CHECK(quantity > 0) | Correct |
| return_items.quantity_returned CHECK | CHECK(quantity_returned > 0) | Correct |
| locations.type CHECK | CHECK(type IN ('warehouse', 'store')) | Correct |
| roles.name CHECK | CHECK(name IN ('owner', 'admin', 'staff', 'readonly')) | Correct |
| stock_ledger.movement_type CHECK | CHECK with all valid types | Correct |
| sales_orders.status CHECK | CHECK with all valid statuses | Correct |
| purchase_orders.status CHECK | CHECK with all valid statuses | Correct |

**bundles and bundle_items tables (S16):** These tables are correctly defined with FKs and constraints but have no application code. They are orphaned schema that adds confusion without providing functionality.

---

### 2g. Orphaned Data Risks

| Scenario | What Happens | Is It Handled Correctly? |
|----------|-------------|--------------------------|
| Organization deleted | Blocked by FK RESTRICT on branches, users, categories, etc. | Yes — cannot delete an org with children |
| Product soft-deleted | `active = FALSE`, existing order items still reference product via FK | Yes — FK preserved, history intact |
| Product hard-delete attempted | Blocked by FK on sales_order_items, stock_ledger, etc. | Yes — application uses soft delete anyway |
| User soft-deleted | `active = FALSE`, orders/ledger reference via FK | Yes — FK preserved, history intact |
| Location hard-deleted with stock | Blocked by FK on stock_ledger (ON DELETE RESTRICT) | Yes — returns 409 REFERENCE_ERROR |
| Location hard-deleted with active orders | Blocked by FK on sales_orders (ON DELETE RESTRICT) | Yes — returns 409 REFERENCE_ERROR |
| Supplier soft-deleted with pending POs | POs still reference supplier_id via FK — supplier row stays | Yes — FK preserved, POs remain usable |
| Customer soft-deleted with order history | Orders reference customer_id via FK — customer row stays | Yes — FK preserved, history intact |
| Category hard-deleted with products | Blocked by FK on products (ON DELETE RESTRICT) | Yes — returns 409 REFERENCE_ERROR |
| Branch soft-deleted with locations | Locations remain (FK preserved), but appear in list (S14) | Partial — S14 is a gap |

All orphan scenarios are protected by FK constraints or soft delete. The error handler correctly maps FK violation error code `23503` to a user-friendly 409 response.

---

## SECTION 3 — API DESIGN AND STANDARDS

### 3a. Response Shape Audit

Standard shape per codebase pattern: `{ success: bool, data: any, message: string, [pagination]: object }`

| Endpoint Type | Actual Shape | Deviation |
|---------------|-------------|-----------|
| Successful GET (single) | `{ success, data, message }` | None |
| Successful GET (list) | `{ success, data, message, pagination }` | None |
| Successful POST (create) | `{ success, data, message }` | None |
| Successful PATCH | `{ success, data, message }` | None |
| Successful DELETE | `{ success, data: null, message }` | Returns 200 not 204 — see S3b |
| Validation error (validate.js) | `{ success, error, message, fields }` | Extra `error` code string; extra `fields` array; missing `data` |
| App error (errorHandler.js) | `{ success, error, message }` | Extra `error` code string; missing `data` |
| Rate limit error | `{ success: false, error, message }` | Extra `error`; missing `data` |
| 404 handler | `{ success, error, message }` | Extra `error`; missing `data` |
| PG unique violation (errorHandler) | `{ success, error, message }` | Extra `error`; missing `data` |

#### S19 — Medium: Inconsistent response shape between success and error paths

Error responses consistently include an `error` code string (e.g., `'VALIDATION_ERROR'`, `'NOT_FOUND'`, `'DUPLICATE_ENTRY'`) but omit the `data` field. Success responses include `data` but omit `error`. This asymmetry means client code must handle two different shapes. Additionally, the `fields` array in validation errors and the `error` code in all error responses are not part of the documented shape, but are consistently present in practice.

**Recommendation:** Formally document the full shape as:
```js
{
  success: boolean,
  data: any | null,
  message: string,
  error?: string,    // present only on errors
  fields?: Array,   // present only on validation errors
  pagination?: object // present only on paginated lists
}
```
And ensure all error responses include `data: null` for consistency.

---

### 3b. HTTP Standards Compliance

| Scenario | Expected Code | Actual Code | Verdict |
|----------|--------------|-------------|---------|
| Successful GET | 200 | 200 | Correct |
| Successful POST (create) | 201 | 201 | Correct |
| Successful PATCH/PUT | 200 | 200 | Correct |
| Successful DELETE | 204 | 200 with body | Low deviation — pragmatic choice |
| Not authenticated | 401 | 401 | Correct |
| Not authorized (wrong role) | 403 | 403 | Correct |
| Not found | 404 | 404 | Correct |
| Validation error | 422 | 422 | Correct |
| Business rule violation | 422 | 422 | Correct |
| Duplicate entry | 409 | 409 | Correct |
| FK constraint (cannot delete) | 409 | 409 | Correct |
| Rate limit exceeded | 429 | 429 (from express-rate-limit) | Correct |
| Server error | 500 | 500 | Correct |
| DB unavailable | 503 | 500 (cannot distinguish) | Gap — no health check (S05) |

DELETE operations returning 200 with `{ success: true, data: null, message: '...' }` is acceptable but diverges from the HTTP standard which specifies 204 (No Content) for successful deletes with no response body. Since the response body carries a useful human-readable message, 200 is pragmatically reasonable. Just needs to be consistent and documented.

---

### 3c. Validation Completeness

**`auth/register` validation:**
| Field | Required | Type | Range | Format |
|-------|----------|------|-------|--------|
| org_name | Yes | string | max:255 | trim |
| country | No | string | max:100 | trim |
| currency | Yes | string | max:10 | trim |
| name | Yes | string | max:255 | trim |
| email | Yes | string | — | isEmail + normalizeEmail |
| password | Yes | string | min:8, max:72 | — |

**`sales-orders/create` items validation:**
| Field | Required | Type | Range | Notes |
|-------|----------|------|-------|-------|
| location_id | Yes | UUID | — | Correct |
| customer_id | No | UUID | — | Correct |
| channel | No | enum | — | Validated against list |
| discount | No | float | min:0 | No max — could be larger than total |
| tax | No | float | min:0 | No max |
| items | Yes | array | min:1 | Correct |
| items.*.product_id | Yes | UUID | — | Correct |
| items.*.variant_id | No | UUID | — | Correct |
| items.*.quantity | Yes | int | min:1 | **No max** |
| items.*.price | No | float | min:0 | Correct |
| items.*.discount | No | float | min:0 | No max |

**S20 — Medium:** `unit_id` on product create/update is validated as UUID format in the route but never checked that the unit belongs to the org or is a global unit. If an invalid UUID is passed, the PostgreSQL FK constraint fires and the error handler returns a generic `409 REFERENCE_ERROR: "Referenced record does not exist or cannot be deleted because it is in use"`. This message is confusing — it sounds like a deletion conflict, not a creation validation error. The controller should explicitly check:

```js
if (unit_id) {
  const unitChk = await pool.query(
    `SELECT id FROM units WHERE id = $1 AND (organization_id = $2 OR organization_id IS NULL)`,
    [unit_id, orgId]
  );
  if (!unitChk.rows.length) {
    return res.status(422).json({ ... message: 'unit_id not found' });
  }
}
```

**S21 — Medium:** Date range parameters (`from`, `to`) are validated as ISO 8601 strings but not validated for logical ordering. Passing `?from=2025-12-31&to=2025-01-01` is accepted by all report and expense list endpoints. The query executes successfully and returns zero rows, with no indication to the client that the date range is inverted. This causes silent "empty" results that could be misinterpreted as "no data for that period".

---

### 3d. Pagination

| Endpoint | Paginated | Max Page Size | Pagination in Response |
|----------|-----------|--------------|----------------------|
| GET /api/products | Yes | 100 | Yes |
| GET /api/users | Yes | 100 | Yes |
| GET /api/customers | Yes | 100 | Yes |
| GET /api/suppliers | Yes | 100 | Yes |
| GET /api/branches | Yes | 100 | Yes |
| GET /api/locations | Yes | 100 | Yes |
| GET /api/categories | Yes | 100 | Yes |
| GET /api/units | Yes | 100 | Yes |
| GET /api/sales-orders | Yes | 100 | Yes |
| GET /api/purchase-orders | Yes | 100 | Yes |
| GET /api/transfers | Yes | 100 | Yes |
| GET /api/returns | Yes | 100 | Yes |
| GET /api/expenses | Yes | 100 | Yes |
| GET /api/stock/ledger | Yes | 200 | Yes |
| **GET /api/stock** | **No** | **Unlimited** | **No — S11** |
| GET /api/reports/* | N/A (aggregated) | — | N/A |

#### S11 — High: No pagination on GET /api/stock

`stock.controller.js:12` executes an aggregation query across the entire `stock_ledger` table, joining to products, variants, locations, and branches, with no LIMIT or OFFSET. The result set size is: `number_of_products * number_of_locations * number_of_variants`. An org with 500 products, 20 locations, and average 3 variants = potentially 30,000 rows returned in a single HTTP response. Under concurrent load this will cause severe memory pressure on both the database and the Node.js process.

---

### 3e. Filtering and Sorting

All list endpoints support filtering by relevant fields (status, customer_id, location_id, date range, search text, etc.). All `ORDER BY` clauses are hardcoded strings — no user-controlled sort fields exist anywhere. This eliminates the SQL injection via ORDER BY attack vector entirely.

Enum filters (`status`, `channel`, `movement_type`) are validated in route validators using `.isIn([...])` before reaching controllers. Unrecognized values are rejected with 422 before any database query executes.

---

### 3f. Idempotency

PATCH operations are idempotent — calling the same PATCH request twice with the same body produces the same result with no side effects.

POST operations that create new records are not idempotent by design — each call creates a new record with a new UUID. For payments specifically: two identical POST requests to `/api/payments/order/:orderId` with the same `amount` and `method` would create two separate payment records. The second payment would be blocked only if the combined `amount_paid` would exceed the order `total + 0.01`. For partial payments (e.g., paying half an order), a duplicate request would succeed and double the amount paid. There is no idempotency key system to prevent network retry duplication.

---

## SECTION 4 — BUSINESS LOGIC COMPLETENESS

### 4a. Missing CRUD Operations

| Entity | List | Create | Get One | Update | Delete | Gap Notes |
|--------|------|--------|---------|--------|--------|-----------|
| Organizations | — | Yes (register) | Yes (/me) | Yes | No | Intentional — no org deletion |
| Users | Yes | Yes | Yes | Yes | Yes (soft) | Complete |
| Products | Yes | Yes | Yes | Yes | Yes (soft) | Complete |
| Product Variants | Yes | Yes | Yes | Yes | Yes (soft) | Complete |
| Categories | Yes | Yes | Yes | Yes | Yes (hard) | Complete |
| Units | Yes | Yes | Yes | Yes | Yes (hard) | Complete |
| Customers | Yes | Yes | Yes | Yes | Yes (soft) | Complete |
| Suppliers | Yes | Yes | Yes | Yes | Yes (soft) | Complete |
| Branches | Yes | Yes | Yes | Yes | Yes (soft) | Complete |
| Locations | Yes | Yes | Yes | Yes | Yes (hard) | No soft delete (S24) |
| Purchase Orders | Yes | Yes | Yes | Status only | No | Intentional — immutable after creation |
| Sales Orders | Yes | Yes | Yes | Status only | No | Intentional — immutable after creation |
| Payments | Per-order list | Yes | **No** | **No** | **No** | S28 — no individual GET |
| Expense Categories | Yes | Yes | **No** | **No** | Yes | S27 — no GET/PATCH single |
| Expenses | Yes | Yes | Yes | Yes | Yes | Complete |
| Returns | Yes | Yes | Yes | No | No | Intentional — immutable |
| Transfers | Yes | Yes | Yes | confirm/cancel | — | Complete |
| Stock Adjustments | Via ledger | Yes | — | — | — | Append-only by design |
| Audit Log | **No** | Auto | **No** | — | — | S33 — no read API |
| Bundles | **No** | **No** | **No** | **No** | **No** | S16 — schema only, no implementation |

#### S27 — Medium: Expense categories have no GET single / PATCH endpoints

The `expense_categories` resource has only `GET /api/expenses/categories` (list), `POST /api/expenses/categories` (create), and `DELETE /api/expenses/categories/:id` (delete). There is no endpoint to retrieve a single expense category by ID or to update its name. This means renaming an expense category is impossible through the API.

#### S28 — Medium: No individual payment retrieval

Payments can only be accessed via `GET /api/payments/order/:orderId` (list all payments for an order). There is no `GET /api/payments/:id` endpoint to retrieve a specific payment record. If an external system (accounting integration, receipt generation) needs a single payment by ID, it must first fetch all payments for the order and filter client-side.

#### S33 — Low: No audit log read API

The `audit_log` table is written to by nearly every significant operation. However, there is no route, controller, or query that allows reading audit log entries. Admins and owners cannot review the audit trail through the API. This makes the audit log purely an internal forensic tool that can only be queried directly in the database.

---

### 4b. Complete Status Lifecycle Audit

#### Sales Orders State Machine

Valid transitions as implemented in `sales-orders.controller.js:195-206`:

```
pending        --> processing, partially_paid, paid, cancelled
partially_paid --> paid, processing, cancelled
paid           --> processing, shipped
processing     --> shipped, cancelled
shipped        --> delivered
delivered      --> (terminal, no transitions allowed)
cancelled      --> (terminal, no transitions allowed)
```

**Missing transitions a real business needs:**

1. `paid --> cancelled` — Once any portion is paid, an order cannot be cancelled through the status machine. The only recourse is to separately process a Return. This is a legitimate design constraint (you cannot cancel what is already paid — you must refund), but it should be documented and the error message should guide the user to the returns endpoint.

2. No `returned` or `refunded` status — When a return is fully processed, the order status remains `delivered` or `paid`. There is no way to know from the order status alone that it has been returned. The refund information exists only in the `returns` table.

3. No `on_hold` status — Common in e-commerce when payment is pending verification or stock is reserved.

4. `delivered --> returned` — A "mark as returned" status transition is not available on the order itself.

5. Manual status transitions allow setting `status='paid'` via `updateStatus` without any payment record (S10). The status machine does not verify that `amount_paid >= total` before allowing transition to `paid`.

#### Purchase Orders State Machine

Valid transitions as implemented in `purchase-orders.controller.js:147-151`:

```
draft              --> submitted, cancelled
submitted          --> partially_received, received, cancelled
partially_received --> received, cancelled
received           --> (terminal)
cancelled          --> (terminal)
```

**Notes:**
- Once submitted, a PO cannot go back to `draft` for editing. If items need to change, the PO must be cancelled and recreated.
- The `updateStatus` endpoint has a race condition (S04) — transition validation is not atomic.
- `received` POs cannot be reopened or modified. If goods were incorrectly marked as received, there is no correction path through the API.

#### Returns Status Lifecycle

The `returns` table has no `status` field. Returns are immutable once created — there is no approval workflow, no pending/approved/rejected states, and no ability to void a return. Every return processed via `POST /api/returns` immediately:
1. Creates the return record
2. Restores stock to the ledger
3. (Should but currently does not) update customer credit balance

For businesses that need manager approval before processing a return, or that want to track the approval step, the absence of a returns workflow is a significant gap.

---

### 4c. Audit Log Completeness

| Operation | Logged | Action String | Data Captured | Gap |
|-----------|--------|--------------|---------------|-----|
| Organization create | Yes | 'create' | entityId only | No `changes` snapshot |
| Organization update | Yes | 'update' | entityId only | No before/after |
| Branch create | Yes | 'create' | entityId only | — |
| Branch update | Yes | 'update' | entityId only | No before/after |
| Branch delete | Yes | 'delete' | entityId only | — |
| Location create | Yes | 'create' | entityId only | — |
| Location update | Yes | 'update' | entityId only | — |
| Location delete | Yes | 'delete' | entityId only | — |
| User create | Yes | 'create' | entityId only | No name/email captured |
| User update | Yes | 'update' | entityId only | No before/after role |
| User delete (deactivate) | Yes | 'delete' | entityId only | — |
| Password change | Yes | 'update' | entityId only | — |
| Product create | Yes | 'create' | entityId only | — |
| Product update | Yes | 'update' | entityId only | No before/after price |
| Product delete | Yes | 'delete' | entityId only | — |
| Variant create/update/delete | Yes | create/update/delete | entityId only | — |
| Sales order create | Yes | 'create' | entityId only | — |
| Sales order status change | Yes | 'status_change' | `{from, to}` | Good |
| PO create | Yes | 'create' | entityId only | — |
| PO status change | Yes | 'status_change' | `{from, to}` | Good |
| Goods receipt | Yes | 'receive' | goods_receipt entityId | — |
| Transfer create | Yes | 'create' | entityId only | — |
| Transfer confirm | Yes | 'confirm' | entityId only | — |
| Transfer cancel | Yes | 'cancel' | entityId only | — |
| Payment create | Yes | 'create' | entityId only | No amount/method |
| Return create | Yes | 'create' | entityId only | — |
| Stock adjustment | Yes | 'adjustment' | `{product_id, location_id, quantity_change}` | Good |
| Expense create/update/delete | Yes | create/update/delete | entityId only | — |
| Expense category create/delete | Yes | create/delete | entityId only | — |
| **Login success** | **No** | — | — | **S02/S26** |
| **Login failure** | **No** | — | — | **S02/S26** |
| **Registration** | Partial | 'create' on org only | org entityId | User creation not separately logged |
| **Token used (session tracking)** | No | — | — | By design |

Most audit entries capture only `entityId` without before/after state snapshots. For a business audit trail, capturing what changed (e.g., `{ before: { price: 10.00 }, after: { price: 15.00 } }`) is essential for detecting unauthorized price changes or data manipulation.

#### S02 — Critical / S26 — Medium: No login audit

Login events (both successful and failed) are not logged to `audit_log`. There is no record of:
- When a user authenticated
- How many failed attempts occurred before a successful login
- From which session a user was operating during a given audit event
- Whether a login occurred from an unusual time or pattern

For a business handling financial data and multi-user access, this is a critical forensic blind spot. If an incident occurs (unauthorized access, data theft, fraudulent order), there is no way to correlate audit log events back to specific login sessions.

---

### 4d. Customer Credit Flow — Complete Trace

| Operation | Effect on credit_balance | Atomic | Notes |
|-----------|------------------------|--------|-------|
| `method='credit'` payment recorded | **+amount** (balance increases) | Yes — withTransaction | Customer buys on credit, owes more |
| `method='store_credit'` payment recorded | **-amount** (balance decreases) | Yes — withTransaction + FOR UPDATE | Customer spends existing credit |
| Return processed | **No change** | N/A | S03 — credit not updated on return |
| Manual PATCH to credit_balance | **Impossible** | N/A | Not in update allowedFields — secure |
| credit_balance going negative | **Impossible** | N/A | DB CHECK constraint + store_credit validation |
| Concurrent store_credit deductions | Protected | Yes | FOR UPDATE on customer record |

**S03 — Critical: Returns do not update credit_balance**

Full trace of what happens when `POST /api/returns` is called with `refund_amount: 50.00`:

1. `returns.total_refund_amount = 50.00` — stored in DB
2. `return_items.refund_amount = 50.00` — stored in DB
3. Stock ledger updated with return movement
4. **`customers.credit_balance` unchanged** — the 50.00 is nowhere in the customer's account

The refund exists as a number in the database but has no effect on the customer's actual available balance. If staff then tries to apply store credit on a future order for this customer, they will find the balance unchanged.

---

### 4e. Multi-Currency and Tax

- `organizations.currency` stores a currency code string (e.g., 'USD', 'SAR') per organization
- All `NUMERIC(12,2)` fields store bare numeric values — no currency codes on individual transaction records
- There is no currency conversion, no multi-currency order support, and no exchange rate table
- Tax (`sales_orders.tax`) is stored as a user-provided numeric value — no tax calculation logic exists anywhere in the backend code
- There is no tax rate configuration table, no tax category support, and no automatic tax calculation
- This is acceptable as a v1 placeholder, but means the frontend is responsible for calculating tax before submitting an order, with no server-side validation of the calculation

---

### 4f. Inventory Valuation

- Cost is stored as a snapshot on `sales_order_items.cost` and `purchase_order_items.cost` at the time of the transaction — this is the correct approach for historical accuracy
- There is no report or query to calculate current inventory value (stock_on_hand × unit_cost per product per location)
- There is no FIFO (First In, First Out) or weighted average cost (WAC) calculation
- The `getOrgStockSummary` function in `stock.service.js` is dead code (S17) — it returns stock quantities but not values, and is never called

---

### 4g. Reporting Gaps

**Available reports:**
1. `GET /api/reports/dashboard` — Period summary: revenue, cost, gross profit, net profit, returns, new customers, low stock count, pending PO count
2. `GET /api/reports/sales-by-day` — Daily order count and revenue for charting
3. `GET /api/reports/top-products` — Top N products by quantity sold and revenue
4. `GET /api/reports/sales-by-channel` — Revenue breakdown by sales channel
5. `GET /api/reports/expenses-by-category` — Expense totals by category
6. `GET /api/reports/low-stock` — Products at or below threshold by location

**Missing reports (S35):**
1. **Profit & Loss Statement** — Although dashboard has a net_profit figure, there is no period comparison, no monthly/quarterly breakdown, no line-item revenue vs. COGS vs. expenses format
2. **Inventory Valuation Report** — Current stock quantity × unit cost per product per location = total inventory value (critical for accounting and insurance)
3. **Aged Receivables** — Customers with outstanding balances (`amount_paid < total` on orders) broken down by aging buckets (0-30, 31-60, 61-90, 90+ days)
4. **Sales by Customer** — Top customers by revenue, order frequency, average order value
5. **Sales by Staff Member** — Orders and revenue attributed to each user (user_id on sales_orders)
6. **Returns Analysis** — Return rate by product, return reason distribution, refund amounts over time
7. **Supplier Purchase History** — Total spend per supplier, average lead time, pending amounts
8. **Period-over-Period Comparison** — Current period vs. previous period for revenue, expenses, profit
9. **Stock Movement History** — Full ledger audit by product showing all inflows and outflows with dates

---

## SECTION 5 — OPERATIONAL AND DEPLOYMENT READINESS

### 5a. Environment Variables Audit

| Variable | Used Where | Documented in .env.example | Behaviour if Missing | Severity |
|----------|-----------|---------------------------|---------------------|----------|
| `DATABASE_URL` | pool.js:7 | Yes | Pool fails to connect — all DB queries fail with 500 | Critical — immediate failure |
| `JWT_SECRET` | auth.controller.js:12, auth.js:21 | Yes | jwt.sign/verify throws JsonWebTokenError — all auth fails with 500, server starts without error | **S08 — Critical** |
| `PORT` | server.js:111 | Yes | Defaults to 3001 — acceptable | None |
| `NODE_ENV` | server.js:70, errorHandler.js:56 | Yes | Defaults to 'development' — stack traces exposed | Low |
| `ALLOWED_ORIGINS` | server.js:37 | Yes | Defaults to 'http://localhost:5173' — production frontend blocked | Medium in production |

#### S08 — Critical: No startup validation for required environment variables

```js
// server.js — server starts successfully even if JWT_SECRET is undefined
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`BCC API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
```

If `JWT_SECRET` is not set (e.g., a misconfigured Railway deployment, a missing environment variable in a new environment), the server starts, logs "BCC API running on port 3001", and Railway marks it as healthy. The failure only surfaces when the first authentication attempt is made: `jwt.sign({...}, undefined, ...)` throws a `JsonWebTokenError` which propagates as a 500 error. All users are locked out with no indication of the root cause.

---

### 5b. Health Check Quality

```js
// server.js:78 — current implementation
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
```

#### S05 — Critical: Health check does not verify database connectivity

This endpoint:
- Always returns HTTP 200 regardless of system state
- Does NOT execute any database query
- Does NOT measure or report database latency
- Returns `status: 'ok'` even when PostgreSQL is completely unavailable
- Returns `status: 'ok'` even when the connection pool is exhausted

Railway's health check polls this endpoint to determine whether to route traffic to the instance. A database outage causes every API request to fail with 500 errors, while the health check continues to return 200/ok — Railway routes traffic to a broken instance and does not trigger failover or alerting.

A production-ready health check should:

```js
app.get('/health', async (req, res) => {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const latency = Date.now() - start;
    res.status(200).json({
      status: 'ok',
      db_latency_ms: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      message: 'Database unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});
```

---

### 5c. Graceful Shutdown

```js
// server.js:112 — complete server startup code
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`BCC API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
module.exports = app;
```

#### S06 — Critical: No SIGTERM handler — Railway deploys are destructive

Railway sends `SIGTERM` before every deploy, restart, scale-down, and maintenance event. Without a SIGTERM handler, the default Node.js behaviour is to terminate the process immediately (within Railway's kill timeout, which is typically a few seconds).

Consequences:
1. All in-flight HTTP requests are aborted at the network level — clients receive connection resets
2. Any active database transactions are abandoned — PostgreSQL rolls them back (ACID), but the client receives no response and may retry, creating duplicate requests
3. The pg connection pool is not drained cleanly — connections may be left in an indeterminate state on the PostgreSQL side until they time out
4. No cleanup hook runs — any in-memory state (rate limit counters, etc.) is lost without flush

For a financial system processing payments and orders, a request aborted mid-payment creation is particularly dangerous. The transaction would roll back (protecting data integrity), but the client receives a network error and a retry could create a duplicate payment.

---

### 5d. Logging Strategy

#### S12 — High: morgan('dev') used in production, no structured logging

```js
// server.js:70
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
```

Issues with the current logging setup:

1. **morgan 'dev' format** is a human-readable format (`GET /api/products 200 45.234 ms - 892`). It cannot be parsed by log aggregation systems (Datadog, Logtail, Railway's built-in logs). Structured JSON (e.g., `morgan('combined')` or a custom JSON format) is required for production observability.

2. **No correlation IDs** — Each HTTP request has no unique identifier in logs. When debugging a production issue, it is impossible to correlate the incoming request log with the database query log with the error log for the same request.

3. **No structured error logging** — `console.error('Unhandled error:', err)` in `errorHandler.js:52` logs the error object as a plain string/object. In production, this should be structured JSON including: request ID, user ID, org ID, route, error message, error code, stack trace.

4. **PII exposure in logs** — The morgan 'dev' format includes the full URL path. If customer names, emails, or other PII are ever included in query parameters (e.g., `?search=john.doe@email.com`), they will appear in access logs. A structured logger with URL sanitization would prevent this.

5. **No log level control** — There is no distinction between DEBUG, INFO, WARN, and ERROR logs. All logging goes to stdout/stderr via console.log/console.error.

---

### 5e. Error Handling Completeness

#### S07 — Critical: No process-level error handlers

```js
// Missing from server.js:
process.on('uncaughtException', (err) => { ... });
process.on('unhandledRejection', (reason) => { ... });
```

The global Express error handler middleware (`app.use(errorHandler)`) only catches errors that are explicitly passed to `next(err)` within route handlers. It does NOT protect against:

- Synchronous errors thrown during module loading or app initialization
- Errors thrown inside pool event handlers (`pool.on('error', ...)` partially handles this but does not exit gracefully)
- Errors thrown in any asynchronous code outside the Express request lifecycle (e.g., a background timer, a startup migration check)
- Unhandled Promise rejections from non-route code

Without `unhandledRejection` handler, in Node.js v15+, an unhandled rejection terminates the process immediately. In earlier versions it was silent. Either way, there is no log entry and no graceful shutdown.

Without `uncaughtException` handler, any uncaught synchronous error terminates the process with a stack trace to stderr but no structured log, no cleanup, and no graceful connection draining.

---

### 5f. Database Resilience

| Configuration | Value | Assessment |
|--------------|-------|------------|
| `max` connections | 10 | Appropriate for Railway Starter tier |
| `idleTimeoutMillis` | 30000 (30s) | Reasonable — returns idle connections to the pool |
| `connectionTimeoutMillis` | 5000 (5s) | Good — fails fast on connection issues |
| `query_timeout` | 30000 (30s) | Good — prevents indefinite hangs on lock waits |
| SSL for remote databases | Auto-detected by hostname | Good — enabled for non-localhost connections |
| `rejectUnauthorized: false` | Yes (for remote SSL) | Disables certificate verification — acceptable for Railway internal network; not ideal for external DB |
| Pool error logging | `pool.on('error', console.error)` | Logs but does not crash — correct |
| Connection retry on startup | None | If DB is unavailable at startup, pool creation fails silently |

---

### 5g. Schema Migration Safety

#### S25 — Medium: No formal migration system

The current state:
- One `schema.sql` file with `CREATE TABLE`, `CREATE INDEX`, and `CREATE EXTENSION` statements
- No `IF NOT EXISTS` on any DDL statement
- No migration history table (no record of what has been applied)
- No rollback scripts
- Seed data (`INSERT INTO roles`, `INSERT INTO units`, `INSERT INTO return_reasons`) at the bottom — would duplicate on re-run

Running `schema.sql` against an existing database fails immediately on the first `CREATE TABLE organizations` with `ERROR: relation "organizations" already exists`. This means:
- You cannot use this file to apply incremental schema changes
- Any schema change requires manual SQL execution with no tracking
- There is no way to know which version of the schema is deployed in any environment

For a production system, every schema change should go through a migration file (`V001__initial.sql`, `V002__add_active_to_locations.sql`, etc.) managed by a tool like `node-pg-migrate`, `Flyway`, or `golang-migrate`. Migrations should be committed alongside the code changes that require them.

---

## SECTION 6 — CODE QUALITY, MAINTAINABILITY, AND SCALABILITY

### 6a. Dead Code

#### S16 — High: Bundles schema with zero implementation

`schema.sql:125-138` defines two fully formed tables:

```sql
CREATE TABLE bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  UNIQUE (bundle_id, product_id)
);
```

There are zero references to `bundles` or `bundle_items` in any `.js` file. No routes, no controllers, no services, no queries. These tables exist in the production database, occupy space, are included in database backups, but serve no function. Either implement bundle functionality (routes, controllers, service logic for stock deduction on bundle sale) or drop these tables from the schema.

#### S17 — High: getOrgStockSummary is dead exported code

```js
// stock.service.js:52-64
const getOrgStockSummary = async (client, orgId) => {
  const result = await client.query(
    `SELECT sl.product_id, sl.variant_id, sl.location_id,
            SUM(sl.quantity_change)::INTEGER AS stock_on_hand
     FROM stock_ledger sl
     JOIN products p ON p.id = sl.product_id
     WHERE p.organization_id = $1
     GROUP BY sl.product_id, sl.variant_id, sl.location_id
     HAVING SUM(sl.quantity_change) > 0`,
    [orgId]
  );
  return result.rows;
};

module.exports = { getStockOnHand, insertLedgerEntry, getOrgStockSummary };
```

`getOrgStockSummary` is exported but never imported or called by any file in the codebase. It may have been intended for a stock report endpoint that was not implemented, or it is leftover from a refactor. It should either be called from a stock report endpoint (which is a needed report — see S35) or removed.

---

### 6b. Code Duplication

**Pagination logic** is duplicated identically across 11 controllers:

```js
const page = Math.max(1, parseInt(req.query.page) || 1);
const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
const offset = (page - 1) * limit;
```

This pattern appears in: branches, locations, users, categories, products, customers, suppliers, purchase-orders, sales-orders, transfers, returns controllers. A shared `parsePagination(query, defaultLimit, maxLimit)` utility would reduce this to one line per controller and centralize any future pagination logic changes.

**Org-scoping check** pattern appears ~20 times:
```js
const chk = await pool.query(
  `SELECT id FROM <table> WHERE id = $1 AND organization_id = $2`,
  [req.params.id, req.user.org_id]
);
if (!chk.rows.length) return res.status(404).json({ ... });
```

This is inherent to the architecture and acceptable at this level of repetition. The risk is that a future developer adding a new endpoint might forget the `AND organization_id = $2` clause — the existing code serves as a clear template.

---

### 6c. Magic Numbers and Strings

| Value | Location | Issue |
|-------|----------|-------|
| `0.01` | payments.controller.js:57 | Float comparison tolerance for overpayment check — should be `const PAYMENT_TOLERANCE = 0.01` |
| `0.01` | payments.controller.js:63 | Same tolerance for determining paid/partially_paid status |
| `0.01` | returns.controller.js:85 | Refund amount tolerance |
| `'7d'` | auth.controller.js:14 | JWT expiry — should be `const JWT_EXPIRY = '7d'` or env var |
| `15 * 60 * 1000` | server.js:53, 60 | Rate limit windows — commented, but should be named constants |
| `500` | server.js:52 | Global rate limit max — magic number |
| `20` | server.js:60 | Auth rate limit max — magic number |
| `100` | Multiple controllers | Default max page size — duplicated in 11 places |
| `20` | Multiple controllers | Default page size — duplicated in 11 places |
| `200` | stock.controller.js:56 | Ledger-specific max page size — inconsistent with other 100-max endpoints |
| `12` | auth.controller.js:8, users.controller.js:7 | BCRYPT_ROUNDS — correctly defined as a named constant in each file but defined twice |
| `'owner'`, `'admin'`, `'staff'`, `'readonly'` | Scattered across 8+ files | Role name strings — should be a shared constants file |
| `'pending'`, `'draft'`, `'cancelled'`, etc. | Routes and controllers | Status strings duplicated between validators and state machine logic |

---

### 6d. Naming and Convention Consistency

| Convention | Status | Notes |
|-----------|--------|-------|
| File names: kebab-case | Consistent | All files follow kebab-case |
| Function names: camelCase | Consistent | All functions are camelCase |
| Database columns: snake_case | Consistent | All columns are snake_case |
| API request fields: snake_case | Consistent | API accepts snake_case matching DB columns |
| API response fields: snake_case | Consistent | Responses use snake_case |

One minor inconsistency: `locations.controller.js remove` returns `'Location deleted'` (hard delete) while `branches.controller.js remove` returns `'Branch deactivated'` (soft delete). The messaging is technically correct for each operation, but the inconsistency is slightly confusing when reading API responses — a consumer seeing 'deleted' vs. 'deactivated' might wonder if the semantics differ. They do — but this should be consistent or documented.

---

### 6e. Dependency Audit

| Package | Used | Purpose | Version | Known CVEs | Notes |
|---------|------|---------|---------|------------|-------|
| `bcryptjs` | Yes | Password hashing | ^2.4.3 | None known | Pure JS implementation — slower than native `bcrypt` but zero native deps; cost 12 is appropriate |
| `cors` | Yes | CORS middleware | ^2.8.5 | None known | No issues |
| `dotenv` | Yes | Environment variable loading | ^16.4.5 | None known | No issues |
| `express` | Yes | HTTP framework | ^4.18.3 | None known | No issues; Express 5 is now stable but migration not required |
| `express-rate-limit` | Yes | Rate limiting | ^7.2.0 | None known | No issues |
| `express-validator` | Yes | Input validation | ^7.1.0 | None known | No issues |
| `helmet` | Yes | Security headers | ^7.1.0 | None known | No issues |
| `jsonwebtoken` | Yes | JWT sign/verify | ^9.0.2 | None known | No issues; algorithm confusion attacks blocked in v9 |
| `morgan` | Yes | HTTP request logging | ^1.10.0 | None known | 'dev' format used — S12 |
| `pg` | Yes | PostgreSQL client | ^8.11.3 | None known | No issues |
| **`uuid`** | **No** | UUID generation | ^9.0.1 | None known | **S31 — Installed but never required anywhere** |

`uuid` is listed in `package.json` dependencies but `require('uuid')` does not appear in any JavaScript file in the codebase. All UUID generation uses PostgreSQL's `gen_random_uuid()` function (from the pgcrypto extension). This is an unused dependency that adds to bundle size, surface area for supply chain attacks, and dependency maintenance burden.

**Missing packages that would address audit findings:**
- `winston` or `pino` — structured JSON logging with log levels (addresses S12)
- `compression` — gzip response compression for performance
- `node-pg-migrate` or similar — formal migration management (addresses S25)

---

### 6f. Documentation Gaps

#### S34 — Low: No README, no API documentation

- No `README.md` file exists in the repository
- No `SETUP.md` or developer onboarding guide
- No Swagger/OpenAPI specification — API endpoints are only discoverable by reading route files
- No architecture decision records explaining choices (advisory locks, soft delete, append-only ledger, JWT-only auth)
- No inline comments on complex business logic (e.g., the advisory lock pattern in `stock.service.js`, the credit semantics in `payments.controller.js`, the state machine in `sales-orders.controller.js`)
- `.env.example` exists and is accurate — the one documentation artifact that is present

A new developer joining the team would need to read all 50 source files to understand the system, with no guide for where to start or why certain patterns were chosen.

---

## FINAL COUNT

| Severity | Count |
|----------|-------|
| **Critical** | 8 |
| **High** | 10 |
| **Medium** | 10 |
| **Low** | 7 |
| **Info** | 3 |
| **Total** | **38** |

---

## TOP 5 MOST URGENT FIXES

### #1 — S03: Returns do not update customer credit balance (Critical — Silent Financial Corruption)

**File:** `src/controllers/returns.controller.js`

**Impact:** Every return processed in the system where the refund is intended as store credit silently corrupts the customer's financial record. `total_refund_amount` is stored in the `returns` table but never applied to `customers.credit_balance`. The customer cannot redeem credit that was supposedly given. Business owners see a refund number in the return record and assume the customer was credited — they were not.

**Full trace of the bug:**
```
POST /api/returns called with items and refund amounts
  -> return record created with total_refund_amount = $X
  -> return_items created with refund_amount values
  -> stock restored to ledger (correct)
  -> customers.credit_balance UNCHANGED (bug)
```

**Fix:** Inside the `withTransaction` callback in `returns.controller.js`, after the return items loop:

```js
// Add this block after the return_items loop, before auditService.log:
if (totalRefund > 0 && so.customer_id) {
  await client.query(
    `UPDATE customers
     SET credit_balance = credit_balance + $1, updated_at = NOW()
     WHERE id = $2`,
    [totalRefund, so.customer_id]
  );
}
```

---

### #2 — S01: Deactivated users retain valid JWT tokens (Critical — Active Security Breach Vector)

**File:** `src/middleware/auth.js:21`

**Impact:** When an employee's account is deactivated (fired, resigned, security incident), they retain full authenticated API access for up to 7 days — the JWT lifetime. During this window they can read all financial data, create orders, process payments, adjust stock, and access customer information. For a multi-tenant SaaS serving business customers, this is a direct path to data exfiltration by a terminated employee.

**Fix:** Add a database lookup in the `authenticate` middleware after `jwt.verify` succeeds:

```js
// src/middleware/auth.js — add after jwt.verify:
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'UNAUTHENTICATED', message: 'Authentication token required' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    // Verify user is still active in the database
    const { pool } = require('../db/pool');
    const check = await pool.query(
      'SELECT active FROM users WHERE id = $1',
      [decoded.sub]
    );
    if (!check.rows.length || !check.rows[0].active) {
      return res.status(401).json({ success: false, error: 'INVALID_TOKEN', message: 'Account is deactivated' });
    }

    req.user = { id: decoded.sub, org_id: decoded.org, role: decoded.role, name: decoded.name };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'INVALID_TOKEN', message: 'Token is invalid or expired' });
  }
};
```

This adds one indexed query per authenticated request. The `users.id` column is a PK (automatically indexed) so this query is O(1) and takes <1ms in normal conditions.

---

### #3 — S04: Purchase order updateStatus race condition (Critical — Concurrent State Corruption)

**File:** `src/controllers/purchase-orders.controller.js:133-164`

**Impact:** Two concurrent requests (e.g., two admin users both receiving and cancelling the same PO simultaneously) can both read the same current status, both pass transition validation, and both execute the UPDATE — with the last write winning silently. A PO could end up in an inconsistent state (marked `received` when it was also marked `cancelled`) with no error logged and no indication to either user.

**Fix:** Wrap the entire operation in `withTransaction` with `SELECT FOR UPDATE`, matching the pattern already used correctly in `sales-orders.updateStatus`:

```js
// src/controllers/purchase-orders.controller.js updateStatus
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const orgId = req.user.org_id;

    const result = await withTransaction(async (client) => {
      const chk = await client.query(
        `SELECT status FROM purchase_orders WHERE id = $1 AND organization_id = $2 FOR UPDATE`,
        [id, orgId]
      );
      if (!chk.rows.length) {
        const err = new Error('Purchase order not found');
        err.isAppError = true; err.statusCode = 404; err.errorCode = 'NOT_FOUND'; throw err;
      }

      const current = chk.rows[0].status;
      const validTransitions = {
        draft: ['submitted', 'cancelled'],
        submitted: ['partially_received', 'received', 'cancelled'],
        partially_received: ['received', 'cancelled'],
      };
      if (!validTransitions[current] || !validTransitions[current].includes(status)) {
        const err = new Error(`Cannot transition from '${current}' to '${status}'`);
        err.isAppError = true; err.statusCode = 422; err.errorCode = 'BUSINESS_RULE'; throw err;
      }

      const updated = await client.query(
        `UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, id]
      );
      await auditService.log({ client, orgId, userId: req.user.id, action: 'status_change', entity: 'purchase_orders', entityId: id, changes: { from: current, to: status } });
      return updated.rows[0];
    });

    return res.json({ success: true, data: result, message: `Status updated to ${status}` });
  } catch (err) { next(err); }
};
```

---

### #4 — S05 + S06 + S07: No DB health check, no graceful shutdown, no crash handlers (Critical — Deployment Reliability)

These three findings together mean the application cannot be safely deployed to a production environment. They are grouped because they share the same file and should be fixed together.

**S05 Impact:** Database outages appear healthy to Railway's load balancer. Traffic continues routing to a broken instance.

**S06 Impact:** Every Railway deploy, restart, or scale event drops in-flight HTTP requests. For a system processing financial transactions, a payment request aborted mid-flight results in a rolled-back transaction on the server but a network error on the client — the client may retry and create a duplicate payment attempt.

**S07 Impact:** Any programming error outside the Express request lifecycle (module initialization, pool events, background jobs) crashes the process silently with no structured log entry, no graceful connection draining, and no audit trail.

**Fix — all three in `server.js`:**

```js
'use strict';

require('dotenv').config();

// S08 — Validate required environment variables at startup
['DATABASE_URL', 'JWT_SECRET'].forEach((key) => {
  if (!process.env[key]) {
    console.error(`FATAL: Required environment variable ${key} is not set. Exiting.`);
    process.exit(1);
  }
});
if (process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET is too short. Minimum 32 characters required. Exiting.');
  process.exit(1);
}

// ... existing requires and app setup ...

// S07 — Process-level crash handlers
process.on('uncaughtException', (err) => {
  console.error('FATAL uncaughtException:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL unhandledRejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// S05 — Production health check with DB probe
const { pool } = require('./src/db/pool');
app.get('/health', async (req, res) => {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      db_latency_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      message: 'Database unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

// ... routes ...

// S06 — Graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`BCC API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed. Draining database pool...');
    await pool.end();
    console.log('Database pool drained. Exiting.');
    process.exit(0);
  });
  // Force exit after 10 seconds if graceful shutdown stalls
  setTimeout(() => {
    console.error('Graceful shutdown timed out. Force exiting.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

---

### #5 — S08 + S02: No env var startup validation, no login audit (Critical — Silent Failures + Forensic Blind Spot)

**S08 — Impact:** A misconfigured deployment (missing `JWT_SECRET` on Railway, a `.env` file not copied to a new environment, a typo in an environment variable name) starts the server successfully, passes Railway's health check (before S05 is fixed), and silently breaks all authentication. Users see 500 errors with no actionable message. Debugging requires checking Railway environment variables — which is non-obvious.

**S02 — Impact:** There is no forensic record of when users log in. After a security incident (unauthorized access, data theft, fraud), it is impossible to determine:
- When the attacker first authenticated
- How many failed attempts preceded a successful login
- From which token a specific audit action was performed
- Whether a compromised credential was used

**Fix for S08 — add at top of `server.js` (shown in Fix #4 above).**

**Fix for S02 — `src/controllers/auth.controller.js`:**

```js
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const userRes = await pool.query(
      `SELECT u.*, r.name AS role_name
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.email = $1
       LIMIT 1`,
      [email]
    );

    const user = userRes.rows[0];
    const genericError = { success: false, error: 'UNAUTHENTICATED', message: 'Invalid credentials' };

    if (!user) return res.status(401).json(genericError);
    if (!user.active) return res.status(401).json(genericError);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // Log failed login attempt
      await auditService.log({
        client: pool,
        orgId: user.organization_id,
        userId: user.id,
        action: 'login_failed',
        entity: 'users',
        entityId: user.id,
      });
      return res.status(401).json(genericError);
    }

    // Log successful login
    await auditService.log({
      client: pool,
      orgId: user.organization_id,
      userId: user.id,
      action: 'login',
      entity: 'users',
      entityId: user.id,
    });

    const token = issueToken(user, user.role_name || 'staff');
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role_name || 'staff',
          organization_id: user.organization_id,
        },
      },
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
};
```

---

## REMAINING FIXES IN PRIORITY ORDER

| Priority | ID | Severity | Fix Summary | File |
|----------|----|----------|-------------|------|
| 6 | S13 | High | Add `AND active = TRUE` to customer check in sales order create | sales-orders.controller.js:62 |
| 7 | S14 | High | Add `AND b.active = TRUE` to locations list where clause | locations.controller.js:14 |
| 8 | S10 | High | Block manual `paid`/`partially_paid` status transitions or add payment verification | sales-orders.controller.js:195 |
| 9 | S11 | High | Add LIMIT/OFFSET pagination to GET /api/stock | stock.controller.js:12 |
| 10 | S12 | High | Replace morgan('dev') with structured JSON logging; add request correlation IDs | server.js:70 |
| 11 | S18 | Medium | Wrap changePassword in withTransaction with SELECT FOR UPDATE | auth.controller.js:178 |
| 12 | S20 | Medium | Validate unit_id belongs to org or is a global unit in product create/update | products.controller.js:47,114 |
| 13 | S21 | Medium | Add `from <= to` validation to all report and expense list date range parameters | reports.controller.js, expenses.routes.js |
| 14 | S22 | Medium | Decide and enforce consistent behaviour: getOne for soft-deleted customers (return 404 or return with `active=false` flag) | customers.controller.js:43 |
| 15 | S23 | Medium | Same decision for branches getOne | branches.controller.js:45 |
| 16 | S24 | Medium | Add `active` column to locations table or document that locations use hard delete intentionally | schema.sql |
| 17 | S25 | Medium | Adopt a migration tool; at minimum add `IF NOT EXISTS` to all DDL in schema.sql | schema.sql |
| 18 | S26 | Medium | Log login success and failure to audit_log (included in Fix #5 above) | auth.controller.js |
| 19 | S27 | Medium | Add GET /api/expenses/categories/:id and PATCH /api/expenses/categories/:id | expenses.routes.js |
| 20 | S28 | Medium | Add GET /api/payments/:id endpoint | payments.routes.js, payments.controller.js |
| 21 | S29 | Low | Replace SELECT * with explicit column lists in login and changePassword | auth.controller.js:114,182 |
| 22 | S30 | Low | Add `{ algorithms: ['HS256'] }` to all jwt.verify() calls | auth.js:21 |
| 23 | S31 | Low | Remove uuid from package.json dependencies | package.json |
| 24 | S32 | Low | Add a more specific movement_type (e.g., 'cancellation') to schema and use it for order cancellation stock restoration | schema.sql, sales-orders.controller.js:230 |
| 25 | S33 | Low | Add GET /api/audit-log endpoint with pagination and filtering by entity/action/user/date | New route + controller |
| 26 | S34 | Low | Add README.md with setup instructions; add OpenAPI/Swagger spec | Project root |
| 27 | S16 | High | Either implement bundle routes/controller/service or DROP TABLE bundles/bundle_items | schema.sql |
| 28 | S17 | High | Either use getOrgStockSummary in a stock valuation endpoint or remove it | stock.service.js:52 |

---

## WHAT IS DONE WELL

This section acknowledges the significant strengths of the codebase that reduce risk:

1. **BOLA/IDOR protection is comprehensive** — Every single UUID-parameterized query correctly filters by organization_id. This is the #1 API vulnerability class and it is handled correctly throughout.

2. **Mass assignment is prevented** — All PATCH endpoints use explicit `allowedFields` arrays. Sensitive fields (`organization_id`, `credit_balance`, `password_hash`, `role`) cannot be injected via request body.

3. **SQL injection is fully prevented** — Every query uses parameterized placeholders. No string concatenation of user input. Dynamic WHERE clauses build query text safely.

4. **Transaction usage is generally correct** — All multi-step operations use `withTransaction`. The most financially critical flows (payments, order creation, returns, transfers) are atomic. The missing cases (PO status update, changePassword) are the exception, not the rule.

5. **Stock race conditions are handled** — The advisory lock pattern in `insertLedgerEntry` with `pg_advisory_xact_lock` plus `FOR UPDATE` on the sales order is a well-engineered solution to the concurrent over-sell problem.

6. **CORS and security headers are correct** — Helmet defaults, explicit origin whitelist, no wildcard CORS.

7. **Password security is correct** — bcrypt rounds 12, max length 72 enforced, hashes never returned in responses.

8. **FK constraints protect data integrity** — Every foreign key relationship uses `ON DELETE RESTRICT`, preventing orphaned records at the database level as a safety net.

9. **Soft delete is used for all user-facing entities** — Users, products, customers, suppliers, branches — none are hard-deleted, preserving historical references and audit trails.

10. **Role hierarchy is enforced consistently** — `requireMinRole` is applied correctly to every write operation. Readonly users cannot write. Staff cannot perform admin operations. The escalation path (staff < admin < owner) is correctly implemented.

---

*End of Audit — BCC Backend Round 4 — 2026-03-07*
