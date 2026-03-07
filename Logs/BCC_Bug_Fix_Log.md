# BCC Bug Fix Log

**Project:** Business Command Center — Backend
**Last updated:** March 7, 2026
**Current version:** v0.6.0

---

## Open Issues

None. All known issues have been resolved as of v0.6.0.

---

## Resolved Issues

### v0.6.0 — March 7, 2026

| ID | Severity | Description | File | Fix |
|----|----------|-------------|------|-----|
| P1 | High | Auth lockout (429) path did not write an audit log entry | `auth.controller.js` | Added `auditService.log()` call in try/catch inside the lockout branch |
| P2 | Low | Force-exit `setTimeout` in graceful shutdown held the event loop open unnecessarily | `server.js` | Added `.unref()` to the 10-second force-exit timer |
| P3 | Low | Two 404 responses in `branches.controller.js` returned `{}` instead of `data: null` | `branches.controller.js` | Added `data: null` to `getOne` and `update` 404 responses |
| P4 | Medium | `suppliers.controller.js remove` did not check `active = TRUE`, allowing re-deletion of already-inactive suppliers | `suppliers.controller.js` | Added `AND active = TRUE` to the pre-delete SELECT query |

**RC5 Global Sweep (v0.6.0):** Grep identified 40+ additional 404 responses across 12 controllers missing `data: null`. All were fixed:

| Controller | Responses fixed |
|------------|----------------|
| `categories.controller.js` | 2 |
| `organizations.controller.js` | 1 |
| `locations.controller.js` | 3 |
| `expenses.controller.js` | 5 |
| `product-variants.controller.js` | 4 |
| `purchase-orders.controller.js` | 3 |
| `sales-orders.controller.js` | 3 |
| `transfers.controller.js` | 3 |
| `users.controller.js` | 4 |
| `units.controller.js` | 2 |
| `customers.controller.js` | 4 |
| `payments.controller.js` | 2 |

Post-fix verification: `grep -r "status(404)" --include="*.js"` — zero results without `data: null`.

---

### v0.5.0 — March 6, 2026 (partial, completed in v0.6.0)

Session was interrupted before full commit and verification. All fixes carried forward to v0.6.0.

---

### v0.4.0 — Late February 2026

| ID | Severity | Description | Fix |
|----|----------|-------------|-----|
| B06 | High | Concurrent returns to the same customer could double-credit `credit_balance` | Added `SELECT ... FOR UPDATE` on customer row in `returns.controller.js` |
| B07 | High | Concurrent sales/transfers could create race conditions on stock_ledger | Added `pg_advisory_xact_lock` in `stock.service.js:insertLedgerEntry` |
| B08 | High | Server could start with missing/weak `JWT_SECRET` | Startup validation in `server.js`: exits if missing or < 32 chars |
| B09 | Medium | Deactivated users' tokens remained valid until expiry | `authenticate` middleware now queries DB `active` status on every request |
| B10 | Medium | No brute-force protection on login | In-memory lockout: 5 failures / 15 min → 429 for remaining window |
| B11 | Medium | `locations` table had no `active` column; deleted locations still accessible | Added `locations.active` column; list/getOne filter `active = TRUE` |
| RC4-a | Low | `stock adjust` not wrapped in transaction; advisory lock not applied | Wrapped in `withTransaction`; advisory lock applied consistently |
| RC4-b | Low | `payments.controller.js create` missing `FOR UPDATE` on sales_order row | Added `FOR UPDATE` to order fetch in payment creation |

---

### v0.3.0 — Early February 2026

| ID | Severity | Description | Fix |
|----|----------|-------------|-----|
| RC3-a | High | Several controllers missing org isolation (`req.user.org_id`) on some queries | Full audit; all queries confirmed to filter by org_id |
| RC3-b | High | Multi-step operations (PO receive, returns, payments) not wrapped in transactions | All multi-step operations wrapped in `withTransaction` |
| RC3-c | Medium | `express-validator` missing on several routes | Validation added to all routes |
| RC3-d | Medium | Error responses inconsistent — some threw raw errors, some returned inline | `isAppError` pattern established; all errors flow through `errorHandler` |
| RC3-e | Low | Audit logging absent from several write operations | `auditService.log()` added to all create/update/delete paths |
| RC3-f | Low | `validate` middleware duplicated across routes | Centralized into `src/middleware/validate.js` |

---

## Version History Summary

| Version | Date | Issues Resolved |
|---------|------|----------------|
| v0.6.0 | March 7, 2026 | P1, P2, P3, P4 + RC5 (40+ response fixes) |
| v0.5.0 | March 6, 2026 | Partial (completed in v0.6.0) |
| v0.4.0 | Late Feb 2026 | B06–B11, RC4 |
| v0.3.0 | Early Feb 2026 | RC3 (full audit) |
| v0.2.0 | January 2026 | Initial implementation |
| v0.1.0 | January 2026 | Project bootstrap |
