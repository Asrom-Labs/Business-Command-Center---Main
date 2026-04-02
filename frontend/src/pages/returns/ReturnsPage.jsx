import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import { fetchReturns, createReturn, fetchReturnReasons } from '@/api/returns';
import { fetchSalesOrder } from '@/api/salesOrders';
import { useOrg } from '@/hooks/useOrg';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';

const createReturnSchema = z.object({
  reason_id: z.string().optional(),
  note: z.string().optional(),
});

export default function ReturnsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState('');
  const [orderForReturn, setOrderForReturn] = useState(null);
  const [orderLoadError, setOrderLoadError] = useState('');
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [returnItems, setReturnItems] = useState([]);

  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { currency: rawCurrency } = useOrg();
  const currency = rawCurrency || 'JOD';

  useEffect(() => {
    document.title = t('returns.pageTitle');
  }, [t]);

  const returnsQuery = useQuery({
    queryKey: ['returns', 'list', { page }],
    queryFn: () => fetchReturns({ page, limit: 20 }),
    select: (result) => ({
      items: result.data ?? [],
      pagination: result.pagination ?? null,
    }),
  });

  const listItems = returnsQuery.data?.items ?? [];
  const pagination = returnsQuery.data?.pagination ?? null;

  const filteredItems = search.trim()
    ? listItems.filter((r) =>
        (r.reason_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.sales_order_id ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : listItems;

  const reasonsQuery = useQuery({
    queryKey: ['returns', 'reasons'],
    queryFn: () => fetchReturnReasons(),
    select: (result) => result.data ?? [],
    staleTime: 10 * 60 * 1000,
    enabled: isCreateOpen,
  });
  const reasonsList = reasonsQuery.data ?? [];

  const returnForm = useForm({
    resolver: zodResolver(createReturnSchema),
    defaultValues: { reason_id: '', note: '' },
  });

  function openCreateModal() {
    returnForm.reset({ reason_id: '', note: '' });
    setOrderIdInput('');
    setOrderForReturn(null);
    setOrderLoadError('');
    setReturnItems([]);
    setIsCreateOpen(true);
  }

  async function handleLoadOrder() {
    const id = orderIdInput.trim();
    if (!id) {
      setOrderLoadError(t('returns.orderRequired'));
      return;
    }
    setOrderLoadError('');
    setIsLoadingOrder(true);
    try {
      const result = await fetchSalesOrder(id);
      const order = result?.data;
      if (!order || !order.id) {
        setOrderLoadError(t('returns.orderLoadError'));
        return;
      }
      setOrderForReturn(order);
      setReturnItems(
        (order.items ?? []).map((item) => ({ item, qty: '', refund: '' }))
      );
    } catch {
      setOrderLoadError(t('returns.orderLoadError'));
    } finally {
      setIsLoadingOrder(false);
    }
  }

  const createMutation = useMutation({
    mutationFn: (data) => createReturn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success(t('returns.createSuccess'));
      setIsCreateOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
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

    createMutation.mutate({
      sales_order_id: orderForReturn.id,
      reason_id: headerData.reason_id || undefined,
      note: headerData.note || undefined,
      items,
    });
  });

  const columns = [
    {
      key: 'sales_order_id',
      header: t('returns.columns.order'),
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">{(row.sales_order_id ?? '').slice(0, 8)}…</span>
      ),
    },
    {
      key: 'reason_name',
      header: t('returns.columns.reason'),
      render: (row) => <span className="text-sm">{row.reason_name ?? t('returns.noReason')}</span>,
    },
    {
      key: 'total_refund_amount',
      header: t('returns.columns.totalRefund'),
      render: (row) => (
        <span className="font-medium">{formatCurrency(parseFloat(row.total_refund_amount || '0'), currency)}</span>
      ),
    },
    {
      key: 'created_by_name',
      header: t('returns.columns.createdBy'),
      render: (row) => <span className="text-sm text-muted-foreground">{row.created_by_name ?? '—'}</span>,
    },
    {
      key: 'created_at',
      header: t('returns.columns.date'),
      render: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.created_at)}</span>,
    },
  ];

  return (
    <>
      <div className="page-container">
        <PageHeader
          title={t('returns.title')}
          subtitle={t('returns.subtitle')}
          action={<Button onClick={openCreateModal}>{t('returns.newReturn')}</Button>}
        />

        {returnsQuery.isError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{getErrorMessage(returnsQuery.error)}</p>
          </div>
        )}

        <div className="flex justify-end">
          <SearchInput value={search} onChange={setSearch} placeholder={t('common.search')} className="w-full sm:w-72" />
        </div>

        <DataTable
          columns={columns}
          data={filteredItems}
          isLoading={returnsQuery.isLoading}
          emptyMessage={t('returns.noReturns')}
          emptyIcon={RotateCcw}
          pagination={
            pagination && !search.trim()
              ? { page, limit: pagination.limit, total: pagination.total, onPageChange: setPage }
              : null
          }
        />
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('returns.createReturnTitle')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitReturn} className="space-y-4">
            <div>
              <Label htmlFor="return_order_id">{t('returns.selectOrderLabel')}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="return_order_id"
                  value={orderIdInput}
                  onChange={(e) => {
                    setOrderIdInput(e.target.value);
                    if (orderForReturn) {
                      setOrderForReturn(null);
                      setReturnItems([]);
                      setOrderLoadError('');
                    }
                  }}
                  placeholder={t('returns.selectOrderPlaceholder')}
                  className="flex-1"
                  disabled={isLoadingOrder}
                />
                <Button type="button" variant="outline" onClick={handleLoadOrder} disabled={isLoadingOrder || !orderIdInput.trim()}>
                  {isLoadingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : t('returns.loadOrder')}
                </Button>
              </div>
              {orderLoadError && <p className="field-error" role="alert">{orderLoadError}</p>}
            </div>

            {orderForReturn && (
              <>
                <div>
                  <Label htmlFor="return_reason_id">{t('returns.selectReasonLabel')}</Label>
                  <select
                    id="return_reason_id"
                    {...returnForm.register('reason_id')}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">{t('returns.selectReasonPlaceholder')}</option>
                    {reasonsList.map((r) => (
                      <option key={r.id} value={r.id}>{r.reason}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="return_note">{t('returns.note')}</Label>
                  <textarea
                    id="return_note"
                    rows={2}
                    {...returnForm.register('note')}
                    className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none"
                  />
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
                          <Input
                            type="number" min="0" max={ri.item.quantity} value={ri.qty}
                            onChange={(e) => {
                              const updated = [...returnItems];
                              updated[index] = { ...ri, qty: e.target.value };
                              setReturnItems(updated);
                            }}
                          />
                        </div>
                        <div className="w-28 flex-shrink-0">
                          <Label className="text-xs text-muted-foreground mb-1 block">{t('returns.refundAmountLabel')}</Label>
                          <Input
                            type="number" min="0" step="0.01" value={ri.refund}
                            onChange={(e) => {
                              const updated = [...returnItems];
                              updated[index] = { ...ri, refund: e.target.value };
                              setReturnItems(updated);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={createMutation.isPending}>
                {t('common.cancel')}
              </Button>
              {orderForReturn && (
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                  {t('returns.createReturn')}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
