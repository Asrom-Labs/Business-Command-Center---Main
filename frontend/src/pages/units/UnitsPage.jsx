import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { AlertTriangle, Loader2, Pencil, Plus, Ruler, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  createUnit,
  deleteUnit,
  fetchUnits,
  updateUnit,
} from '@/api/units';
import { formatDate, getErrorMessage } from '@/lib/utils';

// ── Validation schema (module level — uses i18n key strings) ────────────────
const unitSchema = z.object({
  name: z.string().min(1, 'units.errors.nameRequired').trim(),
  abbreviation: z.string().min(1, 'units.errors.abbreviationRequired').trim(),
});

// ── Component ───────────────────────────────────────────────────────────────
export default function UnitsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    document.title = t('units.pageTitle');
  }, [t]);

  // ── Query ──
  const unitsQuery = useQuery({
    queryKey: ['units', 'list', { page }],
    queryFn: () => fetchUnits({ page, limit: 20 }),
    select: (result) => ({
      items: result.data ?? [],
      pagination: result.pagination ?? null,
    }),
  });

  const units = unitsQuery.data?.items ?? [];
  const pagination = unitsQuery.data?.pagination ?? null;

  // Client-side search filter (name AND abbreviation)
  const filteredUnits = search.trim()
    ? units.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.abbreviation.toLowerCase().includes(search.toLowerCase())
      )
    : units;

  // ── Form ──
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(unitSchema),
    defaultValues: { name: '', abbreviation: '' },
  });

  // ── Modal handlers ──
  const openAddModal = () => {
    setEditingUnit(null);
    reset({ name: '', abbreviation: '' });
    setModalOpen(true);
  };

  const openEditModal = (unit) => {
    setEditingUnit(unit);
    reset({
      name: unit.name,
      abbreviation: unit.abbreviation,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUnit(null);
    reset({ name: '', abbreviation: '' });
  };

  const openDeleteModal = (unit) => setDeleteTarget(unit);

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data) => createUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success(t('units.addSuccess'));
      closeModal();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateUnit(editingUnit.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success(t('units.editSuccess'));
      closeModal();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUnit(deleteTarget.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success(t('units.deleteSuccess'));
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      setDeleteTarget(null);
    },
  });

  const onSubmit = (data) => {
    if (editingUnit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // ── Table columns (inside component — translated labels re-evaluate) ──
  const columns = [
    {
      key: 'name',
      header: t('units.name'),
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'abbreviation',
      header: t('units.abbreviation'),
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-mono">
          {row.abbreviation}
        </span>
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
        title={t('units.title')}
        subtitle={t('units.subtitle')}
        action={
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4 me-2" />
            {t('units.addUnit')}
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
      {unitsQuery.isError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {t('units.loadError')}
          </p>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredUnits}
        isLoading={unitsQuery.isLoading}
        emptyMessage={t('units.noUnits')}
        emptyIcon={Ruler}
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
              {t(editingUnit ? 'units.editUnit' : 'units.addUnit')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="unit-name">{t('units.name')}</Label>
              <Input
                id="unit-name"
                {...register('name')}
                placeholder={t('units.namePlaceholder')}
              />
              {errors.name && (
                <p className="field-error" role="alert">
                  {t(errors.name.message)}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unit-abbr">{t('units.abbreviation')}</Label>
              <Input
                id="unit-abbr"
                {...register('abbreviation')}
                placeholder={t('units.abbreviationPlaceholder')}
              />
              {errors.abbreviation && (
                <p className="field-error" role="alert">
                  {t(errors.abbreviation.message)}
                </p>
              )}
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
                {t(editingUnit ? 'common.save' : 'units.addUnit')}
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
        title={t('units.deleteUnit')}
        message={t('units.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
