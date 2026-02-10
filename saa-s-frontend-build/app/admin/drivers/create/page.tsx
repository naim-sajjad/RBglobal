'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Upload, X, FileImage } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { CreateDriverData, Tenant } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

export default function CreateDriverPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSection, setCurrentSection] = useState(1);
  const totalSections = 5;

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
    license_expiry_date: '',
    years_of_experience: 0,
    driving_history: '',
    vehicle_types: [],
    vehicle_ownership: undefined,
    vehicle_capacity: '',
    route_type: undefined,
    route_details: '',
    shift_timing: undefined,
    pay_type: undefined,
    drug_alcohol_test: false,
    compliance_notes: '',
    status: 'pending_approval',
  });

  const [documentFiles, setDocumentFiles] = useState<{
    medical_certificate: File | null;
    license_document: File | null;
    abstract_document: File | null;
    cvor_document: File | null;
    safety_certificate: File | null;
  }>({
    medical_certificate: null,
    license_document: null,
    abstract_document: null,
    cvor_document: null,
    safety_certificate: null,
  });

  useEffect(() => {
    if (currentUser?.is_global_admin) {
      fetchTenants();
    }
  }, [currentUser]);

  const fetchTenants = async () => {
    try {
      const response = await apiClient.getTenants();
      setTenants(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Failed to load tenants:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileChange = (field: string, file: File | null) => {
    setDocumentFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleVehicleTypeToggle = (type: string) => {
    setFormData(prev => {
      const types = prev.vehicle_types || [];
      if (types.includes(type)) {
        return { ...prev, vehicle_types: types.filter(t => t !== type) };
      } else {
        return { ...prev, vehicle_types: [...types, type] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation
    if (!formData.password || formData.password.length < 8) {
      setError('Password is required and must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const submitData: any = {
        ...formData,
        // Add document files
        medical_certificate: documentFiles.medical_certificate,
        license_document: documentFiles.license_document,
        abstract_document: documentFiles.abstract_document,
        cvor_document: documentFiles.cvor_document,
        safety_certificate: documentFiles.safety_certificate,
      };

      await apiClient.createDriver(submitData);
      toast.success('Driver created successfully');
      router.push('/admin/drivers');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create driver';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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

  const DocumentUploadField = ({ 
    field, 
    label, 
    required = false 
  }: { 
    field: keyof typeof documentFiles; 
    label: string; 
    required?: boolean;
  }) => {
    const file = documentFiles[field];
    
    return (
      <div className="space-y-2">
        <Label htmlFor={field} className="text-slate-200">
          {label} {required && '*'}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id={field}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] || null;
              handleFileChange(field, selectedFile);
            }}
            disabled={isLoading}
            className="bg-slate-700 border-slate-600 text-white"
            required={required}
          />
          {file && (
            <div className="flex items-center gap-2">
              <FileImage className="h-4 w-4 text-green-400" />
              <span className="text-sm text-slate-300">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFileChange(field, null)}
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400">Accepted: PDF, JPG, PNG (Max 5MB)</p>
      </div>
    );
  };

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
            <h1 className="text-3xl font-bold text-white">Add New Driver</h1>
            <p className="text-slate-400 mt-2">Create a new driver account and profile</p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((section) => (
              <div key={section} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    section <= currentSection
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {section}
                </div>
                {section < 5 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      section < currentSection ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Section A: License Information */}
            {currentSection === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">License Information</h3>
                
                {/* Basic User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-200">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      disabled={isLoading}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      disabled={isLoading}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-200">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 8 characters"
                      disabled={isLoading}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                  {currentUser?.is_global_admin && (
                    <div className="space-y-2">
                      <Label htmlFor="tenant_id" className="text-slate-200">Tenant</Label>
                      <Select
                        value={formData.tenant_id || ''}
                        onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select tenant" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.name || tenant.domain || tenant.id.substring(0, 8)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_number" className="text-slate-200">
                      License Number *
                    </Label>
                    <Input
                      id="license_number"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleChange}
                      placeholder="Enter license number"
                      disabled={isLoading}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_type" className="text-slate-200">
                      License Type *
                    </Label>
                    <Select
                      value={formData.license_type || ''}
                      onValueChange={(value) =>
                        setFormData({ ...formData, license_type: value as any })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select license type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {licenseTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formData.license_type === 'Other' && (
                  <div className="space-y-2">
                    <Label htmlFor="license_other" className="text-slate-200">
                      Specify License Type *
                    </Label>
                    <Input
                      id="license_other"
                      name="license_other"
                      value={formData.license_other}
                      onChange={handleChange}
                      placeholder="Enter license type"
                      disabled={isLoading}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issuing_authority" className="text-slate-200">
                      Issuing Authority
                    </Label>
                    <Input
                      id="issuing_authority"
                      name="issuing_authority"
                      value={formData.issuing_authority}
                      onChange={handleChange}
                      placeholder="e.g., DMV, MTO"
                      disabled={isLoading}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_expiry_date" className="text-slate-200">
                      License Expiry Date *
                    </Label>
                    <Input
                      id="license_expiry_date"
                      name="license_expiry_date"
                      type="date"
                      value={formData.license_expiry_date}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* License Document Upload */}
                <DocumentUploadField field="license_document" label="License Document" />
              </div>
            )}

            {/* Section B: Driving Experience */}
            {currentSection === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Driving Experience</h3>
                <div className="space-y-2">
                  <Label htmlFor="years_of_experience" className="text-slate-200">
                    Years of Experience *
                  </Label>
                  <Input
                    id="years_of_experience"
                    name="years_of_experience"
                    type="number"
                    min="0"
                    value={formData.years_of_experience}
                    onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    disabled={isLoading}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driving_history" className="text-slate-200">
                    Driving History
                  </Label>
                  <Textarea
                    id="driving_history"
                    name="driving_history"
                    value={formData.driving_history}
                    onChange={handleChange}
                    placeholder="Accidents, violations, endorsements..."
                    disabled={isLoading}
                    className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* Section C: Vehicle Information */}
            {currentSection === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Vehicle Information</h3>
                <div className="space-y-2">
                  <Label className="text-slate-200">Vehicle Types</Label>
                  <div className="grid grid-cols-2 gap-2 border border-slate-600 rounded-lg p-3 bg-slate-700/50">
                    {vehicleTypeOptions.map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <Checkbox
                          id={`vehicle-${type}`}
                          checked={formData.vehicle_types?.includes(type) || false}
                          onCheckedChange={() => handleVehicleTypeToggle(type)}
                          disabled={isLoading}
                          className="border-slate-500"
                        />
                        <label
                          htmlFor={`vehicle-${type}`}
                          className="text-slate-300 text-sm cursor-pointer"
                        >
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_ownership" className="text-slate-200">
                      Vehicle Ownership
                    </Label>
                    <Select
                      value={formData.vehicle_ownership || ''}
                      onValueChange={(value) => setFormData({ ...formData, vehicle_ownership: value as any })}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select ownership" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="company-owned">Company-Owned</SelectItem>
                        <SelectItem value="self-owned">Self-Owned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_capacity" className="text-slate-200">
                      Vehicle Capacity
                    </Label>
                    <Input
                      id="vehicle_capacity"
                      name="vehicle_capacity"
                      value={formData.vehicle_capacity}
                      onChange={handleChange}
                      placeholder="e.g., 10,000 lbs"
                      disabled={isLoading}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section D: Route & Shift Details */}
            {currentSection === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Route & Shift Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="route_type" className="text-slate-200">Route Type</Label>
                    <Select
                      value={formData.route_type || ''}
                      onValueChange={(value) => setFormData({ ...formData, route_type: value as any })}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select route type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="regional">Regional</SelectItem>
                        <SelectItem value="long-haul">Long-Haul</SelectItem>
                        <SelectItem value="intercity">Intercity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shift_timing" className="text-slate-200">Shift Timing</Label>
                    <Select
                      value={formData.shift_timing || ''}
                      onValueChange={(value) => setFormData({ ...formData, shift_timing: value as any })}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select shift" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="night">Night</SelectItem>
                        <SelectItem value="rotational">Rotational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay_type" className="text-slate-200">Pay Type</Label>
                  <Select
                    value={formData.pay_type || ''}
                    onValueChange={(value) => setFormData({ ...formData, pay_type: value as any })}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select pay type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="per_mile">Per Mile</SelectItem>
                      <SelectItem value="per_trip">Per Trip</SelectItem>
                      <SelectItem value="fixed_salary">Fixed Salary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="route_details" className="text-slate-200">Route Details</Label>
                  <Textarea
                    id="route_details"
                    name="route_details"
                    value={formData.route_details}
                    onChange={handleChange}
                    placeholder="Preferred routes, regions, cities..."
                    disabled={isLoading}
                    className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* Section E: Compliance & Documents */}
            {currentSection === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Compliance Requirements & Documents</h3>
                
                {/* Document Uploads */}
                <div className="grid grid-cols-2 gap-4">
                  <DocumentUploadField field="medical_certificate" label="Medical Certificate" />
                  <DocumentUploadField field="abstract_document" label="Abstract Document" />
                  <DocumentUploadField field="cvor_document" label="CVOR Document" />
                  <DocumentUploadField field="safety_certificate" label="Safety Certificate" />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="drug_alcohol_test"
                    checked={formData.drug_alcohol_test}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, drug_alcohol_test: checked as boolean })
                    }
                    disabled={isLoading}
                    className="border-slate-500"
                  />
                  <Label htmlFor="drug_alcohol_test" className="text-slate-200 cursor-pointer">
                    Drug & Alcohol Test Completed
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compliance_notes" className="text-slate-200">
                    Compliance Notes
                  </Label>
                  <Textarea
                    id="compliance_notes"
                    name="compliance_notes"
                    value={formData.compliance_notes}
                    onChange={handleChange}
                    placeholder="Additional compliance information..."
                    disabled={isLoading}
                    className="bg-slate-700 border-slate-600 text-white min-h-[80px]"
                  />
                </div>

                {/* Status (Admin only) */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-slate-200">Initial Status</Label>
                  <Select
                    value={formData.status || 'pending_approval'}
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 justify-between pt-4 border-t border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  prevSection(e);
                }}
                disabled={currentSection === 1 || isLoading}
                className="border-slate-600 bg-transparent text-slate-600 hover:text-white hover:bg-slate-600"
              >
                Previous
              </Button>
              {currentSection < totalSections ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextSection(e);
                  }}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                  {isLoading ? 'Creating...' : 'Create Driver'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

