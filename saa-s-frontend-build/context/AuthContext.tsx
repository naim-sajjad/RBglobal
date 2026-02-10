'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType, Tenant } from '@/lib/types';
import { apiClient } from '@/lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    const storedTenantId = localStorage.getItem('tenant_id');

    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setToken(storedToken);
      setUser(parsedUser);
      
      // Load tenants from user object
      if (parsedUser.tenants && Array.isArray(parsedUser.tenants)) {
        setTenants(parsedUser.tenants);
        
        // Set current tenant
        if (storedTenantId) {
          const tenant = parsedUser.tenants.find((t: Tenant) => t.id === storedTenantId);
          if (tenant) {
            setTenantId(storedTenantId);
            setCurrentTenant(tenant);
            apiClient.setToken(storedToken, storedTenantId);
          } else if (parsedUser.tenants.length > 0) {
            // If stored tenant not found, use first tenant
            const firstTenant = parsedUser.tenants[0];
            setTenantId(firstTenant.id);
            setCurrentTenant(firstTenant);
            localStorage.setItem('tenant_id', firstTenant.id);
            apiClient.setToken(storedToken, firstTenant.id);
          }
        } else if (parsedUser.tenants.length > 0) {
          // No stored tenant, use first one
          const firstTenant = parsedUser.tenants[0];
          setTenantId(firstTenant.id);
          setCurrentTenant(firstTenant);
          localStorage.setItem('tenant_id', firstTenant.id);
          apiClient.setToken(storedToken, firstTenant.id);
        }
      } else if (storedTenantId) {
        setTenantId(storedTenantId);
        apiClient.setToken(storedToken, storedTenantId);
      } else {
        apiClient.setToken(storedToken, null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.login(email, password);
      setToken(response.token);
      setUser(response.user);
      
      // Handle tenants array
      const userTenants = response.tenants || response.user?.tenants || [];
      setTenants(userTenants);
      
      // Set current tenant
      let selectedTenant: Tenant | null = null;
      if (response.tenant_id) {
        selectedTenant = userTenants.find((t: Tenant) => t.id === response.tenant_id) || null;
        if (selectedTenant) {
          setTenantId(response.tenant_id);
          setCurrentTenant(selectedTenant);
          localStorage.setItem('tenant_id', response.tenant_id);
          apiClient.setToken(response.token, response.tenant_id);
        }
      } else if (userTenants.length > 0 && !response.user?.is_global_admin) {
        // If no tenant_id but user has tenants, use first one
        selectedTenant = userTenants[0];
        setTenantId(selectedTenant.id);
        setCurrentTenant(selectedTenant);
        localStorage.setItem('tenant_id', selectedTenant.id);
        apiClient.setToken(response.token, selectedTenant.id);
      } else {
        // Super admin or no tenants
        setTenantId(null);
        setCurrentTenant(null);
        apiClient.setToken(response.token, null);
      }
      
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      localStorage.setItem('auth_token', response.token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (tenantName: string, adminName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await apiClient.register(tenantName, adminName, email, password);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const switchTenant = (newTenantId: string) => {
    const tenant = tenants.find(t => t.id === newTenantId);
    if (tenant && token) {
      setTenantId(newTenantId);
      setCurrentTenant(tenant);
      localStorage.setItem('tenant_id', newTenantId);
      apiClient.setToken(token, newTenantId);
      
      // Reload page to refresh tenant context and data
      // This ensures all tenant-scoped data is refreshed
      window.location.reload();
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setTenantId(null);
    setTenants([]);
    setCurrentTenant(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tenant_id');
    apiClient.logout();
  };

  const value: AuthContextType = {
    user,
    token,
    tenantId,
    tenants,
    currentTenant,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    switchTenant,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
