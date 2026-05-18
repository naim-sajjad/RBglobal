'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Shield,
  Download,
  Ban,
  CheckCircle,
  AlertTriangle,
  Home,
  IdCard,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { DriverWithDetails } from '@/lib/types';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DriverDetailPage() {
  const router = useRouter();
  const params = useParams();
  const driverId = params?.id as string;

  const [driver, setDriver] = useState<DriverWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingReferenceCheck, setIsUpdatingReferenceCheck] =
    useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState<
    Record<string, boolean>
  >({});
  /** Parsed questionnaire / application payload from `compliance_notes` JSON */
  const [parsedComplianceData, setParsedComplianceData] =
    useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (driverId) {
      fetchDriver();
    }
  }, [driverId]);

  const fetchDriver = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.getDriver(driverId);
      setDriver(response);
      setParsedComplianceData(null);
      if (response.compliance_notes) {
        try {
          setParsedComplianceData(JSON.parse(response.compliance_notes));
        } catch {
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
            <SelectContent className='bg-slate-700 border-slate-600'>
              <SelectItem value='pending_approval'>Pending Approval</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
              <SelectItem value='suspended'>Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='outline' className='border-slate-600' asChild>
            <Link href={`/admin/drivers/${driver.id}/reference-checks`}>
              <FileText className='h-4 w-4 mr-2' />
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

          {/* Driver Class (pay tier) — record on file */}
          {driver.driver_class && (
            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                  <GraduationCap className='h-5 w-5' />
                  Driver Class
                </CardTitle>
                <CardDescription className='text-slate-400'>
                  Pay tier assigned to this driver on record.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-white font-medium'>
                  {driver.driver_class.name || driver.driver_class.code}
                  <span className='text-slate-400'>
                    {' '}
                    ({driver.driver_class.code})
                  </span>
                </p>
                {driver.driver_class_effective_date ? (
                  <p className='text-slate-400 text-sm mt-1'>
                    Effective:{' '}
                    {new Date(
                      driver.driver_class_effective_date,
                    ).toLocaleDateString()}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          )}

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
                  <p className='text-slate-400 text-sm'>Issue Date</p>
                  <p className='text-white font-medium'>
                    {driver.license_issue_date
                      ? new Date(
                          driver.license_issue_date,
                        ).toLocaleDateString()
                      : 'N/A'}
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

          {driver.compliance_notes && !parsedComplianceData && (
            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                Application questionnaire data is on file but could not be
                parsed for display. It may be invalid JSON or in an older
                format.
              </AlertDescription>
            </Alert>
          )}

          {/* Application / questionnaire (from compliance_notes JSON) */}
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
                        {parsedComplianceData.address
                          .current_address_living_since || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {(parsedComplianceData.address.previous_addresses?.length ??
                  0) > 0 && (
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

          {parsedComplianceData?.license && (
            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                  <IdCard className='h-5 w-5' />
                  Additional License Details (application)
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
                      {parsedComplianceData.license.license_conditions ||
                        'N/A'}
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

          {(parsedComplianceData?.driving_experience?.equipment_used?.length ??
            0) > 0 && (
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
                      {parsedComplianceData?.driving_experience?.equipment_used?.map(
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

          {(parsedComplianceData?.driving_experience?.traffic_violations
            ?.length ?? 0) > 0 && (
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
                      {parsedComplianceData?.driving_experience?.traffic_violations?.map(
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

          {parsedComplianceData?.employment_history && (
            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                  <Briefcase className='h-5 w-5' />
                  Employment History
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
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

                {(parsedComplianceData.employment_history.previous_employers
                  ?.length ?? 0) > 0 && (
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
                    <Badge
                      variant='secondary'
                      className={
                        driver.reference_check_status === 'completed'
                          ? 'bg-green-600'
                          : 'bg-yellow-600'
                      }
                    >
                      {driver.reference_check_status === 'completed' ? (
                        <CheckCircle2 className='h-3 w-3 mr-1' />
                      ) : (
                        <AlertCircle className='h-3 w-3 mr-1' />
                      )}
                      {driver.reference_check_status === 'completed'
                        ? 'Approved'
                        : 'Not approved'}
                    </Badge>
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
                        <SelectValue placeholder='Set status' />
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
                className='w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700'
                onClick={() => router.push(`/admin/drivers/${driver.id}/edit`)}
              >
                <FileText className='mr-2 h-4 w-4' />
                Edit Driver
              </Button>
              <Button
                variant='outline'
                className='w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700'
                onClick={() => {
                  // TODO: Implement download/export functionality
                  toast.info('Export functionality coming soon');
                }}
              >
                <Download className='mr-2 h-4 w-4' />
                Export Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
