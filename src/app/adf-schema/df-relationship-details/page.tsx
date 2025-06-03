/**
 * Database Relationship Details Page - Next.js 15.1+ Server Component
 * 
 * Main page component for database relationship management implementing the app router
 * convention for /adf-schema/df-relationship-details route. Provides comprehensive
 * interface for creating and editing table relationships with server-side rendering
 * capabilities and React Query integration for optimal data fetching performance.
 * 
 * Migration Notes:
 * - Converted from Angular route component to Next.js page component per Section 0.2.1
 * - Replaced Angular routing with Next.js app router file-based routing per Section 4.7.1.1
 * - Implemented React 19 server component with TanStack React Query per Section 3.2.2
 * - Converted Angular Material UI to Tailwind CSS with Headless UI per React/Next.js Integration Requirements
 * - Integrated Next.js middleware for authentication per Section 3.2.7
 * 
 * Performance Requirements:
 * - SSR pages under 2 seconds per React/Next.js Integration Requirements
 * - Real-time validation under 100ms for form interactions
 * - Cache hit responses under 50ms for data fetching
 * - Middleware processing under 100ms for authentication
 * 
 * Features:
 * - Next.js server components for initial page loads with enhanced performance
 * - TanStack React Query 5.79.2 for intelligent caching and synchronization
 * - React Hook Form 7.57.0 with Zod schema validation for type-safe forms
 * - Dynamic routing support for both create and edit modes
 * - Comprehensive error handling with React Error Boundaries
 * - WCAG 2.1 AA compliance through accessible components
 * - Responsive design with Tailwind CSS utility classes
 * - Progressive enhancement with client-side interactions
 */

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  HydrationBoundary, 
  QueryClient, 
  dehydrate 
} from '@tanstack/react-query';

// Core components and UI elements
import { RelationshipForm } from './relationship-form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Custom hooks for data fetching and state management
import { 
  useRelationshipData,
  type RelationshipDataParams 
} from '@/hooks/use-relationship-data';

// API client and utilities
import { apiClient } from '@/lib/api-client';

// Type definitions for enhanced type safety
import type { 
  RelationshipFormData,
  ServiceOption,
  FieldOption,
  TableOption 
} from '@/types/database';
import type { ApiResponse } from '@/types/api';

// ============================================================================
// PAGE COMPONENT TYPES AND INTERFACES
// ============================================================================

interface RelationshipDetailsPageProps {
  /** URL search parameters for page configuration */
  searchParams: {
    /** Service ID for relationship context */
    serviceId?: string;
    /** Table name for relationship context */
    table?: string;
    /** Field name for relationship context */
    field?: string;
    /** Relationship ID for edit mode */
    relationshipId?: string;
    /** Operation mode - create or edit */
    mode?: 'create' | 'edit';
  };
}

interface RelationshipPageData {
  /** Available database fields for local field selection */
  fieldOptions: FieldOption[];
  /** Available services for reference and junction selection */
  serviceOptions: ServiceOption[];
  /** Current relationship data for edit mode */
  relationshipData?: RelationshipFormData;
  /** Initial reference table options based on service selection */
  referenceTableOptions: TableOption[];
  /** Initial reference field options based on table selection */
  referenceFieldOptions: FieldOption[];
  /** Initial junction table options for many-to-many relationships */
  junctionTableOptions: TableOption[];
  /** Initial junction field options based on junction table selection */
  junctionFieldOptions: FieldOption[];
}

// ============================================================================
// METADATA GENERATION FOR SEO AND PERFORMANCE
// ============================================================================

/**
 * Generates dynamic metadata for the relationship details page
 * Provides SEO optimization and enhanced page loading performance
 */
export async function generateMetadata({
  searchParams,
}: RelationshipDetailsPageProps): Promise<Metadata> {
  const mode = searchParams.mode || 'create';
  const relationshipId = searchParams.relationshipId;
  
  const title = mode === 'create' 
    ? 'Create Database Relationship - DreamFactory Admin'
    : `Edit Relationship ${relationshipId} - DreamFactory Admin`;
    
  const description = mode === 'create'
    ? 'Create new database table relationships for automated API generation. Configure belongs-to, has-many, has-one, and many-to-many relationships with comprehensive validation.'
    : `Edit database relationship configuration with real-time validation. Modify relationship types, reference tables, and junction table settings for optimized API generation.`;

  return {
    title,
    description,
    keywords: [
      'database relationship',
      'table relationships', 
      'API generation',
      'DreamFactory',
      'schema management',
      'foreign keys',
      'junction tables'
    ],
    openGraph: {
      title,
      description,
      type: 'website',
    },
    robots: {
      index: false, // Admin interface - no indexing
      follow: false,
    },
  };
}

// ============================================================================
// SERVER-SIDE DATA FETCHING FOR INITIAL RENDER
// ============================================================================

/**
 * Fetches initial data required for the relationship management page
 * Implements server-side data loading for enhanced performance and SEO
 * 
 * @param params - Page parameters including service and relationship context
 * @returns Promise resolving to required page data
 */
async function fetchRelationshipPageData(
  params: RelationshipDataParams
): Promise<RelationshipPageData> {
  const { serviceId, table, relationshipId, mode } = params;

  try {
    // Initialize parallel data fetching for optimal performance
    const fetchPromises: Promise<any>[] = [
      // Fetch available services for relationship configuration
      apiClient.get<ApiResponse<ServiceOption[]>>('/api/v2/system/service?fields=id,name,type&filter=type IN (mysql,postgresql,mongodb,oracle,snowflake)'),
    ];

    // Fetch field options if service and table are specified
    if (serviceId && table) {
      fetchPromises.push(
        apiClient.get<ApiResponse<FieldOption[]>>(`/api/v2/${serviceId}/_schema/${table}?fields=name,type,label`)
      );
    }

    // Fetch existing relationship data for edit mode
    if (mode === 'edit' && relationshipId && serviceId && table) {
      fetchPromises.push(
        apiClient.get<ApiResponse<RelationshipFormData>>(`/api/v2/${serviceId}/_schema/${table}/_related/${relationshipId}`)
      );
    }

    // Execute parallel data fetching
    const results = await Promise.allSettled(fetchPromises);

    // Process service options
    const serviceOptions: ServiceOption[] = results[0].status === 'fulfilled'
      ? results[0].value.data.resource || []
      : [];

    // Process field options
    const fieldOptions: FieldOption[] = (serviceId && table && results[1]?.status === 'fulfilled')
      ? results[1].value.data.resource?.map((field: any) => ({
          value: field.name,
          label: field.label || field.name,
          type: field.type
        })) || []
      : [];

    // Process relationship data for edit mode
    const relationshipData: RelationshipFormData | undefined = 
      (mode === 'edit' && results[2]?.status === 'fulfilled')
        ? results[2].value.data.resource
        : undefined;

    return {
      fieldOptions,
      serviceOptions,
      relationshipData,
      referenceTableOptions: [], // Will be loaded dynamically
      referenceFieldOptions: [], // Will be loaded dynamically  
      junctionTableOptions: [], // Will be loaded dynamically
      junctionFieldOptions: [], // Will be loaded dynamically
    };

  } catch (error) {
    console.error('Failed to fetch relationship page data:', error);
    
    // Return empty data structure to allow component to handle loading states
    return {
      fieldOptions: [],
      serviceOptions: [],
      referenceTableOptions: [],
      referenceFieldOptions: [],
      junctionTableOptions: [],
      junctionFieldOptions: [],
    };
  }
}

// ============================================================================
// CLIENT-SIDE RELATIONSHIP MANAGEMENT COMPONENT
// ============================================================================

/**
 * Client-side component for relationship management with React Query integration
 * Handles form interactions, data fetching, and state management
 */
function RelationshipDetailsClient({
  searchParams,
  initialData,
}: {
  searchParams: RelationshipDetailsPageProps['searchParams'];
  initialData: RelationshipPageData;
}) {
  const mode = searchParams.mode || 'create';
  const serviceId = searchParams.serviceId ? parseInt(searchParams.serviceId, 10) : undefined;
  const table = searchParams.table;
  const relationshipId = searchParams.relationshipId;

  // Validate required parameters for proper page operation
  if (!serviceId || !table) {
    console.error('Missing required parameters: serviceId and table are required');
    notFound();
  }

  // Initialize React Query data fetching with enhanced caching
  const {
    fieldOptions,
    serviceOptions,
    referenceTableOptions,
    referenceFieldOptions,
    junctionTableOptions,
    junctionFieldOptions,
    relationshipData,
    isLoading,
    error,
    handleReferenceServiceChange,
    handleReferenceTableChange,
    handleJunctionServiceChange,
    handleJunctionTableChange,
    saveRelationship,
    deleteRelationship,
  } = useRelationshipData({
    serviceId,
    table,
    relationshipId,
    mode,
    initialData,
  });

  /**
   * Handles form submission with comprehensive error handling
   * Implements optimistic updates for enhanced user experience
   */
  const handleFormSubmit = async (formData: RelationshipFormData): Promise<void> => {
    try {
      await saveRelationship(formData);
      
      // Success notification will be handled by the hook
      // Navigation will be handled by the successful mutation
    } catch (error) {
      console.error('Failed to save relationship:', error);
      
      // Error notification will be handled by the hook
      // Allow user to retry or modify the form
    }
  };

  /**
   * Handles cancellation with navigation back to schema management
   */
  const handleCancel = (): void => {
    // Navigate back to schema management for the current service and table
    window.history.back();
  };

  // Handle loading states with accessible loading indicators
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg text-gray-600">
            Loading relationship configuration...
          </p>
        </div>
      </div>
    );
  }

  // Handle error states with actionable feedback
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Failed to Load Relationship Data
            </h2>
            <p className="text-red-600 mb-4">
              {error.message || 'An unexpected error occurred while loading the relationship configuration.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the main relationship form with comprehensive functionality
  return (
    <RelationshipForm
      mode={mode}
      initialData={relationshipData}
      fieldOptions={fieldOptions}
      serviceOptions={serviceOptions}
      referenceTableOptions={referenceTableOptions}
      referenceFieldOptions={referenceFieldOptions}
      junctionTableOptions={junctionTableOptions}
      junctionFieldOptions={junctionFieldOptions}
      isLoading={isLoading}
      onSubmit={handleFormSubmit}
      onCancel={handleCancel}
      onReferenceServiceChange={handleReferenceServiceChange}
      onReferenceTableChange={handleReferenceTableChange}
      onJunctionServiceChange={handleJunctionServiceChange}
      onJunctionTableChange={handleJunctionTableChange}
    />
  );
}

// ============================================================================
// MAIN PAGE COMPONENT WITH SSR CAPABILITIES
// ============================================================================

/**
 * Main Next.js page component for database relationship details management
 * Implements server-side rendering with React Query hydration for optimal performance
 * 
 * Key Features:
 * - Server-side data prefetching for enhanced initial load performance
 * - React Query cache hydration for seamless client-side interactions
 * - Comprehensive error handling with fallback UI components
 * - Progressive enhancement with suspense boundaries
 * - WCAG 2.1 AA accessibility compliance
 * - Responsive design optimized for all screen sizes
 */
export default async function RelationshipDetailsPage({
  searchParams,
}: RelationshipDetailsPageProps) {
  // Extract and validate page parameters
  const mode = searchParams.mode || 'create';
  const serviceId = searchParams.serviceId ? parseInt(searchParams.serviceId, 10) : undefined;
  const table = searchParams.table;
  const relationshipId = searchParams.relationshipId;

  // Validate required parameters for proper page operation
  if (!serviceId || !table) {
    console.error('Missing required parameters for relationship management:', {
      serviceId,
      table,
      providedParams: searchParams
    });
    notFound();
  }

  // Initialize React Query client for server-side data prefetching
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes - per Section 3.2.2 state management
        gcTime: 10 * 60 * 1000, // 10 minutes cache time
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
      },
    },
  });

  // Prefetch initial data on the server for enhanced performance
  let initialData: RelationshipPageData;
  
  try {
    initialData = await fetchRelationshipPageData({
      serviceId,
      table,
      relationshipId,
      mode,
    });

    // Prefetch relationship data in React Query cache
    await queryClient.prefetchQuery({
      queryKey: ['relationship-data', serviceId, table, relationshipId, mode],
      queryFn: () => Promise.resolve(initialData),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

  } catch (error) {
    console.error('Server-side data prefetching failed:', error);
    
    // Provide fallback data structure to ensure page can still render
    initialData = {
      fieldOptions: [],
      serviceOptions: [],
      referenceTableOptions: [],
      referenceFieldOptions: [],
      junctionTableOptions: [],
      junctionFieldOptions: [],
    };
  }

  // Render the page with comprehensive error handling and accessibility features
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md mx-auto text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h1 className="text-lg font-semibold text-red-800 mb-2">
                  Application Error
                </h1>
                <p className="text-red-600 mb-4">
                  An unexpected error occurred while loading the relationship management interface.
                  Please try refreshing the page or contact support if the problem persists.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-lg text-gray-600">
                  Preparing relationship management interface...
                </p>
              </div>
            </div>
          }
        >
          <RelationshipDetailsClient
            searchParams={searchParams}
            initialData={initialData}
          />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}

// ============================================================================
// EXPORT TYPES FOR EXTERNAL USE
// ============================================================================

export type { RelationshipDetailsPageProps, RelationshipPageData };