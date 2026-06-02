'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  FileText,
  User,
  Truck,
  ExternalLink,
  CreditCard,
  Shield,
  Calendar,
  Download,
  Ban,
  CheckCircle,
  AlertTriangle,
  Briefcase,
  Home,
  IdCard,
  ClipboardList,
  GraduationCap,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { DriverWithDetails, DriverClass } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import RbLogo from '@/assets/images/RBlogo.jpg';

function getPublicStorageUrl(
  relativePath: string | undefined | null,
): string {
  if (!relativePath) return '';
  const trimmed = relativePath.replace(/^\/+/, '');
  const explicit = process.env.NEXT_PUBLIC_STORAGE_BASE_URL?.trim();
  if (explicit) {
    return `${explicit.replace(/\/$/, '')}/${trimmed}`;
  }
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api/v1';
  const origin = apiBase.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '');
  return `${origin}/storage/${trimmed}`;



}

function documentKind(path: string): 'image' | 'pdf' | 'other' {
  const m = path.match(/\.([^.]+)$/i);
  const ext = (m?.[1] || '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
}

/** Resolve `drivers/...` path for same-origin proxy (works when direct storage URL is cross-origin). */
function storageRelativePathForFetch(
  relativePath: string | undefined | null,
  resolvedUrl: string | undefined | null,
): string | null {
const trimmed = relativePath?.replace(/^\/+/, '').trim();
  if (trimmed) {
    return trimmed;
  }
  const u = resolvedUrl?.trim();
  if (!u) {
    return null;
  }
  try {
    const parsed = new URL(u);
    const idx = parsed.pathname.indexOf('/storage/');
    if (idx >= 0) {
      
 return parsed.pathname
        .slice(idx + '/storage/'.length)
        .replace(/^\/+/, '');
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Load a public storage image for jsPDF (fetch + data URL + format). */
async function fetchStorageImageForPdf(
  relativePath: string | undefined | null,
  resolvedUrl?: string | null,
): Promise<{ dataUrl: string; format: 'JPEG' | 'PNG' } | null> {
  const url =
    (resolvedUrl && resolvedUrl.trim()) ||
    getPublicStorageUrl(relativePath || undefined);
  if (!url) return null;

  const kindSource =
    (relativePath && relativePath.trim()) ||
    (() => {
      try {
        return decodeURIComponent(
          (resolvedUrl || url).split('?')[0].split('#')[0],
        )
          .split('/')
          .filter(Boolean)
          .pop();
      } catch {
        return '';
      }
    })();
  if (!kindSource || documentKind(kindSource) !== 'image') return null;

  const storageRel = storageRelativePathForFetch(relativePath, resolvedUrl ?? null);
  const tryUrls: string[] = [];
  if (storageRel && typeof window !== 'undefined') {
    tryUrls.push(
      `/api/storage-file?path=${encodeURIComponent(storageRel)}`,
    );
  }
  tryUrls.push(url);

  const ext = kindSource.match(/\.([^.]+)$/i)?.[1]?.toLowerCase() || '';

  for (const fetchUrl of tryUrls) {
    try {
      const res = await fetch(fetchUrl, { mode: 'cors', credentials: 'omit' });
      if (!res.ok) {
        continue;
      }
      const blob = await res.blob();
      const mime = (blob.type || '').split(';')[0].toLowerCase();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.onerror = () => reject(new Error('read failed'));
        fr.readAsDataURL(blob);
      });
      let format: 'JPEG' | 'PNG' = 'JPEG';
      if (mime === 'image/png' || ext === 'png') format = 'PNG';
      else if (
        mime === 'image/jpeg' ||
        mime === 'image/jpg' ||
        ['jpg', 'jpeg'].includes(ext)
      )
        format = 'JPEG';
      else if (ext === 'png') format = 'PNG';
      return { dataUrl, format };
    } catch {
      /* try next */
    }
  }
  return null;
}

function measureDataUrlImage(
  dataUrl: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    img.onerror = () => reject(new Error('image load'));
    img.src = dataUrl;
  });
}

function DocumentPreviewTile({
  title,
  path,
  absoluteUrl,
}: {
  title: string;
  path?: string | null;
  /** From API Driver model *_url when present — avoids guessing /storage base */
  absoluteUrl?: string | null;
}) {
  const url =
    (absoluteUrl && absoluteUrl.trim()) || getPublicStorageUrl(path || undefined);

  const kindProbe =
    (path && path.trim()) ||
    (url
      ? decodeURIComponent(url.split('?')[0].split('#')[0]).split('/').pop() ||
        ''
      : '');
  const kind = kindProbe ? documentKind(kindProbe) : 'other';
  const hasFile = Boolean((path && path.trim()) || (absoluteUrl && absoluteUrl.trim()));

  return (
    <div className='overflow-hidden rounded-lg border border-slate-700 bg-slate-900/40'>
      <div className='flex items-center justify-between gap-2 border-b border-slate-700 px-3 py-2'>
        <p className='truncate text-sm font-medium text-white'>{title}</p>
         {hasFile && url ? (
          <a
            href={url}
            target='_blank'
            rel='noopener noreferrer'
            className='flex shrink-0 items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline'
          >
            <ExternalLink className='h-3 w-3' />
            Open
          </a>
        ) : null}
      </div>
      <div className='flex min-h-[140px] items-center justify-center bg-slate-950/40 p-2'>
       {!hasFile || !url ? (
          <p className='text-xs text-slate-500'>No file uploaded</p>
        ) : kind === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element -- public storage URL from API
          <img
           src={url}
            alt={title}
            className='max-h-52 w-full rounded object-contain'
          />
        ) : kind === 'pdf' ? (
          <iframe
            src={url}
            title={title}
            className='h-52 w-full rounded border border-slate-700 bg-white'
          />
        ) : (
          <div className='flex flex-col items-center gap-2 py-6 text-center text-slate-400'>
            <FileText className='h-10 w-10' />
            <span className='text-xs'>
              Preview not available — use Open to view
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DriverDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();
  const driverId = searchParams.get('id');

  const [driver, setDriver] = useState<DriverWithDetails | null>(null);
  const [driverClasses, setDriverClasses] = useState<DriverClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingReferenceCheck, setIsUpdatingReferenceCheck] =
    useState(false);
  const [updatingDriverClass, setUpdatingDriverClass] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState<
    Record<string, boolean>
  >({});
  const [parsedComplianceData, setParsedComplianceData] = useState<any>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (driverId) {
      fetchDriver();
    } else {
      setError('Driver ID is required');
      setIsLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await apiClient.getDriverClasses({ status: 'active' });
        setDriverClasses(Array.isArray(list) ? list : []);
      } catch {
        setDriverClasses([]);
      }
    };
    load();
  }, []);

  const fetchDriver = async () => {
    if (!driverId) return;

    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.getDriver(driverId);
      setDriver(response);

      // Parse compliance_notes if it's JSON
      if (response.compliance_notes) {
        try {
          const parsed = JSON.parse(response.compliance_notes);
          setParsedComplianceData(parsed);
        } catch (e) {
          // If not JSON, keep as string
          setParsedComplianceData(null);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load driver details');
      toast.error('Failed to load driver details');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSensitiveField = (field: string) => {
    setShowSensitiveData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const maskSensitiveData = (
    value: string | null | undefined,
    field: string,
  ): string => {
    if (!value) return 'N/A';
    if (showSensitiveData[field]) return value;
    return '•'.repeat(Math.min(value.length, 20));
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!driver) return;

    setIsUpdating(true);
    try {
      await apiClient.updateDriver(driver.id, { status: newStatus as any });
      toast.success(`Driver status updated to ${newStatus}`);
      await fetchDriver();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to update driver status',
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReferenceCheckStatusChange = async (
    next: 'pending' | 'completed',
  ) => {
    if (!driver) return;
    setIsUpdatingReferenceCheck(true);
    try {
      await apiClient.updateDriver(driver.id, {
        reference_check_status: next,
      });
      toast.success(
        next === 'completed'
          ? 'Reference check marked complete'
          : 'Reference check marked pending',
      );
      await fetchDriver();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          'Failed to update reference check status',
      );
    } finally {
      setIsUpdatingReferenceCheck(false);
    }
  };

  const handleApprove = async () => {
    if (!driver) return;

    setIsUpdating(true);
    try {
      await apiClient.approveDriver(driver.id);
      toast.success('Driver approved successfully');
      await fetchDriver();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve driver');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDriverClassChange = async (driverClassId: string) => {
    if (!driver) return;
    const value =
      driverClassId === '__none__' ? null : parseInt(driverClassId, 10);
    if (value !== null && isNaN(value)) return;
    setUpdatingDriverClass(true);
    try {
      await apiClient.updateDriver(driver.id, {
        driver_class_id: value,
        driver_class_effective_date:
          driver.driver_class_effective_date || undefined,
      });
      toast.success(
        'Driver class updated. Timesheet rates use this class for payroll.',
      );
      await fetchDriver();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to update driver class',
      );
    } finally {
      setUpdatingDriverClass(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string; icon: React.ReactNode }
    > = {
      pending_approval: {
        label: 'Pending Approval',
        className: 'bg-yellow-600 hover:bg-yellow-700',
        icon: <AlertCircle className='h-3 w-3 mr-1' />,
      },
      active: {
        label: 'Active',
        className: 'bg-green-600 hover:bg-green-700',
        icon: <CheckCircle className='h-3 w-3 mr-1' />,
      },
      inactive: {
        label: 'Inactive',
        className: 'bg-slate-600 hover:bg-slate-700',
        icon: <XCircle className='h-3 w-3 mr-1' />,
      },
      suspended: {
        label: 'Suspended',
        className: 'bg-red-600 hover:bg-red-700',
        icon: <Ban className='h-3 w-3 mr-1' />,
      },
    };

    const config = statusConfig[status] || statusConfig.pending_approval;
    return (
      <Badge
        variant='secondary'
        className={`${config.className} text-white flex items-center`}
      >
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const checkCompliance = () => {
    if (!driver) return { isCompliant: false, issues: [] };

    const issues: string[] = [];

    // Check required documents
    if (!driver.pcc_document_path) {
      issues.push('PCC / Criminal Background Check missing');
    }
    if (!driver.license_front_image_path) {
      issues.push('License front image missing');
    }
    if (!driver.license_back_image_path) {
      issues.push('License back image missing');
    }
    if (!driver.abstract_document_path) {
      issues.push('Abstract Document missing');
    }
    if (!driver.cvor_document_path) {
      issues.push('CVOR Document missing');
    }
    if (!driver.safety_certificate_path) {
      issues.push('Safety Certificate missing');
    }

    // Check license expiry
    if (driver.license_expiry_date) {
      const expiryDate = new Date(driver.license_expiry_date);
      const today = new Date();
      if (expiryDate < today) {
        issues.push('License has expired');
      } else if (
        expiryDate < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      ) {
        issues.push('License expiring within 30 days');
      }
    }

    // Check background check
    if (driver.background_check_status !== 'completed') {
      issues.push('Background check not completed');
    }

    return {
      isCompliant: issues.length === 0,
      issues,
    };
  };

  const checkInvoiceReadiness = () => {
    if (!driver) return false;

    const compliance = checkCompliance();
    return (
      driver.status === 'active' &&
      compliance.isCompliant &&
      driver.user?.email &&
      driver.license_number
    );
  };

  const exportToPDF = async () => {
    if (!driver) return;
    const pdfDriver = driver;

    setExportingPdf(true);
    try {
      // Fetch reference checks for this driver (so they are included in PDF)
      let referenceChecks: any[] = [];
      try {
        const checksData = await apiClient.getReferenceChecks(pdfDriver.id);
        referenceChecks = Array.isArray(checksData)
          ? checksData
          : (checksData?.data ?? []);
      } catch {
        referenceChecks = [];
      }

      // Dynamic import of jspdf (requires: npm install jspdf)
      // @ts-ignore - jspdf types may not be available
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      let yPos = 0;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const lineHeight = 6;
      const wrappedTextOptions = { lineHeightFactor: 1.75 };

      // Helper function to draw a line
      const drawLine = (x: number, y: number, length: number) => {
        doc.setLineWidth(0.35);
        doc.setDrawColor(0, 0, 0);
        doc.line(x, y, x + length, y);
      };

      const drawValueLines = (
        lines: string[],
        x: number,
        y: number,
        width: number,
      ) => {
        lines.forEach((_, index) => {
          drawLine(x, y + index * lineHeight + 1.8, width);
        });
      };

      // Helper function to add form field (label with underlined value)
      const addFormField = (
        label: string,
        value: string,
        x: number,
        y: number,
        labelWidth: number = 50,
        fieldWidth: number = 100,
      ) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(label + ':', x, y);
        const valueText = value || '';
        doc.text(valueText, x + labelWidth, y);
        drawLine(x + labelWidth, y + 2, fieldWidth);
        return y + lineHeight;
      };

      // Helper function to add checkbox
      const addCheckbox = (
        label: string,
        checked: boolean,
        x: number,
        y: number,
      ) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const checkboxSize = 4.2;
        const checkboxY = y - 3.4;
        const textX = x + checkboxSize + 4.5;

        doc.setLineWidth(0.45);
        doc.setDrawColor(0, 0, 0);
        doc.rect(x, checkboxY, checkboxSize, checkboxSize);

        if (checked) {
          doc.setLineWidth(0.65);
          doc.line(x + 0.8, checkboxY + 2.2, x + 1.7, checkboxY + 3.1);
          doc.line(x + 1.7, checkboxY + 3.1, x + 3.5, checkboxY + 0.9);
          doc.setLineWidth(0.45);
        }

        doc.text(label, textX, y);
      };

      // Helper function to check if new page needed
      const checkNewPage = (requiredSpace: number) => {
        if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPos = 20;
        }
      };

      const formatPdfDate = (value?: string | null) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      };

      const yesNoValue = (value: unknown) => {
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (value === null || value === undefined || value === '') return 'N/A';
        return String(value);
      };

      const addSectionTitle = (title: string) => {
        checkNewPage(18);
        yPos += 4;
        doc.setFillColor(30, 58, 138);
        doc.rect(margin, yPos, maxWidth, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin + 3, yPos + 5.5);
        doc.setTextColor(0, 0, 0);
        yPos += 13;
      };

      const addTextField = (
        label: string,
        value: unknown,
        labelWidth = 52,
      ) => {
        checkNewPage(14);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        const text = value === null || value === undefined || value === ''
          ? 'N/A'
          : String(value);
        const labelText = `${label}:`;
        const effectiveLabelWidth = Math.min(
          doc.getTextWidth(labelText) + 3,
          86,
        );

        if (effectiveLabelWidth > maxWidth * 0.48) {
          const labelLines = doc.splitTextToSize(labelText, maxWidth);
          doc.text(labelLines, margin, yPos, wrappedTextOptions);
          yPos += labelLines.length * lineHeight;
          doc.setFont('helvetica', 'normal');
          const valueLines = doc.splitTextToSize(text, maxWidth);
          doc.text(valueLines, margin, yPos, wrappedTextOptions);
          drawValueLines(valueLines, margin, yPos, maxWidth);
          yPos += valueLines.length * lineHeight + 2;
          return;
        }

        doc.text(labelText, margin, yPos);
        doc.setFont('helvetica', 'normal');
        const valueX = margin + effectiveLabelWidth;
        const valueWidth = maxWidth - effectiveLabelWidth;
        const lines = doc.splitTextToSize(
          text,
          valueWidth - 4,
        );
        doc.text(lines, valueX, yPos, wrappedTextOptions);
        drawValueLines(lines, valueX, yPos, valueWidth);
        yPos += Math.max(lineHeight, lines.length * lineHeight) + 2;
      };

      const addTwoColumnFields = (
        leftLabel: string,
        leftValue: unknown,
        rightLabel: string,
        rightValue: unknown,
      ) => {
        checkNewPage(12);
        const leftX = margin;
        const rightX = margin + maxWidth / 2 + 4;
        const colWidth = maxWidth / 2 - 8;
        const leftText =
          leftValue === null || leftValue === undefined || leftValue === ''
            ? 'N/A'
            : String(leftValue);
        const rightText =
          rightValue === null || rightValue === undefined || rightValue === ''
            ? 'N/A'
            : String(rightValue);
        const leftLabelText = `${leftLabel}:`;
        const rightLabelText = `${rightLabel}:`;
        const leftLabelWidth = Math.min(
          colWidth * 0.72,
          doc.getTextWidth(leftLabelText) + 3,
        );
        const rightLabelWidth = Math.min(
          colWidth * 0.72,
          doc.getTextWidth(rightLabelText) + 3,
        );
        const leftLines = doc.splitTextToSize(
          leftText,
          colWidth - leftLabelWidth - 2,
        );
        const rightLines = doc.splitTextToSize(
          rightText,
          colWidth - rightLabelWidth - 2,
        );

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.text(leftLabelText, leftX, yPos);
        doc.text(rightLabelText, rightX, yPos);
        doc.setFont('helvetica', 'normal');
        const leftValueX = leftX + leftLabelWidth;
        const rightValueX = rightX + rightLabelWidth;
        const leftValueWidth = colWidth - leftLabelWidth;
        const rightValueWidth = colWidth - rightLabelWidth;
        doc.text(leftLines, leftValueX, yPos, wrappedTextOptions);
        doc.text(rightLines, rightValueX, yPos, wrappedTextOptions);
        drawValueLines(leftLines, leftValueX, yPos, leftValueWidth);
        drawValueLines(rightLines, rightValueX, yPos, rightValueWidth);
        yPos += Math.max(lineHeight, leftLines.length * lineHeight, rightLines.length * lineHeight) + 2;
      };

      const addYesNoField = (label: string, value: unknown) => {
        checkNewPage(18);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        const labelLines = doc.splitTextToSize(`${label}:`, maxWidth);
        doc.text(labelLines, margin, yPos, wrappedTextOptions);
        yPos += labelLines.length * lineHeight;
        doc.setFont('helvetica', 'normal');
        const normalized = String(value || '').toLowerCase();
        const isYes = normalized === 'yes' || normalized === 'true';
        const isNo = normalized === 'no' || normalized === 'false';
        addCheckbox('YES', isYes, margin + 6, yPos);
        addCheckbox('NO', isNo, margin + 42, yPos);
        yPos += lineHeight + 4;
      };

      const addUploadedImagePreview = async (
        label: string,
        relativePath: string | undefined | null,
        resolvedUrl?: string | null,
      ) => {
        if (!relativePath && !resolvedUrl) {
          return;
        }

        const loaded = await fetchStorageImageForPdf(relativePath, resolvedUrl);
        checkNewPage(92);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, margin, yPos);
        yPos += lineHeight + 2;

        if (!loaded) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text('Could not load uploaded image', margin, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += lineHeight + 4;
          return;
        }

        try {
          const { width: naturalWidth, height: naturalHeight } =
            await measureDataUrlImage(loaded.dataUrl);
          const maxImageWidth = maxWidth;
          const maxImageHeight = 78;
          const scale = Math.min(
            maxImageWidth / naturalWidth,
            maxImageHeight / naturalHeight,
            1,
          );
          const imageWidth = naturalWidth * scale;
          const imageHeight = naturalHeight * scale;
          doc.addImage(
            loaded.dataUrl,
            loaded.format,
            margin,
            yPos,
            imageWidth,
            imageHeight,
            undefined,
            'FAST',
          );
          yPos += imageHeight + 8;
        } catch {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(180, 0, 0);
          doc.text('Could not embed uploaded image', margin, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += lineHeight + 4;
        }
      };

      const addTable = (
        headers: string[],
        rows: Array<Array<unknown>>,
        widths: number[],
      ) => {
        checkNewPage(16);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        let x = margin;
        headers.forEach((header, index) => {
          doc.text(header, x, yPos);
          x += widths[index];
        });
        yPos += 5;
        drawLine(margin, yPos - 2, maxWidth);
        yPos += 4;
        doc.setFont('helvetica', 'normal');

        if (rows.length === 0) {
          doc.text('None recorded', margin, yPos);
          yPos += lineHeight + 2;
          return;
        }

        rows.forEach((row) => {
          checkNewPage(14);
          x = margin;
          let rowHeight = lineHeight;
          row.forEach((cell, index) => {
            const text =
              cell === null || cell === undefined || cell === ''
                ? 'N/A'
                : String(cell);
            const lines = doc.splitTextToSize(text, widths[index] - 3);
            doc.text(lines, x, yPos, wrappedTextOptions);
            rowHeight = Math.max(rowHeight, lines.length * lineHeight);
            x += widths[index];
          });
          yPos += rowHeight + 1;
        });
      };

      // New driver application PDF sequence: match the registration wizard order.
      yPos = 10;
      try {
        const pdfLogoImg = new Image();
        const pdfLogoSrc =
          typeof RbLogo === 'string'
            ? RbLogo
            : (RbLogo as any)?.src ||
              (RbLogo as any)?.default ||
              String(RbLogo);
        pdfLogoImg.crossOrigin = 'anonymous';
        const pdfLogoDataUrl = await new Promise<string>((resolve, reject) => {
          pdfLogoImg.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = pdfLogoImg.width;
            canvas.height = pdfLogoImg.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }
            ctx.drawImage(pdfLogoImg, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.95));
          };
          pdfLogoImg.onerror = () =>
            reject(new Error('Failed to load logo image'));
          pdfLogoImg.src = pdfLogoSrc;
        });
        const pdfLogoWidth = 38;
        const pdfLogoHeight =
          (pdfLogoImg.height / pdfLogoImg.width) * pdfLogoWidth;
        doc.addImage(
          pdfLogoDataUrl,
          'JPEG',
          (pageWidth - pdfLogoWidth) / 2,
          yPos,
          pdfLogoWidth,
          pdfLogoHeight,
        );
        yPos += pdfLogoHeight + 8;
      } catch {
        doc.setFillColor(30, 58, 138);
        doc.rect((pageWidth - 24) / 2, yPos, 24, 16, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('R&B', pageWidth / 2, yPos + 10, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        yPos += 24;
      }

      doc.setFillColor(30, 58, 138);
      doc.rect(margin, yPos, maxWidth, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DRIVER REGISTRATION APPLICATION', pageWidth / 2, yPos + 7, {
        align: 'center',
      });
      doc.setTextColor(0, 0, 0);
      yPos += 17;
      addTwoColumnFields(
        'Applicant',
        pdfDriver.user?.name || 'Driver',
        'Export Date',
        formatPdfDate(new Date().toISOString()),
      );

      const pdfNameParts = pdfDriver.user?.name?.trim().split(/\s+/) || [];
      const pdfFirstName = pdfNameParts[0] || '';
      const pdfLastName = pdfNameParts.slice(1).join(' ') || '';
      const pdfPersonal = parsedComplianceData?.personal || {};
      const pdfAddress = parsedComplianceData?.address || {};
      const pdfLicense = parsedComplianceData?.license || {};
      const pdfQuestions = parsedComplianceData?.questions || {};
      const pdfDriving = parsedComplianceData?.driving_experience || {};
      const pdfAccident = pdfDriving.accident_history || {};
      const pdfEmployment = parsedComplianceData?.employment_history || {};
      const pdfLicenseType =
        pdfDriver.license_type === 'Other' && pdfDriver.license_other
          ? pdfDriver.license_other
          : pdfDriver.license_type;

      addSectionTitle('1. Personal Information');
      addTwoColumnFields('First Name', pdfFirstName, 'Last Name', pdfLastName);
      addTwoColumnFields(
        'Middle Initial',
        pdfPersonal.middle_initial,
        'Gender',
        pdfPersonal.gender,
      );
      addTwoColumnFields(
        'Date of Birth',
        formatPdfDate(pdfPersonal.date_of_birth),
        'Phone Number',
        pdfAddress.cell_phone,
      );
      addTextField('Email', pdfDriver.user?.email);
      addTextField('Certification or Education', pdfPersonal.education);
      addYesNoField(
        'Are you legally entitled to work in Canada?',
        pdfPersonal.work_eligibility_canada,
      );
      addYesNoField(
        'Do you have any physical difficulties or medical limitation that might stop you from performing the position of a truck driver?',
        pdfPersonal.medical_limitations,
      );
      if (String(pdfPersonal.medical_limitations || '').toLowerCase() === 'yes') {
        addTextField(
          'If Yes, please explain',
          pdfPersonal.medical_limitations_explanation,
        );
      }

      addSectionTitle('2. Address Information');
      addTextField('Street Address', pdfAddress.current_address);
      addTwoColumnFields('City', pdfAddress.city, 'Province', pdfAddress.province);
      addTwoColumnFields(
        'Postal Code',
        pdfAddress.postal_code,
        'Living since / time period',
        formatPdfDate(pdfAddress.current_address_living_since) ||
          pdfAddress.current_address_living_since,
      );
      const pdfPreviousAddresses = Array.isArray(pdfAddress.previous_addresses)
        ? pdfAddress.previous_addresses
        : [];
      addTable(
        ['Previous Address', 'From', 'To'],
        pdfPreviousAddresses.map((addr: any) => [
          addr.address,
          formatPdfDate(addr.from_date) || addr.from_date,
          formatPdfDate(addr.to_date) || addr.to_date,
        ]),
        [100, 42, 42],
      );

      addSectionTitle('3. License Information');
      addTwoColumnFields(
        'License Number',
        pdfDriver.license_number,
        'Province',
        pdfLicense.license_province,
      );
      addTwoColumnFields('Class', pdfLicense.license_class, 'License type', pdfLicenseType);
      addTwoColumnFields(
        'Issue Date',
        formatPdfDate((pdfDriver as any).license_issue_date),
        'Expiry Date',
        formatPdfDate(pdfDriver.license_expiry_date),
      );
      addTextField('Issuing Authority', pdfDriver.issuing_authority);
      addTwoColumnFields(
        'Endorsements',
        pdfLicense.license_endorsements,
        'Conditions',
        pdfLicense.license_conditions,
      );
      addYesNoField(
        'Have you ever been denied a license or permit to operate a vehicle?',
        pdfQuestions.license_denied,
      );
      addYesNoField(
        'Have you ever had your driving privileges revoked or suspended?',
        pdfQuestions.privileges_revoked,
      );
      addYesNoField(
        'Do you have a dangerous good certificate?',
        pdfQuestions.dangerous_goods_certificate,
      );
      await addUploadedImagePreview(
        'License Front Image',
        (pdfDriver as any).license_front_image_path,
        (pdfDriver as any).license_front_image_url,
      );
      await addUploadedImagePreview(
        'License Back Image',
        (pdfDriver as any).license_back_image_path,
        (pdfDriver as any).license_back_image_url,
      );

      addSectionTitle('4. Driving Experience');
      addTextField(
        'Vehicle Types',
        Array.isArray(pdfDriver.vehicle_types)
          ? pdfDriver.vehicle_types.join(', ')
          : pdfDriver.vehicle_types,
      );
      const pdfEquipment = Array.isArray(pdfDriving.equipment_used)
        ? pdfDriving.equipment_used
        : [];
      addTable(
        ['Make', 'Tractor Type', 'Transmissions', 'Trailer Type', 'Areas Operated'],
        pdfEquipment.map((item: any) => [
          item.make,
          item.tractor_type,
          item.transmissions,
          item.trailer_type,
          item.areas_operated,
        ]),
        [30, 34, 36, 40, 44],
      );
      addYesNoField('Ever had accidents?', pdfAccident.ever_had_accidents);
      if (String(pdfAccident.ever_had_accidents || '').toLowerCase() === 'yes') {
        addTextField('Number of incidents', pdfAccident.number_of_incidents);
        addTextField('If Yes, please explain', pdfAccident.accident_explanation);
      }
      const pdfViolations = Array.isArray(pdfDriving.traffic_violations)
        ? pdfDriving.traffic_violations
        : [];
      addTable(
        ['Date', 'Location', 'Violation/Charge', 'Penalty'],
        pdfViolations.map((item: any) => [
          formatPdfDate(item.date) || item.date,
          item.location,
          item.violation_charge,
          item.penalty,
        ]),
        [34, 45, 65, 40],
      );

      addSectionTitle('5. Employment History');
      const pdfCurrentEmployer = pdfEmployment.current_employer || {};
      addTextField('Current/Most Recent Employer - Company', pdfCurrentEmployer.company);
      addTwoColumnFields(
        'Supervisor',
        pdfCurrentEmployer.supervisor,
        'Phone',
        pdfCurrentEmployer.phone,
      );
      addTextField('Address', pdfCurrentEmployer.address);
      addTwoColumnFields(
        'Position',
        pdfCurrentEmployer.position,
        'Start Date',
        formatPdfDate(pdfCurrentEmployer.start_date) ||
          pdfCurrentEmployer.start_date,
      );
      addTextField(
        'End Date',
        formatPdfDate(pdfCurrentEmployer.end_date) || pdfCurrentEmployer.end_date,
      );
      addTextField('Reasons for Leaving', pdfCurrentEmployer.reasons_for_leaving);
      const pdfPreviousEmployers = Array.isArray(pdfEmployment.previous_employers)
        ? pdfEmployment.previous_employers
        : [];
      pdfPreviousEmployers.forEach((employer: any, index: number) => {
        addSectionTitle(`5.${index + 1} Previous Employer`);
        addTextField('Company', employer.company);
        addTwoColumnFields('Supervisor', employer.supervisor, 'Phone', employer.phone);
        addTextField('Address', employer.address);
        addTextField('Position', employer.position);
        addTwoColumnFields(
          'Start Date',
          formatPdfDate(employer.start_date) || employer.start_date,
          'End Date',
          formatPdfDate(employer.end_date) || employer.end_date,
        );
        addTextField('Reasons for Leaving', employer.reasons_for_leaving);
      });

      /*
      addSectionTitle('6. Documents');
      addTwoColumnFields(
        'PCC / Criminal Background Check',
        (pdfDriver as any).pcc_document_path ? 'Uploaded' : 'N/A',
        'License Front Image',
        (pdfDriver as any).license_front_image_path ? 'Uploaded' : 'N/A',
      );
      addTwoColumnFields(
        'License Back Image',
        (pdfDriver as any).license_back_image_path ? 'Uploaded' : 'N/A',
        'Abstract Document',
        pdfDriver.abstract_document_path ? 'Uploaded' : 'N/A',
      );
      addTwoColumnFields(
        'CVOR Document',
        pdfDriver.cvor_document_path ? 'Uploaded' : 'N/A',
        'Safety Certificate (If Any)',
        pdfDriver.safety_certificate_path ? 'Uploaded' : 'N/A',
      );
      addTwoColumnFields(
        'Background Check',
        pdfDriver.background_check_status,
        'Reference Check',
        pdfDriver.reference_check_status || 'pending',
      );
      addTextField('Compliance Notes', parsedComplianceData?.existing_notes);
      */

      addSectionTitle('Reference Checks');
      addTwoColumnFields(
        'Driver reference check status',
        pdfDriver.reference_check_status || 'pending',
        'Reference checks on file',
        referenceChecks.length,
      );
      if (referenceChecks.length > 0) {
        referenceChecks.forEach((refCheck: any, refIndex: number) => {
          checkNewPage(40);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(`Reference Check ${refIndex + 1}`, margin, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const pdfRefReq = refCheck.reference_request || {};
          const pdfRefForm = refCheck.form_data || {};
          addTwoColumnFields('Status', refCheck.status, 'Filled by', refCheck.filled_by);
          addTextField('Previous Company', pdfRefReq.previous_company_name);
          addTwoColumnFields(
            'Company Phone',
            pdfRefReq.previous_company_phone,
            'Supervisor/Employer',
            pdfRefReq.supervisor_employer_name,
          );
          if (refCheck.form_data) {
            addTwoColumnFields(
              'Date of Reference Check',
              formatPdfDate(pdfRefForm.date_of_reference_check),
              'Relationship',
              pdfRefForm.relationship_to_applicant === 'other'
                ? `Other: ${pdfRefForm.relationship_other_specify || ''}`
                : 'Supervisor',
            );
            addTwoColumnFields(
              'Employment From',
              formatPdfDate(pdfRefForm.date_of_employment_from),
              'To',
              formatPdfDate(pdfRefForm.date_of_employment_to),
            );
            addTextField('Position(s) Held', pdfRefForm.positions_held);
            addTextField('Nature of Job', pdfRefForm.nature_of_job);
            addTextField('Reason for leaving', pdfRefForm.reason_for_leaving);
            addTextField('Additional comments', pdfRefForm.additional_comments);
          }
        });
      }

      addSectionTitle('Declaration');
      const pdfDeclarationText = [
        'By completing and submitting this signed application I:',
        'Authorize R&B Services Inc. to investigate my reputation, background, character and prior employment by contacting my employer, references or any other individuals the employer deems necessary.',
        'Understand that I am required to abide by all the rules and regulations set out by this company.',
        'Certify that all the entries and information on this application is true and complete to the best of my knowledge.',
      ];
      pdfDeclarationText.forEach((text) => {
        checkNewPage(12);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.text(lines, margin, yPos);
        yPos += lines.length * lineHeight + 2;
      });
      yPos += 8;
      checkNewPage(35);
      const pdfPrintName = pdfDriver.user?.name || '';
      const pdfSignedDate = formatPdfDate(new Date().toISOString());
      doc.text(pdfPrintName, margin + 8, yPos);
      drawLine(margin + 8, yPos + 2, 72);
      doc.text('Print Name', margin + 24, yPos + 8);
      doc.text(pdfSignedDate, pageWidth - margin - 70, yPos);
      drawLine(pageWidth - margin - 70, yPos + 2, 60);
      doc.text('Date', pageWidth - margin - 48, yPos + 8);
      yPos += 25;
      drawLine(margin + 8, yPos, 90);
      doc.text('Signature of Applicant', margin + 8, yPos + 8);

      const pdfDownloadName = `Driver_Application_${pdfDriver.user?.name?.replace(/\s+/g, '_') || 'Driver'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(pdfDownloadName);
      toast.success('PDF exported successfully');
      return;

      // Header with Logo
      try {
        // Load logo image for PDF
        const logoImg = new Image();
        // Handle Next.js StaticImageData or string path
        const logoSrc =
          typeof RbLogo === 'string'
            ? RbLogo
            : (RbLogo as any)?.src ||
              (RbLogo as any)?.default ||
              String(RbLogo);
        logoImg.crossOrigin = 'anonymous';

        // Convert image to base64 data URL for jsPDF
        const logoDataUrl = await new Promise<string>((resolve, reject) => {
          logoImg.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = logoImg.width;
              canvas.height = logoImg.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(logoImg, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.95));
              } else {
                reject(new Error('Failed to get canvas context'));
              }
            } catch (error) {
              reject(error);
            }
          };
          logoImg.onerror = () =>
            reject(new Error('Failed to load logo image'));
          logoImg.src = logoSrc;
        });

        // Add logo image to PDF (width: 40, height: auto-proportioned)
        const logoWidth = 40;
        // Calculate center position
        const xCentered = (pageWidth - logoWidth) / 2;
        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
        doc.addImage(
          logoDataUrl,
          'JPEG',
          xCentered,
          yPos,
          logoWidth,
          logoHeight,
        );

        // Company Name next to logo
        // doc.setTextColor(0, 0, 0);
        // doc.setFontSize(14);
        // doc.setFont('helvetica', 'bold');
        // doc.text('SERVICES PLUS INC.', margin + 45, yPos + 8);
        // doc.setFontSize(9);
        // doc.setFont('helvetica', 'italic');
        // doc.text('"Your Human Resources Partner"', margin + 45, yPos + 14);

        yPos += 10;
      } catch (error) {
        // Fallback to text if image fails to load
        console.error('Failed to load logo:', error);
        doc.setFillColor(30, 58, 138); // Blue color
        doc.rect(margin, yPos, 20, 20, 'F'); // Blue oval/rectangle for logo
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('R&B', margin + 6, yPos + 12);

        // Company Name
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('SERVICES PLUS INC.', margin + 25, yPos + 8);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text('"Your Human Resources Partner"', margin + 25, yPos + 14);
        yPos += 25;
      }

      yPos += 25;
      doc.setFillColor(30, 58, 138);
      doc.rect(margin, yPos, pageWidth - margin * 2, 10, 'F');

      const contentWidth = pageWidth - margin * 2;
      const boxCenterX = margin + contentWidth / 2;

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');

      doc.text(
        'EMPLOYMENT APPLICATION FOR A TRUCK DRIVER',
        boxCenterX,
        yPos + 7,
        { align: 'center' },
      );
      yPos += 15;

      // Date field at top right
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      doc.text(`Date: ${currentDate}`, pageWidth - margin - 40, yPos);
      yPos += 10;

      // Name Section
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const nameParts = pdfDriver.user?.name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const middleInitial =
        parsedComplianceData?.personal?.middle_initial || '';

      // Name field with First/Last labels
      doc.text('Name:', margin, yPos);
      doc.text(firstName, margin + 25, yPos);
      drawLine(margin + 25, yPos + 2, 50);
      doc.text('(First)', margin + 80, yPos);

      // Last name with increased width to prevent cutting
      doc.text('', margin + 110, yPos); // Empty label for last name
      const lastNameWidth = doc.getTextWidth(lastName);
      doc.text(lastName, margin + 110, yPos);
      drawLine(margin + 110, yPos + 2, Math.max(70, lastNameWidth + 10)); // Dynamic width based on text
      doc.text('(Last)', margin + 185, yPos);
      yPos += lineHeight + 2;

      // Middle Initial
      doc.text('Middle Initial:', margin, yPos);
      doc.text(middleInitial || '', margin + 35, yPos);
      drawLine(margin + 35, yPos + 2, 20);
      yPos += lineHeight + 2;

      // Current Address Section
      checkNewPage(30);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Current Address', margin, yPos);
      yPos += lineHeight + 2;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      yPos = addFormField(
        'Current Address',
        parsedComplianceData?.address?.current_address || '',
        margin,
        yPos,
        45,
        120,
      );
      yPos = addFormField(
        'City',
        parsedComplianceData?.address?.city || '',
        margin,
        yPos,
        25,
        60,
      );
      // Province and Postal Code on same line with more space
      doc.text('Province:', margin + 100, yPos - lineHeight);
      const provinceText = parsedComplianceData?.address?.province || '';
      doc.text(provinceText, margin + 135, yPos - lineHeight);
      drawLine(margin + 135, yPos - lineHeight + 2, 30);

      doc.text('Postal Code:', margin + 170, yPos - lineHeight);
      const postalCodeText = parsedComplianceData?.address?.postal_code || '';
      // Ensure postal code doesn't get cut off - calculate width dynamically
      const postalCodeTextWidth = doc.getTextWidth(postalCodeText);
      doc.text(postalCodeText, margin + 210, yPos - lineHeight);
      // Draw line that extends beyond text to prevent cutting (minimum 60, or text width + 10)
      drawLine(
        margin + 210,
        yPos - lineHeight + 2,
        Math.max(60, postalCodeTextWidth + 10),
      );
      yPos += lineHeight;

      yPos = addFormField(
        'Cell #',
        parsedComplianceData?.address?.cell_phone || '',
        margin,
        yPos,
        25,
        80,
      );
      yPos += 5;

      // Previous Addresses Section
      if (parsedComplianceData?.address?.previous_addresses?.length > 0) {
        checkNewPage(40);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Previous Address for the past 3 years', margin, yPos);
        yPos += lineHeight + 3;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        parsedComplianceData.address.previous_addresses.forEach(
          (addr: any, index: number) => {
            checkNewPage(15);
            yPos = addFormField(
              `Address ${index + 1}`,
              addr.address || '',
              margin,
              yPos,
              35,
              120,
            );
            const period =
              addr.from_date && addr.to_date
                ? `${addr.from_date} to ${addr.to_date}`
                : (addr.duration as string) || '';
            yPos = addFormField(
              'Dates lived there',
              period,
              margin + 80,
              yPos - lineHeight,
              25,
              60,
            );
            yPos += 2;
          },
        );
        yPos += 3;
      }

      // Personal Information Section
      checkNewPage(25);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Personal Information', margin, yPos);
      yPos += lineHeight + 3;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Work Eligibility - Checkbox style
      doc.text('Are you legally entitled to work in Canada:', margin, yPos);
      const workEligible =
        parsedComplianceData?.personal?.work_eligibility_canada?.toLowerCase() ===
        'yes';
      // Position checkboxes with more spacing to avoid overlap (checkbox + text + gap)
      // Each checkbox takes: 4 (box) + 8 (spacing) + ~15 (text width) = ~27 units
      addCheckbox('YES', workEligible, margin + 70, yPos);
      addCheckbox('NO', !workEligible, margin + 110, yPos);
      yPos += lineHeight + 2;

      // Date of Birth
      const dob = parsedComplianceData?.personal?.date_of_birth
        ? new Date(
            parsedComplianceData.personal.date_of_birth,
          ).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '';
      yPos = addFormField('Date of Birth (D/M/Y)', dob, margin, yPos, 50, 60);

      // Education
      if (parsedComplianceData?.personal?.education) {
        yPos = addFormField(
          'Certification or Education',
          parsedComplianceData.personal.education,
          margin,
          yPos,
          60,
          100,
        );
      }

      // Medical Limitations
      const medicalQuestion =
        'Do you have any physical difficulties or medical limitation that might stop you from performing the position of a truck driver:';
      const medicalLines = doc.splitTextToSize(medicalQuestion, maxWidth - 90);
      doc.text(medicalLines, margin, yPos);
      yPos += medicalLines.length * lineHeight;
      const hasMedicalLimits =
        parsedComplianceData?.personal?.medical_limitations?.toLowerCase() ===
        'yes';
      addCheckbox('YES', hasMedicalLimits, margin + 50, yPos);
      addCheckbox('NO', !hasMedicalLimits, margin + 90, yPos);
      yPos += lineHeight + 3;

      if (
        hasMedicalLimits &&
        parsedComplianceData?.personal?.medical_limitations_explanation
      ) {
        doc.text('If Yes, please explain: -', margin, yPos);
        yPos += lineHeight;
        doc.text(
          parsedComplianceData.personal.medical_limitations_explanation,
          margin,
          yPos,
        );
        drawLine(margin, yPos + 2, maxWidth);
        yPos += lineHeight + 3;
      }
      yPos += 5;

      // Driver's License Information Section
      checkNewPage(50);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("Driver's License Information", margin, yPos);
      yPos += lineHeight + 3;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      yPos = addFormField(
        'Licence Number',
        pdfDriver.license_number || '',
        margin,
        yPos,
        40,
        100,
      );
      yPos = addFormField(
        'Province',
        parsedComplianceData?.license?.license_province || '',
        margin,
        yPos,
        25,
        30,
      );
      yPos = addFormField(
        'Class',
        parsedComplianceData?.license?.license_class || '',
        margin + 80,
        yPos - lineHeight,
        20,
        30,
      );
      const expiryDate = formatPdfDate(pdfDriver.license_expiry_date);
      yPos = addFormField(
        'Expiry',
        expiryDate,
        margin + 130,
        yPos - lineHeight,
        20,
        40,
      );
      yPos += 2;

      if (parsedComplianceData?.license?.license_endorsements) {
        yPos = addFormField(
          'Endorsements',
          parsedComplianceData.license.license_endorsements,
          margin,
          yPos,
          35,
          100,
        );
      }
      if (parsedComplianceData?.license?.license_conditions) {
        yPos = addFormField(
          'Conditions',
          parsedComplianceData.license.license_conditions,
          margin,
          yPos,
          30,
          100,
        );
      }
      yPos += 3;

      // License Questions
      doc.text(
        'Have you ever been denied a license or permit to operate a vehicle?',
        margin,
        yPos,
      );
      const licenseDenied =
        parsedComplianceData?.questions?.license_denied?.toLowerCase() ===
        'yes';
      addCheckbox('Yes', licenseDenied, margin + 110, yPos);
      addCheckbox('No', !licenseDenied, margin + 150, yPos);
      yPos += lineHeight + 3;

      doc.text(
        'Have you ever had your driving privileges revoked or suspended?',
        margin,
        yPos,
      );
      const privilegesRevoked =
        parsedComplianceData?.questions?.privileges_revoked?.toLowerCase() ===
        'yes';
      addCheckbox('Yes', privilegesRevoked, margin + 110, yPos);
      addCheckbox('No', !privilegesRevoked, margin + 150, yPos);
      yPos += lineHeight + 3;

      doc.text('Do you have a dangerous good certificate?', margin, yPos);
      const hasDangerousGoods =
        parsedComplianceData?.questions?.dangerous_goods_certificate?.toLowerCase() ===
        'yes';
      addCheckbox('YES', hasDangerousGoods, margin + 70, yPos);
      addCheckbox('No', !hasDangerousGoods, margin + 90, yPos);
      yPos += lineHeight + 5;

      // License card photographs (front / back)
      if (
        driver.license_front_image_path ||
        driver.license_back_image_path
      ) {
        const [licenseFrontPdf, licenseBackPdf] = await Promise.all([
          fetchStorageImageForPdf(
            driver.license_front_image_path,
            driver.license_front_image_url,
          ),
          fetchStorageImageForPdf(
            driver.license_back_image_path,
            driver.license_back_image_url,
          ),
        ]);

        const sectionMinH = 100;
        checkNewPage(sectionMinH);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('License card photographs', margin, yPos);
        yPos += lineHeight + 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        const gap = 8;
        const colW = (maxWidth - gap) / 2;
        const maxImgH = 72;
        const labelY = yPos;
        const imgY = yPos + 5;

        const drawLicensePhoto = async (
          label: string,
          x: number,
          relativePath: string | undefined | null,
          loaded: { dataUrl: string; format: 'JPEG' | 'PNG' } | null,
        ): Promise<number> => {
          doc.text(label, x, labelY);
          if (!relativePath) {
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('Not on file', x, imgY + 18);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            return maxImgH + 8;
          }
          if (!loaded) {
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('Could not load image', x, imgY + 18);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            return maxImgH + 8;
          }
          try {
            const { width: nw, height: nh } = await measureDataUrlImage(
              loaded.dataUrl,
            );
            const scale = Math.min(colW / nw, maxImgH / nh);
            const w = nw * scale;
            const h = nh * scale;
            doc.addImage(
              loaded.dataUrl,
              loaded.format,
              x,
              imgY,
              w,
              h,
              undefined,
              'FAST',
            );
            return h + 8;
          } catch {
            doc.setFontSize(8);
            doc.setTextColor(180, 0, 0);
            doc.text('Could not embed image', x, imgY + 15);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            return maxImgH + 8;
          }
        };

        const leftH = await drawLicensePhoto(
          'Front',
          margin,
          driver.license_front_image_path,
          licenseFrontPdf,
        );
        const rightH = await drawLicensePhoto(
          'Back',
          margin + colW + gap,
          driver.license_back_image_path,
          licenseBackPdf,
        );
        yPos = imgY + Math.max(leftH, rightH) + 6;
      }


      // Driving Experience Section
      checkNewPage(60);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Driving Experience', margin, yPos);
      yPos += lineHeight + 3;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      yPos = addFormField(
        'Years of Experience',
        (pdfDriver.years_of_experience || 0).toString(),
        margin,
        yPos,
        50,
        40,
      );
      yPos += 5;

      // Equipment Used During the Last 5 Years
      if (
        parsedComplianceData?.driving_experience?.equipment_used?.length > 0
      ) {
        checkNewPage(40);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(
          'List the types of equipment used during the last 5 years:',
          margin,
          yPos,
        );
        yPos += lineHeight + 3;

        // Table headers
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const colWidths = [35, 35, 35, 50, 35];
        const colStarts = [
          margin,
          margin + 40,
          margin + 80,
          margin + 120,
          margin + 175,
        ];
        doc.text('Make', colStarts[0], yPos);
        doc.text('Tractor Type', colStarts[1], yPos);
        doc.text('Transmissions', colStarts[2], yPos);
        doc.text('Trailer Type', colStarts[3], yPos);
        doc.text('Areas Operated', colStarts[4], yPos);
        yPos += 5;

        // Draw header line
        drawLine(margin, yPos - 2, maxWidth);
        yPos += 2;

        // Equipment rows
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        parsedComplianceData.driving_experience.equipment_used.forEach(
          (equip: any) => {
            checkNewPage(10);
            doc.text(equip.make || '', colStarts[0], yPos);
            drawLine(colStarts[0], yPos + 2, colWidths[0]);
            doc.text(equip.tractor_type || '', colStarts[1], yPos);
            drawLine(colStarts[1], yPos + 2, colWidths[1]);
            doc.text(equip.transmissions || '', colStarts[2], yPos);
            drawLine(colStarts[2], yPos + 2, colWidths[2]);
            doc.text(equip.trailer_type || '', colStarts[3], yPos);
            drawLine(colStarts[3], yPos + 2, colWidths[3]);
            doc.text(equip.areas_operated || '', colStarts[4], yPos);
            drawLine(colStarts[4], yPos + 2, colWidths[4]);
            yPos += 7;
          },
        );
        yPos += 3;
      }

      // Accident History
      checkNewPage(25);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const accidentData =
        parsedComplianceData?.driving_experience?.accident_history;
      doc.text('Ever had accidents:', margin, yPos);
      const hasAccidents =
        accidentData?.ever_had_accidents?.toLowerCase() === 'yes';
      addCheckbox('Yes', hasAccidents, margin + 50, yPos);
      addCheckbox('No', !hasAccidents, margin + 90, yPos);
      yPos += lineHeight + 2;

      if (hasAccidents) {
        yPos = addFormField(
          'Number of incidents',
          accidentData?.number_of_incidents || '',
          margin,
          yPos,
          50,
          40,
        );
        yPos += 2;
        doc.text('If Yes, please explain: -', margin, yPos);
        yPos += lineHeight;
        if (accidentData?.accident_explanation) {
          doc.text(accidentData.accident_explanation, margin, yPos);
          drawLine(margin, yPos + 2, maxWidth);
        } else {
          drawLine(margin, yPos + 2, maxWidth);
        }
        yPos += lineHeight + 3;
      }
      yPos += 3;

      // Traffic Violations Section
      if (
        parsedComplianceData?.driving_experience?.traffic_violations?.length > 0
      ) {
        checkNewPage(40);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(
          'Last 3 years history of traffic violations and convictions',
          margin,
          yPos,
        );
        drawLine(margin, yPos + 2, maxWidth);
        yPos += lineHeight + 5;

        // Table headers
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const violColStarts = [margin, margin + 35, margin + 85, margin + 145];
        const violColWidths = [30, 45, 55, 40];
        doc.text('Date', violColStarts[0], yPos);
        doc.text('Location', violColStarts[1], yPos);
        doc.text('Violation/ Charge', violColStarts[2], yPos);
        doc.text('Penalty', violColStarts[3], yPos);
        yPos += 5;

        // Draw header line
        drawLine(margin, yPos - 2, maxWidth);
        yPos += 2;

        // Violation rows
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        parsedComplianceData.driving_experience.traffic_violations.forEach(
          (violation: any) => {
            checkNewPage(10);
            doc.text(violation.date || '', violColStarts[0], yPos);
            drawLine(violColStarts[0], yPos + 2, violColWidths[0]);
            doc.text(violation.location || '', violColStarts[1], yPos);
            drawLine(violColStarts[1], yPos + 2, violColWidths[1]);
            doc.text(violation.violation_charge || '', violColStarts[2], yPos);
            drawLine(violColStarts[2], yPos + 2, violColWidths[2]);
            doc.text(violation.penalty || '', violColStarts[3], yPos);
            drawLine(violColStarts[3], yPos + 2, violColWidths[3]);
            yPos += 7;
          },
        );
        yPos += 3;
      }

      // Employment History Section
      checkNewPage(60);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Employment History for the last 10 years', margin, yPos);
      drawLine(margin, yPos + 2, maxWidth);
      yPos += lineHeight + 5;

      // Current/Most Recent Employer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Current/Most Recent Employer', margin, yPos);
      yPos += lineHeight + 2;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const currentEmp =
        parsedComplianceData?.employment_history?.current_employer;
      if (currentEmp) {
        yPos = addFormField(
          'Company',
          currentEmp.company || '',
          margin,
          yPos,
          30,
          120,
        );
        yPos = addFormField(
          'Supervisor',
          currentEmp.supervisor || '',
          margin,
          yPos,
          30,
          120,
        );
        yPos = addFormField(
          'Address',
          currentEmp.address || '',
          margin,
          yPos,
          30,
          120,
        );
        yPos = addFormField(
          'Phone',
          currentEmp.phone || '',
          margin,
          yPos,
          25,
          100,
        );
        yPos = addFormField(
          'Position',
          currentEmp.position || '',
          margin,
          yPos,
          30,
          120,
        );
        yPos = addFormField(
          'Start Date',
          currentEmp.start_date || '',
          margin,
          yPos,
          30,
          100,
        );
        yPos = addFormField(
          'End Date',
          currentEmp.end_date || '',
          margin,
          yPos,
          30,
          100,
        );
        if (currentEmp.reasons_for_leaving) {
          doc.text('Reasons for Leaving:', margin, yPos);
          yPos += lineHeight;
          doc.text(currentEmp.reasons_for_leaving, margin, yPos);
          drawLine(margin, yPos + 2, maxWidth);
          yPos += lineHeight + 3;
        } else {
          doc.text('Reasons for Leaving:', margin, yPos);
          yPos += lineHeight;
          drawLine(margin, yPos + 2, maxWidth);
          yPos += lineHeight + 3;
        }
      }
      yPos += 3;

      // Previous Employers
      if (
        parsedComplianceData?.employment_history?.previous_employers?.length > 0
      ) {
        parsedComplianceData.employment_history.previous_employers.forEach(
          (emp: any, index: number) => {
            checkNewPage(50);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Previous Employer', margin, yPos);
            yPos += lineHeight + 2;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            yPos = addFormField(
              'Company',
              emp.company || '',
              margin,
              yPos,
              30,
              120,
            );
            yPos = addFormField(
              'Supervisor',
              emp.supervisor || '',
              margin,
              yPos,
              30,
              120,
            );
            yPos = addFormField(
              'Address',
              emp.address || '',
              margin,
              yPos,
              30,
              120,
            );
            yPos = addFormField(
              'Phone',
              emp.phone || '',
              margin,
              yPos,
              25,
              100,
            );
            yPos = addFormField(
              'Position',
              emp.position || '',
              margin,
              yPos,
              30,
              120,
            );
            yPos = addFormField(
              'Start Date',
              emp.start_date || '',
              margin,
              yPos,
              30,
              100,
            );
            yPos = addFormField(
              'End Date',
              emp.end_date || '',
              margin,
              yPos,
              30,
              100,
            );
            if (emp.reasons_for_leaving) {
              doc.text('Reasons for Leaving:', margin, yPos);
              yPos += lineHeight;
              doc.text(emp.reasons_for_leaving, margin, yPos);
              drawLine(margin, yPos + 2, maxWidth);
              yPos += lineHeight + 3;
            } else {
              doc.text('Reasons for Leaving:', margin, yPos);
              yPos += lineHeight;
              drawLine(margin, yPos + 2, maxWidth);
              yPos += lineHeight + 3;
            }
            yPos += 2;
          },
        );
      }

      // Reference Checks Section
      if (referenceChecks.length > 0) {
        referenceChecks.forEach((refCheck: any, refIndex: number) => {
          checkNewPage(80);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text(
            `Pre-Employment Reference Check ${refIndex + 1}`,
            margin,
            yPos,
          );
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(
            `Status: ${refCheck.status || 'N/A'} | Filled by: ${refCheck.filled_by || 'N/A'}`,
            margin,
            yPos + 6,
          );
          yPos += 12;

          const req = refCheck.reference_request || {};
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(
            'Request for Information from Previous Employer',
            margin,
            yPos,
          );
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          yPos = addFormField(
            'Applicant',
            req.applicant_name || '',
            margin,
            yPos,
            28,
            80,
          );
          yPos = addFormField(
            "Driver's License",
            req.drivers_license_number || '',
            margin,
            yPos,
            35,
            70,
          );
          yPos = addFormField(
            'Previous Company',
            req.previous_company_name || '',
            margin,
            yPos,
            38,
            90,
          );
          yPos = addFormField(
            'Phone',
            req.previous_company_phone || '',
            margin,
            yPos,
            20,
            70,
          );
          yPos = addFormField(
            'Supervisor/Employer',
            req.supervisor_employer_name || '',
            margin,
            yPos,
            45,
            85,
          );
          yPos += 4;

          const formData = refCheck.form_data;
          if (formData) {
            checkNewPage(60);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('Reference Check Form Details', margin, yPos);
            yPos += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            yPos = addFormField(
              'Date of Reference Check',
              formData.date_of_reference_check || '',
              margin,
              yPos,
              50,
              60,
            );
            doc.text('Relationship:', margin, yPos);
            doc.text(
              formData.relationship_to_applicant === 'other'
                ? `Other: ${formData.relationship_other_specify || ''}`
                : 'Supervisor',
              margin + 50,
              yPos,
            );
            yPos += lineHeight;
            yPos = addFormField(
              'Employment From',
              formData.date_of_employment_from || '',
              margin,
              yPos,
              38,
              50,
            );
            yPos = addFormField(
              'To',
              formData.date_of_employment_to || '',
              margin + 95,
              yPos - lineHeight,
              12,
              50,
            );
            yPos += 2;
            yPos = addFormField(
              'Position(s) Held',
              formData.positions_held || '',
              margin,
              yPos,
              38,
              100,
            );
            yPos = addFormField(
              'Nature of Job',
              formData.nature_of_job || '',
              margin,
              yPos,
              35,
              110,
            );
            doc.text('Driver off (illness/injury):', margin, yPos);
            doc.text(
              formData.driver_off_illness_injury || '',
              margin + 65,
              yPos,
            );
            yPos += lineHeight;
            doc.text('Involved in accidents:', margin, yPos);
            doc.text(formData.involved_in_accidents || '', margin + 55, yPos);
            yPos += lineHeight;
            doc.text('Reason for leaving:', margin, yPos);
            doc.text(
              String(formData.reason_for_leaving || '').replace(/_/g, ' '),
              margin + 45,
              yPos,
            );
            yPos += lineHeight + 2;
            doc.text('Ratings - Attendance:', margin, yPos);
            doc.text(formData.attendance_rating || '', margin + 50, yPos);
            doc.text('Dependability:', margin + 95, yPos);
            doc.text(formData.dependability_rating || '', margin + 140, yPos);
            yPos += lineHeight;
            doc.text('Willingness:', margin, yPos);
            doc.text(formData.willingness_rating || '', margin + 35, yPos);
            doc.text('Follow Instructions:', margin + 85, yPos);
            doc.text(
              formData.ability_to_follow_instructions_rating || '',
              margin + 145,
              yPos,
            );
            yPos += lineHeight;
            doc.text('Quality of Work:', margin, yPos);
            doc.text(formData.quality_of_work_rating || '', margin + 40, yPos);
            yPos += lineHeight + 2;
            yPos = addFormField(
              'Name of Person Supplying Info',
              formData.name_of_person_supplying_info || '',
              margin,
              yPos,
              55,
              90,
            );
            yPos = addFormField(
              'Date',
              formData.referee_signature_date || '',
              margin,
              yPos,
              15,
              50,
            );
            if (formData.additional_comments) {
              yPos += 2;
              doc.text('Additional comments:', margin, yPos);
              yPos += lineHeight;
              const commentLines = doc.splitTextToSize(
                formData.additional_comments,
                maxWidth,
              );
              doc.text(commentLines, margin, yPos);
              yPos += commentLines.length * lineHeight + 2;
            }
            yPos += 8;
          } else {
            doc.setFontSize(9);
            doc.text('(Form not yet completed)', margin, yPos);
            yPos += 10;
          }
        });
        yPos += 5;
      }

      checkNewPage(40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('To be read and signed by the applicant', pageWidth / 2, yPos, {
        align: 'center',
      });
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Paragraphs
      const declarationText = [
        'By completing and submitting this signed application I:',
        'Authorize R&B Services Inc. to investigate my reputation, background, character and prior employment by contacting my employer, references or any other individuals the employer deems necessary.',
        'Understanding that I am required to abide by all the rules and regulations set out by this company.',
        'Certify that all the entries and information on this application is true and complete to the best of my knowledge.',
      ];

      declarationText.forEach((p) => {
        const lines = doc.splitTextToSize(p, maxWidth);
        doc.text(lines, margin, yPos);
        yPos += lines.length * lineHeight + 2;
      });

      yPos += 10;

      // ===== PRINT NAME & DATE =====
      const printName = pdfDriver.user?.name || '';
      const signedDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      // Print Name (Left)
      doc.text(printName, margin + 10, yPos);
      drawLine(margin + 10, yPos + 2, 70);
      doc.text('Print Name', margin + 25, yPos + 8);

      // Date (Right)
      doc.text(signedDate, pageWidth - margin - 70, yPos);
      drawLine(pageWidth - margin - 70, yPos + 2, 60);
      doc.text('Date', pageWidth - margin - 50, yPos + 8);

      yPos += 25;

      // ===== SIGNATURE =====
      doc.text('Signature of Applicant', margin + 10, yPos + 8);
      drawLine(margin + 10, yPos, 90);

      // ----- Reference Check (manual mail-out form appendix) -----
      const currentEmpRef =
        parsedComplianceData?.employment_history?.current_employer;
      const applyingRolePdf =
        driver.driver_class?.name?.trim() ||
        driver.driver_class?.code?.trim() ||
        'truck driver';
      const priorRolePdf = (
        typeof currentEmpRef?.position === 'string'
          ? currentEmpRef.position
          : ''
      ).trim();

      checkNewPage(110);
      yPos += 16;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const refHeading = 'Reference Check';
      const refHeadingW = doc.getTextWidth(refHeading);
      const refHx = pageWidth / 2 - refHeadingW / 2;
      doc.text(refHeading, refHx, yPos);
      doc.setLineWidth(0.4);
      doc.line(refHx, yPos + 1, refHx + refHeadingW, yPos + 1);
      yPos += lineHeight + 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const refIntro = doc.splitTextToSize(
        'We appreciate your time in completing, in confidence, the information below.',
        maxWidth,
      );
      doc.text(refIntro, margin, yPos);
      yPos += refIntro.length * lineHeight + 6;

      const applicantNamePdf = driver.user?.name || '____________________';
      const licensePdf =
        driver.license_number || '______________________';
      const priorPhrase = priorRolePdf
        ? priorRolePdf
        : '________________________________________________________________';
      const refBody = `${applicantNamePdf}, driver's license number ${licensePdf}, has completed an application to this company for a position as a ${applyingRolePdf} and states that he/she was employed by you as ${priorPhrase}.`;

      const refBodyLines = doc.splitTextToSize(refBody, maxWidth);
      doc.text(refBodyLines, margin, yPos);
      yPos += refBodyLines.length * lineHeight + 6;

      const refClosing = doc.splitTextToSize(
        'Please reply to this inquiry below regarding this applicant. Your reply will be held in strictest confidence and will in no way involve you in any responsibility.',
        maxWidth,
      );
      doc.text(refClosing, margin, yPos);
      yPos += refClosing.length * lineHeight + 8;

      if (!priorRolePdf) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('For completion by referee', margin, yPos);
        yPos += lineHeight + 2;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text('(blank lines for handwritten reply)', margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += lineHeight + 4;
        for (let ln = 0; ln < 3; ln += 1) {
          drawLine(margin, yPos, maxWidth);
          yPos += lineHeight + 8;
        }
      }

      yPos += 4;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Kind regards,', margin, yPos);
      yPos += lineHeight + 2;
      doc.setFont('helvetica', 'bold');
      doc.text('R & B Services Inc.', margin, yPos);

      // Save PDF
      const fileName = `Driver_Application_${pdfDriver.user?.name?.replace(/\s+/g, '_') || 'Driver'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success('PDF exported successfully');
    } catch (error: any) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Spinner className='h-8 w-8 text-blue-500' />
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className='space-y-6'>
        <Button
          variant='ghost'
          onClick={() => router.back()}
          className='text-slate-400 hover:text-white'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back
        </Button>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error || 'Driver not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const compliance = checkCompliance();
  const isInvoiceReady = checkInvoiceReadiness();

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            onClick={() => router.back()}
            className='text-slate-400 hover:text-white'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back
          </Button>
          <div>
            <div className='flex items-center gap-3'>
              <h1 className='text-3xl font-bold text-white'>
                {driver.user?.name || 'Driver'}
              </h1>
              {getStatusBadge(driver.status)}
              {isInvoiceReady && (
                <Badge
                  variant='secondary'
                  className='bg-green-600 text-white flex items-center'
                >
                  <CheckCircle2 className='h-3 w-3 mr-1' />
                  Invoice Ready
                </Badge>
              )}
            </div>
            <p className='text-slate-400 mt-2'>
              {driver.user?.email || 'No email'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2'>
          {driver.status === 'pending_approval' && (
            <Button
              onClick={handleApprove}
              disabled={isUpdating}
              className='bg-green-600 hover:bg-green-700'
            >
              {isUpdating ? (
                <>
                  <Spinner className='mr-2 h-4 w-4' />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className='mr-2 h-4 w-4' />
                  Approve Driver
                </>
              )}
            </Button>
          )}
          <Select
            value={driver.status}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger className='w-[180px] bg-slate-700 border-slate-600 text-white'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='text-white bg-slate-700 border-slate-600'>
              <SelectItem value='pending_approval'>Pending Approval</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
              <SelectItem value='suspended'>Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='outline' className='border-slate-600' asChild>
            <Link href={`/admin/drivers/${driver.id}/reference-checks`}>
              <ClipboardList className='h-4 w-4 mr-2' />
              Reference checks
            </Link>
          </Button>
        </div>
      </div>

      {/* Compliance Warning */}
      {!compliance.isCompliant && (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            <div className='font-semibold mb-2'>
              Compliance Issues Detected:
            </div>
            <ul className='list-disc list-inside space-y-1'>
              {compliance.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Main Information */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Personal Information */}
          <Card className='bg-slate-800 border-slate-700'>
            <CardHeader>
              <CardTitle className='text-white flex items-center gap-2'>
                <User className='h-5 w-5' />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-slate-400 text-sm'>Full Name</p>
                  <p className='text-white font-medium'>
                    {driver.user?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-slate-400 text-sm'>Email</p>
                  <div className='flex items-center gap-2'>
                    <p className='text-white font-medium'>
                      {maskSensitiveData(driver.user?.email || '', 'email')}
                    </p>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => toggleSensitiveField('email')}
                      className='h-6 w-6 p-0'
                    >
                      {showSensitiveData['email'] ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className='text-slate-400 text-sm'>Tenant</p>
                  <p className='text-white font-medium'>
                    {driver.tenant?.name || driver.tenant?.domain || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-slate-400 text-sm'>Gender</p>
                  <p className='text-white font-medium capitalize'>
                    {parsedComplianceData?.personal?.gender || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-slate-400 text-sm'>Phone Number</p>
                  <p className='text-white font-medium'>
                    {parsedComplianceData?.address?.cell_phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-slate-400 text-sm'>Created At</p>
                  <p className='text-white font-medium'>
                    {new Date(driver.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver Class (for rate calculation) */}
          <Card className='bg-slate-800 border-slate-700'>
            <CardHeader>
              <CardTitle className='text-white flex items-center gap-2'>
                <GraduationCap className='h-5 w-5' />
                Driver Class
              </CardTitle>
              <CardDescription className='text-slate-400'>
                Used to calculate driver pay from Employer Rate Cards. Timesheet
                rates are resolved by this class.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <p className='text-slate-400 text-sm mb-2'>Current class</p>
                  {updatingDriverClass ? (
                    <div className='flex items-center gap-2 text-white'>
                      <Spinner className='h-4 w-4' />
                      Updating...
                    </div>
                  ) : (
                    <Select
                      value={
                        driver.driver_class_id != null
                          ? String(driver.driver_class_id)
                          : '__none__'
                      }
                      onValueChange={handleDriverClassChange}
                      disabled={updatingDriverClass}
                    >
                      <SelectTrigger className='bg-slate-700 border-slate-600 text-white w-full max-w-[280px]'>
                        <SelectValue placeholder='Select class' />
                      </SelectTrigger>
                      <SelectContent className='bg-slate-800 border-slate-700'>
                        <SelectItem value='__none__'>
                          No class assigned
                        </SelectItem>
                        {driverClasses.map((dc) => (
                          <SelectItem key={dc.id} value={String(dc.id)}>
                            {dc.name || dc.code} {dc.code ? `(${dc.code})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <p className='text-slate-400 text-sm'>Assigned class</p>
                  <p className='text-white font-medium'>
                    {driver.driver_class
                      ? `${driver.driver_class.name || driver.driver_class.code} (${driver.driver_class.code})`
                      : 'Not set'}
                  </p>
                  {driver.driver_class_effective_date && (
                    <p className='text-slate-400 text-xs mt-1'>
                      Effective:{' '}
                      {new Date(
                        driver.driver_class_effective_date,
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {!driver.driver_class_id && (
                <p className='text-amber-400 text-sm'>
                  Assign a driver class so timesheet trips can calculate driver
                  pay from employer rate cards.
                </p>
              )}
            </CardContent>
          </Card>

          {/* License Information */}
          <Card className='bg-slate-800 border-slate-700'>
            <CardHeader>
              <CardTitle className='text-white flex items-center gap-2'>
                <FileText className='h-5 w-5' />
                License Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-slate-400 text-sm'>License Number</p>
                  <div className='flex items-center gap-2'>
                    <p className='text-white font-medium'>
                      {maskSensitiveData(
                        driver.license_number || '',
                        'license_number',
                      )}
                    </p>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => toggleSensitiveField('license_number')}
                      className='h-6 w-6 p-0'
                    >
                      {showSensitiveData['license_number'] ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className='text-slate-400 text-sm'>License Type</p>
                  <p className='text-white font-medium'>
                    {driver.license_type || 'N/A'}
                    {driver.license_other && ` (${driver.license_other})`}
                  </p>
                </div>
                <div>
                  <p className='text-slate-400 text-sm'>Issuing Authority</p>
                  <p className='text-white font-medium'>
                    {driver.issuing_authority || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-slate-400 text-sm'>Expiry Date</p>
                  <p className='text-white font-medium'>
                    {driver.license_expiry_date
                      ? new Date(
                          driver.license_expiry_date,
                        ).toLocaleDateString()
                      : 'N/A'}
                    {driver.license_expiry_date &&
                      new Date(driver.license_expiry_date) < new Date() && (
                        <Badge variant='destructive' className='ml-2'>
                          Expired
                        </Badge>
                      )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Types */}
          <Card className='bg-slate-800 border-slate-700'>
            <CardHeader>
              <CardTitle className='text-white flex items-center gap-2'>
                <Truck className='h-5 w-5' />
                Vehicle Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                {driver.vehicle_types && driver.vehicle_types.length > 0 ? (
                  driver.vehicle_types.map((type, index) => (
                    <Badge
                      key={index}
                      variant='secondary'
                      className='bg-blue-600'
                    >
                      {type}
                    </Badge>
                  ))
                ) : (
                  <span className='text-slate-400'>N/A</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Personal Information */}
          {parsedComplianceData?.personal && (
            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                  <User className='h-5 w-5' />
                  Additional Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-slate-400 text-sm'>Date of Birth</p>
                    <p className='text-white font-medium'>
                      {parsedComplianceData.personal.date_of_birth || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className='text-slate-400 text-sm'>Education</p>
                    <p className='text-white font-medium'>
                      {parsedComplianceData.personal.education || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className='text-slate-400 text-sm'>
                      Work Eligibility in Canada
                    </p>
                    <p className='text-white font-medium capitalize'>
                      {parsedComplianceData.personal.work_eligibility_canada ||
                        'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className='text-slate-400 text-sm'>
                      Medical Limitations
                    </p>
                    <p className='text-white font-medium capitalize'>
                      {parsedComplianceData.personal.medical_limitations ||
                        'N/A'}
                    </p>
                  </div>
                </div>
                {parsedComplianceData.personal.medical_limitations === 'yes' &&
                  parsedComplianceData.personal
                    .medical_limitations_explanation && (
                    <div>
                      <p className='text-slate-400 text-sm mb-2'>
                        Medical Limitations Explanation
                      </p>
                      <p className='text-white text-sm bg-slate-700/50 p-3 rounded-lg'>
                        {
                          parsedComplianceData.personal
                            .medical_limitations_explanation
                        }
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Address Information */}
          {parsedComplianceData?.address && (
            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                  <Home className='h-5 w-5' />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <h4 className='text-white font-medium mb-3'>
                    Current Address
                  </h4>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <p className='text-slate-400 text-sm'>Street Address</p>
                      <p className='text-white font-medium'>
                        {parsedComplianceData.address.current_address || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className='text-slate-400 text-sm'>City</p>
                      <p className='text-white font-medium'>
                        {parsedComplianceData.address.city || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className='text-slate-400 text-sm'>Province</p>
                      <p className='text-white font-medium'>
                        {parsedComplianceData.address.province || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className='text-slate-400 text-sm'>Postal Code</p>
                      <p className='text-white font-medium'>
                        {parsedComplianceData.address.postal_code || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className='text-slate-400 text-sm'>Cell Phone</p>
                      <p className='text-white font-medium'>
                        {parsedComplianceData.address.cell_phone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className='text-slate-400 text-sm'>
                        Living Since / Time Period
                      </p>
                      <p className='text-white font-medium'>
                        {parsedComplianceData.address.current_address_living_since ||
                          'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {parsedComplianceData.address.previous_addresses?.length >
                  0 && (
                  <div className='pt-4 border-t border-slate-700'>
                    <h4 className='text-white font-medium mb-3'>
                      Previous Addresses (Last 3 Years)
                    </h4>
                    <div className='space-y-4'>
                      {parsedComplianceData.address.previous_addresses.map(
                        (addr: any, index: number) => (
                          <div
                            key={index}
                            className='text-white bg-slate-700/50 p-3 rounded-lg'
                          >
                            <p className='text-white font-medium mb-2'>
                              Address {index + 1}
                            </p>
                            <p className='text-slate-300 text-sm'>
                              {addr.address || 'N/A'}
                            </p>
                            <p className='text-slate-400 text-xs mt-1'>
                              {addr.from_date && addr.to_date
                                ? `Dates: ${addr.from_date} – ${addr.to_date}`
                                : addr.duration
                                  ? `Duration: ${addr.duration}`
                                  : 'Dates: N/A'}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional License Information */}
          {parsedComplianceData?.license && (
            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                  <IdCard className='h-5 w-5' />
                  Additional License Details
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-slate-400 text-sm'>License Province</p>
                    <p className='text-white font-medium'>
                      {parsedComplianceData.license.license_province || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className='text-slate-400 text-sm'>License Class</p>
                    <p className='text-white font-medium'>
                      {parsedComplianceData.license.license_class || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className='text-slate-400 text-sm'>Endorsements</p>
                    <p className='text-white font-medium'>
                      {parsedComplianceData.license.license_endorsements ||
                        'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className='text-slate-400 text-sm'>Conditions</p>
                    <p className='text-white font-medium'>
                      {parsedComplianceData.license.license_conditions || 'N/A'}
                    </p>
                  </div>
                </div>
                {parsedComplianceData.questions && (
                  <div className='pt-4 border-t border-slate-700'>
                    <h4 className='text-white font-medium mb-3'>
                      Additional Questions
                    </h4>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <p className='text-slate-400 text-sm'>License Denied</p>
                        <p className='text-white font-medium capitalize'>
                          {parsedComplianceData.questions.license_denied ||
                            'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-slate-400 text-sm'>
                          Privileges Revoked
                        </p>
                        <p className='text-white font-medium capitalize'>
                          {parsedComplianceData.questions.privileges_revoked ||
                            'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-slate-400 text-sm'>
                          Dangerous Goods Certificate
                        </p>
                        <p className='text-white font-medium capitalize'>
                          {parsedComplianceData.questions
                            .dangerous_goods_certificate || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Equipment Used */}
          {parsedComplianceData?.driving_experience?.equipment_used?.length >
            0 && (
            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                  <Truck className='h-5 w-5' />
                  Equipment Used (Last 5 Years)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto rounded-lg border border-slate-700'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b border-slate-700 bg-slate-900/40'>
                        <th className='text-left text-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide'>
                          Make
                        </th>
                        <th className='text-left text-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide'>
                          Tractor Type
                        </th>
                        <th className='text-left text-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide'>
                          Transmissions
                        </th>
                        <th className='text-left text-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide'>
                          Trailer Type
                        </th>
                        <th className='text-left text-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide'>
                          Areas Operated
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedComplianceData.driving_experience.equipment_used.map(
                        (equip: any, index: number) => (
                          <tr
                            key={index}
                            className='border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20'
                          >
                            <td className='text-white px-3 py-2 align-top'>
                              {equip.make || 'N/A'}
                            </td>
                            <td className='text-white px-3 py-2 align-top'>
                              {equip.tractor_type || 'N/A'}
                            </td>
                            <td className='text-white px-3 py-2 align-top'>
                              {equip.transmissions || 'N/A'}
                            </td>
                            <td className='text-white px-3 py-2 align-top'>
                              {equip.trailer_type || 'N/A'}
                            </td>
                            <td className='text-white px-3 py-2 align-top'>
                              {equip.areas_operated || 'N/A'}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Accident History */}
          {parsedComplianceData?.driving_experience?.accident_history && (
            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                  <AlertTriangle className='h-5 w-5' />
                  Accident History
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-slate-400 text-sm'>Ever Had Accidents</p>
                    <p className='text-white font-medium capitalize'>
                      {parsedComplianceData.driving_experience.accident_history
                        .ever_had_accidents || 'N/A'}
                    </p>
                  </div>
                  {parsedComplianceData.driving_experience.accident_history
                    .ever_had_accidents === 'yes' && (
                    <>
                      <div>
                        <p className='text-slate-400 text-sm'>
                          Number of Incidents
                        </p>
                        <p className='text-white font-medium'>
                          {parsedComplianceData.driving_experience
                            .accident_history.number_of_incidents || 'N/A'}
                        </p>
                      </div>
                      {parsedComplianceData.driving_experience.accident_history
                        .accident_explanation && (
                        <div className='col-span-2'>
                          <p className='text-slate-400 text-sm mb-2'>
                            Explanation
                          </p>
                          <p className='text-white text-sm bg-slate-700/50 p-3 rounded-lg'>
                            {
                              parsedComplianceData.driving_experience
                                .accident_history.accident_explanation
                            }
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Traffic Violations */}
          {parsedComplianceData?.driving_experience?.traffic_violations
            ?.length > 0 && (
            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                  <AlertCircle className='h-5 w-5' />
                  Traffic Violations (Last 3 Years)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto rounded-lg border border-slate-700'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b border-slate-700 bg-slate-900/40'>
                        <th className='text-left text-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide'>
                          Date
                        </th>
                        <th className='text-left text-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide'>
                          Location
                        </th>
                        <th className='text-left text-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide'>
                          Violation/Charge
                        </th>
                        <th className='text-left text-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide'>
                          Penalty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedComplianceData.driving_experience.traffic_violations.map(
                        (violation: any, index: number) => (
                          <tr
                            key={index}
                            className='border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20'
                          >
                            <td className='text-white px-3 py-2 align-top'>
                              {violation.date || 'N/A'}
                            </td>
                            <td className='text-white px-3 py-2 align-top'>
                              {violation.location || 'N/A'}
                            </td>
                            <td className='text-white px-3 py-2 align-top'>
                              {violation.violation_charge || 'N/A'}
                            </td>
                            <td className='text-white px-3 py-2 align-top'>
                              {violation.penalty || 'N/A'}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Employment History */}
          {parsedComplianceData?.employment_history && (
            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                  <Briefcase className='h-5 w-5' />
                  Employment History
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Current Employer */}
                {parsedComplianceData.employment_history.current_employer && (
                  <div>
                    <h4 className='text-white font-medium mb-4'>
                      Current/Most Recent Employer
                    </h4>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <p className='text-slate-400 text-sm'>Company</p>
                        <p className='text-white font-medium'>
                          {parsedComplianceData.employment_history
                            .current_employer.company || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-slate-400 text-sm'>Supervisor</p>
                        <p className='text-white font-medium'>
                          {parsedComplianceData.employment_history
                            .current_employer.supervisor || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-slate-400 text-sm'>Address</p>
                        <p className='text-white font-medium'>
                          {parsedComplianceData.employment_history
                            .current_employer.address || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-slate-400 text-sm'>Phone</p>
                        <p className='text-white font-medium'>
                          {parsedComplianceData.employment_history
                            .current_employer.phone || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-slate-400 text-sm'>Position</p>
                        <p className='text-white font-medium'>
                          {parsedComplianceData.employment_history
                            .current_employer.position || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-slate-400 text-sm'>Start Date</p>
                        <p className='text-white font-medium'>
                          {parsedComplianceData.employment_history
                            .current_employer.start_date || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-slate-400 text-sm'>End Date</p>
                        <p className='text-white font-medium'>
                          {parsedComplianceData.employment_history
                            .current_employer.end_date || 'N/A'}
                        </p>
                      </div>
                      {parsedComplianceData.employment_history.current_employer
                        .reasons_for_leaving && (
                        <div className='col-span-2'>
                          <p className='text-slate-400 text-sm mb-2'>
                            Reasons for Leaving
                          </p>
                          <p className='text-white text-sm bg-slate-700/50 p-3 rounded-lg'>
                            {
                              parsedComplianceData.employment_history
                                .current_employer.reasons_for_leaving
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Previous Employers */}
                {parsedComplianceData.employment_history.previous_employers
                  ?.length > 0 && (
                  <div className='pt-4 border-t border-slate-700'>
                    <h4 className='text-white font-medium mb-4'>
                      Previous Employers (Last 10 Years)
                    </h4>
                    <div className='space-y-6'>
                      {parsedComplianceData.employment_history.previous_employers.map(
                        (emp: any, index: number) => (
                          <div
                            key={index}
                            className='text-white bg-slate-700/50 p-4 rounded-lg'
                          >
                            <h5 className='text-white font-medium mb-3'>
                              Previous Employer {index + 1}
                            </h5>
                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <p className='text-slate-400 text-sm'>
                                  Company
                                </p>
                                <p className='text-white font-medium'>
                                  {emp.company || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className='text-slate-400 text-sm'>
                                  Supervisor
                                </p>
                                <p className='text-white font-medium'>
                                  {emp.supervisor || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className='text-slate-400 text-sm'>
                                  Address
                                </p>
                                <p className='text-white font-medium'>
                                  {emp.address || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className='text-slate-400 text-sm'>Phone</p>
                                <p className='text-white font-medium'>
                                  {emp.phone || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className='text-slate-400 text-sm'>
                                  Position
                                </p>
                                <p className='text-white font-medium'>
                                  {emp.position || 'N/A'}
                                </p>
                              </div>
                              <div className='col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2'>
                                <div>
                                  <p className='text-slate-400 text-sm'>
                                    Start Date
                                  </p>
                                  <p className='text-white font-medium'>
                                    {emp.start_date || 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className='text-slate-400 text-sm'>
                                    End Date
                                  </p>
                                  <p className='text-white font-medium'>
                                    {emp.end_date || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              {emp.reasons_for_leaving && (
                                <div className='col-span-2'>
                                  <p className='text-slate-400 text-sm mb-2'>
                                    Reasons for Leaving
                                  </p>
                                  <p className='text-white text-sm bg-slate-900/50 p-2 rounded'>
                                    {emp.reasons_for_leaving}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Compliance & Actions */}
        <div className='space-y-6'>
          {/* Compliance Status */}
          <Card className='bg-slate-800 border-slate-700'>
            <CardHeader>
              <CardTitle className='text-white flex items-center gap-2'>
                <Shield className='h-5 w-5' />
                Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-300 text-sm'>
                    PCC / Criminal Background Check
                  </span>
                  {driver.pcc_document_path ? (
                    <Badge variant='secondary' className='bg-green-600'>
                      <CheckCircle2 className='h-3 w-3 mr-1' />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant='secondary' className='bg-red-600'>
                      <XCircle className='h-3 w-3 mr-1' />
                      Missing
                    </Badge>
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-300 text-sm'>
                    License Front Image
                  </span>
                  {driver.license_front_image_path ? (
                    <Badge variant='secondary' className='bg-green-600'>
                      <CheckCircle2 className='h-3 w-3 mr-1' />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant='secondary' className='bg-red-600'>
                      <XCircle className='h-3 w-3 mr-1' />
                      Missing
                    </Badge>
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-300 text-sm'>
                    License Back Image
                  </span>
                  {driver.license_back_image_path ? (
                    <Badge variant='secondary' className='bg-green-600'>
                      <CheckCircle2 className='h-3 w-3 mr-1' />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant='secondary' className='bg-red-600'>
                      <XCircle className='h-3 w-3 mr-1' />
                      Missing
                    </Badge>
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-300 text-sm'>
                    Abstract Document
                  </span>
                  {driver.abstract_document_path ? (
                    <Badge variant='secondary' className='bg-green-600'>
                      <CheckCircle2 className='h-3 w-3 mr-1' />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant='secondary' className='bg-red-600'>
                      <XCircle className='h-3 w-3 mr-1' />
                      Missing
                    </Badge>
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-300 text-sm'>CVOR Document</span>
                  {driver.cvor_document_path ? (
                    <Badge variant='secondary' className='bg-green-600'>
                      <CheckCircle2 className='h-3 w-3 mr-1' />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant='secondary' className='bg-red-600'>
                      <XCircle className='h-3 w-3 mr-1' />
                      Missing
                    </Badge>
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-300 text-sm'>
                    Safety Certificate
                  </span>
                  {driver.safety_certificate_path ? (
                    <Badge variant='secondary' className='bg-green-600'>
                      <CheckCircle2 className='h-3 w-3 mr-1' />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant='secondary' className='bg-red-600'>
                      <XCircle className='h-3 w-3 mr-1' />
                      Missing
                    </Badge>
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-300 text-sm'>
                    Background Check
                  </span>
                  <Badge
                    variant='secondary'
                    className={
                      driver.background_check_status === 'completed'
                        ? 'bg-green-600'
                        : 'bg-yellow-600'
                    }
                  >
                    {driver.background_check_status === 'completed' ? (
                      <CheckCircle2 className='h-3 w-3 mr-1' />
                    ) : (
                      <AlertCircle className='h-3 w-3 mr-1' />
                    )}
                    {driver.background_check_status === 'completed'
                      ? 'Completed'
                      : 'Pending'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between gap-3'>
                  <span className='text-slate-300 text-sm'>
                    Reference check
                  </span>
                  <div className='flex items-center gap-2 shrink-0'>
                    {isUpdatingReferenceCheck ? (
                      <Spinner
                        className='h-5 w-5 shrink-0 text-blue-400'
                        aria-label='Updating reference check'
                      />
                    ) : null}
                    <Select
                      disabled={isUpdatingReferenceCheck}
                      value={
                        driver.reference_check_status === 'completed'
                          ? 'completed'
                          : 'pending'
                      }
                      onValueChange={(v) =>
                        handleReferenceCheckStatusChange(
                          v as 'pending' | 'completed',
                        )
                      }
                    >
                      <SelectTrigger className='h-8 w-[130px] bg-slate-700 border-slate-600 text-white text-xs'>
                        <SelectValue placeholder='Status' />
                      </SelectTrigger>
                      <SelectContent className='text-white bg-slate-700 border-slate-600'>
                        <SelectItem value='pending'>Pending</SelectItem>
                        <SelectItem value='completed'>Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className='pt-4 border-t border-slate-700'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-slate-300 font-medium'>
                    Overall Compliance
                  </span>
                  {compliance.isCompliant ? (
                    <Badge variant='secondary' className='bg-green-600'>
                      <CheckCircle2 className='h-3 w-3 mr-1' />
                      Compliant
                    </Badge>
                  ) : (
                    <Badge variant='secondary' className='bg-red-600'>
                      <AlertTriangle className='h-3 w-3 mr-1' />
                      Non-Compliant
                    </Badge>
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-300 font-medium'>
                    Invoice Ready
                  </span>
                  {isInvoiceReady ? (
                    <Badge variant='secondary' className='bg-green-600'>
                      <CheckCircle2 className='h-3 w-3 mr-1' />
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant='secondary' className='bg-yellow-600'>
                      <AlertCircle className='h-3 w-3 mr-1' />
                      Not Ready
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-slate-700 bg-slate-800'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-white'>
                <FileText className='h-5 w-5' />
                Uploaded Documents
              </CardTitle>
              <CardDescription className='text-slate-400'>
                Images show inline; PDFs use the embedded viewer. Use Open if
                the preview does not load.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 sm:grid-cols-2'>
                <DocumentPreviewTile
                  title='PCC / Criminal Background Check'
                  path={driver.pcc_document_path}
                  absoluteUrl={driver.pcc_document_url}
                />
                <DocumentPreviewTile
                  title='License (front)'
                  path={driver.license_front_image_path}
                  absoluteUrl={driver.license_front_image_url}
                />
                <DocumentPreviewTile
                  title='License (back)'
                  path={driver.license_back_image_path}
                  absoluteUrl={driver.license_back_image_url}
                />
                <DocumentPreviewTile
                  title='License (legacy)'
                  path={driver.license_document_path}
                  absoluteUrl={driver.license_document_url}
                />
                <DocumentPreviewTile
                  title='Abstract'
                  path={driver.abstract_document_path}
                  absoluteUrl={driver.abstract_document_url}
                />
                <DocumentPreviewTile
                  title='CVOR'
                  path={driver.cvor_document_path}
                  absoluteUrl={driver.cvor_document_url}
                />
                <DocumentPreviewTile
                  title='Safety certificate'
                  path={driver.safety_certificate_path}
                  absoluteUrl={driver.safety_certificate_url}
                />
              </div>
            </CardContent>
          </Card>

          {/* Compliance Notes */}
          {/* {driver.compliance_notes && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Compliance Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm bg-slate-700/50 p-3 rounded-lg">
                  {driver.compliance_notes}
                </p>
              </CardContent>
            </Card>
          )} */}

          {/* Quick Actions */}
          <Card className='bg-slate-800 border-slate-700'>
            <CardHeader>
              <CardTitle className='text-white text-sm'>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <Button
                variant='outline'
                className='w-full gap-2 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 bg-transparent'
                onClick={() =>
                  router.push(`/admin/drivers/create?id=${driver.id}`)
                }
              >
                <FileText className='mr-2 h-4 w-4' />
                Edit Driver
              </Button>
              <Button
                variant='outline'
                disabled={exportingPdf}
                className='w-full gap-2 border-slate-600 bg-transparent text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-70'
                onClick={exportToPDF}
              >
                {exportingPdf ? (
                  <>
                    <Spinner className='mr-2 h-4 w-4 shrink-0' />
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <Download className='mr-2 h-4 w-4 shrink-0' />
                    Export to PDF
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
