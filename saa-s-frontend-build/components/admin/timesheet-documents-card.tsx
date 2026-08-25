'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Calculator,
  Upload,
  Download,
  Eye,
  Trash2,
  ChevronDown,
  FileUp,
  Send,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import {
  TimesheetDocument,
  TimesheetDocumentReview,
  TimesheetDocumentType,
} from '@/lib/types';
import { toast } from 'sonner';
import { cn, formatApiDate, getApiErrorMessage } from '@/lib/utils';

const DOCUMENT_TYPE_LABELS: Record<TimesheetDocumentType, string> = {
  invoice: 'Invoice',
  calculation_sheet: 'Calculation Sheet',
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  approved: 'Confirmed',
  adjustment_requested: 'Adjustment Requested',
  superseded: 'Superseded',
  expired: 'Expired',
};

type PendingGenerate = TimesheetDocumentType | null;

type SharedProps = {
  timesheetId: string | number;
  documents: TimesheetDocument[];
  onDocumentsChange: () => Promise<void> | void;
  reviews?: TimesheetDocumentReview[];
};

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function documentSortKey(doc: TimesheetDocument) {
  const typeOrder = doc.document_type === 'invoice' ? 0 : 1;
  const sourceOrder = doc.source === 'generated' ? 0 : 1;
  return `${typeOrder}-${sourceOrder}-${doc.created_at}`;
}

/** Generate + Upload dropdowns for the timesheet top action row. */
export function TimesheetDocumentActions({
  timesheetId,
  documents,
  onDocumentsChange,
  onDocumentCreated,
  compact = false,
  reviews = [],
}: SharedProps & {
  onDocumentCreated?: () => void;
  compact?: boolean;
}) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [generatingType, setGeneratingType] = useState<PendingGenerate>(null);
  const [uploading, setUploading] = useState(false);
  const [sendingReview, setSendingReview] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadDocumentType, setUploadDocumentType] =
    useState<TimesheetDocumentType>('invoice');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [regenerateDialog, setRegenerateDialog] = useState<{
    open: boolean;
    documentType: TimesheetDocumentType;
  }>({ open: false, documentType: 'invoice' });

  const hasGenerated = useCallback(
    (type: TimesheetDocumentType) =>
      documents.some((d) => d.document_type === type && d.source === 'generated'),
    [documents],
  );

  const hasUploaded = useCallback(
    (type: TimesheetDocumentType) =>
      documents.some((d) => d.document_type === type && d.source === 'uploaded'),
    [documents],
  );

  const hasInvoice = documents.some((d) => d.document_type === 'invoice');
  const hasCalculation = documents.some(
    (d) => d.document_type === 'calculation_sheet',
  );
  const canSendReview = hasInvoice && hasCalculation;
  const latestReview = reviews[0] ?? null;

  const isBusy = !!generatingType || uploading || sendingReview;
  const triggerClass = compact
    ? 'h-8 shrink-0 gap-1 px-2.5 text-xs font-medium'
    : undefined;

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadDocumentType('invoice');
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  };

  const openUploadDialog = (type?: TimesheetDocumentType) => {
    resetUploadForm();
    if (type) setUploadDocumentType(type);
    setUploadDialogOpen(true);
  };

  const handleGenerate = async (
    documentType: TimesheetDocumentType,
    confirmRegenerate = false,
  ) => {
    setGeneratingType(documentType);
    try {
      await apiClient.generateTimesheetDocument(timesheetId, {
        document_type: documentType,
        confirm_regenerate: confirmRegenerate,
      });
      toast.success(`${DOCUMENT_TYPE_LABELS[documentType]} generated`);
      await onDocumentsChange();
      onDocumentCreated?.();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Failed to generate document');
      const response = (err as {
        response?: { status?: number; data?: { requires_confirmation?: boolean } };
      })?.response;
      if (response?.status === 409 && response.data?.requires_confirmation) {
        setRegenerateDialog({ open: true, documentType });
        return;
      }
      toast.error(msg);
    } finally {
      setGeneratingType(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      toast.error('Select a PDF file to upload');
      return;
    }
    if (
      selectedFile.type !== 'application/pdf' &&
      !selectedFile.name.toLowerCase().endsWith('.pdf')
    ) {
      toast.error('Only PDF files are supported');
      return;
    }

    setUploading(true);
    try {
      await apiClient.uploadTimesheetDocument(
        timesheetId,
        uploadDocumentType,
        selectedFile,
      );
      toast.success(`${DOCUMENT_TYPE_LABELS[uploadDocumentType]} uploaded`);
      setUploadDialogOpen(false);
      resetUploadForm();
      await onDocumentsChange();
      onDocumentCreated?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to upload document'));
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are supported');
      return;
    }
    setSelectedFile(file);
  };

  const handleSendReview = async () => {
    if (!canSendReview) {
      toast.error('Generate or upload both Invoice and Calculation Sheet first');
      return;
    }
    if (
      latestReview?.status === 'pending' &&
      !confirm(
        'A review email is already pending. Send a new package? The previous link will stop working.',
      )
    ) {
      return;
    }
    setSendingReview(true);
    try {
      const res = await apiClient.sendTimesheetDocumentReview(timesheetId);
      toast.success(res.message || 'Sent to driver for review');
      await onDocumentsChange();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to send for review'));
    } finally {
      setSendingReview(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type='button'
            size='sm'
            disabled={isBusy}
            className={cn(
              'bg-emerald-600 hover:bg-emerald-500 text-white',
              triggerClass,
            )}
          >
            {generatingType ? (
              <Spinner className='h-3.5 w-3.5' />
            ) : (
              <FileText className='h-3.5 w-3.5' />
            )}
            Generate
            <ChevronDown className='h-3.5 w-3.5 opacity-80' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          className='bg-slate-800 border-slate-700 text-white min-w-55'
        >
          <DropdownMenuItem
            className='focus:bg-slate-700 focus:text-white cursor-pointer'
            disabled={generatingType === 'invoice'}
            onClick={() => void handleGenerate('invoice')}
          >
            <FileText className='h-4 w-4 mr-2 text-emerald-400' />
            {hasGenerated('invoice') ? 'Regenerate Invoice' : 'Generate Invoice'}
          </DropdownMenuItem>
          <DropdownMenuItem
            className='focus:bg-slate-700 focus:text-white cursor-pointer'
            disabled={generatingType === 'calculation_sheet'}
            onClick={() => void handleGenerate('calculation_sheet')}
          >
            <Calculator className='h-4 w-4 mr-2 text-blue-400' />
            {hasGenerated('calculation_sheet')
              ? 'Regenerate Calculation Sheet'
              : 'Generate Calculation Sheet'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type='button'
            size='sm'
            variant='outline'
            disabled={isBusy}
            className={cn(
              'border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white',
              triggerClass,
            )}
          >
            <Upload className='h-3.5 w-3.5' />
            Upload
            <ChevronDown className='h-3.5 w-3.5 opacity-80' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          className='bg-slate-800 border-slate-700 text-white min-w-55'
        >
          <DropdownMenuItem
            className='focus:bg-slate-700 focus:text-white cursor-pointer'
            onClick={() => openUploadDialog('invoice')}
          >
            <FileText className='h-4 w-4 mr-2 text-emerald-400' />
            Upload Invoice
            {hasUploaded('invoice') ? (
              <span className='ml-auto text-xs text-slate-400'>Replace</span>
            ) : null}
          </DropdownMenuItem>
          <DropdownMenuItem
            className='focus:bg-slate-700 focus:text-white cursor-pointer'
            onClick={() => openUploadDialog('calculation_sheet')}
          >
            <Calculator className='h-4 w-4 mr-2 text-blue-400' />
            Upload Calculation Sheet
            {hasUploaded('calculation_sheet') ? (
              <span className='ml-auto text-xs text-slate-400'>Replace</span>
            ) : null}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type='button'
        size='sm'
        variant='outline'
        disabled={isBusy || !canSendReview}
        title={
          canSendReview
            ? latestReview
              ? `Latest: ${REVIEW_STATUS_LABELS[latestReview.status] ?? latestReview.status}`
              : 'Email invoice + calculation sheet to the driver'
            : 'Need both Invoice and Calculation Sheet'
        }
        className={cn(
          'border-slate-600 bg-slate-700 text-white hover:bg-slate-600 hover:text-white',
          triggerClass,
        )}
        onClick={() => void handleSendReview()}
      >
        {sendingReview ? (
          <Loader2 className='h-3.5 w-3.5 animate-spin' />
        ) : (
          <Send className='h-3.5 w-3.5' />
        )}
        Send for review
      </Button>

      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          setUploadDialogOpen(open);
          if (!open) resetUploadForm();
        }}
      >
        <DialogContent className='bg-slate-800 border-slate-700 sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-white'>Upload document</DialogTitle>
            <DialogDescription className='text-slate-400'>
              Choose the document type and select a PDF file. Uploading replaces
              any existing uploaded file of the same type.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-1'>
            <div className='space-y-2'>
              <Label htmlFor='upload-document-type' className='text-slate-300'>
                Document type
              </Label>
              <Select
                value={uploadDocumentType}
                onValueChange={(value) =>
                  setUploadDocumentType(value as TimesheetDocumentType)
                }
              >
                <SelectTrigger
                  id='upload-document-type'
                  className='bg-slate-700 border-slate-600 text-white'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-slate-800 border-slate-700 text-white'>
                  <SelectItem value='invoice'>Invoice</SelectItem>
                  <SelectItem value='calculation_sheet'>Calculation Sheet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label className='text-slate-300'>PDF file</Label>
              <input
                ref={uploadInputRef}
                type='file'
                accept='application/pdf,.pdf'
                className='hidden'
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
              <button
                type='button'
                onClick={() => uploadInputRef.current?.click()}
                className={cn(
                  'flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 transition-colors',
                  selectedFile
                    ? 'border-emerald-600/60 bg-emerald-950/20'
                    : 'border-slate-600 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-900/60',
                )}
              >
                <FileUp
                  className={cn(
                    'h-8 w-8',
                    selectedFile ? 'text-emerald-400' : 'text-slate-400',
                  )}
                />
                {selectedFile ? (
                  <>
                    <span className='text-sm font-medium text-white text-center break-all'>
                      {selectedFile.name}
                    </span>
                    <span className='text-xs text-slate-400'>
                      {formatFileSize(selectedFile.size)} · Click to change file
                    </span>
                  </>
                ) : (
                  <>
                    <span className='text-sm font-medium text-slate-200'>
                      Click to choose a PDF
                    </span>
                    <span className='text-xs text-slate-500'>PDF only, max 10 MB</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              className='border-slate-600 text-slate-300'
              disabled={uploading}
              onClick={() => setUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type='button'
              className='bg-emerald-600 hover:bg-emerald-500 text-white'
              disabled={uploading || !selectedFile}
              onClick={() => void handleUploadSubmit()}
            >
              {uploading ? (
                <Spinner className='h-4 w-4' />
              ) : (
                <>
                  <Upload className='h-4 w-4 mr-1' />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={regenerateDialog.open}
        onOpenChange={(open) =>
          setRegenerateDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className='bg-slate-800 border-slate-700'>
          <DialogHeader>
            <DialogTitle className='text-white'>Regenerate document?</DialogTitle>
            <DialogDescription className='text-slate-400'>
              A generated{' '}
              {DOCUMENT_TYPE_LABELS[regenerateDialog.documentType].toLowerCase()}{' '}
              already exists for this timesheet. Generating again will create a new
              version while keeping previous documents unless you delete them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              className='border-slate-600 text-slate-300'
              onClick={() =>
                setRegenerateDialog((prev) => ({ ...prev, open: false }))
              }
            >
              Cancel
            </Button>
            <Button
              type='button'
              className='bg-emerald-600 hover:bg-emerald-500 text-white'
              disabled={!!generatingType}
              onClick={() => {
                const type = regenerateDialog.documentType;
                setRegenerateDialog((prev) => ({ ...prev, open: false }));
                void handleGenerate(type, true);
              }}
            >
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Documents list section — shown when the user clicks View documents. */
export function TimesheetDocumentsCard({
  timesheetId,
  documents,
  onDocumentsChange,
  reviews = [],
}: SharedProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const sortedDocuments = [...documents].sort((a, b) =>
    documentSortKey(a).localeCompare(documentSortKey(b)),
  );
  const latestReview = reviews[0] ?? null;

  const handleDelete = async (doc: TimesheetDocument) => {
    const label = DOCUMENT_TYPE_LABELS[doc.document_type];
    const sourceLabel = doc.source === 'generated' ? 'generated' : 'uploaded';
    if (
      !confirm(`Delete this ${sourceLabel} ${label} (${doc.original_filename})?`)
    ) {
      return;
    }
    setDeletingId(doc.id);
    try {
      await apiClient.deleteTimesheetDocument(timesheetId, doc.id);
      toast.success('Document deleted');
      await onDocumentsChange();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to delete document'));
    } finally {
      setDeletingId(null);
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

  return (
    <Card id='timesheet-documents' className='bg-slate-800 border-slate-700'>
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
          Invoice and Calculation Sheet documents for this timesheet. Use
          Generate or Upload in the top toolbar to add more, then Send for review
          to email the driver.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {latestReview ? (
          <div
            className={cn(
              'rounded-md border px-3 py-3 text-sm',
              latestReview.status === 'approved'
                ? 'border-emerald-700/60 bg-emerald-950/30 text-emerald-200'
                : latestReview.status === 'adjustment_requested'
                  ? 'border-amber-700/60 bg-amber-950/30 text-amber-100'
                  : latestReview.status === 'pending'
                    ? 'border-blue-700/60 bg-blue-950/30 text-blue-100'
                    : 'border-slate-600 bg-slate-900/50 text-slate-300',
            )}
          >
            <div className='flex flex-wrap items-center gap-2 font-medium'>
              <span>
                {latestReview.status_label ||
                  REVIEW_STATUS_LABELS[latestReview.status] ||
                  latestReview.status}
              </span>
              {latestReview.sent_at ? (
                <span className='text-xs font-normal opacity-80'>
                  · sent {formatApiDate(latestReview.sent_at)}
                </span>
              ) : null}
              {latestReview.reviewed_at ? (
                <span className='text-xs font-normal opacity-80'>
                  · reviewed {formatApiDate(latestReview.reviewed_at)}
                </span>
              ) : null}
            </div>
            {latestReview.driver_email ? (
              <p className='mt-1 text-xs opacity-80'>
                Driver: {latestReview.driver_name || '—'} (
                {latestReview.driver_email})
              </p>
            ) : null}
            {latestReview.status === 'adjustment_requested' &&
            latestReview.adjustment_comment ? (
              <p className='mt-2 whitespace-pre-wrap text-xs leading-relaxed opacity-95'>
                {latestReview.adjustment_comment}
              </p>
            ) : null}
            {latestReview.status === 'adjustment_requested' ? (
              <div className='mt-2 flex flex-wrap items-center gap-2'>
                {latestReview.adjustment_status ? (
                  <span className='text-xs opacity-90 capitalize'>
                    Handling: {latestReview.adjustment_status.replace('_', ' ')}
                  </span>
                ) : null}
                <a
                  href='/admin/timesheets/adjustment-requests'
                  className='text-xs font-medium text-amber-200 underline underline-offset-2 hover:text-white'
                >
                  Manage adjustment requests
                </a>
              </div>
            ) : null}
          </div>
        ) : null}

        {sortedDocuments.length === 0 ? (
          <p className='text-sm text-slate-400 py-4 text-center border border-dashed border-slate-600 rounded-md'>
            No documents yet. Use Generate or Upload in the top toolbar to add
            documents.
          </p>
        ) : (
          <div className='space-y-2'>
            {sortedDocuments.map((doc) => (
              <div
                key={doc.id}
                className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border border-slate-700 bg-slate-900/50 px-3 py-3'
              >
                <div className='min-w-0 space-y-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='text-sm font-medium text-white truncate'>
                      {doc.original_filename}
                    </p>
                    <Badge
                      variant='outline'
                      className={cn(
                        'text-xs border-slate-600',
                        doc.document_type === 'invoice'
                          ? 'text-emerald-300'
                          : 'text-blue-300',
                      )}
                    >
                      {DOCUMENT_TYPE_LABELS[doc.document_type]}
                    </Badge>
                    <Badge
                      variant='outline'
                      className={cn(
                        'text-xs border-slate-600',
                        doc.source === 'generated'
                          ? 'text-violet-300'
                          : 'text-amber-300',
                      )}
                    >
                      {doc.source === 'generated' ? 'Generated' : 'Uploaded'}
                    </Badge>
                  </div>
                  <p className='text-xs text-slate-400'>
                    {formatApiDate(doc.created_at)}
                    {doc.file_size ? ` · ${formatFileSize(doc.file_size)}` : ''}
                    {doc.creator?.name ? ` · ${doc.creator.name}` : ''}
                  </p>
                </div>
                <div className='flex items-center gap-1 shrink-0'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='text-slate-300 hover:text-white'
                    onClick={() => void handleView(doc)}
                  >
                    <Eye className='h-4 w-4 mr-1' />
                    View
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='text-slate-300 hover:text-white'
                    onClick={() => void handleDownload(doc)}
                  >
                    <Download className='h-4 w-4 mr-1' />
                    Download
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='text-red-400 hover:text-red-300'
                    disabled={deletingId === doc.id}
                    onClick={() => void handleDelete(doc)}
                  >
                    {deletingId === doc.id ? (
                      <Spinner className='h-4 w-4' />
                    ) : (
                      <Trash2 className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
