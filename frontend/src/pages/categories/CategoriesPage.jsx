import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { AlertTriangle, Loader2, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ConfirmModal from '@/components/shared/ConfirmModal';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '@/api/categories';
import { formatDate, getErrorMessage } from '@/lib/utils';

// ── Validation schema (module level — uses i18n key strings) ────────────────
const categorySchema = z.object({
  name: z.string().min(1, 'categories.errors.nameRequired').trim(),
  description: z.string().optional().or(z.literal('')),
});

// ── Component ───────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    document.title = t('categories.pageTitle');
  }, [t]);

  // ── Query ──
  const categoriesQuery = useQuery({
    queryKey: ['categories', 'list', { page }],
    queryFn: () => fetchCategories({ page, limit: 20 }),
    select: (result) => ({
      items: result.data ?? [],
      pagination: result.pagination ?? null,
    }),
  });

  const categories = categoriesQuery.data?.items ?? [];
  const pagination = categoriesQuery.data?.pagination ?? null;

  // Client-side search filter
  const filteredCategories = search.trim()
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  // ── Form ──
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  // ── Modal handlers ──
  const openAddModal = () => {
    setEditingCategory(null);
    reset({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    reset({
      name: category.name,
      description: category.description ?? '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    reset({ name: '', description: '' });
  };

  const openDeleteModal = (category) => setDeleteTarget(category);

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('categories.addSuccess'));
      closeModal();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateCategory(editingCategory.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('categories.editSuccess'));
      closeModal();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCategory(deleteTarget.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('categories.deleteSuccess'));
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      setDeleteTarget(null);
    },
  });

  const onSubmit = (data) => {
    if (editingCategory) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // ── Table columns (inside component — translated labels re-evaluate) ──
  const columns = [
    {
      key: 'name',
      header: t('categories.name'),
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'description',
      header: t('categories.description'),
      render: (row) => (
        <span className="text-muted-foreground text-sm">
          {row.description || '—'}
        </span>
      ),
    },
    {
      key: 'product_count',
      header: t('categories.productCount'),
      render: (row) => (
        <span className="text-muted-foreground">{row.product_count ?? 0}</span>
      ),
    },
    {
      key: 'created_at',
      header: t('common.createdAt'),
      render: (row) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.created_at)}
        </span>
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
        title={t('categories.title')}
        subtitle={t('categories.subtitle')}
        action={
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4 me-2" />
            {t('categories.addCategory')}
          </Button>
        }
      />

      {/* Search */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t('common.search')}
        className="max-w-sm"
      />

      {/* Error banner */}
      {categoriesQuery.isError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {t('categories.loadError')}
          </p>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredCategories}
        isLoading={categoriesQuery.isLoading}
        emptyMessage={t('categories.noCategories')}
        emptyIcon={Tag}
        pagination={
          pagination && !search
            ? {
                page,
                limit: pagination.limit,
                total: pagination.total,
                onPageChange: setPage,
              }
            : null
        }
      />

      {/* Add / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(editingCategory ? 'categories.editCategory' : 'categories.addCategory')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">{t('categories.name')}</Label>
              <Input
                id="cat-name"
                {...register('name')}
                placeholder={t('categories.namePlaceholder')}
              />
              {errors.name && (
                <p className="field-error" role="alert">
                  {t(errors.name.message)}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">{t('categories.description')}</Label>
              <Textarea
                id="cat-desc"
                {...register('description')}
                placeholder={t('categories.descriptionPlaceholder')}
                rows={3}
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
                {t(editingCategory ? 'common.save' : 'categories.addCategory')}
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
        title={t('categories.deleteCategory')}
        message={t('categories.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
