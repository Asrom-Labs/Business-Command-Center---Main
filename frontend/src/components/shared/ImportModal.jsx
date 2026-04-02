import { useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import {
  Upload, Download, AlertTriangle, CheckCircle,
  FileSpreadsheet, ArrowLeft, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export default function ImportModal({
  isOpen,
  onClose,
  onSuccess,
  entityName,
  fields,
  importFn,
  templateFileName,
}) {
  const { t } = useTranslation();
  const fileInputId = useId();

  const [screen, setScreen] = useState('upload');
  const [fileHeaders, setFileHeaders] = useState([]);
  const [fileRows, setFileRows] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState([]);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');

  function buildPayload(rawRow) {
    const payload = {};
    fields.forEach((field) => {
      const headerName = columnMap[field.key];
      if (!headerName) return;
      const headerIndex = fileHeaders.indexOf(headerName);
      let value = headerIndex >= 0 ? String(rawRow[headerIndex] ?? '').trim() : '';
      if (value === '' && !field.required) return;
      if (field.type === 'number' && value !== '') {
        value = Number(value);
      } else if (field.type === 'date' && value !== '') {
        const d = new Date(value);
        if (!isNaN(d.getTime())) value = d.toISOString().split('T')[0];
      }
      payload[field.key] = value;
    });
    return payload;
  }

  function getMappedValue(rawRow, fieldKey) {
    const headerName = columnMap[fieldKey];
    if (!headerName) return '';
    const idx = fileHeaders.indexOf(headerName);
    return idx >= 0 ? String(rawRow[idx] ?? '').trim() : '';
  }

  function handleFile(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setFileError(t('import.errorInvalidFileType'));
      return;
    }
    setFileError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (!raw || raw.length < 2) {
          setFileError(t('import.errorEmptyFile'));
          return;
        }
        const headers = raw[0].map((h) => String(h).trim()).filter(Boolean);
        const rows = raw.slice(1).filter((row) => row.some((cell) => cell !== ''));
        if (headers.length === 0 || rows.length === 0) {
          setFileError(t('import.errorEmptyFile'));
          return;
        }
        setFileHeaders(headers);
        setFileRows(rows);
        const autoMap = {};
        fields.forEach((field) => {
          const keyNorm = field.key.toLowerCase().replace(/[^a-z0-9]/g, '');
          const labelNorm = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          const match = headers.find((h) => {
            const hNorm = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            return hNorm === keyNorm || hNorm === labelNorm;
          });
          autoMap[field.key] = match ?? '';
        });
        setColumnMap(autoMap);
        setScreen('mapping');
      } catch {
        setFileError(t('import.errorParseFailure'));
      }
    };
    reader.onerror = () => setFileError(t('import.errorParseFailure'));
    reader.readAsArrayBuffer(file);
  }

  function handleValidate() {
    const errors = [];
    fileRows.forEach((rawRow, rowIndex) => {
      fields.forEach((field) => {
        const value = getMappedValue(rawRow, field.key);
        if (field.required && value === '') {
          errors.push({ row: rowIndex + 2, field: field.label, value, error: t('import.errorRequired') });
          return;
        }
        if (value === '') return;
        if (field.type === 'number' && isNaN(Number(value))) {
          errors.push({ row: rowIndex + 2, field: field.label, value, error: t('import.errorNotNumber') });
        }
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push({ row: rowIndex + 2, field: field.label, value, error: t('import.errorInvalidEmail') });
        }
        if (field.type === 'date' && isNaN(new Date(value).getTime())) {
          errors.push({ row: rowIndex + 2, field: field.label, value, error: t('import.errorInvalidDate') });
        }
      });
    });
    if (errors.length > 0) {
      setValidationErrors(errors);
      setScreen('errors');
    } else {
      setValidationErrors([]);
      setScreen('importing');
    }
  }

  async function handleImport() {
    setIsImporting(true);
    setImportProgress(0);
    const results = [];
    for (let i = 0; i < fileRows.length; i++) {
      setImportProgress(i + 1);
      try {
        await importFn(buildPayload(fileRows[i]));
        results.push({ row: i + 2, status: 'success' });
      } catch (err) {
        results.push({ row: i + 2, status: 'error', message: err?.message ?? t('import.unknownError') });
      }
    }
    setImportResults(results);
    setIsImporting(false);
    setScreen('done');
  }

  function handleDownloadTemplate() {
    const headerRow = fields.map((f) => f.label);
    const sampleRow = fields.map((f) => {
      if (f.type === 'number') return 100;
      if (f.type === 'date') return '2026-01-15';
      if (f.type === 'email') return 'example@email.com';
      return `${f.label} example`;
    });
    const ws = XLSX.utils.aoa_to_sheet([headerRow, sampleRow]);
    ws['!cols'] = fields.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, templateFileName);
  }

  function handleClose() {
    setScreen('upload');
    setFileHeaders([]);
    setFileRows([]);
    setColumnMap({});
    setValidationErrors([]);
    setIsImporting(false);
    setImportProgress(0);
    setImportResults([]);
    setFileName('');
    setFileError('');
    const input = document.getElementById(fileInputId);
    if (input) input.value = '';
    onClose();
  }

  function handleDone() {
    onSuccess();
    handleClose();
  }

  const allRequiredMapped = fields.filter((f) => f.required).every((f) => !!columnMap[f.key]);
  const successCount = importResults.filter((r) => r.status === 'success').length;
  const failCount = importResults.filter((r) => r.status === 'error').length;

  const screenTitle = {
    upload: t('import.screenUpload'),
    mapping: t('import.screenMapping'),
    errors: t('import.screenErrors'),
    importing: t('import.screenImporting'),
    done: t('import.screenDone'),
  }[screen] ?? '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('import.modalTitle', { entity: entityName })}
            {screenTitle ? ` — ${screenTitle}` : ''}
          </DialogTitle>
        </DialogHeader>

        {screen === 'upload' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{t('import.templateTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('import.templateSubtitle')}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 me-2" />
                {t('import.downloadTemplate')}
              </Button>
            </div>
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-10 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => document.getElementById(fileInputId)?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }}
            >
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">{t('import.dropzone')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('import.dropzoneSubtitle')}</p>
              <input id={fileInputId} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }} />
            </div>
            {fileError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{fileError}</p>
              </div>
            )}
          </div>
        )}

        {screen === 'mapping' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('import.mappingInstructions', { file: fileName })}</p>
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                  <div className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-destructive ms-1">*</span>}
                  </div>
                  <select
                    value={columnMap[field.key] ?? ''}
                    onChange={(e) => setColumnMap((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">{field.required ? t('import.selectColumnRequired') : t('import.selectColumnOptional')}</option>
                    {fileHeaders.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t('import.rowCount', { count: fileRows.length })}</p>
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setScreen('upload')}>
                <ArrowLeft className="h-4 w-4 me-2" />
                {t('common.back')}
              </Button>
              <Button onClick={handleValidate} disabled={!allRequiredMapped}>{t('import.validate')}</Button>
            </div>
          </div>
        )}

        {screen === 'errors' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">{t('import.errorsFound', { count: validationErrors.length })}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('import.errorsInstructions')}</p>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80">
                  <tr>
                    <th className="px-3 py-2 text-start text-xs font-medium text-muted-foreground w-16">{t('import.errorRow')}</th>
                    <th className="px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t('import.errorField')}</th>
                    <th className="px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t('import.errorValue')}</th>
                    <th className="px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t('import.errorMessage')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {validationErrors.map((err, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-mono text-xs">{err.row}</td>
                      <td className="px-3 py-2 text-xs">{err.field}</td>
                      <td className="px-3 py-2 font-mono text-xs text-destructive">{err.value !== '' ? err.value : t('import.emptyValue')}</td>
                      <td className="px-3 py-2 text-xs text-destructive">{err.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button variant="outline" onClick={() => setScreen('upload')}>
              <ArrowLeft className="h-4 w-4 me-2" />
              {t('import.startOver')}
            </Button>
          </div>
        )}

        {screen === 'importing' && (
          <div className="space-y-6">
            {!isImporting && importProgress === 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20 px-4 py-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">{t('import.validationPassed')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('import.readyToImport', { count: fileRows.length })}</p>
                </div>
              </div>
            )}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t('import.importingProgress', { current: importProgress, total: fileRows.length })}</p>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-150" style={{ width: `${(importProgress / fileRows.length) * 100}%` }} />
                </div>
              </div>
            )}
            {!isImporting && importProgress === 0 && (
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setScreen('mapping')}>
                  <ArrowLeft className="h-4 w-4 me-2" />
                  {t('common.back')}
                </Button>
                <Button onClick={handleImport}>
                  <Upload className="h-4 w-4 me-2" />
                  {t('import.confirmImport', { count: fileRows.length })}
                </Button>
              </div>
            )}
          </div>
        )}

        {screen === 'done' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20 px-4 py-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm font-medium text-green-800 dark:text-green-300">{t('import.importComplete', { success: successCount, entity: entityName })}</p>
            </div>
            {failCount > 0 && (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-start text-xs font-medium text-muted-foreground w-16">{t('import.errorRow')}</th>
                      <th className="px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t('import.errorMessage')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {importResults.filter((r) => r.status === 'error').map((r) => (
                      <tr key={r.row}>
                        <td className="px-3 py-2 font-mono text-xs">{r.row}</td>
                        <td className="px-3 py-2 text-xs text-destructive">{r.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={handleDone}>{t('import.done')}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
