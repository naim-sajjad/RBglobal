'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { CreateDriverData, Tenant, DriverClass } from '@/lib/types';
import {
  getDefaultDriverCompliancePayload,
  parseDriverComplianceNotes,
  serializeDriverCompliancePayload,
  type DriverCompliancePayload,
} from '@/lib/admin-driver-compliance';
import { DriverCreateExtendedSteps } from '@/components/admin/driver-create-extended';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

export default function CreateDriverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();
  const driverId = searchParams.get('id');
  const isEditing = !!driverId;
  const isDriver =
    currentUser?.roles?.some((role: any) => role.name === 'driver') || false;

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [driverClasses, setDriverClasses] = useState<DriverClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDriver, setIsLoadingDriver] = useState(isEditing);
  const [error, setError] = useState('');
  const [currentSection, setCurrentSection] = useState(1);
  const totalSections = 6;
  const [compliance, setCompliance] = useState<DriverCompliancePayload>(() =>
    getDefaultDriverCompliancePayload(),
  );

  const vehicleTypeOptions = ['Truck', 'Van', 'Trailer', 'Reefer', 'Flatbed'];
  const licenseTypes = ['AZ', 'DZ', 'G-Class', 'G1/G2', 'Other'];

  const [formData, setFormData] = useState<CreateDriverData>({
    name: '',
    email: '',
    password: '',
    tenant_id: '',
    license_number: '',
    license_type: undefined,
    license_other: '',
    issuing_authority: '',
    license_issue_date: '',
    license_expiry_date: '',
    vehicle_types: [],
    status: 'pending_approval',
    driver_class_id: undefined,
    driver_class_effective_date: '',
    payee_business_name: '',
    payee_address: '',
    background_check_status: 'pending',
  });

  const [documentFiles, setDocumentFiles] = useState<{
    pcc_document: File | null;
    license_front_image: File | null;
    license_back_image: File | null;
    license_document: File | null;
    abstract_document: File | null;
    cvor_document: File | null;
    safety_certificate: File | null;
  }>({
    pcc_document: null,
    license_front_image: null,
    license_back_image: null,
    license_document: null,
    abstract_document: null,
    cvor_document: null,
    safety_certificate: null,
  });

  useEffect(() => {
    if (currentUser?.is_global_admin) {
      fetchTenants();
    }
    apiClient
      .getDriverClasses({ status: 'active' })
      .then((list) => setDriverClasses(Array.isArray(list) ? list : []))
      .catch(() => {});
    if (isEditing && driverId) {
      fetchDriverForEdit();
    }
  }, [currentUser, driverId, isEditing]);

  const fetchDriverForEdit = async () => {
    if (!driverId) return;

    setIsLoadingDriver(true);
    try {
      const driver = await apiClient.getDriver(driverId);

      // Check if driver is editing their own profile
      if (isDriver && driver.user_id !== currentUser?.id) {
        toast.error('You can only edit your own profile');
        router.push('/driver/profile');
        return;
      }

      // Populate form with driver data (structured fields mirror public registration JSON)
      setCompliance(parseDriverComplianceNotes(driver.compliance_notes));
      setFormData({
        name: driver.user?.name || '',
        email: driver.user?.email || '',
        password: '', // Don't populate password
        tenant_id: driver.tenant_id || '',
        license_number: driver.license_number || '',
        license_type: driver.license_type as CreateDriverData['license_type'],
        license_other: driver.license_other || '',
        issuing_authority: driver.issuing_authority || '',
        license_issue_date: driver.license_issue_date
          ? new Date(driver.license_issue_date).toISOString().split('T')[0]
          : '',
        license_expiry_date: driver.license_expiry_date
          ? new Date(driver.license_expiry_date).toISOString().split('T')[0]
          : '',
        vehicle_types: driver.vehicle_types || [],
        status: driver.status as CreateDriverData['status'],
        driver_class_id: driver.driver_class_id ?? undefined,
        driver_class_effective_date: driver.driver_class_effective_date
          ? new Date(driver.driver_class_effective_date)
              .toISOString()
              .split('T')[0]
          : '',
        payee_business_name: driver.payee_business_name || '',
        payee_address: driver.payee_address || '',
        background_check_status:
          driver.background_check_status === 'completed'
            ? 'completed'
            : 'pending',
      });
    } catch (err: any) {
      toast.error('Failed to load driver data');
      router.push(isDriver ? '/driver/profile' : '/admin/drivers');
    } finally {
      setIsLoadingDriver(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await apiClient.getTenants();
      setTenants(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Failed to load tenants:', err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileChange = (
    field: keyof typeof documentFiles,
    file: File | null,
  ) => {
    setDocumentFiles((prev) => ({ ...prev, [field]: file }));
  };

  const handleVehicleTypeToggle = (type: string) => {
    setFormData((prev) => {
      const types = prev.vehicle_types || [];
      if (types.includes(type)) {
        return { ...prev, vehicle_types: types.filter((t) => t !== type) };
      } else {
        return { ...prev, vehicle_types: [...types, type] };
      }
    });
  };

  const submitDriver = async (navigateAfterSave: boolean) => {
    setError('');
    setIsLoading(true);

    // Validation - password only required for new drivers
    if (!isEditing && (!formData.password || formData.password.length < 8)) {
      setError('Password is required and must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const submitData: Record<string, unknown> = {
        ...formData,
        compliance_notes: serializeDriverCompliancePayload(compliance),
        // Add document files
        pcc_document: documentFiles.pcc_document,
        license_front_image: documentFiles.license_front_image,
        license_back_image: documentFiles.license_back_image,
        license_document: documentFiles.license_document,
        abstract_document: documentFiles.abstract_document,
        cvor_document: documentFiles.cvor_document,
        safety_certificate: documentFiles.safety_certificate,
      };

      submitData.payee_business_name = formData.payee_business_name?.trim() || '';
      submitData.payee_address = formData.payee_address?.trim() || '';
      submitData.background_check_status = formData.background_check_status;

      // Remove password if not provided (for editing)
      if (isEditing && !submitData.password) {
        delete submitData.password;
      }
      submitData.driver_class_id = formData.driver_class_id ?? null;
      submitData.driver_class_effective_date =
        formData.driver_class_effective_date || null;

      if (isEditing && driverId) {
        await apiClient.updateDriver(driverId, submitData as CreateDriverData);
        toast.success(
          navigateAfterSave
            ? 'Driver profile saved. Returning to list…'
            : 'Driver profile saved.',
        );
        if (navigateAfterSave) {
          router.push(isDriver ? '/driver/profile' : '/admin/drivers');
        }
      } else {
        await apiClient.createDriver(submitData as CreateDriverData);
        toast.success('Driver created successfully');
        router.push('/admin/drivers');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        (isEditing ? 'Failed to update driver' : 'Failed to create driver');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (
    e: React.FormEvent,
    opts?: { navigateAfter?: boolean },
  ) => {
    e.preventDefault();
    const navigateAfterSave = opts?.navigateAfter ?? !isEditing;
    void submitDriver(navigateAfterSave);
  };

  const nextSection = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentSection < totalSections) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  if (isLoadingDriver) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Spinner className='h-8 w-8 text-blue-500' />
      </div>
    );
  }

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
            <h1 className='text-3xl font-bold text-white'>
              {isEditing ? 'Edit Driver Profile' : 'Add New Driver'}
            </h1>
            <p className='text-slate-400 mt-2'>
              {isEditing
                ? 'Update driver information and profile'
                : 'Create a new driver account and profile'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card className='bg-slate-800 border-slate-700'>
        <CardContent className='pt-6'>
          <div className='flex items-center'>
            {[
              'Account',
              'Address',
              'License',
              'Driving',
              'Employment',
              'Docs',
            ].map((label, idx) => {
              const section = idx + 1;
              return (
                <div
                  key={label}
                  className='flex flex-1 items-center min-w-0'
                >
                  <div className='flex shrink-0 flex-col items-center gap-1'>
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold sm:h-10 sm:w-10 ${
                        section <= currentSection
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {section}
                    </div>
                    <span className='hidden max-w-[4.5rem] text-center text-[10px] uppercase tracking-wide text-slate-500 sm:block'>
                      {label}
                    </span>
                  </div>
                  {section < totalSections ? (
                    <div
                      className={`mx-1 h-1 min-h-px flex-1 ${
                        section < currentSection
                          ? 'bg-blue-600'
                          : 'bg-slate-700'
                      }`}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card className='bg-slate-800 border-slate-700'>
        <CardContent className='pt-6'>
          <form
            onSubmit={(e) =>
              handleSubmit(
                e,
                isEditing ? { navigateAfter: false } : undefined,
              )
            }
            className='space-y-6'
          >
            {error && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Section 1: Account & personal (mirrors registration JSON → compliance_notes.personal + user) */}
            {currentSection === 1 && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-white'>
                  Account &amp; personal
                </h3>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='name' className='text-slate-200'>
                      Full Name *
                    </Label>
                    <Input
                      id='name'
                      name='name'
                      value={formData.name}
                      onChange={handleChange}
                      placeholder='Enter full name'
                      disabled={isLoading}
                      className='border-slate-600 bg-slate-700 text-white'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='email' className='text-slate-200'>
                      Email *
                    </Label>
                    <Input
                      id='email'
                      name='email'
                      type='email'
                      value={formData.email}
                      onChange={handleChange}
                      placeholder='your@email.com'
                      disabled={isLoading}
                      className='border-slate-600 bg-slate-700 text-white'
                      required
                    />
                  </div>
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='password' className='text-slate-200'>
                      Password {!isEditing && '*'}
                      {isEditing && (
                        <span className='ml-2 text-xs text-slate-400'>
                          (Leave blank to keep current password)
                        </span>
                      )}
                    </Label>
                    <Input
                      id='password'
                      name='password'
                      type='password'
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={
                        isEditing
                          ? 'Enter new password (optional)'
                          : 'At least 8 characters'
                      }
                      disabled={isLoading || isLoadingDriver}
                      className='border-slate-600 bg-slate-700 text-white'
                      required={!isEditing}
                      minLength={isEditing ? undefined : 8}
                    />
                  </div>
                  {currentUser?.is_global_admin ? (
                    <div className='space-y-2'>
                      <Label htmlFor='tenant_id' className='text-slate-200'>
                        Tenant
                      </Label>
                      <Select
                        value={formData.tenant_id || ''}
                        onValueChange={(value) =>
                          setFormData({ ...formData, tenant_id: value })
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className='border-slate-600 bg-slate-700 text-white'>
                          <SelectValue placeholder='Select tenant' />
                        </SelectTrigger>
                        <SelectContent className='border-slate-600 bg-slate-700 text-white'>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.name ||
                                tenant.domain ||
                                tenant.id.substring(0, 8)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>

                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                  <div className='space-y-2'>
                    <Label className='text-slate-200'>Middle initial</Label>
                    <Input
                      value={compliance.personal.middle_initial}
                      onChange={(e) =>
                        setCompliance((p) => ({
                          ...p,
                          personal: {
                            ...p.personal,
                            middle_initial: e.target.value,
                          },
                        }))
                      }
                      disabled={isLoading}
                      className='border-slate-600 bg-slate-700 text-white'
                      maxLength={4}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-slate-200'>Gender</Label>
                    <Input
                      value={compliance.personal.gender}
                      onChange={(e) =>
                        setCompliance((p) => ({
                          ...p,
                          personal: {
                            ...p.personal,
                            gender: e.target.value,
                          },
                        }))
                      }
                      disabled={isLoading}
                      className='border-slate-600 bg-slate-700 text-white'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-slate-200'>Date of birth</Label>
                    <Input
                      type='date'
                      value={compliance.personal.date_of_birth}
                      onChange={(e) =>
                        setCompliance((p) => ({
                          ...p,
                          personal: {
                            ...p.personal,
                            date_of_birth: e.target.value,
                          },
                        }))
                      }
                      disabled={isLoading}
                      className='border-slate-600 bg-slate-700 text-white'
                    />
                  </div>
                  <div className='space-y-2 lg:col-span-2'>
                    <Label className='text-slate-200'>
                      Legally entitled to work in Canada
                    </Label>
                    <Input
                      value={compliance.personal.work_eligibility_canada}
                      onChange={(e) =>
                        setCompliance((p) => ({
                          ...p,
                          personal: {
                            ...p.personal,
                            work_eligibility_canada: e.target.value,
                          },
                        }))
                      }
                      disabled={isLoading}
                      placeholder='Yes / Citizen / Permit number…'
                      className='border-slate-600 bg-slate-700 text-white'
                    />
                  </div>
                  <div className='space-y-2 lg:col-span-3'>
                    <Label className='text-slate-200'>Education</Label>
                    <Input
                      value={compliance.personal.education}
                      onChange={(e) =>
                        setCompliance((p) => ({
                          ...p,
                          personal: {
                            ...p.personal,
                            education: e.target.value,
                          },
                        }))
                      }
                      disabled={isLoading}
                      className='border-slate-600 bg-slate-700 text-white'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-slate-200'>Medical limitations</Label>
                    <Input
                      value={compliance.personal.medical_limitations}
                      onChange={(e) =>
                        setCompliance((p) => ({
                          ...p,
                          personal: {
                            ...p.personal,
                            medical_limitations: e.target.value,
                          },
                        }))
                      }
                      disabled={isLoading}
                      placeholder='Yes / No'
                      className='border-slate-600 bg-slate-700 text-white'
                    />
                  </div>
                  <div className='space-y-2 lg:col-span-2'>
                    <Label className='text-slate-200'>
                      Medical limitations explanation
                    </Label>
                    <Textarea
                      value={compliance.personal.medical_limitations_explanation}
                      onChange={(e) =>
                        setCompliance((p) => ({
                          ...p,
                          personal: {
                            ...p.personal,
                            medical_limitations_explanation: e.target.value,
                          },
                        }))
                      }
                      disabled={isLoading}
                      className='min-h-[72px] border-slate-600 bg-slate-700 text-white'
                    />
                  </div>
                </div>
              </div>
            )}

            <DriverCreateExtendedSteps
              currentSection={currentSection}
              isLoading={isLoading}
              isEditing={isEditing}
              compliance={compliance}
              setCompliance={setCompliance}
              formData={formData}
              setFormData={setFormData}
              handleChange={handleChange}
              handleVehicleTypeToggle={handleVehicleTypeToggle}
              vehicleTypeOptions={vehicleTypeOptions}
              licenseTypes={licenseTypes}
              documentFiles={documentFiles}
              handleFileChange={handleFileChange}
              driverClasses={driverClasses}
            />

            {/* Navigation Buttons */}
            <div className='flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  prevSection(e);
                }}
                disabled={currentSection === 1 || isLoading}
                className='border-slate-600 bg-transparent text-slate-600 hover:bg-slate-600 hover:text-white'
              >
                Previous
              </Button>
              <div className='flex flex-wrap items-center gap-2'>
                {isEditing && driverId ? (
                  <>
                    <Button
                      type='submit'
                      disabled={isLoading}
                      variant='outline'
                      className='border-slate-500 text-slate-100 hover:bg-slate-700'
                    >
                      {isLoading && <Spinner className='mr-2 h-4 w-4 shrink-0' />}
                      {isLoading ? 'Saving…' : 'Save changes'}
                    </Button>
                    <Button
                      type='button'
                      disabled={isLoading}
                      variant='outline'
                      className='border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                      onClick={() => void submitDriver(true)}
                    >
                      Save &amp; close
                    </Button>
                  </>
                ) : null}
                {currentSection < totalSections ? (
                  <Button
                    type='button'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      nextSection(e);
                    }}
                    disabled={isLoading}
                    className='bg-blue-600 hover:bg-blue-700'
                  >
                    Next
                  </Button>
                ) : (
                  !isEditing && (
                    <Button
                      type='submit'
                      disabled={isLoading}
                      className='bg-blue-600 hover:bg-blue-700'
                    >
                      {isLoading && <Spinner className='mr-2 h-4 w-4 shrink-0' />}
                      {isLoading ? 'Creating...' : 'Create Driver'}
                    </Button>
                  )
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
