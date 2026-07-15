# BCC FULL PROJECT STATE AUDIT — VERIFIED REALITY RESET
**Asrom Labs | Business Command Center**
**Audit executed:** 15 Jul 2026 (prompt dated 2 Apr 2026 — see note) | **Brain baseline:** v4.7 | **Build baseline:** 3,048 modules, 0 errors
**Method:** Read-everything / verify-everything. Every verdict cites the file (and line where useful) that proves it. No code file was modified.

> **Date note:** The audit prompt and its filename reference 2 Apr 2026; the audit was actually executed on 15 Jul 2026 against the working tree at commit `7e45df4` plus uncommitted changes (see §1.3). All findings reflect the code as of execution.

---

## 1. EXECUTIVE SUMMARY

1. **True state: 13 of 22 pages fully built (59%); the 9 Wave 4 pages are genuine 16-line placeholders.** The brain's Section 2.3 page table is **accurate** — the git-status contradiction that motivated this audit is explained by uncommitted work: the only dirty files are the brain itself and the 5 PUT→PATCH API fixes from v4.7, **which were never committed**.
2. **Single most important finding: the June-2026 launch has no onboarding and no invoice.** There is no signup UI (backend `POST /auth/register` is complete and transactional, but nothing in the frontend calls it) and **zero PDF/invoice/print capability anywhere in either codebase** — the strategy's flagship feature does not exist.
3. **Multi-tenancy verdict: PASS** — every controller query is org-scoped (see §5.1); no cross-tenant leak found. SQL is fully parameterized.
4. **MVP readiness: NOT pilot-ready.** Core operations loop (product → PO → receive → stock → transfer → SO → payment → return) works end-to-end, but Settings/Admin, Expenses, Reports, Audit Log, Profile are stubs; role enforcement is backend-only (frontend has zero route guards); and 4 live functional bugs were found (§8).
5. **Top 3 risks:** (a) **sales-order channel enum mismatch** — frontend offers `walk_in`/`phone`, backend validators reject both → creating/filtering those orders fails with 400 (§8, BUG-11); (b) **StockPage reads `quantity_on_hand`/`is_low_stock`, backend returns `stock_on_hand` and no `is_low_stock`** → quantity column renders blank and low-stock badges never show (§8, BUG-12); (c) **process risk** — five sessions of work sit uncommitted; brain drift already cost hours (RULE-35 added in brain v4.8).
6. Secrets are safe: `backend/.env` is gitignored and has **never been committed** (`git log --all -- backend/.env` is empty). No rotation needed.
7. Localization is in excellent shape: 560/560 EN↔AR key parity, 0 missing referenced keys, 0 Arabic quality defects (§7).
8. API layer is healthy: **85/85 frontend functions match backend routes** (method+path), PATCH-only on both sides. Real endpoint count is **94 across 20 modules** (brain claimed "104 across 19" and separately "37 across 10" — both wrong).

---

## 2. PAGE STATUS TABLE (all 22 pages, verified by reading every file)

| # | Page | File | Lines | Status | Gaps found |
|---|------|------|-------|--------|-----------|
| 1 | Login | `auth/LoginPage.jsx` | 325 | ✅ FULLY BUILT | Hardcoded "BCC" logo (L161, 204); `aria-label="Switch to …"` not i18n'd (L113); decorative orbs use physical `-left-40`/`-right-48` (L131-139, aria-hidden, cosmetic) |
| 2 | Dashboard | `dashboard/DashboardPage.jsx` | 486 | ✅ FULLY BUILT | Raw untranslated `order.channel` (L239) and `order.status` (L246) in recent orders; inline `borderLeftColor` style not RTL-aware (L97); ignores shared components (predates them — acceptable) |
| 3 | Categories | `categories/CategoriesPage.jsx` | 333 | ✅ FULLY BUILT | No role guard (backend enforces admin) |
| 4 | Units | `units/UnitsPage.jsx` | 330 | ✅ FULLY BUILT | No role guard |
| 5 | Products | `products/ProductsPage.jsx` | 638 | ✅ FULLY BUILT | No role guard; product mutations don't invalidate `['stock']` |
| 6 | Stock | `stock/StockPage.jsx` | 190 | ⚠️ BUILT BUT BROKEN | **BUG-12: reads `row.quantity_on_hand` (L90, 98) and `row.is_low_stock` (L95, 115) — backend returns `stock_on_hand` and no `is_low_stock` field** (stock.controller.js L44-49). Qty column blank; low-stock badge never renders. Low-stock filter tab itself works (server-side `low_stock: true`) |
| 7 | Suppliers | `suppliers/SuppliersPage.jsx` | 381 | ✅ FULLY BUILT | Import wired ✓. No role guard |
| 8 | Customers | `customers/CustomersPage.jsx` | 371 | ✅ FULLY BUILT | Import wired ✓. No role guard |
| 9 | Purchase Orders | `purchase-orders/PurchaseOrdersPage.jsx` | 831 | ✅ FULLY BUILT | One-time supplier ✓. Receive doesn't invalidate `['stock']`. No role guard |
| 10 | Sales Orders | `sales-orders/SalesOrdersPage.jsx` | 1055 | ⚠️ BUILT, 1 LIVE BUG | One-time customer ✓, Record Payment ✓, Create Return ✓, OVERPAYMENT handling ✓ (L288-296). **BUG-11: channel enum mismatch** — CHANNEL_OPTIONS (L156-163) offers `walk_in`/`phone`, backend rejects both; backend values `in_store`/`snapchat`/`tiktok` have no translation → raw key renders |
| 11 | Payments | `payments/PaymentsPage.jsx` | 188 | ✅ FULLY BUILT | Read-only by design (client-side derived status). "View order" goes to the generic list, not the order (minor UX) |
| 12 | Returns | `returns/ReturnsPage.jsx` | 326 | ✅ FULLY BUILT | Two-step modal ✓, `r.reason` field ✓. Order load requires pasting a raw UUID (poor UX, works) |
| 13 | Transfers | `transfers/TransfersPage.jsx` | 588 | ✅ FULLY BUILT | BUG-10 still fixed ('completed'→blue, L79, 360). Confirm/cancel don't invalidate `['stock']` |
| 14 | Organization | `organization/OrganizationPage.jsx` | 16 | 🔲 PLACEHOLDER | "Coming soon." stub |
| 15 | Branches | `branches/BranchesPage.jsx` | 16 | 🔲 PLACEHOLDER | stub |
| 16 | Locations | `locations/LocationsPage.jsx` | 16 | 🔲 PLACEHOLDER | stub |
| 17 | Users | `users/UsersPage.jsx` | 16 | 🔲 PLACEHOLDER | stub |
| 18 | Expenses | `expenses/ExpensesPage.jsx` | 16 | 🔲 PLACEHOLDER | stub |
| 19 | Reports | `reports/ReportsPage.jsx` | 16 | 🔲 PLACEHOLDER | stub |
| 20 | Audit Log | `audit-log/AuditLogPage.jsx` | 16 | 🔲 PLACEHOLDER | stub |
| 21 | Profile | `profile/ProfilePage.jsx` | 16 | 🔲 PLACEHOLDER | stub |
| 22 | Change Password | `profile/ChangePasswordPage.jsx` | 16 | 🔲 PLACEHOLDER | stub |

**Cross-page verified facts:**
- Currency pattern (RULE-21) correct on all 6 pages that display money (Dashboard, Products, PO, SO, Payments, Returns).
- Zod schemas present with i18n-key error messages on every form page; all 22 schema keys resolve in both languages.
- RTL: zero Tailwind-class violations on any built page. Only two cosmetic physical-direction leftovers (Dashboard L97 inline style; Login decorative orbs).
- No TODO/FIXME/console.log anywhere in `frontend/src` pages.
- **Role guard: none of the 13 built pages has any `isAdmin`/`isStaff` guard, and App.jsx has zero route-level guards.** Sidebar `minRole` is visibility-only. Any authenticated readonly user can open any URL (data mutation is still blocked by backend roles).

### Special verifications (Prompt A / B / RULE-26)
- **1a. One-time customer/supplier: COMPLETE and correct** in both SalesOrdersPage (sentinel L921-923, conditional input L930-938, null ID L395, name-only-when-typed L396-398, reset on all 4 close paths L225-230/362/858-867/1030-1037) and PurchaseOrdersPage (L695-697, L704-712, L278-281, reset L184-188/234/653-660/807-813).
- **1b. Import wiring: Customers + Suppliers only**, exactly as the brain says. Suppliers fields: name(req)/email/phone/address/contact_person → `createSupplier` per row; Customers: name(req)/email/phone/address → `createCustomer`. ImportModal is a full 5-screen xlsx wizard (parse → auto+manual mapping → validate → sequential per-row import with progress → summary). Products, Expenses, Stock still have NO import (Prompt B never ran).
- **1c. Record Payment + Create Return modals: present and complete.** OVERPAYMENT (RULE-26) handled exactly to spec — catches `error.error === 'OVERPAYMENT'`, regex-extracts the remaining balance, shows `t('payments.overpaymentError', { remaining })` (SalesOrdersPage L288-296).

---

## 3. WAVE 4 REALITY

**The brain was right; the git status was misread.** All 9 Wave 4 pages are 16-line "Coming soon." placeholders. What actually happened in unrecorded sessions:

| Layer | Brain claim (v4.7) | Verified reality |
|---|---|---|
| Wave 4 pages | 9 placeholders | ✅ Confirmed — 9 identical stubs |
| Wave 4 API modules | "to be created in Wave 4" | ❌ **Already exist**: `branches.js`, `users.js`, `expenses.js`, `organizations.js`, `reports.js`, `auditLog.js` all on disk, correct PATCH methods, **none imported by any page** (dead until Wave 4 builds) |
| Module naming | plan says `organization.js`, `profile.js` | actual file is `organizations.js`; no `profile.js` (auth.js already has `me` + `changePassword`) |
| locations.js | "list only — extend in Wave 4" | ✅ Confirmed — `fetchLocations` is the only export |

**The 19-item Postman checklist (brain §13.1) — now largely answerable from code:**

| # | Item | Status after this audit |
|---|---|---|
| 1-2 | GET/PATCH /organizations/me | ✅ Verified from code: PATCH accepts optional name/country/currency, admin+ |
| 3-4 | branches list/create | ✅ Verified: paginated list; POST requires `name`, optional `city`; DELETE is **owner-only** |
| 5-6 | locations getOne/create | ✅ Verified: POST requires `branch_id` (UUID), `name`, `type` (warehouse\|store); DELETE **owner-only** |
| 7-9 | users list/create/update | ✅ Verified: admin-only module; POST requires name/email/password(8-72)/role(admin\|staff\|readonly); PATCH accepts name/role/active (no password); DELETE **owner-only** |
| 10-13 | expenses + categories | ✅ Verified: GET /expenses filters category_id/location_id/from/to; POST requires category_id, amount>0, date; categories full CRUD admin+ |
| 14-16 | report endpoints | ✅ Verified paths — **but the 4th report is `/reports/sales-by-channel`, NOT `sales-by-source`** (brain §5 is wrong). Exact response field names per item still benefit from one Postman pass |
| 17 | GET /audit-log | ✅ Verified: admin+, filters entity/action/user_id/from/to, limit max 200 |
| 18 | PATCH /auth/password | ✅ Verified: `current_password`, `new_password` (8-72) |
| 19 | Profile update endpoint | ⚠️ **CONFIRMED GAP: no PATCH /auth/me or /users/me exists.** Profile page can only display `GET /auth/me` and change password. Self-service name/email edit needs a new backend route |

**Remaining Postman-worthy items: only response-shape spot checks for the 3 report endpoints (#14-16) and org object field list (#1).** Everything else is now verified in code. The checklist shrinks from 19 items to ~4.

---

## 4. API CROSS-CHECK (Phase 3)

**Verdict: 85/85 frontend functions MATCH a backend route** (method + path). Zero method mismatches, zero path mismatches, zero missing routes. Both layers are PATCH-only: no `api.put` in any frontend module, no `router.put` in any backend route file.

**One BODY-VALUE mismatch found at the enum level (not caught by path matching):**

| Frontend | Sends | Backend validator | Verdict |
|---|---|---|---|
| SalesOrdersPage CHANNEL_OPTIONS | `walk_in`, `phone` (+ online/whatsapp/instagram/other) | `isIn(['in_store','whatsapp','instagram','snapchat','tiktok','online','other'])` — both create body (sales-orders.routes.js L24) and list query (L14) | **ENUM MISMATCH — 400 on create/filter with walk_in or phone** |

**Unused backend endpoints (13) — no frontend caller (feeds Wave planning):**
- Locations CRUD (4): POST, GET :id, PATCH, DELETE → Wave 4 P2
- Product variants (5): full nested CRUD → post-MVP or Products page enhancement
- Customer notes (1): POST /customers/:id/notes → Customers detail enhancement
- Stock (3): GET /stock/summary, GET /stock/ledger, POST /stock/adjust → Stock page enhancement (ledger view + adjust modal)

**Verified endpoint count: 94 routes across 20 modules** (+1 non-API `/health`): auth 4, organizations 2, branches 5, locations 5, categories 5, units 5, products 5, product-variants 5, customers 6, suppliers 5, transfers 5, purchase-orders 5, sales-orders 4, returns 4, expenses 10, stock 4, payments 3, reports 6, audit-log 1, users 5.
Brain claims of "104 endpoints across 19 modules" (§2.4) and "37 endpoints across 10 modules" are both wrong.

**Role-requirement map worth knowing for Wave 4 UI:** branch/location/user DELETE are **owner**-only (not admin); PO create + status are admin, but PO receive is staff; transfers create is staff but confirm/cancel are **admin**; all /reports/* require **staff+** (readonly users get 403 — yet the Sidebar shows Reports to readonly; see §8 issue N-6).

---

## 5. BACKEND DEEP AUDIT (Phase 4)

### 5.1 Multi-tenancy — **VERDICT: PASS (no cross-tenant data leak)**
Every controller function that reads or writes tenant data is scoped to `req.user.org_id` — either directly (`organization_id = $n`) or via an org-checked parent lookup (nested resources: product variants, customer notes, payments-by-order, return items, PO/SO items). Units are intentionally global-or-org (`organization_id = $1 OR organization_id IS NULL`, units.controller L14), with mutations org-scoped so system units are immutable. Reports, stock, audit-log all filter by org. Full 60-row matrix in the audit working notes; zero functions returned another org's data.

**Two PARTIAL findings (cross-tenant *reference* injection, LOW-MED — integrity, not disclosure):**
1. `expenses.create`/`expenses.update` insert `location_id` **without validating it belongs to the caller's org** (expenses.controller L131-133, L176-182). A caller can tag an expense with another org's location UUID.
2. `stock.adjust` validates product and location against the org but passes `variant_id` to the ledger **unvalidated** (stock.controller L120, L141).

Both should adopt the same org-check their sibling controllers already perform.

### 5.2 SQL safety — **PASS**
All queries use `$1/$2` placeholders. Every dynamic fragment audited: WHERE builders bind values and interpolate only placeholder indexes; UPDATE SET builders interpolate only **whitelisted column names** (`allowedFields`); ORDER BY is always hardcoded; LIMIT/OFFSET bound and clamped; ILIKE search terms passed as bound params. Zero injection vectors.

### 5.3 Auth
- bcryptjs cost **12**; JWT HS256 pinned on verify (`algorithms: ['HS256']`), 24h expiry, payload `{sub, org, role, name}`; **live DB `active` check on every request** (middleware/auth.js L26) so deactivated users are cut off immediately.
- Role hierarchy readonly(1) < staff(2) < admin(3) < owner(4) — consistent with frontend ROLE_HIERARCHY (0-3 offsets differ but ordering identical).
- Login response shape matches what LoginPage expects (`result.data.token` / `result.data.user`) — RULE-04 holds.
- **Registration: EXISTS, public, complete** — one transaction creates org + 'Main Branch' + 'Main Warehouse' + owner user + role assignment + audit entry (auth.controller L57-138). Note: open self-serve org creation, throttled only by the auth limiter (20/15min) — consider CAPTCHA/invite gating at launch.
- **Password reset: ABSENT** — no route, no token table, no mailer anywhere. Only authenticated change-password exists.
- Login hardening: anti-enumeration generic error; per-email in-memory lockout (5 fails/15 min → 429) with map sweep; plus `/api/auth` rate limit 20/15min.

### 5.4 Validation coverage — **PASS, zero unvalidated mutating routes**
All ~48 mutating routes (POST/PATCH/DELETE) carry express-validator chains + the shared `validate` middleware (422 VALIDATION_ERROR envelope with `fields[]`). Minor: free-text `note`/`address` fields have no max-length caps (bounded only by the global 1 MB body limit).

### 5.5 Audit trail — near-complete
`audit.service.log` is called from 18 of 20 controllers (reports and audit-log are read-only). **Exactly one mutation writes no audit entry: `customers.addNote`** (customers.controller L107-122). Login, login_failed, and password changes are audited.

### 5.6 Stock transactions — **PASS, all flows atomic**
`withTransaction` (BEGIN/COMMIT/ROLLBACK, pool.js L40-53) wraps every multi-step stock flow: PO receive, SO create, SO cancel (restores stock net of returns), transfer confirm/cancel, return create (incl. customer credit `FOR UPDATE`), stock adjust, payment create (SO totals + credit). Concurrency is hardened further with `pg_advisory_xact_lock` on negative stock movements (stock.service L29-31) and `FOR UPDATE` row locks on SO/PO/transfer/customer rows. No data-corruption risk found.

### 5.7 Error handling — **PASS, no leakage**
PG error codes mapped to generic envelopes (23505→409, 23503→409, 23514→400) without forwarding raw detail; production 500s return a static string; **stack traces are never sent to clients** (logged server-side only). Envelope `{success:false, data:null, error:CODE, message}` is consistent everywhere including the 404 handler.

### 5.8 Security posture
- helmet global ✓; global rate limit 500/15min + auth limiter 20/15min ✓; body limit 1 MB ✓; morgan doesn't log bodies ✓; X-Request-ID middleware ✓; env validation at boot (JWT_SECRET ≥ 32 chars or exit) ✓; graceful shutdown + crash handlers ✓.
- **CORS:** `ALLOWED_ORIGINS` comma-split; no-Origin requests allowed (curl/mobile); unlisted origins get an error that surfaces as a **500** rather than a clean 403 (cosmetic). For launch: add the production frontend domain (e.g. `https://marsa.live`) to `ALLOWED_ORIGINS` on Railway.
- **Gaps:** (a) `pool.js` SSL uses `rejectUnauthorized: false` for remote DBs — encrypts but doesn't authenticate the server (MITM exposure; common for Railway but should be a conscious choice); (b) no `app.set('trust proxy')` — behind Railway's proxy, rate-limit/lockout may key on the proxy IP instead of the client; (c) in-memory rate-limit/lockout won't survive multi-instance scaling (fine at pilot scale).

### 5.9 Database layer
- Pool: max 10, idle 30s, connect timeout 5s, 30s query timeout, error listener.
- **Schema IS in the repo and complete:** `backend/db/schema.sql` (524 lines, "Production Schema v1.3", 30 tables, ~50 indexes, seed data for roles/units/return_reasons) + `migrations/002-004`. The brain-era fear that "schema exists only in Railway" is unfounded.
- Orphaned surface: **`supplier_payments` table exists in schema with no controller/route** — implement or drop.
- `customer_notes` and `return_reasons` have no `organization_id` column — tenancy for notes rides entirely on the parent-customer check (currently correct, but load-bearing).

### 5.10 Endpoint count — **94** across 20 modules (see §4 for the per-module table); ~48 mutating, all validated.

---

## 6. PRODUCT COMPLETENESS vs MVP PROMISES (Phase 5)

### 6.1 Operational invoice PDF — **DOES NOT EXIST**
Searched both codebases for `pdf|puppeteer|jspdf|react-pdf|pdfkit|invoice|window.print|@media print`: **zero hits** in frontend/src, backend/src, server.js, or either package.json. There is no invoice generation, no print stylesheet, no HTML invoice template.
**Size: M (2-3 prompts).** Recommended approach: client-side — a print-optimized invoice route/component fed by `GET /sales-orders/:id` (+ org profile for branding), rendered via `window.print()` with a dedicated `@media print` stylesheet; AR/RTL comes free from the existing i18n/dir mechanics. Avoids new backend deps (puppeteer on Railway is heavy). Add "Download PDF" via browser print-to-PDF for MVP; a server-side pdfkit pipeline can come post-pilot.

### 6.2 Persona Flow A — multi-location retailer

| Step | Verdict | Evidence |
|---|---|---|
| Create product | ✅ SUPPORTED | ProductsPage + POST /products |
| Create PO | ✅ SUPPORTED | PurchaseOrdersPage + POST /purchase-orders (admin) |
| Receive stock | ✅ SUPPORTED | Receive modal + POST /:id/receive (staff) |
| Stock visible per location | ⚠️ **DEGRADED** | StockPage exists but the quantity column renders blank (BUG-12) |
| Transfer between locations | ✅ SUPPORTED | TransfersPage + confirm/cancel (confirm is admin-only) |
| Create sales order | ⚠️ **DEGRADED** | Works unless channel walk_in/phone chosen → 400 (BUG-11) |
| Record payment | ✅ SUPPORTED | SO detail Record Payment modal, OVERPAYMENT handled |
| Invoice | ❌ BROKEN | Does not exist (§6.1) |
| Return/refund | ✅ SUPPORTED | SO detail Create Return (delivered orders) + ReturnsPage |
| Reports | ❌ BROKEN | ReportsPage is a stub; only Dashboard KPIs exist |

### 6.3 Persona Flow B — solo seller

| Step | Verdict | Evidence |
|---|---|---|
| Signup | ❌ **BROKEN (frontend)** | Backend POST /auth/register is complete (org + Main Branch + Main Warehouse + owner, one transaction, auth.controller.js L57-138). `authApi.register` exists in auth.js L5. **No page calls it; LoginPage says "Contact your administrator"** |
| Add products | ✅ SUPPORTED | |
| Record channel sales (instagram/whatsapp) | ⚠️ PARTIAL | instagram/whatsapp work; walk_in/phone 400; backend-only channels snapchat/tiktok/in_store unselectable and render raw i18n keys if present in data |
| COD/payment tracking | ✅ SUPPORTED | Record Payment (cash/card/bank_transfer/credit/store_credit/other) + PaymentsPage derived view |
| Expenses | ❌ BROKEN | ExpensesPage is a stub (backend module 100% ready, 10 endpoints) |
| Profit visibility | ⚠️ PARTIAL | Dashboard gross-profit KPI only; no expenses → no true net profit; ReportsPage stub |

### 6.4 Onboarding reality
**A new business cannot sign up today.** The only paths to an account are: (a) direct DB insert, or (b) manually POSTing /api/auth/register via Postman/curl. This gates any pilot beyond the founder's own test org. The fix is small: a RegisterPage calling the already-working endpoint (S effort — 1 prompt including org-currency selection and i18n).

### 6.5 MVP readiness scores

| Area | % | Missing |
|---|---|---|
| Auth | 70% | Signup UI, password reset (no backend flow either), profile page, change-password page |
| Catalog (categories/units/products) | 95% | Product variants unused; import for products |
| Inventory (stock/transfers) | 75% | BUG-12 blank quantities; no ledger view; no adjust UI; stock cache never invalidated |
| Procurement (suppliers/PO) | 95% | — |
| Sales (SO/payments/returns) | 85% | BUG-11 channels; no invoice; returns UX (UUID paste) |
| Financial (expenses) | 0% frontend | Page is a stub (backend done) |
| Reporting | 30% | Dashboard only; ReportsPage stub (backend done) |
| Settings/Admin (org/branches/locations/users/audit) | 0% frontend | All 5 pages stubs (backend done) |
| Localization | 98% | 2 cosmetic items (Dashboard raw channel/status; ErrorBoundary) |
| Security | 75% | No frontend role guards; org not cleared on 401; npm audit highs; see §5 |

**Overall verdict: ~65% of the MVP surface is built and the built part is high quality — but the app is NOT pilot-ready.** Top 5 gaps: (1) no signup UI, (2) no invoice PDF, (3) Expenses + Reports + Settings pages are stubs, (4) BUG-11/BUG-12 break two core flows, (5) no frontend role enforcement.

---

## 7. LOCALIZATION (Phase 6)

- **Parity: PERFECT.** 19 namespaces, **560 leaf keys in EN and 560 in AR, zero structural mismatches** (verified by full JSON diff). Brain said 18 namespaces/~550 keys — actual adds the `import` namespace (39 keys).
- **Referenced keys: all resolve.** 444 static `t()` keys + 22 zod message keys — **0 missing** in either language.
- **Dynamic keys:** 5 template usages (`header.role.*`, `payments.status.*`, `salesOrders.channels.*`, `transfers.status.*` ×2) — all current runtime values resolve, **except** backend channel values `in_store`, `snapchat`, `tiktok` which have no `salesOrders.channels.*` entry (BUG-11 side-effect: renders raw key path).
- **Arabic quality: 0 defects.** No empty strings, no EN-identical values, no machine-broken text. The 4 values containing Latin characters are legitimate (interpolation tokens, example emails).

---

## 8. ISSUES REGISTER — RE-VERIFIED + NEW

### 8.1 Old issues re-verified
| # | Old status | Verdict |
|---|---|---|
| ErrorBoundary hardcoded strings | LOW | **Still true** (ErrorBoundary.jsx L26/28/34, documented in-file) |
| Placeholder page hardcoded titles | LOW | **Still true** (all 9 stubs) |
| constants.js hardcoded labels | LOW | **Still true — and worse: LOCATION_TYPES, ORDER_CHANNELS, PO_STATUS, SO_STATUS, TRANSFER_STATUS, MOVEMENT_TYPES, NAV_ITEMS, hasMinRole are ALL dead code**, several stale (ORDER_CHANNELS has 4 wrong values; SO_STATUS says 'confirmed'; TRANSFER_STATUS says 'confirmed') |
| Vite chunk warning | LOW | **Still true, bigger**: index 579.87 kB, ImportModal chunk 436 kB (xlsx), Dashboard 355 kB (recharts) |
| i18next-browser-languagedetector unused | LOW | **Still true** (in package.json, never imported) |
| Unused shadcn toast | LOW | **Still true** — `ui/toast.jsx` + `ui/toaster.jsx` + `hooks/use-toast.js` + `@radix-ui/react-toast` form a dead island |

### 8.2 BUG-01…BUG-10: **all remain fixed** (each spot-checked at file/line — no regressions).

### 8.3 NEW issues found by this audit

| ID | Priority | Issue | Evidence |
|---|---|---|---|
| BUG-11 | **HIGH** | Sales-order channel enum mismatch: frontend `walk_in`/`phone` rejected by backend validators (create + list filter → 400); backend `in_store` (the DEFAULT when channel omitted)/`snapchat`/`tiktok` missing from translations and CHANNEL_OPTIONS → raw key path renders in list/detail | SalesOrdersPage.jsx L156-163 vs sales-orders.routes.js L14, L24; controller default `channel = 'in_store'` L45 |
| BUG-12 | **HIGH** | StockPage reads `quantity_on_hand` + `is_low_stock`; backend returns `stock_on_hand` and no is_low_stock → blank quantity column, badge never shows (RULE-24 was never applied to StockPage) | StockPage.jsx L90/95/98/115 vs stock.controller.js L44-49 |
| N-1 | **HIGH** | No frontend role enforcement: zero route/page guards; Sidebar minRole is cosmetic. Readonly users can open every URL; readonly ALSO sees Reports in sidebar but backend /reports/* requires staff+ → guaranteed 403 UX break | App.jsx L65-94; AppLayout.jsx L10-15; reports.routes.js |
| N-2 | MEDIUM | `logout()` in authStore and the 401 interceptor clear token+user but **never clear `bcc_org`** — stale org/currency leaks across sessions on shared machines (Header's manual `clearOrg()` is the only cleanup path) | authStore.js L49-53; api.js L43-50; Header.jsx L66-67 |
| N-3 | MEDIUM | Mutations that change stock never invalidate `['stock']` or `['dashboard']` (PO receive, transfer confirm, SO status, returns) → stale numbers up to 5 min | PurchaseOrdersPage L219, TransfersPage L174-195, SalesOrdersPage L222-304 |
| N-4 | MEDIUM | npm audit: frontend 14 vulns (6 high, 6 moderate, 2 low), backend 11 (4 high, 6 moderate, 1 low). Notably `xlsx` 0.18.5 has known unfixed advisories | `npm audit` both apps |
| N-5 | LOW | Duplicated ROLE_HIERARCHY (constants.js + authStore.js local copy); two divergent nav definitions (Sidebar NAV_GROUPS live vs constants NAV_ITEMS dead) | authStore.js L63-67; constants.js L94-144 |
| N-6 | LOW | Dead code: 6 unimported API modules (the Wave 4 set), 7 unused api fns (fetchUnit, fetchSupplier, fetchProduct, fetchCustomer, fetchCategory, fetchPaymentsForOrder, fetchPayment), ~18 unused ui components, dead toast island, ~12 dead constants | Infra audit §10 |
| N-7 | LOW | Dashboard renders raw `order.channel`/`order.status` untranslated (L239/246); inline `borderLeftColor` not RTL-aware (L97) | DashboardPage.jsx |
| N-8 | LOW | Products dropdown cached under two keys — `['products','all']` (PO/SO) vs `['products','dropdown']` (Transfers) — double fetch, no staleness | infra audit §11 |
| N-9 | LOW | organizations.js API module dead while its endpoint is live — LoginPage calls `api.get('/organizations/me')` raw (L87) instead of `organizationsApi.getMyOrg` | LoginPage.jsx L87 |
| N-10 | LOW | PaymentsPage "view order" navigates to the list, not the specific order | PaymentsPage.jsx L134 |
| N-11 | LOW | Empty catch swallows audit-log failure silently in login lockout path | auth.controller.js L156 |
| N-12 | INFO | Uncommitted work: brain v4.7 edits + 5 PUT→PATCH api fixes are dirty in the working tree — the v4.7 "fix applied" was real but never committed | `git status` |

---

## 9. RECOMMENDATIONS (numbered, prioritized)

**CRITICAL / blocks-MVP:**
1. **Fix BUG-11 (channel enums).** Align frontend CHANNEL_OPTIONS + translations to the backend enum (`in_store`, `whatsapp`, `instagram`, `snapchat`, `tiktok`, `online`, `other`), or widen the backend validator; add AR+EN keys for all values. Effort: **S**. Blocks-MVP: **yes**. → Prompt group W5-P1.
2. **Fix BUG-12 (StockPage fields).** `quantity_on_hand`→`stock_on_hand`; derive low-stock client-side (`stock_on_hand <= low_stock_threshold && low_stock_threshold > 0`) or add `is_low_stock` to the backend SELECT. Effort: **S**. Blocks-MVP: **yes**. → W5-P1.
3. **Build RegisterPage (signup UI)** against the existing POST /auth/register. Org name, country, currency, owner name/email/password; auto-login on 201 (response already returns token+user+organization). Effort: **S/M**. Blocks-MVP: **yes** (gates the pilot). → W5-P2.
4. **Build the operational invoice** (print-optimized invoice view from SO detail + org branding, `window.print()`/print CSS, AR/RTL aware). Effort: **M**. Blocks-MVP: **yes** (flagship promise). → W5-P3.
5. **Add frontend role guards** (RULE-29/30 pattern) to all built pages + hide Reports from readonly in Sidebar (backend requires staff+). Effort: **S**. Blocks-MVP: **yes** (pilot has multiple roles). → W5-P1.

**HIGH:**
6. Build Wave 4 pages against the already-existing API modules — order: Expenses (P3), Reports (P4), Organization+Branches+Locations+Users (P2/P5), AuditLog, Profile+ChangePassword. Effort: **L** (6 prompts as planned). Blocks-MVP: **yes** for Expenses/Reports/Users; no for AuditLog/Profile.
7. Clear `bcc_org` in `authStore.logout()` and in the 401 interceptor (N-2). Effort: **S**. → W5-P1.
8. Invalidate `['stock']` (+ `['dashboard']` where cheap) after PO receive, transfer confirm, SO status change, return create (N-3). Effort: **S**. → W5-P1.
9. Add a password-reset flow (backend token flow + email or, for MVP, admin-driven reset via Users page). Effort: **M**. Blocks-MVP: recommended-yes for a paid pilot.

**MEDIUM:**
10. Import for Products / Expenses / Stock (Prompt B): reuse ImportModal; products import needs category/unit resolution by name. Effort: **M**.
11. npm audit remediation pass; replace/upgrade `xlsx` (known unfixed advisories) — consider `exceljs` or accept risk consciously. Effort: **M**.
12. Profile-update backend route (PATCH /auth/me) if Profile page should edit name/email (Postman item 19 gap). Effort: **S**.
13. Chunk-size: lazy-load ImportModal (dynamic import inside pages) and split recharts via manualChunks. Effort: **S**.

**LOW / cleanup:**
14. Delete dead code: shadcn toast island, 18 unused ui components (or keep intentionally as kit — decide once), stale constants (PO_STATUS/SO_STATUS/TRANSFER_STATUS/ORDER_CHANNELS/LOCATION_TYPES/MOVEMENT_TYPES/NAV_ITEMS/hasMinRole), `i18next-browser-languagedetector`, `@radix-ui/react-toast`. Effort: **S**.
15. Deduplicate ROLE_HIERARCHY; single source in constants.js. Effort: **S**.
16. i18n polish: Dashboard raw channel/status labels; ErrorBoundary via react-error-boundary; LoginPage aria-label. Effort: **S**.
17. Unify products dropdown query key; route PaymentsPage "view order" to the order detail. Effort: **S**.

**BACKEND (from Phase 4 — all report-only, none blocks MVP):**
23. Org-validate `expenses.location_id` (create+update) and `stock.adjust.variant_id`, mirroring sibling controllers (§5.1). Effort: **S**.
24. `pool.js` SSL: verify certs (`rejectUnauthorized: true` + CA) or document the accepted risk. Effort: **S**.
25. Add `auditService.log` to `customers.addNote`; add max-length caps to free-text note/address validators. Effort: **S**.
26. `app.set('trust proxy', 1)` so rate limiting keys on real client IPs behind Railway's proxy. Effort: **S**.
27. Decide `POST /auth/register` exposure policy for launch (open self-serve vs CAPTCHA/invite-gated). Effort: **S** (policy) / M (CAPTCHA).
28. Implement or drop the orphaned `supplier_payments` table. Effort: **S** (drop) / M (supplier payment tracking feature).

**PROCESS (institutionalize):**
18. **RULE-35 (added in brain v4.8): every session that changes code ends with a brain log entry AND git add/commit/push.** The current dirty tree (v4.7 fix uncommitted for 3+ months) is exactly the failure mode.
19. Commit the current working tree NOW (done as part of this audit's Phase 10).
20. `.env` was never committed — no rotation needed. Keep it that way; `.gitignore` already covers it.
21. Weekly Railway DB dumps (`pg_dump $DATABASE_URL > backups/bcc_$(date).sql`) — schema exists in repo (`backend/db/schema.sql`) but data does not.
22. Add explicit deploy config for Railway (currently implicit `npm start`) — a `railway.json`/Procfile documents the contract. Also decide frontend hosting for launch (no config exists; recommend Railway static site or Vercel/Netlify + `VITE_API_URL`-based axios baseURL for production, since the current `/api` relative baseURL assumes same-origin or dev proxy).

---

## 10. REVISED PATH TO MVP (pilot-ready)

Given verified reality (13 pages solid, backend 100%, 9 stubs, 2 live bugs, no signup, no invoice):

| Wave | Content | Est. prompts |
|---|---|---|
| **W5 — Repair & Guard** | BUG-11 channels, BUG-12 stock fields, role guards (RULE-29/30) on built pages + sidebar/reports fix, bcc_org logout cleanup, stock invalidations | 1-2 |
| **W6 — Onboarding** | RegisterPage (signup) + auto-login + org currency selection; optional: password-reset backend+UI | 1-2 |
| **W7 — Wave 4 build (as re-planned)** | P1 Organization, P2 Branches+Locations+Users, P3 Expenses, P4 Reports, P5 AuditLog, P6 Profile+ChangePassword — API modules already exist; Postman checklist shrunk to ~4 shape checks | 6 |
| **W8 — Invoice** | Print-optimized branded invoice from SO detail (EN+AR/RTL), print CSS, window.print | 2 |
| **W9 — Pre-pilot hardening** | npm audit fixes, chunk splitting, dead-code purge, Postman smoke of the 4 remaining shapes, deploy config + frontend hosting, E2E happy-path test of both persona flows | 2-3 |

**Total: ~12-15 prompts to a pilot-ready MVP.** Launch-gating: W5+W6+W7(P3/P4 minimum)+W8.

---

*Report generated by full-project state audit. Companion deliverable: BCC_PROJECT_BRAIN.md v4.8.*
