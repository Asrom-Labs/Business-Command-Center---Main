import { useTranslation } from 'react-i18next';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DataTable({
  columns,
  data,
  isLoading,
  emptyMessage,
  emptyIcon: EmptyIcon = Inbox,
  pagination,
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm overflow-hidden">
      {isLoading ? (
        <div className="p-6 space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              {columns.map((col) => (
                <div key={col.key} className="h-4 animate-pulse bg-muted rounded flex-1" />
              ))}
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground p-6">
          <EmptyIcon className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`text-start font-medium text-muted-foreground pb-3 pe-4 last:pe-0 ${col.className ?? ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={row.id ?? rowIndex} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 pe-4 last:pe-0 align-middle ${col.className ?? ''}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.total > pagination.limit && (
        <div className="border-t px-6 py-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t('common.showing')}{' '}
            {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
            {t('common.of')} {pagination.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              {t('common.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.limit >= pagination.total}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
