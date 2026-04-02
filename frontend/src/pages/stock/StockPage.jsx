import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Warehouse } from 'lucide-react';
import DataTable   from '@/components/shared/DataTable';
import PageHeader  from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import StatusBadge from '@/components/shared/StatusBadge';
import { fetchStock } from '@/api/stock';

// ── Component ───────────────────────────────────────────────────────────────
export default function StockPage() {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  useEffect(() => {
    document.title = t('stock.pageTitle');
  }, [t]);

  // ── Filter tabs (inside component — t() re-evaluates on lang change) ──
  const FILTER_TABS = [
    { key: false, label: t('stock.filters.all')      },
    { key: true,  label: t('stock.filters.lowStock') },
  ];

  const handleFilterChange = (value) => {
    setShowLowStockOnly(value);
    setPage(1);
    setSearch('');
  };

  // ── Query ──
  const stockQuery = useQuery({
    queryKey: ['stock', 'list', { page, showLowStockOnly }],
    queryFn: () => fetchStock({
      page,
      limit: 20,
      ...(showLowStockOnly ? { low_stock: true } : {}),
    }),
    select: (result) => ({
      items: result.data ?? [],
      pagination: result.pagination ?? null,
    }),
  });

  const stockItems = stockQuery.data?.items      ?? [];
  const pagination = stockQuery.data?.pagination ?? null;

  // Client-side search filter
  const filteredStock = search.trim()
    ? stockItems.filter(
        (s) =>
          s.product_name.toLowerCase().includes(search.toLowerCase()) ||
          (s.sku && s.sku.toLowerCase().includes(search.toLowerCase()))
      )
    : stockItems;

  // ── Table columns (inside component — translated labels re-evaluate) ──
  const columns = [
    {
      key: 'product',
      header: t('stock.product'),
      render: (row) => (
        <div>
          <p className="font-medium text-sm">{row.product_name}</p>
          {row.sku && (
            <p className="font-mono text-xs text-muted-foreground mt-0.5">
              {row.sku}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'location',
      header: t('stock.location'),
      render: (row) => (
        <div>
          <p className="text-sm">{row.location_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {row.branch_name}
          </p>
        </div>
      ),
    },
    {
      key: 'quantity_on_hand',
      header: t('stock.quantityOnHand'),
      render: (row) => (
        <span
          className={`text-sm font-medium tabular-nums ${
            row.is_low_stock ? 'text-destructive' : 'text-foreground'
          }`}
        >
          {row.quantity_on_hand}
        </span>
      ),
    },
    {
      key: 'low_stock_threshold',
      header: t('stock.threshold'),
      render: (row) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {row.low_stock_threshold}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row) =>
        row.is_low_stock ? (
          <StatusBadge
            status="pending"
            label={t('stock.lowStockBadge')}
          />
        ) : null,
    },
  ];

  return (
    <div className="page-container">
      {/* No action button — read-only page */}
      <PageHeader
        title={t('stock.title')}
        subtitle={t('stock.subtitle')}
      />

      {/* Filter tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={String(tab.key)}
              onClick={() => handleFilterChange(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                showLowStockOnly === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="sm:ms-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('common.search')}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {/* Error banner */}
      {stockQuery.isError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {t('stock.loadError')}
          </p>
        </div>
      )}

      {/* Data table — read-only, no actions column */}
      <DataTable
        columns={columns}
        data={filteredStock}
        isLoading={stockQuery.isLoading}
        emptyMessage={t('stock.noStock')}
        emptyIcon={Warehouse}
        pagination={
          pagination && !search
            ? {
                page,
                limit:        pagination.limit,
                total:        pagination.total,
                onPageChange: setPage,
              }
            : null
        }
      />
    </div>
  );
}
