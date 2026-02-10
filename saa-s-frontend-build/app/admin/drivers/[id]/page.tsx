'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { DriverWithDetails } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
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
  const { user: currentUser } = useAuth();
  const driverId = params?.id as string;

  const [driver, setDriver] = useState<DriverWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState<Record<string, boolean>>({});

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load driver details');
      toast.error('Failed to load driver details');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSensitiveField = (field: string) => {
    setShowSensitiveData(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const maskSensitiveData = (value: string | null | undefined, field: string): string => {
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
      toast.error(err.response?.data?.message || 'Failed to update driver status');
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      pending_approval: {
        label: 'Pending Approval',
        className: 'bg-yellow-600 hover:bg-yellow-700',
        icon: <AlertCircle className="h-3 w-3 mr-1" />,
      },
      active: {
        label: 'Active',
        className: 'bg-green-600 hover:bg-green-700',
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
      },
      inactive: {
        label: 'Inactive',
        className: 'bg-slate-600 hover:bg-slate-700',
        icon: <XCircle className="h-3 w-3 mr-1" />,
      },
      suspended: {
        label: 'Suspended',
        className: 'bg-red-600 hover:bg-red-700',
        icon: <Ban className="h-3 w-3 mr-1" />,
      },
    };

    const config = statusConfig[status] || statusConfig.pending_approval;
    return (
      <Badge variant="secondary" className={`${config.className} text-white flex items-center`}>
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
      } else if (expiryDate < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Driver not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const compliance = checkCompliance();
  const isInvoiceReady = checkInvoiceReadiness();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{driver.user?.name || 'Driver'}</h1>
              {getStatusBadge(driver.status)}
              {isInvoiceReady && (
                <Badge variant="secondary" className="bg-green-600 text-white flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Invoice Ready
                </Badge>
              )}
            </div>
            <p className="text-slate-400 mt-2">{driver.user?.email || 'No email'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {driver.status === 'pending_approval' && (
            <Button
              onClick={handleApprove}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
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
            <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Compliance Warning */}
      {!compliance.isCompliant && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Compliance Issues Detected:</div>
            <ul className="list-disc list-inside space-y-1">
              {compliance.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Full Name</p>
                  <p className="text-white font-medium">{driver.user?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Email</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">
                      {maskSensitiveData(driver.user?.email || '', 'email')}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSensitiveField('email')}
                      className="h-6 w-6 p-0"
                    >
                      {showSensitiveData['email'] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Tenant</p>
                  <p className="text-white font-medium">
                    {driver.tenant?.name || driver.tenant?.domain || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Created At</p>
                  <p className="text-white font-medium">
                    {new Date(driver.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* License Information */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                License Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">License Number</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">
                      {maskSensitiveData(driver.license_number || '', 'license_number')}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSensitiveField('license_number')}
                      className="h-6 w-6 p-0"
                    >
                      {showSensitiveData['license_number'] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">License Type</p>
                  <p className="text-white font-medium">
                    {driver.license_type || 'N/A'}
                    {driver.license_other && ` (${driver.license_other})`}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Issuing Authority</p>
                  <p className="text-white font-medium">{driver.issuing_authority || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Expiry Date</p>
                  <p className="text-white font-medium">
                    {driver.license_expiry_date
                      ? new Date(driver.license_expiry_date).toLocaleDateString()
                      : 'N/A'}
                    {driver.license_expiry_date &&
                      new Date(driver.license_expiry_date) < new Date() && (
                        <Badge variant="destructive" className="ml-2">
                          Expired
                        </Badge>
                      )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driving Experience */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Driving Experience & Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Years of Experience</p>
                  <p className="text-white font-medium">{driver.years_of_experience || 0} years</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Vehicle Ownership</p>
                  <p className="text-white font-medium capitalize">
                    {driver.vehicle_ownership?.replace('-', ' ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Vehicle Types</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {driver.vehicle_types && driver.vehicle_types.length > 0 ? (
                      driver.vehicle_types.map((type, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-600">
                          {type}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Vehicle Capacity</p>
                  <p className="text-white font-medium">{driver.vehicle_capacity || 'N/A'}</p>
                </div>
              </div>
              {driver.driving_history && (
                <div>
                  <p className="text-slate-400 text-sm mb-2">Driving History</p>
                  <p className="text-white text-sm bg-slate-700/50 p-3 rounded-lg">
                    {driver.driving_history}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Route & Shift Details */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Route & Shift Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Route Type</p>
                  <p className="text-white font-medium capitalize">
                    {driver.route_type?.replace('-', ' ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Shift Timing</p>
                  <p className="text-white font-medium capitalize">
                    {driver.shift_timing || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Pay Type</p>
                  <p className="text-white font-medium capitalize">
                    {driver.pay_type?.replace('-', ' ') || 'N/A'}
                  </p>
                </div>
              </div>
              {driver.route_details && (
                <div>
                  <p className="text-slate-400 text-sm mb-2">Route Details</p>
                  <p className="text-white text-sm bg-slate-700/50 p-3 rounded-lg">
                    {driver.route_details}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Compliance & Actions */}
        <div className="space-y-6">
          {/* Compliance Status */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Medical Certificate</span>
                  {driver.medical_certificate_path ? (
                    <Badge variant="secondary" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      Missing
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">License Document</span>
                  {driver.license_document_path ? (
                    <Badge variant="secondary" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      Missing
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Abstract Document</span>
                  {driver.abstract_document_path ? (
                    <Badge variant="secondary" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      Missing
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">CVOR Document</span>
                  {driver.cvor_document_path ? (
                    <Badge variant="secondary" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      Missing
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Safety Certificate</span>
                  {driver.safety_certificate_path ? (
                    <Badge variant="secondary" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      Missing
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Background Check</span>
                  <Badge
                    variant="secondary"
                    className={
                      driver.background_check_status === 'completed'
                        ? 'bg-green-600'
                        : 'bg-yellow-600'
                    }
                  >
                    {driver.background_check_status === 'completed' ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {driver.background_check_status === 'completed' ? 'Completed' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Drug & Alcohol Test</span>
                  {driver.drug_alcohol_test ? (
                    <Badge variant="secondary" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Completed
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 font-medium">Overall Compliance</span>
                  {compliance.isCompliant ? (
                    <Badge variant="secondary" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Compliant
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Non-Compliant
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Invoice Ready</span>
                  {isInvoiceReady ? (
                    <Badge variant="secondary" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Ready
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Notes */}
          {driver.compliance_notes && (
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
          )}

          {/* Quick Actions */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                onClick={() => router.push(`/admin/drivers/${driver.id}/edit`)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Edit Driver
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                onClick={() => {
                  // TODO: Implement download/export functionality
                  toast.info('Export functionality coming soon');
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

