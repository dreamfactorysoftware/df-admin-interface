'use client';

import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Paywall } from '@/components/ui/paywall';
import { ServicesTable } from '@/components/database/services-table';
import { useServiceTypes } from '@/hooks/use-service-types';
import { useSnackbar } from '@/hooks/use-snackbar';

/**
 * Services Management Page Component
 * 
 * Next.js app router page component for the /adf-services/df-manage-services route.
 * Handles paywall access control based on available service types and renders
 * either the paywall component or the services table.
 * 
 * Features:
 * - Server-side rendering compatible with Next.js 15.1
 * - Paywall access control for service type availability
 * - Route data processing for service configuration
 * - Snackbar state management integration
 * - React Query-powered data fetching with intelligent caching
 */
export default function ManageServicesPage() {
  const searchParams = useSearchParams();
  const { clearSnackbar } = useSnackbar();
  
  // Extract route parameters for service filtering
  const systemParam = searchParams.get('system');
  const groupsParam = searchParams.get('groups');
  const isSystemMode = systemParam === 'true';
  const serviceGroups = groupsParam ? groupsParam.split(',') : undefined;
  
  // Fetch service types with intelligent caching via React Query
  const {
    data: serviceTypes = [],
    isLoading,
    error,
    isValidating
  } = useServiceTypes({
    groups: serviceGroups,
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes cache per performance requirements
    refetchOnWindowFocus: false
  });
  
  // Determine paywall state based on service type availability
  const showPaywall = useMemo(() => {
    // Show paywall if no service types are available (matching Angular logic)
    if (isLoading) return false; // Don't show paywall while loading
    if (error) return false; // Don't show paywall on error (let error boundary handle)
    return serviceTypes.length === 0;
  }, [serviceTypes, isLoading, error]);
  
  // Clear snackbar notifications on component mount (Angular equivalent)
  useEffect(() => {
    clearSnackbar();
  }, [clearSnackbar]);
  
  // Handle loading state during SSR transition
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading services">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="sr-only">Loading services...</span>
      </div>
    );
  }
  
  // Handle error state with proper error boundary fallback
  if (error) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center" 
        role="alert" 
        aria-label="Service loading error"
      >
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Failed to Load Services
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          There was an error loading the service configuration. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }
  
  // Main render logic with conditional paywall or services table
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page header with dynamic title based on mode */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isSystemMode ? 'System Services' : 'Manage Services'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isSystemMode 
            ? 'Configure and manage system-level database services'
            : 'Create and manage database service connections for API generation'
          }
        </p>
      </div>
      
      {/* Conditional rendering: Paywall or Services Table */}
      {showPaywall ? (
        <div className="max-w-4xl mx-auto">
          <Paywall 
            feature="database-services"
            title="Database Service Management"
            description="Create and manage database connections to generate REST APIs"
          />
        </div>
      ) : (
        <div className="max-w-full">
          <ServicesTable 
            systemMode={isSystemMode}
            serviceTypes={serviceTypes}
            isValidating={isValidating}
          />
        </div>
      )}
    </div>
  );
}