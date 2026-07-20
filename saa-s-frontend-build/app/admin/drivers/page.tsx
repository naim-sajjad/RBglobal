'use client';

import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { TableActions } from '@/components/TableActions';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import {
  DriverWithDetails,
  CreateDriverData,
  Tenant,
} from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function DriversPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [drivers, setDrivers] = useState<DriverWithDetails[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'created_at'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverWithDetails | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [isUploadingDrivers, setIsUploadingDrivers] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [approvingDriver, setApprovingDriver] = useState<
    string | number | null
  >(null);
  const [deletingDriver, setDeletingDriver] = useState<string | number | null>(
    null,
  );
  const [updatingReferenceCheckFor, setUpdatingReferenceCheckFor] = useState<
    string | number | null
  >(null);

  const [formData, setFormData] = useState<CreateDriverData>({
    name: '',
    email: '',
    password: '',
    tenant_id: '',
  });

  useEffect(() => {
    if (currentUser?.is_global_admin) fetchTenants();
  }, [currentUser?.is_global_admin]);

  const fetchDrivers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.getDrivers({
        sort_by: sortBy,
        sort_dir: sortDir,
      });
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
      });
    } else {
      setEditingDriver(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        tenant_id: '',
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
      const errorMessage =
        err.response?.data?.message || 'Failed to save driver';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (driver: DriverWithDetails) => {
    if (
      !confirm(
        `Are you sure you want to delete ${driver.user?.name || 'this driver'}?`,
      )
    ) {
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

  const handleReferenceCheckChange = async (
    driver: DriverWithDetails,
    status: 'pending' | 'completed',
  ) => {
    setUpdatingReferenceCheckFor(driver.id);
    try {
      await apiClient.updateDriver(driver.id, {
        reference_check_status: status,
      });
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === driver.id ? { ...d, reference_check_status: status } : d,
        ),
      );
      toast.success(
        status === 'completed'
          ? 'Reference check marked complete'
          : 'Reference check marked pending',
      );
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          'Failed to update reference check status',
      );
      await fetchDrivers();
    } finally {
      setUpdatingReferenceCheckFor(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDrivers();
  };

  const handleUploadFileSelect = (file?: File | null) => {
    if (!file) return;

    const allowedExtensions = ['csv', 'xlsx'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
      toast.error('Please upload a CSV or XLSX driver sheet');
      return;
    }

    setUploadFile(file);
    setUploadErrors([]);
  };

  const handleUploadDrivers = async () => {
    if (!uploadFile) {
      toast.error('Select a driver sheet first');
      return;
    }

    setIsUploadingDrivers(true);
    setUploadErrors([]);

    try {
      const result = await apiClient.importDrivers(uploadFile);
      toast.success(result.message || 'Driver sheet uploaded successfully');
      setUploadErrors(Array.isArray(result.errors) ? result.errors : []);
      setUploadFile(null);
      setIsUploadDialogOpen(false);
      await fetchDrivers();
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to upload driver sheet';
      const errors = err.response?.data?.errors;
      setUploadErrors(
        Array.isArray(errors)
          ? errors
          : Object.values(errors || {}).flat().map(String),
      );
      toast.error(message);
    } finally {
      setIsUploadingDrivers(false);
    }
  };

  const toggleCreatedSort = () => {
    setSortBy('created_at');
    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  useEffect(() => {
    fetchDrivers();
  }, [sortBy, sortDir]);

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
      pending_approval: {
        label: 'Pending Approval',
        className: 'bg-yellow-600',
      },
      active: { label: 'Active', className: 'bg-green-600' },
      inactive: { label: 'Inactive', className: 'bg-slate-600' },
      suspended: { label: 'Suspended', className: 'bg-red-600' },
    };

    const config = statusConfig[status] || statusConfig.pending_approval;
    return (
      <Badge variant='secondary' className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-white'>Driver Management</h1>
          <p className='text-slate-400 mt-2'>
            Create, view, update, and manage drivers
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            onClick={() => router.push('/admin/drivers/create')}
            className='bg-blue-600 hover:bg-blue-700'
          >
            <Plus className='mr-2 h-4 w-4' />
            Add Driver
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() => setIsUploadDialogOpen(true)}
            className='border-slate-600'
          >
            <Upload className='mr-2 h-4 w-4' />
            Upload Driver
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className='bg-slate-800 border-slate-700'>
        <CardContent className='pt-6'>
          <form onSubmit={handleSearch} className='flex gap-2'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
              <Input
                type='text'
                placeholder='Search drivers by name, email, or license number...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='text-white bg-slate-700 border-slate-600 pl-10'
              />
            </div>
            <Button
              type='submit'
              variant='outline'
              className='border-slate-600'
            >
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table Card */}
      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader>
          <CardTitle className='text-white'>All Drivers</CardTitle>
          <CardDescription>
            {filteredDrivers.length} driver
            {filteredDrivers.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Spinner className='h-6 w-6 text-blue-500' />
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className='text-center py-8 text-slate-400'>
              <p>No drivers found. Create one to get started.</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='border-slate-700 hover:bg-transparent'>
                    <TableHead className='text-slate-300'>Name</TableHead>
                    <TableHead className='text-slate-300'>Email</TableHead>
                    <TableHead className='text-slate-300'>
                      <button
                        type='button'
                        onClick={toggleCreatedSort}
                        className='inline-flex items-center gap-2 hover:text-white transition-colors'
                        aria-label={`Sort by created date ${
                          sortDir === 'asc' ? 'descending' : 'ascending'
                        }`}
                      >
                        Created
                        <span className='text-slate-400 text-xs'>
                          {sortDir === 'asc' ? '↑' : '↓'}
                        </span>
                      </button>
                    </TableHead>
                    <TableHead className='text-slate-300 w-[150px]'>
                      Ref. check
                    </TableHead>
                    <TableHead className='text-right text-slate-300'>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => (
                    <TableRow
                      key={driver.id}
                      className='border-slate-700 hover:bg-slate-700/50 cursor-pointer'
                      onClick={() =>
                        router.push(`/admin/drivers/view?id=${driver.id}`)
                      }
                    >
                      <TableCell className='text-white font-medium'>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/drivers/view?id=${driver.id}`);
                          }}
                          className='hover:text-blue-400 transition-colors'
                        >
                          {driver.user?.name || 'N/A'}
                        </button>
                      </TableCell>
                      <TableCell className='text-slate-300'>
                        {driver.user?.email || 'N/A'}
                      </TableCell>
                      <TableCell className='text-slate-300 text-sm'>
                        {new Date(driver.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell
                        className='text-slate-300'
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <div className='flex items-center gap-2'>
                          {updatingReferenceCheckFor === driver.id ? (
                            <Spinner
                              className='h-5 w-5 shrink-0 text-blue-400'
                              aria-label='Updating reference check'
                            />
                          ) : null}
                          <Select
                            disabled={
                              updatingReferenceCheckFor === driver.id
                            }
                            value={
                              driver.reference_check_status === 'completed'
                                ? 'completed'
                                : 'pending'
                            }
                            onValueChange={(v) =>
                              handleReferenceCheckChange(
                                driver,
                                v as 'pending' | 'completed',
                              )
                            }
                          >
                            <SelectTrigger className='h-8 w-[130px] bg-slate-700 border-slate-600 text-white text-xs'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className='bg-slate-800 border-slate-700'>
                              <SelectItem value='pending'>Pending</SelectItem>
                              <SelectItem value='completed'>
                                Completed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell
                        className='text-right'
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <div className='flex items-center justify-end gap-2'>
                          <div onClick={(e) => e.stopPropagation()}>
                            <TableActions
                              onEdit={() => handleOpenDialog(driver)}
                              onDelete={() => handleDelete(driver)}
                              disabled={deletingDriver === driver.id}
                            />
                          </div>
                          {deletingDriver === driver.id && (
                            <Spinner className='h-4 w-4 text-red-500' />
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
        <DialogContent className='bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-white'>
              {editingDriver ? 'Edit Driver' : 'Create New Driver'}
            </DialogTitle>
            <DialogDescription className='text-slate-400'>
              {editingDriver
                ? 'Update driver information and profile'
                : 'Create a new driver account and profile'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Basic User Info */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='name' className='text-slate-200'>
                  Name *
                </Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='Enter full name'
                  disabled={isSaving}
                  className='text-white bg-slate-700 border-slate-600'
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email' className='text-slate-200'>
                  Email *
                </Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder='Enter email address'
                  disabled={isSaving}
                  className='text-white bg-slate-700 border-slate-600'
                  required
                />
              </div>
            </div>

            {!editingDriver && (
              <div className='space-y-2'>
                <Label htmlFor='password' className='text-slate-200'>
                  Password *
                </Label>
                <Input
                  id='password'
                  type='password'
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder='Enter password'
                  disabled={isSaving}
                  className='text-white bg-slate-700 border-slate-600'
                  required
                />
              </div>
            )}

            {currentUser?.is_global_admin && (
              <div className='space-y-2'>
                <Label htmlFor='tenant_id' className='text-slate-200'>
                  Tenant
                </Label>
                <Select
                  value={formData.tenant_id || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tenant_id: value })
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger className='text-white bg-slate-700 border-slate-600'>
                    <SelectValue placeholder='Select tenant' />
                  </SelectTrigger>
                  <SelectContent className='text-white bg-slate-700 border-slate-600'>
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
            )}

            <div className='flex gap-3 justify-end pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={handleCloseDialog}
                disabled={isSaving}
                className='border-slate-600 bg-transparent'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isSaving}
                className='bg-blue-600 hover:bg-blue-700'
              >
                {isSaving
                  ? 'Saving...'
                  : editingDriver
                    ? 'Update Driver'
                    : 'Create Driver'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Driver Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className='bg-slate-800 border-slate-700 max-w-xl'>
          <DialogHeader>
            <DialogTitle className='text-white'>Upload Driver</DialogTitle>
            <DialogDescription className='text-slate-400'>
              Upload a CSV or Excel sheet with driver rows.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <label
              htmlFor='driver-sheet-upload'
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingUpload(true);
              }}
              onDragLeave={() => setIsDraggingUpload(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingUpload(false);
                handleUploadFileSelect(e.dataTransfer.files?.[0]);
              }}
              className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-6 py-8 text-center transition-colors ${
                isDraggingUpload
                  ? 'border-blue-400 bg-blue-500/10'
                  : 'border-slate-600 bg-slate-900/40 hover:bg-slate-700/40'
              }`}
            >
              <FileSpreadsheet className='mb-3 h-10 w-10 text-slate-300' />
              <span className='text-sm font-medium text-white'>
                {uploadFile ? uploadFile.name : 'Drop driver sheet here'}
              </span>
              <span className='mt-1 text-xs text-slate-400'>
                CSV or XLSX files are supported
              </span>
              <Input
                id='driver-sheet-upload'
                type='file'
                accept='.csv,.xlsx'
                className='sr-only'
                disabled={isUploadingDrivers}
                onChange={(e) => handleUploadFileSelect(e.target.files?.[0])}
              />
            </label>

            <div className='rounded-md border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-300'>
              Required columns: name, email. Optional columns include
              license_number, license_type, issuing_authority,
              license_issue_date, license_expiry_date, status, vehicle_types.
            </div>

            {uploadErrors.length > 0 && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  <div className='space-y-1'>
                    {uploadErrors.slice(0, 5).map((uploadError, index) => (
                      <p key={`${uploadError}-${index}`}>{uploadError}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsUploadDialogOpen(false)}
                disabled={isUploadingDrivers}
                className='border-slate-600 bg-transparent'
              >
                Cancel
              </Button>
              <Button
                type='button'
                onClick={handleUploadDrivers}
                disabled={!uploadFile || isUploadingDrivers}
                className='bg-blue-600 hover:bg-blue-700'
              >
                {isUploadingDrivers ? 'Uploading...' : 'Upload Driver'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
