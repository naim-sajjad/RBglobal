'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export function TenantSwitcher() {
  const { tenants, currentTenant, switchTenant, user } = useAuth();
  const [isChanging, setIsChanging] = useState(false);

  // Don't show switcher for super admins or users with no tenants
  if (user?.is_global_admin || !tenants || tenants.length === 0) {
    return null;
  }

  // If only one tenant, show it but don't make it switchable
  if (tenants.length === 1) {
    const tenant = tenants[0];
    const tenantName = tenant.name || tenant.domain || tenant.id.substring(0, 8);
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
        <Building2 className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-300">{tenantName}</span>
      </div>
    );
  }

  const handleTenantChange = (newTenantId: string) => {
    if (newTenantId === currentTenant?.id) return;
    
    setIsChanging(true);
    try {
      switchTenant(newTenantId);
    } catch (error) {
      console.error('Failed to switch tenant:', error);
      setIsChanging(false);
    }
  };

  const getTenantName = (tenant: any) => {
    return tenant.name || tenant.domain || tenant.data?.name || tenant.id.substring(0, 8);
  };

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-slate-400" />
      <Select
        value={currentTenant?.id || ''}
        onValueChange={handleTenantChange}
        disabled={isChanging}
      >
        <SelectTrigger className="w-[200px] bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder="Select tenant">
            {currentTenant ? getTenantName(currentTenant) : 'Select Tenant'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {tenants.map((tenant) => (
            <SelectItem
              key={tenant.id}
              value={tenant.id}
              className="text-white hover:bg-slate-700 focus:bg-slate-700"
            >
              {getTenantName(tenant)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isChanging && (
        <span className="text-xs text-slate-400">Switching...</span>
      )}
    </div>
  );
}

