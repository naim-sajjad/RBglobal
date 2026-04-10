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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TableActions } from '@/components/TableActions';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, Users as UsersIcon } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Role, Permission, RoleWithDetails } from '@/lib/types';
import { toast } from 'sonner';

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleWithDetails[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithDetails | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        apiClient.getRoles(),
        apiClient.getPermissions(),
      ]);
      setRoles(rolesRes || []);
      setPermissions(permissionsRes || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (role?: RoleWithDetails) => {
    if (role) {
      setEditingRole(role);
      setFormData({ name: role.name });
      setSelectedPermissions(role.permissions.map((p) => p.id));
    } else {
      setEditingRole(null);
      setFormData({ name: '' });
      setSelectedPermissions([]);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRole(null);
    setFormData({ name: '' });
    setSelectedPermissions([]);
  };

  const handlePermissionChange = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const roleData = {
        name: formData.name,
        permissions: selectedPermissions,
      };

      if (editingRole) {
        await apiClient.updateRole(editingRole.id, roleData);
        toast.success('Role updated successfully');
      } else {
        await apiClient.createRole(roleData);
        toast.success('Role created successfully');
      }
      await fetchData();
      handleCloseDialog();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save role';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (role: RoleWithDetails) => {
    if (role.user_count && role.user_count > 0) {
      toast.error(
        `Cannot delete role. ${role.user_count} user(s) are assigned to this role.`,
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${role.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await apiClient.deleteRole(role.id);
      toast.success('Role deleted successfully');
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-white'>Roles</h1>
          <p className='text-slate-400 mt-2'>
            Manage roles and their permissions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className='bg-blue-600 hover:bg-blue-700'
            >
              <Plus className='mr-2 h-4 w-4' />
              New Role
            </Button>
          </DialogTrigger>
          <DialogContent className='bg-slate-800 border-slate-700 max-w-md'>
            <DialogHeader>
              <DialogTitle className='text-white'>
                {editingRole ? 'Edit Role' : 'Create Role'}
              </DialogTitle>
              <DialogDescription className='text-slate-400'>
                {editingRole
                  ? 'Update role information and permissions'
                  : 'Create a new role in the system'}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className='space-y-4 max-h-96 overflow-y-auto'
            >
              <div className='space-y-2'>
                <Label htmlFor='name' className='text-slate-200'>
                  Role Name
                </Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='e.g., Editor, Viewer, Admin'
                  disabled={isSaving}
                  className='text-white bg-slate-700 border-slate-600 text-white'
                  required
                />
              </div>

              <div className='space-y-3'>
                <Label className='text-slate-200'>Permissions</Label>
                <div className='border border-slate-600 rounded-lg p-3 space-y-2 bg-slate-700/50'>
                  {permissions.length === 0 ? (
                    <p className='text-slate-400 text-sm'>
                      No permissions available
                    </p>
                  ) : (
                    permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className='flex items-center gap-2'
                      >
                        <Checkbox
                          id={permission.id}
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() =>
                            handlePermissionChange(permission.id)
                          }
                          disabled={isSaving}
                          className='border-slate-500'
                        />
                        <label
                          htmlFor={permission.id}
                          className='text-slate-300 text-sm cursor-pointer flex-1'
                        >
                          {permission.name}
                          {permission.description && (
                            <span className='text-slate-400 text-xs ml-2'>
                              {permission.description}
                            </span>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
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
          <CardTitle className='text-white'>All Roles</CardTitle>
          <CardDescription>
            {roles.length} role{roles.length !== 1 ? 's' : ''} in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Spinner className='h-6 w-6 text-blue-500' />
            </div>
          ) : roles.length === 0 ? (
            <div className='text-center py-8 text-slate-400'>
              <p>No roles found. Create one to get started.</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='border-slate-700 hover:bg-transparent'>
                    <TableHead className='text-slate-300'>Name</TableHead>
                    <TableHead className='text-slate-300'>
                      Permissions
                    </TableHead>
                    <TableHead className='text-slate-300'>Users</TableHead>
                    <TableHead className='text-slate-300'>Tenant</TableHead>
                    <TableHead className='text-slate-300'>Created</TableHead>
                    <TableHead className='text-right text-slate-300'>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow
                      key={role.id}
                      className='border-slate-700 hover:bg-slate-700/50'
                    >
                      <TableCell className='text-white font-medium'>
                        {role.name}
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-wrap gap-1'>
                          {role.permissions.slice(0, 2).map((perm) => (
                            <Badge
                              key={perm.id}
                              variant='secondary'
                              className='bg-slate-600 text-xs'
                            >
                              {perm.name}
                            </Badge>
                          ))}
                          {role.permissions.length > 2 && (
                            <Badge
                              variant='secondary'
                              className='bg-slate-600 text-xs'
                            >
                              +{role.permissions.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1 text-slate-300'>
                          <UsersIcon className='h-4 w-4' />
                          <span className='text-sm'>
                            {role.user_count || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='text-slate-300 text-sm'>
                        {role.tenant_id}
                      </TableCell>
                      <TableCell className='text-slate-300 text-sm'>
                        {new Date(role.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className='text-right'>
                        <TableActions
                          onEdit={() => handleOpenDialog(role)}
                          onDelete={() => handleDelete(role)}
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
