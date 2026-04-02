import { useState, useEffect } from 'react';
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
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import ConfirmModal from '@/components/shared/ConfirmModal';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import StatusBadge from '@/components/shared/StatusBadge';
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

// ── Zod schema — header fields only (items managed by useFieldArray) ────────
const soHeaderSchema = z.object({
  location_id: z.string().min(1, 'salesOrders.errors.locationRequired'),
  customer_id: z.string().optional().or(z.literal('')),
  customer_name: z.string().optional(),
  channel: z.string().optional().or(z.literal('')),
  discount: z.string().optional().or(z.literal('')),
  tax: z.string().optional().or(z.literal('')),
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

// ── Component ───────────────────────────────────────────────────────────────
export default function SalesOrdersPage() {
  // 1. Hooks
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { currency: rawCurrency } = useOrg();
  const currency = rawCurrency || 'JOD';

  // 4. State
  const [selectedId, setSelectedId] = useState(null);
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

  const customersDropdown = useQuery({
    queryKey: ['customers', 'dropdown'],
    queryFn: () => fetchCustomers({ limit: 200 }),
    select: (result) => result.data ?? [],
    staleTime: 10 * 60 * 1000,
    enabled: createModalOpen,
  });

  const locationsDropdown = useQuery({
    queryKey: ['locations', 'all'],
    queryFn: () => fetchLocations({ limit: 200 }),
    select: (result) => result.data ?? [],
    staleTime: 10 * 60 * 1000,
  });

  const productsDropdown = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => fetchProducts({ limit: 200 }),
    select: (result) => result.data ?? [],
    staleTime: 10 * 60 * 1000,
  });

  // 6. Derived values
  const soList = salesOrdersQuery.data?.items ?? [];
  const pagination = salesOrdersQuery.data?.pagination ?? null;
  const selectedSO = salesOrderQuery.data ?? null;
  const customersList = customersDropdown.data ?? [];
  const locationsList = locationsDropdown.data ?? [];
  const productsList = productsDropdown.data ?? [];

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
      channel: '',
      discount: '0',
      tax: '0',
      note: '',
      items: [{ product_id: '', quantity: 1, price: '' }],
    },
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
      toast.success(t('salesOrders.addSuccess'));
      setCreateModalOpen(false);
      setIsOneTimeCustomer(false);
      createForm.reset({
        location_id: '', customer_id: '', customer_name: '', channel: '',
        discount: '0', tax: '0', note: '',
        items: [{ product_id: '', quantity: 1, price: '' }],
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateSalesOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      toast.success(t('salesOrders.statusSuccess'));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => updateSalesOrderStatus(id, 'cancelled'),
    onSuccess: (_, cancelledId) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
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
    createForm.reset({
      location_id: '', customer_id: '', customer_name: '', channel: '',
      discount: '0', tax: '0', note: '',
      items: [{ product_id: '', quantity: 1, price: '' }],
    });
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
      discount: parseFloat(headerData.discount || '0'),
      tax: parseFloat(headerData.tax || '0'),
      note: headerData.note || undefined,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: parseInt(item.quantity, 10),
        price: parseFloat(item.price),
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
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 me-2" />
                {t('salesOrders.newOrder')}
              </Button>
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
                    <p className="text-sm font-medium mt-1">{getChannelLabel(selectedSO.channel)}</p>
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
                        <th className="pb-2 text-end font-medium">{t('salesOrders.lineTotal')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedSO.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 font-medium">{item.product_name}</td>
                          <td className="py-3 text-end tabular-nums">{item.quantity}</td>
                          <td className="py-3 text-end tabular-nums">{formatCurrency(parseFloat(item.price), currency)}</td>
                          <td className="py-3 text-end tabular-nums font-medium">
                            {formatCurrency(parseFloat(item.price) * item.quantity - parseFloat(item.discount), currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      {parseFloat(selectedSO.discount) > 0 && (
                        <tr className="border-t">
                          <td colSpan={3} className="pt-2 text-end text-muted-foreground pe-4">{t('salesOrders.discount')}</td>
                          <td className="pt-2 text-end tabular-nums text-muted-foreground">
                            -{formatCurrency(parseFloat(selectedSO.discount), currency)}
                          </td>
                        </tr>
                      )}
                      <tr className="border-t">
                        <td colSpan={3} className="pt-3 text-end font-semibold pe-4">{t('salesOrders.total')}</td>
                        <td className="pt-3 text-end font-semibold tabular-nums">{formatCurrency(parseFloat(selectedSO.total), currency)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Status action buttons */}
              {selectedSO.status !== 'delivered' && selectedSO.status !== 'cancelled' && (
                <div className="flex flex-wrap gap-3">
                  {selectedSO.status === 'pending' && (
                    <Button
                      onClick={() => statusMutation.mutate({ id: selectedSO.id, status: 'processing' })}
                      disabled={statusMutation.isPending}
                    >
                      {statusMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                      {t('salesOrders.actions.process')}
                    </Button>
                  )}
                  {selectedSO.status === 'processing' && (
                    <Button
                      onClick={() => statusMutation.mutate({ id: selectedSO.id, status: 'shipped' })}
                      disabled={statusMutation.isPending}
                    >
                      {statusMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                      {t('salesOrders.actions.ship')}
                    </Button>
                  )}
                  {selectedSO.status === 'shipped' && (
                    <Button
                      onClick={() => statusMutation.mutate({ id: selectedSO.id, status: 'delivered' })}
                      disabled={statusMutation.isPending}
                    >
                      {statusMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                      {t('salesOrders.actions.deliver')}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                    onClick={() => setCancelTarget(selectedSO)}
                    disabled={cancelMutation.isPending}
                  >
                    {t('salesOrders.actions.cancel')}
                  </Button>
                </div>
              )}

              {/* Record Payment + Create Return buttons */}
              <div className="flex flex-wrap gap-3">
                {parseFloat(selectedSO?.total || '0') - parseFloat(selectedSO?.amount_paid || '0') > 0 && (
                  <Button onClick={openPaymentModal} disabled={paymentMutation.isPending || returnMutation.isPending}>
                    {t('payments.recordPayment')}
                  </Button>
                )}
                {selectedSO?.status === 'delivered' && (
                  <Button variant="outline" onClick={openReturnModal} disabled={paymentMutation.isPending || returnMutation.isPending}>
                    {t('returns.createReturnTitle')}
                  </Button>
                )}
              </div>

              {/* Cancel confirmation modal */}
              <ConfirmModal
                isOpen={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                onConfirm={() => cancelMutation.mutate(cancelTarget.id)}
                title={t('salesOrders.cancelOrder')}
                message={t('salesOrders.cancelConfirm')}
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
            createForm.reset({
              location_id: '', customer_id: '', customer_name: '', channel: '',
              discount: '0', tax: '0', note: '',
              items: [{ product_id: '', quantity: 1, price: '' }],
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('salesOrders.createOrder')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-5 pt-2">
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

            {/* Customer + Channel */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">
                  {t('salesOrders.customer')}
                </label>

                <select
                  {...createForm.register('customer_id', {
                    onChange: (e) => {
                      const val = e.target.value;
                      if (val === '__one_time__') {
                        setIsOneTimeCustomer(true);
                        createForm.setValue('customer_id', '',
                          { shouldDirty: true, shouldTouch: true });
                      } else {
                        setIsOneTimeCustomer(false);
                        createForm.setValue('customer_id', val,
                          { shouldDirty: true, shouldTouch: true });
                        createForm.setValue('customer_name', '');
                      }
                    },
                  })}
                  className="flex h-9 w-full rounded-md border border-input
                             bg-transparent px-3 py-1 text-sm shadow-sm mt-1"
                >
                  <option value="">{t('salesOrders.selectCustomer')}</option>
                  <option value="__one_time__">
                    {t('salesOrders.oneTimeCustomer')}
                  </option>
                  <option disabled value="">──────────</option>
                  {customersList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {isOneTimeCustomer && (
                  <input
                    type="text"
                    placeholder={t('salesOrders.oneTimeCustomerName')}
                    {...createForm.register('customer_name')}
                    className="flex h-9 w-full rounded-md border border-input
                               bg-transparent px-3 py-1 text-sm shadow-sm mt-2"
                  />
                )}

                {createForm.formState.errors.customer_id && (
                  <p className="text-destructive text-xs mt-1">
                    {t(createForm.formState.errors.customer_id.message)}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="so-channel">{t('salesOrders.channel')}</Label>
                <select
                  id="so-channel"
                  {...createForm.register('channel')}
                  className="w-full border rounded-md ps-3 pe-8 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{t('salesOrders.selectChannel')}</option>
                  {CHANNEL_OPTIONS.filter((o) => o.value !== '').map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Discount + Tax + Note */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="so-discount">{t('salesOrders.discount')}</Label>
                <Input id="so-discount" type="number" min="0" step="0.01" {...createForm.register('discount')} className="text-end" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="so-tax">{t('salesOrders.tax')}</Label>
                <Input id="so-tax" type="number" min="0" step="0.01" {...createForm.register('tax')} className="text-end" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="so-note">{t('salesOrders.note')}</Label>
                <Input id="so-note" {...createForm.register('note')} placeholder={t('salesOrders.notePlaceholder')} />
              </div>
            </div>

            {/* Dynamic line items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('salesOrders.items')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', quantity: 1, price: '' })}>
                  <Plus className="h-4 w-4 me-1" />
                  {t('salesOrders.addItem')}
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end rounded-lg border p-3">
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">{t('salesOrders.product')}</Label>
                    <select
                      {...createForm.register(`items.${index}.product_id`)}
                      className="w-full border rounded-md ps-2 pe-6 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">{t('salesOrders.selectProduct')}</option>
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">{t('salesOrders.quantity')}</Label>
                    <Input type="number" min="1" step="1" {...createForm.register(`items.${index}.quantity`)} className="text-end" />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">{t('salesOrders.unitPrice')}</Label>
                    <Input type="number" min="0" step="0.01" {...createForm.register(`items.${index}.price`)} className="text-end" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      aria-label={t('salesOrders.removeItem')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateModalOpen(false);
                  setIsOneTimeCustomer(false);
                  createForm.reset({
                    location_id: '', customer_id: '', customer_name: '', channel: '',
                    discount: '0', tax: '0', note: '',
                    items: [{ product_id: '', quantity: 1, price: '' }],
                  });
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
