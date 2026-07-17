import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  AlertTriangle, ChevronLeft, Eye, Loader2,
  Plus, ShoppingBag, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import ConfirmModal from '@/components/shared/ConfirmModal';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import SearchableCombobox from '@/components/shared/SearchableCombobox';
import StatusBadge from '@/components/shared/StatusBadge';
import { getAllowedSalesOrderActions } from '@/lib/salesOrderActions';
import { getAllowedTaxRates, getDefaultTaxRate } from '@/lib/constants';
import {
  createSalesOrder,
  fetchSalesOrder,
  fetchSalesOrders,
  updateSalesOrderStatus,
} from '@/api/salesOrders';
import { fetchCustomers } from '@/api/customers';
import { fetchProducts } from '@/api/products';
import { fetchLocations } from '@/api/locations';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';
import { useOrg } from '@/hooks/useOrg';
import { recordPayment } from '@/api/payments';
import { createReturn, fetchReturnReasons } from '@/api/returns';
import { useAuth } from '@/hooks/useAuth';

// ── Zod schema — header fields only (items managed by useFieldArray) ────────
const soHeaderSchema = z.object({
  location_id: z.string().min(1, 'salesOrders.errors.locationRequired'),
  customer_id: z.string().optional().or(z.literal('')),
  customer_name: z.string().optional(),
  customer_label: z.string().optional(),   // display-only label for the picked customer
  channel: z.string().optional().or(z.literal('')),
  channel_detail: z.string().optional().or(z.literal('')),
  tax_rate: z.string().optional().or(z.literal('')),
  note: z.string().optional().or(z.literal('')),
});

// Record payment form schema
const recordPaymentSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: 'payments.amountRequired' })
    .positive('payments.amountPositive'),
  method: z.string().min(1, 'payments.methodRequired'),
  note: z.string().optional(),
});

// Create return form schema (header only — items in local state)
const salesOrderReturnSchema = z.object({
  reason_id: z.string().optional(),
  note: z.string().optional(),
});

// Half-up rounding to 2dp — mirrors backend roundMoney (sales-orders.controller.js).
// The totals panel below is the frontend mirror of the backend's canonical formula.
const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const ONE_TIME = '__one_time__';

// ── Component ───────────────────────────────────────────────────────────────
export default function SalesOrdersPage() {
  // 1. Hooks
  const { t } = useTranslation();
  const { isStaff } = useAuth();
  const queryClient = useQueryClient();
  const { currency: rawCurrency } = useOrg();
  const currency = rawCurrency || 'JOD';
  const allowedTaxRates = getAllowedTaxRates(currency);
  const defaultTaxRate = getDefaultTaxRate(currency);

  // 4. State
  const [selectedId, setSelectedId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeChannel, setActiveChannel] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnItems, setReturnItems] = useState([]);
  const [isOneTimeCustomer, setIsOneTimeCustomer] = useState(false);

  // Deep link: /sales-orders?order=<id> opens that order's detail.
  // Runs once on mount; the param is stripped with replace so Back does not reopen it.
  useEffect(() => {
    const orderId = searchParams.get('order');
    if (!orderId) return;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    if (isUuid) setSelectedId(orderId);
    const next = new URLSearchParams(searchParams);
    next.delete('order');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 5. Queries
  const salesOrdersQuery = useQuery({
    queryKey: ['sales-orders', 'list', { page, activeFilter, activeChannel }],
    queryFn: () => fetchSalesOrders({
      page,
      limit: 20,
      ...(activeFilter !== 'all' ? { status: activeFilter } : {}),
      ...(activeChannel ? { channel: activeChannel } : {}),
    }),
    select: (result) => ({
      items: result.data ?? [],
      pagination: result.pagination ?? null,
    }),
  });

  const salesOrderQuery = useQuery({
    queryKey: ['sales-orders', 'detail', selectedId],
    queryFn: () => fetchSalesOrder(selectedId),
    select: (result) => result.data,
    enabled: !!selectedId,
  });

  // Customers + products are now server-searched on demand via SearchableCombobox
  // (W5.5-P2). Locations stay a small preloaded native select.
  const locationsDropdown = useQuery({
    queryKey: ['locations', 'all'],
    queryFn: () => fetchLocations({ limit: 100 }),
    select: (result) => result.data ?? [],
    staleTime: 10 * 60 * 1000,
  });

  const fetchCustomerOptions = useCallback(
    (term) => fetchCustomers({ search: term, limit: 20 }).then((r) => r.data ?? []),
    []
  );
  const fetchProductOptions = useCallback(
    (term) => fetchProducts({ search: term, limit: 20 }).then((r) => r.data ?? []),
    []
  );

  // 6. Derived values
  const soList = salesOrdersQuery.data?.items ?? [];
  const pagination = salesOrdersQuery.data?.pagination ?? null;
  const selectedSO = salesOrderQuery.data ?? null;
  const locationsList = locationsDropdown.data ?? [];

  // 7. Client-side search
  const filteredSOList = search.trim()
    ? soList.filter((so) =>
        so.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        so.location_name?.toLowerCase().includes(search.toLowerCase())
      )
    : soList;

  // 8. Filter tabs
  const FILTER_TABS = [
    { key: 'all', label: t('salesOrders.filters.all') },
    { key: 'pending', label: t('salesOrders.filters.pending') },
    { key: 'processing', label: t('salesOrders.filters.processing') },
    { key: 'shipped', label: t('salesOrders.filters.shipped') },
    { key: 'delivered', label: t('salesOrders.filters.delivered') },
    { key: 'cancelled', label: t('salesOrders.filters.cancelled') },
  ];

  // 9. Channel options
  const CHANNEL_OPTIONS = [
    { value: '', label: t('salesOrders.allChannels') },
    { value: 'walk_in', label: t('salesOrders.channels.walk_in') },
    { value: 'online', label: t('salesOrders.channels.online') },
    { value: 'phone', label: t('salesOrders.channels.phone') },
    { value: 'whatsapp', label: t('salesOrders.channels.whatsapp') },
    { value: 'instagram', label: t('salesOrders.channels.instagram') },
    { value: 'other', label: t('salesOrders.channels.other') },
  ];

  // 10-11. Handlers
  const handleFilterChange = (key) => {
    setActiveFilter(key);
    setPage(1);
    setSearch('');
  };

  const handleChannelChange = (value) => {
    setActiveChannel(value);
    setPage(1);
    setSearch('');
  };

  // 12. Status badge helper
  const getStatusBadgeProps = (status) => {
    const map = {
      pending: { status: 'pending', label: t('salesOrders.status.pending') },
      processing: { status: 'pending', label: t('salesOrders.status.processing') },
      shipped: { status: 'pending', label: t('salesOrders.status.shipped') },
      delivered: { status: 'active', label: t('salesOrders.status.delivered') },
      cancelled: { status: 'cancelled', label: t('salesOrders.status.cancelled') },
    };
    return map[status] ?? { status: 'inactive', label: status };
  };

  // 13. Channel label helper
  const getChannelLabel = (channel) => {
    if (!channel) return '—';
    return t(`salesOrders.channels.${channel}`);
  };

  // 14. Create form
  const createForm = useForm({
    resolver: zodResolver(soHeaderSchema),
    defaultValues: {
      location_id: '',
      customer_id: '',
      customer_name: '',
      customer_label: '',
      channel: '',
      channel_detail: '',
      tax_rate: String(defaultTaxRate),
      note: '',
      items: [{ product_id: '', product_name: '', quantity: 1, price: '', discount: '0' }],
    },
  });

  // Single source for resetting the create form (keeps all reset paths identical).
  const blankCreateForm = () => ({
    location_id: '', customer_id: '', customer_name: '', customer_label: '',
    channel: '', channel_detail: '', tax_rate: String(defaultTaxRate), note: '',
    items: [{ product_id: '', product_name: '', quantity: 1, price: '', discount: '0' }],
  });

  // 15. Field array
  const { fields, append, remove } = useFieldArray({
    control: createForm.control,
    name: 'items',
  });

  // 16. Mutations
  const createMutation = useMutation({
    mutationFn: (data) => createSalesOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(t('salesOrders.addSuccess'));
      setCreateModalOpen(false);
      setIsOneTimeCustomer(false);
      createForm.reset(blankCreateForm());
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateSalesOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(t('salesOrders.statusSuccess'));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => updateSalesOrderStatus(id, 'cancelled'),
    onSuccess: (_, cancelledId) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(t('salesOrders.cancelSuccess'));
      setCancelTarget(null);
      if (cancelledId === selectedId) setSelectedId(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      setCancelTarget(null);
    },
  });

  // ── Payment + Return forms ──
  const paymentForm = useForm({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: { amount: '', method: '', note: '' },
  });

  const returnForm = useForm({
    resolver: zodResolver(salesOrderReturnSchema),
    defaultValues: { reason_id: '', note: '' },
  });

  // ── Return reasons query ──
  const reasonsQuery = useQuery({
    queryKey: ['returns', 'reasons'],
    queryFn: () => fetchReturnReasons(),
    select: (result) => result.data ?? [],
    staleTime: 10 * 60 * 1000,
    enabled: isReturnOpen,
  });
  const reasonsList = reasonsQuery.data ?? [];

  // ── Payment mutation (RULE-26 OVERPAYMENT) ──
  const paymentMutation = useMutation({
    mutationFn: (data) => recordPayment(selectedId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(t('payments.recordSuccess'));
      setIsPaymentOpen(false);
      paymentForm.reset();
    },
    onError: (error) => {
      if (error?.error === 'OVERPAYMENT') {
        const match = (error?.message ?? '').match(/Remaining balance:\s*([\d.]+)/i);
        const remaining = match ? formatCurrency(parseFloat(match[1]), currency) : '';
        toast.error(t('payments.overpaymentError', { remaining }));
      } else {
        toast.error(getErrorMessage(error));
      }
    },
  });

  // ── Return mutation ──
  const returnMutation = useMutation({
    mutationFn: (data) => createReturn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(t('returns.createSuccess'));
      setIsReturnOpen(false);
      returnForm.reset();
      setReturnItems([]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // ── Payment + Return submit handlers ──
  const handleSubmitPayment = paymentForm.handleSubmit((data) => {
    paymentMutation.mutate({
      amount: Number(data.amount),
      method: data.method,
      note: data.note || undefined,
    });
  });

  const handleSubmitReturn = returnForm.handleSubmit((headerData) => {
    const items = returnItems
      .filter((ri) => Number(ri.qty) > 0)
      .map((ri) => ({
        sales_order_item_id: ri.item.id,
        quantity_returned: Number(ri.qty),
        refund_amount: Number(ri.refund) || 0,
      }));
    if (items.length === 0) {
      toast.error(t('returns.noItemsError'));
      return;
    }
    returnMutation.mutate({
      sales_order_id: selectedId,
      reason_id: headerData.reason_id || undefined,
      note: headerData.note || undefined,
      items,
    });
  });

  function openPaymentModal() {
    paymentForm.reset({ amount: '', method: '', note: '' });
    setIsPaymentOpen(true);
  }

  function openReturnModal() {
    returnForm.reset({ reason_id: '', note: '' });
    setReturnItems(
      (selectedSO?.items ?? []).map((item) => ({ item, qty: '', refund: '' }))
    );
    setIsReturnOpen(true);
  }

  // 17. Open create modal
  const openCreateModal = () => {
    createForm.reset(blankCreateForm());
    setIsOneTimeCustomer(false);
    setCreateModalOpen(true);
  };

  // 18. Create submit handler
  const onCreateSubmit = (headerData) => {
    const items = createForm.getValues('items');

    if (!items || items.length === 0) {
      toast.error(t('salesOrders.errors.itemsRequired'));
      return;
    }

    for (const item of items) {
      if (!item.product_id) {
        toast.error(t('salesOrders.errors.productRequired'));
        return;
      }
      if (!item.quantity || parseInt(item.quantity, 10) < 1) {
        toast.error(t('salesOrders.errors.quantityRequired'));
        return;
      }
      if (item.price === '' || item.price === undefined || parseFloat(item.price) < 0) {
        toast.error(t('salesOrders.errors.priceRequired'));
        return;
      }
      // Per-line discount cap (mirrors backend guard: 0 <= discount <= qty * price).
      const lineGross = parseInt(item.quantity, 10) * parseFloat(item.price || '0');
      const lineDisc = parseFloat(item.discount || '0');
      if (lineDisc < 0 || lineDisc > lineGross) {
        toast.error(t('salesOrders.errors.discountTooHigh'));
        return;
      }
    }

    const customerId = createForm.getValues('customer_id');
    const customerName = createForm.getValues('customer_name');

    const payload = {
      location_id: headerData.location_id,
      customer_id: isOneTimeCustomer ? null : customerId || null,
      ...(isOneTimeCustomer && customerName?.trim()
        ? { customer_name: customerName.trim() }
        : {}),
      channel: headerData.channel || undefined,
      ...(headerData.channel === 'other' && headerData.channel_detail?.trim()
        ? { channel_detail: headerData.channel_detail.trim() }
        : {}),
      tax_rate: parseFloat(headerData.tax_rate || String(defaultTaxRate)),
      note: headerData.note || undefined,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: parseInt(item.quantity, 10),
        price: parseFloat(item.price),
        discount: parseFloat(item.discount || '0'),
      })),
    };

    createMutation.mutate(payload);
  };

  // 19. Table columns
  const columns = [
    {
      key: 'customer',
      header: t('salesOrders.customer'),
      render: (row) => (
        <div>
          <p className="font-medium text-sm">{row.customer_name || '—'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{row.location_name}</p>
        </div>
      ),
    },
    {
      key: 'channel',
      header: t('salesOrders.channel'),
      render: (row) => (
        <span className="text-sm text-muted-foreground">{getChannelLabel(row.channel)}</span>
      ),
    },
    {
      key: 'total',
      header: t('salesOrders.total'),
      render: (row) => (
        <div>
          <p className="text-sm font-medium tabular-nums">{formatCurrency(parseFloat(row.total), currency)}</p>
          {parseFloat(row.amount_paid) > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
              {t('salesOrders.amountPaid')}:&nbsp;{formatCurrency(parseFloat(row.amount_paid), currency)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row) => {
        const { status, label } = getStatusBadgeProps(row.status);
        return <StatusBadge status={status} label={label} />;
      },
    },
    {
      key: 'view',
      header: '',
      className: 'text-end w-20',
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(row.id)} aria-label={t('common.view')}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // 20. document.title
  useEffect(() => {
    document.title = t('salesOrders.pageTitle');
  }, [t]);

  // 21. JSX
  return (
    <div className="page-container">

      {/* ═══ LIST VIEW ═══ */}
      {!selectedId && (
        <>
          <PageHeader
            title={t('salesOrders.title')}
            subtitle={t('salesOrders.subtitle')}
            action={
              isStaff ? (
                <Button onClick={openCreateModal}>
                  <Plus className="h-4 w-4 me-2" />
                  {t('salesOrders.newOrder')}
                </Button>
              ) : null
            }
          />

          {/* Row 1: Status filter tabs */}
          <div className="flex gap-1 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleFilterChange(tab.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeFilter === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Row 2: Channel dropdown + Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={activeChannel}
              onChange={(e) => handleChannelChange(e.target.value)}
              className="border rounded-md ps-3 pe-8 py-2 text-sm bg-background text-foreground w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CHANNEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="sm:ms-auto">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('common.search')}
                className="w-full sm:w-64"
              />
            </div>
          </div>

          {salesOrdersQuery.isError && (
            <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t('salesOrders.loadError')}</p>
            </div>
          )}

          <DataTable
            columns={columns}
            data={filteredSOList}
            isLoading={salesOrdersQuery.isLoading}
            emptyMessage={t('salesOrders.noOrders')}
            emptyIcon={ShoppingBag}
            pagination={
              pagination && !search
                ? { page, limit: pagination.limit, total: pagination.total, onPageChange: setPage }
                : null
            }
          />
        </>
      )}

      {/* ═══ DETAIL VIEW ═══ */}
      {!!selectedId && (
        <>
          <div>
            <Button variant="ghost" onClick={() => setSelectedId(null)} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              {t('salesOrders.backToList')}
            </Button>
          </div>

          {salesOrderQuery.isLoading && (
            <div className="space-y-4">
              <div className="h-36 animate-pulse bg-muted rounded-lg" />
              <div className="h-52 animate-pulse bg-muted rounded-lg" />
            </div>
          )}

          {salesOrderQuery.isError && (
            <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t('salesOrders.loadError')}</p>
            </div>
          )}

          {selectedSO && (
            <>
              {/* Order header card */}
              <div className="bcc-card space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{t('salesOrders.orderDetails')}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('salesOrders.createdBy')}:&nbsp;{selectedSO.user_name}&nbsp;·&nbsp;{formatDate(new Date(selectedSO.created_at))}
                    </p>
                  </div>
                  {(() => {
                    const { status, label } = getStatusBadgeProps(selectedSO.status);
                    return <StatusBadge status={status} label={label} />;
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('salesOrders.customer')}</p>
                    <p className="text-sm font-medium mt-1">{selectedSO.customer_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('salesOrders.location')}</p>
                    <p className="text-sm font-medium mt-1">{selectedSO.location_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('salesOrders.channel')}</p>
                    <p className="text-sm font-medium mt-1">
                      {getChannelLabel(selectedSO.channel)}
                      {selectedSO.channel === 'other' && selectedSO.channel_detail ? ` — ${selectedSO.channel_detail}` : ''}
                    </p>
                  </div>
                </div>

                {selectedSO.note && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('salesOrders.note')}</p>
                    <p className="text-sm mt-1">{selectedSO.note}</p>
                  </div>
                )}

                {/* Payment summary */}
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">{t('salesOrders.paymentSummary')}</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('salesOrders.total')}</p>
                      <p className="text-sm font-semibold mt-1 tabular-nums">{formatCurrency(parseFloat(selectedSO.total), currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('salesOrders.amountPaid')}</p>
                      <p className="text-sm font-semibold mt-1 tabular-nums text-green-600 dark:text-green-400">
                        {formatCurrency(parseFloat(selectedSO.amount_paid), currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('salesOrders.remaining')}</p>
                      <p className={`text-sm font-semibold mt-1 tabular-nums ${
                        parseFloat(selectedSO.total) - parseFloat(selectedSO.amount_paid) > 0
                          ? 'text-destructive'
                          : 'text-foreground'
                      }`}>
                        {formatCurrency(parseFloat(selectedSO.total) - parseFloat(selectedSO.amount_paid), currency)}
                      </p>
                    </div>
                  </div>
                  {parseFloat(selectedSO.amount_paid) < parseFloat(selectedSO.total) && (
                    <p className="text-xs text-muted-foreground mt-3 italic">{t('salesOrders.paymentsWillAppearHere')}</p>
                  )}
                </div>
              </div>

              {/* Line items table */}
              <div className="bcc-card">
                <h3 className="text-sm font-semibold mb-4">{t('salesOrders.items')}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="pb-2 text-start font-medium">{t('salesOrders.product')}</th>
                        <th className="pb-2 text-end font-medium">{t('salesOrders.quantity')}</th>
                        <th className="pb-2 text-end font-medium">{t('salesOrders.unitPrice')}</th>
                        <th className="pb-2 text-end font-medium">{t('salesOrders.lineDiscount')}</th>
                        <th className="pb-2 text-end font-medium">{t('salesOrders.lineTotal')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedSO.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 font-medium">{item.product_name}</td>
                          <td className="py-3 text-end tabular-nums">{item.quantity}</td>
                          <td className="py-3 text-end tabular-nums">{formatCurrency(parseFloat(item.price), currency)}</td>
                          <td className="py-3 text-end tabular-nums text-muted-foreground">
                            {parseFloat(item.discount) > 0 ? `-${formatCurrency(parseFloat(item.discount), currency)}` : '—'}
                          </td>
                          <td className="py-3 text-end tabular-nums font-medium">
                            {formatCurrency(parseFloat(item.price) * item.quantity - parseFloat(item.discount), currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td colSpan={4} className="pt-3 text-end text-muted-foreground pe-4">{t('salesOrders.subtotal')}</td>
                        <td className="pt-3 text-end tabular-nums">{formatCurrency(parseFloat(selectedSO.subtotal), currency)}</td>
                      </tr>
                      {parseFloat(selectedSO.discount) > 0 && (
                        <tr>
                          <td colSpan={4} className="pt-1 text-end text-muted-foreground pe-4">{t('salesOrders.discount')}</td>
                          <td className="pt-1 text-end tabular-nums text-muted-foreground">
                            -{formatCurrency(parseFloat(selectedSO.discount), currency)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={4} className="pt-1 text-end text-muted-foreground pe-4">
                          {t('salesOrders.taxAmount')}
                          {selectedSO.tax_rate != null ? ` (${parseFloat(selectedSO.tax_rate)}%)` : ''}
                        </td>
                        <td className="pt-1 text-end tabular-nums">{formatCurrency(parseFloat(selectedSO.tax), currency)}</td>
                      </tr>
                      <tr className="border-t">
                        <td colSpan={4} className="pt-3 text-end font-semibold pe-4">{t('salesOrders.total')}</td>
                        <td className="pt-3 text-end font-semibold tabular-nums">{formatCurrency(parseFloat(selectedSO.total), currency)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Action rows — driven by the status→action matrix (mirrors backend guards,
                  src/lib/salesOrderActions.js). Primary/affirmative action is LAST in each
                  row (button-order convention); destructive Cancel keeps its styling left. */}
              {isStaff && (() => {
                const actions = getAllowedSalesOrderActions(selectedSO);
                const transitionLabelKey = { processing: 'process', shipped: 'ship', delivered: 'deliver' };
                return (
                  <>
                    {(actions.canCancel || actions.canTransitionTo.length > 0) && (
                      <div className="flex flex-wrap gap-3">
                        {actions.canCancel && (
                          <Button
                            variant="outline"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                            onClick={() => setCancelTarget(selectedSO)}
                            disabled={cancelMutation.isPending}
                          >
                            {t('salesOrders.actions.cancel')}
                          </Button>
                        )}
                        {actions.canTransitionTo.map((target) => (
                          <Button
                            key={target}
                            onClick={() => statusMutation.mutate({ id: selectedSO.id, status: target })}
                            disabled={statusMutation.isPending}
                          >
                            {statusMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                            {t(`salesOrders.actions.${transitionLabelKey[target] || target}`)}
                          </Button>
                        ))}
                      </div>
                    )}
                    {(actions.canCreateReturn || actions.canRecordPayment) && (
                      <div className="flex flex-wrap gap-3">
                        {actions.canCreateReturn && (
                          <Button variant="outline" onClick={openReturnModal} disabled={paymentMutation.isPending || returnMutation.isPending}>
                            {t('returns.createReturnTitle')}
                          </Button>
                        )}
                        {actions.canRecordPayment && (
                          <Button onClick={openPaymentModal} disabled={paymentMutation.isPending || returnMutation.isPending}>
                            {t('payments.recordPayment')}
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Cancel confirmation modal */}
              <ConfirmModal
                isOpen={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                onConfirm={() => cancelMutation.mutate(cancelTarget.id)}
                title={t('salesOrders.cancelOrder')}
                message={t('salesOrders.cancelConfirm')}
                confirmLabel={t('salesOrders.cancelOrder')}
                confirmVariant="destructive"
                isLoading={cancelMutation.isPending}
              />
            </>
          )}
        </>
      )}

      {/* ═══ RECORD PAYMENT MODAL ═══ */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('payments.recordPaymentTitle')}</DialogTitle>
            <DialogDescription className="sr-only">{t('payments.recordPaymentDescription')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <div>
              <Label htmlFor="pay_amount">{t('payments.amount')}</Label>
              <Input id="pay_amount" type="number" min="0.01" step="0.01" {...paymentForm.register('amount')} className="mt-1" />
              {paymentForm.formState.errors.amount && (
                <p className="field-error" role="alert">{t(paymentForm.formState.errors.amount.message)}</p>
              )}
            </div>
            <div>
              <Label htmlFor="pay_method">{t('payments.method')}</Label>
              <select id="pay_method" {...paymentForm.register('method')} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="">{t('payments.selectMethod')}</option>
                <option value="cash">{t('payments.methods.cash')}</option>
                <option value="card">{t('payments.methods.card')}</option>
                <option value="bank_transfer">{t('payments.methods.bank_transfer')}</option>
                <option value="credit">{t('payments.methods.credit')}</option>
                <option value="store_credit">{t('payments.methods.store_credit')}</option>
                <option value="other">{t('payments.methods.other')}</option>
              </select>
              {paymentForm.formState.errors.method && (
                <p className="field-error" role="alert">{t(paymentForm.formState.errors.method.message)}</p>
              )}
            </div>
            <div>
              <Label htmlFor="pay_note">{t('payments.note')}</Label>
              <textarea id="pay_note" rows={2} {...paymentForm.register('note')} className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)} disabled={paymentMutation.isPending}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={paymentMutation.isPending}>
                {paymentMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {t('payments.recordPayment')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE RETURN MODAL ═══ */}
      <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('returns.createReturnTitle')}</DialogTitle>
            <DialogDescription className="sr-only">{t('returns.createReturnDescription')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitReturn} className="space-y-4">
            <div>
              <Label htmlFor="so_return_reason">{t('returns.selectReasonLabel')}</Label>
              <select id="so_return_reason" {...returnForm.register('reason_id')} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="">{t('returns.selectReasonPlaceholder')}</option>
                {reasonsList.map((r) => (
                  <option key={r.id} value={r.id}>{r.reason}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="so_return_note">{t('returns.note')}</Label>
              <textarea id="so_return_note" rows={2} {...returnForm.register('note')} className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none" />
            </div>
            <div>
              <Label>{t('returns.returnItemsLabel')}</Label>
              <div className="mt-2 divide-y divide-border rounded-md border">
                {returnItems.map((ri, index) => (
                  <div key={ri.item.id} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ri.item.product_name}</p>
                      <p className="text-xs text-muted-foreground">{t('returns.orderedQty', { qty: ri.item.quantity })}</p>
                    </div>
                    <div className="w-24 flex-shrink-0">
                      <Label className="text-xs text-muted-foreground mb-1 block">{t('returns.quantityReturnedLabel')}</Label>
                      <Input type="number" min="0" max={ri.item.quantity} value={ri.qty} onChange={(e) => { const u = [...returnItems]; u[index] = { ...ri, qty: e.target.value }; setReturnItems(u); }} />
                    </div>
                    <div className="w-28 flex-shrink-0">
                      <Label className="text-xs text-muted-foreground mb-1 block">{t('returns.refundAmountLabel')}</Label>
                      <Input type="number" min="0" step="0.01" value={ri.refund} onChange={(e) => { const u = [...returnItems]; u[index] = { ...ri, refund: e.target.value }; setReturnItems(u); }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsReturnOpen(false)} disabled={returnMutation.isPending}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={returnMutation.isPending}>
                {returnMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {t('returns.createReturn')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE SO MODAL — outside both view blocks ═══ */}
      <Dialog
        open={createModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateModalOpen(false);
            setIsOneTimeCustomer(false);
            createForm.reset(blankCreateForm());
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('salesOrders.createOrder')}</DialogTitle>
            <DialogDescription className="sr-only">{t('salesOrders.createDescription')}</DialogDescription>
          </DialogHeader>

          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6 pt-2">

            {/* ── Section 1: Customer & Channel ── */}
            <section className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Location — required */}
                <div className="space-y-1.5">
                  <Label htmlFor="so-location">{t('salesOrders.location')}</Label>
                  <select
                    id="so-location"
                    {...createForm.register('location_id')}
                    className="w-full border rounded-md ps-3 pe-8 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">{t('salesOrders.selectLocation')}</option>
                    {locationsList.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  {createForm.formState.errors.location_id && (
                    <p className="field-error" role="alert">{t(createForm.formState.errors.location_id.message)}</p>
                  )}
                </div>

                {/* Customer — searchable combobox with pinned one-time sentinel */}
                <div className="space-y-1.5">
                  <Label>{t('salesOrders.customer')}</Label>
                  <SearchableCombobox
                    name="so-customer"
                    value={isOneTimeCustomer ? ONE_TIME : (createForm.watch('customer_id') || '')}
                    selectedLabel={isOneTimeCustomer ? t('salesOrders.oneTimeCustomer') : createForm.watch('customer_label')}
                    placeholder={t('salesOrders.selectCustomer')}
                    fetchOptions={fetchCustomerOptions}
                    getOptionValue={(o) => o.id}
                    getOptionLabel={(o) => o.name}
                    pinnedOptions={[{ id: ONE_TIME, name: t('salesOrders.oneTimeCustomer') }]}
                    onSelect={(opt) => {
                      if (opt.id === ONE_TIME) {
                        setIsOneTimeCustomer(true);
                        createForm.setValue('customer_id', '', { shouldDirty: true });
                        createForm.setValue('customer_label', '');
                      } else {
                        setIsOneTimeCustomer(false);
                        createForm.setValue('customer_id', opt.id, { shouldDirty: true });
                        createForm.setValue('customer_label', opt.name);
                        createForm.setValue('customer_name', '');
                      }
                    }}
                    onClear={() => {
                      setIsOneTimeCustomer(false);
                      createForm.setValue('customer_id', '', { shouldDirty: true });
                      createForm.setValue('customer_label', '');
                      createForm.setValue('customer_name', '');
                    }}
                  />
                  {isOneTimeCustomer && (
                    <input
                      type="text"
                      placeholder={t('salesOrders.oneTimeCustomerName')}
                      {...createForm.register('customer_name')}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Channel */}
                <div className="space-y-1.5">
                  <Label htmlFor="so-channel">{t('salesOrders.channel')}</Label>
                  <select
                    id="so-channel"
                    {...createForm.register('channel', {
                      onChange: (e) => { if (e.target.value !== 'other') createForm.setValue('channel_detail', ''); },
                    })}
                    className="w-full border rounded-md ps-3 pe-8 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">{t('salesOrders.selectChannel')}</option>
                    {CHANNEL_OPTIONS.filter((o) => o.value !== '').map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                {/* Channel detail — only when channel is 'other' */}
                {createForm.watch('channel') === 'other' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="so-channel-detail">{t('salesOrders.channelDetail')}</Label>
                    <Input
                      id="so-channel-detail"
                      maxLength={100}
                      placeholder={t('salesOrders.channelDetailPlaceholder')}
                      {...createForm.register('channel_detail')}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* ── Section 2: Items ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('salesOrders.items')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', product_name: '', quantity: 1, price: '', discount: '0' })}>
                  <Plus className="h-4 w-4 me-1" />
                  {t('salesOrders.addItem')}
                </Button>
              </div>

              {fields.map((field, index) => {
                const q = parseFloat(createForm.watch(`items.${index}.quantity`) || '0');
                const pr = parseFloat(createForm.watch(`items.${index}.price`) || '0');
                const disc = parseFloat(createForm.watch(`items.${index}.discount`) || '0');
                const lineGross = q * pr;
                const overDiscount = disc > lineGross;
                const lineTotal = roundMoney(lineGross - (overDiscount ? 0 : disc));
                return (
                  <div key={field.id} className="rounded-lg border p-3 space-y-2">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-12 sm:col-span-5 space-y-1">
                        <Label className="text-xs">{t('salesOrders.product')}</Label>
                        <SearchableCombobox
                          name={`so-item-${index}`}
                          value={createForm.watch(`items.${index}.product_id`) || ''}
                          selectedLabel={createForm.watch(`items.${index}.product_name`)}
                          placeholder={t('salesOrders.selectProduct')}
                          fetchOptions={fetchProductOptions}
                          getOptionValue={(o) => o.id}
                          getOptionLabel={(o) => (o.sku ? `${o.name} · ${o.sku}` : o.name)}
                          onSelect={(opt) => {
                            createForm.setValue(`items.${index}.product_id`, opt.id, { shouldDirty: true });
                            createForm.setValue(`items.${index}.product_name`, opt.name);
                            createForm.setValue(`items.${index}.price`, String(parseFloat(opt.price ?? 0)));
                          }}
                          onClear={() => {
                            createForm.setValue(`items.${index}.product_id`, '', { shouldDirty: true });
                            createForm.setValue(`items.${index}.product_name`, '');
                          }}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <Label className="text-xs">{t('salesOrders.quantity')}</Label>
                        <Input type="number" min="1" step="1" {...createForm.register(`items.${index}.quantity`)} className="text-end" />
                      </div>
                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <Label className="text-xs">{t('salesOrders.unitPrice')}</Label>
                        <Input type="number" min="0" step="0.01" {...createForm.register(`items.${index}.price`)} className="text-end" />
                      </div>
                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <Label className="text-xs">{t('salesOrders.lineDiscount')}</Label>
                        <Input
                          type="number" min="0" step="0.01"
                          {...createForm.register(`items.${index}.discount`)}
                          className={`text-end ${overDiscount ? 'border-destructive' : ''}`}
                        />
                      </div>
                      <div className="col-span-12 sm:col-span-1 flex justify-end">
                        <Button
                          type="button" variant="ghost" size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          aria-label={t('salesOrders.removeItem')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      {overDiscount
                        ? <span className="text-destructive">{t('salesOrders.errors.discountTooHigh')}</span>
                        : <span />}
                      <span className="text-muted-foreground tabular-nums">
                        {t('salesOrders.lineTotal')}: {formatCurrency(lineTotal, currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* ── Section 3: Notes ── */}
            <section className="space-y-1.5">
              <Label htmlFor="so-note">{t('salesOrders.note')}</Label>
              <Input id="so-note" {...createForm.register('note')} placeholder={t('salesOrders.notePlaceholder')} />
            </section>

            {/* ── Section 4: Totals (live mirror of the backend canonical formula) ── */}
            {(() => {
              const items = createForm.watch('items') || [];
              let subtotal = 0, lineDiscounts = 0;
              for (const it of items) {
                const q = parseFloat(it.quantity || '0');
                const pr = parseFloat(it.price || '0');
                const d = parseFloat(it.discount || '0');
                const gross = roundMoney(q * pr);
                subtotal = roundMoney(subtotal + gross);
                if (d >= 0 && d <= gross) lineDiscounts = roundMoney(lineDiscounts + d);
              }
              const rate = parseFloat(createForm.watch('tax_rate') || String(defaultTaxRate));
              const taxableBase = roundMoney(subtotal - lineDiscounts);
              const taxAmount = roundMoney(taxableBase * rate / 100);
              const grandTotal = roundMoney(taxableBase + taxAmount);
              return (
                <section className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('salesOrders.subtotal')}</span>
                    <span className="tabular-nums">{formatCurrency(subtotal, currency)}</span>
                  </div>
                  {lineDiscounts > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('salesOrders.lineDiscounts')}</span>
                      <span className="tabular-nums text-muted-foreground">-{formatCurrency(lineDiscounts, currency)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('salesOrders.taxRate')}</span>
                    <select
                      {...createForm.register('tax_rate')}
                      aria-label={t('salesOrders.taxRate')}
                      className="border rounded-md ps-2 pe-6 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {allowedTaxRates.map((r) => (<option key={r} value={String(r)}>{r}%</option>))}
                    </select>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('salesOrders.taxAmount')}</span>
                    <span className="tabular-nums">{formatCurrency(taxAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>{t('salesOrders.grandTotal')}</span>
                    <span className="tabular-nums">{formatCurrency(grandTotal, currency)}</span>
                  </div>
                </section>
              );
            })()}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateModalOpen(false);
                  setIsOneTimeCustomer(false);
                  createForm.reset(blankCreateForm());
                }}
                disabled={createMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {t('salesOrders.createOrder')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
