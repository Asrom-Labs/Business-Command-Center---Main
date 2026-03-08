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
      { label: 'Dashboard',   path: '/dashboard', icon: 'LayoutDashboard', visibleTo: 'readonly' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Sales Orders',    path: '/sales-orders',    icon: 'ShoppingCart',   visibleTo: 'staff' },
      { label: 'Purchase Orders', path: '/purchase-orders', icon: 'PackageOpen',    visibleTo: 'staff' },
      { label: 'Payments',        path: '/payments',        icon: 'CreditCard',     visibleTo: 'staff' },
      { label: 'Returns',         path: '/returns',         icon: 'Undo2',          visibleTo: 'staff' },
      { label: 'Stock Transfers', path: '/transfers',       icon: 'ArrowLeftRight', visibleTo: 'staff' },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { label: 'Products',  path: '/products',  icon: 'Box',       visibleTo: 'readonly' },
      { label: 'Stock',     path: '/stock',     icon: 'Warehouse', visibleTo: 'readonly' },
      { label: 'Suppliers', path: '/suppliers', icon: 'Truck',     visibleTo: 'readonly' },
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
      { label: 'Expenses', path: '/expenses', icon: 'Receipt',   visibleTo: 'staff' },
      { label: 'Reports',  path: '/reports',  icon: 'BarChart2', visibleTo: 'staff' },
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
