'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  FileUp,
  Calculator,
  Receipt,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import {
  CalculationSheetPreview,
  TimesheetDocument,
  TimesheetDocumentType,
} from '@/lib/types';
import { toast } from 'sonner';
import { cn, formatApiDate, getApiErrorMessage } from '@/lib/utils';
import { CalculationSheetPreviewView } from '@/components/driver/calculation-sheet-preview';

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function documentTypeLabel(type: string) {
  if (type === 'invoice') return 'Invoice';
  if (type === 'calculation_sheet') return 'Calculation sheet';
  if (type === 'timesheet') return 'Timesheet';
  return type;
}

function isSpreadsheet(doc: TimesheetDocument) {
  return /\.(xlsx|xls|csv)$/i.test(doc.original_filename || '');
}

function latestOf(documents: TimesheetDocument[], type: TimesheetDocumentType) {
  return [...documents]
    .filter((d) => d.document_type === type)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
}

type UploadKind = 'timesheet' | 'calculation_sheet';

type Props = {
  timesheetId: string | number;
  documents: TimesheetDocument[];
  onDocumentsChange: () => Promise<void> | void;
  canUpload?: boolean;
};

export function DriverTimesheetDocumentsCard({
  timesheetId,
  documents,
  onDocumentsChange,
  canUpload = true,
}: Props) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploadKind, setUploadKind] = useState<UploadKind | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CalculationSheetPreview | null>(null);
  const [previewTitle, setPreviewTitle] = useState('Calculation sheet');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [requestingInvoice, setRequestingInvoice] = useState(false);

  const timesheetDoc = useMemo(
    () => latestOf(documents, 'timesheet'),
    [documents],
  );
  const calcDoc = useMemo(
    () => latestOf(documents, 'calculation_sheet'),
    [documents],
  );
  const invoiceDoc = useMemo(() => latestOf(documents, 'invoice'), [documents]);

  const resetUploadForm = () => {
    setSelectedFile(null);
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  };

  const openUpload = (kind: UploadKind) => {
    resetUploadForm();
    setUploadKind(kind);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadKind) {
      toast.error(
        uploadKind === 'timesheet'
          ? 'Choose a PDF or Excel file to upload'
          : 'Choose an Excel file to upload',
      );
      return;
    }
    const isExcel = /\.(xlsx|xls|csv)$/i.test(selectedFile.name);
    const isPdf = /\.pdf$/i.test(selectedFile.name);
    if (uploadKind === 'timesheet' && !isExcel && !isPdf) {
      toast.error('Timesheets must be a PDF or Excel file (.xlsx, .xls, or .csv)');
      return;
    }
    if (uploadKind === 'calculation_sheet' && !isExcel) {
      toast.error('Use an Excel file (.xlsx, .xls, or .csv)');
      return;
    }
    setUploading(true);
    try {
      const res = await apiClient.uploadTimesheetDocument(
        timesheetId,
        uploadKind,
        selectedFile,
      );
      if (uploadKind === 'calculation_sheet') {
        toast.success('Calculation sheet uploaded. Request an invoice when you are ready.');
      } else {
        toast.success('Timesheet uploaded');
      }
      setUploadKind(null);
      resetUploadForm();
      await onDocumentsChange();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to upload file'));
    } finally {
      setUploading(false);
    }
  };

  const handleRequestInvoice = async () => {
    if (!calcDoc) {
      toast.error('Upload a calculation sheet first');
      return;
    }
    if (
      invoiceDoc &&
      !confirm('An invoice already exists. Generate a new one from the calculation sheet?')
    ) {
      return;
    }
    setRequestingInvoice(true);
    try {
      await apiClient.requestTimesheetInvoice(timesheetId);
      toast.success('Invoice generated from the calculation sheet');
      await onDocumentsChange();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to generate invoice'));
    } finally {
      setRequestingInvoice(false);
    }
  };

  const handleView = async (doc: TimesheetDocument) => {
    if (isSpreadsheet(doc) || doc.parsed_payload?.headers) {
      setPreviewLoading(true);
      setPreviewTitle(documentTypeLabel(doc.document_type));
      try {
        const data =
          doc.parsed_payload?.headers || doc.parsed_payload?.lines
            ? doc.parsed_payload
            : await apiClient.getTimesheetDocumentPreview(timesheetId, doc.id);
        setPreview(data);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, 'Could not preview this sheet'));
      } finally {
        setPreviewLoading(false);
      }
      return;
    }
    try {
      await apiClient.openTimesheetDocument(timesheetId, doc.id);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to open document'));
    }
  };

  const handleDownload = async (doc: TimesheetDocument) => {
    try {
      await apiClient.downloadTimesheetDocument(
        timesheetId,
        doc.id,
        doc.original_filename,
      );
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to download document'));
    }
  };

  const handleDelete = async (doc: TimesheetDocument) => {
    if (doc.source !== 'uploaded') {
      toast.error('Only files you uploaded can be removed');
      return;
    }
    if (!confirm(`Delete ${doc.original_filename}?`)) return;
    setDeletingId(doc.id);
    try {
      await apiClient.deleteTimesheetDocument(timesheetId, doc.id);
      toast.success('File deleted');
      await onDocumentsChange();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to delete file'));
    } finally {
      setDeletingId(null);
    }
  };

  const sorted = [...documents].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );

  return (
    <>
      <Card className='min-w-0 overflow-hidden bg-slate-800 border-slate-700'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-white'>
            <FileText className='h-5 w-5' />
            Documents
            {documents.length > 0 ? (
              <Badge
                variant='outline'
                className='border-slate-600 text-slate-300 font-normal'
              >
                {documents.length}
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription className='text-slate-400'>
            Upload your timesheet (PDF or Excel) and calculation sheet (Excel),
            then request an invoice from the calculation amounts.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {canUpload ? (
            <ol className='grid gap-3 sm:grid-cols-3'>
              <li className='rounded-md border border-slate-700 bg-slate-900/40 p-3'>
                <p className='text-xs uppercase tracking-wide text-slate-500'>
                  Step 1
                </p>
                <p className='text-sm font-medium text-white mt-1'>
                  Timesheet
                </p>
                <p
                  className='text-xs text-slate-400 mt-1 break-all line-clamp-2'
                  title={timesheetDoc?.original_filename}
                >
                  {timesheetDoc
                    ? timesheetDoc.original_filename
                    : 'PDF or Excel (.pdf, .xlsx)'}
                </p>
                <Button
                  type='button'
                  size='sm'
                  className='mt-3 w-full bg-slate-700 hover:bg-slate-600 text-white'
                  onClick={() => openUpload('timesheet')}
                >
                  <FileUp className='h-4 w-4 mr-2' />
                  {timesheetDoc ? 'Replace timesheet' : 'Upload timesheet'}
                </Button>
              </li>
              <li className='rounded-md border border-slate-700 bg-slate-900/40 p-3'>
                <p className='text-xs uppercase tracking-wide text-slate-500'>
                  Step 2
                </p>
                <p className='text-sm font-medium text-white mt-1'>
                  Calculation sheet
                </p>
                <p
                  className='text-xs text-slate-400 mt-1 break-all line-clamp-2'
                  title={calcDoc?.original_filename}
                >
                  {calcDoc
                    ? calcDoc.original_filename
                    : 'Required for invoice (.xlsx)'}
                </p>
                <Button
                  type='button'
                  size='sm'
                  className='mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white'
                  onClick={() => openUpload('calculation_sheet')}
                >
                  <Calculator className='h-4 w-4 mr-2' />
                  {calcDoc ? 'Replace calculation' : 'Upload calculation'}
                </Button>
              </li>
              <li className='rounded-md border border-slate-700 bg-slate-900/40 p-3'>
                <p className='text-xs uppercase tracking-wide text-slate-500'>
                  Step 3
                </p>
                <p className='text-sm font-medium text-white mt-1'>Invoice</p>
                <p className='text-xs text-slate-400 mt-1'>
                  {invoiceDoc
                    ? 'Generated from the calculation sheet'
                    : calcDoc
                      ? 'Ready to generate from the calculation sheet'
                      : 'Upload a calculation sheet first'}
                </p>
                <div className='mt-3 space-y-2'>
                  <Button
                    type='button'
                    size='sm'
                    className='w-full bg-emerald-600 hover:bg-emerald-500 text-white'
                    disabled={!calcDoc || requestingInvoice}
                    onClick={() => void handleRequestInvoice()}
                  >
                    {requestingInvoice ? (
                      <Spinner className='h-4 w-4' />
                    ) : (
                      <>
                        <Receipt className='h-4 w-4 mr-2' />
                        {invoiceDoc ? 'Request new invoice' : 'Request invoice'}
                      </>
                    )}
                  </Button>
                  {invoiceDoc ? (
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      className='w-full border-slate-600 text-slate-200'
                      onClick={() => void handleView(invoiceDoc)}
                    >
                      <Eye className='h-4 w-4 mr-2' />
                      View invoice
                    </Button>
                  ) : null}
                </div>
              </li>
            </ol>
          ) : null}

          {calcDoc?.parsed_payload?.lines?.length ? (
            <div className='min-w-0 max-w-full space-y-2'>
              <div className='flex items-center justify-between gap-2'>
                <h3 className='min-w-0 truncate text-sm font-medium text-white'>
                  Calculation sheet
                </h3>
                <Button
                  type='button'
                  size='sm'
                  variant='ghost'
                  className='h-8 text-slate-300'
                  onClick={() => void handleView(calcDoc)}
                >
                  Full preview
                </Button>
              </div>
              <CalculationSheetPreviewView preview={calcDoc.parsed_payload} />
            </div>
          ) : null}

          {sorted.length === 0 ? (
            <p className='text-sm text-slate-400 py-4 text-center border border-dashed border-slate-600 rounded-md'>
              No documents yet. Upload a timesheet (PDF or Excel) or a
              calculation sheet.
            </p>
          ) : (
            <ul className='space-y-2'>
              {sorted.map((doc) => {
                const canDelete = canUpload && doc.source === 'uploaded';
                return (
                  <li
                    key={doc.id}
                    className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2.5'
                  >
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <p className='text-sm font-medium text-white truncate'>
                          {documentTypeLabel(doc.document_type)}
                        </p>
                        <Badge
                          className={cn(
                            'font-normal text-[10px]',
                            doc.source === 'uploaded'
                              ? 'bg-sky-700 text-white'
                              : 'bg-slate-600 text-slate-100',
                          )}
                        >
                          {doc.source === 'uploaded' ? 'Uploaded' : 'Generated'}
                        </Badge>
                      </div>
                      <p className='text-xs text-slate-400 truncate'>
                        {doc.original_filename}
                        {formatFileSize(doc.file_size)
                          ? ` · ${formatFileSize(doc.file_size)}`
                          : ''}
                        {doc.created_at
                          ? ` · ${formatApiDate(doc.created_at)}`
                          : ''}
                      </p>
                    </div>
                    <div className='flex items-center gap-1 shrink-0'>
                      <Button
                        type='button'
                        size='sm'
                        variant='ghost'
                        className='h-8 text-slate-300'
                        onClick={() => void handleView(doc)}
                      >
                        <Eye className='h-3.5 w-3.5' />
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant='ghost'
                        className='h-8 text-slate-300'
                        onClick={() => void handleDownload(doc)}
                      >
                        <Download className='h-3.5 w-3.5' />
                      </Button>
                      {canDelete ? (
                        <Button
                          type='button'
                          size='sm'
                          variant='ghost'
                          className='h-8 text-red-400 hover:text-red-300'
                          disabled={deletingId === doc.id}
                          onClick={() => void handleDelete(doc)}
                        >
                          {deletingId === doc.id ? (
                            <Spinner className='h-3.5 w-3.5' />
                          ) : (
                            <Trash2 className='h-3.5 w-3.5' />
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={uploadKind !== null}
        onOpenChange={(open) => {
          if (!open && !uploading) {
            setUploadKind(null);
            resetUploadForm();
          }
        }}
      >
        <DialogContent className='bg-slate-800 border-slate-700 sm:max-w-md overflow-hidden max-w-[calc(100vw-2rem)]'>
          <DialogHeader>
            <DialogTitle className='text-white flex items-center gap-2'>
              <FileUp className='h-5 w-5 shrink-0' />
              {uploadKind === 'timesheet'
                ? 'Upload timesheet'
                : 'Upload calculation sheet'}
            </DialogTitle>
            <DialogDescription className='text-slate-400'>
              {uploadKind === 'timesheet'
                ? 'PDF or Excel (.pdf, .xlsx, .xls, or .csv), max 10 MB.'
                : 'Excel only (.xlsx, .xls, or .csv), max 10 MB. After upload, use Request invoice.'}
            </DialogDescription>
          </DialogHeader>
          <div className='min-w-0 space-y-2 py-1'>
            <Label className='text-slate-300'>
              {uploadKind === 'timesheet' ? 'PDF or Excel file' : 'Excel file'}
            </Label>
            <input
              ref={uploadInputRef}
              type='file'
              accept={
                uploadKind === 'timesheet'
                  ? '.pdf,.xlsx,.xls,.csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv'
                  : '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv'
              }
              className='sr-only'
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            <button
              type='button'
              onClick={() => uploadInputRef.current?.click()}
              className={cn(
                'flex w-full min-w-0 flex-col items-center justify-center gap-2 rounded-md border border-dashed px-3 py-6 text-center transition-colors',
                selectedFile
                  ? 'border-emerald-600/60 bg-emerald-950/20'
                  : 'border-slate-600 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-900/60',
              )}
            >
              <FileUp
                className={cn(
                  'h-7 w-7 shrink-0',
                  selectedFile ? 'text-emerald-400' : 'text-slate-400',
                )}
              />
              {selectedFile ? (
                <>
                  <span
                    className='w-full max-w-full break-all text-sm font-medium text-white'
                    title={selectedFile.name}
                  >
                    {selectedFile.name}
                  </span>
                  <span className='text-xs text-slate-400'>
                    {formatFileSize(selectedFile.size)} · Click to change file
                  </span>
                </>
              ) : (
                <>
                  <span className='text-sm font-medium text-slate-200'>
                    Click to choose a file
                  </span>
                  <span className='text-xs text-slate-500'>
                    {uploadKind === 'timesheet'
                      ? 'PDF or Excel, max 10 MB'
                      : 'Excel only, max 10 MB'}
                  </span>
                </>
              )}
            </button>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              className='border-slate-600 text-slate-300'
              disabled={uploading}
              onClick={() => {
                setUploadKind(null);
                resetUploadForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type='button'
              disabled={uploading || !selectedFile}
              className='bg-emerald-600 hover:bg-emerald-500 text-white'
              onClick={() => void handleUpload()}
            >
              {uploading ? (
                <Spinner className='h-4 w-4' />
              ) : (
                <>
                  <Upload className='h-4 w-4 mr-2' />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={preview !== null || previewLoading}
        onOpenChange={(open) => {
          if (!open) {
            setPreview(null);
            setPreviewLoading(false);
          }
        }}
      >
        <DialogContent className='bg-slate-800 border-slate-700 sm:max-w-3xl max-w-[calc(100vw-2rem)] min-w-0 overflow-hidden'>
          <DialogHeader>
            <DialogTitle className='text-white'>{previewTitle}</DialogTitle>
            <DialogDescription className='text-slate-400'>
              Amounts read from the Excel file.
            </DialogDescription>
          </DialogHeader>
          {previewLoading ? (
            <div className='flex justify-center py-10'>
              <Spinner className='h-8 w-8 text-white' />
            </div>
          ) : preview ? (
            <div className='min-w-0 max-w-full'>
              <CalculationSheetPreviewView preview={preview} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
