'use client';

import React from "react"

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  fallback 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // Helper function to check if user has a specific role
  const hasRole = (user: any, roleName: string): boolean => {
    if (!user) return false;
    // Check if user has is_global_admin and role is super-admin
    if (roleName === 'super-admin' && user.is_global_admin) {
      return true;
    }
    // Check roles array
    return user.roles?.some((role: any) => role.name === roleName) || false;
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!isLoading && requiredRole && !hasRole(user, requiredRole)) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, requiredRole, user, router]);

  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && !hasRole(user, requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
