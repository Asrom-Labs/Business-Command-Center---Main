import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Auth pages — NOT lazy (must load instantly on first visit)
import LoginPage from '@/pages/auth/LoginPage';

// Lazy-loaded app pages
const DashboardPage      = lazy(() => import('@/pages/dashboard/DashboardPage'));
const OrganizationPage   = lazy(() => import('@/pages/organization/OrganizationPage'));
const BranchesPage       = lazy(() => import('@/pages/branches/BranchesPage'));
const LocationsPage      = lazy(() => import('@/pages/locations/LocationsPage'));
const UsersPage          = lazy(() => import('@/pages/users/UsersPage'));
const CategoriesPage     = lazy(() => import('@/pages/categories/CategoriesPage'));
const UnitsPage          = lazy(() => import('@/pages/units/UnitsPage'));
const ProductsPage       = lazy(() => import('@/pages/products/ProductsPage'));
const SuppliersPage      = lazy(() => import('@/pages/suppliers/SuppliersPage'));
const CustomersPage      = lazy(() => import('@/pages/customers/CustomersPage'));
const PurchaseOrdersPage = lazy(() => import('@/pages/purchase-orders/PurchaseOrdersPage'));
const SalesOrdersPage    = lazy(() => import('@/pages/sales-orders/SalesOrdersPage'));
const PaymentsPage       = lazy(() => import('@/pages/payments/PaymentsPage'));
const ReturnsPage        = lazy(() => import('@/pages/returns/ReturnsPage'));
const TransfersPage      = lazy(() => import('@/pages/transfers/TransfersPage'));
const StockPage          = lazy(() => import('@/pages/stock/StockPage'));
const ExpensesPage       = lazy(() => import('@/pages/expenses/ExpensesPage'));
const ReportsPage        = lazy(() => import('@/pages/reports/ReportsPage'));
const AuditLogPage       = lazy(() => import('@/pages/audit-log/AuditLogPage'));
const ProfilePage        = lazy(() => import('@/pages/profile/ProfilePage'));
const ChangePasswordPage = lazy(() => import('@/pages/profile/ChangePasswordPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export default function App() {
  return (
    <>
      {/* Global toast notification system */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: 'hsl(142 71% 45%)', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: 'hsl(0 84% 60%)', secondary: '#fff' },
          },
        }}
      />

      <Routes>
        {/* ── Public routes (no login required) ── */}
        <Route element={<AuthLayout><LoginPage /></AuthLayout>} path="/login" />

        {/* ── Protected routes (login required) ── */}
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="/organization" element={<Suspense fallback={<PageLoader />}><OrganizationPage /></Suspense>} />
          <Route path="/branches" element={<Suspense fallback={<PageLoader />}><BranchesPage /></Suspense>} />
          <Route path="/locations" element={<Suspense fallback={<PageLoader />}><LocationsPage /></Suspense>} />
          <Route path="/users" element={<Suspense fallback={<PageLoader />}><UsersPage /></Suspense>} />
          <Route path="/categories" element={<Suspense fallback={<PageLoader />}><CategoriesPage /></Suspense>} />
          <Route path="/units" element={<Suspense fallback={<PageLoader />}><UnitsPage /></Suspense>} />
          <Route path="/products" element={<Suspense fallback={<PageLoader />}><ProductsPage /></Suspense>} />
          <Route path="/suppliers" element={<Suspense fallback={<PageLoader />}><SuppliersPage /></Suspense>} />
          <Route path="/customers" element={<Suspense fallback={<PageLoader />}><CustomersPage /></Suspense>} />
          <Route path="/purchase-orders" element={<Suspense fallback={<PageLoader />}><PurchaseOrdersPage /></Suspense>} />
          <Route path="/sales-orders" element={<Suspense fallback={<PageLoader />}><SalesOrdersPage /></Suspense>} />
          <Route path="/payments" element={<Suspense fallback={<PageLoader />}><PaymentsPage /></Suspense>} />
          <Route path="/returns" element={<Suspense fallback={<PageLoader />}><ReturnsPage /></Suspense>} />
          <Route path="/transfers" element={<Suspense fallback={<PageLoader />}><TransfersPage /></Suspense>} />
          <Route path="/stock" element={<Suspense fallback={<PageLoader />}><StockPage /></Suspense>} />
          <Route path="/expenses" element={<Suspense fallback={<PageLoader />}><ExpensesPage /></Suspense>} />
          <Route path="/reports" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
          <Route path="/audit-log" element={<Suspense fallback={<PageLoader />}><AuditLogPage /></Suspense>} />
          <Route path="/profile" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
          <Route path="/change-password" element={<Suspense fallback={<PageLoader />}><ChangePasswordPage /></Suspense>} />
          {/* Catch-all: redirect unknown paths to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </>
  );
}
