import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import StatusBadge from '@/components/shared/StatusBadge';
import { fetchSalesOrders } from '@/api/salesOrders';
import { useOrg } from '@/hooks/useOrg';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';

function derivePaymentStatus(order) {
  const total = parseFloat(order.total || '0');
  const paid = parseFloat(order.amount_paid || '0');
  const remaining = total - paid;
  if (remaining <= 0) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
}

export default function PaymentsPage() {
  const [activeFilter, setActiveFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currency: rawCurrency } = useOrg();
  const currency = rawCurrency || 'JOD';

  useEffect(() => {
    document.title = t('payments.pageTitle');
  }, [t]);

  const FILTER_TABS = [
    { value: '', label: t('payments.filter.all') },
    { value: 'unpaid', label: t('payments.filter.unpaid') },
    { value: 'partial', label: t('payments.filter.partial') },
    { value: 'paid', label: t('payments.filter.paid') },
  ];

  const ordersQuery = useQuery({
    queryKey: ['payments', 'orders', { page }],
    queryFn: () => fetchSalesOrders({ page, limit: 20 }),
    select: (result) => ({
      items: result.data ?? [],
      pagination: result.pagination ?? null,
    }),
  });

  const allItems = ordersQuery.data?.items ?? [];
  const pagination = ordersQuery.data?.pagination ?? null;

  const itemsWithStatus = allItems.map((order) => ({
    ...order,
    paymentStatus: derivePaymentStatus(order),
  }));

  const filteredByStatus = activeFilter
    ? itemsWithStatus.filter((o) => o.paymentStatus === activeFilter)
    : itemsWithStatus;

  const filteredItems = search.trim()
    ? filteredByStatus.filter((o) =>
        (o.customer_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (o.id ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : filteredByStatus;

  const columns = [
    {
      key: 'id',
      header: t('payments.columns.order'),
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">{row.id.slice(0, 8)}…</span>
      ),
    },
    {
      key: 'customer_name',
      header: t('payments.columns.customer'),
      render: (row) => <span className="font-medium">{row.customer_name ?? '—'}</span>,
    },
    {
      key: 'total',
      header: t('payments.columns.total'),
      render: (row) => <span>{formatCurrency(parseFloat(row.total || '0'), currency)}</span>,
    },
    {
      key: 'amount_paid',
      header: t('payments.columns.paid'),
      render: (row) => (
        <span className="font-medium text-foreground">
          {formatCurrency(parseFloat(row.amount_paid || '0'), currency)}
        </span>
      ),
    },
    {
      key: 'remaining',
      header: t('payments.columns.remaining'),
      render: (row) => {
        const remaining = parseFloat(row.total || '0') - parseFloat(row.amount_paid || '0');
        return (
          <span className={remaining > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
            {formatCurrency(remaining < 0 ? 0 : remaining, currency)}
          </span>
        );
      },
    },
    {
      key: 'paymentStatus',
      header: t('payments.columns.status'),
      render: (row) => (
        <StatusBadge
          status={row.paymentStatus === 'paid' ? 'active' : row.paymentStatus === 'partial' ? 'pending' : 'cancelled'}
          label={t(`payments.status.${row.paymentStatus}`)}
        />
      ),
    },
    {
      key: 'created_at',
      header: t('payments.columns.date'),
      render: (row) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-end w-28',
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => navigate('/sales-orders')}>
          {t('payments.viewOrder')}
        </Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader title={t('payments.title')} subtitle={t('payments.subtitle')} />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setActiveFilter(tab.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeFilter === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="sm:ms-auto">
          <SearchInput value={search} onChange={setSearch} placeholder={t('common.search')} className="w-full sm:w-64" />
        </div>
      </div>

      {ordersQuery.isError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{getErrorMessage(ordersQuery.error)}</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredItems}
        isLoading={ordersQuery.isLoading}
        emptyMessage={t('payments.noOrders')}
        emptyIcon={CreditCard}
        pagination={
          pagination && !search.trim()
            ? { page, limit: pagination.limit, total: pagination.total, onPageChange: setPage }
            : null
        }
      />
    </div>
  );
}
