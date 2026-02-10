'use client';

import React from "react"

import { useState, useEffect } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { TableActions } from '@/components/TableActions';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, Users as UsersIcon } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Tenant, TenantWithDetails } from '@/lib/types';
import { toast } from 'sonner';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantWithDetails | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    subdomain: '',
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.getTenants();
      
      // API client returns response.data, which should be the array
      // Handle both array response and wrapped response
      let tenantsData: any[] = [];
      
      if (Array.isArray(response)) {
        tenantsData = response;
      } else if (response && Array.isArray(response.data)) {
        tenantsData = response.data;
      } else if (response && response.data) {
        tenantsData = [response.data];
      } else {
        tenantsData = [];
      }
      
      // Map API response to expected format
      const mappedTenants = tenantsData.map((tenant: any) => {
        // Get primary domain from domain field or first domain in domains array
        const primaryDomain = tenant.domain || 
          (tenant.domains && tenant.domains.length > 0 ? tenant.domains[0].domain : '');
        
        // Get subdomain (second domain in domains array if exists)
        const subdomain = tenant.domains && tenant.domains.length > 1 
          ? tenant.domains[1]?.domain || ''
          : '';
        
        // Extract name from data field if it exists, or generate from domain
        const name = tenant.data?.name || 
          tenant.name || 
          primaryDomain || 
          `Tenant ${tenant.id.substring(0, 8)}`;
        
        return {
          id: tenant.id,
          name: name,
          is_active: tenant.data?.is_active !== undefined 
            ? tenant.data.is_active 
            : (tenant.is_active !== undefined ? tenant.is_active : true),
          created_at: tenant.created_at,
          updated_at: tenant.updated_at,
          domain: primaryDomain,
          subdomain: subdomain,
          domains: tenant.domains || [],
          user_count: tenant.user_count || 0,
          admin_id: tenant.admin_id || tenant.data?.admin_id,
        };
      });
      
      setTenants(mappedTenants);
    } catch (err: any) {
      console.error('Error fetching tenants:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load tenants';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (tenant?: TenantWithDetails) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({
        name: tenant.name || '',
        domain: tenant.domain || '',
        subdomain: tenant.subdomain || '',
      });
    } else {
      setEditingTenant(null);
      setFormData({ name: '', domain: '', subdomain: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTenant(null);
    setFormData({ name: '', domain: '', subdomain: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      if (editingTenant) {
        await apiClient.updateTenant(editingTenant.id, formData);
        toast.success('Tenant updated successfully');
      } else {
        await apiClient.createTenant(formData);
        toast.success('Tenant created successfully');
      }
      await fetchTenants();
      handleCloseDialog();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save tenant';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (tenant: TenantWithDetails) => {
    try {
      await apiClient.updateTenant(tenant.id, {
        is_active: !tenant.is_active,
      });
      toast.success(`Tenant ${!tenant.is_active ? 'activated' : 'suspended'} successfully`);
      await fetchTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update tenant');
    }
  };

  const handleDelete = async (tenant: TenantWithDetails) => {
    if (tenant.user_count && tenant.user_count > 0) {
      toast.error(`Cannot delete tenant. ${tenant.user_count} user(s) are assigned to this tenant.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${tenant.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.deleteTenant(tenant.id);
      toast.success('Tenant deleted successfully');
      await fetchTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete tenant');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tenants</h1>
          <p className="text-slate-400 mt-2">Manage all tenants in the system</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingTenant ? 'Edit Tenant' : 'Create Tenant'}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingTenant
                  ? 'Update tenant information'
                  : 'Create a new tenant in the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">Tenant Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter tenant name"
                  disabled={isSaving}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="domain" className="text-slate-200">Domain (Optional)</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="example.com"
                    disabled={isSaving}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain" className="text-slate-200">Subdomain (Optional)</Label>
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                    placeholder="subdomain"
                    disabled={isSaving}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
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
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
          <CardTitle className="text-white">All Tenants</CardTitle>
          <CardDescription>
            {tenants.length} tenant{tenants.length !== 1 ? 's' : ''} in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6 text-blue-500" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No tenants found. Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Domain</TableHead>
                    <TableHead className="text-slate-300">Users</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Created</TableHead>
                    <TableHead className="text-slate-300">Active</TableHead>
                    <TableHead className="text-right text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow
                      key={tenant.id}
                      className="border-slate-700 hover:bg-slate-700/50"
                    >
                      <TableCell className="text-white font-medium">{tenant.name}</TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {tenant.domain || tenant.subdomain || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-300">
                          <UsersIcon className="h-4 w-4" />
                          <span className="text-sm">{tenant.user_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tenant.is_active ? 'default' : 'secondary'}
                          className={tenant.is_active ? 'bg-green-600' : 'bg-slate-600'}
                        >
                          {tenant.is_active ? 'Active' : 'Suspended'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={tenant.is_active}
                          onCheckedChange={() => handleToggleActive(tenant)}
                          disabled={isSaving}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <TableActions
                          onEdit={() => handleOpenDialog(tenant)}
                          onDelete={() => handleDelete(tenant)}
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
