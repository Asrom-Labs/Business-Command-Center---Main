# BCC — Wave 1, Prompt A (Final Corrected Version)
## Login Page + App Shell (Sidebar, Header, Dark Mode, i18n Foundation)
### Paste this entire prompt into Claude Code

---

```
You are building the Login Page and App Shell for Business Command Center (BCC),
a SaaS business management platform by Asrom Labs. This is production-grade work
targeting global customers — primarily non-technical small business owners in the
MENA region and beyond.

Every decision you make must reflect:
- Clarity and ease of use for non-technical users
- A warm, premium, approachable aesthetic (like Shopify or Square)
- Industry best practices and accessibility standards (WCAG 2.1 AA)
- Scalability — every pattern you establish will be reused across 20+ screens
- Zero shortcuts — this is the foundation everything else builds on

Read every instruction fully before executing. Execute in exact order.
Confirm each step succeeded before continuing. Do not skip any step.

The dev server is already running with `npm run dev` in the background.
All changes hot-reload automatically. Verify at http://localhost:5173.

---

## CONTEXT — WHAT EXISTS ALREADY

The scaffold from Phase 3 is complete. The following files already exist:
- React + Vite project in frontend/
- Tailwind CSS v3 with shadcn/ui (Slate base, CSS variables)
- All dependencies: react-router-dom, axios, zustand, @tanstack/react-query,
  react-hook-form, zod, lucide-react, react-hot-toast, date-fns, date-fns-tz
- src/lib/api.js — axios instance with JWT injection and 401 auto-redirect
- src/lib/constants.js — roles, nav items, status enums
- src/lib/utils.js — formatDate (uses date-fns-tz), formatCurrency, getErrorMessage, cn
- src/stores/authStore.js — Zustand auth store with login/logout/hasRole
- src/stores/orgStore.js — Zustand org store with setOrg/clearOrg/currency
- src/hooks/useAuth.js — auth convenience hook
- src/hooks/useOrg.js — org convenience hook
- src/layouts/AppLayout.jsx — placeholder (REPLACE contents)
- src/layouts/AuthLayout.jsx — placeholder (REPLACE contents)
- src/pages/auth/LoginPage.jsx — placeholder (REPLACE contents)
- All 20 page placeholders exist in src/pages/

CRITICAL RULES:
- DO NOT delete any existing files
- REPLACE file contents only where explicitly instructed
- DO NOT install packages that are already installed
- Run all npm commands from inside the frontend/ directory

---

## STEP 1 — INSTALL i18n PACKAGES

Run from inside the frontend/ directory:

  npm install i18next react-i18next i18next-browser-languagedetector

Verify: zero errors, packages appear in package.json dependencies.

---

## STEP 2 — CREATE TRANSLATION FILES

Create directory: src/locales/en/
Create directory: src/locales/ar/

--- FILE: src/locales/en/translation.json ---
{
  "app": {
    "name": "Business Command Center",
    "shortName": "BCC",
    "tagline": "Run your business. Own your growth."
  },
  "auth": {
    "login": {
      "title": "Welcome back",
      "subtitle": "Sign in to your account to continue",
      "emailLabel": "Email address",
      "emailPlaceholder": "you@yourbusiness.com",
      "passwordLabel": "Password",
      "passwordPlaceholder": "Enter your password",
      "submitButton": "Sign in",
      "submitting": "Signing in...",
      "noAccount": "Don't have an account?",
      "contactAdmin": "Contact your administrator",
      "errors": {
        "emailRequired": "Email address is required",
        "emailInvalid": "Please enter a valid email address",
        "passwordRequired": "Password is required",
        "passwordMinLength": "Password must be at least 8 characters",
        "invalidCredentials": "Incorrect email or password. Please try again.",
        "tooManyAttempts": "Too many attempts. Please wait 15 minutes and try again.",
        "networkError": "Unable to connect. Please check your internet connection.",
        "serverError": "Something went wrong on our end. Please try again."
      }
    }
  },
  "nav": {
    "dashboard": "Dashboard",
    "salesOrders": "Sales Orders",
    "purchaseOrders": "Purchase Orders",
    "payments": "Payments",
    "returns": "Returns",
    "transfers": "Stock Transfers",
    "products": "Products",
    "stock": "Stock",
    "suppliers": "Suppliers",
    "customers": "Customers",
    "expenses": "Expenses",
    "reports": "Reports",
    "organization": "Organization",
    "branches": "Branches",
    "locations": "Locations",
    "categories": "Categories",
    "units": "Units",
    "users": "Users",
    "auditLog": "Audit Log",
    "groups": {
      "overview": "Overview",
      "operations": "Operations",
      "inventory": "Inventory",
      "customers": "Customers",
      "finance": "Finance",
      "settings": "Settings"
    }
  },
  "header": {
    "myProfile": "My Profile",
    "changePassword": "Change Password",
    "signOut": "Sign out",
    "lightMode": "Switch to light mode",
    "darkMode": "Switch to dark mode",
    "changeLanguage": "Change language"
  },
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Try again",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "filter": "Filter",
    "clear": "Clear",
    "back": "Back",
    "next": "Next",
    "confirm": "Confirm",
    "yes": "Yes",
    "no": "No",
    "active": "Active",
    "inactive": "Inactive",
    "all": "All",
    "noResults": "No results found",
    "noData": "No data available yet",
    "required": "Required",
    "optional": "Optional"
  }
}

--- FILE: src/locales/ar/translation.json ---
{
  "app": {
    "name": "مركز قيادة الأعمال",
    "shortName": "BCC",
    "tagline": "أدر أعمالك. امتلك نموّك."
  },
  "auth": {
    "login": {
      "title": "مرحباً بعودتك",
      "subtitle": "سجّل دخولك للمتابعة",
      "emailLabel": "البريد الإلكتروني",
      "emailPlaceholder": "you@yourbusiness.com",
      "passwordLabel": "كلمة المرور",
      "passwordPlaceholder": "أدخل كلمة المرور",
      "submitButton": "تسجيل الدخول",
      "submitting": "جارٍ تسجيل الدخول...",
      "noAccount": "ليس لديك حساب؟",
      "contactAdmin": "تواصل مع المسؤول",
      "errors": {
        "emailRequired": "البريد الإلكتروني مطلوب",
        "emailInvalid": "يرجى إدخال بريد إلكتروني صحيح",
        "passwordRequired": "كلمة المرور مطلوبة",
        "passwordMinLength": "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
        "invalidCredentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى المحاولة مجدداً.",
        "tooManyAttempts": "محاولات كثيرة. يرجى الانتظار 15 دقيقة والمحاولة مجدداً.",
        "networkError": "تعذّر الاتصال. يرجى التحقق من اتصالك بالإنترنت.",
        "serverError": "حدث خطأ من جهتنا. يرجى المحاولة مجدداً."
      }
    }
  },
  "nav": {
    "dashboard": "لوحة التحكم",
    "salesOrders": "طلبات البيع",
    "purchaseOrders": "أوامر الشراء",
    "payments": "المدفوعات",
    "returns": "المرتجعات",
    "transfers": "تحويلات المخزون",
    "products": "المنتجات",
    "stock": "المخزون",
    "suppliers": "الموردون",
    "customers": "العملاء",
    "expenses": "المصروفات",
    "reports": "التقارير",
    "organization": "المنظمة",
    "branches": "الفروع",
    "locations": "المواقع",
    "categories": "الفئات",
    "units": "الوحدات",
    "users": "المستخدمون",
    "auditLog": "سجل التدقيق",
    "groups": {
      "overview": "نظرة عامة",
      "operations": "العمليات",
      "inventory": "المخزون",
      "customers": "العملاء",
      "finance": "المالية",
      "settings": "الإعدادات"
    }
  },
  "header": {
    "myProfile": "ملفي الشخصي",
    "changePassword": "تغيير كلمة المرور",
    "signOut": "تسجيل الخروج",
    "lightMode": "التبديل إلى الوضع الفاتح",
    "darkMode": "التبديل إلى الوضع الداكن",
    "changeLanguage": "تغيير اللغة"
  },
  "common": {
    "loading": "جارٍ التحميل...",
    "error": "حدث خطأ ما",
    "retry": "حاول مجدداً",
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "create": "إنشاء",
    "search": "بحث",
    "filter": "تصفية",
    "clear": "مسح",
    "back": "رجوع",
    "next": "التالي",
    "confirm": "تأكيد",
    "yes": "نعم",
    "no": "لا",
    "active": "نشط",
    "inactive": "غير نشط",
    "all": "الكل",
    "noResults": "لا توجد نتائج",
    "noData": "لا توجد بيانات بعد",
    "required": "مطلوب",
    "optional": "اختياري"
  }
}

---

## STEP 3 — CREATE src/lib/i18n.js

Create this file exactly as written:

--- FILE: src/lib/i18n.js ---
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from '@/locales/en/translation.json';
import arTranslations from '@/locales/ar/translation.json';

/**
 * BCC Internationalization (i18n) Configuration
 *
 * - Default language: English (en)
 * - Supported: English (LTR) and Arabic (RTL)
 * - Language preference stored in localStorage as 'bcc_language'
 * - HTML dir attribute updates automatically on language change
 *
 * To add a future language:
 *   1. Create src/locales/{code}/translation.json
 *   2. Import and add to resources below
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English',  dir: 'ltr', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', dir: 'rtl', flag: '🇯🇴' },
];

/**
 * Applies the correct text direction to the HTML element.
 * Called on init and every time the language changes.
 */
export function applyLanguageDirection(langCode) {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
  document.documentElement.setAttribute('dir', lang?.dir || 'ltr');
  document.documentElement.setAttribute('lang', langCode || 'en');
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ar: { translation: arTranslations },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'bcc_language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Apply direction on startup
applyLanguageDirection(i18n.language);

// Apply direction whenever language changes
i18n.on('languageChanged', applyLanguageDirection);

export default i18n;

---

## STEP 4 — UPDATE src/main.jsx

Replace the ENTIRE contents of src/main.jsx with this exact code.
The i18n import MUST come before the App import so translations
are ready before any component renders:

--- FILE: src/main.jsx ---
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import '@/lib/i18n';
import App from './App';
import './index.css';

/**
 * Suspense is required by react-i18next.
 * While translations are loading, shows a minimal blank screen
 * rather than crashing or showing translation keys.
 */
function LoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fafaf9',
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: '3px solid #e5e7eb',
        borderTopColor: '#4f46e5',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <App />
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

---

## STEP 5 — REPLACE src/index.css

Replace the ENTIRE contents of src/index.css with this complete stylesheet.
This establishes the BCC visual identity for every screen in the app:

--- FILE: src/index.css ---
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* ═══════════════════════════════════════════════════════
     BCC DESIGN TOKENS — LIGHT MODE
     Warm, premium, approachable.
     Primary:    Rich indigo-blue (trustworthy, professional)
     Accent:     Warm amber (energy, growth)
     Background: Warm off-white (never cold or sterile)
  ═══════════════════════════════════════════════════════ */
  :root {
    --background:             34 30% 98%;
    --foreground:             224 25% 12%;

    --card:                   0 0% 100%;
    --card-foreground:        224 25% 12%;

    --popover:                0 0% 100%;
    --popover-foreground:     224 25% 12%;

    --primary:                231 75% 52%;
    --primary-foreground:     0 0% 100%;

    --secondary:              220 16% 95%;
    --secondary-foreground:   224 25% 25%;

    --muted:                  220 16% 94%;
    --muted-foreground:       220 10% 50%;

    --accent:                 38 96% 54%;
    --accent-foreground:      224 25% 12%;

    --destructive:            4 86% 58%;
    --destructive-foreground: 0 0% 100%;

    --success:                152 60% 40%;
    --success-foreground:     0 0% 100%;

    --warning:                38 96% 54%;
    --warning-foreground:     224 25% 12%;

    --border:                 220 16% 90%;
    --input:                  220 16% 90%;
    --ring:                   231 75% 52%;
    --radius:                 0.5rem;

    /* Sidebar — deep navy creates strong contrast with warm content */
    --sidebar-bg:             228 30% 13%;
    --sidebar-fg:             220 20% 88%;
    --sidebar-muted-fg:       228 15% 50%;
    --sidebar-border:         228 25% 20%;
    --sidebar-hover-bg:       228 25% 20%;
    --sidebar-active-bg:      231 75% 52%;
    --sidebar-active-fg:      0 0% 100%;

    /* Layout */
    --header-height:          60px;
    --sidebar-width:          256px;
    --sidebar-collapsed-width: 68px;
  }

  /* ═══════════════════════════════════════════════════════
     DARK MODE TOKENS
     Deep navy, never pure black. Warm depth throughout.
  ═══════════════════════════════════════════════════════ */
  .dark {
    --background:             228 28% 9%;
    --foreground:             220 20% 92%;

    --card:                   228 25% 12%;
    --card-foreground:        220 20% 92%;

    --popover:                228 25% 13%;
    --popover-foreground:     220 20% 92%;

    --primary:                231 75% 62%;
    --primary-foreground:     228 28% 9%;

    --secondary:              228 22% 16%;
    --secondary-foreground:   220 20% 80%;

    --muted:                  228 22% 16%;
    --muted-foreground:       220 12% 50%;

    --accent:                 38 96% 58%;
    --accent-foreground:      228 28% 9%;

    --destructive:            4 72% 55%;
    --destructive-foreground: 0 0% 100%;

    --success:                152 55% 48%;
    --success-foreground:     0 0% 100%;

    --warning:                38 96% 58%;
    --warning-foreground:     228 28% 9%;

    --border:                 228 22% 20%;
    --input:                  228 22% 20%;
    --ring:                   231 75% 62%;

    --sidebar-bg:             228 32% 7%;
    --sidebar-fg:             220 18% 82%;
    --sidebar-muted-fg:       228 14% 42%;
    --sidebar-border:         228 25% 14%;
    --sidebar-hover-bg:       228 25% 14%;
    --sidebar-active-bg:      231 75% 62%;
    --sidebar-active-fg:      228 28% 9%;
  }

  /* ═══════════════════════════════════════════════════════
     BASE ELEMENT STYLES
  ═══════════════════════════════════════════════════════ */
  *, *::before, *::after {
    @apply border-border box-border;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Arabic RTL — add Arabic-friendly font stack */
  [dir="rtl"] body {
    font-family: 'Plus Jakarta Sans', 'Noto Sans Arabic', system-ui, sans-serif;
  }

  /* Smooth theme transition */
  *, *::before, *::after {
    transition-property: background-color, border-color, color, box-shadow;
    transition-duration: 120ms;
    transition-timing-function: ease;
  }

  /* Override for interactive elements — instant feel */
  button, a { transition-duration: 80ms; }

  /* Keyboard focus ring — accessibility */
  :focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
    border-radius: calc(var(--radius) - 2px);
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar       { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 999px; }
  ::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.4); }
}

/* ═══════════════════════════════════════════════════════
   UTILITY CLASSES
   Used throughout the app for consistent patterns.
═══════════════════════════════════════════════════════ */
@layer utilities {

  /* ── Status badge colors ── */
  .status-active    { @apply bg-green-100   text-green-800   dark:bg-green-900/20   dark:text-green-400; }
  .status-inactive  { @apply bg-gray-100    text-gray-600    dark:bg-gray-800/40    dark:text-gray-400; }
  .status-pending   { @apply bg-amber-100   text-amber-800   dark:bg-amber-900/20   dark:text-amber-400; }
  .status-cancelled { @apply bg-red-100     text-red-700     dark:bg-red-900/20     dark:text-red-400; }
  .status-completed { @apply bg-blue-100    text-blue-800    dark:bg-blue-900/20    dark:text-blue-400; }
  .status-confirmed { @apply bg-indigo-100  text-indigo-800  dark:bg-indigo-900/20  dark:text-indigo-400; }
  .status-shipped   { @apply bg-purple-100  text-purple-800  dark:bg-purple-900/20  dark:text-purple-400; }
  .status-received  { @apply bg-teal-100    text-teal-800    dark:bg-teal-900/20    dark:text-teal-400; }
  .status-draft     { @apply bg-slate-100   text-slate-600   dark:bg-slate-800/40   dark:text-slate-400; }

  /* ── Page layout ── */
  .page-container { @apply px-6 py-6 max-w-[1440px] mx-auto w-full; }
  .page-title     { @apply text-2xl font-bold text-foreground tracking-tight; }
  .page-subtitle  { @apply text-sm text-muted-foreground mt-1; }

  /* ── Card ── */
  .bcc-card        { @apply bg-card rounded-xl border border-border; }
  .bcc-card-padded { @apply bcc-card p-6; }

  /* ── Error text used in forms ── */
  .field-error { @apply text-xs text-destructive mt-1 flex items-center gap-1.5; }

  /* ── Entrance animations ── */
  .fade-in {
    animation: bccFadeIn 0.2s ease-out both;
  }
  .slide-in-left {
    animation: bccSlideInLeft 0.2s ease-out both;
  }
  @keyframes bccFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bccSlideInLeft {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }
}

---

## STEP 6 — REPLACE tailwind.config.cjs

Replace the ENTIRE contents of tailwind.config.cjs with:

--- FILE: tailwind.config.cjs ---
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT:    'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT:    'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg:  'var(--radius)',
        md:  'calc(var(--radius) - 2px)',
        sm:  'calc(var(--radius) - 4px)',
        xl:  'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        'header':            'var(--header-height)',
        'sidebar':           'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-collapsed-width)',
      },
      height: {
        header: 'var(--header-height)',
      },
      width: {
        sidebar:            'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-collapsed-width)',
      },
    },
  },
  plugins: [],
};

---

## STEP 7 — CREATE THE THEME STORE

Create src/stores/themeStore.js:

--- FILE: src/stores/themeStore.js ---
import { create } from 'zustand';

/**
 * Theme store — manages light/dark mode preference.
 *
 * - Persists to localStorage as 'bcc_theme'
 * - Applies/removes the 'dark' class on <html> for Tailwind dark: variants
 * - On first visit, respects the user's OS/browser preference
 */

const THEME_KEY = 'bcc_theme';

function getInitialTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDOM(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem(THEME_KEY, theme);
}

// Apply on module load (before React mounts) to prevent flash
const initialTheme = getInitialTheme();
applyThemeToDOM(initialTheme);

export const useThemeStore = create((set) => ({
  theme: initialTheme,

  setTheme: (theme) => {
    applyThemeToDOM(theme);
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      applyThemeToDOM(next);
      return { theme: next };
    });
  },
}));

---

## STEP 8 — BUILD THE LOGIN PAGE

IMPORTANT API SHAPE FOR LOGIN:
The login endpoint POST /api/auth/login returns:
  {
    "success": true,
    "data": { "id": "uuid", "name": "...", "email": "...", "role": "...", "org_id": "uuid" },
    "token": "eyJ...",
    "message": "Login successful"
  }

NOTE: The token is at the TOP LEVEL of the response (response.token),
NOT inside response.data. The user object IS inside response.data.
The axios interceptor in src/lib/api.js returns response.data (the axios
response body), so in the login handler:
  result.token   → the JWT
  result.data    → the user object { id, name, email, role, org_id }

Replace the ENTIRE contents of src/pages/auth/LoginPage.jsx:

--- FILE: src/pages/auth/LoginPage.jsx ---
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, TrendingUp, Package, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// Validation schema — mirrors backend rules exactly
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'auth.login.errors.emailRequired')
    .email('auth.login.errors.emailInvalid'),
  password: z
    .string()
    .min(1, 'auth.login.errors.passwordRequired')
    .min(8,  'auth.login.errors.passwordMinLength'),
});

// Feature highlights on the left brand panel
const FEATURES = [
  { icon: TrendingUp, label: 'Sales & Revenue tracking'          },
  { icon: Package,    label: 'Inventory & Stock management'       },
  { icon: Users,      label: 'Customers & Suppliers in one place' },
];

// Map API error responses to user-friendly translation keys
function getApiErrorKey(error) {
  if (error?.status === 429)               return 'auth.login.errors.tooManyAttempts';
  if (error?.status === 401)               return 'auth.login.errors.invalidCredentials';
  if (error?.error === 'UNAUTHORIZED')     return 'auth.login.errors.invalidCredentials';
  if (error?.error === 'VALIDATION_ERROR') return 'auth.login.errors.invalidCredentials';
  if (!error?.status || error?.status >= 500) return 'auth.login.errors.serverError';
  return 'auth.login.errors.serverError';
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (values) => {
    setApiError('');
    try {
      // result is the full API response body (axios interceptor unwraps it)
      const result = await authApi.login(values.email, values.password);
      // token is at result.token, user is at result.data
      login(result.token, result.data);
      toast.success(`Welcome back, ${result.data.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(t(getApiErrorKey(err)));
    }
  };

  return (
    <div className="flex min-h-screen w-full">

      {/* ════════════════════════════════════════════
          LEFT — BRAND PANEL (hidden on mobile)
      ════════════════════════════════════════════ */}
      <div
        className="relative hidden md:flex md:w-[55%] flex-col justify-between overflow-hidden p-12"
        style={{
          background: 'linear-gradient(140deg, hsl(231,75%,36%) 0%, hsl(252,68%,36%) 50%, hsl(272,58%,32%) 100%)',
        }}
      >
        {/* Decorative orbs — create depth */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, hsl(220,90%,85%) 0%, transparent 70%)' }}
          />
          <div
            className="absolute top-1/2 -right-48 h-[420px] w-[420px] rounded-full opacity-[0.10]"
            style={{ background: 'radial-gradient(circle, hsl(258,80%,78%) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-24 left-1/3 h-[320px] w-[320px] rounded-full opacity-[0.10]"
            style={{ background: 'radial-gradient(circle, hsl(280,70%,78%) 0%, transparent 70%)' }}
          />
          {/* Subtle grid texture */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg,transparent,transparent 40px,white 40px,white 41px),' +
                'repeating-linear-gradient(90deg,transparent,transparent 40px,white 40px,white 41px)',
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-sm">
            <Zap className="h-5 w-5 text-white" fill="currentColor" />
          </div>
          <div>
            <div className="text-xl font-bold leading-none tracking-tight text-white">BCC</div>
            <div className="mt-0.5 text-[11px] font-medium tracking-wide text-white/55">
              {t('app.name')}
            </div>
          </div>
        </div>

        {/* Tagline + features */}
        <div className="relative z-10">
          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-5xl">
            {t('app.tagline')}
          </h1>
          <p className="mb-10 max-w-sm text-lg leading-relaxed text-white/65">
            Everything your business needs — inventory, sales, customers,
            and growth — all in one place.
          </p>
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                  <Icon className="h-4 w-4 text-white/85" />
                </div>
                <span className="text-sm font-medium text-white/75">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} Asrom Labs. Trusted by businesses worldwide.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          RIGHT — FORM PANEL
      ════════════════════════════════════════════ */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 md:px-14">

        {/* Mobile logo (visible only below md breakpoint) */}
        <div className="mb-8 flex items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-white" fill="currentColor" />
          </div>
          <span className="text-lg font-bold text-foreground">BCC</span>
        </div>

        <div className="fade-in w-full max-w-[400px]">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t('auth.login.title')}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t('auth.login.subtitle')}
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* API-level error banner */}
            {apiError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/8 px-4 py-3"
              >
                <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-destructive" />
                <p className="text-sm font-medium text-destructive">{apiError}</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                {t('auth.login.emailLabel')}
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder={t('auth.login.emailPlaceholder')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={cn(
                  'h-11',
                  errors.email && 'border-destructive focus-visible:ring-destructive/30'
                )}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" className="field-error" role="alert">
                  <span className="inline-block h-1 w-1 flex-shrink-0 rounded-full bg-destructive" />
                  {t(errors.email.message)}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                {t('auth.login.passwordLabel')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={t('auth.login.passwordPlaceholder')}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={cn(
                    'h-11 pr-11',
                    errors.password && 'border-destructive focus-visible:ring-destructive/30'
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye    className="h-4 w-4" />
                  }
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="field-error" role="alert">
                  <span className="inline-block h-1 w-1 flex-shrink-0 rounded-full bg-destructive" />
                  {t(errors.password.message)}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-11 w-full text-sm font-semibold"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {t('auth.login.submitting')}
                </span>
              ) : (
                t('auth.login.submitButton')
              )}
            </Button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.login.noAccount')}{' '}
            <span className="font-medium text-primary">
              {t('auth.login.contactAdmin')}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

---

## STEP 9 — UPDATE AuthLayout.jsx

The login page is now a full-screen component and manages its own layout.
AuthLayout just needs to render its children directly.

Replace the ENTIRE contents of src/layouts/AuthLayout.jsx:

--- FILE: src/layouts/AuthLayout.jsx ---
/**
 * AuthLayout — wraps public pages (login, etc.)
 * The login page is full-screen and self-contained,
 * so this layout is intentionally transparent.
 */
export function AuthLayout({ children }) {
  return <>{children}</>;
}

---

## STEP 10 — CREATE THE SIDEBAR COMPONENT

Create a new file: src/components/shared/Sidebar.jsx

This is the main navigation sidebar. Key behaviors:
- Expanded by default (icons + labels visible, width 256px)
- Collapsible to icons-only (width 68px) via a toggle button at the bottom
- Collapse state persists in localStorage as 'bcc_sidebar_collapsed'
- Navigation items filtered by user's role using ROLE_HIERARCHY
- Active route highlighted with primary color
- Tooltips on icon-only collapsed items (so user always knows where they are)
- Smooth CSS transition on width change
- All labels use i18n translation keys

--- FILE: src/components/shared/Sidebar.jsx ---
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, ShoppingCart, PackageOpen, CreditCard, Undo2,
  ArrowLeftRight, Box, Warehouse, Truck, Users, Receipt, BarChart2,
  Building2, GitBranch, MapPin, Tag, Ruler, UserCog, ScrollText,
  ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_HIERARCHY } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Icon registry — maps string names to Lucide components
const ICON_MAP = {
  LayoutDashboard, ShoppingCart, PackageOpen, CreditCard, Undo2,
  ArrowLeftRight, Box, Warehouse, Truck, Users, Receipt, BarChart2,
  Building2, GitBranch, MapPin, Tag, Ruler, UserCog, ScrollText,
};

// Full navigation structure — translation keys + paths + minimum role
const NAV_GROUPS = [
  {
    groupKey: 'nav.groups.overview',
    items: [
      { key: 'nav.dashboard',    path: '/dashboard',    icon: 'LayoutDashboard', minRole: 'readonly' },
    ],
  },
  {
    groupKey: 'nav.groups.operations',
    items: [
      { key: 'nav.salesOrders',    path: '/sales-orders',    icon: 'ShoppingCart',   minRole: 'staff' },
      { key: 'nav.purchaseOrders', path: '/purchase-orders', icon: 'PackageOpen',    minRole: 'staff' },
      { key: 'nav.payments',       path: '/payments',        icon: 'CreditCard',     minRole: 'staff' },
      { key: 'nav.returns',        path: '/returns',         icon: 'Undo2',          minRole: 'staff' },
      { key: 'nav.transfers',      path: '/transfers',       icon: 'ArrowLeftRight', minRole: 'staff' },
    ],
  },
  {
    groupKey: 'nav.groups.inventory',
    items: [
      { key: 'nav.products',  path: '/products',  icon: 'Box',       minRole: 'readonly' },
      { key: 'nav.stock',     path: '/stock',     icon: 'Warehouse', minRole: 'readonly' },
      { key: 'nav.suppliers', path: '/suppliers', icon: 'Truck',     minRole: 'readonly' },
    ],
  },
  {
    groupKey: 'nav.groups.customers',
    items: [
      { key: 'nav.customers', path: '/customers', icon: 'Users', minRole: 'readonly' },
    ],
  },
  {
    groupKey: 'nav.groups.finance',
    items: [
      { key: 'nav.expenses', path: '/expenses', icon: 'Receipt',   minRole: 'staff' },
      { key: 'nav.reports',  path: '/reports',  icon: 'BarChart2', minRole: 'staff' },
    ],
  },
  {
    groupKey: 'nav.groups.settings',
    items: [
      { key: 'nav.organization', path: '/organization', icon: 'Building2',  minRole: 'admin' },
      { key: 'nav.branches',     path: '/branches',     icon: 'GitBranch',  minRole: 'admin' },
      { key: 'nav.locations',    path: '/locations',    icon: 'MapPin',     minRole: 'admin' },
      { key: 'nav.categories',   path: '/categories',   icon: 'Tag',        minRole: 'admin' },
      { key: 'nav.units',        path: '/units',        icon: 'Ruler',      minRole: 'admin' },
      { key: 'nav.users',        path: '/users',        icon: 'UserCog',    minRole: 'admin' },
      { key: 'nav.auditLog',     path: '/audit-log',    icon: 'ScrollText', minRole: 'admin' },
    ],
  },
];

const COLLAPSE_KEY = 'bcc_sidebar_collapsed';

export function Sidebar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === 'true'
  );

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem(COLLAPSE_KEY, String(!prev));
      return !prev;
    });
  };

  const canSee = (minRole) => {
    if (!user?.role) return false;
    return (ROLE_HIERARCHY[user.role] ?? -1) >= (ROLE_HIERARCHY[minRole] ?? 999);
  };

  const isActive = (path) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        style={{
          width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          backgroundColor: 'hsl(var(--sidebar-bg))',
          borderRight: '1px solid hsl(var(--sidebar-border))',
        }}
        className="relative flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden"
      >
        {/* ── Logo ── */}
        <div
          style={{ height: 'var(--header-height)', borderBottom: '1px solid hsl(var(--sidebar-border))' }}
          className={cn(
            'flex items-center flex-shrink-0',
            collapsed ? 'justify-center' : 'px-4 gap-3'
          )}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-white" fill="currentColor" />
          </div>
          {!collapsed && (
            <div className="slide-in-left overflow-hidden">
              <div
                style={{ color: 'hsl(var(--sidebar-fg))' }}
                className="text-[15px] font-bold leading-none tracking-tight"
              >
                BCC
              </div>
              <div
                style={{ color: 'hsl(var(--sidebar-muted-fg))' }}
                className="mt-0.5 text-[10px] font-medium tracking-wide whitespace-nowrap"
              >
                {t('app.name')}
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
          {NAV_GROUPS.map((group) => {
            const visible = group.items.filter((item) => canSee(item.minRole));
            if (!visible.length) return null;

            return (
              <div key={group.groupKey} className="mb-1">
                {/* Group label — only when expanded */}
                {!collapsed && (
                  <div className="px-3 pb-1 pt-2">
                    <span
                      style={{ color: 'hsl(var(--sidebar-muted-fg))' }}
                      className="text-[10px] font-semibold uppercase tracking-widest"
                    >
                      {t(group.groupKey)}
                    </span>
                  </div>
                )}
                {collapsed && <div className="h-3" />}

                <div className="space-y-0.5">
                  {visible.map((item) => {
                    const Icon = ICON_MAP[item.icon];
                    const active = isActive(item.path);
                    const label = t(item.key);

                    const linkEl = (
                      <NavLink
                        to={item.path}
                        aria-label={label}
                        aria-current={active ? 'page' : undefined}
                        style={active
                          ? { backgroundColor: 'hsl(var(--sidebar-active-bg))', color: 'hsl(var(--sidebar-active-fg))' }
                          : { color: 'hsl(var(--sidebar-fg))' }
                        }
                        className={cn(
                          'flex items-center rounded-lg text-sm font-medium transition-colors duration-75',
                          'focus-visible:outline-none focus-visible:ring-2',
                          collapsed
                            ? 'mx-auto h-10 w-10 justify-center'
                            : 'h-9 w-full gap-3 px-3',
                          !active && 'hover:bg-[hsl(var(--sidebar-hover-bg))]'
                        )}
                      >
                        {Icon && (
                          <Icon className={cn('flex-shrink-0', collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4')} />
                        )}
                        {!collapsed && (
                          <span className="slide-in-left truncate">{label}</span>
                        )}
                      </NavLink>
                    );

                    if (collapsed) {
                      return (
                        <Tooltip key={item.path}>
                          <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8}>
                            <span className="text-xs font-medium">{label}</span>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return <div key={item.path}>{linkEl}</div>;
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── Collapse toggle ── */}
        <div
          style={{ borderTop: '1px solid hsl(var(--sidebar-border))' }}
          className="flex-shrink-0 p-2"
        >
          <button
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ color: 'hsl(var(--sidebar-muted-fg))' }}
            className={cn(
              'flex w-full items-center justify-center rounded-lg h-9 text-xs font-medium gap-2',
              'transition-colors hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-fg))]'
            )}
          >
            {collapsed
              ? <ChevronRight className="h-4 w-4" />
              : <>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="slide-in-left">Collapse</span>
                </>
            }
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

---

## STEP 11 — CREATE THE HEADER COMPONENT

Create a new file: src/components/shared/Header.jsx

Features:
- Dark/light mode toggle (moon/sun icon)
- Language switcher (globe icon → dropdown with EN and AR options)
- User avatar with dropdown menu (name, email, role, profile, change password, sign out)
- All text uses i18n
- On sign out: calls logout() from authStore + navigates to /login

--- FILE: src/components/shared/Header.jsx ---
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, LogOut, User, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useThemeStore } from '@/stores/themeStore';
import { cn, getInitials } from '@/lib/utils';
import { SUPPORTED_LANGUAGES, default as i18n } from '@/lib/i18n';

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header
      style={{ height: 'var(--header-height)' }}
      className="flex flex-shrink-0 items-center justify-between border-b border-border bg-background px-6"
    >
      {/* Left side — reserved for page title / breadcrumb (added in Wave 2) */}
      <div className="flex-1" />

      {/* Right side — controls */}
      <div className="flex items-center gap-1">

        {/* Dark / light mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label={theme === 'dark' ? t('header.lightMode') : t('header.darkMode')}
        >
          {theme === 'dark'
            ? <Sun  className="h-4 w-4" />
            : <Moon className="h-4 w-4" />
          }
        </Button>

        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              aria-label={t('header.changeLanguage')}
            >
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={cn(
                  'cursor-pointer gap-2',
                  i18n.language === lang.code && 'font-semibold text-primary'
                )}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-9 items-center gap-2 rounded-lg px-2 hover:bg-secondary"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-foreground sm:block">
                {user?.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                <p className="mt-0.5 text-xs font-medium capitalize text-primary">{user?.role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => navigate('/organization')}
            >
              <User className="h-4 w-4" />
              {t('header.myProfile')}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2">
              <Lock className="h-4 w-4" />
              {t('header.changePassword')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {t('header.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

---

## STEP 12 — BUILD THE APP LAYOUT

Replace the ENTIRE contents of src/layouts/AppLayout.jsx:

--- FILE: src/layouts/AppLayout.jsx ---
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';

/**
 * AppLayout — authenticated shell wrapping every protected page.
 *
 * Layout structure:
 *   ┌──────────┬────────────────────────────────┐
 *   │          │  Header (60px fixed height)    │
 *   │ Sidebar  ├────────────────────────────────┤
 *   │(fixed,   │                                │
 *   │ no       │  Page content (scrollable)     │
 *   │ scroll)  │                                │
 *   └──────────┴────────────────────────────────┘
 *
 * - Unauthenticated users are redirected to /login
 * - Sidebar collapses independently of the rest of the layout
 * - Header is always visible above the scrollable content area
 */
export function AppLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* Sidebar — fixed full height, manages its own width state */}
      <Sidebar />

      {/* Right column — header + scrollable page content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}

---

## STEP 13 — UPDATE src/App.jsx

Replace the ENTIRE contents of src/App.jsx with this complete, final version.
This is the definitive router configuration for the entire application:

--- FILE: src/App.jsx ---
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import { AppLayout }  from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Auth
import LoginPage from '@/pages/auth/LoginPage';

// App pages
import DashboardPage      from '@/pages/dashboard/DashboardPage';
import OrganizationPage   from '@/pages/organization/OrganizationPage';
import BranchesPage       from '@/pages/branches/BranchesPage';
import LocationsPage      from '@/pages/locations/LocationsPage';
import UsersPage          from '@/pages/users/UsersPage';
import CategoriesPage     from '@/pages/categories/CategoriesPage';
import UnitsPage          from '@/pages/units/UnitsPage';
import ProductsPage       from '@/pages/products/ProductsPage';
import SuppliersPage      from '@/pages/suppliers/SuppliersPage';
import CustomersPage      from '@/pages/customers/CustomersPage';
import PurchaseOrdersPage from '@/pages/purchase-orders/PurchaseOrdersPage';
import SalesOrdersPage    from '@/pages/sales-orders/SalesOrdersPage';
import PaymentsPage       from '@/pages/payments/PaymentsPage';
import ReturnsPage        from '@/pages/returns/ReturnsPage';
import TransfersPage      from '@/pages/transfers/TransfersPage';
import StockPage          from '@/pages/stock/StockPage';
import ExpensesPage       from '@/pages/expenses/ExpensesPage';
import ReportsPage        from '@/pages/reports/ReportsPage';
import AuditLogPage       from '@/pages/audit-log/AuditLogPage';

export default function App() {
  return (
    <>
      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          },
          success: {
            iconTheme: { primary: 'hsl(152, 60%, 40%)', secondary: 'white' },
          },
          error: {
            iconTheme: { primary: 'hsl(4, 86%, 58%)', secondary: 'white' },
          },
        }}
      />

      <Routes>
        {/* ── Public routes ── */}
        <Route
          path="/login"
          element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />

        {/* ── Protected routes (require login) ── */}
        <Route element={<AppLayout />}>
          <Route index                      element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"          element={<DashboardPage />} />
          <Route path="/organization"       element={<OrganizationPage />} />
          <Route path="/branches"           element={<BranchesPage />} />
          <Route path="/locations"          element={<LocationsPage />} />
          <Route path="/users"              element={<UsersPage />} />
          <Route path="/categories"         element={<CategoriesPage />} />
          <Route path="/units"              element={<UnitsPage />} />
          <Route path="/products"           element={<ProductsPage />} />
          <Route path="/suppliers"          element={<SuppliersPage />} />
          <Route path="/customers"          element={<CustomersPage />} />
          <Route path="/purchase-orders"    element={<PurchaseOrdersPage />} />
          <Route path="/sales-orders"       element={<SalesOrdersPage />} />
          <Route path="/payments"           element={<PaymentsPage />} />
          <Route path="/returns"            element={<ReturnsPage />} />
          <Route path="/transfers"          element={<TransfersPage />} />
          <Route path="/stock"              element={<StockPage />} />
          <Route path="/expenses"           element={<ExpensesPage />} />
          <Route path="/reports"            element={<ReportsPage />} />
          <Route path="/audit-log"          element={<AuditLogPage />} />
          {/* Catch-all — redirect unknown paths to dashboard */}
          <Route path="*"                   element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </>
  );
}

---

## STEP 14 — FINAL VERIFICATION

Check every item. Fix anything that is not passing before reporting done.

### 14A — Zero compilation errors
Confirm the terminal running npm run dev shows zero red errors.
ESLint warnings are acceptable. Errors are not.

### 14B — Login page visual check (http://localhost:5173/login)
[ ] Split screen: left gradient panel (deep blue → indigo → violet) + right form
[ ] Left panel: Zap icon, "BCC", app name, tagline, 3 feature rows, footer
[ ] Right panel: "Welcome back" heading + subtitle, email field, password field, Sign in button
[ ] Show/hide password toggle works (eye icon in password field)
[ ] On viewport narrower than 768px: left panel is hidden, only form shows (mobile responsive)

### 14C — Form validation
[ ] Submitting empty form → inline error appears under EACH field immediately
[ ] Typing an invalid email (e.g. "hello") then clicking away → email error appears
[ ] Submitting valid email + short password → password error appears
[ ] Error messages are in English by default

### 14D — Live login test (backend must be running on port 3001)
Test credentials: ashraf@testbusiness.com / TestPass123
[ ] Successful login → redirected to /dashboard
[ ] Success toast appears top-right: "Welcome back, [name]!"
[ ] App shell visible: sidebar on left, header on top
[ ] User name and initials visible in top-right avatar button
[ ] Sidebar shows grouped navigation items

### 14E — Dark mode
[ ] Clicking the moon/sun icon in the header toggles dark/light mode instantly
[ ] Entire app changes theme — sidebar, header, content area, form fields all update
[ ] Refreshing the page keeps the same theme (persisted to localStorage)
[ ] Login page also respects dark mode correctly

### 14F — Language switching
[ ] Clicking the globe icon in the header opens a dropdown with English 🇬🇧 and العربية 🇯🇴
[ ] Switching to Arabic: all nav labels, header items change to Arabic
[ ] Switching to Arabic: page layout direction changes to RTL (text aligns right)
[ ] Switching back to English: layout returns to LTR
[ ] Language preference persists on page refresh

### 14G — Sidebar behavior
[ ] Sidebar starts expanded (icons + labels visible)
[ ] Clicking "Collapse" → sidebar shrinks to icons only
[ ] In collapsed mode: hovering any nav icon shows a tooltip with the item's name
[ ] Clicking ">" button → sidebar expands back
[ ] Collapse state persists on page refresh
[ ] Currently active page is highlighted in the sidebar (indigo background)
[ ] Navigating to a different page updates the highlight

### 14H — Auth guard
[ ] Signing out → redirected to /login, session cleared
[ ] While logged out, navigating to /dashboard → redirected to /login
[ ] After redirect to /login, pressing browser Back → stays on /login (no back to protected page)

### 14I — Console check
[ ] Open browser DevTools (F12) → Console tab shows zero red errors
[ ] Network tab shows no failed requests (404s or 500s) on page load

---

## STEP 15 — REPORT

When all 14 verification checks pass, report:

1. Complete list of files created and files modified
2. All packages installed in this session
3. Any deviations from this specification and the reason
4. Any issues encountered and exactly how they were resolved
5. Current status: zero compilation errors confirmed
6. Description of what the login page looks like visually

We are then ready for Wave 1 Prompt B: the Dashboard.
```
