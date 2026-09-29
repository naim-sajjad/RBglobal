'use client';

import React, { useRef, useState } from 'react';
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
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { TimesheetDocument } from '@/lib/types';
import { toast } from 'sonner';
import { cn, formatApiDate, getApiErrorMessage } from '@/lib/utils';

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function documentTypeLabel(type: string) {
  if (type === 'invoice') return 'Invoice';
  if (type === 'calculation_sheet') return 'Calculation Sheet';
  return type;
}

type Props = {
  timesheetId: string | number;
  documents: TimesheetDocument[];
  onDocumentsChange: () => Promise<void> | void;
  /** When false, hide upload/delete (e.g. paid timesheets). Default true. */
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
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetUploadForm = () => {
    setSelectedFile(null);
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  };

  const openUploadDialog = () => {
    resetUploadForm();
    setUploadDialogOpen(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Choose a PDF invoice to upload');
      return;
    }
    setUploading(true);
    try {
      await apiClient.uploadTimesheetDocument(
        timesheetId,
        'invoice',
        selectedFile,
      );
      toast.success('Invoice uploaded');
      setUploadDialogOpen(false);
      resetUploadForm();
      await onDocumentsChange();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to upload invoice'));
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (doc: TimesheetDocument) => {
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
    if (doc.document_type !== 'invoice' || doc.source !== 'uploaded') {
      toast.error('Only invoices you uploaded can be removed');
      return;
    }
    if (!confirm(`Delete this uploaded invoice (${doc.original_filename})?`)) {
      return;
    }
    setDeletingId(doc.id);
    try {
      await apiClient.deleteTimesheetDocument(timesheetId, doc.id);
      toast.success('Invoice deleted');
      await onDocumentsChange();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to delete invoice'));
    } finally {
      setDeletingId(null);
    }
  };

  const sorted = [...documents].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );

  return (
    <>
      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between space-y-0'>
          <div>
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
            <CardDescription className='text-slate-400 mt-1'>
              Upload your invoice PDF for this week. Calculation sheets are
              created by admin only.
            </CardDescription>
          </div>
          {canUpload ? (
            <Button
              type='button'
              size='sm'
              className='shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white'
              onClick={openUploadDialog}
            >
              <Upload className='h-4 w-4 mr-2' />
              Upload invoice
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className='text-sm text-slate-400 py-6 text-center border border-dashed border-slate-600 rounded-md'>
              No documents yet.
              {canUpload ? ' Upload an invoice PDF to attach it to this timesheet.' : ''}
            </p>
          ) : (
            <ul className='space-y-2'>
              {sorted.map((doc) => {
                const isUploadedInvoice =
                  doc.document_type === 'invoice' && doc.source === 'uploaded';
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
                      {canUpload && isUploadedInvoice ? (
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
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          if (!open && !uploading) {
            setUploadDialogOpen(false);
            resetUploadForm();
          }
        }}
      >
        <DialogContent className='bg-slate-800 border-slate-700 sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-white flex items-center gap-2'>
              <FileUp className='h-5 w-5' />
              Upload invoice
            </DialogTitle>
            <DialogDescription className='text-slate-400'>
              PDF only, max 10 MB. Drivers can upload invoices only — not create
              or generate documents.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-1'>
            <div className='space-y-2'>
              <Label className='text-slate-300'>Invoice PDF</Label>
              <input
                ref={uploadInputRef}
                type='file'
                accept='application/pdf,.pdf'
                className='block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-slate-600'
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setSelectedFile(file);
                }}
              />
              {selectedFile ? (
                <p className='text-xs text-slate-400 truncate'>
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              className='border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
              disabled={uploading}
              onClick={() => {
                setUploadDialogOpen(false);
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
              {uploading ? <Spinner className='h-4 w-4' /> : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
