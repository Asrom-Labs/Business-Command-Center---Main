import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { startOfWeek, startOfMonth, startOfYear, format, formatDistanceToNow } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, Wallet, Clock, BarChart3, Package, Users,
  ShoppingCart, CheckCircle, AlertTriangle, ArrowRight,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useOrgStore } from '@/stores/orgStore';
import {
  fetchDashboardMetrics, fetchSalesByDay,
  fetchRecentOrders, fetchLowStockItems,
} from '@/api/dashboard';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
];

function getPeriodDates(period) {
  const today = format(new Date(), 'yyyy-MM-dd');

  if (period === 'today') return { from: today, to: today, chartFrom: today, chartTo: today };
  if (period === 'week') {
    const wk = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    return { from: wk, to: today, chartFrom: wk, chartTo: today };
  }
  if (period === 'year') {
    const yr = format(startOfYear(new Date()), 'yyyy-MM-dd');
    return { from: yr, to: today, chartFrom: yr, chartTo: today };
  }
  // month — let backend default for metrics, explicit for chart
  const mo = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  return { from: undefined, to: undefined, chartFrom: mo, chartTo: today };
}

function formatOrderId(id) {
  return `...${id.slice(-6).toUpperCase()}`;
}

const CHANNEL_STYLES = {
  in_store:  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  whatsapp:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  instagram: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  online:    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  other:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

// ── Skeletons ────────────────────────────────────────────────────────────────

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

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ value, label, subtext, icon: Icon, accent, index }) {
  return (
    <div
      className="bcc-card border-l-4 fade-in"
      style={{ borderLeftColor: accent, animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-2xl font-bold truncate">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        </div>
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: accent + '1a' }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

// ── Revenue Chart ────────────────────────────────────────────────────────────

function RevenueChart({ data, currency, isLoading }) {
  if (isLoading) return <ChartSkeleton />;

  const chartData = (data || []).map((item) => ({
    ...item,
    revenue: parseFloat(item.revenue) || 0,
    label: format(new Date(item.day + 'T00:00:00'), 'MMM d'),
  }));

  const isEmpty = chartData.length === 0 || chartData.every((d) => d.revenue === 0);

  return (
    <div className="bcc-card">
      <h3 className="text-base font-semibold mb-4">Revenue</h3>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
          <BarChart3 className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-sm">No revenue data for this period</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCurrency(v, currency).replace(/\.00$/, '')}
            />
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(239, 84%, 67%)"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover p-3 text-popover-foreground shadow-md text-sm">
      <p className="font-medium">{format(new Date(item.day + 'T00:00:00'), 'MMM d, yyyy')}</p>
      <p className="mt-1">Revenue: {formatCurrency(item.revenue, currency)}</p>
      <p>Orders: {item.order_count}</p>
    </div>
  );
}

// ── Recent Orders Panel ──────────────────────────────────────────────────────

function RecentOrdersPanel({ orders, currency, isLoading }) {
  return (
    <div className="bcc-card flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Recent Orders</h3>
        <Link
          to="/sales-orders"
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : !orders || orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <ShoppingCart className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-sm">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-border">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                    {formatOrderId(order.id)}
                  </span>
                  <span className="text-sm font-medium truncate">
                    {order.customer_name || 'Walk-in'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                  CHANNEL_STYLES[order.channel] || CHANNEL_STYLES.other,
                )}>
                  {(order.channel || 'other').replace('_', ' ')}
                </span>
                <span className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize',
                  `status-${order.status}`,
                )}>
                  {order.status}
                </span>
                <span className="text-sm font-medium w-24 text-right">
                  {formatCurrency(parseFloat(order.total), currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Low Stock Panel ──────────────────────────────────────────────────────────

function LowStockPanel({ items, totalCount, isLoading }) {
  return (
    <div className="bcc-card flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Low Stock</h3>
        <Link
          to="/stock"
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : !items || items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <CheckCircle className="h-10 w-10 mb-2 text-green-500 opacity-60" />
          <p className="text-sm">All stock levels healthy</p>
        </div>
      ) : (
        <>
          <div className="space-y-0 divide-y divide-border">
            {items.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.location_name}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    item.stock_on_hand === 0
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
                  )}>
                    {item.stock_on_hand} left
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Min: {item.low_stock_threshold}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {totalCount > 5 && (
            <Link
              to="/stock"
              className="mt-3 text-xs text-primary hover:underline"
            >
              and {totalCount - 5} more items...
            </Link>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const currency = useOrgStore((s) => s.currency) || 'JOD';
  const [period, setPeriod] = useState('month');

  useEffect(() => { document.title = 'Dashboard \u2014 BCC'; }, []);

  const { from, to, chartFrom, chartTo } = getPeriodDates(period);

  // ── Queries ──
  const metricsQuery = useQuery({
    queryKey: ['dashboard', 'metrics', { from, to }],
    queryFn: () => fetchDashboardMetrics(from, to),
    select: (result) => result.data,
  });

  const chartQuery = useQuery({
    queryKey: ['dashboard', 'salesByDay', { from: chartFrom, to: chartTo }],
    queryFn: () => fetchSalesByDay(chartFrom, chartTo),
    select: (result) => result.data ?? [],
  });

  const ordersQuery = useQuery({
    queryKey: ['dashboard', 'recentOrders'],
    queryFn: fetchRecentOrders,
    select: (result) => result.data ?? [],
  });

  const lowStockQuery = useQuery({
    queryKey: ['dashboard', 'lowStock'],
    queryFn: fetchLowStockItems,
    select: (result) => result.data ?? [],
  });

  const hasError = metricsQuery.isError || chartQuery.isError || ordersQuery.isError || lowStockQuery.isError;
  const metrics = metricsQuery.data;

  // ── KPI card definitions ──
  const kpiCards = metrics ? [
    {
      value: formatCurrency(parseFloat(metrics.sales.gross_revenue), currency),
      label: 'Gross Revenue',
      subtext: `${metrics.sales.order_count} orders`,
      icon: TrendingUp,
      accent: 'hsl(239, 84%, 67%)',
    },
    {
      value: formatCurrency(parseFloat(metrics.sales.collected), currency),
      label: 'Collected',
      subtext: `${formatCurrency(parseFloat(metrics.sales.outstanding), currency)} outstanding`,
      icon: Wallet,
      accent: '#22c55e',
    },
    {
      value: formatCurrency(parseFloat(metrics.sales.outstanding), currency),
      label: 'Unpaid Balance',
      subtext: 'Awaiting collection',
      icon: Clock,
      accent: parseFloat(metrics.sales.outstanding) > 0 ? '#f59e0b' : '#9ca3af',
    },
    {
      value: formatCurrency(parseFloat(metrics.profitability.gross_profit), currency),
      label: 'Gross Profit',
      subtext: `${parseFloat(metrics.profitability.gross_margin_pct).toFixed(1)}% margin`,
      icon: BarChart3,
      accent: 'hsl(239, 84%, 67%)',
    },
    {
      value: metrics.inventory.low_stock_count,
      label: 'Low Stock Items',
      subtext: `${metrics.inventory.pending_po_count} POs pending`,
      icon: Package,
      accent: metrics.inventory.low_stock_count > 0 ? '#ef4444' : '#22c55e',
    },
    {
      value: metrics.customers.new_customers,
      label: 'New Customers',
      subtext: 'This period',
      icon: Users,
      accent: 'hsl(239, 84%, 67%)',
    },
  ] : [];

  return (
    <div className="page-container">
      {/* Greeting */}
      <p className="text-xl font-semibold">
        {getGreeting()}, {user?.name?.split(' ')[0]} 👋
      </p>

      {/* Error banner */}
      {hasError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Unable to load some dashboard data. Please refresh.
          </p>
        </div>
      )}

      {/* Header row: title + period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="inline-flex rounded-lg border bg-muted p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                period === p.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricsQuery.isLoading
          ? Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)
          : kpiCards.map((card, i) => <KpiCard key={card.label} {...card} index={i} />)
        }
      </div>

      {/* Revenue Chart */}
      <RevenueChart
        data={chartQuery.data}
        currency={currency}
        isLoading={chartQuery.isLoading}
      />

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <RecentOrdersPanel
            orders={ordersQuery.data}
            currency={currency}
            isLoading={ordersQuery.isLoading}
          />
        </div>
        <div className="lg:col-span-2">
          <LowStockPanel
            items={lowStockQuery.data}
            totalCount={lowStockQuery.data?.length ?? 0}
            isLoading={lowStockQuery.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
