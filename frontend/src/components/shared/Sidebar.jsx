import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  MapPin,
  Users,
  Tag,
  Ruler,
  Box,
  Truck,
  UserCheck,
  ShoppingCart,
  Receipt,
  CreditCard,
  RotateCcw,
  ArrowLeftRight,
  Warehouse,
  Wallet,
  BarChart3,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { ROLE_HIERARCHY } from '@/lib/constants';

const SIDEBAR_KEY = 'bcc_sidebar_collapsed';

const ICON_MAP = {
  LayoutDashboard,
  Building2,
  GitBranch,
  MapPin,
  Users,
  Tag,
  Ruler,
  Box,
  Truck,
  UserCheck,
  ShoppingCart,
  Receipt,
  CreditCard,
  RotateCcw,
  ArrowLeftRight,
  Warehouse,
  Wallet,
  BarChart3,
  ScrollText,
};

const NAV_GROUPS = [
  {
    groupKey: 'nav.groups.overview',
    items: [
      { key: 'nav.items.dashboard', path: '/dashboard', icon: 'LayoutDashboard', minRole: 'readonly' },
    ],
  },
  {
    groupKey: 'nav.groups.settings',
    items: [
      { key: 'nav.items.organization', path: '/organization', icon: 'Building2', minRole: 'admin' },
      { key: 'nav.items.branches', path: '/branches', icon: 'GitBranch', minRole: 'admin' },
      { key: 'nav.items.locations', path: '/locations', icon: 'MapPin', minRole: 'admin' },
      { key: 'nav.items.users', path: '/users', icon: 'Users', minRole: 'admin' },
    ],
  },
  {
    groupKey: 'nav.groups.inventory',
    items: [
      { key: 'nav.items.categories', path: '/categories', icon: 'Tag', minRole: 'staff' },
      { key: 'nav.items.units', path: '/units', icon: 'Ruler', minRole: 'staff' },
      { key: 'nav.items.products', path: '/products', icon: 'Box', minRole: 'readonly' },
      { key: 'nav.items.stock', path: '/stock', icon: 'Warehouse', minRole: 'readonly' },
      { key: 'nav.items.transfers', path: '/transfers', icon: 'ArrowLeftRight', minRole: 'staff' },
    ],
  },
  {
    groupKey: 'nav.groups.operations',
    items: [
      { key: 'nav.items.suppliers', path: '/suppliers', icon: 'Truck', minRole: 'staff' },
      { key: 'nav.items.customers', path: '/customers', icon: 'UserCheck', minRole: 'staff' },
      { key: 'nav.items.purchaseOrders', path: '/purchase-orders', icon: 'ShoppingCart', minRole: 'staff' },
      { key: 'nav.items.salesOrders', path: '/sales-orders', icon: 'Receipt', minRole: 'staff' },
      { key: 'nav.items.returns', path: '/returns', icon: 'RotateCcw', minRole: 'staff' },
    ],
  },
  {
    groupKey: 'nav.groups.finance',
    items: [
      { key: 'nav.items.payments', path: '/payments', icon: 'CreditCard', minRole: 'staff' },
      { key: 'nav.items.expenses', path: '/expenses', icon: 'Wallet', minRole: 'staff' },
      { key: 'nav.items.reports', path: '/reports', icon: 'BarChart3', minRole: 'readonly' },
      { key: 'nav.items.auditLog', path: '/audit-log', icon: 'ScrollText', minRole: 'admin' },
    ],
  },
];

function canSee(userRole, minRole) {
  return (ROLE_HIERARCHY[userRole] ?? -1) >= (ROLE_HIERARCHY[minRole] ?? 999);
}

export function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  const sidebarStyle = {
    width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
    backgroundColor: 'hsl(var(--sidebar-bg))',
    color: 'hsl(var(--sidebar-fg))',
    borderColor: 'hsl(var(--sidebar-border))',
    transition: 'width 200ms ease',
  };

  const isRtl = document.documentElement.dir === 'rtl';
  const CollapseIcon = isRtl
    ? collapsed ? ChevronLeft : ChevronRight
    : collapsed ? ChevronRight : ChevronLeft;

  return (
    <aside
      className="flex-shrink-0 flex flex-col border-e overflow-hidden"
      style={sidebarStyle}
    >
      {/* Logo row */}
      <div
        className="flex items-center h-[var(--header-height)] px-4 flex-shrink-0 border-b"
        style={{ borderColor: 'hsl(var(--sidebar-border))' }}
      >
        {!collapsed && (
          <span className="font-bold text-sm tracking-tight truncate flex-1">
            {t('app.name')}
          </span>
        )}
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed((v) => !v)}
          className="ms-auto flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 flex-shrink-0 transition-colors"
        >
          <CollapseIcon className="h-4 w-4" style={{ color: 'hsl(var(--sidebar-muted-fg))' }} />
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-1">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) =>
            canSee(user?.role, item.minRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.groupKey}>
              {/* Group label */}
              {!collapsed && (
                <p
                  className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'hsl(var(--sidebar-muted-fg))' }}
                >
                  {t(group.groupKey)}
                </p>
              )}
              {collapsed && (
                <div className="my-2 mx-3 border-t" style={{ borderColor: 'hsl(var(--sidebar-border))' }} />
              )}

              {visibleItems.map((item) => {
                const Icon = ICON_MAP[item.icon];
                const active = location.pathname === item.path ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                const label = t(item.key);

                const linkStyle = {
                  backgroundColor: active ? 'hsl(var(--sidebar-active-bg))' : 'transparent',
                  color: active
                    ? 'hsl(var(--sidebar-active-fg))'
                    : 'hsl(var(--sidebar-fg))',
                };

                const content = (
                  <NavLink
                    to={item.path}
                    aria-current={active ? 'page' : undefined}
                    className="flex items-center gap-3 mx-2 px-2 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? 'hsl(var(--sidebar-active-bg))' : 'transparent',
                      color: isActive
                        ? 'hsl(var(--sidebar-active-fg))'
                        : 'hsl(var(--sidebar-fg))',
                    })}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'hsl(var(--sidebar-hover-bg))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                    {!collapsed && <span className="truncate">{label}</span>}
                  </NavLink>
                );

                if (collapsed) {
                  return (
                    <div key={item.path} title={label}>
                      {content}
                    </div>
                  );
                }

                return <div key={item.path}>{content}</div>;
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
