import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  AlertTriangle, Loader2, Pencil, Plus, Trash2, Truck,
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
import {
  createSupplier, deleteSupplier,
  fetchSuppliers, updateSupplier,
} from '@/api/suppliers';
import { getErrorMessage } from '@/lib/utils';
import ImportModal from '@/components/shared/ImportModal';
import { Upload } from 'lucide-react';

// ── Validation schema (module level — i18n key strings) ─────────────────────
const supplierSchema = z.object({
  name: z.string().min(1, 'suppliers.errors.nameRequired').trim(),
  phone: z.string().optional().or(z.literal('')),
  email: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      { message: 'suppliers.errors.emailInvalid' }
    ),
  address: z.string().optional().or(z.literal('')),
  contact_person: z.string().optional().or(z.literal('')),
});

// ── Component ───────────────────────────────────────────────────────────────
export default function SuppliersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // ── Query ──
  const suppliersQuery = useQuery({
    queryKey: ['suppliers', 'list', { page }],
    queryFn: () => fetchSuppliers({ page, limit: 20 }),
    select: (result) => ({
      items: result.data ?? [],
      pagination: result.pagination ?? null,
    }),
  });

  const suppliers = suppliersQuery.data?.items ?? [];
  const pagination = suppliersQuery.data?.pagination ?? null;

  const filteredSuppliers = search.trim()
    ? suppliers.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.phone && s.phone.includes(search)) ||
        (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
        (s.contact_person && s.contact_person.toLowerCase().includes(search.toLowerCase()))
      )
    : suppliers;

  // ── Form ──
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: '', phone: '', email: '', address: '', contact_person: '' },
  });

  // ── Modal handlers ──
  const openAddModal = () => {
    setEditingSupplier(null);
    reset({ name: '', phone: '', email: '', address: '', contact_person: '' });
    setModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    reset({
      name: supplier.name,
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      contact_person: supplier.contact_person ?? '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSupplier(null);
    reset();
  };

  // ── Submit handler ──
  const onSubmit = (data) => {
    const payload = {
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      contact_person: data.contact_person || undefined,
    };

    if (editingSupplier) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data) => createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(t('suppliers.addSuccess'));
      closeModal();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateSupplier(editingSupplier.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(t('suppliers.editSuccess'));
      closeModal();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSupplier(deleteTarget.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(t('suppliers.deleteSuccess'));
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
      key: 'name',
      header: t('suppliers.name'),
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'contact_person',
      header: t('suppliers.contactPerson'),
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.contact_person || '—'}
        </span>
      ),
    },
    {
      key: 'phone',
      header: t('suppliers.phone'),
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.phone || '—'}
        </span>
      ),
    },
    {
      key: 'email',
      header: t('suppliers.email'),
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.email || '—'}
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
            onClick={() => setDeleteTarget(row)}
            aria-label={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    document.title = t('suppliers.pageTitle');
  }, [t]);

  const supplierImportFields = [
    { key: 'name', label: t('suppliers.name'), required: true, type: 'string' },
    { key: 'email', label: t('suppliers.email'), required: false, type: 'email' },
    { key: 'phone', label: t('suppliers.phone'), required: false, type: 'string' },
    { key: 'address', label: t('suppliers.address'), required: false, type: 'string' },
    { key: 'contact_person', label: t('suppliers.contactPerson'), required: false, type: 'string' },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={t('suppliers.title')}
        subtitle={t('suppliers.subtitle')}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="h-4 w-4 me-2" />
              {t('import.importButton')}
            </Button>
            <Button onClick={openAddModal}>
              <Plus className="h-4 w-4 me-2" />
              {t('suppliers.addSupplier')}
            </Button>
          </div>
        }
      />

      <div className="flex justify-end">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('common.search')}
          className="w-full sm:w-72"
        />
      </div>

      {suppliersQuery.isError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {t('suppliers.loadError')}
          </p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredSuppliers}
        isLoading={suppliersQuery.isLoading}
        emptyMessage={t('suppliers.noSuppliers')}
        emptyIcon={Truck}
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

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t(editingSupplier ? 'suppliers.editSupplier' : 'suppliers.addSupplier')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="sup-name">{t('suppliers.name')}</Label>
              <Input id="sup-name" {...register('name')} placeholder={t('suppliers.namePlaceholder')} />
              {errors.name && (
                <p className="field-error" role="alert">{t(errors.name.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-contact">{t('suppliers.contactPerson')}</Label>
              <Input id="sup-contact" {...register('contact_person')} placeholder={t('suppliers.contactPersonPlaceholder')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-phone">{t('suppliers.phone')}</Label>
              <Input id="sup-phone" type="tel" {...register('phone')} placeholder={t('suppliers.phonePlaceholder')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-email">{t('suppliers.email')}</Label>
              <Input id="sup-email" type="email" {...register('email')} placeholder={t('suppliers.emailPlaceholder')} />
              {errors.email && (
                <p className="field-error" role="alert">{t(errors.email.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-address">{t('suppliers.address')}</Label>
              <Textarea id="sup-address" {...register('address')} placeholder={t('suppliers.addressPlaceholder')} rows={2} />
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
                {t(editingSupplier ? 'common.save' : 'suppliers.addSupplier')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate()}
        title={t('suppliers.deleteSupplier')}
        message={t('suppliers.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        isLoading={deleteMutation.isPending}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['suppliers'] })}
        entityName={t('suppliers.title')}
        fields={supplierImportFields}
        importFn={(row) => createSupplier(row)}
        templateFileName="suppliers_import_template.xlsx"
      />
    </div>
  );
}
