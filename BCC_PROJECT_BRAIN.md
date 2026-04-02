# BCC PROJECT BRAIN
## Business Command Center — Asrom Labs
### The Single Source of Truth for All Development Sessions

**Version:** 4.6
**Date:** 28 Mar 2026
**Status:** Wave 3 COMPLETE (13 pages) — Wave 4 Pre-Build Audit Complete — Awaiting Postman verification of 19 API shapes before Wave 4 build begins
**Build:** PASS — 3,046 modules — 0 errors (after Wave 3 Prompt 5 + Wave 4 pre-build audit, 28 Mar 2026)

---

## HOW TO USE THIS DOCUMENT

Paste the full contents of this file at the start of every new
conversation with any AI assistant before asking anything.

The assistant must:

1. Read this entire document from top to bottom before responding
2. Not ask questions that are answered here
3. Treat every rule in Section 9 as non-negotiable
4. Treat every entry in Section 7 as a confirmed fix — never reintroduce it
5. Treat every decision in Section 7 as final unless explicitly overridden
6. When uncertain about conventions, check Section 4 before asking
7. For Wave 4 build sessions, read Section 13 (Wave 4 Build Plan) in full before starting — it contains the Postman checklist, API modules plan, role guard patterns, and prompt split

---

## SECTION 1 — PROJECT IDENTITY

### 1.1 What BCC Is

Business Command Center is a multi-tenant cloud SaaS platform for SME operational management in the MENA region. It manages everything an SME does before the accountant gets involved — inventory, purchasing, sales, customers, expenses, and reporting. Positioning: "كل شيء قبل المحاسب" — operations-first.

Target market: multi-location retail businesses (1-5 branches) selling clothing, electronics, home goods, wholesale, and solo e-commerce sellers on Instagram, WhatsApp Business, TikTok Shop, Salla, and Zid.

### 1.2 Business Facts

| Field | Value |
|-------|-------|
| Company | Asrom Labs |
| Founder | Ashraf Rusheidat, Amman, Jordan |
| Stage | Pre-revenue, pre-launch |
| Target launch | June 22, 2026 — Jordan + KSA simultaneously |
| Target market 1 | Jordan (proving ground) |
| Target market 2 | KSA (primary revenue market) |
| App subscription currency | USD |
| Per-org transaction currency | Configurable — JOD for Jordan, SAR for KSA |

### 1.3 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Node.js / Express 4 / PostgreSQL | Node >= 20 |
| Backend hosting | Railway | Port 3001 |
| Frontend | React / Vite | React 19.2, Vite 7.3.1 |
| State management | Zustand | 5.0.11 |
| Data fetching | TanStack React Query | 5.90.21 |
| Forms | react-hook-form + zod | RHF 7.71.2, zod 4.3.6 |
| i18n | i18next + react-i18next | i18next 25.8.14 |
| Styling | Tailwind CSS v3 + shadcn/ui (Slate base) | Tailwind 3.4.19 |
| UI components | shadcn/ui (Radix primitives) | Various |
| Icons | lucide-react | 0.577.0 |
| Toasts | react-hot-toast | 2.6.0 |
| HTTP client | axios | 1.13.6 |
| Dates | date-fns + date-fns-tz | 4.1.0 / 3.2.0 |
| Charts | recharts | 3.8.0 |
| Routing | react-router-dom | 6.30.3 |
| Tables | @tanstack/react-table | 8.21.3 |

### 1.4 Repository & Paths

| Field | Value |
|-------|-------|
| GitHub | Asrom-Labs/Business-Command-Center---Main |
| Project root | `C:\Users\Ashraf Rusheidat\Desktop\Business Command Center\App` |
| Frontend | `[root]\frontend` |
| Brain document | `[root]\BCC_PROJECT_BRAIN.md` |
| OS | Windows 10 Pro — PowerShell — NO `&&` command chaining |
| Dev tool | VS Code + Claude Code extension |
| API testing | Postman |

---

## SECTION 2 — DEVELOPMENT STATUS

### 2.1 Overall Progress Table

| Wave | Pages | Status | Notes |
|------|-------|--------|-------|
| 1 | Login, App Shell (Sidebar, Header, Layouts) | ✅ COMPLETE | Fully i18n, RTL-safe |
| 1B | Dashboard (KPIs, chart, recent orders, low stock) | ✅ COMPLETE | All bugs fixed |
| 2 | Categories, Units, Products, Stock | ✅ COMPLETE | All bugs fixed, audit clean |
| 3 | Suppliers, Customers, Purchase Orders, Sales Orders, Transfers, Payments, Returns | ✅ COMPLETE | 7 pages, 5 prompts, audited clean (v4.4) |
| 4 | Organisation, Branches, Locations, Users, Expenses, Reports, Audit Log, Profile, ChangePassword | 🔲 READY | Pre-build audit done. 19 API shapes need Postman. See Section 13. |

### 2.2 Wave Definitions

- **Wave 1:** Login, App Shell (Sidebar, Header, AppLayout, AuthLayout) — ✅ COMPLETE
- **Wave 1B:** Dashboard (6 KPIs, revenue chart, recent orders panel, low stock panel) — ✅ COMPLETE
- **Wave 2:** Categories → Units → Products → Stock — ✅ COMPLETE (all 4 pages built, audited, and verified clean)
- **Wave 3:** Suppliers → Customers → Purchase Orders → Sales Orders → Transfers → Payments → Returns — ✅ COMPLETE (7 pages, 5 prompts, fully audited)
- **Wave 4:** Organisation, Branches, Locations, Users, Expenses, Reports, Audit Log, Profile, ChangePassword — 9 pages, 6 prompts (see Section 13)

### 2.3 All 22 Pages Status

| Route | File Path | Status |
|-------|-----------|--------|
| `/login` | `src/pages/auth/LoginPage.jsx` | ✅ Complete |
| `/dashboard` | `src/pages/dashboard/DashboardPage.jsx` | ✅ Complete |
| `/organization` | `src/pages/organization/OrganizationPage.jsx` | Placeholder |
| `/branches` | `src/pages/branches/BranchesPage.jsx` | Placeholder |
| `/locations` | `src/pages/locations/LocationsPage.jsx` | Placeholder |
| `/users` | `src/pages/users/UsersPage.jsx` | Placeholder |
| `/categories` | `src/pages/categories/CategoriesPage.jsx` | ✅ Complete |
| `/units` | `src/pages/units/UnitsPage.jsx` | ✅ Complete |
| `/products` | `src/pages/products/ProductsPage.jsx` | ✅ Complete |
| `/stock` | `src/pages/stock/StockPage.jsx` | ✅ Complete |
| `/suppliers` | `src/pages/suppliers/SuppliersPage.jsx` | ✅ Complete |
| `/customers` | `src/pages/customers/CustomersPage.jsx` | ✅ Complete |
| `/purchase-orders` | `src/pages/purchase-orders/PurchaseOrdersPage.jsx` | ✅ Complete |
| `/sales-orders` | `src/pages/sales-orders/SalesOrdersPage.jsx` | ✅ Complete |
| `/payments` | `src/pages/payments/PaymentsPage.jsx` | ✅ Complete |
| `/returns` | `src/pages/returns/ReturnsPage.jsx` | ✅ Complete |
| `/transfers` | `src/pages/transfers/TransfersPage.jsx` | ✅ Complete |
| `/expenses` | `src/pages/expenses/ExpensesPage.jsx` | Placeholder |
| `/reports` | `src/pages/reports/ReportsPage.jsx` | Placeholder |
| `/audit-log` | `src/pages/audit-log/AuditLogPage.jsx` | Placeholder |
| `/profile` | `src/pages/profile/ProfilePage.jsx` | Placeholder |
| `/change-password` | `src/pages/profile/ChangePasswordPage.jsx` | Placeholder |

### 2.4 Backend Status

- Deployed: Railway — confirmed live
- Total endpoints: 104 across 19 modules
- Status: 100% complete — no open backend code issues
- All Wave 3 endpoint groups (payments, returns, transfers) fully Postman-tested ✅ 27 Mar 2026
- Wave 4 endpoint groups (organizations, branches, locations, users, expenses, reports, audit-log) not yet Postman-tested — 19 specific items to verify (see Section 13.1)

---

## SECTION 3 — ARCHITECTURE & FILE MAP

### 3.1 Frontend Directory Structure

```
frontend/src/
├── api/
│   ├── auth.js
│   ├── dashboard.js
│   ├── categories.js
│   ├── units.js
│   ├── products.js
│   ├── stock.js
│   ├── suppliers.js
│   ├── customers.js
│   ├── purchaseOrders.js
│   ├── salesOrders.js
│   ├── locations.js       (list only — MUST be extended in Wave 4 P2, never replaced)
│   ├── transfers.js
│   ├── payments.js
│   └── returns.js
├── components/
│   ├── ErrorBoundary.jsx
│   ├── shared/
│   │   ├── Header.jsx
│   │   └── Sidebar.jsx
│   └── ui/           (shadcn/ui primitives — button, input, label, etc.)
├── hooks/
│   ├── useAuth.js
│   ├── useOrg.js
│   └── use-toast.js  (shadcn toast — unused, app uses react-hot-toast)
├── layouts/
│   ├── AppLayout.jsx
│   └── AuthLayout.jsx
├── lib/
│   ├── api.js
│   ├── constants.js
│   ├── i18n.js
│   ├── queryClient.js
│   └── utils.js
├── locales/
│   ├── en/translation.json
│   └── ar/translation.json
├── pages/
│   ├── auth/LoginPage.jsx
│   ├── dashboard/DashboardPage.jsx
│   ├── profile/ProfilePage.jsx, ChangePasswordPage.jsx
│   ├── categories/CategoriesPage.jsx
│   ├── units/UnitsPage.jsx
│   ├── products/ProductsPage.jsx
│   ├── stock/StockPage.jsx
│   ├── suppliers/SuppliersPage.jsx
│   ├── customers/CustomersPage.jsx
│   ├── purchase-orders/PurchaseOrdersPage.jsx
│   ├── sales-orders/SalesOrdersPage.jsx
│   ├── transfers/TransfersPage.jsx
│   ├── payments/PaymentsPage.jsx
│   ├── returns/ReturnsPage.jsx
│   └── [9 Wave 4 placeholder pages]
├── stores/
│   ├── authStore.js
│   ├── orgStore.js
│   └── themeStore.js
├── App.jsx
├── index.css
└── main.jsx
```

### 3.2 Entry Points

**main.jsx** — App bootstrap. Import order matters:
1. `@/lib/i18n` — MUST be imported before App so i18n initializes first
2. `ErrorBoundary` wraps entire app
3. `Suspense` wraps everything (for i18n useSuspense: true)
4. `QueryClientProvider` wraps `BrowserRouter` wraps `App`

**App.jsx** — Routing structure:
- `<Toaster>` at top level (react-hot-toast)
- Public route: `/login` → `AuthLayout` > `LoginPage`
- Protected routes: `<AppLayout>` wraps all authenticated routes
- All 22 page routes defined with `lazy()` + `<Suspense fallback={<PageLoader />}>`
- Catch-all `*` → redirect to `/dashboard`
- Root `/` → redirect to `/dashboard`

**index.css** — Design tokens:
- Google Fonts import (Plus Jakarta Sans)
- All CSS custom properties for light/dark themes
- Sidebar tokens (bg, fg, muted-fg, border, hover-bg, active-bg, active-fg)
- Layout tokens (--header-height, --sidebar-width, --sidebar-collapsed-width)
- Component classes (page-container, bcc-card, field-error, etc.)
- Status badge utilities (status-active, status-pending, etc.)
- Animations (fade-in, slide-in-left)

### 3.3 Key File Responsibilities

**lib/**
| File | Purpose |
|------|---------|
| `api.js` | Axios instance with JWT interceptor + response unwrapper + 401 handler |
| `constants.js` | TOKEN_KEY, USER_KEY, ROLES, ROLE_HIERARCHY, hasMinRole(), PO/SO/TRANSFER statuses, MOVEMENT_TYPES, LOCATION_TYPES, ORDER_CHANNELS, NAV_ITEMS |
| `i18n.js` | i18next init, SUPPORTED_LANGUAGES, LANGUAGE_KEY, version migration, applyLanguageDirection() |
| `queryClient.js` | TanStack QueryClient with staleTime 5m, gcTime 10m, smart retry, no refetchOnWindowFocus |
| `utils.js` | cn(), formatDate(), formatCurrency(), formatNumber(), truncate(), getInitials(), getErrorMessage() |

**stores/**
| File | Purpose |
|------|---------|
| `authStore.js` | JWT token + user object persistence, login/logout/updateUser/hasRole |
| `orgStore.js` | Organization data + currency, persisted to localStorage as `bcc_org` |
| `themeStore.js` | Dark/light toggle, persisted as `bcc_theme`, OS preference fallback |

**hooks/**
| File | Purpose |
|------|---------|
| `useAuth.js` | Convenience: isAuthenticated, user, login, logout, updateUser, hasRole, isOwner, isAdmin, isStaff |
| `useOrg.js` | Convenience: org, currency, setOrg, clearOrg |

**layouts/**
| File | Purpose |
|------|---------|
| `AppLayout.jsx` | Auth guard + Sidebar + Header + `<main><Outlet /></main>` |
| `AuthLayout.jsx` | Transparent pass-through `<>{children}</>` |

**components/shared/**
| File | Purpose |
|------|---------|
| `Sidebar.jsx` | Collapsible nav, role-based visibility, i18n group/item labels, RTL-aware chevrons |
| `Header.jsx` | Theme toggle, language switcher, user dropdown (profile, password, logout) |

**pages/** (complete only)
| File | Purpose |
|------|---------|
| `LoginPage.jsx` | Full-screen login with brand panel, form, i18n, RTL support |
| `DashboardPage.jsx` | 6 KPI cards, revenue chart, recent orders, low stock panel, period selector |
| `CategoriesPage.jsx` | CRUD table with add/edit modal, search, pagination, delete confirmation |
| `UnitsPage.jsx` | CRUD table with add/edit modal, search (name + abbreviation), pagination |
| `ProductsPage.jsx` | CRUD with 9-field form, category/unit dropdowns, active filter tabs, StatusBadge, currency formatting |
| `StockPage.jsx` | Read-only stock viewer, low stock filter, StatusBadge, no mutations |
| `SuppliersPage.jsx` | Full CRUD (5-field form, 4-column table, search, pagination) |
| `CustomersPage.jsx` | Full CRUD (4-field form, 4-column table, search, pagination) |
| `PurchaseOrdersPage.jsx` | List + inline detail (selectedId pattern), useFieldArray create modal, receive goods modal, cancel modal, status actions |
| `SalesOrdersPage.jsx` | List + inline detail (selectedId pattern), useFieldArray create modal, dual filter (status tabs + channel), Record Payment modal (RULE-26), Create Return modal |
| `TransfersPage.jsx` | List + inline detail (selectedId pattern), useFieldArray create modal, confirm/cancel modals — status: pending→completed or cancelled (RULE-28) |
| `PaymentsPage.jsx` | Read-only. No global payments endpoint exists — shows sales orders with client-side derived payment status (paid/partial/unpaid). Filter tabs: All/Unpaid/Partial/Paid. |
| `ReturnsPage.jsx` | Paginated returns list + two-step create modal: Step 1 load order by UUID, Step 2 select items/qty/refund. returnItems in local state, not useFieldArray. |

**api/**
| File | Purpose |
|------|---------|
| `auth.js` | login, register, me, changePassword |
| `dashboard.js` | fetchDashboardMetrics, fetchSalesByDay, fetchRecentOrders, fetchLowStockItems |
| `categories.js` | fetchCategories, fetchCategory, createCategory, updateCategory, deleteCategory |
| `units.js` | fetchUnits, fetchUnit, createUnit, updateUnit, deleteUnit |
| `products.js` | fetchProducts, fetchProduct, createProduct, updateProduct, deleteProduct — includes cleanParams util |
| `stock.js` | fetchStock — includes cleanParams util, supports low_stock filter |
| `suppliers.js` | fetchSuppliers, fetchSupplier, createSupplier, updateSupplier (PUT), deleteSupplier |
| `customers.js` | fetchCustomers, fetchCustomer, createCustomer, updateCustomer (PUT), deleteCustomer |
| `purchaseOrders.js` | fetchPurchaseOrders, fetchPurchaseOrder, createPurchaseOrder, updatePurchaseOrderStatus (PATCH), receivePurchaseOrder (POST) |
| `salesOrders.js` | fetchSalesOrders, fetchSalesOrder, createSalesOrder (POST), updateSalesOrderStatus (PATCH) |
| `locations.js` | fetchLocations only — no CRUD. Used by PurchaseOrdersPage + TransfersPage with queryKey ['locations','all']. MUST be extended (not replaced) in Wave 4 P2. See RULE-31. |
| `transfers.js` | fetchTransfers, fetchTransfer, createTransfer, confirmTransfer (POST), cancelTransfer (POST) |
| `payments.js` | fetchPaymentsForOrder (per-order plain array RULE-25), fetchPayment, recordPayment (RULE-26 OVERPAYMENT) |
| `returns.js` | fetchReturnReasons (plain array, RULE-27 reason field), fetchReturns, fetchReturn, createReturn |

---

## SECTION 4 — CODING PATTERNS & RULES

### 4.1 API Layer

**Base URL and proxy:** `baseURL: '/api'` — Vite dev server proxies to `http://localhost:3001`

**Axios interceptor behaviour** (from `api.js`):

Request interceptor — injects JWT:
```javascript
const token = localStorage.getItem(TOKEN_KEY);
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

Response interceptor — unwraps and normalizes:
```javascript
// Success: returns response.data directly
// So callers get { success, data, message } — NOT the raw axios response
(response) => response.data,

// Error: normalizes to { status, error, message, data }
// 401: clears localStorage, redirects to /login
```

**Standard API response shape:**
```json
{ "success": true, "data": { ... }, "message": "..." }
```
Paginated variant:
```json
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 42 }, "message": "..." }
```

**Auth header:** Injected automatically by interceptor — NEVER add manually.

**Monetary values:** PostgreSQL NUMERIC(12,2) returns strings (e.g., `"1500.00"`). Always `parseFloat()` before display. No exceptions.

**Timestamps:** UTC ISO 8601 strings from the API.

### 4.2 React Query

**QueryClient** (from `queryClient.js`):
- `staleTime`: 5 minutes (300,000ms)
- `gcTime`: 10 minutes (600,000ms)
- `retry`: false for 401/403/404; up to 2 retries for others
- `refetchOnWindowFocus`: false
- `mutations.retry`: false

**Standard useQuery pattern** (from DashboardPage — canonical example):
```javascript
const metricsQuery = useQuery({
  queryKey: ['dashboard', 'metrics', { from, to }],
  queryFn: () => fetchDashboardMetrics(from, to),
  select: (result) => result.data,
});
```
For arrays:
```javascript
select: (result) => result.data ?? [],
```

**queryKey structure:** `[module, entity, { params }]`

**Error state:** `isError` — show amber banner with AlertTriangle icon, never crash.

### 4.3 State Management

**authStore** (from `authStore.js`):
```javascript
// Fields
{ token: string | null, user: object | null }

// User object shape (from backend):
{ id, name, email, role, organization_id }
// NOTE: the field is organization_id — confirmed from authStore JSDoc

// Actions
login(token, user)    // Stores to state + localStorage
logout()              // Clears state + localStorage
updateUser(updates)   // Merges partial updates
hasRole(requiredRole) // Checks role hierarchy
```
localStorage keys: `bcc_token`, `bcc_user`

**orgStore** (from `orgStore.js`):
```javascript
// Fields
{ org: object | null, currency: string }

// Actions
setOrg(org)   // Stores to state + localStorage, extracts currency
clearOrg()    // Clears state + localStorage

// Currency read pattern — use useOrg() hook, never useOrgStore directly:
const { currency: rawCurrency } = useOrg();
const currency = rawCurrency || 'JOD';
// Import: import { useOrg } from '@/hooks/useOrg';
```
localStorage key: `bcc_org`
Default currency when no org loaded: `'USD'` (from store). ALL pages displaying monetary values must use the `useOrg()` hook with `|| 'JOD'` fallback — confirmed in DashboardPage and ProductsPage (BUG-09).

**themeStore** (from `themeStore.js`):
```javascript
// Fields
{ theme: 'dark' | 'light' }

// Actions
toggleTheme()
setTheme(theme)
```
localStorage key: `bcc_theme`
Falls back to OS preference via `matchMedia('(prefers-color-scheme: dark)')`.
Applies to DOM immediately on module load to prevent FOUC.

**useAuth() hook** returns:
`{ isAuthenticated, token, user, login, logout, updateUser, hasRole, isOwner, isAdmin, isStaff }`

Confirmed implementations (read from source in v4.6 audit):
```javascript
isOwner: user?.role === 'owner'
isAdmin: user?.role === 'admin' || user?.role === 'owner'
isStaff: ['staff', 'admin', 'owner'].includes(user?.role)
// hasRole() uses ROLE_HIERARCHY internally
```

**useOrg() hook** returns:
`{ org, currency, setOrg, clearOrg }`

**ROLES constant** (from constants.js — confirmed):
`{ READONLY: 'readonly', STAFF: 'staff', ADMIN: 'admin', OWNER: 'owner' }`

**ROLE_HIERARCHY** (from constants.js — confirmed):
`{ readonly: 0, staff: 1, admin: 2, owner: 3 }`

**hasMinRole(user, requiredRole)** — exists in constants.js, checks hierarchy numerically.

**LOCATION_TYPES** (from constants.js — confirmed):
`[{ value: 'warehouse', label: 'Warehouse' }, { value: 'store', label: 'Store' }]`
Labels are hardcoded English (ISSUE 6). For Wave 4 LocationsPage, define a translated
array INSIDE the component function. See RULE-33.

**TRANSFER_STATUS** (from constants.js — stale):
Contains "confirmed" value which contradicts RULE-28. TransfersPage does not use it.
Do not use TRANSFER_STATUS. Actual values: pending, completed, cancelled.

### 4.4 i18n System — CRITICAL

**Actual state of `i18n.js` on disk:**

```javascript
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English',  dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
];
// NO flag field — confirmed clean

export const LANGUAGE_KEY = 'bcc_language';
const I18N_VERSION_KEY = 'bcc_language_v';
const CURRENT_VERSION  = '2';
```

- `getStartupLanguage()` — reads localStorage, validates against SUPPORTED_LANGUAGES, checks version marker. Falls back to 'en' if stale version, unknown code, or error.
- `applyLanguageDirection(langCode)` — sets `dir` and `lang` attributes on `<html>`. Required for CSS `[dir="rtl"]` selectors, browser rendering, and accessibility.
- `languageChanged` event handler — persists choice to localStorage + calls `applyLanguageDirection()`.
- No LanguageDetector plugin. Language is set explicitly via `lng` in init.

**I18N RULES (non-negotiable):**

| Rule | Description |
|------|-------------|
| I18N-1 | Always use `t()` for every user-visible string in JSX |
| I18N-2 | Translated arrays/objects MUST be defined INSIDE the component function — never at module level (they must re-evaluate when language changes) |
| I18N-3 | NEVER add a `flag` field to SUPPORTED_LANGUAGES — no emoji flags anywhere |
| I18N-4 | ALWAYS add new keys to BOTH `en/translation.json` AND `ar/translation.json` simultaneously — structural parity is mandatory |
| I18N-5 | `useTranslation` import: `from 'react-i18next'` |
| I18N-6 | Never use LanguageDetector plugin — removed |

### 4.5 Design System

**CSS Custom Properties** (from `index.css`):

Layout tokens:
```css
--header-height: 60px;
--sidebar-width: 256px;
--sidebar-collapsed-width: 68px;
```

Sidebar tokens (light):
```css
--sidebar-bg: 222 25% 11%;
--sidebar-fg: 220 20% 88%;
--sidebar-muted-fg: 220 15% 55%;
--sidebar-border: 222 20% 18%;
--sidebar-hover-bg: 222 20% 17%;
--sidebar-active-bg: 239 84% 67%;
--sidebar-active-fg: 0 0% 100%;
```

**Component classes:**

```css
.page-container {
  @apply p-6 space-y-6;
}

.bcc-card {
  @apply bg-card text-card-foreground rounded-lg border shadow-sm p-6;
}

.bcc-card-padded {
  @apply bg-card text-card-foreground rounded-lg border shadow-sm p-6;
}

.page-header {
  @apply flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3;
}

.page-title {
  @apply text-2xl font-bold tracking-tight;
}

.field-error {
  @apply text-destructive text-xs mt-1;
}
```

**Status badge utilities:**

| Class | Colours |
|-------|---------|
| `.status-active` | green-100/green-800 (dark: green-900/30, green-400) |
| `.status-inactive` | gray-100/gray-600 (dark: gray-800, gray-400) |
| `.status-pending` | yellow-100/yellow-800 (dark: yellow-900/30, yellow-400) |
| `.status-cancelled` | red-100/red-700 (dark: red-900/30, red-400) |
| `.status-completed` | blue-100/blue-800 (dark: blue-900/30, blue-400) |
| `.status-confirmed` | purple-100/purple-800 (dark: purple-900/30, purple-400) |
| `.status-shipped` | indigo-100/indigo-800 (dark: indigo-900/30, indigo-400) |
| `.status-delivered` | green-100/green-800 (dark: green-900/30, green-400) |

**Animations:**

```css
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
/* from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } */

.slide-in-left {
  animation: slideInLeft 0.25s ease-out;
}
/* from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } */
```

**DESIGN RULES:**

| Rule | Description |
|------|-------------|
| D-1 | Every page wraps content in `<div className="page-container">` |
| D-2 | Cards use `className="bcc-card"` — no custom card styles |
| D-3 | Status badges: `className={\`status-${status}\`}` |
| D-4 | RTL-safe positioning: `end-*`/`start-*` NOT `right-*`/`left-*` for absolute/fixed elements |
| D-5 | Loading skeletons: `animate-pulse bg-muted rounded` |
| D-6 | Empty states: centered icon `opacity-40` + `text-sm text-muted-foreground` message |
| D-7 | Error banner: amber border/bg + AlertTriangle icon |

### 4.6 Component Patterns (from DashboardPage — gold standard)

**Skeleton components:**
```jsx
function KpiCardSkeleton() {
  return <div className="bcc-card h-[120px] animate-pulse bg-muted rounded-lg" />;
}

function ChartSkeleton() {
  return <div className="bcc-card h-[320px] animate-pulse bg-muted rounded-lg" />;
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse bg-muted rounded" />
            <div className="h-3 w-20 animate-pulse bg-muted rounded" />
          </div>
          <div className="h-4 w-16 animate-pulse bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}
```

**useEffect for document.title:**
```jsx
useEffect(() => {
  document.title = t('dashboard.pageTitle');
}, [t]);
```

**Error banner:**
```jsx
{hasError && (
  <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
      {t('dashboard.error')}
    </p>
  </div>
)}
```

**Empty state:**
```jsx
<div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
  <ShoppingCart className="h-10 w-10 mb-2 opacity-40" />
  <p className="text-sm">{t('dashboard.recentOrders.empty')}</p>
</div>
```

**Loading state:** Conditional render of skeleton vs content using `isLoading`.

### 4.7 Form Patterns (from LoginPage)

- `react-hook-form` + `zodResolver`
- Validation schema defined at module level (not inside component — zod schemas are not translated)
- Zod error messages are i18n keys: `z.string().min(1, 'auth.login.errors.emailRequired')`
- Error display: `<p className="field-error" role="alert">{t(errors.email.message)}</p>`
- Submit button disabled during `isSubmitting`
- API error displayed in a banner above form fields (red destructive border/bg with dot indicator)

### 4.8 Navigation & Routing

**AppLayout** (exact JSX from `AppLayout.jsx`):
```jsx
<div className="flex h-screen overflow-hidden bg-background">
  <Sidebar />
  <div className="flex flex-1 flex-col overflow-hidden">
    <Header />
    <main className="flex-1 overflow-y-auto">
      <Outlet />
    </main>
  </div>
</div>
```
**CRITICAL:** AppLayout does NOT wrap `<Outlet />` in `page-container`. Each page is responsible for its own `page-container` wrapper.

**Auth guard:** `if (!isAuthenticated) return <Navigate to="/login" replace />;`

**All 22 routes** (from App.jsx):
```
/login                 → LoginPage (public)
/dashboard             → DashboardPage
/organization          → OrganizationPage
/branches              → BranchesPage
/locations             → LocationsPage
/users                 → UsersPage
/categories            → CategoriesPage
/units                 → UnitsPage
/products              → ProductsPage
/suppliers             → SuppliersPage
/customers             → CustomersPage
/purchase-orders       → PurchaseOrdersPage
/sales-orders          → SalesOrdersPage
/payments              → PaymentsPage
/returns               → ReturnsPage
/transfers             → TransfersPage
/stock                 → StockPage
/expenses              → ExpensesPage
/reports               → ReportsPage
/audit-log             → AuditLogPage
/profile               → ProfilePage
/change-password       → ChangePasswordPage
*                      → redirect to /dashboard
```

**Sidebar NAV_GROUPS** (from `Sidebar.jsx`):

| Group | Items (key → path) | Min Role |
|-------|---------------------|----------|
| Overview | Dashboard → `/dashboard` | readonly |
| Settings | Organization → `/organization`, Branches → `/branches`, Locations → `/locations`, Users → `/users` | admin |
| Inventory | Categories → `/categories`, Units → `/units`, Products → `/products`, Stock → `/stock`, Transfers → `/transfers` | staff (Products/Stock: readonly) |
| Operations | Suppliers → `/suppliers`, Customers → `/customers`, Purchase Orders → `/purchase-orders`, Sales Orders → `/sales-orders`, Returns → `/returns` | staff |
| Finance | Payments → `/payments`, Expenses → `/expenses`, Reports → `/reports`, Audit Log → `/audit-log` | staff (Reports: readonly, Audit: admin) |

### 4.9 Date & Currency Formatting

**formatCurrency** (from `utils.js`):
```javascript
export function formatCurrency(value, currency = 'USD')
// Returns Intl.NumberFormat with style: 'currency', 2 decimal places
// Returns '—' for null/undefined/empty/NaN
// Example: formatCurrency('1500.00', 'JOD') → 'JOD 1,500.00'
```

**formatDate** (from `utils.js`):
```javascript
export function formatDate(utcString, includeTime = false)
// Converts UTC ISO string to Jordan time (Asia/Amman, UTC+3)
// Default format: 'MMM d, yyyy'
// With time: 'MMM d, yyyy, hh:mm a'
// Returns '—' for falsy input
```

**For relative times:** Use `formatDistanceToNow` from `date-fns` — NOT `formatDate` from utils (which is for absolute dates only).

**Date parsing rule:** Always append `'T00:00:00'` to date-only strings before passing to `new Date()` to avoid timezone-induced shift errors. Example from DashboardPage:
```javascript
new Date(item.day + 'T00:00:00')
```

---

## SECTION 5 — API REFERENCE

### 5.1 Authentication

**POST /api/auth/login**
- Request: `{ email, password }`
- Response (after axios interceptor unwraps `response.data`):
```json
{
  "success": true,
  "data": {
    "token": "JWT_STRING",
    "user": { "id": "uuid", "name": "...", "email": "...", "role": "owner", "organization_id": "uuid" }
  },
  "message": "Login successful"
}
```
- **Login handler pattern** (from LoginPage.jsx):
```javascript
const result = await authApi.login(values.email, values.password);
const token  = result?.data?.token;  // result.data.token — NOT result.token
const user   = result?.data?.user;   // result.data.user
loginStore(token, user);
```

### 5.2 Dashboard Endpoints

Complete API module (`src/api/dashboard.js`):
```javascript
import api from '@/lib/api';

/**
 * Fetch the core dashboard KPI metrics.
 * When from/to are both omitted, the backend defaults to the current calendar month.
 */
export function fetchDashboardMetrics(from, to) {
  const params = {};
  if (from) params.from = from;
  if (to)   params.to   = to;
  return api.get('/reports/dashboard', { params });
}

/**
 * Fetch daily revenue breakdown for the chart.
 * Always requires explicit from and to.
 */
export function fetchSalesByDay(from, to) {
  return api.get('/reports/sales-by-day', { params: { from, to } });
}

/**
 * Fetch the 5 most recent sales orders for the activity feed.
 */
export function fetchRecentOrders() {
  return api.get('/sales-orders', { params: { page: 1, limit: 5 } });
}

/**
 * Fetch all products currently at or below their low_stock_threshold.
 */
export function fetchLowStockItems() {
  return api.get('/reports/low-stock');
}
```

### 5.3 All Backend Endpoints by Module

**Auth**
- POST /api/auth/register — Register new org + owner
- POST /api/auth/login — Login
- GET /api/auth/me — Get current user profile
- PATCH /api/auth/password — Change password

**Organizations**
- GET /api/organizations/me — Get current org
- PATCH /api/organizations/me — Update org settings

**Branches**
- GET /api/branches — List branches
- POST /api/branches — Create branch
- GET /api/branches/:id — Get single
- PUT /api/branches/:id — Update
- DELETE /api/branches/:id — Delete

**Locations**
- GET /api/locations — List locations
- POST /api/locations — Create location
- GET /api/locations/:id — Get single
- PUT /api/locations/:id — Update
- DELETE /api/locations/:id — Delete

**Users**
- GET /api/users — List users (admin+)
- POST /api/users — Create user
- GET /api/users/:id — Get single
- PUT /api/users/:id — Update
- DELETE /api/users/:id — Delete

**Categories** ★ Wave 2
- GET /api/categories — List categories ★
- POST /api/categories — Create category ★
- GET /api/categories/:id — Get single ★
- PUT /api/categories/:id — Update ★
- DELETE /api/categories/:id — Delete ★

**Units** ★ Wave 2
- GET /api/units — List units ★
- POST /api/units — Create unit ★
- GET /api/units/:id — Get single ★
- PUT /api/units/:id — Update ★
- DELETE /api/units/:id — Delete ★

**Products** ★ Wave 2
- GET /api/products — List products (paginated) ★
- POST /api/products — Create product ★
- GET /api/products/:id — Get single ★
- PUT /api/products/:id — Update ★
- DELETE /api/products/:id — Delete ★
- POST /api/products/:id/variants — Create variant
- PUT /api/products/:productId/variants/:id — Update variant
- DELETE /api/products/:productId/variants/:id — Delete variant

**Stock** ★ Wave 2
- GET /api/stock — List stock levels ★
- GET /api/stock/ledger — Stock movement ledger
- POST /api/stock/adjust — Manual stock adjustment

**Transfers**
- GET /api/transfers — List transfers
- POST /api/transfers — Create transfer
- GET /api/transfers/:id — Get single
- PUT /api/transfers/:id — Update
- POST /api/transfers/:id/confirm — Confirm transfer
- POST /api/transfers/:id/cancel — Cancel transfer

**Suppliers**
- GET /api/suppliers — List
- POST /api/suppliers — Create
- GET /api/suppliers/:id — Get single
- PUT /api/suppliers/:id — Update
- DELETE /api/suppliers/:id — Delete

**Customers**
- GET /api/customers — List
- POST /api/customers — Create
- GET /api/customers/:id — Get single
- PUT /api/customers/:id — Update
- DELETE /api/customers/:id — Delete
- GET /api/customers/:id/notes — List notes
- POST /api/customers/:id/notes — Add note

**Purchase Orders**
- GET /api/purchase-orders — List
- POST /api/purchase-orders — Create
- GET /api/purchase-orders/:id — Get single
- PUT /api/purchase-orders/:id — Update
- PATCH /api/purchase-orders/:id/status — Change status
- POST /api/purchase-orders/:id/receive — Receive items

**Sales Orders**
- GET /api/sales-orders — List
- POST /api/sales-orders — Create
- GET /api/sales-orders/:id — Get single
- PUT /api/sales-orders/:id — Update
- PATCH /api/sales-orders/:id/status — Change status

**Payments**
- GET /api/payments/order/:orderId — Get payments for order
- POST /api/payments/order/:orderId — Record payment

**Returns**
- GET /api/returns — List returns
- POST /api/returns — Create return
- GET /api/returns/:id — Get single
- GET /api/returns/reasons — List return reasons

**Expenses**
- GET /api/expenses — List expenses
- POST /api/expenses — Create expense
- GET /api/expenses/:id — Get single
- PUT /api/expenses/:id — Update
- DELETE /api/expenses/:id — Delete
- GET /api/expenses/categories — List expense categories
- POST /api/expenses/categories — Create expense category

**Reports**
- GET /api/reports/dashboard — Dashboard metrics ★
- GET /api/reports/sales-by-day — Daily revenue ★
- GET /api/reports/top-products — Top selling products
- GET /api/reports/sales-by-source — Sales by channel
- GET /api/reports/expenses-by-category — Expense breakdown
- GET /api/reports/low-stock — Low stock items ★

**Audit Log**
- GET /api/audit-log — List audit events (paginated)

### 5.4 Wave 2 Endpoints — Detailed

**CATEGORIES**

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/categories | List all categories |
| POST | /api/categories | Create category |
| GET | /api/categories/:id | Get single |
| PUT | /api/categories/:id | Update category |
| DELETE | /api/categories/:id | Delete category |

GET list response:
```json
{ "success": true, "data": [{ "id": "uuid", "name": "...", "description": "...", "product_count": 5, "created_at": "ISO", "updated_at": "ISO" }], "pagination": { "page": 1, "limit": 20, "total": 8 } }
```

**UNITS**

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/units | List all units |
| POST | /api/units | Create unit |
| GET | /api/units/:id | Get single |
| PUT | /api/units/:id | Update unit |
| DELETE | /api/units/:id | Delete unit |

GET list response:
```json
{ "success": true, "data": [{ "id": "uuid", "name": "...", "abbreviation": "...", "created_at": "ISO", "updated_at": "ISO" }], "pagination": { "page": 1, "limit": 20, "total": 6 } }
```

**PRODUCTS**

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/products | List products (paginated) |
| POST | /api/products | Create product |
| GET | /api/products/:id | Get single product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |

GET list response:
```json
{ "success": true, "data": [{ "id": "uuid", "name": "...", "sku": "...", "description": "...", "category_id": "uuid", "category_name": "...", "unit_id": "uuid", "unit_name": "...", "cost_price": "1500.00", "selling_price": "2000.00", "low_stock_threshold": 10, "is_active": true, "created_at": "ISO", "updated_at": "ISO" }], "pagination": { "page": 1, "limit": 20, "total": 42 } }
```

**STOCK**

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/stock | List stock levels |
| GET | /api/reports/low-stock | Low stock items only |

GET /api/stock response:
```json
{ "success": true, "data": [{ "product_id": "uuid", "product_name": "...", "sku": "...", "location_id": "uuid", "location_name": "...", "branch_name": "...", "quantity_on_hand": 25, "low_stock_threshold": 10, "is_low_stock": false }], "pagination": { "page": 1, "limit": 20, "total": 100 } }
```

---

## SECTION 6 — TRANSLATION FILES

**Current namespaces (after Wave 3 complete): 18 total**
Existing (11): app, auth, nav, header, dashboard, common, categories, units, products, stock, sidebar
Added in Wave 3: suppliers (23), customers (20), purchaseOrders (54), salesOrders (60), transfers (39), payments (30), returns (28)
**Total key count:** ~550+ keys across 18 namespaces in each file
**Parity status:** Confirmed — both EN and AR files have identical structure (verified in Wave 4 pre-build audit)
**Wave 4 will add 9 more namespaces:** organization, branches, locations, users, expenses, reports, auditLog, profile, changePassword
**Final count after Wave 4:** 27 namespaces

### 6.1 Complete English Translation File

```json
{
  "app": {
    "name": "Business Command Center",
    "tagline": "Unified operations for modern businesses",
    "loading": "Loading…"
  },
  "auth": {
    "login": {
      "title": "Welcome back",
      "subtitle": "Sign in to your workspace",
      "emailLabel": "Email address",
      "emailPlaceholder": "you@company.com",
      "passwordLabel": "Password",
      "passwordPlaceholder": "Enter your password",
      "showPassword": "Show password",
      "hidePassword": "Hide password",
      "submitButton": "Sign in",
      "submitting": "Signing in…",
      "noAccount": "Don't have an account?",
      "contactAdmin": "Contact your administrator.",
      "errors": {
        "emailRequired": "Email is required",
        "emailInvalid": "Enter a valid email address",
        "passwordRequired": "Password is required",
        "passwordMinLength": "Password must be at least 8 characters",
        "invalidCredentials": "Invalid email or password",
        "accountLocked": "Your account has been locked. Contact your administrator.",
        "serverError": "Something went wrong. Please try again.",
        "networkError": "Cannot reach the server. Check your connection.",
        "tooManyAttempts": "Too many attempts. Please wait before trying again."
      },
      "features": {
        "inventory": "Inventory & stock management",
        "orders": "Purchase & sales orders",
        "reports": "Real-time reports & analytics"
      },
      "welcomeBack": "Welcome back, {{name}}!",
      "copyright": "© {{year}} Business Command Center"
    }
  },
  "nav": {
    "groups": {
      "overview": "Overview",
      "inventory": "Inventory",
      "operations": "Operations",
      "finance": "Finance",
      "settings": "Settings"
    },
    "items": {
      "dashboard": "Dashboard",
      "organization": "Organization",
      "branches": "Branches",
      "locations": "Locations",
      "users": "Users",
      "categories": "Categories",
      "units": "Units",
      "products": "Products",
      "suppliers": "Suppliers",
      "customers": "Customers",
      "purchaseOrders": "Purchase Orders",
      "salesOrders": "Sales Orders",
      "payments": "Payments",
      "returns": "Returns",
      "transfers": "Transfers",
      "stock": "Stock",
      "expenses": "Expenses",
      "reports": "Reports",
      "auditLog": "Audit Log"
    }
  },
  "header": {
    "toggleTheme": "Toggle theme",
    "language": "Language",
    "myProfile": "My Profile",
    "changePassword": "Change Password",
    "signOut": "Sign out",
    "role": {
      "owner": "Owner",
      "admin": "Admin",
      "staff": "Staff",
      "readonly": "Read Only"
    }
  },
  "dashboard": {
    "title": "Dashboard",
    "greeting": {
      "morning": "Good morning",
      "afternoon": "Good afternoon",
      "evening": "Good evening"
    },
    "periods": {
      "today": "Today",
      "week": "This Week",
      "month": "This Month",
      "year": "This Year"
    },
    "kpi": {
      "grossRevenue": "Gross Revenue",
      "grossRevenueSubtext": "{{count}} orders",
      "collected": "Collected",
      "collectedSubtext": "{{amount}} outstanding",
      "unpaidBalance": "Unpaid Balance",
      "unpaidBalanceSubtext": "Awaiting collection",
      "grossProfit": "Gross Profit",
      "grossProfitSubtext": "{{margin}}% margin",
      "lowStockItems": "Low Stock Items",
      "lowStockSubtext": "{{count}} POs pending",
      "newCustomers": "New Customers",
      "newCustomersSubtext": "This period"
    },
    "chart": {
      "title": "Revenue",
      "empty": "No revenue data for this period",
      "tooltipRevenue": "Revenue",
      "tooltipOrders": "Orders"
    },
    "recentOrders": {
      "title": "Recent Orders",
      "viewAll": "View all",
      "empty": "No orders yet",
      "walkIn": "Walk-in"
    },
    "lowStock": {
      "title": "Low Stock",
      "viewAll": "View all",
      "empty": "All stock levels healthy",
      "left": "left",
      "min": "Min",
      "more": "and {{count}} more items..."
    },
    "error": "Unable to load some dashboard data. Please refresh.",
    "pageTitle": "Dashboard — BCC"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "import": "Import",
    "loading": "Loading…",
    "noData": "No data found",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "close": "Close",
    "yes": "Yes",
    "no": "No",
    "actions": "Actions",
    "status": "Status",
    "createdAt": "Created",
    "updatedAt": "Updated"
  }
}
```

### 6.2 Complete Arabic Translation File

```json
{
  "app": {
    "name": "مركز قيادة الأعمال",
    "tagline": "عمليات موحدة للشركات الحديثة",
    "loading": "جارٍ التحميل…"
  },
  "auth": {
    "login": {
      "title": "مرحباً بعودتك",
      "subtitle": "سجّل دخولك إلى مساحة عملك",
      "emailLabel": "البريد الإلكتروني",
      "emailPlaceholder": "أنت@شركتك.com",
      "passwordLabel": "كلمة المرور",
      "passwordPlaceholder": "أدخل كلمة المرور",
      "showPassword": "إظهار كلمة المرور",
      "hidePassword": "إخفاء كلمة المرور",
      "submitButton": "تسجيل الدخول",
      "submitting": "جارٍ تسجيل الدخول…",
      "noAccount": "ليس لديك حساب؟",
      "contactAdmin": "تواصل مع المسؤول.",
      "errors": {
        "emailRequired": "البريد الإلكتروني مطلوب",
        "emailInvalid": "أدخل عنوان بريد إلكتروني صالح",
        "passwordRequired": "كلمة المرور مطلوبة",
        "passwordMinLength": "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل",
        "invalidCredentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        "accountLocked": "تم تعليق حسابك. تواصل مع المسؤول.",
        "serverError": "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
        "networkError": "تعذّر الوصول إلى الخادم. تحقق من اتصالك.",
        "tooManyAttempts": "محاولات كثيرة جداً. يرجى الانتظار قبل المحاولة مجدداً."
      },
      "features": {
        "inventory": "إدارة المخزون والمستودعات",
        "orders": "أوامر الشراء والمبيعات",
        "reports": "التقارير والتحليلات الفورية"
      },
      "welcomeBack": "مرحباً بعودتك، {{name}}!",
      "copyright": "© {{year}} مركز قيادة الأعمال"
    }
  },
  "nav": {
    "groups": {
      "overview": "نظرة عامة",
      "inventory": "المخزون",
      "operations": "العمليات",
      "finance": "المالية",
      "settings": "الإعدادات"
    },
    "items": {
      "dashboard": "لوحة التحكم",
      "organization": "المؤسسة",
      "branches": "الفروع",
      "locations": "المواقع",
      "users": "المستخدمون",
      "categories": "الفئات",
      "units": "الوحدات",
      "products": "المنتجات",
      "suppliers": "الموردون",
      "customers": "العملاء",
      "purchaseOrders": "أوامر الشراء",
      "salesOrders": "أوامر المبيعات",
      "payments": "المدفوعات",
      "returns": "المرتجعات",
      "transfers": "التحويلات",
      "stock": "المخزون",
      "expenses": "المصروفات",
      "reports": "التقارير",
      "auditLog": "سجل المراجعة"
    }
  },
  "header": {
    "toggleTheme": "تبديل المظهر",
    "language": "اللغة",
    "myProfile": "ملفي الشخصي",
    "changePassword": "تغيير كلمة المرور",
    "signOut": "تسجيل الخروج",
    "role": {
      "owner": "مالك",
      "admin": "مسؤول",
      "staff": "موظف",
      "readonly": "قراءة فقط"
    }
  },
  "dashboard": {
    "title": "لوحة التحكم",
    "greeting": {
      "morning": "صباح الخير",
      "afternoon": "مساء الخير",
      "evening": "مساء النور"
    },
    "periods": {
      "today": "اليوم",
      "week": "هذا الأسبوع",
      "month": "هذا الشهر",
      "year": "هذا العام"
    },
    "kpi": {
      "grossRevenue": "إجمالي الإيرادات",
      "grossRevenueSubtext": "{{count}} طلب",
      "collected": "المحصّل",
      "collectedSubtext": "{{amount}} غير مسدّد",
      "unpaidBalance": "الرصيد غير المسدّد",
      "unpaidBalanceSubtext": "في انتظار التحصيل",
      "grossProfit": "إجمالي الربح",
      "grossProfitSubtext": "هامش {{margin}}%",
      "lowStockItems": "أصناف منخفضة المخزون",
      "lowStockSubtext": "{{count}} أوامر شراء معلقة",
      "newCustomers": "عملاء جدد",
      "newCustomersSubtext": "هذه الفترة"
    },
    "chart": {
      "title": "الإيرادات",
      "empty": "لا توجد بيانات إيرادات لهذه الفترة",
      "tooltipRevenue": "الإيرادات",
      "tooltipOrders": "الطلبات"
    },
    "recentOrders": {
      "title": "الطلبات الأخيرة",
      "viewAll": "عرض الكل",
      "empty": "لا توجد طلبات بعد",
      "walkIn": "زبون مباشر"
    },
    "lowStock": {
      "title": "مخزون منخفض",
      "viewAll": "عرض الكل",
      "empty": "جميع مستويات المخزون سليمة",
      "left": "متبقي",
      "min": "الحد الأدنى",
      "more": "و {{count}} أصناف أخرى..."
    },
    "error": "تعذّر تحميل بعض بيانات لوحة التحكم. يرجى التحديث.",
    "pageTitle": "لوحة التحكم — BCC"
  },
  "common": {
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "add": "إضافة",
    "search": "بحث",
    "filter": "تصفية",
    "export": "تصدير",
    "import": "استيراد",
    "loading": "جارٍ التحميل…",
    "noData": "لا توجد بيانات",
    "confirm": "تأكيد",
    "back": "رجوع",
    "next": "التالي",
    "previous": "السابق",
    "close": "إغلاق",
    "yes": "نعم",
    "no": "لا",
    "actions": "إجراءات",
    "status": "الحالة",
    "createdAt": "تاريخ الإنشاء",
    "updatedAt": "تاريخ التعديل"
  }
}
```

### 6.3 Wave 2 Translation Keys Required

Add to BOTH files under their respective namespaces:

**categories (EN / AR):**
```json
"categories": {
  "title": "Categories",
  "pageTitle": "Categories — BCC",
  "subtitle": "Manage product categories",
  "addCategory": "Add Category",
  "editCategory": "Edit Category",
  "deleteCategory": "Delete Category",
  "deleteConfirm": "Are you sure you want to delete this category? This action cannot be undone.",
  "name": "Name",
  "description": "Description",
  "namePlaceholder": "Category name",
  "descriptionPlaceholder": "Optional description",
  "productCount": "Products",
  "noCategories": "No categories yet. Add your first category to get started.",
  "errors": {
    "nameRequired": "Category name is required",
    "nameExists": "A category with this name already exists"
  }
}
```
```json
"categories": {
  "title": "الفئات",
  "pageTitle": "الفئات — BCC",
  "subtitle": "إدارة فئات المنتجات",
  "addCategory": "إضافة فئة",
  "editCategory": "تعديل الفئة",
  "deleteCategory": "حذف الفئة",
  "deleteConfirm": "هل أنت متأكد من حذف هذه الفئة؟ لا يمكن التراجع عن هذا الإجراء.",
  "name": "الاسم",
  "description": "الوصف",
  "namePlaceholder": "اسم الفئة",
  "descriptionPlaceholder": "وصف اختياري",
  "productCount": "المنتجات",
  "noCategories": "لا توجد فئات بعد. أضف أول فئة للبدء.",
  "errors": {
    "nameRequired": "اسم الفئة مطلوب",
    "nameExists": "توجد فئة بهذا الاسم بالفعل"
  }
}
```

**units (EN / AR):**
```json
"units": {
  "title": "Units",
  "pageTitle": "Units — BCC",
  "subtitle": "Manage measurement units",
  "addUnit": "Add Unit",
  "editUnit": "Edit Unit",
  "deleteUnit": "Delete Unit",
  "deleteConfirm": "Are you sure you want to delete this unit? This action cannot be undone.",
  "name": "Name",
  "abbreviation": "Abbreviation",
  "namePlaceholder": "Unit name",
  "abbreviationPlaceholder": "e.g. kg, pcs, m",
  "noUnits": "No units yet. Add your first unit to get started.",
  "errors": {
    "nameRequired": "Unit name is required",
    "abbreviationRequired": "Abbreviation is required"
  }
}
```
```json
"units": {
  "title": "الوحدات",
  "pageTitle": "الوحدات — BCC",
  "subtitle": "إدارة وحدات القياس",
  "addUnit": "إضافة وحدة",
  "editUnit": "تعديل الوحدة",
  "deleteUnit": "حذف الوحدة",
  "deleteConfirm": "هل أنت متأكد من حذف هذه الوحدة؟ لا يمكن التراجع عن هذا الإجراء.",
  "name": "الاسم",
  "abbreviation": "الاختصار",
  "namePlaceholder": "اسم الوحدة",
  "abbreviationPlaceholder": "مثل: كغ، قطعة، م",
  "noUnits": "لا توجد وحدات بعد. أضف أول وحدة للبدء.",
  "errors": {
    "nameRequired": "اسم الوحدة مطلوب",
    "abbreviationRequired": "الاختصار مطلوب"
  }
}
```

**products (EN / AR):**
```json
"products": {
  "title": "Products",
  "pageTitle": "Products — BCC",
  "subtitle": "Manage your product catalog",
  "addProduct": "Add Product",
  "editProduct": "Edit Product",
  "deleteProduct": "Delete Product",
  "deleteConfirm": "Are you sure you want to delete this product? This action cannot be undone.",
  "sku": "SKU",
  "name": "Name",
  "description": "Description",
  "costPrice": "Cost Price",
  "sellingPrice": "Selling Price",
  "lowStockThreshold": "Low Stock Threshold",
  "category": "Category",
  "unit": "Unit",
  "isActive": "Active",
  "noProducts": "No products yet. Add your first product to get started.",
  "filters": {
    "all": "All",
    "active": "Active",
    "inactive": "Inactive",
    "lowStock": "Low Stock"
  },
  "errors": {
    "nameRequired": "Product name is required",
    "skuRequired": "SKU is required",
    "priceInvalid": "Price must be a valid number"
  }
}
```
```json
"products": {
  "title": "المنتجات",
  "pageTitle": "المنتجات — BCC",
  "subtitle": "إدارة كتالوج المنتجات",
  "addProduct": "إضافة منتج",
  "editProduct": "تعديل المنتج",
  "deleteProduct": "حذف المنتج",
  "deleteConfirm": "هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.",
  "sku": "رمز المنتج",
  "name": "الاسم",
  "description": "الوصف",
  "costPrice": "سعر التكلفة",
  "sellingPrice": "سعر البيع",
  "lowStockThreshold": "حد المخزون المنخفض",
  "category": "الفئة",
  "unit": "الوحدة",
  "isActive": "نشط",
  "noProducts": "لا توجد منتجات بعد. أضف أول منتج للبدء.",
  "filters": {
    "all": "الكل",
    "active": "نشط",
    "inactive": "غير نشط",
    "lowStock": "مخزون منخفض"
  },
  "errors": {
    "nameRequired": "اسم المنتج مطلوب",
    "skuRequired": "رمز المنتج مطلوب",
    "priceInvalid": "يجب أن يكون السعر رقماً صالحاً"
  }
}
```

**stock (EN / AR):**
```json
"stock": {
  "title": "Stock",
  "pageTitle": "Stock — BCC",
  "subtitle": "View stock levels across all locations",
  "product": "Product",
  "sku": "SKU",
  "location": "Location",
  "branch": "Branch",
  "quantityOnHand": "Qty on Hand",
  "threshold": "Threshold",
  "lowStock": "Low Stock",
  "noStock": "No stock records found.",
  "filters": {
    "all": "All",
    "lowStock": "Low Stock Only"
  }
}
```
```json
"stock": {
  "title": "المخزون",
  "pageTitle": "المخزون — BCC",
  "subtitle": "عرض مستويات المخزون في جميع المواقع",
  "product": "المنتج",
  "sku": "رمز المنتج",
  "location": "الموقع",
  "branch": "الفرع",
  "quantityOnHand": "الكمية المتاحة",
  "threshold": "الحد الأدنى",
  "lowStock": "مخزون منخفض",
  "noStock": "لا توجد سجلات مخزون.",
  "filters": {
    "all": "الكل",
    "lowStock": "المخزون المنخفض فقط"
  }
}
```

**Additional common keys to add (EN / AR):**
```json
"common": {
  "...existing keys...",
  "view": "View",
  "activate": "Activate",
  "deactivate": "Deactivate",
  "name": "Name",
  "id": "ID",
  "noResults": "No results found",
  "showing": "Showing",
  "of": "of",
  "confirmDelete": "Confirm Delete",
  "deleteWarning": "This action cannot be undone.",
  "active": "Active",
  "inactive": "Inactive"
}
```
```json
"common": {
  "...existing keys...",
  "view": "عرض",
  "activate": "تفعيل",
  "deactivate": "إلغاء التفعيل",
  "name": "الاسم",
  "id": "المعرّف",
  "noResults": "لم يتم العثور على نتائج",
  "showing": "عرض",
  "of": "من",
  "confirmDelete": "تأكيد الحذف",
  "deleteWarning": "لا يمكن التراجع عن هذا الإجراء.",
  "active": "نشط",
  "inactive": "غير نشط"
}
```

---

## SECTION 7 — BUG FIX REGISTRY

| ID | Title | Root Cause | Fix Applied | Files Changed | Status | Date |
|----|-------|-----------|-------------|---------------|--------|------|
| BUG-01 | RangeError in DashboardPage RevenueChart | Null/invalid `day` values passed to `new Date()`; date strings without `T00:00:00` suffix causing timezone shifts | Added `.filter()` before `.map()` to exclude null day values; appended `'T00:00:00'` to all date strings before `Date()` | `DashboardPage.jsx` | ✅ APPLIED | 09 Mar 2026 |
| BUG-02 | Dashboard hardcoded strings not translating | PERIODS array defined at module level (outside component) so `t()` ran before language was set; `getGreeting()` returned hardcoded English; sub-components missing `useTranslation` | PERIODS moved inside component; `getGreetingKey()` returns i18n key instead of English string; `useTranslation` added to all 5 sub-components; dashboard keys added to both translation files | `DashboardPage.jsx`, `en/translation.json`, `ar/translation.json` | ✅ APPLIED | 09 Mar 2026 |
| BUG-03 | Flag emoji rendered in language switcher | `SUPPORTED_LANGUAGES` had `flag: '🇬🇧'` / `'🇯🇴'` fields; Header.jsx and LoginPage.jsx rendered `{...flag}` | flag fields removed from SUPPORTED_LANGUAGES in `i18n.js`; flag references removed from Header.jsx and LoginPage.jsx | `i18n.js`, `Header.jsx`, `LoginPage.jsx` | ✅ FULLY APPLIED | 09 Mar 2026 |
| BUG-04 | LoginPage RTL — password toggle uses right-3 | Absolute positioned password toggle used `right-3` (LTR-only Tailwind class) instead of RTL-safe `end-3` | `right-3` → `end-3` on password toggle button | `LoginPage.jsx` (~line 280) | ✅ APPLIED | 09 Mar 2026 |
| BUG-05 | Wave 2 audit: Sidebar collapse/expand aria-labels hardcoded English | `aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}` not using t() | Replaced with t('sidebar.expand') / t('sidebar.collapse'). Added sidebar namespace to both translation files. | `Sidebar.jsx`, `en/translation.json`, `ar/translation.json` | ✅ APPLIED | 27 Mar 2026 |
| BUG-06 | Wave 2 audit: Header user menu aria-label hardcoded English | `aria-label="User menu"` not using t() | Replaced with aria-label={t('header.userMenu')}. Added header.userMenu key to both translation files. | `Header.jsx`, `en/translation.json`, `ar/translation.json` | ✅ APPLIED | 27 Mar 2026 |
| BUG-07 | Wave 2 audit: DashboardPage RTL class violations | ml-3 (×2), text-right (×1), border-l-4 (×1) used — not RTL-safe | Replaced with ms-3, text-end, border-s-4 respectively. | `DashboardPage.jsx` | ✅ APPLIED | 27 Mar 2026 |
| BUG-08 | Wave 2 audit: LoginPage RTL class violation | pr-11 on password input not RTL-safe | Replaced with pe-11. | `LoginPage.jsx` | ✅ APPLIED | 27 Mar 2026 |
| BUG-10 | Wave 3 audit: TransfersPage StatusBadge maps "completed" to "active" (green) | StatusBadge was passed status="active" for completed transfers, rendering green (ongoing) instead of blue (finished) | Changed mapping to pass status="completed" directly, which renders blue via .status-completed CSS class | `TransfersPage.jsx` (2 occurrences) | ✅ APPLIED | 28 Mar 2026 |
| BUG-09 | Wave 2 final fix: Currency read pattern inconsistency | DashboardPage used useOrgStore((s) => s.currency) directly instead of useOrg() hook. ProductsPage used useOrg() but without \|\| 'JOD' fallback. | Both pages now use: const { currency: rawCurrency } = useOrg(); const currency = rawCurrency \|\| 'JOD'; | `DashboardPage.jsx`, `ProductsPage.jsx` | ✅ APPLIED | 27 Mar 2026 |

---

## SECTION 8 — OPEN ISSUES

### 8.1 Issue Summary

**6 open issues — CRITICAL:0 | HIGH:0 | MEDIUM:0 | LOW:6**
(Wave 3 complete and fully audited — BUG-10 found and fixed. No new issues introduced.)

*Resolved in Wave 2 audit: Sidebar aria-label (was #1 → BUG-05), duplicate tailwind config (was #7), empty variants dir (was #9), unused App.css (was #11).*
*Resolved in Wave 3 testing: Issues #1–3 (untested backend flows) — all Postman-verified 27 Mar 2026.*
*BUG-10 found and fixed in Wave 3 audit (28 Mar 2026): TransfersPage StatusBadge "completed" mapped to wrong colour.*

### 8.2 Full Issue Table

| # | Priority | Title | Description | File(s) | Mitigation |
|---|----------|-------|-------------|---------|------------|
| 1 | RESOLVED | Payment recording flow untested | Payment endpoint group not smoke-tested end-to-end in Postman | `payments.controller.js` | Fully tested 27 Mar 2026. All payment endpoints verified. Key findings documented in new Section 11.4. |
| 2 | RESOLVED | Returns flow untested | Returns endpoint group not smoke-tested end-to-end in Postman | `returns.controller.js` | Fully tested 27 Mar 2026. All returns endpoints verified. Key findings documented in new Section 11.4. |
| 3 | RESOLVED | Stock transfer flow untested | Transfer endpoint group not fully smoke-tested in Postman | `transfers.controller.js` | Fully tested 27 Mar 2026. All transfer endpoints verified. Key findings documented in new Section 11.4. |
| 4 | LOW | ErrorBoundary hardcoded strings | "Something went wrong", "Please refresh the page...", "Refresh page" are hardcoded English | `ErrorBoundary.jsx` | Confirmed deferred — class component cannot use hooks. Requires react-error-boundary HOC conversion. LOW priority. |
| 5 | LOW | Placeholder pages hardcoded titles | 9 remaining Wave 4 placeholder pages have hardcoded titles | Wave 4 placeholders | Resolves automatically as each page is built in Wave 4. |
| 6 | LOW | constants.js hardcoded labels | LOCATION_TYPES and ORDER_CHANNELS labels are hardcoded English | `constants.js` | Wave 4 plan: Option B — define translated array INSIDE component function. See RULE-33. |
| 7 | LOW | Vite chunk size warning | Build produces `index.js` ~542 KB. Warning only, not error. Could split recharts into manual chunk. | Frontend bundle | Optimise in a future pass. |
| 8 | LOW | Unused package | `i18next-browser-languagedetector` installed in `package.json` but never imported | `frontend/package.json` | Remove in next dependency cleanup. |
| 9 | LOW | Unused shadcn toast components | `@radix-ui/react-toast`, `toast.jsx`, `toaster.jsx` exist — app uses `react-hot-toast` instead | `src/components/ui/toast.jsx`, `toaster.jsx` | Remove if not planned for use. |

### 8.3 Wave 4 Blockers

**No code-level blockers.** All 6 open issues are LOW priority and deferred. The only
prerequisite before writing Wave 4 build prompts is completing Postman verification
of the 19 unverified API shapes listed in Section 13.1.

---

## SECTION 9 — AI CODING RULES

Every rule is non-negotiable. Violating any rule will introduce bugs.

---

**RULE-01: [API] Never add Authorization header manually**
Detail: The axios interceptor in `api.js` injects `Bearer ${token}` automatically on every request. Adding it manually causes duplicate headers or overwrites.
Why: Double-auth headers break the request or expose tokens in unexpected ways.

**RULE-02: [API] Always parseFloat() monetary values**
Detail: PostgreSQL NUMERIC(12,2) returns strings (`"1500.00"`). Always `parseFloat(value)` before passing to `formatCurrency()` or doing arithmetic.
Why: String arithmetic produces concatenation ("1500.00" + "200.00" = "1500.00200.00") instead of math.

**RULE-03: [API] Response is already unwrapped by interceptor**
Detail: The response interceptor returns `response.data`. Callers receive `{ success, data, message }` directly — NOT the raw axios response.
Why: Accessing `response.data.data` (double unwrap) returns undefined.

**RULE-04: [API] Login response shape**
Detail: After interceptor unwrap, token and user are at `result.data.token` and `result.data.user`:
```javascript
const result = await authApi.login(email, password);
const token = result?.data?.token;
const user  = result?.data?.user;
```
Why: The login endpoint wraps both token and user inside the `data` field. Accessing `result.token` returns undefined.

**RULE-05: [Query] Always use select to unwrap response data**
Detail: Every `useQuery` must include `select: (result) => result.data` (or `result.data ?? []` for arrays).
Why: Without select, the component receives the full `{ success, data, message }` wrapper instead of the actual data.

**RULE-06: [Query] Include all params in queryKey array**
Detail: Query keys must include every parameter that changes the query result: `['module', 'entity', { from, to, page, filter }]`.
Why: React Query caches by key. Missing params means stale data is shown when params change.

**RULE-07: [i18n] All user-visible strings must use t()**
Detail: Every string rendered in JSX that a user sees must go through `t('key.path')`. This includes: labels, titles, placeholders, error messages, toast messages, aria-labels.
Why: Hardcoded strings don't translate when the user switches to Arabic.

**RULE-08: [i18n] Translated arrays inside component only**
Detail: Any array or object that contains translated strings (e.g., PERIODS, filter options) must be defined INSIDE the component function, not at module level.
```javascript
// WRONG — at module level, t() runs once at import time
const PERIODS = [{ key: 'today', label: t('dashboard.periods.today') }];

// RIGHT — inside component, t() re-runs on language change
function DashboardPage() {
  const { t } = useTranslation();
  const PERIODS = [{ key: 'today', label: t('dashboard.periods.today') }];
```
Why: Module-level code runs once at import time. When the language changes, the labels don't update.

**RULE-09: [i18n] Never add flag to SUPPORTED_LANGUAGES**
Detail: The `SUPPORTED_LANGUAGES` array must only contain `{ code, label, dir }`. No `flag` field. No emoji flags anywhere in the app.
Why: BUG-03 was caused by flag emojis. This is a deliberate design decision.

**RULE-10: [i18n] Always update both translation files**
Detail: Every new i18n key must be added to both `en/translation.json` and `ar/translation.json` in the same operation. Structural parity is mandatory.
Why: Missing keys cause the raw key path to render as visible text (e.g., "categories.title" instead of "الفئات").

**RULE-11: [RTL] Use end-*/start-* not right-*/left-***
Detail: For absolute/fixed positioning, use Tailwind logical properties: `end-0` not `right-0`, `start-0` not `left-0`, `ms-*` not `ml-*`, `me-*` not `mr-*`.
Why: `right-*` doesn't flip in RTL mode. Elements appear on the wrong side in Arabic.

**RULE-12: [Date] Append T00:00:00 to date strings**
Detail: When converting a date-only string (e.g., "2026-03-07") to a Date object, always append `'T00:00:00'`:
```javascript
new Date(dateString + 'T00:00:00')
```
Why: Without the time component, `new Date("2026-03-07")` is parsed as UTC midnight, which shifts to the previous day in UTC+3 (Jordan).

**RULE-13: [Layout] Each page owns its page-container wrapper**
Detail: `AppLayout` renders `<main className="flex-1 overflow-y-auto"><Outlet /></main>`. It does NOT wrap `<Outlet>` in `page-container`. Each page component must include its own `<div className="page-container">` as the root element.
Why: Confirmed from actual AppLayout.jsx source. Pages that omit `page-container` will have no padding or spacing.

**RULE-14: [Layout] Use bcc-card not custom card styles**
Detail: All card containers must use `className="bcc-card"`. Do not create custom card styles with inline borders/shadows/padding.
Why: Ensures consistent appearance across light/dark themes and all pages.

**RULE-15: [State] User field is organization_id**
Detail: The user object from the backend has the field `organization_id` — confirmed from authStore.js JSDoc.
Why: Using `org_id` returns undefined.

**RULE-16: [State] Currency from orgStore with fallback** *(superseded by RULE-21)*
Detail: Use `useOrg()` hook (not `useOrgStore` directly) — see RULE-21 for the confirmed pattern.
`const { currency: rawCurrency } = useOrg(); const currency = rawCurrency || 'JOD';`
Why: BUG-09 corrected this. RULE-21 is the authoritative pattern.

**RULE-17: [Build] Run npm run build from frontend/ directory**
Detail: Always verify with `npm run build` from the `frontend/` directory after every change. Zero errors required. Warnings are acceptable.
Why: Build catches import errors, type issues, and dead code that dev mode silently ignores.

**RULE-18: [Windows] PowerShell — no && chaining**
Detail: The development environment is Windows PowerShell. Use separate commands or semicolons, not `&&`.
Why: `&&` is not supported in PowerShell and will fail silently or error.

**RULE-19: [Forms] Validation schema at module level**
Detail: Zod validation schemas should be defined at module level (outside the component function). They are NOT translated objects — they use i18n key strings as error messages, which are resolved later by `t()`.
```javascript
// This is FINE at module level:
const schema = z.object({
  name: z.string().min(1, 'categories.errors.nameRequired'),
});
// The key string is passed through t() when displayed:
{errors.name && <p className="field-error">{t(errors.name.message)}</p>}
```
Why: Only arrays/objects with resolved translated text need to be inside the component. Zod schemas with key strings are safe at module level.

**RULE-20: [Pattern] DashboardPage.jsx is the gold standard**
Detail: For any uncertainty about page structure, loading states, error handling, query patterns, skeleton components, or empty states — follow DashboardPage.jsx exactly.
Why: It is the only fully-built page (besides LoginPage) and establishes all patterns confirmed by the user.

**RULE-21: [State] Use useOrg() hook for currency — never useOrgStore directly**
Detail: All page components that display monetary values must read currency via:
```javascript
import { useOrg } from '@/hooks/useOrg';
const { currency: rawCurrency } = useOrg();
const currency = rawCurrency || 'JOD';
```
Never use `useOrgStore((s) => s.currency)` directly in page components.
Why: Direct store access bypasses the established hook abstraction. The `|| 'JOD'` fallback protects against store default changes. Confirmed fix: DashboardPage and ProductsPage both updated — BUG-09.

**RULE-22: [API] Use cleanParams for optional filter endpoints**
Detail: Any API module function that accepts optional filter parameters must strip undefined, null, and empty-string values before sending:
```javascript
const cleanParams = Object.fromEntries(
  Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  )
);
return api.get('/endpoint', { params: cleanParams });
```
Why: Axios serialises undefined values as the literal string "undefined" in the query string, which the backend silently ignores — producing wrong filter results with no error. Established in: products.js and stock.js (Wave 2).

**RULE-23: [Pattern] Shared components are built once and reused**
Detail: The 5 shared components built in Wave 2 Prompt 1 are the standard building blocks for all future pages: ConfirmModal (all delete confirmations), DataTable (all tables with loading/empty/error/pagination), PageHeader (all page title rows), SearchInput (all debounced search fields), StatusBadge (all status indicators). Never recreate these patterns inline in a page component.
Why: Consistency across all pages, single source of truth for patterns.

### 4.X Shared Component Interfaces (confirmed from source — v4.4 audit)

**DataTable column definition format (authoritative):**
```javascript
{ key: 'fieldName', header: t('ns.headerLabel'), render: (row) => <span>{row.fieldName}</span>, className?: 'text-end w-24' }
```
- `key`: unique string identifier (used as React key)
- `header`: translated column header string
- `render`: function receiving the full row data object directly — `(row) => JSX`
- `className`: optional extra class on both `<th>` and `<td>`
- Pagination prop shape: `{ page: number, limit: number, total: number, onPageChange: (newPage) => void }`
- emptyIcon: component reference (e.g. `ArrowLeftRight`) — no JSX brackets

**StatusBadge props and colour mapping (authoritative):**
Props: `{ status: string, label: string }` — renders `<span className="status-${status} ...">{label}</span>`
Complete mapping from index.css:
| status prop | CSS class | Colour | Use for |
|---|---|---|---|
| `active` | `.status-active` | green | Active products, received POs |
| `inactive` | `.status-inactive` | grey | Inactive products, draft POs |
| `pending` | `.status-pending` | amber | Pending orders, submitted POs |
| `cancelled` | `.status-cancelled` | red | Cancelled anything |
| `completed` | `.status-completed` | blue | Completed transfers, done operations |
| `confirmed` | `.status-confirmed` | purple | (not currently used — transfers use "completed") |
| `shipped` | `.status-shipped` | indigo | Shipped sales orders |
| `delivered` | `.status-delivered` | green | Delivered sales orders |

**SearchInput onChange type:** Receives the string value directly — NOT a DOM event.
`onChange(inputValue)` — parent writes: `onChange={setSearch}` not `onChange={(e) => setSearch(e.target.value)}`
300ms debounce built in.

**ConfirmModal props:** `isOpen`, `onClose`, `onConfirm`, `title`, `message`, `confirmLabel?` (defaults to t('common.delete')), `isLoading` (default false). Confirm button is always variant="destructive". No auto-close — caller controls via mutation onSuccess.

**PageHeader props:** `title` (required), `subtitle` (optional), `action` (optional JSX).

**Sidebar role guard function** (confirmed from Sidebar.jsx):
```javascript
function canSee(userRole, minRole) {
  return (ROLE_HIERARCHY[userRole] ?? -1) >= (ROLE_HIERARCHY[minRole] ?? 999);
}
// Admin items: minRole 'admin'. Staff items: minRole 'staff'.
```

**Wave 4 page access guard patterns:**
```javascript
// Admin-only (Organization, Branches, Locations, Users, AuditLog):
const { isAdmin } = useAuth();
if (!isAdmin) return <Navigate to="/dashboard" replace />;

// Staff+ (Expenses, Reports):
const { isStaff } = useAuth();
if (!isStaff) return <Navigate to="/dashboard" replace />;

// Profile, ChangePassword: no guard — AppLayout already enforces auth
```

**utils.js — all confirmed named exports:**
`cn()`, `formatDate()`, `formatCurrency()`, `formatNumber()`,
`truncate()`, `getInitials()`, `getErrorMessage()`

**dashboard.js report param convention** (confirmed from source):
All /api/reports/* endpoints accept optional `from` and `to` params.
Passed as: `api.get('/reports/endpoint', { params: { from, to } })`
No cleanParams used. Wave 4 report endpoints follow the same convention.

**RULE-24: [API] Stock quantity field is `stock_on_hand`**
Detail: The stock endpoint (`GET /api/stock`) returns the quantity field as `stock_on_hand` — never `quantity_on_hand`. Any page or component accessing stock quantities must use `row.stock_on_hand`.
Why: The brain previously used `quantity_on_hand` in some places. The confirmed field name from Postman testing is `stock_on_hand`. The StockPage.jsx in Wave 2 must also be checked and corrected if needed. Confirmed: 27 Mar 2026.

**RULE-25: [API] Payments list has no pagination**
Detail: `GET /api/payments/order/:orderId` returns a plain array with no pagination object. Always use the simple select shape: `select: (result) => result.data ?? []`. Never access `result.pagination` on this endpoint — it does not exist and will return undefined silently.
Why: This endpoint is scoped to a single order — the list is bounded by the order total so no pagination is needed. Unlike all other list endpoints, it does not return a `{ data, pagination }` shape. Confirmed: 27 Mar 2026.

**RULE-26: [API] OVERPAYMENT error requires specific handling**
Detail: `POST /api/payments/order/:orderId` enforces overpayment prevention. When the payment amount exceeds the remaining balance, the backend returns: `{ "success": false, "error": "OVERPAYMENT", "message": "Payment exceeds order total. Remaining balance: X.XX" }`. The frontend payment form must catch this specific error code and display the remaining balance from the message to the user — not a generic error.
Why: This is intentional business logic. The user needs to know the exact remaining balance to correct their input. A generic "something went wrong" message is not acceptable here. Confirmed: 27 Mar 2026.

**RULE-27: [API] Return reasons field name is `reason`**
Detail: `GET /api/returns/reasons` returns objects where the reason text is in a field named `reason` — not `name`, `label`, or `title`. Shape: `{ "id": "uuid", "reason": "Customer changed mind", "created_at": "..." }`. In dropdown option rendering, use `{r.reason}` not `{r.name}`.
Why: Using the wrong field name renders blank option labels in the returns form with no build error or console warning. Confirmed: 27 Mar 2026.

**RULE-28: [API] Transfer confirm sets status to "completed" not "confirmed"**
Detail: When `POST /api/transfers/:id/confirm` succeeds, the transfer status becomes `"completed"` — NOT `"confirmed"`. The status flow is: `pending` → `completed` (via confirm action) or `cancelled` (via cancel). All status badge mappings, filter tabs, and status checks must use `"completed"` for confirmed transfers.
Why: Displaying or filtering by `"confirmed"` would produce no matches. Confirmed: 27 Mar 2026.

**RULE-29: [Wave 4] Admin-only page access guard**
Detail: Pages restricted to admin+ must include at the top of the component body:
`const { isAdmin } = useAuth(); if (!isAdmin) return <Navigate to="/dashboard" replace />;`
Applies to: Organization, Branches, Locations, Users, AuditLog.
Why: Prevents non-admin users from accessing settings pages via direct URL.

**RULE-30: [Wave 4] Staff+ page access guard**
Detail: Pages restricted to staff+ must include:
`const { isStaff } = useAuth(); if (!isStaff) return <Navigate to="/dashboard" replace />;`
Applies to: Expenses, Reports. Profile/ChangePassword require no guard.
Why: Readonly users must not access operational finance pages.

**RULE-31: [Wave 4] locations.js must be EXTENDED not replaced**
Detail: Wave 4 adds fetchLocation, createLocation, updateLocation, deleteLocation. The existing fetchLocations must remain COMPLETELY UNCHANGED. PurchaseOrdersPage and TransfersPage both import it.
Why: Replacing or modifying fetchLocations silently breaks location dropdowns in two Wave 3 pages.

**RULE-32: [Wave 4] Broad queryKey invalidation after Location mutations**
Detail: After any Location mutation: `queryClient.invalidateQueries({ queryKey: ['locations'] })`. This refreshes LocationsPage AND the Wave 3 dropdowns.
Why: The narrow key ['locations', 'list'] would leave Wave 3 dropdowns stale.

**RULE-33: [Wave 4] LOCATION_TYPES translated array inside component**
Detail: Define translated options INSIDE the component function:
```javascript
const LOCATION_TYPE_OPTIONS = [
  { value: 'warehouse', label: t('locations.typeWarehouse') },
  { value: 'store', label: t('locations.typeStore') },
];
```
Do NOT modify constants.js. Do NOT use LOCATION_TYPES[n].label directly.
Why: Labels must re-evaluate on language change — module-level arrays with t() do not.

---

## SECTION 10 — TEST CREDENTIALS & REFERENCE DATA

### 10.1 Test Login

| Field | Value |
|-------|-------|
| Email | ashraf@testbusiness.com |
| Password | TestPass123 |
| Role | owner |

### 10.2 Test Organization

| Field | Value |
|-------|-------|
| ID | 21fe179d-da3b-4464-93e2-f93de8bfad77 |

### 10.3 Sample Record IDs

| Entity | ID |
|--------|----|
| Sales order | 814f3909-5a8b-461f-9265-ab7a44655d17 |
| Customer | 51ab479d-aedf-4e83-9a2a-55b257b94b65 |
| Product | dcbeeb77-33e2-4361-a486-3229cdfdcc2a |

### 10.4 Postman Quick-Reference

**Login:**
```
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{ "email": "ashraf@testbusiness.com", "password": "TestPass123" }
```

**Authenticated request pattern:**
```
GET http://localhost:3001/api/categories
Authorization: Bearer <token from login response>
```

### 10.5 URLs

| Environment | URL |
|-------------|-----|
| Frontend dev | http://localhost:5173 |
| Backend | http://localhost:3001 |
| Backend health | http://localhost:3001/health |

---

## SECTION 11 — WAVE 3 BUILD PLAN ✅ COMPLETE

### 11.1 Scope

**Wave 3 pages:** Suppliers, Customers, Purchase Orders, Sales Orders, Transfers, Payments, Returns

**Total: 7 pages across 5 prompts — ALL COMPLETE**

**Prerequisites before Wave 3 begins — ALL COMPLETE ✅**
- Brain document updated to v4.0 ✅ 27 Mar 2026
- Brain document updated to v4.1 ✅ 27 Mar 2026
- Payments flow tested in Postman ✅ 27 Mar 2026 — confirmed working
- Returns flow tested in Postman ✅ 27 Mar 2026 — confirmed working
- Transfers flow tested in Postman ✅ 27 Mar 2026 — confirmed working
- See Section 11.4 for all confirmed API response shapes and critical
  frontend implementation notes from testing

### 11.2 Dependency Chain

```
Existing (Wave 2):
  Products    → needed by: Purchase Orders (line items), Sales Orders (line items), Transfers (line items)
  Categories  → needed by: Products (already done)
  Units       → needed by: Products (already done)

Wave 3 builds:
  Suppliers   → needed by: Purchase Orders (supplier dropdown)
  Customers   → needed by: Sales Orders (customer dropdown)
  Locations   → needed by: Transfers (from/to location dropdowns) — endpoint already exists: GET /api/locations

  Purchase Orders → depends on: Suppliers, Products
  Sales Orders    → depends on: Customers, Products
  Transfers       → depends on: Locations (GET /api/locations), Products
  Payments        → depends on: Sales Orders (payments recorded against an order)
  Returns         → depends on: Sales Orders (returns created against an order's items)
```

### 11.3 Build Order and Prompt Split

**Prompt 1 — Suppliers + Customers** ✅ COMPLETE — 28 Mar 2026 — Build: 3,040 modules
Simple contact-management CRUD pages. No Wave 3 dependencies.

Pages: SuppliersPage, CustomersPage
API modules: suppliers.js, customers.js

**Prompt 2 — Purchase Orders** ✅ COMPLETE — 28 Mar 2026 — Build: 3,042 modules
Most complex form in the app. Multi-line-item entry with useFieldArray.
Also created locations.js API module in this prompt.

Pages: PurchaseOrdersPage
API modules: purchaseOrders.js, locations.js
Status flow: draft → submitted → partially_received → received → cancelled

**Prompt 3 — Sales Orders** ✅ COMPLETE — 28 Mar 2026 — Build: 3,043 modules
List + inline detail with dual filter (status tabs + channel dropdown).
Payment summary shown read-only — Record Payment deferred to Prompt 5.

Pages: SalesOrdersPage
API modules: salesOrders.js
Status flow: pending → processing → shipped → delivered → cancelled

**Prompt 4 — Transfers** ✅ COMPLETE — 28 Mar 2026 — Build: 3,044 modules
API modules: transfers.js (fetchTransfers, fetchTransfer, createTransfer, confirmTransfer, cancelTransfer)
Patterns: selectedId inline detail, useFieldArray create modal, confirm/cancel using PATTERN-W3-03
BUG-10: StatusBadge "completed" was mapped to status-active. Fixed to status-completed in audit.
Status flow: pending → completed (via confirm) or cancelled (via cancel)

**Prompt 5 — Payments + Returns** ✅ COMPLETE — 28 Mar 2026 — Build: 3,046 modules
API modules: payments.js, returns.js. Also modified: SalesOrdersPage.jsx (Record Payment + Create Return)
SalesOrdersPage order detail variable: selectedSO (line 109)
Architecture: PaymentsPage uses fetchSalesOrders with client-side derived status (no global /api/payments endpoint).
ReturnsPage: two-step create modal (load order by UUID → select items). returnItems in local state.
WAVE 3 IS COMPLETE. All 7 pages built across 5 prompts. Next: Wave 4.

### 11.4 Confirmed API Response Shapes and Frontend Notes — 27 Mar 2026

All shapes below confirmed by direct Postman testing on 27 Mar 2026.
These are the authoritative reference for Wave 3 builds. Where these
differ from the original spec, the values below are correct.

#### CRITICAL CORRECTIONS FROM TESTING

**Correction 1 — Stock quantity field name:**
The field is `stock_on_hand` — NOT `quantity_on_hand`.
Any existing reference to `quantity_on_hand` in this document is wrong.
All pages displaying stock quantities must access `row.stock_on_hand`.

**Correction 2 — Payments list endpoint has no pagination:**
`GET /api/payments/order/:orderId` returns a plain array with no
pagination object. Use `select: (result) => result.data ?? []`.
Do NOT use the paginated select shape on this endpoint.

**Correction 3 — Transfers confirm sets status to "completed":**
When a transfer is confirmed, the API sets `status: "completed"` —
NOT `status: "confirmed"`. The status flow is:
`pending` → `completed` (on confirm) or `cancelled` (on cancel)

**Correction 4 — Return reasons field name:**
The field containing the reason text is `reason` — NOT `name` or `label`.
Shape: `{ "id": "uuid", "reason": "Customer changed mind", "created_at": "..." }`

**Correction 5 — OVERPAYMENT error from payments endpoint:**
If a payment would exceed the order total, the backend returns a
structured error that the frontend must handle specifically:
`{ "success": false, "error": "OVERPAYMENT", "message": "Payment exceeds order total. Remaining balance: X.XX" }`
The frontend must display the remaining balance from the message — not a
generic error. This is deliberate business logic.

#### Confirmed Response Shapes

**Transfers — create (201):**
Returns transfer header only. No items array in create response.
Fields: `id`, `organization_id`, `from_location_id`, `to_location_id`,
`status` (pending), `note`, `created_by`, `created_at`, `updated_at`
Message: "Transfer created"

**Transfers — confirm (200):**
Same shape as create but `status: "completed"` (NOT "confirmed").
Message: "Transfer confirmed and stock updated"

**Transfers — cancel (200):**
Same shape as create but `status: "cancelled"`.
Message: "Transfer cancelled"

**Transfers — list (200, paginated):**
Each item: `id`, `status`, `note`, `from_location_id`, `to_location_id`,
`from_location_name`, `to_location_name`, `created_by_name`,
`created_at`, `updated_at`

**Payments — record (201):**
Fields: `id`, `organization_id`, `sales_order_id`, `amount` (NUMERIC string),
`method`, `paid_at`, `note`, `created_by`, `created_at`
Note: `created_by_name` NOT included in create response — only in GET.
Message: "Payment recorded"

**Payments — list for order (200):**
Returns plain array — NO pagination object.
Each item adds `created_by_name` to the create fields above.

**Payments — single (200):**
Same as list item shape including `created_by_name`.

**Returns — create (201):**
Fields: `id`, `organization_id`, `sales_order_id`, `reason_id`,
`total_refund_amount` (NUMERIC string), `note`, `created_by`, `created_at`
Note: items array NOT included in create response — only in GET single.
Note: Return creation automatically restores stock at the origin location.
Message: "Return processed and stock restored"

**Returns — single (200):**
All create fields plus: `reason_name`, `created_by_name`,
and `items[]` array. Each item: `id`, `return_id`,
`sales_order_item_id`, `product_id`, `quantity_returned`,
`refund_amount` (NUMERIC string), `product_name`, `variant_name`

**Returns — list (200, paginated):**
Each item: all create fields plus `reason_name`, `created_by_name`.
No items array in the list — only in single GET.

**Sales Orders — single (200, confirmed from testing):**
Header fields include: `customer_name`, `location_name`, `user_name`,
`subtotal`, `discount`, `tax`, `total`, `amount_paid` (all NUMERIC strings)
`items[]`: each has `id`, `product_id`, `quantity`, `price` (NUMERIC string),
`discount` (NUMERIC string), `cost` (NUMERIC string), `product_name`
`payments[]`: each has `id`, `amount`, `method`, `paid_at`, `note`,
`created_by`, `created_at`

**Stock — confirmed field names (GET /api/stock):**
Quantity field is `stock_on_hand` (integer, not string).
Full row shape: `product_id`, `variant_id`, `location_id`,
`product_name`, `sku`, `low_stock_threshold`, `variant_name`,
`location_name`, `branch_name`, `stock_on_hand`

### 11.5 Key API Endpoint Reference for Wave 3

**Suppliers:** GET/POST/PUT/DELETE /api/suppliers, GET /api/suppliers/:id
**Customers:** GET/POST/PUT/DELETE /api/customers, GET /api/customers/:id, POST /api/customers/:id/notes
**Purchase Orders:** GET/POST /api/purchase-orders, GET /api/purchase-orders/:id, PATCH /api/purchase-orders/:id/status, POST /api/purchase-orders/:id/receive
**Sales Orders:** GET/POST /api/sales-orders, GET /api/sales-orders/:id, PATCH /api/sales-orders/:id/status
**Transfers:** GET/POST /api/transfers, GET /api/transfers/:id, POST /api/transfers/:id/confirm, POST /api/transfers/:id/cancel
**Payments:** GET/POST /api/payments/order/:orderId, GET /api/payments/:id
  There is NO global GET /api/payments list endpoint. PaymentsPage uses fetchSalesOrders and derives payment status client-side.
**Returns:** GET /api/returns/reasons, GET/POST /api/returns, GET /api/returns/:id

### 11.6 Shared Patterns (Reuse in Wave 3)

All Wave 3 pages must use: ConfirmModal, DataTable, PageHeader, SearchInput, StatusBadge, useQuery with select, cleanParams in API modules, useOrg() hook for currency, page-container root, RTL-safe classes, t() for all strings, translated arrays inside component function.

### 11.7 Wave 3 Architectural Patterns (established Prompts 1–3)

**PATTERN-W3-01: Inline detail view (selectedId)**
Pages with list + detail views use a single `selectedId` state variable. `null` = list view renders. UUID string = detail view renders. The create modal is rendered OUTSIDE both view conditionals so it persists while open. Established in: PurchaseOrdersPage, SalesOrdersPage. App.jsx is NOT modified — no detail routes needed.

**PATTERN-W3-02: useFieldArray for dynamic line items**
Both PurchaseOrdersPage and SalesOrdersPage use useFieldArray for dynamic order items. The Zod schema covers header fields only — items are validated manually in the submit handler. Items are read with `createForm.getValues('items')` in the submit handler — NOT from the `headerData` argument (which comes from Zod and excludes useFieldArray items).

**PATTERN-W3-03: cancelMutation onSuccess with variables**
Cancel mutations pass the target ID as the mutation argument (not read from state). In TanStack Query v5, onSuccess(data, variables, context): `variables` = what was passed to mutate(). Use `(_, cancelledId)` to access it safely — state may have been cleared before onSuccess fires.

**PATTERN-W3-04: Dual filter (status tabs + channel dropdown)**
SalesOrdersPage uses two independent filter dimensions. Both activeFilter and activeChannel are included in the query key (they change server results). search is NOT in the key (client-side only). The channel dropdown in the list view includes "All Channels" (value=''). The channel dropdown in the create modal filters this out — shows only the 6 real channel values.

**PATTERN-W3-05: SalesOrdersPage payment summary and action buttons (Prompt 5)**
SalesOrdersPage detail view shows Total, Amount Paid, and Remaining Balance. "Record Payment" button visible when balance > 0. "Create Return" button visible when status === 'delivered'. Both modals added in Prompt 5. Remaining shows in text-destructive when > 0; neutral text-foreground when fully paid.

**PATTERN-W3-06: locations.js — list only, must be extended not replaced**
fetchLocations is the only export. Used by PurchaseOrdersPage and TransfersPage. queryKey: ['locations', 'all'] | staleTime: 10 min. Wave 4 P2 ADDS fetchLocation, createLocation, updateLocation, deleteLocation without touching fetchLocations. See RULE-31.

**PATTERN-W3-07: PaymentsPage — payments-oriented sales order view**
No global GET /api/payments endpoint exists. PaymentsPage uses fetchSalesOrders and derives payment status client-side from total and amount_paid. StatusBadge mapping: paid→active (green), partial→pending (amber), unpaid→cancelled (red). Filter tabs operate client-side.

**PATTERN-W3-08: ReturnsPage two-step create modal**
Step 1: user types order UUID, clicks Load Order — fetchSalesOrder(id) called directly (not React Query). Step 2: reason select, note, items table. returnItems in local state (NOT useFieldArray). Items with qty > 0 included in POST. sales_order_item_id = ri.item.id.

### 11.8 Wave 3 Status — COMPLETE ✅

Wave 3 is fully complete. All 7 pages built across 5 prompts. Comprehensive audit conducted.
Build at completion: 3,046 modules, 0 errors. All BUG-01 through BUG-10 confirmed clean.

**Gold-standard pages for pattern reference:**
- `PurchaseOrdersPage.jsx` — selectedId + useFieldArray + workflow mutations (PATTERN-W3-01, W3-02, W3-03)
- `SalesOrdersPage.jsx` — dual filter + payment summary + Record Payment + Create Return (PATTERN-W3-04, W3-05)
- `TransfersPage.jsx` — selectedId + useFieldArray + confirm/cancel with PATTERN-W3-03
- `PaymentsPage.jsx` — client-side derived status from fetched sales orders (PATTERN-W3-07)
- `ReturnsPage.jsx` — two-step create modal with direct async order load (PATTERN-W3-08)

**Shared component interfaces confirmed and documented in Section 4.X.**
**Wave 4 build plan documented in Section 13.**

---

## SECTION 13 — WAVE 4 BUILD PLAN

### 13.1 Postman Verification Checklist — 19 Items

Complete ALL items before writing Wave 4 build prompts.

| # | Endpoint | What to confirm |
|---|----------|-----------------|
| 1 | GET /api/organizations/me | Full field list of the org object |
| 2 | PATCH /api/organizations/me | Accepted body fields; partial or full replacement? |
| 3 | GET /api/branches | Paginated or plain array? Exact fields per branch |
| 4 | POST /api/branches | Required body fields |
| 5 | GET /api/locations/:id | Exact response shape (type, branch_id, is_active, etc.) |
| 6 | POST /api/locations | Required body fields (name, type, branch_id?) |
| 7 | GET /api/users | Paginated? Exact fields per user |
| 8 | POST /api/users | Required fields (name, email, password, role?) |
| 9 | PUT /api/users/:id | Accepted fields — does it exclude password? |
| 10 | GET /api/expenses | Paginated? Fields? Filter params? |
| 11 | GET /api/expenses/categories | Plain array or paginated? Fields? |
| 12 | POST /api/expenses | Required + optional fields |
| 13 | POST /api/expenses/categories | Body fields (just name?) |
| 14 | GET /api/reports/top-products | Response field names per item |
| 15 | GET /api/reports/sales-by-source | Response field names per item |
| 16 | GET /api/reports/expenses-by-category | Response field names per item |
| 17 | GET /api/audit-log | Paginated? Fields? Filter params? |
| 18 | PATCH /api/auth/password | Exact body field names |
| 19 | Profile update | Which endpoint? What body? |

### 13.2 API Shapes Confirmed From Codebase

**GET /api/auth/me** — confirmed from authStore.js: `{ id, name, email, role, organization_id }`
**GET /api/organizations/me** — currency field confirmed from orgStore.js. Full field list: UNVERIFIED.
**GET /api/reports/* params** — confirmed from dashboard.js: optional `from` and `to`.
**GET /api/locations (list)** — fields accessed: id, name. Additional fields: UNVERIFIED.

### 13.3 Wave 4 Scope — 9 Pages, 6 Prompts

| Prompt | Pages | Pattern | New/Extended API Modules |
|--------|-------|---------|--------------------------|
| P1 | OrganizationPage | Single-form edit | organization.js |
| P2 | BranchesPage, LocationsPage, UsersPage | Standard CRUD (admin) | branches.js, users.js + EXTEND locations.js |
| P3 | ExpensesPage | CRUD with category sub-entity | expenses.js |
| P4 | ReportsPage | Multi-panel report dashboard (recharts) | reports.js |
| P5 | AuditLogPage | Read-only paginated list (admin) | auditLog.js |
| P6 | ProfilePage, ChangePasswordPage | Auth self-service forms | profile.js |

### 13.4 locations.js Extension (Wave 4 P2)

Add 4 functions. Do NOT replace the file. fetchLocations() stays untouched.
```javascript
export function fetchLocation(id)        { return api.get(`/locations/${id}`); }
export function createLocation(data)     { return api.post('/locations', data); }
export function updateLocation(id, data) { return api.put(`/locations/${id}`, data); }
export function deleteLocation(id)       { return api.delete(`/locations/${id}`); }
```
After mutations: `queryClient.invalidateQueries({ queryKey: ['locations'] })`

### 13.5 New API Modules

| File | Named exports |
|------|--------------|
| organization.js | fetchOrganization, updateOrganization |
| branches.js | fetchBranches, fetchBranch, createBranch, updateBranch, deleteBranch |
| users.js | fetchUsers, fetchUser, createUser, updateUser, deleteUser |
| expenses.js | fetchExpenses, fetchExpense, createExpense, updateExpense, deleteExpense, fetchExpenseCategories, createExpenseCategory |
| reports.js | fetchTopProducts, fetchSalesBySource, fetchExpensesByCategory |
| auditLog.js | fetchAuditLog |
| profile.js | fetchProfile, changePassword (+ updateProfile once endpoint confirmed) |

### 13.6 Role-Based Access Guards

```javascript
// Admin-only: const { isAdmin } = useAuth(); if (!isAdmin) return <Navigate to="/dashboard" replace />;
// Staff+:     const { isStaff } = useAuth(); if (!isStaff) return <Navigate to="/dashboard" replace />;
// Profile/ChangePassword: no guard — AppLayout handles auth
```

### 13.7 Translation Namespace Plan

Current: 18. Wave 4 adds: organization, branches, locations, users, expenses, reports, auditLog, profile, changePassword. Final: 27.

### 13.8 Wave 4 Session Opener

1. **Brain version:** v4.6
2. **Build baseline:** 3,046 modules, 0 errors
3. **Wave 3:** ✅ COMPLETE — 13 pages
4. **Postman checklist:** Section 13.1 — all 19 items verified before prompts
5. **Critical rules:** RULE-29 (admin guard), RULE-30 (staff guard), RULE-31 (extend locations.js), RULE-32 (broad invalidation), RULE-33 (LOCATION_TYPES translated)
6. **Component interfaces:** Section 4.X — DataTable, StatusBadge, SearchInput
7. **locations.js:** EXTEND ONLY — add 4 functions, never modify fetchLocations
8. **Gold standard CRUD:** SuppliersPage.jsx, CustomersPage.jsx
9. **Gold standard form-only:** OrganizationPage (single-form-edit, no list)

---

## SECTION 12 — UPDATE LOG

| Date | Author | Version | Summary |
|------|--------|---------|---------|
| 09 Mar 2026 | Claude Code | v1.0 | Initial brain document created from full codebase scan |
| 09 Mar 2026 | Claude Code | v2.0 | Full rebuild — all Wave 1 and 1B content documented |
| 09 Mar 2026 | Claude Code | v2.1 | BUG-03 fully applied: flags removed from i18n.js and LoginPage.jsx. BUG-04 applied: right-3 → end-3. HIGH issues resolved. |
| 10 Mar 2026 | Claude Code | v2.2 | FIX-1 (LoginPage features) confirmed already resolved. FIX-2 (toasts) confirmed already resolved. Section 4.3 updated with welcomeBack key. |
| 27 Mar 2026 | Claude Code | v3.0 | Full document rebuild from actual disk state. All 12 sections rewritten. Wave 2 build plan added with per-page specs, shared component definitions, translation keys (EN+AR), and file structure. 22 files read from disk. Build: PASS — 2,968 modules — 0 errors. |
| 27 Mar 2026 | Claude Code | v4.0 | Full Wave 2 completion update. Wave 2 marked complete (4 pages: categories, units, products, stock). 9 new bugs documented and resolved (BUG-05 through BUG-09). Open issues updated: 4 resolved, 9 remaining. 3 new AI coding rules added (RULE-21, RULE-22, RULE-23). Section 11 replaced with Wave 3 build plan (7 pages, 4 prompts, full dependency chain). Build confirmed at 3,038 modules, 0 errors. |
| 27 Mar 2026 | Ashraf + Claude | v4.1 | Post-Postman-testing update. All three Wave 3 backend flows fully verified (Payments, Returns, Transfers). Three untested-flow MEDIUM issues resolved — open issues drop from 9 to 6 (all LOW, zero blockers). New Section 11.4 documents confirmed API response shapes and 5 critical frontend corrections from testing. Five new AI coding rules added (RULE-24 through RULE-28). All Wave 3 prerequisites confirmed complete. |
| 28 Mar 2026 | Ashraf + Claude | v4.2 | Wave 3 Prompts 1–3 complete. 4 pages built: SuppliersPage, CustomersPage, PurchaseOrdersPage, SalesOrdersPage. 5 new API modules created: suppliers.js, customers.js, purchaseOrders.js, salesOrders.js, locations.js. Build baseline updated to 3,043 modules. New architectural patterns documented: selectedId inline detail, useFieldArray, cancelMutation variables pattern, dual filter, payment summary placeholder. Translation namespaces grow from 11 to 15. Wave 3 Prompts 4–5 remain pending. |
| 28 Mar 2026 | Claude Code | v4.3 | Wave 3 Prompt 4 complete. TransfersPage built with selectedId pattern (PATTERN-W3-01), useFieldArray create modal (PATTERN-W3-02), confirm/cancel mutations (PATTERN-W3-03). transfers.js API module created. Translation namespace 16 (transfers, 39 keys) added to both files. Build updated to 3,044 modules. |
| 28 Mar 2026 | Claude Code | v4.4 | Wave 3 Prompts 1–4 comprehensive audit. 1 finding: BUG-10 (TransfersPage StatusBadge mapped "completed" to "active" green instead of "completed" blue — fixed). DataTable, StatusBadge, SearchInput interfaces documented in new Section 4.X. All 6 API modules verified clean. All 5 built pages verified. 16 translation namespaces confirmed with full parity. Bug registry BUG-01 through BUG-09 confirmed clean. Build: 3,044 modules, 0 errors. |
| 28 Mar 2026 | Claude Code | v4.5 | Wave 3 Prompt 5 complete. PaymentsPage (sales-order-based payment view), ReturnsPage (paginated list + two-step create modal), payments.js, returns.js created. Record Payment + Create Return added to SalesOrdersPage detail view with RULE-26 OVERPAYMENT handling. Translation namespaces: payments + returns added (18 total). WAVE 3 COMPLETE. Build: 3,046 modules, 0 errors. |
| 28 Mar 2026 | Ashraf + Claude | v4.6 | Wave 4 pre-build audit and brain consolidation. Full interface confirmation: DataTable, StatusBadge, SearchInput, ConfirmModal, PageHeader. useAuth implementations recorded. ROLES, ROLE_HIERARCHY, LOCATION_TYPES confirmed from constants.js. utils.js 7 exports confirmed. 19 UNVERIFIED API shapes listed in Section 13.1. Wave 4 build plan: 9 pages, 6 prompts, 7 API modules. New rules RULE-29–33 added. Section 4.X expanded with role guards, utils exports, report params. Section 13 (Wave 4 Build Plan) created with Postman checklist, prompt split, locations.js extension plan, and session opener. Build: 3,046 modules, 0 errors. |
