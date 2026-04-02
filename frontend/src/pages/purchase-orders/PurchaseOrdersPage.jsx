import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  AlertTriangle, ChevronLeft, Eye, Loader2,
  Package, Plus, ShoppingCart, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  createPurchaseOrder,
  fetchPurchaseOrder,
  fetchPurchaseOrders,
  receivePurchaseOrder,
  updatePurchaseOrderStatus,
} from '@/api/purchaseOrders';
import { fetchSuppliers } from '@/api/suppliers';
import { fetchProducts } from '@/api/products';
import { fetchLocations } from '@/api/locations';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';
import { useOrg } from '@/hooks/useOrg';

// ── Zod schema — header fields only (items managed by useFieldArray) ────────
const poHeaderSchema = z.object({
  supplier_id: z.string().min(1, 'purchaseOrders.errors.supplierRequired').optional(),
  supplier_name: z.string().optional(),
  location_id: z.string().min(1, 'purchaseOrders.errors.locationRequired'),
  expected_date: z.string().optional().or(z.literal('')),
  note: z.string().optional().or(z.literal('')),
});

// ── Component ───────────────────────────────────────────────────────────────
export default function PurchaseOrdersPage() {
  // 1. Hooks — declared once
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { currency: rawCurrency } = useOrg();
  const currency = rawCurrency || 'JOD';

  // 4. State
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receiveQtys, setReceiveQtys] = useState({});
  const [isOneTimeSupplier, setIsOneTimeSupplier] = useState(false);

  // 5. Queries
  const purchaseOrdersQuery = useQuery({
    queryKey: ['purchase-orders', 'list', { page, activeFilter }],
    queryFn: () => fetchPurchaseOrders({
      page,
      limit: 20,
      ...(activeFilter !== 'all' ? { status: activeFilter } : {}),
    }),
    select: (result) => ({
      items: result.data ?? [],
      pagination: result.pagination ?? null,
    }),
  });

  const purchaseOrderQuery = useQuery({
    queryKey: ['purchase-orders', 'detail', selectedId],
    queryFn: () => fetchPurchaseOrder(selectedId),
    select: (result) => result.data,
    enabled: !!selectedId,
  });

  const suppliersDropdown = useQuery({
    queryKey: ['suppliers', 'dropdown'],
    queryFn: () => fetchSuppliers({ limit: 200 }),
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
  const poList = purchaseOrdersQuery.data?.items ?? [];
  const pagination = purchaseOrdersQuery.data?.pagination ?? null;
  const selectedPO = purchaseOrderQuery.data ?? null;
  const suppliersList = suppliersDropdown.data ?? [];
  const locationsList = locationsDropdown.data ?? [];
  const productsList = productsDropdown.data ?? [];

  // 7. Client-side search
  const filteredPOList = search.trim()
    ? poList.filter((po) =>
        po.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
        po.location_name?.toLowerCase().includes(search.toLowerCase())
      )
    : poList;

  // 8. Filter tabs
  const FILTER_TABS = [
    { key: 'all', label: t('purchaseOrders.filters.all') },
    { key: 'draft', label: t('purchaseOrders.filters.draft') },
    { key: 'submitted', label: t('purchaseOrders.filters.submitted') },
    { key: 'partially_received', label: t('purchaseOrders.filters.partiallyReceived') },
    { key: 'received', label: t('purchaseOrders.filters.received') },
    { key: 'cancelled', label: t('purchaseOrders.filters.cancelled') },
  ];

  // 9. Filter handler
  const handleFilterChange = (key) => {
    setActiveFilter(key);
    setPage(1);
    setSearch('');
  };

  // 10. Status badge helper
  const getStatusBadgeProps = (status) => {
    const map = {
      draft: { status: 'inactive', label: t('purchaseOrders.status.draft') },
      submitted: { status: 'pending', label: t('purchaseOrders.status.submitted') },
      partially_received: { status: 'pending', label: t('purchaseOrders.status.partially_received') },
      received: { status: 'active', label: t('purchaseOrders.status.received') },
      cancelled: { status: 'cancelled', label: t('purchaseOrders.status.cancelled') },
    };
    return map[status] ?? { status: 'inactive', label: status };
  };

  // 11. Create form
  const createForm = useForm({
    resolver: zodResolver(poHeaderSchema),
    defaultValues: {
      supplier_id: '',
      location_id: '',
      expected_date: '',
      note: '',
      items: [{ product_id: '', quantity: 1, unit_cost: '' }],
    },
  });

  // 12. Field array for line items
  const { fields, append, remove } = useFieldArray({
    control: createForm.control,
    name: 'items',
  });

  // 13. Receive form
  const receiveForm = useForm({
    defaultValues: { note: '' },
  });

  // 14. Mutations
  const createMutation = useMutation({
    mutationFn: (data) => createPurchaseOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success(t('purchaseOrders.addSuccess'));
      setCreateModalOpen(false);
      setIsOneTimeSupplier(false);
      createForm.reset({
        supplier_id: '', supplier_name: '', location_id: '', expected_date: '', note: '',
        items: [{ product_id: '', quantity: 1, unit_cost: '' }],
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const submitMutation = useMutation({
    mutationFn: (id) => updatePurchaseOrderStatus(id, 'submitted'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success(t('purchaseOrders.statusSuccess'));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => updatePurchaseOrderStatus(id, 'cancelled'),
    onSuccess: (_, idThatWasCancelled) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success(t('purchaseOrders.cancelSuccess'));
      setCancelTarget(null);
      if (idThatWasCancelled === selectedId) setSelectedId(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      setCancelTarget(null);
    },
  });

  const receiveMutation = useMutation({
    mutationFn: ({ id, data }) => receivePurchaseOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success(t('purchaseOrders.receiveSuccess'));
      setReceiveModalOpen(false);
      receiveForm.reset({ note: '' });
      setReceiveQtys({});
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // 15. Open create modal
  const openCreateModal = () => {
    createForm.reset({
      supplier_id: '', supplier_name: '', location_id: '', expected_date: '', note: '',
      items: [{ product_id: '', quantity: 1, unit_cost: '' }],
    });
    setIsOneTimeSupplier(false);
    setCreateModalOpen(true);
  };

  // 16. Open receive modal
  const openReceiveModal = () => {
    if (!selectedPO?.items?.length) return;
    const initial = {};
    selectedPO.items.forEach((item) => {
      initial[item.id] = String(item.quantity);
    });
    setReceiveQtys(initial);
    receiveForm.reset({ note: '' });
    setReceiveModalOpen(true);
  };

  // 17. Create submit handler
  const onCreateSubmit = (headerData) => {
    const items = createForm.getValues('items');

    if (!items || items.length === 0) {
      toast.error(t('purchaseOrders.errors.itemsRequired'));
      return;
    }

    for (const item of items) {
      if (!item.product_id) {
        toast.error(t('purchaseOrders.errors.productRequired'));
        return;
      }
      if (!item.quantity || parseInt(item.quantity, 10) < 1) {
        toast.error(t('purchaseOrders.errors.quantityRequired'));
        return;
      }
      if (item.unit_cost === '' || item.unit_cost === undefined || parseFloat(item.unit_cost) < 0) {
        toast.error(t('purchaseOrders.errors.unitCostRequired'));
        return;
      }
    }

    const supplierId = createForm.getValues('supplier_id');
    const supplierName = createForm.getValues('supplier_name');

    const payload = {
      supplier_id: isOneTimeSupplier ? null : supplierId || null,
      ...(isOneTimeSupplier && supplierName?.trim()
        ? { supplier_name: supplierName.trim() }
        : {}),
      location_id: headerData.location_id,
      expected_date: headerData.expected_date || undefined,
      note: headerData.note || undefined,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: parseInt(item.quantity, 10),
        unit_cost: parseFloat(item.unit_cost),
      })),
    };

    createMutation.mutate(payload);
  };

  // 18. Receive submit handler
  const onReceiveSubmit = (data) => {
    const items = selectedPO.items.map((item) => ({
      purchase_order_item_id: item.id,
      quantity_received: parseInt(receiveQtys[item.id] ?? '0', 10),
    }));

    receiveMutation.mutate({
      id: selectedId,
      data: {
        note: data.note || undefined,
        items,
      },
    });
  };

  // 19. Table columns
  const columns = [
    {
      key: 'supplier',
      header: t('purchaseOrders.supplier'),
      render: (row) => (
        <div>
          <p className="font-medium text-sm">{row.supplier_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{row.location_name}</p>
        </div>
      ),
    },
    {
      key: 'expected_date',
      header: t('purchaseOrders.expectedDate'),
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.expected_date ? formatDate(new Date(row.expected_date + 'T00:00:00')) : '—'}
        </span>
      ),
    },
    {
      key: 'total',
      header: t('purchaseOrders.total'),
      render: (row) => (
        <span className="text-sm font-medium tabular-nums">
          {formatCurrency(parseFloat(row.total), currency)}
        </span>
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedId(row.id)}
          aria-label={t('common.view')}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // 20. document.title
  useEffect(() => {
    document.title = t('purchaseOrders.pageTitle');
  }, [t]);

  // 21. JSX
  return (
    <div className="page-container">

      {/* ═══ LIST VIEW ═══ */}
      {!selectedId && (
        <>
          <PageHeader
            title={t('purchaseOrders.title')}
            subtitle={t('purchaseOrders.subtitle')}
            action={
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 me-2" />
                {t('purchaseOrders.newPO')}
              </Button>
            }
          />

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
            <div className="sm:ms-auto">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('common.search')}
                className="w-full sm:w-64"
              />
            </div>
          </div>

          {purchaseOrdersQuery.isError && (
            <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {t('purchaseOrders.loadError')}
              </p>
            </div>
          )}

          <DataTable
            columns={columns}
            data={filteredPOList}
            isLoading={purchaseOrdersQuery.isLoading}
            emptyMessage={t('purchaseOrders.noOrders')}
            emptyIcon={ShoppingCart}
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
              {t('purchaseOrders.backToList')}
            </Button>
          </div>

          {purchaseOrderQuery.isLoading && (
            <div className="space-y-4">
              <div className="h-36 animate-pulse bg-muted rounded-lg" />
              <div className="h-52 animate-pulse bg-muted rounded-lg" />
            </div>
          )}

          {purchaseOrderQuery.isError && (
            <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {t('purchaseOrders.loadError')}
              </p>
            </div>
          )}

          {selectedPO && (
            <>
              {/* PO header card */}
              <div className="bcc-card space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{t('purchaseOrders.poDetails')}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('purchaseOrders.createdBy')}:&nbsp;{selectedPO.created_by_name}&nbsp;·&nbsp;{formatDate(new Date(selectedPO.created_at))}
                    </p>
                  </div>
                  {(() => {
                    const { status, label } = getStatusBadgeProps(selectedPO.status);
                    return <StatusBadge status={status} label={label} />;
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('purchaseOrders.supplier')}</p>
                    <p className="text-sm font-medium mt-1">{selectedPO.supplier_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('purchaseOrders.location')}</p>
                    <p className="text-sm font-medium mt-1">{selectedPO.location_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('purchaseOrders.expectedDate')}</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedPO.expected_date ? formatDate(new Date(selectedPO.expected_date + 'T00:00:00')) : '—'}
                    </p>
                  </div>
                </div>

                {selectedPO.note && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('purchaseOrders.note')}</p>
                    <p className="text-sm mt-1">{selectedPO.note}</p>
                  </div>
                )}
              </div>

              {/* Line items table */}
              <div className="bcc-card">
                <h3 className="text-sm font-semibold mb-4">{t('purchaseOrders.items')}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="pb-2 text-start font-medium">{t('purchaseOrders.product')}</th>
                        <th className="pb-2 text-end font-medium">{t('purchaseOrders.quantity')}</th>
                        <th className="pb-2 text-end font-medium">{t('purchaseOrders.unitCost')}</th>
                        <th className="pb-2 text-end font-medium">{t('purchaseOrders.lineTotal')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedPO.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 font-medium">{item.product_name}</td>
                          <td className="py-3 text-end tabular-nums">{item.quantity}</td>
                          <td className="py-3 text-end tabular-nums">{formatCurrency(parseFloat(item.unit_cost), currency)}</td>
                          <td className="py-3 text-end tabular-nums font-medium">{formatCurrency(parseFloat(item.total), currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td colSpan={3} className="pt-3 text-end font-semibold pe-4">{t('purchaseOrders.total')}</td>
                        <td className="pt-3 text-end font-semibold tabular-nums">{formatCurrency(parseFloat(selectedPO.total), currency)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Action buttons */}
              {(selectedPO.status === 'draft' || selectedPO.status === 'submitted' || selectedPO.status === 'partially_received') && (
                <div className="flex flex-wrap gap-3">
                  {selectedPO.status === 'draft' && (
                    <Button onClick={() => submitMutation.mutate(selectedPO.id)} disabled={submitMutation.isPending}>
                      {submitMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                      {t('purchaseOrders.submitPO')}
                    </Button>
                  )}

                  {(selectedPO.status === 'submitted' || selectedPO.status === 'partially_received') && (
                    <Button onClick={openReceiveModal}>
                      <Package className="h-4 w-4 me-2" />
                      {t('purchaseOrders.receiveGoods')}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                    onClick={() => setCancelTarget(selectedPO)}
                    disabled={cancelMutation.isPending}
                  >
                    {t('purchaseOrders.cancelPO')}
                  </Button>
                </div>
              )}

              {/* Cancel confirmation modal */}
              <ConfirmModal
                isOpen={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                onConfirm={() => cancelMutation.mutate(cancelTarget.id)}
                title={t('purchaseOrders.cancelPO')}
                message={t('purchaseOrders.cancelConfirm')}
                isLoading={cancelMutation.isPending}
              />

              {/* Receive Goods modal */}
              <Dialog
                open={receiveModalOpen}
                onOpenChange={(open) => {
                  if (!open) {
                    setReceiveModalOpen(false);
                    receiveForm.reset({ note: '' });
                    setReceiveQtys({});
                  }
                }}
              >
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('purchaseOrders.receiveModalTitle')}</DialogTitle>
                  </DialogHeader>

                  <form onSubmit={receiveForm.handleSubmit(onReceiveSubmit)} className="space-y-4 pt-2">
                    <div className="space-y-3">
                      {selectedPO.items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {t('purchaseOrders.ordered')}: {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`recv-${item.id}`} className="text-xs text-muted-foreground whitespace-nowrap">
                              {t('purchaseOrders.quantityReceived')}
                            </Label>
                            <Input
                              id={`recv-${item.id}`}
                              type="number"
                              min="0"
                              max={item.quantity}
                              className="w-20 text-end"
                              value={receiveQtys[item.id] ?? item.quantity}
                              onChange={(e) => setReceiveQtys((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="recv-note">{t('purchaseOrders.receiveNote')}</Label>
                      <Textarea id="recv-note" {...receiveForm.register('note')} placeholder={t('purchaseOrders.receivePlaceholder')} rows={2} />
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setReceiveModalOpen(false); receiveForm.reset({ note: '' }); setReceiveQtys({}); }}
                        disabled={receiveMutation.isPending}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button type="submit" disabled={receiveMutation.isPending}>
                        {receiveMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                        {t('purchaseOrders.submitReceive')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </>
      )}

      {/* ═══ CREATE PO MODAL — outside both view blocks ═══ */}
      <Dialog
        open={createModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateModalOpen(false);
            setIsOneTimeSupplier(false);
            createForm.reset({
              supplier_id: '', supplier_name: '', location_id: '', expected_date: '', note: '',
              items: [{ product_id: '', quantity: 1, unit_cost: '' }],
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('purchaseOrders.createPO')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-5 pt-2">
            {/* Supplier field */}
            <div>
              <label className="text-sm font-medium">
                {t('purchaseOrders.supplier')}
              </label>

              <select
                {...createForm.register('supplier_id', {
                  onChange: (e) => {
                    const val = e.target.value;
                    if (val === '__one_time__') {
                      setIsOneTimeSupplier(true);
                      createForm.setValue('supplier_id', '',
                        { shouldDirty: true, shouldTouch: true });
                    } else {
                      setIsOneTimeSupplier(false);
                      createForm.setValue('supplier_id', val,
                        { shouldDirty: true, shouldTouch: true });
                      createForm.setValue('supplier_name', '');
                    }
                  },
                })}
                className="flex h-9 w-full rounded-md border border-input
                           bg-transparent px-3 py-1 text-sm shadow-sm mt-1"
              >
                <option value="">{t('purchaseOrders.selectSupplier')}</option>
                <option value="__one_time__">
                  {t('purchaseOrders.oneTimeSupplier')}
                </option>
                <option disabled value="">──────────</option>
                {suppliersList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              {isOneTimeSupplier && (
                <input
                  type="text"
                  placeholder={t('purchaseOrders.oneTimeSupplierName')}
                  {...createForm.register('supplier_name')}
                  className="flex h-9 w-full rounded-md border border-input
                             bg-transparent px-3 py-1 text-sm shadow-sm mt-2"
                />
              )}

              {createForm.formState.errors.supplier_id && (
                <p className="text-destructive text-xs mt-1">
                  {t(createForm.formState.errors.supplier_id.message)}
                </p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="po-location">{t('purchaseOrders.location')}</Label>
              <select
                id="po-location"
                {...createForm.register('location_id')}
                className="w-full border rounded-md ps-3 pe-8 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('purchaseOrders.selectLocation')}</option>
                {locationsList.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              {createForm.formState.errors.location_id && (
                <p className="field-error" role="alert">{t(createForm.formState.errors.location_id.message)}</p>
              )}
            </div>

            {/* Expected date + Note */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="po-date">{t('purchaseOrders.expectedDate')}</Label>
                <Input id="po-date" type="date" {...createForm.register('expected_date')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="po-note">{t('purchaseOrders.note')}</Label>
                <Input id="po-note" {...createForm.register('note')} placeholder={t('purchaseOrders.notePlaceholder')} />
              </div>
            </div>

            {/* Dynamic line items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('purchaseOrders.items')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', quantity: 1, unit_cost: '' })}>
                  <Plus className="h-4 w-4 me-1" />
                  {t('purchaseOrders.addItem')}
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end rounded-lg border p-3">
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">{t('purchaseOrders.product')}</Label>
                    <select
                      {...createForm.register(`items.${index}.product_id`)}
                      className="w-full border rounded-md ps-2 pe-6 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">{t('purchaseOrders.selectProduct')}</option>
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">{t('purchaseOrders.quantity')}</Label>
                    <Input type="number" min="1" step="1" {...createForm.register(`items.${index}.quantity`)} className="text-end" />
                  </div>

                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">{t('purchaseOrders.unitCost')}</Label>
                    <Input type="number" min="0" step="0.01" {...createForm.register(`items.${index}.unit_cost`)} className="text-end" />
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      aria-label={t('purchaseOrders.removeItem')}
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
                  setIsOneTimeSupplier(false);
                  createForm.reset({
                    supplier_id: '', supplier_name: '', location_id: '', expected_date: '', note: '',
                    items: [{ product_id: '', quantity: 1, unit_cost: '' }],
                  });
                }}
                disabled={createMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {t('purchaseOrders.createPO')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
