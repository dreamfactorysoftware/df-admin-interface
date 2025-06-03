/**
 * Database Field Details Page - Dynamic Route Component
 * 
 * Next.js 15.1+ dynamic route page component for individual field editing and management.
 * Implements comprehensive React Hook Form with Zod validation for all field attributes 
 * including type selection, constraints, relationships, validation rules, and function usage.
 * Supports both create and edit modes through dynamic routing parameters with server-side 
 * rendering optimization.
 * 
 * Key Features:
 * - React Hook Form with Zod schema validators per React/Next.js Integration Requirements
 * - Real-time validation under 100ms per React/Next.js Integration Requirements
 * - Tailwind CSS 4.1+ with consistent theme injection per React/Next.js Integration Requirements
 * - WCAG 2.1 AA compliance through Headless UI integration per Section 7.1 accessibility requirements
 * - Next.js app router pages with server-side rendering and metadata configuration per Section 7.5.1
 * - Dynamic control enabling/disabling based on field type selection per existing Angular functionality
 * - Comprehensive error handling and loading states
 * - Integration with React Query for intelligent caching and data synchronization
 * 
 * Route Structure:
 * - `/adf-schema/fields/new` - Create new field mode
 * - `/adf-schema/fields/[fieldId]` - Edit existing field mode
 * 
 * Search Parameters:
 * - `service` - Database service name (required)
 * - `table` - Table name (required)
 * - `database` - Database name (optional)
 * 
 * @fileoverview Field details page component for ADF Schema management
 * @version 1.0.0
 * @since Next.js 15.1+ / React 19
 * @author DreamFactory Platform Migration Team
 */

import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeftIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Type imports for comprehensive field management
import type { 
  DatabaseSchemaFieldType,
  FieldFormData,
  FieldRouteParams,
  FieldSearchParams 
} from '../field.types';

// Component imports with proper error boundary handling
import { FieldForm } from '../field-form';
import { FunctionUseForm } from '../function-use/function-use-form';

// Hook imports for data management and validation
import { useFieldManagement } from '@/hooks/use-field-management';

// API client for server-side data fetching
import { apiClient } from '@/lib/api-client';

// =============================================================================
// PAGE COMPONENT INTERFACES AND TYPES
// =============================================================================

/**
 * Page props interface for Next.js dynamic routing
 */
interface FieldDetailsPageProps {
  /** Dynamic route parameters */
  params: {
    fieldId: string;
  };
  /** URL search parameters */
  searchParams: {
    service?: string;
    table?: string;
    database?: string;
    mode?: 'create' | 'edit';
  };
}

/**
 * Field operation mode enumeration
 */
type FieldOperationMode = 'create' | 'edit';

/**
 * Page context interface for server-side operations
 */
interface FieldPageContext {
  mode: FieldOperationMode;
  serviceName: string;
  tableName: string;
  fieldId: string;
  databaseName?: string;
}

// =============================================================================
// SERVER-SIDE DATA FETCHING FUNCTIONS
// =============================================================================

/**
 * Fetch field data for edit mode on the server
 * Provides initial data for server-side rendering
 */
async function getFieldData(
  serviceName: string, 
  tableName: string, 
  fieldId: string
): Promise<DatabaseSchemaFieldType | null> {
  try {
    if (fieldId === 'new') {
      return null; // Create mode - no existing data
    }

    const response = await apiClient.get(
      `/${serviceName}/_schema/${tableName}/_field/${fieldId}`
    );
    
    return response || null;
  } catch (error) {
    console.error(`Failed to fetch field data for ${fieldId}:`, error);
    return null;
  }
}

/**
 * Validate required parameters and construct page context
 */
function validateAndConstructContext(
  params: FieldDetailsPageProps['params'],
  searchParams: FieldDetailsPageProps['searchParams']
): FieldPageContext {
  const { fieldId } = params;
  const { service: serviceName, table: tableName, database: databaseName } = searchParams;

  // Validate required parameters
  if (!serviceName) {
    throw new Error('Service name is required. Add ?service=your-service to the URL.');
  }

  if (!tableName) {
    throw new Error('Table name is required. Add ?table=your-table to the URL.');
  }

  if (!fieldId) {
    throw new Error('Field ID is required in the URL path.');
  }

  // Determine operation mode
  const mode: FieldOperationMode = fieldId === 'new' ? 'create' : 'edit';

  return {
    mode,
    serviceName,
    tableName,
    fieldId,
    databaseName
  };
}

// =============================================================================
// METADATA GENERATION
// =============================================================================

/**
 * Generate dynamic metadata for the field details page
 * Optimizes SEO and browser tab display based on operation mode
 */
export async function generateMetadata({ 
  params, 
  searchParams 
}: FieldDetailsPageProps): Promise<Metadata> {
  try {
    const context = validateAndConstructContext(params, searchParams);
    const { mode, serviceName, tableName, fieldId } = context;

    if (mode === 'create') {
      return {
        title: `Create New Field - ${tableName}`,
        description: `Create a new database field for the ${tableName} table in ${serviceName} service`,
        openGraph: {
          title: `Create New Field - ${tableName} | DreamFactory`,
          description: `Add a new field to the ${tableName} table with comprehensive validation and constraints`,
          type: 'website',
        },
        robots: {
          index: false,
          follow: false,
          noarchive: true,
          nosnippet: true,
        },
      };
    } else {
      // For edit mode, try to fetch field data for more specific metadata
      const fieldData = await getFieldData(serviceName, tableName, fieldId);
      const fieldLabel = fieldData?.label || fieldData?.name || fieldId;

      return {
        title: `Edit Field: ${fieldLabel} - ${tableName}`,
        description: `Edit field configuration for ${fieldLabel} in the ${tableName} table of ${serviceName} service`,
        openGraph: {
          title: `Edit Field: ${fieldLabel} - ${tableName} | DreamFactory`,
          description: `Modify field properties, constraints, and validation rules for ${fieldLabel}`,
          type: 'website',
        },
        robots: {
          index: false,
          follow: false,
          noarchive: true,
          nosnippet: true,
        },
      };
    }
  } catch (error) {
    // Fallback metadata for error cases
    return {
      title: 'Field Configuration - DreamFactory',
      description: 'Configure database field properties and validation rules',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

// =============================================================================
// LOADING AND ERROR COMPONENTS
// =============================================================================

/**
 * Loading skeleton component for field form
 */
function FieldFormLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" data-testid="field-form-loading">
      {/* Header skeleton */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
      </div>

      {/* Form sections skeleton */}
      {Array.from({ length: 4 }).map((_, index) => (
        <div 
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Actions skeleton */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
        <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-32 animate-pulse"></div>
      </div>
    </div>
  );
}

/**
 * Error display component for field operations
 */
function FieldPageError({ 
  error, 
  context,
  onRetry 
}: { 
  error: string;
  context?: FieldPageContext;
  onRetry?: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto p-6" data-testid="field-page-error">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
          <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
            Field Configuration Error
          </h2>
        </div>
        
        <p className="text-red-800 dark:text-red-200 mb-4">
          {error}
        </p>

        {context && (
          <div className="bg-red-100 dark:bg-red-900/40 rounded-md p-4 mb-4">
            <h3 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
              Context Information:
            </h3>
            <dl className="text-sm text-red-800 dark:text-red-200 space-y-1">
              <div className="flex">
                <dt className="font-medium w-20">Mode:</dt>
                <dd>{context.mode}</dd>
              </div>
              <div className="flex">
                <dt className="font-medium w-20">Service:</dt>
                <dd>{context.serviceName}</dd>
              </div>
              <div className="flex">
                <dt className="font-medium w-20">Table:</dt>
                <dd>{context.tableName}</dd>
              </div>
              <div className="flex">
                <dt className="font-medium w-20">Field:</dt>
                <dd>{context.fieldId}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="flex space-x-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              Try Again
            </button>
          )}
          
          <Link
            href="/adf-schema/fields"
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-2" />
            Back to Fields
          </Link>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN FIELD DETAILS CONTENT COMPONENT
// =============================================================================

/**
 * Field details content component with data fetching and form logic
 */
function FieldDetailsContent({ context }: { context: FieldPageContext }) {
  const { mode, serviceName, tableName, fieldId } = context;

  // Use field management hook for data operations
  const {
    field,
    fields,
    createField,
    updateField,
    deleteField,
    isLoading,
    isError,
    hasError
  } = useFieldManagement({
    serviceName,
    tableName,
    fieldName: mode === 'edit' ? fieldId : undefined,
    enabled: true
  });

  // Handle field form success
  const handleFieldSuccess = React.useCallback((data: FieldFormData) => {
    console.log('Field operation completed successfully:', data);
    // Navigation is handled within the FieldForm component
  }, []);

  // Handle field form cancellation
  const handleFieldCancel = React.useCallback(() => {
    // Navigation to field list with context
    window.location.href = `/adf-schema/fields?service=${serviceName}&table=${tableName}`;
  }, [serviceName, tableName]);

  // Error handling
  if (isError && mode === 'edit') {
    return (
      <FieldPageError
        error={`Failed to load field "${fieldId}". The field may not exist or there may be a connection issue.`}
        context={context}
        onRetry={() => field.refetch()}
      />
    );
  }

  // Loading state
  if (isLoading && mode === 'edit') {
    return <FieldFormLoading />;
  }

  // Field not found for edit mode
  if (mode === 'edit' && !field.data && !field.isLoading) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="field-details-content">
      {/* Page Header with Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
              <Link
                href="/adf-schema"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
              >
                Schema
              </Link>
              <span className="text-gray-400 dark:text-gray-600">/</span>
              <Link
                href={`/adf-schema/fields?service=${serviceName}&table=${tableName}`}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
              >
                {tableName} Fields
              </Link>
              <span className="text-gray-400 dark:text-gray-600">/</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {mode === 'create' ? 'New Field' : fieldId}
              </span>
            </nav>

            {/* Service Context Badge */}
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full text-sm font-medium">
                {serviceName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6">
        <Suspense fallback={<FieldFormLoading />}>
          <FieldForm
            fieldData={field.data}
            mode={mode}
            serviceName={serviceName}
            tableName={tableName}
            fieldName={mode === 'edit' ? fieldId : undefined}
            onSuccess={handleFieldSuccess}
            onCancel={handleFieldCancel}
            isSubmitting={createField.isPending || updateField.isPending}
          />
        </Suspense>
      </div>

      {/* Global Error Display */}
      {hasError && (
        <div className="fixed bottom-4 right-4 max-w-sm">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-900 dark:text-red-100">
                  Operation Failed
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  An error occurred while processing the field operation. Please try again.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/**
 * Main field details page component with comprehensive error handling
 * and server-side rendering support
 */
export default function FieldDetailsPage({ 
  params, 
  searchParams 
}: FieldDetailsPageProps) {
  try {
    // Validate parameters and construct page context
    const context = validateAndConstructContext(params, searchParams);

    return (
      <Suspense fallback={<FieldFormLoading />}>
        <FieldDetailsContent context={context} />
      </Suspense>
    );
  } catch (error) {
    // Handle parameter validation errors
    const errorMessage = error instanceof Error ? error.message : 'Invalid page parameters';
    
    return (
      <FieldPageError
        error={errorMessage}
        onRetry={() => window.location.reload()}
      />
    );
  }
}

// =============================================================================
// ADDITIONAL EXPORTS FOR TESTING AND UTILITIES
// =============================================================================

// Export types for testing and external usage
export type { 
  FieldDetailsPageProps, 
  FieldOperationMode, 
  FieldPageContext 
};

// Export utility functions for testing
export { 
  validateAndConstructContext,
  getFieldData
};

// =============================================================================
// COMPONENT CONFIGURATION
// =============================================================================

// Configure page for optimal performance
export const dynamic = 'force-dynamic'; // Enable server-side rendering for real-time data
export const revalidate = 0; // Disable static caching for dynamic field data

// Set component display name for debugging
FieldDetailsPage.displayName = 'FieldDetailsPage';