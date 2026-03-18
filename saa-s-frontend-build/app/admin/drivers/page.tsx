'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableActions } from '@/components/TableActions';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, AlertCircle, CheckCircle2, XCircle, Upload } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Driver, DriverWithDetails, CreateDriverData, Tenant } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

export default function DriversPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [drivers, setDrivers] = useState<DriverWithDetails[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverWithDetails | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvingDriver, setApprovingDriver] = useState<string | number | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<string | number | null>(null);

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

  useEffect(() => {
    fetchDrivers();
    if (currentUser?.is_global_admin) {
      fetchTenants();
    }
  }, []);

  const fetchDrivers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.getDrivers();
      setDrivers(Array.isArray(response) ? response : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load drivers');
      toast.error('Failed to load drivers');
      setDrivers([]);
    } finally {
      setIsLoading(false);
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

  const handleOpenDialog = (driver?: DriverWithDetails) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        name: driver.user?.name || '',
        email: driver.user?.email || '',
        password: '',
        tenant_id: driver.tenant_id || '',
        license_number: driver.license_number || '',
        license_type: driver.license_type,
        license_other: driver.license_other || '',
        issuing_authority: driver.issuing_authority || '',
        license_expiry_date: driver.license_expiry_date || '',
        years_of_experience: driver.years_of_experience || 0,
        driving_history: driver.driving_history || '',
        vehicle_types: driver.vehicle_types || [],
        vehicle_ownership: driver.vehicle_ownership,
        vehicle_capacity: driver.vehicle_capacity || '',
        route_type: driver.route_type,
        route_details: driver.route_details || '',
        shift_timing: driver.shift_timing,
        pay_type: driver.pay_type,
        drug_alcohol_test: driver.drug_alcohol_test || false,
        compliance_notes: driver.compliance_notes || '',
        status: driver.status,
      });
    } else {
      setEditingDriver(null);
      setFormData({
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
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDriver(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const submitData: any = { ...formData };

      // Only include password for new drivers
      if (!editingDriver && !formData.password) {
        setError('Password is required for new drivers');
        setIsSaving(false);
        return;
      }

      if (editingDriver) {
        await apiClient.updateDriver(editingDriver.id, submitData);
        toast.success('Driver updated successfully');
      } else {
        await apiClient.createDriver(submitData);
        toast.success('Driver created successfully');
      }

      await fetchDrivers();
      handleCloseDialog();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save driver';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (driver: DriverWithDetails) => {
    if (!confirm(`Are you sure you want to delete ${driver.user?.name || 'this driver'}?`)) {
      return;
    }

    setDeletingDriver(driver.id);
    try {
      await apiClient.deleteDriver(driver.id);
      toast.success('Driver deleted successfully');
      await fetchDrivers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete driver');
    } finally {
      setDeletingDriver(null);
    }
  };

  const handleApprove = async (driver: DriverWithDetails) => {
    setApprovingDriver(driver.id);
    try {
      await apiClient.approveDriver(driver.id);
      toast.success('Driver approved successfully');
      await fetchDrivers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve driver');
    } finally {
      setApprovingDriver(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDrivers();
  };

  const filteredDrivers = React.useMemo(() => {
    if (!searchQuery) return drivers;

    const query = searchQuery.toLowerCase();
    return drivers.filter((driver) => {
      return (
        driver.user?.name?.toLowerCase().includes(query) ||
        driver.user?.email?.toLowerCase().includes(query) ||
        driver.license_number?.toLowerCase().includes(query)
      );
    });
  }, [drivers, searchQuery]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending_approval: { label: 'Pending Approval', className: 'bg-yellow-600' },
      active: { label: 'Active', className: 'bg-green-600' },
      inactive: { label: 'Inactive', className: 'bg-slate-600' },
      suspended: { label: 'Suspended', className: 'bg-red-600' },
    };

    const config = statusConfig[status] || statusConfig.pending_approval;
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Driver Management</h1>
          <p className="text-slate-400 mt-2">Create, view, update, and manage drivers</p>
        </div>
        <Button
          onClick={() => router.push('/admin/drivers/create')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Driver
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search drivers by name, email, or license number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white pl-10"
              />
            </div>
            <Button type="submit" variant="outline" className="border-slate-600">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">All Drivers</CardTitle>
          <CardDescription>
            {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6 text-blue-500" />
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No drivers found. Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">License</TableHead>
                    <TableHead className="text-slate-300">Experience</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Created</TableHead>
                    <TableHead className="text-right text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => (
                    <TableRow
                      key={driver.id}
                      className="border-slate-700 hover:bg-slate-700/50 cursor-pointer"
                      onClick={() => router.push(`/admin/drivers/view?id=${driver.id}`)}
                    >
                      <TableCell className="text-white font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/drivers/view?id=${driver.id}`);
                          }}
                          className="hover:text-blue-400 transition-colors"
                        >
                          {driver.user?.name || 'N/A'}
                        </button>
                      </TableCell>
                      <TableCell className="text-slate-300">{driver.user?.email || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-300 text-sm">
                            {driver.license_number || 'N/A'}
                          </span>
                          {driver.license_type && (
                            <Badge variant="secondary" className="bg-blue-600 text-xs w-fit">
                              {driver.license_type}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {driver.years_of_experience || 0} years
                      </TableCell>
                      <TableCell>{getStatusBadge(driver.status)}</TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {new Date(driver.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell 
                        className="text-right" 
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          {driver.status === 'pending_approval' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(driver);
                              }}
                              disabled={approvingDriver === driver.id}
                              className="text-green-400 hover:text-green-300"
                            >
                              {approvingDriver === driver.id ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <div onClick={(e) => e.stopPropagation()}>
                            <TableActions
                              onEdit={() => handleOpenDialog(driver)}
                              onDelete={() => handleDelete(driver)}
                              disabled={deletingDriver === driver.id}
                            />
                          </div>
                          {deletingDriver === driver.id && (
                            <Spinner className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Driver Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingDriver ? 'Edit Driver' : 'Create New Driver'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingDriver
                ? 'Update driver information and profile'
                : 'Create a new driver account and profile'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Basic User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  disabled={isSaving}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  disabled={isSaving}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
            </div>

            {!editingDriver && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  disabled={isSaving}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
            )}

            {currentUser?.is_global_admin && (
              <div className="space-y-2">
                <Label htmlFor="tenant_id" className="text-slate-200">Tenant</Label>
                <Select
                  value={formData.tenant_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                  disabled={isSaving}
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

            {/* License Information */}
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-semibold text-white mb-4">License Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_number" className="text-slate-200">License Number</Label>
                  <Input
                    id="license_number"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="Enter license number"
                    disabled={isSaving}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_type" className="text-slate-200">License Type</Label>
                  <Select
                    value={formData.license_type || ''}
                    onValueChange={(value) => setFormData({ ...formData, license_type: value as any })}
                    disabled={isSaving}
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
                <div className="space-y-2 mt-4">
                  <Label htmlFor="license_other" className="text-slate-200">Specify License Type</Label>
                  <Input
                    id="license_other"
                    value={formData.license_other}
                    onChange={(e) => setFormData({ ...formData, license_other: e.target.value })}
                    placeholder="Enter license type"
                    disabled={isSaving}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="issuing_authority" className="text-slate-200">Issuing Authority</Label>
                  <Input
                    id="issuing_authority"
                    value={formData.issuing_authority}
                    onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
                    placeholder="e.g., DMV, MTO"
                    disabled={isSaving}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_expiry_date" className="text-slate-200">License Expiry Date</Label>
                  <Input
                    id="license_expiry_date"
                    type="date"
                    value={formData.license_expiry_date}
                    onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })}
                    disabled={isSaving}
                    className="bg-slate-700 border-slate-600 text-white"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            {/* Driving Experience */}
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-semibold text-white mb-4">Driving Experience</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="years_of_experience" className="text-slate-200">Years of Experience</Label>
                  <Input
                    id="years_of_experience"
                    type="number"
                    min="0"
                    value={formData.years_of_experience}
                    onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
                    disabled={isSaving}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="driving_history" className="text-slate-200">Driving History</Label>
                <Textarea
                  id="driving_history"
                  value={formData.driving_history}
                  onChange={(e) => setFormData({ ...formData, driving_history: e.target.value })}
                  placeholder="Accidents, violations, endorsements..."
                  disabled={isSaving}
                  className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                />
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-semibold text-white mb-4">Vehicle Information</h3>
              <div className="space-y-2">
                <Label className="text-slate-200">Vehicle Types</Label>
                <div className="grid grid-cols-2 gap-2 border border-slate-600 rounded-lg p-3 bg-slate-700/50">
                  {vehicleTypeOptions.map((type) => (
                    <div key={type} className="flex items-center gap-2">
                      <Checkbox
                        id={`vehicle-${type}`}
                        checked={formData.vehicle_types?.includes(type) || false}
                        onCheckedChange={(checked) => {
                          const types = formData.vehicle_types || [];
                          if (checked) {
                            setFormData({ ...formData, vehicle_types: [...types, type] });
                          } else {
                            setFormData({ ...formData, vehicle_types: types.filter(t => t !== type) });
                          }
                        }}
                        disabled={isSaving}
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
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_ownership" className="text-slate-200">Vehicle Ownership</Label>
                  <Select
                    value={formData.vehicle_ownership || ''}
                    onValueChange={(value) => setFormData({ ...formData, vehicle_ownership: value as any })}
                    disabled={isSaving}
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
                  <Label htmlFor="vehicle_capacity" className="text-slate-200">Vehicle Capacity</Label>
                  <Input
                    id="vehicle_capacity"
                    value={formData.vehicle_capacity}
                    onChange={(e) => setFormData({ ...formData, vehicle_capacity: e.target.value })}
                    placeholder="e.g., 10,000 lbs"
                    disabled={isSaving}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Route & Shift Details */}
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-semibold text-white mb-4">Route & Shift Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="route_type" className="text-slate-200">Route Type</Label>
                  <Select
                    value={formData.route_type || ''}
                    onValueChange={(value) => setFormData({ ...formData, route_type: value as any })}
                    disabled={isSaving}
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
                    disabled={isSaving}
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
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="pay_type" className="text-slate-200">Pay Type</Label>
                  <Select
                    value={formData.pay_type || ''}
                    onValueChange={(value) => setFormData({ ...formData, pay_type: value as any })}
                    disabled={isSaving}
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
              <div className="space-y-2 mt-4">
                <Label htmlFor="route_details" className="text-slate-200">Route Details</Label>
                <Textarea
                  id="route_details"
                  value={formData.route_details}
                  onChange={(e) => setFormData({ ...formData, route_details: e.target.value })}
                  placeholder="Preferred routes, regions, cities..."
                  disabled={isSaving}
                  className="bg-slate-700 border-slate-600 text-white min-h-[80px]"
                />
              </div>
            </div>

            {/* Compliance Requirements */}
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-semibold text-white mb-4">Compliance Requirements</h3>
              <div className="space-y-2">
                <Label htmlFor="medical_certificate" className="text-slate-200">Medical Certificate</Label>
                <Input
                  id="medical_certificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFormData({ ...formData, medical_certificate: e.target.files[0] });
                    }
                  }}
                  disabled={isSaving}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Checkbox
                  id="drug_alcohol_test"
                  checked={formData.drug_alcohol_test}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, drug_alcohol_test: checked as boolean })
                  }
                  disabled={isSaving}
                  className="border-slate-500"
                />
                <Label htmlFor="drug_alcohol_test" className="text-slate-200 cursor-pointer">
                  Drug & Alcohol Test Completed
                </Label>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="compliance_notes" className="text-slate-200">Compliance Notes</Label>
                <Textarea
                  id="compliance_notes"
                  value={formData.compliance_notes}
                  onChange={(e) => setFormData({ ...formData, compliance_notes: e.target.value })}
                  placeholder="Additional compliance information..."
                  disabled={isSaving}
                  className="bg-slate-700 border-slate-600 text-white min-h-[80px]"
                />
              </div>
            </div>

            {/* Status (Admin only) */}
            {editingDriver && (
              <div className="border-t border-slate-700 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-slate-200">Status</Label>
                  <Select
                    value={formData.status || 'pending_approval'}
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
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
            )}

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSaving}
                className="border-slate-600 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? 'Saving...' : editingDriver ? 'Update Driver' : 'Create Driver'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

