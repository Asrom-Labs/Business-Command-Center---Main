# BCC Frontend — Phase 3 Scaffold Prompt
## Paste this entire prompt into Claude Code

---

```
You are setting up the complete frontend foundation for Business Command Center (BCC), 
a professional multi-tenant SaaS business management platform built by Asrom Labs. 
This is a production-grade application targeting global customers. Every decision you 
make must reflect industry best practices, be fully scalable, and be maintainable by 
a team of developers. Leave zero technical debt in this scaffold. Do not skip any step.

Read every instruction carefully before executing. Execute all steps in exact order.
After every major step, confirm it succeeded before moving to the next.

---

## CONTEXT — WHAT YOU ARE BUILDING

BCC is a business management SaaS dashboard. It is:
- Multi-tenant (each customer = one organization with isolated data)
- Behind a login wall (no public pages, no SEO needed)
- Data-dense: many tables, forms, filters, and modals
- Role-based: 4 roles (readonly, staff, admin, owner) — UI must reflect permissions
- Multi-currency: monetary values displayed based on org's configured currency
- UTC+3 aware: all dates from the API are UTC, must display in Jordan local time
- Backend API base URL: http://localhost:3001/api (all requests go here)
- API always returns: { success, data, message } — data is null on errors
- On any 401 response: clear stored token and redirect to /login immediately
- On any 403 response: show "Insufficient permissions" — do not redirect

The frontend directory must be created at the project root alongside the existing 
backend/ directory, resulting in this top-level structure:

  Business-Command-Center---Main/
  ├── backend/         ← already exists, do not touch
  ├── frontend/        ← YOU ARE CREATING THIS
  └── README.md

---

## STEP 1 — VERIFY NODE.JS IS AVAILABLE

Run:
  node --version
  npm --version

Both must succeed. If either fails, stop and report the error — do not continue.
Node.js 18 or higher is required. Report the exact versions found.

---

## STEP 2 — SCAFFOLD THE REACT + VITE PROJECT

Navigate to the project root (the directory containing backend/) and run:

  npm create vite@latest frontend -- --template react

When prompted interactively, the template "react" is already specified so no 
interaction should be needed. If any prompts appear, select the JavaScript + React 
(not TypeScript) option.

Then enter the project and install base dependencies:
  cd frontend
  npm install

Verify the scaffold succeeded by confirming these files exist:
  frontend/package.json
  frontend/index.html
  frontend/src/main.jsx
  frontend/src/App.jsx
  frontend/vite.config.js

---

## STEP 3 — INSTALL ALL PRODUCTION DEPENDENCIES

Run this single command from inside the frontend/ directory:

  npm install \
    react-router-dom@6 \
    axios \
    @tanstack/react-query@5 \
    @tanstack/react-table@8 \
    zustand \
    react-hook-form \
    @hookform/resolvers \
    zod \
    recharts \
    date-fns \
    clsx \
    tailwind-merge \
    class-variance-authority \
    lucide-react \
    react-hot-toast

Explanation of each dependency (document this understanding):
- react-router-dom: handles all page navigation inside the app
- axios: makes HTTP requests to the backend API
- @tanstack/react-query: manages all server data (fetching, caching, loading states)
- @tanstack/react-table: powers all data tables throughout the app
- zustand: lightweight state management for auth and global UI state
- react-hook-form: manages all form state and submission
- @hookform/resolvers: connects react-hook-form to zod for validation
- zod: defines validation rules for all forms (mirrors backend validation)
- recharts: renders charts on the dashboard and reports pages
- date-fns: formats and manipulates dates (UTC to local time conversion)
- clsx + tailwind-merge: safely combines CSS class names
- class-variance-authority: builds reusable component variants (used by shadcn)
- lucide-react: icon library (thousands of clean icons)
- react-hot-toast: displays success/error notification toasts

---

## STEP 4 — INSTALL DEVELOPMENT DEPENDENCIES

Run:

  npm install -D \
    tailwindcss \
    postcss \
    autoprefixer \
    @types/node \
    eslint \
    eslint-plugin-react \
    eslint-plugin-react-hooks \
    eslint-plugin-react-refresh

Then initialize Tailwind CSS:

  npx tailwindcss init -p

This creates tailwind.config.js and postcss.config.js. Verify both files exist.

---

## STEP 5 — CONFIGURE TAILWIND CSS

Replace the entire contents of tailwind.config.js with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          border: 'hsl(var(--sidebar-border))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

---

## STEP 6 — CONFIGURE VITE

Replace the entire contents of vite.config.js with:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

The path alias '@' means import from '@/components/...' instead of 
'../../components/...' — this is industry standard and prevents broken imports 
as the project grows.

The proxy means the frontend dev server forwards /api requests to the backend 
at port 3001 automatically. This also eliminates CORS issues during development.

---

## STEP 7 — INSTALL AND INITIALIZE SHADCN/UI

shadcn/ui is a component library where components are copied directly into your 
project — you own the code and can customize anything.

Run the initialization:

  npx shadcn@latest init

When prompted, answer:
  - Which style would you like to use? → Default
  - Which color would you like to use as base color? → Slate  
  - Would you like to use CSS variables for colors? → Yes

Then install all components BCC will need. Run this single command:

  npx shadcn@latest add \
    button \
    input \
    label \
    card \
    table \
    badge \
    dialog \
    sheet \
    select \
    textarea \
    toast \
    skeleton \
    dropdown-menu \
    separator \
    avatar \
    alert \
    alert-dialog \
    tabs \
    tooltip \
    popover \
    command \
    scroll-area \
    switch \
    checkbox \
    radio-group \
    form \
    calendar \
    date-picker \
    progress

Confirm that src/components/ui/ now contains the component files.
Confirm that src/lib/utils.js was created by shadcn (it creates a cn() function).

---

## STEP 8 — CREATE THE COMPLETE FOLDER STRUCTURE

Create all directories and placeholder index files. Run these commands:

  mkdir -p src/api
  mkdir -p src/components/shared
  mkdir -p src/components/ui
  mkdir -p src/hooks
  mkdir -p src/layouts
  mkdir -p src/lib
  mkdir -p src/pages/auth
  mkdir -p src/pages/dashboard
  mkdir -p src/pages/organization
  mkdir -p src/pages/branches
  mkdir -p src/pages/locations
  mkdir -p src/pages/users
  mkdir -p src/pages/categories
  mkdir -p src/pages/units
  mkdir -p src/pages/products
  mkdir -p src/pages/variants
  mkdir -p src/pages/suppliers
  mkdir -p src/pages/customers
  mkdir -p src/pages/purchase-orders
  mkdir -p src/pages/sales-orders
  mkdir -p src/pages/payments
  mkdir -p src/pages/returns
  mkdir -p src/pages/transfers
  mkdir -p src/pages/stock
  mkdir -p src/pages/expenses
  mkdir -p src/pages/reports
  mkdir -p src/pages/audit-log
  mkdir -p src/stores

The final src/ structure should look exactly like this:

  src/
  ├── api/                  ← One file per backend module
  ├── components/
  │   ├── shared/           ← Reusable app-level components (DataTable, PageHeader, etc.)
  │   └── ui/               ← shadcn/ui auto-generated components (do not edit directly)
  ├── hooks/                ← Custom React hooks (useAuth, usePagination, etc.)
  ├── layouts/              ← Page layout wrappers (AppLayout, AuthLayout)
  ├── lib/                  ← Utilities, constants, axios instance, query client
  ├── pages/                ← One folder per feature/module
  │   ├── auth/
  │   ├── dashboard/
  │   ├── organization/
  │   ├── branches/
  │   ├── locations/
  │   ├── users/
  │   ├── categories/
  │   ├── units/
  │   ├── products/
  │   ├── variants/
  │   ├── suppliers/
  │   ├── customers/
  │   ├── purchase-orders/
  │   ├── sales-orders/
  │   ├── payments/
  │   ├── returns/
  │   ├── transfers/
  │   ├── stock/
  │   ├── expenses/
  │   ├── reports/
  │   └── audit-log/
  └── stores/               ← Zustand global state stores

---

## STEP 9 — REPLACE src/index.css WITH COMPLETE STYLESHEET

Replace the entire contents of src/index.css with this (includes Google Fonts, 
CSS design tokens, and Tailwind directives):

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* BCC Design System — Light Mode */
    --background: 0 0% 99%;
    --foreground: 222 20% 12%;
    --card: 0 0% 100%;
    --card-foreground: 222 20% 12%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 20% 12%;
    --primary: 221 83% 53%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 14% 96%;
    --secondary-foreground: 222 20% 30%;
    --muted: 220 14% 96%;
    --muted-foreground: 220 9% 46%;
    --accent: 220 14% 93%;
    --accent-foreground: 222 20% 18%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 221 83% 53%;
    --radius: 0.5rem;
    /* Sidebar */
    --sidebar: 222 25% 11%;
    --sidebar-foreground: 220 20% 88%;
    --sidebar-border: 222 20% 18%;
    --sidebar-accent: 222 20% 18%;
    --sidebar-accent-foreground: 0 0% 100%;
    /* Status colors */
    --status-success: 142 71% 45%;
    --status-warning: 38 92% 50%;
    --status-error: 0 84% 60%;
    --status-info: 221 83% 53%;
  }

  .dark {
    --background: 222 25% 9%;
    --foreground: 210 20% 92%;
    --card: 222 25% 11%;
    --card-foreground: 210 20% 92%;
    --popover: 222 25% 11%;
    --popover-foreground: 210 20% 92%;
    --primary: 221 83% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 222 20% 16%;
    --secondary-foreground: 210 20% 80%;
    --muted: 222 20% 16%;
    --muted-foreground: 220 12% 55%;
    --accent: 222 20% 18%;
    --accent-foreground: 210 20% 92%;
    --destructive: 0 63% 55%;
    --destructive-foreground: 0 0% 100%;
    --border: 222 20% 18%;
    --input: 222 20% 18%;
    --ring: 221 83% 60%;
    --sidebar: 222 28% 7%;
    --sidebar-foreground: 220 18% 82%;
    --sidebar-border: 222 22% 14%;
    --sidebar-accent: 222 22% 14%;
    --sidebar-accent-foreground: 0 0% 100%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground font-sans;
    font-feature-settings: "rlig" 1, "calt" 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Custom scrollbar for webkit */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    @apply bg-transparent;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-border rounded-full;
  }
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/50;
  }
}

@layer utilities {
  .status-active {
    @apply bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400;
  }
  .status-inactive {
    @apply bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400;
  }
  .status-pending {
    @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400;
  }
  .status-cancelled {
    @apply bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400;
  }
  .status-completed {
    @apply bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400;
  }
  .status-confirmed {
    @apply bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400;
  }
}
```

---

## STEP 10 — CREATE src/lib/utils.js

If shadcn already created this file, REPLACE it entirely with:

```js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, toZonedTime } from 'date-fns';

/**
 * Merges Tailwind CSS class names safely.
 * Required by shadcn/ui. Used everywhere in the app.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a UTC ISO date string to Jordan local time (Asia/Amman, UTC+3)
 * and returns a formatted string.
 * 
 * @param {string} utcString - ISO 8601 date string from API
 * @param {boolean} includeTime - Whether to include hours and minutes
 * @returns {string} Formatted date string, or '—' if input is falsy
 * 
 * Example: formatDate('2026-03-07T10:00:00Z') → 'Mar 7, 2026'
 * Example: formatDate('2026-03-07T10:00:00Z', true) → 'Mar 7, 2026, 01:00 PM'
 */
export function formatDate(utcString, includeTime = false) {
  if (!utcString) return '—';
  try {
    const date = typeof utcString === 'string' ? parseISO(utcString) : utcString;
    const jordanTime = toZonedTime(date, 'Asia/Amman');
    const fmt = includeTime ? 'MMM d, yyyy, hh:mm a' : 'MMM d, yyyy';
    return format(jordanTime, fmt);
  } catch {
    return '—';
  }
}

/**
 * Formats a monetary value returned from the API.
 * API returns NUMERIC(12,2) as strings — always parse before display.
 * 
 * @param {string|number} value - The monetary value
 * @param {string} currency - ISO 4217 currency code (e.g. 'JOD', 'USD', 'SAR')
 * @returns {string} Formatted currency string, or '—' if value is null/undefined
 * 
 * Example: formatCurrency('1500.00', 'JOD') → 'JOD 1,500.00'
 */
export function formatCurrency(value, currency = 'USD') {
  if (value === null || value === undefined || value === '') return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formats a number with thousands separators.
 * Use for quantities (stock counts, order quantities, etc.)
 */
export function formatNumber(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US').format(Number(value));
}

/**
 * Truncates a string to a given length, appending '...'
 */
export function truncate(str, length = 40) {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '...' : str;
}

/**
 * Returns initials from a full name (for avatar fallbacks)
 * Example: 'Ahmed Al-Khalidi' → 'AK'
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');
}

/**
 * Extracts a human-readable error message from an API error response.
 * Works with both axios errors and the raw API error shape.
 */
export function getErrorMessage(error) {
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred. Please try again.';
}
```

---

## STEP 11 — CREATE src/lib/constants.js

```js
/**
 * BCC Application Constants
 * Central location for all app-wide constants.
 * Never hardcode these values anywhere else in the app.
 */

// API base URL — uses Vite proxy in development, real URL in production
export const API_BASE_URL = '/api';

// Default pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Auth token storage keys
export const TOKEN_KEY = 'bcc_token';
export const USER_KEY = 'bcc_user';

// User roles — must match backend exactly
export const ROLES = {
  READONLY: 'readonly',
  STAFF:    'staff',
  ADMIN:    'admin',
  OWNER:    'owner',
};

// Role hierarchy — higher number = more permissions
export const ROLE_HIERARCHY = {
  readonly: 0,
  staff:    1,
  admin:    2,
  owner:    3,
};

/**
 * Check if a user has at least the required role level.
 * Example: hasMinRole(user, 'admin') returns true for admin and owner.
 */
export function hasMinRole(user, requiredRole) {
  if (!user?.role) return false;
  return (ROLE_HIERARCHY[user.role] ?? -1) >= (ROLE_HIERARCHY[requiredRole] ?? 999);
}

// Purchase order statuses
export const PO_STATUS = {
  DRAFT:     'draft',
  SUBMITTED: 'submitted',
  RECEIVED:  'received',
  CANCELLED: 'cancelled',
};

// Sales order statuses
export const SO_STATUS = {
  PENDING:   'pending',
  CONFIRMED: 'confirmed',
  SHIPPED:   'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Transfer statuses
export const TRANSFER_STATUS = {
  PENDING:   'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

// Stock movement types (for the ledger filter)
export const MOVEMENT_TYPES = [
  'purchase',
  'sale',
  'transfer_in',
  'transfer_out',
  'return',
  'adjustment',
  'cancellation',
];

// Location types
export const LOCATION_TYPES = [
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'store',     label: 'Store' },
];

// Sales order channels
export const ORDER_CHANNELS = [
  { value: 'walk_in',   label: 'Walk-in' },
  { value: 'online',    label: 'Online' },
  { value: 'phone',     label: 'Phone' },
  { value: 'wholesale', label: 'Wholesale' },
];

// Navigation items — used to build the sidebar
// visibleTo = minimum role required to see this item
export const NAV_ITEMS = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard',    path: '/dashboard',    icon: 'LayoutDashboard', visibleTo: 'readonly' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Sales Orders',     path: '/sales-orders',     icon: 'ShoppingCart',  visibleTo: 'staff' },
      { label: 'Purchase Orders',  path: '/purchase-orders',  icon: 'PackageOpen',   visibleTo: 'staff' },
      { label: 'Payments',         path: '/payments',         icon: 'CreditCard',    visibleTo: 'staff' },
      { label: 'Returns',          path: '/returns',          icon: 'Undo2',         visibleTo: 'staff' },
      { label: 'Stock Transfers',  path: '/transfers',        icon: 'ArrowLeftRight',visibleTo: 'staff' },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { label: 'Products',   path: '/products',  icon: 'Box',          visibleTo: 'readonly' },
      { label: 'Stock',      path: '/stock',     icon: 'Warehouse',    visibleTo: 'readonly' },
      { label: 'Suppliers',  path: '/suppliers', icon: 'Truck',        visibleTo: 'readonly' },
    ],
  },
  {
    group: 'Customers',
    items: [
      { label: 'Customers', path: '/customers', icon: 'Users', visibleTo: 'readonly' },
    ],
  },
  {
    group: 'Finance',
    items: [
      { label: 'Expenses',  path: '/expenses', icon: 'Receipt',   visibleTo: 'staff' },
      { label: 'Reports',   path: '/reports',  icon: 'BarChart2', visibleTo: 'staff' },
    ],
  },
  {
    group: 'Settings',
    items: [
      { label: 'Organization', path: '/organization', icon: 'Building2',  visibleTo: 'admin' },
      { label: 'Branches',     path: '/branches',     icon: 'GitBranch',  visibleTo: 'admin' },
      { label: 'Locations',    path: '/locations',    icon: 'MapPin',     visibleTo: 'admin' },
      { label: 'Categories',   path: '/categories',   icon: 'Tag',        visibleTo: 'admin' },
      { label: 'Units',        path: '/units',        icon: 'Ruler',      visibleTo: 'admin' },
      { label: 'Users',        path: '/users',        icon: 'UserCog',    visibleTo: 'admin' },
      { label: 'Audit Log',    path: '/audit-log',    icon: 'ScrollText', visibleTo: 'admin' },
    ],
  },
];
```

---

## STEP 12 — CREATE src/lib/queryClient.js

```js
import { QueryClient } from '@tanstack/react-query';

/**
 * Global TanStack Query client.
 * Controls caching, retry behavior, and stale times app-wide.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cache is kept for 10 minutes after component unmounts
      gcTime: 1000 * 60 * 10,
      // Do not retry on auth/permission/not-found errors
      retry: (failureCount, error) => {
        const status = error?.status ?? error?.response?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
      // Do not refetch just because the user switched browser tabs
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
```

---

## STEP 13 — CREATE src/lib/api.js (Axios Instance)

This is the most critical infrastructure file. All API calls in the entire app 
go through this single instance.

```js
import axios from 'axios';
import { TOKEN_KEY, USER_KEY } from './constants';

/**
 * Central Axios instance for all BCC API requests.
 *
 * Features:
 * - Automatically injects the JWT Bearer token on every request
 * - Automatically handles 401 (token expired / invalid): clears auth and redirects to login
 * - Normalizes error shape so all error handlers receive { message, error, status }
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Runs before every request. Injects the stored JWT as a Bearer token.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Runs after every response. Handles global error cases.
api.interceptors.response.use(
  // Success: return the response data directly (unwrap axios wrapper)
  (response) => response.data,

  // Error: normalize and handle globally
  (error) => {
    const status = error.response?.status;
    const apiData = error.response?.data;

    // 401 Unauthorized — token expired or invalid
    // Clear everything and force the user back to the login page
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Use window.location to force a full navigation (clears React state too)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Build a normalized error object that all parts of the app can rely on
    const normalizedError = {
      status,
      error: apiData?.error || 'UNKNOWN_ERROR',
      message: apiData?.message || error.message || 'An unexpected error occurred.',
      data: apiData?.data ?? null,
    };

    return Promise.reject(normalizedError);
  }
);

export default api;
```

---

## STEP 14 — CREATE ALL API MODULE FILES

Create one file per backend module inside src/api/. 
Each file exports a plain object with functions that call the API.
No logic here — just HTTP calls.

**src/api/auth.js**
```js
import api from '@/lib/api';

export const authApi = {
  login:           (email, password) => api.post('/auth/login', { email, password }),
  register:        (data)            => api.post('/auth/register', data),
  me:              ()                => api.get('/auth/me'),
  changePassword:  (data)            => api.patch('/auth/password', data),
};
```

**src/api/organizations.js**
```js
import api from '@/lib/api';

export const organizationsApi = {
  getMyOrg:   ()     => api.get('/organizations/me'),
  updateMyOrg: (data) => api.patch('/organizations/me', data),
};
```

**src/api/branches.js**
```js
import api from '@/lib/api';

export const branchesApi = {
  list:       (params) => api.get('/branches', { params }),
  getOne:     (id)     => api.get(`/branches/${id}`),
  create:     (data)   => api.post('/branches', data),
  update:     (id, data) => api.patch(`/branches/${id}`, data),
  deactivate: (id)     => api.delete(`/branches/${id}`),
};
```

**src/api/locations.js**
```js
import api from '@/lib/api';

export const locationsApi = {
  list:       (params)   => api.get('/locations', { params }),
  getOne:     (id)       => api.get(`/locations/${id}`),
  create:     (data)     => api.post('/locations', data),
  update:     (id, data) => api.patch(`/locations/${id}`, data),
  deactivate: (id)       => api.delete(`/locations/${id}`),
};
```

**src/api/users.js**
```js
import api from '@/lib/api';

export const usersApi = {
  list:       (params)   => api.get('/users', { params }),
  getOne:     (id)       => api.get(`/users/${id}`),
  invite:     (data)     => api.post('/users/invite', data),
  update:     (id, data) => api.patch(`/users/${id}`, data),
  deactivate: (id)       => api.delete(`/users/${id}`),
};
```

**src/api/categories.js**
```js
import api from '@/lib/api';

export const categoriesApi = {
  list:   (params)   => api.get('/categories', { params }),
  getOne: (id)       => api.get(`/categories/${id}`),
  create: (data)     => api.post('/categories', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
  delete: (id)       => api.delete(`/categories/${id}`),
};
```

**src/api/units.js**
```js
import api from '@/lib/api';

export const unitsApi = {
  list:   (params)   => api.get('/units', { params }),
  getOne: (id)       => api.get(`/units/${id}`),
  create: (data)     => api.post('/units', data),
  update: (id, data) => api.patch(`/units/${id}`, data),
  delete: (id)       => api.delete(`/units/${id}`),
};
```

**src/api/products.js**
```js
import api from '@/lib/api';

export const productsApi = {
  list:       (params)         => api.get('/products', { params }),
  getOne:     (id)             => api.get(`/products/${id}`),
  create:     (data)           => api.post('/products', data),
  update:     (id, data)       => api.patch(`/products/${id}`, data),
  deactivate: (id)             => api.delete(`/products/${id}`),
  // Variants
  listVariants:   (productId, params)       => api.get(`/products/${productId}/variants`, { params }),
  getVariant:     (productId, variantId)    => api.get(`/products/${productId}/variants/${variantId}`),
  createVariant:  (productId, data)         => api.post(`/products/${productId}/variants`, data),
  updateVariant:  (productId, variantId, data) => api.patch(`/products/${productId}/variants/${variantId}`, data),
  deactivateVariant: (productId, variantId) => api.delete(`/products/${productId}/variants/${variantId}`),
};
```

**src/api/suppliers.js**
```js
import api from '@/lib/api';

export const suppliersApi = {
  list:       (params)   => api.get('/suppliers', { params }),
  getOne:     (id)       => api.get(`/suppliers/${id}`),
  create:     (data)     => api.post('/suppliers', data),
  update:     (id, data) => api.patch(`/suppliers/${id}`, data),
  deactivate: (id)       => api.delete(`/suppliers/${id}`),
};
```

**src/api/customers.js**
```js
import api from '@/lib/api';

export const customersApi = {
  list:       (params)   => api.get('/customers', { params }),
  getOne:     (id)       => api.get(`/customers/${id}`),
  create:     (data)     => api.post('/customers', data),
  update:     (id, data) => api.patch(`/customers/${id}`, data),
  deactivate: (id)       => api.delete(`/customers/${id}`),
  addNote:    (id, note) => api.post(`/customers/${id}/notes`, { note }),
  getNotes:   (id)       => api.get(`/customers/${id}/notes`),
};
```

**src/api/purchaseOrders.js**
```js
import api from '@/lib/api';

export const purchaseOrdersApi = {
  list:    (params)          => api.get('/purchase-orders', { params }),
  getOne:  (id)              => api.get(`/purchase-orders/${id}`),
  create:  (data)            => api.post('/purchase-orders', data),
  updateStatus: (id, status) => api.patch(`/purchase-orders/${id}/status`, { status }),
  receive: (id, data)        => api.post(`/purchase-orders/${id}/receive`, data),
};
```

**src/api/salesOrders.js**
```js
import api from '@/lib/api';

export const salesOrdersApi = {
  list:         (params)          => api.get('/sales-orders', { params }),
  getOne:       (id)              => api.get(`/sales-orders/${id}`),
  create:       (data)            => api.post('/sales-orders', data),
  updateStatus: (id, status)      => api.patch(`/sales-orders/${id}/status`, { status }),
};
```

**src/api/payments.js**
```js
import api from '@/lib/api';

export const paymentsApi = {
  list:       (params) => api.get('/payments', { params }),
  getOne:     (id)     => api.get(`/payments/${id}`),
  record:     (data)   => api.post('/payments', data),
};
```

**src/api/returns.js**
```js
import api from '@/lib/api';

export const returnsApi = {
  list:    (params) => api.get('/returns', { params }),
  getOne:  (id)     => api.get(`/returns/${id}`),
  process: (data)   => api.post('/returns', data),
};
```

**src/api/transfers.js**
```js
import api from '@/lib/api';

export const transfersApi = {
  list:    (params)     => api.get('/transfers', { params }),
  getOne:  (id)         => api.get(`/transfers/${id}`),
  create:  (data)       => api.post('/transfers', data),
  confirm: (id)         => api.patch(`/transfers/${id}/confirm`),
  cancel:  (id)         => api.patch(`/transfers/${id}/cancel`),
};
```

**src/api/stock.js**
```js
import api from '@/lib/api';

export const stockApi = {
  list:    (params) => api.get('/stock', { params }),
  summary: ()       => api.get('/stock/summary'),
  ledger:  (params) => api.get('/stock/ledger', { params }),
  adjust:  (data)   => api.post('/stock/adjust', data),
};
```

**src/api/expenses.js**
```js
import api from '@/lib/api';

export const expensesApi = {
  // Categories
  listCategories:   (params)   => api.get('/expenses/categories', { params }),
  getCategory:      (id)       => api.get(`/expenses/categories/${id}`),
  createCategory:   (data)     => api.post('/expenses/categories', data),
  updateCategory:   (id, data) => api.patch(`/expenses/categories/${id}`, data),
  deleteCategory:   (id)       => api.delete(`/expenses/categories/${id}`),
  // Expenses
  list:   (params)   => api.get('/expenses', { params }),
  getOne: (id)       => api.get(`/expenses/${id}`),
  create: (data)     => api.post('/expenses', data),
  update: (id, data) => api.patch(`/expenses/${id}`, data),
  delete: (id)       => api.delete(`/expenses/${id}`),
};
```

**src/api/reports.js**
```js
import api from '@/lib/api';

export const reportsApi = {
  dashboard:          (params) => api.get('/reports/dashboard', { params }),
  salesByDay:         (params) => api.get('/reports/sales-by-day', { params }),
  topProducts:        (params) => api.get('/reports/top-products', { params }),
  salesByChannel:     (params) => api.get('/reports/sales-by-channel', { params }),
  expensesByCategory: (params) => api.get('/reports/expenses-by-category', { params }),
  lowStock:           ()       => api.get('/reports/low-stock'),
};
```

**src/api/auditLog.js**
```js
import api from '@/lib/api';

export const auditLogApi = {
  list: (params) => api.get('/audit-log', { params }),
};
```

---

## STEP 15 — CREATE src/stores/authStore.js

```js
import { create } from 'zustand';
import { TOKEN_KEY, USER_KEY, ROLE_HIERARCHY } from '@/lib/constants';

/**
 * Authentication store.
 * Persists token and user to localStorage for page-refresh survival.
 * All components that need auth state read from this store.
 */

function loadFromStorage() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    const user = raw ? JSON.parse(raw) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export const useAuthStore = create((set, get) => ({
  ...loadFromStorage(),

  /**
   * Called after successful login or registration.
   * Note: The login API response puts the token at response.token (not inside data).
   * The user info is inside response.data.
   */
  login: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },

  /** Called on logout or 401 response */
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },

  /** Update stored user profile (e.g. after name change) */
  updateUser: (updates) => {
    const updated = { ...get().user, ...updates };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    set({ user: updated });
  },

  /** Check if the current user has at least the given role */
  hasRole: (requiredRole) => {
    const user = get().user;
    if (!user?.role) return false;
    return (ROLE_HIERARCHY[user.role] ?? -1) >= (ROLE_HIERARCHY[requiredRole] ?? 999);
  },

  /** Convenience getters */
  isAuthenticated: () => !!get().token,
  isOwner: () => get().user?.role === 'owner',
  isAdmin: () => ['admin', 'owner'].includes(get().user?.role),
  isStaff: () => ['staff', 'admin', 'owner'].includes(get().user?.role),
}));
```

---

## STEP 16 — CREATE src/stores/orgStore.js

```js
import { create } from 'zustand';

/**
 * Organization store.
 * Holds the current organization's data including its currency.
 * Currency is used by formatCurrency() throughout the app.
 */
export const useOrgStore = create((set) => ({
  org: null,
  currency: 'USD', // Default, overwritten after org is loaded

  setOrg: (org) => set({ org, currency: org?.currency || 'USD' }),
  clearOrg: () => set({ org: null, currency: 'USD' }),
}));
```

---

## STEP 17 — CREATE src/hooks/useAuth.js

```js
import { useAuthStore } from '@/stores/authStore';

/**
 * Convenience hook for auth state.
 * Use this in components instead of accessing the store directly.
 * 
 * Usage:
 *   const { user, isAuthenticated, hasRole } = useAuth();
 *   if (!hasRole('admin')) return <AccessDenied />;
 */
export function useAuth() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  const hasRole = useAuthStore((s) => s.hasRole);
  const isOwner = useAuthStore((s) => s.isOwner);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isStaff = useAuthStore((s) => s.isStaff);

  return {
    token,
    user,
    isAuthenticated: !!token,
    login,
    logout,
    updateUser,
    hasRole,
    isOwner: isOwner(),
    isAdmin: isAdmin(),
    isStaff: isStaff(),
  };
}
```

---

## STEP 18 — CREATE src/hooks/useOrg.js

```js
import { useOrgStore } from '@/stores/orgStore';

/**
 * Convenience hook for accessing organization data and currency.
 * 
 * Usage:
 *   const { org, currency } = useOrg();
 *   formatCurrency(amount, currency);  // Always use org currency
 */
export function useOrg() {
  const org = useOrgStore((s) => s.org);
  const currency = useOrgStore((s) => s.currency);
  const setOrg = useOrgStore((s) => s.setOrg);
  const clearOrg = useOrgStore((s) => s.clearOrg);

  return { org, currency, setOrg, clearOrg };
}
```

---

## STEP 19 — CREATE PLACEHOLDER LAYOUT FILES

**src/layouts/AuthLayout.jsx**
```jsx
/**
 * AuthLayout — wraps the login and registration pages.
 * Full-screen centered layout with no sidebar.
 */
export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
```

**src/layouts/AppLayout.jsx**
```jsx
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * AppLayout — the main authenticated app shell.
 * Includes the sidebar navigation, top header, and content area.
 * Redirects to /login if the user is not authenticated.
 * 
 * TODO: Replace placeholder div with full sidebar + header in Wave 1.
 */
export function AppLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar placeholder — will be replaced in Wave 1 */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 flex items-center justify-center">
        <p className="text-sm text-sidebar-foreground/50">Sidebar coming in Wave 1</p>
      </aside>
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

---

## STEP 20 — CREATE PLACEHOLDER PAGE FILES

Create a minimal placeholder for every page so routing works immediately.
Use this exact pattern for each file, changing only the name and title:

**src/pages/auth/LoginPage.jsx**
```jsx
export default function LoginPage() {
  return <div className="p-8"><h1 className="text-2xl font-semibold">Login — Coming in Wave 1</h1></div>;
}
```

Create these files with the same pattern (just change the function name and title text):
- src/pages/dashboard/DashboardPage.jsx        → "Dashboard"
- src/pages/organization/OrganizationPage.jsx  → "Organization Settings"
- src/pages/branches/BranchesPage.jsx          → "Branches"
- src/pages/locations/LocationsPage.jsx        → "Locations"
- src/pages/users/UsersPage.jsx                → "Users"
- src/pages/categories/CategoriesPage.jsx      → "Categories"
- src/pages/units/UnitsPage.jsx                → "Units"
- src/pages/products/ProductsPage.jsx          → "Products"
- src/pages/suppliers/SuppliersPage.jsx        → "Suppliers"
- src/pages/customers/CustomersPage.jsx        → "Customers"
- src/pages/purchase-orders/PurchaseOrdersPage.jsx → "Purchase Orders"
- src/pages/sales-orders/SalesOrdersPage.jsx   → "Sales Orders"
- src/pages/payments/PaymentsPage.jsx          → "Payments"
- src/pages/returns/ReturnsPage.jsx            → "Returns"
- src/pages/transfers/TransfersPage.jsx        → "Stock Transfers"
- src/pages/stock/StockPage.jsx                → "Stock"
- src/pages/expenses/ExpensesPage.jsx          → "Expenses"
- src/pages/reports/ReportsPage.jsx            → "Reports"
- src/pages/audit-log/AuditLogPage.jsx         → "Audit Log"

---

## STEP 21 — CREATE THE COMPLETE ROUTER (src/App.jsx)

Replace the entire contents of src/App.jsx with:

```jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';

// App pages
import DashboardPage       from '@/pages/dashboard/DashboardPage';
import OrganizationPage    from '@/pages/organization/OrganizationPage';
import BranchesPage        from '@/pages/branches/BranchesPage';
import LocationsPage       from '@/pages/locations/LocationsPage';
import UsersPage           from '@/pages/users/UsersPage';
import CategoriesPage      from '@/pages/categories/CategoriesPage';
import UnitsPage           from '@/pages/units/UnitsPage';
import ProductsPage        from '@/pages/products/ProductsPage';
import SuppliersPage       from '@/pages/suppliers/SuppliersPage';
import CustomersPage       from '@/pages/customers/CustomersPage';
import PurchaseOrdersPage  from '@/pages/purchase-orders/PurchaseOrdersPage';
import SalesOrdersPage     from '@/pages/sales-orders/SalesOrdersPage';
import PaymentsPage        from '@/pages/payments/PaymentsPage';
import ReturnsPage         from '@/pages/returns/ReturnsPage';
import TransfersPage       from '@/pages/transfers/TransfersPage';
import StockPage           from '@/pages/stock/StockPage';
import ExpensesPage        from '@/pages/expenses/ExpensesPage';
import ReportsPage         from '@/pages/reports/ReportsPage';
import AuditLogPage        from '@/pages/audit-log/AuditLogPage';

export default function App() {
  return (
    <>
      {/* Global toast notification system */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '8px',
            fontSize: '14px',
          },
        }}
      />

      <Routes>
        {/* ── Public routes (no login required) ── */}
        <Route element={<AuthLayout><LoginPage /></AuthLayout>} path="/login" />

        {/* ── Protected routes (login required) ── */}
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"       element={<DashboardPage />} />
          <Route path="/organization"    element={<OrganizationPage />} />
          <Route path="/branches"        element={<BranchesPage />} />
          <Route path="/locations"       element={<LocationsPage />} />
          <Route path="/users"           element={<UsersPage />} />
          <Route path="/categories"      element={<CategoriesPage />} />
          <Route path="/units"           element={<UnitsPage />} />
          <Route path="/products"        element={<ProductsPage />} />
          <Route path="/suppliers"       element={<SuppliersPage />} />
          <Route path="/customers"       element={<CustomersPage />} />
          <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="/sales-orders"    element={<SalesOrdersPage />} />
          <Route path="/payments"        element={<PaymentsPage />} />
          <Route path="/returns"         element={<ReturnsPage />} />
          <Route path="/transfers"       element={<TransfersPage />} />
          <Route path="/stock"           element={<StockPage />} />
          <Route path="/expenses"        element={<ExpensesPage />} />
          <Route path="/reports"         element={<ReportsPage />} />
          <Route path="/audit-log"       element={<AuditLogPage />} />
          {/* Catch-all: redirect unknown paths to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </>
  );
}
```

---

## STEP 22 — UPDATE src/main.jsx

Replace the entire contents of src/main.jsx with:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* TanStack Query: provides server-state management to the whole app */}
    <QueryClientProvider client={queryClient}>
      {/* BrowserRouter: enables client-side routing */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

---

## STEP 23 — CREATE THE .env FILE

Create a file named exactly `.env` (with the dot, no extension) in the 
frontend/ directory:

```
# BCC Frontend Environment Variables
# This file is for LOCAL DEVELOPMENT only.
# Never commit this file to git.

VITE_APP_NAME=Business Command Center
VITE_APP_VERSION=1.0.0
VITE_API_URL=http://localhost:3001
```

Important note: With the Vite proxy configured in vite.config.js (Step 6), 
all /api requests are forwarded to the backend automatically during development.
The VITE_API_URL variable is available if needed but the proxy handles routing.

---

## STEP 24 — CREATE .gitignore ADDITIONS

Add these lines to frontend/.gitignore (create it if it doesn't exist, 
or append to the existing Vite-generated one):

```
# Environment variables
.env
.env.local
.env.production

# Build output
dist/

# Dependencies
node_modules/

# Editor
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

---

## STEP 25 — CREATE ESLint CONFIGURATION

Create frontend/.eslintrc.cjs:

```js
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'react/prop-types': 'off',         // We use JSDoc and zod instead
    'no-unused-vars': 'warn',
    'no-console': 'warn',
  },
};
```

---

## STEP 26 — VERIFY THE COMPLETE FILE TREE

Run this command and report the full output:

  find src -type f | sort

The output must include at minimum:
  src/App.jsx
  src/main.jsx
  src/index.css
  src/api/auth.js
  src/api/organizations.js
  src/api/branches.js
  src/api/locations.js
  src/api/users.js
  src/api/categories.js
  src/api/units.js
  src/api/products.js
  src/api/suppliers.js
  src/api/customers.js
  src/api/purchaseOrders.js
  src/api/salesOrders.js
  src/api/payments.js
  src/api/returns.js
  src/api/transfers.js
  src/api/stock.js
  src/api/expenses.js
  src/api/reports.js
  src/api/auditLog.js
  src/components/ui/   (multiple files from shadcn)
  src/hooks/useAuth.js
  src/hooks/useOrg.js
  src/layouts/AppLayout.jsx
  src/layouts/AuthLayout.jsx
  src/lib/api.js
  src/lib/constants.js
  src/lib/queryClient.js
  src/lib/utils.js
  src/pages/auth/LoginPage.jsx
  src/pages/dashboard/DashboardPage.jsx
  [... all other page files ...]
  src/stores/authStore.js
  src/stores/orgStore.js

---

## STEP 27 — RUN THE DEVELOPMENT SERVER

Run:
  npm run dev

Wait for the output to show:
  ➜  Local:   http://localhost:5173/

Then confirm:
1. No compilation errors appear in the terminal
2. The browser shows a page at http://localhost:5173 (even if it's just a placeholder)
3. Navigating to http://localhost:5173/login shows the login placeholder
4. Navigating to http://localhost:5173/dashboard redirects to /login 
   (because no token is stored yet — this is correct behavior)

---

## STEP 28 — FINAL CHECKLIST

Before reporting success, verify every item:

[ ] React + Vite project created in frontend/ directory
[ ] All npm packages installed (no peer dependency errors)
[ ] Tailwind CSS configured with dark mode support
[ ] shadcn/ui initialized with Slate base color and CSS variables
[ ] All shadcn components installed in src/components/ui/
[ ] Vite proxy configured to forward /api to port 3001
[ ] @ path alias works (configured in vite.config.js)
[ ] src/lib/api.js exists with JWT injection and 401 auto-redirect
[ ] src/lib/constants.js exists with all constants, roles, nav items
[ ] src/lib/queryClient.js exists
[ ] src/lib/utils.js exists with formatDate, formatCurrency, getErrorMessage, etc.
[ ] All 20 API module files exist in src/api/
[ ] src/stores/authStore.js exists
[ ] src/stores/orgStore.js exists  
[ ] src/hooks/useAuth.js exists
[ ] src/hooks/useOrg.js exists
[ ] src/layouts/AppLayout.jsx exists (with auth redirect guard)
[ ] src/layouts/AuthLayout.jsx exists
[ ] All 20 page placeholder files exist (one per module)
[ ] src/App.jsx has all routes wired up
[ ] src/main.jsx wraps app with QueryClientProvider + BrowserRouter
[ ] .env file created (not committed to git)
[ ] .gitignore includes .env
[ ] ESLint configured
[ ] Dev server runs with zero errors
[ ] /login route renders
[ ] / and /dashboard redirect to /login when unauthenticated

Report the results of this checklist. If any item failed, fix it before reporting done.
We are now ready to build Wave 1: the Login screen, App Shell, and Dashboard.
```
