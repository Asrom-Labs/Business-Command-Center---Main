import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  AlertTriangle, Loader2, Pencil, Plus, Trash2, Users,
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
  createCustomer, deleteCustomer,
  fetchCustomers, updateCustomer,
} from '@/api/customers';
import { getErrorMessage } from '@/lib/utils';
import ImportModal from '@/components/shared/ImportModal';
import { Upload } from 'lucide-react';

// ── Validation schema (module level — i18n key strings) ─────────────────────
const customerSchema = z.object({
  name: z.string().min(1, 'customers.errors.nameRequired').trim(),
  phone: z.string().optional().or(z.literal('')),
  email: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      { message: 'customers.errors.emailInvalid' }
    ),
  address: z.string().optional().or(z.literal('')),
});

// ── Component ───────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // ── Query ──
  const customersQuery = useQuery({
    queryKey: ['customers', 'list', { page }],
    queryFn: () => fetchCustomers({ page, limit: 20 }),
    select: (result) => ({
      items: result.data ?? [],
      pagination: result.pagination ?? null,
    }),
  });

  const customers = customersQuery.data?.items ?? [];
  const pagination = customersQuery.data?.pagination ?? null;

  const filteredCustomers = search.trim()
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search)) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
      )
    : customers;

  // ── Form ──
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', phone: '', email: '', address: '' },
  });

  // ── Modal handlers ──
  const openAddModal = () => {
    setEditingCustomer(null);
    reset({ name: '', phone: '', email: '', address: '' });
    setModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      address: customer.address ?? '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCustomer(null);
    reset();
  };

  // ── Submit handler ──
  const onSubmit = (data) => {
    const payload = {
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
    };

    if (editingCustomer) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data) => createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(t('customers.addSuccess'));
      closeModal();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateCustomer(editingCustomer.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(t('customers.editSuccess'));
      closeModal();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCustomer(deleteTarget.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(t('customers.deleteSuccess'));
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
      header: t('customers.name'),
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'phone',
      header: t('customers.phone'),
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.phone || '—'}
        </span>
      ),
    },
    {
      key: 'email',
      header: t('customers.email'),
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.email || '—'}
        </span>
      ),
    },
    {
      key: 'address',
      header: t('customers.address'),
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.address || '—'}
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
    document.title = t('customers.pageTitle');
  }, [t]);

  const customerImportFields = [
    { key: 'name', label: t('customers.name'), required: true, type: 'string' },
    { key: 'email', label: t('customers.email'), required: false, type: 'email' },
    { key: 'phone', label: t('customers.phone'), required: false, type: 'string' },
    { key: 'address', label: t('customers.address'), required: false, type: 'string' },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={t('customers.title')}
        subtitle={t('customers.subtitle')}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="h-4 w-4 me-2" />
              {t('import.importButton')}
            </Button>
            <Button onClick={openAddModal}>
              <Plus className="h-4 w-4 me-2" />
              {t('customers.addCustomer')}
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

      {customersQuery.isError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {t('customers.loadError')}
          </p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredCustomers}
        isLoading={customersQuery.isLoading}
        emptyMessage={t('customers.noCustomers')}
        emptyIcon={Users}
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
              {t(editingCustomer ? 'customers.editCustomer' : 'customers.addCustomer')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="cust-name">{t('customers.name')}</Label>
              <Input id="cust-name" {...register('name')} placeholder={t('customers.namePlaceholder')} />
              {errors.name && (
                <p className="field-error" role="alert">{t(errors.name.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust-phone">{t('customers.phone')}</Label>
              <Input id="cust-phone" type="tel" {...register('phone')} placeholder={t('customers.phonePlaceholder')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust-email">{t('customers.email')}</Label>
              <Input id="cust-email" type="email" {...register('email')} placeholder={t('customers.emailPlaceholder')} />
              {errors.email && (
                <p className="field-error" role="alert">{t(errors.email.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust-address">{t('customers.address')}</Label>
              <Textarea id="cust-address" {...register('address')} placeholder={t('customers.addressPlaceholder')} rows={2} />
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
                {t(editingCustomer ? 'common.save' : 'customers.addCustomer')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate()}
        title={t('customers.deleteCustomer')}
        message={t('customers.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        isLoading={deleteMutation.isPending}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}
        entityName={t('customers.title')}
        fields={customerImportFields}
        importFn={(row) => createCustomer(row)}
        templateFileName="customers_import_template.xlsx"
      />
    </div>
  );
}
