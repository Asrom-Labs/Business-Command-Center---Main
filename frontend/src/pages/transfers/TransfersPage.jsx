import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ArrowLeftRight, Plus, Trash2, ChevronLeft, AlertTriangle, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import ConfirmModal from '@/components/shared/ConfirmModal';
import StatusBadge from '@/components/shared/StatusBadge';
import {
  fetchTransfers, fetchTransfer, createTransfer,
  confirmTransfer, cancelTransfer,
} from '@/api/transfers';
import { fetchLocations } from '@/api/locations';
import { fetchProducts } from '@/api/products';
import { formatDate, getErrorMessage } from '@/lib/utils';

// ── Zod schema (module level — i18n key strings) ────────────────────────────
const createTransferSchema = z.object({
  from_location_id: z.string().min(1, 'transfers.fromLocationRequired'),
  to_location_id: z.string().min(1, 'transfers.toLocationRequired'),
  note: z.string().optional(),
});

// ── Component ───────────────────────────────────────────────────────────────
export default function TransfersPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const { t } = useTranslation();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = t('transfers.pageTitle');
  }, [t]);

  // ── Filter tabs (inside component — RULE-08) ──
  const FILTER_TABS = [
    { value: '', label: t('transfers.filter.all') },
    { value: 'pending', label: t('transfers.filter.pending') },
    { value: 'completed', label: t('transfers.filter.completed') },
    { value: 'cancelled', label: t('transfers.filter.cancelled') },
  ];

  // ── Columns (inside component — DataTable { key, header, render } format) ──
  const columns = [
    {
      key: 'from',
      header: t('transfers.columns.from'),
      render: (row) => <span className="font-medium">{row.from_location_name}</span>,
    },
    {
      key: 'to',
      header: t('transfers.columns.to'),
      render: (row) => <span>{row.to_location_name}</span>,
    },
    {
      key: 'status',
      header: t('transfers.columns.status'),
      render: (row) => (
        <StatusBadge
          status={row.status === 'completed' ? 'completed' : row.status === 'cancelled' ? 'cancelled' : 'pending'}
          label={t(`transfers.status.${row.status}`)}
        />
      ),
    },
    {
      key: 'created_by',
      header: t('transfers.columns.createdBy'),
      render: (row) => (
        <span className="text-muted-foreground text-sm">{row.created_by_name ?? '—'}</span>
      ),
    },
    {
      key: 'date',
      header: t('transfers.columns.date'),
      render: (row) => (
        <span className="text-muted-foreground text-sm">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-end w-28',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(row.id)}>
            {t('common.view')}
          </Button>
          {row.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => { e.stopPropagation(); setCancelTarget(row.id); }}
            >
              {t('transfers.cancelTransferAction')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Queries ──
  const transfersQuery = useQuery({
    queryKey: ['transfers', 'list', { page, status: activeFilter }],
    queryFn: () => fetchTransfers({
      page,
      limit: 20,
      ...(activeFilter ? { status: activeFilter } : {}),
    }),
    select: (result) => ({
      items: result.data ?? [],
      pagination: result.pagination ?? null,
    }),
  });

  const listItems = transfersQuery.data?.items ?? [];
  const pagination = transfersQuery.data?.pagination ?? null;

  const filteredItems = search.trim()
    ? listItems.filter((row) =>
        (row.from_location_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (row.to_location_name ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : listItems;

  const transferDetailQuery = useQuery({
    queryKey: ['transfers', 'detail', selectedId],
    queryFn: () => fetchTransfer(selectedId),
    select: (result) => result.data,
    enabled: selectedId !== null,
  });
  const transfer = transferDetailQuery.data ?? null;

  const locationsQuery = useQuery({
    queryKey: ['locations', 'all'],
    queryFn: () => fetchLocations(),
    select: (result) => result.data ?? [],
    staleTime: 10 * 60 * 1000,
  });
  const locationsList = locationsQuery.data ?? [];

  const productsQuery = useQuery({
    queryKey: ['products', 'dropdown'],
    queryFn: () => fetchProducts({ limit: 200 }),
    select: (result) => result.data ?? [],
    staleTime: 10 * 60 * 1000,
  });
  const productsList = productsQuery.data ?? [];

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data) => createTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast.success(t('transfers.createSuccess'));
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => confirmTransfer(id),
    onSuccess: (_, confirmedId) => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast.success(t('transfers.confirmSuccess'));
      setConfirmTarget(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => cancelTransfer(id),
    onSuccess: (_, cancelledId) => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast.success(t('transfers.cancelSuccess'));
      setCancelTarget(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // ── Form ──
  const createForm = useForm({
    resolver: zodResolver(createTransferSchema),
    defaultValues: {
      from_location_id: '',
      to_location_id: '',
      note: '',
      items: [{ product_id: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: createForm.control,
    name: 'items',
  });

  const handleOpenCreate = () => {
    createForm.reset({
      from_location_id: '',
      to_location_id: '',
      note: '',
      items: [{ product_id: '', quantity: 1 }],
    });
    setIsCreateOpen(true);
  };

  const handleSubmitCreate = createForm.handleSubmit((headerData) => {
    const items = createForm.getValues('items');

    if (headerData.from_location_id === headerData.to_location_id) {
      toast.error(t('transfers.sameLocationError'));
      return;
    }

    if (!items || items.length === 0) {
      toast.error(t('transfers.noItemsError'));
      return;
    }

    const hasInvalidItem = items.some(
      (item) => !item.product_id || !item.quantity || Number(item.quantity) < 1
    );
    if (hasInvalidItem) {
      toast.error(t('transfers.noItemsError'));
      return;
    }

    createMutation.mutate({
      from_location_id: headerData.from_location_id,
      to_location_id: headerData.to_location_id,
      note: headerData.note || undefined,
      items: items.map((item) => ({
        product_id: item.product_id,
        variant_id: null,
        quantity: Number(item.quantity),
      })),
    });
  });

  // ── JSX ──
  return (
    <>
      {/* LIST VIEW */}
      {selectedId === null && (
        <div className="page-container">
          <PageHeader
            title={t('transfers.title')}
            subtitle={t('transfers.subtitle')}
            action={
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 me-2" />
                {t('transfers.newTransfer')}
              </Button>
            }
          />

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex gap-1 flex-wrap">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => { setActiveFilter(tab.value); setPage(1); setSearch(''); }}
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
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('common.search')}
                className="w-full sm:w-64"
              />
            </div>
          </div>

          {transfersQuery.isError && (
            <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {getErrorMessage(transfersQuery.error)}
              </p>
            </div>
          )}

          <DataTable
            columns={columns}
            data={filteredItems}
            isLoading={transfersQuery.isLoading}
            emptyMessage={t('transfers.noTransfers')}
            emptyIcon={ArrowLeftRight}
            pagination={
              pagination && !search
                ? { page, limit: pagination.limit, total: pagination.total, onPageChange: setPage }
                : null
            }
          />
        </div>
      )}

      {/* DETAIL VIEW */}
      {selectedId !== null && (
        <div className="page-container">
          <div>
            <Button variant="ghost" onClick={() => setSelectedId(null)} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              {t('transfers.backToList')}
            </Button>
          </div>

          {transferDetailQuery.isLoading && (
            <div className="space-y-4">
              <div className="h-40 animate-pulse bg-muted rounded-lg" />
              <div className="h-40 animate-pulse bg-muted rounded-lg" />
            </div>
          )}

          {transferDetailQuery.isError && (
            <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {getErrorMessage(transferDetailQuery.error)}
              </p>
            </div>
          )}

          {transfer && (
            <>
              <div className="bcc-card space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold">{t('transfers.transferInfo')}</h2>
                  <StatusBadge
                    status={transfer.status === 'completed' ? 'completed' : transfer.status === 'cancelled' ? 'cancelled' : 'pending'}
                    label={t(`transfers.status.${transfer.status}`)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('transfers.fromLocation')}</p>
                    <p className="text-sm font-medium mt-1">{transfer.from_location_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('transfers.toLocation')}</p>
                    <p className="text-sm font-medium mt-1">{transfer.to_location_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('transfers.createdBy')}</p>
                    <p className="text-sm font-medium mt-1">{transfer.created_by_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('transfers.date')}</p>
                    <p className="text-sm font-medium mt-1">{formatDate(transfer.created_at)}</p>
                  </div>
                  {transfer.note && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('transfers.note')}</p>
                      <p className="text-sm mt-1">{transfer.note}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bcc-card">
                <h3 className="text-sm font-semibold mb-4">{t('transfers.itemsTransferred')}</h3>
                {(!transfer.items || transfer.items.length === 0) ? (
                  <p className="text-sm text-muted-foreground">{t('transfers.noItems')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="pb-2 text-start font-medium">{t('transfers.product')}</th>
                          <th className="pb-2 text-end font-medium">{t('transfers.quantity')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {transfer.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-3">
                              <p className="font-medium">{item.product_name}</p>
                              {item.variant_name && (
                                <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                              )}
                            </td>
                            <td className="py-3 text-end tabular-nums font-medium">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {transfer.status === 'pending' && (
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => setConfirmTarget(transfer.id)}
                    disabled={confirmMutation.isPending || cancelMutation.isPending}
                  >
                    {confirmMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                    {t('transfers.confirmTransferAction')}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                    onClick={() => setCancelTarget(transfer.id)}
                    disabled={confirmMutation.isPending || cancelMutation.isPending}
                  >
                    {t('transfers.cancelTransferAction')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ALL MODALS — outside both view conditionals (PATTERN-W3-01) */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            createForm.reset({
              from_location_id: '', to_location_id: '', note: '',
              items: [{ product_id: '', quantity: 1 }],
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('transfers.newTransfer')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="from_location_id">{t('transfers.fromLocation')}</Label>
              <select
                id="from_location_id"
                {...createForm.register('from_location_id')}
                className="w-full border rounded-md ps-3 pe-8 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('transfers.selectFromLocation')}</option>
                {locationsList.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              {createForm.formState.errors.from_location_id && (
                <p className="field-error" role="alert">{t(createForm.formState.errors.from_location_id.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="to_location_id">{t('transfers.toLocation')}</Label>
              <select
                id="to_location_id"
                {...createForm.register('to_location_id')}
                className="w-full border rounded-md ps-3 pe-8 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('transfers.selectToLocation')}</option>
                {locationsList.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              {createForm.formState.errors.to_location_id && (
                <p className="field-error" role="alert">{t(createForm.formState.errors.to_location_id.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transfer-note">{t('transfers.note')}</Label>
              <Input id="transfer-note" {...createForm.register('note')} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('transfers.items')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', quantity: 1 })}>
                  <Plus className="h-4 w-4 me-1" />
                  {t('transfers.addItem')}
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end rounded-lg border p-3">
                  <div className="col-span-7 space-y-1">
                    <Label className="text-xs">{t('transfers.product')}</Label>
                    <select
                      {...createForm.register(`items.${index}.product_id`)}
                      className="w-full border rounded-md ps-2 pe-6 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">{t('transfers.selectProduct')}</option>
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4 space-y-1">
                    <Label className="text-xs">{t('transfers.quantity')}</Label>
                    <Input type="number" min="1" step="1" {...createForm.register(`items.${index}.quantity`)} className="text-end" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      aria-label={t('transfers.removeItem')}
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
                  setIsCreateOpen(false);
                  createForm.reset({ from_location_id: '', to_location_id: '', note: '', items: [{ product_id: '', quantity: 1 }] });
                }}
                disabled={createMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {t('transfers.createTransfer')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => confirmMutation.mutate(confirmTarget)}
        title={t('transfers.confirmTransferAction')}
        message={t('transfers.confirmTransferMessage')}
        isLoading={confirmMutation.isPending}
      />

      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelMutation.mutate(cancelTarget)}
        title={t('transfers.cancelTransferAction')}
        message={t('transfers.cancelTransferMessage')}
        isLoading={cancelMutation.isPending}
      />
    </>
  );
}
