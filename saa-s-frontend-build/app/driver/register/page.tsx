'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, CheckCircle2, Upload } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

export default function DriverRegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    // User info
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    tenant_id: '',
    
    // License Information
    license_number: '',
    license_type: '',
    license_other: '',
    issuing_authority: '',
    license_expiry_date: '',
    
    // Driving Experience
    years_of_experience: '',
    driving_history: '',
    
    // Vehicle Information
    vehicle_types: [] as string[],
    vehicle_ownership: '',
    vehicle_capacity: '',
    
    // Route & Shift Details
    route_type: '',
    route_details: '',
    shift_timing: '',
    pay_type: '',
    
    // Compliance Requirements
    medical_certificate: null as File | null,
    drug_alcohol_test: false,
    compliance_notes: '',
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const totalSections = 5;

  const vehicleTypeOptions = ['Truck', 'Van', 'Trailer', 'Reefer', 'Flatbed'];
  const licenseTypes = ['AZ', 'DZ', 'G-Class', 'G1/G2', 'Other'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, medical_certificate: e.target.files![0] }));
    }
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
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    if (!formData.license_number || !formData.license_type || !formData.license_expiry_date) {
      setError('Please complete all required license information');
      setIsLoading(false);
      return;
    }

    try {
      const submitData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        license_number: formData.license_number,
        license_type: formData.license_type,
        issuing_authority: formData.issuing_authority,
        license_expiry_date: formData.license_expiry_date,
        years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : 0,
        driving_history: formData.driving_history,
        vehicle_types: formData.vehicle_types,
        vehicle_ownership: formData.vehicle_ownership,
        vehicle_capacity: formData.vehicle_capacity,
        route_type: formData.route_type,
        route_details: formData.route_details,
        shift_timing: formData.shift_timing,
        pay_type: formData.pay_type,
        drug_alcohol_test: formData.drug_alcohol_test,
        compliance_notes: formData.compliance_notes,
      };

      if (formData.license_type === 'Other' && formData.license_other) {
        submitData.license_other = formData.license_other;
      }

      if (formData.medical_certificate) {
        submitData.medical_certificate = formData.medical_certificate;
      }

      if (formData.tenant_id) {
        submitData.tenant_id = formData.tenant_id;
      }

      const response = await apiClient.registerDriver(submitData);
      
      setSuccess(true);
      
      // If token is provided, auto-login
      if (response.token) {
        // Store token and user data
        localStorage.setItem('auth_token', response.token);
        if (response.user) {
          localStorage.setItem('auth_user', JSON.stringify(response.user));
        }
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSection = () => {
    if (currentSection < totalSections) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-white">Driver Registration</CardTitle>
            <CardDescription className="text-slate-400">
              Complete your driver profile to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-6">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-white text-center">
                    Registration Successful!
                  </h3>
                  <p className="text-slate-400 text-center text-sm mt-2">
                    Your account is pending approval. You will be notified once approved.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Progress Indicator */}
                <div className="flex items-center justify-between mb-6">
                  {[1, 2, 3, 4, 5].map((section) => (
                    <div key={section} className="flex items-center flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
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

                {/* Section A: License Information */}
                {currentSection === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">License Information</h3>
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
                          value={formData.license_type}
                          onValueChange={(value) =>
                            setFormData({ ...formData, license_type: value })
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
                        onChange={handleChange}
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
                              checked={formData.vehicle_types.includes(type)}
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
                          value={formData.vehicle_ownership}
                          onValueChange={(value) =>
                            setFormData({ ...formData, vehicle_ownership: value })
                          }
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
                        <Label htmlFor="route_type" className="text-slate-200">
                          Route Type
                        </Label>
                        <Select
                          value={formData.route_type}
                          onValueChange={(value) =>
                            setFormData({ ...formData, route_type: value })
                          }
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
                        <Label htmlFor="shift_timing" className="text-slate-200">
                          Shift Timing
                        </Label>
                        <Select
                          value={formData.shift_timing}
                          onValueChange={(value) =>
                            setFormData({ ...formData, shift_timing: value })
                          }
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
                      <Label htmlFor="route_details" className="text-slate-200">
                        Route Details
                      </Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="pay_type" className="text-slate-200">
                        Pay Type
                      </Label>
                      <Select
                        value={formData.pay_type}
                        onValueChange={(value) =>
                          setFormData({ ...formData, pay_type: value })
                        }
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
                  </div>
                )}

                {/* Section E: Compliance & Account Info */}
                {currentSection === 5 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Compliance & Account Information</h3>
                    
                    {/* Account Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-200">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your full name"
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
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-slate-200">
                          Confirm Password *
                        </Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm password"
                          disabled={isLoading}
                          className="bg-slate-700 border-slate-600 text-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Compliance */}
                    <div className="space-y-2">
                      <Label htmlFor="medical_certificate" className="text-slate-200">
                        Medical Certificate
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="medical_certificate"
                          name="medical_certificate"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          disabled={isLoading}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        {formData.medical_certificate && (
                          <span className="text-sm text-slate-400">
                            {formData.medical_certificate.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Accepted formats: PDF, JPG, PNG (Max 5MB)
                      </p>
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
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3 justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevSection}
                    disabled={currentSection === 1 || isLoading}
                    className="border-slate-600 bg-transparent"
                  >
                    Previous
                  </Button>
                  {currentSection < totalSections ? (
                    <Button
                      type="button"
                      onClick={nextSection}
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
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isLoading ? 'Registering...' : 'Complete Registration'}
                    </Button>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

