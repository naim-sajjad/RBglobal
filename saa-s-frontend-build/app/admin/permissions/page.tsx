'use client';

import React from 'react';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { TableActions } from '@/components/TableActions';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Permission } from '@/lib/types';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.getPermissions();
      setPermissions(response || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (permission?: Permission) => {
    if (permission) {
      setEditingPermission(permission);
      setFormData({
        name: permission.name,
        slug: permission.slug,
        description: permission.description || '',
      });
    } else {
      setEditingPermission(null);
      setFormData({ name: '', slug: '', description: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPermission(null);
    setFormData({ name: '', slug: '', description: '' });
  };

  const handleSlugGeneration = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      if (editingPermission) {
        await apiClient.updatePermission(editingPermission.id, formData);
      } else {
        await apiClient.createPermission(formData);
      }
      await fetchPermissions();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save permission');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (permission: Permission) => {
    if (
      !confirm(
        `Are you sure you want to delete "${permission.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await apiClient.deletePermission(permission.id);
      await fetchPermissions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete permission');
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-white'>Permissions</h1>
          <p className='text-slate-400 mt-2'>
            Define system permissions and assign them to roles
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className='bg-blue-600 hover:bg-blue-700'
            >
              <Plus className='mr-2 h-4 w-4' />
              New Permission
            </Button>
          </DialogTrigger>
          <DialogContent className='bg-slate-800 border-slate-700'>
            <DialogHeader>
              <DialogTitle className='text-white'>
                {editingPermission ? 'Edit Permission' : 'Create Permission'}
              </DialogTitle>
              <DialogDescription className='text-slate-400'>
                {editingPermission
                  ? 'Update permission information'
                  : 'Create a new permission in the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name' className='text-slate-200'>
                  Permission Name
                </Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    //handleSlugGeneration(e.target.value);
                  }}
                  placeholder='e.g., View Reports'
                  disabled={isSaving}
                  className='text-white bg-slate-700 border-slate-600 text-white'
                  required
                />
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="slug" className="text-slate-200">Permission Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="view-reports"
                  disabled={isSaving}
                  className="text-white bg-slate-700 border-slate-600 text-white text-sm"
                  required
                />
                <p className="text-xs text-slate-400">Used internally to identify permissions</p>
              </div> */}

              <div className='space-y-2'>
                <Label htmlFor='description' className='text-slate-200'>
                  Description
                </Label>
                <Textarea
                  id='description'
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder='What does this permission allow?'
                  disabled={isSaving}
                  className='text-white bg-slate-700 border-slate-600 text-white text-sm'
                  rows={3}
                />
              </div>

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
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
          <CardTitle className='text-white'>All Permissions</CardTitle>
          <CardDescription>
            {permissions.length} permission{permissions.length !== 1 ? 's' : ''}{' '}
            defined
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Spinner className='h-6 w-6 text-blue-500' />
            </div>
          ) : permissions.length === 0 ? (
            <div className='text-center py-8 text-slate-400'>
              <p>No permissions found. Create one to get started.</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='border-slate-700 hover:bg-transparent'>
                    <TableHead className='text-slate-300'>Name</TableHead>
                    <TableHead className='text-slate-300'>Slug</TableHead>
                    <TableHead className='text-slate-300'>
                      Description
                    </TableHead>
                    <TableHead className='text-right text-slate-300'>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow
                      key={permission.id}
                      className='border-slate-700 hover:bg-slate-700/50'
                    >
                      <TableCell className='text-white font-medium'>
                        {permission.name}
                      </TableCell>
                      <TableCell className='text-slate-300 font-mono text-sm'>
                        {permission.slug}
                      </TableCell>
                      <TableCell className='text-slate-400 text-sm max-w-xs truncate'>
                        {permission.description || '-'}
                      </TableCell>
                      <TableCell className='text-right'>
                        <TableActions
                          onEdit={() => handleOpenDialog(permission)}
                          onDelete={() => handleDelete(permission)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
