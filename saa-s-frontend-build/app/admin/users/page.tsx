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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableActions } from '@/components/TableActions';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, AlertCircle, Mail, KeyRound } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { UserWithDetails, Role, Tenant, CreateUserData, UpdateUserData } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isResettingPassword, setIsResettingPassword] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | number | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | number | null>(null);
  
  const [formData, setFormData] = useState<CreateUserData>({
    name: '',
    email: '',
    password: '',
    role_id: '',
    tenant_id: '',
    tenant_ids: [],
    status: 'active',
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    if (currentUser?.is_global_admin) {
      fetchTenants();
    }
  }, [currentPage, searchQuery]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.getUsers({
        page: currentPage,
        per_page: 10,
        search: searchQuery || undefined,
      });
      
      console.log('API Response:', response); // Debug log
      
      // Handle both paginated response and direct array response
      let usersData: UserWithDetails[] = [];
      if (Array.isArray(response)) {
        usersData = response;
        setTotalPages(1);
      } else if (response && response.data && Array.isArray(response.data)) {
        usersData = response.data;
        setTotalPages(response.last_page || 1);
      } else if (response && Array.isArray(response)) {
        usersData = response;
        setTotalPages(1);
      } else {
        console.warn('Unexpected response format:', response);
        usersData = [];
        setTotalPages(1);
      }
      
      console.log('Setting users:', usersData); // Debug log
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await apiClient.getRoles();
      setRoles(response || []);
    } catch (err: any) {
      console.error('Failed to load roles:', err);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await apiClient.getTenants();
      console.log(response);
      setTenants(response || []);
    } catch (err: any) {
      console.error('Failed to load tenants:', err);
    }
  };

  const handleOpenDialog = (user?: UserWithDetails) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role_id: user.roles?.[0]?.id?.toString() || '',
        tenant_id: user.tenant_id?.toString() || '',
        tenant_ids: user.tenants?.map(t => t.id) || [],
        status: user.status || 'active',
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role_id: '',
        tenant_id: '',
        tenant_ids: [],
        status: 'active',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role_id: '',
      tenant_id: '',
      status: 'active',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const submitData: any = {
        name: formData.name,
        email: formData.email,
        status: formData.status,
      };

      if (formData.role_id) {
        submitData.role_id = typeof formData.role_id === 'string'
          ? parseInt(formData.role_id, 10)
          : formData.role_id;
      }

      // Handle multiple tenant assignments
      if (currentUser?.is_global_admin) {
        if (formData.tenant_ids && formData.tenant_ids.length > 0) {
          submitData.tenant_ids = formData.tenant_ids;
        } else if (formData.tenant_id) {
          submitData.tenant_id = formData.tenant_id;
        }
      }

      // Only include password for new users or if explicitly provided
      if (!editingUser && formData.password) {
        submitData.password = formData.password;
      } else if (editingUser && formData.password) {
        submitData.password = formData.password;
      }

      if (editingUser) {
        await apiClient.updateUser(editingUser.id, submitData);
        toast.success('User updated successfully');
      } else {
        if (!formData.password) {
          setError('Password is required for new users');
          setIsSaving(false);
          return;
        }
        await apiClient.createUser(submitData);
        toast.success('User created successfully');
      }
      
      await fetchUsers();
      handleCloseDialog();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (user: UserWithDetails) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    setDeletingUser(user.id);
    try {
      await apiClient.deleteUser(user.id);
      toast.success('User deleted successfully');
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingUser(null);
    }
  };

  const handleToggleStatus = async (user: UserWithDetails) => {
    setTogglingStatus(user.id);
    try {
      await apiClient.updateUser(user.id, {
        status: user.status === 'active' ? 'inactive' : 'active',
      });
      toast.success(`User ${user.status === 'active' ? 'deactivated' : 'activated'} successfully`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleResetPassword = async (userId: string | number) => {
    if (!confirm('Are you sure you want to reset this user\'s password? They will receive an email with the new password.')) {
      return;
    }

    setIsResettingPassword(userId.toString());
    try {
      await apiClient.resetUserPassword(userId);
      toast.success('Password reset email sent successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  // Filter users based on search query (client-side filtering for now)
  // Note: If API supports server-side search, this can be removed
  const filteredUsers = React.useMemo(() => {
    console.log('Filtering users. Total users:', users.length, 'Search query:', searchQuery);
    
    if (!searchQuery) {
      console.log('No search query, returning all users');
      return users;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = users.filter((user) => {
      const matches = (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.roles?.some((role) => role.name?.toLowerCase().includes(query))
      );
      return matches;
    });
    
    console.log('Filtered users count:', filtered.length);
    return filtered;
  }, [users, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 mt-2">Create, view, update, and manage users</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New User
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
                placeholder="Search users by name, email, or role..."
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
          <CardTitle className="text-white">All Users</CardTitle>
          <CardDescription>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
            {searchQuery && filteredUsers.length !== users.length && ` (filtered from ${users.length} total)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6 text-blue-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No users found. Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Role</TableHead>
                    {currentUser?.is_global_admin && (
                      <TableHead className="text-slate-300">Tenant</TableHead>
                    )}
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Created</TableHead>
                    <TableHead className="text-right text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-slate-700 hover:bg-slate-700/50"
                    >
                      <TableCell className="text-white font-medium">{user.name}</TableCell>
                      <TableCell className="text-slate-300">{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.map((role) => (
                            <Badge key={role.id} variant="secondary" className="bg-blue-600">
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      {currentUser?.is_global_admin && (
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.tenants && user.tenants.length > 0 ? (
                              user.tenants.map((tenant) => (
                                <Badge key={tenant.id} variant="secondary" className="bg-blue-600 text-xs">
                                  {tenant.name || tenant.domain || tenant.id.substring(0, 8)}
                                </Badge>
                              ))
                            ) : user.is_global_admin ? (
                              <Badge variant="secondary" className="bg-purple-600 text-xs">
                                Super Admin
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-sm">No tenants</span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge
                          variant={user.status === 'active' ? 'default' : 'secondary'}
                          className={user.status === 'active' ? 'bg-green-600' : 'bg-slate-600'}
                        >
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(user.id)}
                            disabled={isResettingPassword === user.id.toString()}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            {isResettingPassword === user.id.toString() ? (
                              <Spinner className="h-4 w-4" />
                            ) : (
                              <KeyRound className="h-4 w-4" />
                            )}
                          </Button>
                          <Switch
                            checked={user.status === 'active'}
                            onCheckedChange={() => handleToggleStatus(user)}
                            disabled={togglingStatus === user.id}
                          />
                          {togglingStatus === user.id && (
                            <Spinner className="h-4 w-4 text-blue-500" />
                          )}
                          <TableActions
                            onEdit={() => handleOpenDialog(user)}
                            onDelete={() => handleDelete(user)}
                            disabled={deletingUser === user.id}
                          />
                          {deletingUser === user.id && (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-sm">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-slate-600"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-slate-600"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingUser ? 'Edit User' : 'Create New User'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingUser
                ? 'Update user information and permissions'
                : 'Create a new user account in the system'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                Password {!editingUser && '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password'}
                disabled={isSaving}
                className="bg-slate-700 border-slate-600 text-white"
                required={!editingUser}
              />
              {editingUser && (
                <p className="text-xs text-slate-400">Leave blank to keep current password</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role_id" className="text-slate-200">Role</Label>
                <Select
                  value={formData.role_id?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentUser?.is_global_admin && (
                <div className="space-y-2">
                  <Label className="text-slate-200">Tenants (Multiple Selection)</Label>
                  <div className="border border-slate-600 rounded-lg p-3 space-y-2 bg-slate-700/50 max-h-40 overflow-y-auto">
                    {tenants.length === 0 ? (
                      <p className="text-slate-400 text-sm">No tenants available</p>
                    ) : (
                      tenants.map((tenant) => {
                        const tenantId = tenant.id.toString();
                        const isSelected = formData.tenant_ids?.includes(tenantId) || false;
                        return (
                          <div key={tenant.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`tenant-${tenant.id}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const currentIds = formData.tenant_ids || [];
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    tenant_ids: [...currentIds, tenantId],
                                    tenant_id: tenantId, // Keep for backward compatibility
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    tenant_ids: currentIds.filter(id => id !== tenantId),
                                    tenant_id: currentIds.length === 1 && currentIds[0] === tenantId ? '' : formData.tenant_id,
                                  });
                                }
                              }}
                              disabled={isSaving}
                              className="border-slate-500"
                            />
                            <label
                              htmlFor={`tenant-${tenant.id}`}
                              className="text-slate-300 text-sm cursor-pointer flex-1"
                            >
                              {tenant.name || tenant.domain || tenant.id.substring(0, 8)}
                            </label>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Select one or more tenants for this user. Super admins don't belong to tenants.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-slate-200">Status</Label>
              <Select
                value={formData.status || 'active'}
                onValueChange={(value: 'active' | 'inactive') =>
                  setFormData({ ...formData, status: value })
                }
                disabled={isSaving}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                {isSaving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

