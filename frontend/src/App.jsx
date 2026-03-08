import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Auth pages
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
