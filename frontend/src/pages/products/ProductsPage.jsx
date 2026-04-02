import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Switch }   from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ConfirmModal from '@/components/shared/ConfirmModal';
import DataTable    from '@/components/shared/DataTable';
import PageHeader   from '@/components/shared/PageHeader';
import SearchInput  from '@/components/shared/SearchInput';
import StatusBadge  from '@/components/shared/StatusBadge';
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
} from '@/api/products';
import { fetchCategories } from '@/api/categories';
import { fetchUnits }      from '@/api/units';
import { formatCurrency, getErrorMessage } from '@/lib/utils';
import { useOrg } from '@/hooks/useOrg';

// ── Validation schema (module level — i18n key strings) ─────────────────────
const productSchema = z.object({
  name: z.string().min(1, 'products.errors.nameRequired').trim(),
  sku: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  category_id: z.string().optional().or(z.literal('')),
  unit_id: z.string().optional().or(z.literal('')),
  cost_price: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0),
      { message: 'products.errors.costPriceInvalid' }
    ),
  selling_price: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0),
      { message: 'products.errors.sellingPriceInvalid' }
    ),
  low_stock_threshold: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) =>
        !v || v === '' || (!isNaN(parseInt(v, 10)) && parseInt(v, 10) >= 0),
      { message: 'products.errors.thresholdInvalid' }
    ),
  is_active: z.boolean().default(true),
});

// ── Component ───────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { currency: rawCurrency } = useOrg();
  const currency = rawCurrency || 'JOD';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    document.title = t('products.pageTitle');
  }, [t]);

  // ── Filter tabs (inside component — t() re-evaluates on lang change) ──
  const FILTER_TABS = [
    { key: 'all',      label: t('products.filters.all')      },
    { key: 'active',   label: t('products.filters.active')   },
    { key: 'inactive', label: t('products.filters.inactive') },
  ];

  const handleFilterChange = (key) => {
    setActiveFilter(key);
    setPage(1);
    setSearch('');
  };

  // ── Queries ──
  const serverParams = {
    page,
    limit: 20,
    ...(activeFilter === 'active'   ? { active: true  } : {}),
    ...(activeFilter === 'inactive' ? { active: false } : {}),
  };

  const productsQuery = useQuery({
    queryKey: ['products', 'list', { page, activeFilter }],
    queryFn: () => fetchProducts(serverParams),
    select: (result) => ({
      items: result.data ?? [],
      pagination: result.pagination ?? null,
    }),
  });

  const products   = productsQuery.data?.items      ?? [];
  const pagination = productsQuery.data?.pagination ?? null;

  const filteredProducts = search.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
      )
    : products;

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => fetchCategories({ limit: 200 }),
    select: (result) => result.data ?? [],
    staleTime: 10 * 60 * 1000,
  });
  const categoriesList = categoriesQuery.data ?? [];

  const unitsQuery = useQuery({
    queryKey: ['units', 'all'],
    queryFn: () => fetchUnits({ limit: 200 }),
    select: (result) => result.data ?? [],
    staleTime: 10 * 60 * 1000,
  });
  const unitsList = unitsQuery.data ?? [];

  // ── Form ──
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      category_id: '',
      unit_id: '',
      cost_price: '',
      selling_price: '',
      low_stock_threshold: '',
      is_active: true,
    },
  });

  const isActiveValue = watch('is_active');

  // ── Modal handlers ──
  const openAddModal = () => {
    setEditingProduct(null);
    reset({
      name: '',
      sku: '',
      description: '',
      category_id: '',
      unit_id: '',
      cost_price: '',
      selling_price: '',
      low_stock_threshold: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    reset({
      name:                product.name,
      sku:                 product.sku                 ?? '',
      description:         product.description         ?? '',
      category_id:         product.category_id         ?? '',
      unit_id:             product.unit_id             ?? '',
      cost_price:          product.cost_price
                             ? String(parseFloat(product.cost_price))
                             : '',
      selling_price:       product.selling_price
                             ? String(parseFloat(product.selling_price))
                             : '',
      low_stock_threshold: product.low_stock_threshold != null
                             ? String(product.low_stock_threshold)
                             : '',
      is_active:           product.is_active ?? true,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    reset();
  };

  const openDeleteModal = (product) => setDeleteTarget(product);

  // ── Submit handler ──
  const onSubmit = (data) => {
    const payload = {
      name:                data.name,
      sku:                 data.sku                 || undefined,
      description:         data.description         || undefined,
      category_id:         data.category_id         || undefined,
      unit_id:             data.unit_id             || undefined,
      cost_price:          data.cost_price
                             ? parseFloat(data.cost_price)
                             : undefined,
      selling_price:       data.selling_price
                             ? parseFloat(data.selling_price)
                             : undefined,
      low_stock_threshold: data.low_stock_threshold
                             ? parseInt(data.low_stock_threshold, 10)
                             : undefined,
      active:              data.is_active,
    };

    if (editingProduct) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('products.addSuccess'));
      closeModal();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateProduct(editingProduct.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('products.editSuccess'));
      closeModal();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(deleteTarget.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('products.deleteSuccess'));
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      setDeleteTarget(null);
    },
  });

  // ── Table columns (inside component — translated labels re-evaluate) ──
  const columns = [
    {
      key: 'sku',
      header: t('products.sku'),
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.sku || '—'}
        </span>
      ),
    },
    {
      key: 'name',
      header: t('products.name'),
      render: (row) => (
        <span className="font-medium">{row.name}</span>
      ),
    },
    {
      key: 'category',
      header: t('products.category'),
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.category_name || t('products.noCategory')}
        </span>
      ),
    },
    {
      key: 'unit',
      header: t('products.unit'),
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.unit_name || '—'}
        </span>
      ),
    },
    {
      key: 'cost_price',
      header: t('products.costPrice'),
      render: (row) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.cost_price
            ? formatCurrency(parseFloat(row.cost_price), currency)
            : '—'}
        </span>
      ),
    },
    {
      key: 'selling_price',
      header: t('products.sellingPrice'),
      render: (row) => (
        <span className="text-sm font-medium tabular-nums">
          {row.selling_price
            ? formatCurrency(parseFloat(row.selling_price), currency)
            : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row) => (
        <StatusBadge
          status={row.is_active ? 'active' : 'inactive'}
          label={t(row.is_active ? 'common.active' : 'common.inactive')}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-end w-24',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            aria-label={t('common.edit')}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => openDeleteModal(row)}
            aria-label={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      {/* Page header */}
      <PageHeader
        title={t('products.title')}
        subtitle={t('products.subtitle')}
        action={
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4 me-2" />
            {t('products.addProduct')}
          </Button>
        }
      />

      {/* Filter tabs + Search */}
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

      {/* Error banner */}
      {productsQuery.isError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {t('products.loadError')}
          </p>
        </div>
      )}

      {/* Data table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        isLoading={productsQuery.isLoading}
        emptyMessage={t('products.noProducts')}
        emptyIcon={Package}
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

      {/* Add / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t(editingProduct ? 'products.editProduct' : 'products.addProduct')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="prod-name">{t('products.name')}</Label>
              <Input
                id="prod-name"
                {...register('name')}
                placeholder={t('products.namePlaceholder')}
              />
              {errors.name && (
                <p className="field-error" role="alert">
                  {t(errors.name.message)}
                </p>
              )}
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <Label htmlFor="prod-sku">{t('products.sku')}</Label>
              <Input
                id="prod-sku"
                {...register('sku')}
                placeholder={t('products.skuPlaceholder')}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="prod-desc">{t('products.description')}</Label>
              <Textarea
                id="prod-desc"
                {...register('description')}
                placeholder={t('products.descriptionPlaceholder')}
                rows={2}
              />
            </div>

            {/* Category + Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prod-cat">{t('products.category')}</Label>
                <select
                  id="prod-cat"
                  {...register('category_id')}
                  className="w-full border rounded-md ps-3 pe-8 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{t('products.selectCategory')}</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-unit">{t('products.unit')}</Label>
                <select
                  id="prod-unit"
                  {...register('unit_id')}
                  className="w-full border rounded-md ps-3 pe-8 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{t('products.selectUnit')}</option>
                  {unitsList.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cost price + Selling price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prod-cost">{t('products.costPrice')}</Label>
                <Input
                  id="prod-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('cost_price')}
                  placeholder={t('products.pricePlaceholder')}
                />
                {errors.cost_price && (
                  <p className="field-error" role="alert">
                    {t(errors.cost_price.message)}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod-sell">{t('products.sellingPrice')}</Label>
                <Input
                  id="prod-sell"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('selling_price')}
                  placeholder={t('products.pricePlaceholder')}
                />
                {errors.selling_price && (
                  <p className="field-error" role="alert">
                    {t(errors.selling_price.message)}
                  </p>
                )}
              </div>
            </div>

            {/* Low stock threshold */}
            <div className="space-y-1.5">
              <Label htmlFor="prod-thresh">{t('products.lowStockThreshold')}</Label>
              <Input
                id="prod-thresh"
                type="number"
                step="1"
                min="0"
                {...register('low_stock_threshold')}
                placeholder={t('products.thresholdPlaceholder')}
              />
              {errors.low_stock_threshold && (
                <p className="field-error" role="alert">
                  {t(errors.low_stock_threshold.message)}
                </p>
              )}
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="prod-active" className="cursor-pointer">
                {t('products.isActive')}
              </Label>
              <Switch
                id="prod-active"
                checked={isActiveValue}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                )}
                {t(editingProduct ? 'common.save' : 'products.addProduct')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate()}
        title={t('products.deleteProduct')}
        message={t('products.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
