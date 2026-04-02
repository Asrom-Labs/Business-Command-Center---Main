# BCC Wave 2 — Final Audit Report
**Date:** 27 Mar 2026
**Brain version:** v3.0
**Checks executed:** 42
**Scope:** All files built through Wave 2 Prompt 2

---

## Build Status (Pre-Fix)

| Field | Value |
|-------|-------|
| Result | PASS |
| Modules | 3,038 |
| Build time | 8.73s |
| Errors | 0 |
| Warnings | 1 — chunk size: index.js ~542 KB exceeds 500 KB threshold (known, acceptable) |

---

## Issue Summary

| Severity | Count |
|----------|-------|
| 🔴 BUG — causes runtime failure or wrong behaviour | 0 |
| 🟡 WARNING — degrades UX, maintainability, or accessibility | 1 |
| 🔵 CLEANUP — dead code, unused imports, minor hygiene | 0 |
| **TOTAL** | **1** |

---

## Issues by Severity

### 🔴 BUG — Fix First (Highest Priority)

No BUG-severity issues found.

---

### 🟡 WARNING — Fix Second (Degrades UX or Accessibility)

---

#### WARN-01: ProductsPage currency fallback inconsistency with DashboardPage

| Field | Detail |
|-------|--------|
| Check | CHECK-07 / CHECK-24 — useOrg hook currency fallback |
| File | `frontend/src/pages/products/ProductsPage.jsx` |
| Line | ~83 |
| Found | ProductsPage uses `const { currency } = useOrg()` without a fallback. The orgStore defaults to `'USD'` when no org is loaded. DashboardPage uses `useOrgStore((s) => s.currency) \|\| 'JOD'` — an explicit Jordan-currency fallback. While functionally harmless (the store never returns a falsy currency, so the `\|\| 'JOD'` on DashboardPage is effectively dead code), the inconsistency between the two patterns is a maintainability concern. If the orgStore default ever changes to `null` or `''`, ProductsPage would silently break while DashboardPage would not. |
| Fix required | Add `\|\| 'JOD'` fallback at the call site: `const { currency: rawCurrency } = useOrg(); const currency = rawCurrency \|\| 'JOD';` — OR — accept the current pattern as correct since the store guarantees a non-empty default. This is a judgment call, not a bug. |

---

### 🔵 CLEANUP — Fix Third (Hygiene and Dead Code)

No CLEANUP-severity issues found.

---

## Deferred Issues (Cannot Be Fixed Now)

| ID | File | Description | Reason for deferral | Priority |
|----|------|-------------|---------------------|----------|
| DEFER-01 | `frontend/src/components/ErrorBoundary.jsx` | Hardcoded English strings ("Something went wrong", "Please refresh the page...", "Refresh page") in class component | Class components cannot use React hooks (useTranslation). Fix requires converting to functional component using an error boundary HOC (e.g., react-error-boundary package). Deferral comment is present above render(). | LOW |

---

## Translation Changes Required

No translation changes required. Both files have complete structural parity across all 11 namespaces (app, auth, nav, sidebar, header, dashboard, common, categories, units, products, stock). All t() key references in ProductsPage and StockPage resolve to existing keys. No empty values found. No untranslated Arabic values detected.

---

## Checks Detail — Full Pass/Fail Log

| Check | Result | Notes |
|-------|--------|-------|
| CHECK-01 main.jsx bootstrap | ✅ PASS | i18n imported before App (line 6 vs 8). ErrorBoundary wraps tree. Suspense present. No hardcoded strings. |
| CHECK-02 App.jsx routing | ✅ PASS | LoginPage eager. All others lazy with Suspense. /categories, /units, /products, /stock all present. Catch-all and root redirect correct. Toaster from react-hot-toast. |
| CHECK-03 AppLayout | ✅ PASS | Auth guard with replace. Sidebar+Header+Outlet. No page-container on Outlet. |
| CHECK-04 i18n.js | ✅ PASS | No flag field. No LanguageDetector. Explicit lng. useSuspense: true. Version marker intact. |
| CHECK-05 api.js | ✅ PASS | baseURL '/api'. JWT interceptor. response.data unwrap. 401 handler. Error normalization. |
| CHECK-06 queryClient.js | ✅ PASS | staleTime 5min. gcTime 10min. Smart retry. refetchOnWindowFocus false. mutations.retry false. |
| CHECK-07 useOrg.js | ⚠️ WARN | Hook returns raw currency from orgStore (defaults 'USD'). No '|| JOD' fallback. See WARN-01. |
| CHECK-08 index.css | ✅ PASS | All 16 referenced CSS classes defined including status-pending used by StockPage. |
| CHECK-09 Translation files | ✅ PASS | 11 namespaces in both files. Full key parity. products.filters has 3 keys (no lowStock). stock.filters has 2 keys. All Wave 2 keys present. sidebar/header audit-fix keys intact. No empty values. No untranslated Arabic. All t() keys from ProductsPage and StockPage resolve. |
| CHECK-10 Hardcoded strings | ✅ PASS | All 6 pages and 8 shared components clean. All filter labels, option placeholders, toast messages, aria-labels, modal titles use t(). |
| CHECK-11 Module-level arrays | ✅ PASS | FILTER_TABS and columns inside component functions in all pages. Zod schemas correctly at module level. PERIODS inside DashboardPage (regression holds). |
| CHECK-12 useTranslation import | ✅ PASS | All files import from 'react-i18next'. |
| CHECK-13 Manual Auth headers | ✅ PASS | Only in api.js interceptor (correct location). No manual headers in any page or API module. |
| CHECK-14 API base paths | ✅ PASS | All 6 API modules use short paths (/products, /stock, /categories, /units, /auth/*, /reports/*). No /api/ prefix duplication. |
| CHECK-15 HTTP verbs | ✅ PASS | products.js: put for update. stock.js: get only. categories.js: put. units.js: put. |
| CHECK-16 cleanParams | ✅ PASS | Both fetchProducts and fetchStock strip undefined/null/empty-string before sending. |
| CHECK-17 Named exports | ✅ PASS | Neither products.js nor stock.js has a default export. |
| CHECK-18 Server params | ✅ PASS | Spread syntax (no mutation). No search/low_stock sent to /api/products. 3 filter tabs only. handleFilterChange resets page+search. |
| CHECK-19 select functions | ✅ PASS | All useQuery calls have select. Products/Stock use {items, pagination} shape. Categories/Units dropdown queries use data ?? []. Data access matches select shape everywhere. |
| CHECK-20 Query keys | ✅ PASS | Products: ['products','list',{page,activeFilter}]. Stock: ['stock','list',{page,showLowStockOnly}]. Categories/Units: page in key, search absent. |
| CHECK-21 invalidateQueries | ✅ PASS | All 3 ProductsPage mutations invalidate ['products']. All CategoriesPage → ['categories']. All UnitsPage → ['units']. StockPage has no mutations. |
| CHECK-22 Toast t() | ✅ PASS | All success toasts use t(). All error toasts use getErrorMessage(). No string concatenation. |
| CHECK-23 Monetary values | ✅ PASS | parseFloat on cost_price and selling_price in table render. String(parseFloat()) for form pre-fill. parseFloat/parseInt in submit handler. is_active → active field mapping correct. |
| CHECK-24 Currency hook | ⚠️ WARN | useOrg from '@/hooks/useOrg' used correctly. See WARN-01 for fallback note. |
| CHECK-25 Modal lifecycle | ✅ PASS | Schema at module level. reset() in open handlers (not useEffect+setValue). Close resets form+state. Delete modal receives name interpolation and isPending. |
| CHECK-26 Form validation UI | ✅ PASS | Submit+cancel disabled during pending. Loader2 spinner shown. All 4 error fields have field-error + role="alert". Switch driven by watch+setValue. Select uses ps-3 pe-8. DialogContent has max-h-[90vh] overflow-y-auto. |
| CHECK-27 StockPage read-only | ✅ PASS | No mutations, form, dialog, modal, toast, or write buttons present. PageHeader has no action prop. Only read imports used. |
| CHECK-28 Boolean key handling | ✅ PASS | String(tab.key) used for React key. showLowStockOnly === tab.key for comparison. |
| CHECK-29 Low stock badge | ✅ PASS | StatusBadge with status="pending". null for non-low-stock rows. Label from t('stock.lowStockBadge'). |
| CHECK-30 RTL scan | ✅ PASS | LoginPage: 3 matches are decorative orbs in aria-hidden container (acceptable). All other files: zero violations. DashboardPage RTL fixes from prior audit hold. |
| CHECK-31 Dark mode tokens | ✅ PASS | No hardcoded color classes in ProductsPage or StockPage. All colors use CSS custom property tokens or have dark: variants. |
| CHECK-32 page-container | ✅ PASS | All 5 authenticated pages have page-container root. LoginPage exempt. |
| CHECK-33 StatusBadge usage | ✅ PASS | ProductsPage uses StatusBadge for active/inactive. StockPage uses StatusBadge for low stock. No raw status-* spans in pages. |
| CHECK-34 Loading/empty/error | ✅ PASS | All 4 data-fetching pages handle all 3 states via DataTable + amber error banner. |
| CHECK-35 Pagination during search | ✅ PASS | All 4 CRUD/read pages pass null pagination when search is non-empty. |
| CHECK-36 Shared components | ✅ PASS | DataTable: emptyIcon defaults to Inbox, pagination null-safe, row.id ?? rowIndex, col.className ?? '', raw token wrapper. SearchInput: cleanup present, value sync present, start-3, ps-9. ConfirmModal: both buttons disabled when loading, spinner shown, no auto-close, confirmLabel defaults. PageHeader: renders action when provided. StatusBadge: uses label prop. |
| CHECK-37 Sidebar routes | ✅ PASS | /categories, /units, /products, /stock all in nav with correct min roles. aria-label uses t('sidebar.expand')/t('sidebar.collapse'). No hardcoded strings. |
| CHECK-38 Header regression | ✅ PASS | aria-label={t('header.userMenu')} — fix holds. |
| CHECK-39 Unused imports | ✅ PASS | ProductsPage: formatDate not imported (correct — not used). All imports used. StockPage: no mutation/form/dialog/toast/useOrg imports (correct — read-only). All imports used. |
| CHECK-40 No localStorage in pages | ✅ PASS | No localStorage or sessionStorage in any page or shared component. |
| CHECK-41 ErrorBoundary | ✅ PASS | Class component with deferral comment above render(). Hardcoded strings remain as expected. |
| CHECK-42 Filesystem | ✅ PASS | tailwind.config.cjs: deleted ✅. App.css: deleted ✅. variants/: deleted ✅. tailwind.config.js: exists ✅. |

---

## Files Checked

### Core infrastructure (8 files)
- frontend/src/main.jsx
- frontend/src/App.jsx
- frontend/src/index.css
- frontend/src/lib/api.js
- frontend/src/lib/i18n.js
- frontend/src/lib/utils.js
- frontend/src/lib/constants.js
- frontend/src/lib/queryClient.js

### Stores and hooks (5 files)
- frontend/src/stores/authStore.js
- frontend/src/stores/orgStore.js
- frontend/src/stores/themeStore.js
- frontend/src/hooks/useAuth.js
- frontend/src/hooks/useOrg.js

### Layouts (2 files)
- frontend/src/layouts/AppLayout.jsx
- frontend/src/layouts/AuthLayout.jsx

### Shared components (8 files)
- frontend/src/components/ErrorBoundary.jsx
- frontend/src/components/shared/Header.jsx
- frontend/src/components/shared/Sidebar.jsx
- frontend/src/components/shared/ConfirmModal.jsx
- frontend/src/components/shared/DataTable.jsx
- frontend/src/components/shared/PageHeader.jsx
- frontend/src/components/shared/SearchInput.jsx
- frontend/src/components/shared/StatusBadge.jsx

### Complete pages (6 files)
- frontend/src/pages/auth/LoginPage.jsx
- frontend/src/pages/dashboard/DashboardPage.jsx
- frontend/src/pages/categories/CategoriesPage.jsx
- frontend/src/pages/units/UnitsPage.jsx
- frontend/src/pages/products/ProductsPage.jsx
- frontend/src/pages/stock/StockPage.jsx

### API modules (6 files)
- frontend/src/api/auth.js
- frontend/src/api/dashboard.js
- frontend/src/api/categories.js
- frontend/src/api/units.js
- frontend/src/api/products.js
- frontend/src/api/stock.js

### Translation files (2 files)
- frontend/src/locales/en/translation.json
- frontend/src/locales/ar/translation.json

### Filesystem checks (4 items)
- frontend/tailwind.config.js — exists ✅
- frontend/tailwind.config.cjs — deleted ✅
- frontend/src/App.css — deleted ✅
- frontend/src/pages/variants/ — deleted ✅

**Total files read: 37**

---

## Assessment

The Wave 2 codebase is in excellent shape. All 42 checks pass with zero BUG-severity issues and only one WARNING-level consistency concern (currency fallback pattern). The patterns established in DashboardPage — useQuery with select, mutations with invalidateQueries, i18n throughout, RTL-safe classes, proper loading/empty/error states — are replicated faithfully across all four Wave 2 pages. The ProductsPage is notably well-structured: the 9-field form with Zod validation, category/unit dropdowns with stale-time-optimized queries, server-side active filter with client-side search, and the Switch toggle all follow best practices. The StockPage correctly enforces read-only behavior with minimal imports. Translation parity is perfect across 11 namespaces in both languages. All prior audit fixes (Sidebar aria-labels, Header userMenu, DashboardPage RTL, LoginPage RTL, ErrorBoundary comment, filesystem cleanup) are verified intact with zero regressions.

---

## Ready for Fix Session?

The single WARNING (WARN-01) is a maintainability concern, not a functional defect. The orgStore guarantees a non-empty currency default ('USD'), so ProductsPage will never receive undefined. The `|| 'JOD'` fallback on DashboardPage is effectively dead code. This can be addressed in Wave 3 as a cross-page consistency pass or accepted as-is.

**CLEAR FOR WAVE 3** — no fix session required. Build is clean at 3,038 modules with zero errors.
