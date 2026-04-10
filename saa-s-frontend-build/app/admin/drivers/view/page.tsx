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
  MapPin,
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
  const [updatingDriverClass, setUpdatingDriverClass] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState<
    Record<string, boolean>
  >({});
  const [parsedComplianceData, setParsedComplianceData] = useState<any>(null);

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
    if (!driver.medical_certificate_path) {
      issues.push('Medical Certificate missing');
    }
    if (!driver.license_document_path) {
      issues.push('License Document missing');
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

    // Check drug & alcohol test
    if (!driver.drug_alcohol_test) {
      issues.push('Drug & Alcohol test not completed');
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

    try {
      // Fetch reference checks for this driver (so they are included in PDF)
      let referenceChecks: any[] = [];
      try {
        const checksData = await apiClient.getReferenceChecks(driver.id);
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

      // Helper function to draw a line
      const drawLine = (x: number, y: number, length: number) => {
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.line(x, y, x + length, y);
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
        // Draw checkbox square - position it so text doesn't overlap
        const checkboxSize = 4;
        const checkboxY = y - 3.5; // Align checkbox with text baseline
        const textX = x + checkboxSize + 4; // Increased spacing between checkbox and text

        // Draw checkbox
        doc.rect(x, checkboxY, checkboxSize, checkboxSize);

        if (checked) {
          // Draw checkmark inside checkbox
          doc.setLineWidth(0.8);
          doc.line(x + 0.5, checkboxY + 2, x + 1.5, checkboxY + 3);
          doc.line(x + 1.5, checkboxY + 3, x + 3.5, checkboxY + 0.5);
        }

        // Add label text AFTER checkbox with proper spacing to avoid overlap
        doc.text(label, textX, y);
      };

      // Helper function to check if new page needed
      const checkNewPage = (requiredSpace: number) => {
        if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPos = 20;
        }
      };

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
      const nameParts = driver.user?.name?.split(' ') || [];
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
            yPos = addFormField(
              'How long',
              addr.duration || '',
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
        driver.license_number || '',
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
      const expiryDate = driver.license_expiry_date
        ? new Date(driver.license_expiry_date)
            .toLocaleDateString('en-CA')
            .replace(/\//g, '-')
        : '';
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
        (driver.years_of_experience || 0).toString(),
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
      const printName = driver.user?.name || '';
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

      // Save PDF
      const fileName = `Driver_Application_${driver.user?.name?.replace(/\s+/g, '_') || 'Driver'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success('PDF exported successfully');
    } catch (error: any) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF. Please try again.');
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
                      <SelectTrigger className='text-white bg-slate-700 border-slate-600 text-white w-full max-w-[280px]'>
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

          {/* Driving Experience */}
          <Card className='bg-slate-800 border-slate-700'>
            <CardHeader>
              <CardTitle className='text-white flex items-center gap-2'>
                <Truck className='h-5 w-5' />
                Driving Experience & Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-slate-400 text-sm'>Years of Experience</p>
                  <p className='text-white font-medium'>
                    {driver.years_of_experience || 0} years
                  </p>
                </div>
                <div>
                  <p className='text-slate-400 text-sm'>Vehicle Ownership</p>
                  <p className='text-white font-medium capitalize'>
                    {driver.vehicle_ownership?.replace('-', ' ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-slate-400 text-sm'>Vehicle Types</p>
                  <div className='flex flex-wrap gap-2 mt-1'>
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
                </div>
                <div>
                  <p className='text-slate-400 text-sm'>Vehicle Capacity</p>
                  <p className='text-white font-medium'>
                    {driver.vehicle_capacity || 'N/A'}
                  </p>
                </div>
              </div>
              {driver.driving_history && (
                <div>
                  <p className='text-slate-400 text-sm mb-2'>Driving History</p>
                  <p className='text-white text-sm bg-slate-700/50 p-3 rounded-lg'>
                    {driver.driving_history}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Route & Shift Details */}
          <Card className='bg-slate-800 border-slate-700'>
            <CardHeader>
              <CardTitle className='text-white flex items-center gap-2'>
                <MapPin className='h-5 w-5' />
                Route & Shift Details
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-slate-400 text-sm'>Route Type</p>
                  <p className='text-white font-medium capitalize'>
                    {driver.route_type?.replace('-', ' ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-slate-400 text-sm'>Shift Timing</p>
                  <p className='text-white font-medium capitalize'>
                    {driver.shift_timing || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-slate-400 text-sm'>Pay Type</p>
                  <p className='text-white font-medium capitalize'>
                    {driver.pay_type?.replace('-', ' ') || 'N/A'}
                  </p>
                </div>
              </div>
              {driver.route_details && (
                <div>
                  <p className='text-slate-400 text-sm mb-2'>Route Details</p>
                  <p className='text-white text-sm bg-slate-700/50 p-3 rounded-lg'>
                    {driver.route_details}
                  </p>
                </div>
              )}
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
                              Duration: {addr.duration || 'N/A'}
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
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b border-slate-700'>
                        <th className='text-left text-slate-300 p-2'>Make</th>
                        <th className='text-left text-slate-300 p-2'>
                          Tractor Type
                        </th>
                        <th className='text-left text-slate-300 p-2'>
                          Transmissions
                        </th>
                        <th className='text-left text-slate-300 p-2'>
                          Trailer Type
                        </th>
                        <th className='text-left text-slate-300 p-2'>
                          Areas Operated
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedComplianceData.driving_experience.equipment_used.map(
                        (equip: any, index: number) => (
                          <tr
                            key={index}
                            className='border-b border-slate-700/50'
                          >
                            <td className='text-white p-2'>
                              {equip.make || 'N/A'}
                            </td>
                            <td className='text-white p-2'>
                              {equip.tractor_type || 'N/A'}
                            </td>
                            <td className='text-white p-2'>
                              {equip.transmissions || 'N/A'}
                            </td>
                            <td className='text-white p-2'>
                              {equip.trailer_type || 'N/A'}
                            </td>
                            <td className='text-white p-2'>
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
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b border-slate-700'>
                        <th className='text-left text-slate-300 p-2'>Date</th>
                        <th className='text-left text-slate-300 p-2'>
                          Location
                        </th>
                        <th className='text-left text-slate-300 p-2'>
                          Violation/Charge
                        </th>
                        <th className='text-left text-slate-300 p-2'>
                          Penalty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedComplianceData.driving_experience.traffic_violations.map(
                        (violation: any, index: number) => (
                          <tr
                            key={index}
                            className='border-b border-slate-700/50'
                          >
                            <td className='text-white p-2'>
                              {violation.date || 'N/A'}
                            </td>
                            <td className='text-white p-2'>
                              {violation.location || 'N/A'}
                            </td>
                            <td className='text-white p-2'>
                              {violation.violation_charge || 'N/A'}
                            </td>
                            <td className='text-white p-2'>
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
                    Medical Certificate
                  </span>
                  {driver.medical_certificate_path ? (
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
                    License Document
                  </span>
                  {driver.license_document_path ? (
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
                <div className='flex items-center justify-between'>
                  <span className='text-slate-300 text-sm'>
                    Drug & Alcohol Test
                  </span>
                  {driver.drug_alcohol_test ? (
                    <Badge variant='secondary' className='bg-green-600'>
                      <CheckCircle2 className='h-3 w-3 mr-1' />
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant='secondary' className='bg-red-600'>
                      <XCircle className='h-3 w-3 mr-1' />
                      Not Completed
                    </Badge>
                  )}
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
                className='w-full gap-2 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 bg-transparent'
                onClick={exportToPDF}
              >
                <Download className='mr-2 h-4 w-4' />
                Export to PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
