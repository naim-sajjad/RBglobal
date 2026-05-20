'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  FileText,
  User,
  Truck,
  MapPin,
  Shield,
  Calendar,
  Download,
  CheckCircle,
  AlertTriangle,
  Briefcase,
  Home,
  IdCard,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { DriverWithDetails } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function DriverProfilePage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [driver, setDriver] = useState<DriverWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState<
    Record<string, boolean>
  >({});
  const [parsedComplianceData, setParsedComplianceData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchDriverProfile();
  }, []);

  const fetchDriverProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.getMyDriverProfile();
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
      setError(err.response?.data?.message || 'Failed to load your profile');
      toast.error('Failed to load your profile');
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
        icon: <XCircle className='h-3 w-3 mr-1' />,
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
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error || 'Profile not found'}</AlertDescription>
        </Alert>
        <Button
          variant='outline'
          onClick={() => router.push('/login')}
          className='text-slate-400 hover:text-white border-slate-600'
        >
          Back to Login
        </Button>
      </div>
    );
  }

  const compliance = checkCompliance();

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-3xl font-bold text-white'>My Profile</h1>
            {getStatusBadge(driver.status)}
          </div>
          <p className='text-slate-400 mt-2'>
            {driver.user?.email || 'No email'}
          </p>
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
                  <p className='text-slate-400 text-sm'>Created At</p>
                  <p className='text-white font-medium'>
                    {new Date(driver.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
