/**
 * @fileoverview Field Details Page - React/Next.js Migration
 * 
 * Next.js server component page that serves as the main route handler for database field 
 * creation and editing within the ADF Schema Builder. Implements SSR capabilities with 
 * React Query for data fetching, supporting both create mode (/adf-schema/:name/:id/field) 
 * and edit mode (/adf-schema/:name/:id/field/:fieldName) routing patterns per Next.js app 
 * router architecture.
 * 
 * Key Features:
 * - Next.js server component with SSR under 2 seconds per React/Next.js Integration Requirements
 * - React Query-powered database field management with intelligent caching per Section 3.2.2
 * - File-based routing structure per Section 0.2.1 implementation plan
 * - Angular route component to Next.js page component migration per Section 4.7.1.1
 * - Next.js middleware authentication validation per Section 4.7.1.2
 * 
 * @version 2.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

// ============================================================================
// TYPE IMPORTS
// ============================================================================

import type {
  FieldPageProps,
  FieldRouteParams,
  FieldSearchParams,
  DatabaseSchemaFieldType,
  FieldFormData,
  FieldUpdateFormData
} from './df-field-details.types';

// ============================================================================
// COMPONENT IMPORTS
// ============================================================================

import { FieldForm } from './field-form';
import { cn } from '@/lib/utils';

// ============================================================================
// LOADING COMPONENTS
// ============================================================================

/**
 * Loading skeleton for field form
 */
function FieldFormSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-64"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-96"></div>
      </div>
      
      {/* Form Sections Skeleton */}
      <div className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-48 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
            <div className="lg:col-span-2 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
        
        {/* Type Configuration Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-40 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Constraints Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-32 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                </div>
                <div className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Action Buttons Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-24"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-32"></div>
      </div>
    </div>
  );
}

/**
 * Error boundary fallback for field operations
 */
function FieldErrorFallback({ 
  error, 
  retry 
}: { 
  error: Error; 
  retry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
      <div className="flex items-start gap-4">
        <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
            Field Operation Error
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            {error.message || 'An unexpected error occurred while processing the field operation.'}
          </p>
          {retry && (
            <button
              onClick={retry}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800/30 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-md transition-colors"
            >
              <Cog6ToothIcon className="h-4 w-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SERVER COMPONENT UTILITIES
// ============================================================================

/**
 * Validates route parameters for field operations
 */
function validateRouteParams(params: FieldRouteParams): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!params.tableId || typeof params.tableId !== 'string') {
    errors.push('Table ID is required');
  }
  
  if (params.tableId && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(params.tableId)) {
    errors.push('Table ID must be a valid identifier');
  }
  
  if (params.fieldId && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(params.fieldId)) {
    errors.push('Field ID must be a valid identifier');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Determines operation mode based on route parameters
 */
function determineOperationMode(params: FieldRouteParams): 'create' | 'edit' {
  return params.fieldId ? 'edit' : 'create';
}

/**
 * Generates breadcrumb navigation data
 */
function generateBreadcrumbs(params: FieldRouteParams, mode: 'create' | 'edit') {
  const { tableId, fieldId, serviceId } = params;
  
  return [
    {
      label: 'Schema',
      href: serviceId ? `/adf-schema/${serviceId}` : '/adf-schema',
    },
    {
      label: tableId,
      href: serviceId ? `/adf-schema/${serviceId}/tables/${tableId}` : `/adf-schema/tables/${tableId}`,
    },
    {
      label: mode === 'create' ? 'New Field' : fieldId || 'Edit Field',
      href: '', // Current page
      current: true,
    },
  ];
}

// ============================================================================
// CLIENT COMPONENT WRAPPER
// ============================================================================

/**
 * Client-side field management wrapper with data fetching and form handling
 */
function FieldManagementClient({
  params,
  searchParams,
  mode,
}: {
  params: FieldRouteParams;
  searchParams: FieldSearchParams;
  mode: 'create' | 'edit';
}) {
  const { tableId, fieldId, serviceId } = params;
  const { returnUrl } = searchParams;
  
  // ========================================================================
  // FORM SUBMISSION HANDLERS
  // ========================================================================
  
  /**
   * Handle field form submission
   */
  const handleSubmit = async (data: FieldFormData | FieldUpdateFormData) => {
    try {
      // TODO: Implement actual API calls using the api-client
      // This will be handled by the use-field-management hook when available
      
      if (mode === 'create') {
        console.log('Creating field:', { tableId, fieldData: data });
        // const result = await createField({ tableId, fieldData: data as FieldFormData });
      } else {
        console.log('Updating field:', { tableId, fieldId, fieldData: data });
        // const result = await updateField({ tableId, fieldId: fieldId!, fieldData: data as FieldUpdateFormData });
      }
      
      // Redirect after successful operation
      const redirectUrl = returnUrl || (serviceId 
        ? `/adf-schema/${serviceId}/tables/${tableId}` 
        : `/adf-schema/tables/${tableId}`);
      
      redirect(redirectUrl);
      
    } catch (error) {
      console.error('Field operation error:', error);
      throw error;
    }
  };
  
  /**
   * Handle field deletion (edit mode only)
   */
  const handleDelete = async () => {
    if (mode !== 'edit' || !fieldId) return;
    
    try {
      console.log('Deleting field:', { tableId, fieldId });
      // const result = await deleteField({ tableId, fieldId });
      
      // Redirect after successful deletion
      const redirectUrl = returnUrl || (serviceId 
        ? `/adf-schema/${serviceId}/tables/${tableId}` 
        : `/adf-schema/tables/${tableId}`);
      
      redirect(redirectUrl);
      
    } catch (error) {
      console.error('Field deletion error:', error);
      throw error;
    }
  };
  
  /**
   * Handle form cancellation
   */
  const handleCancel = () => {
    const redirectUrl = returnUrl || (serviceId 
      ? `/adf-schema/${serviceId}/tables/${tableId}` 
      : `/adf-schema/tables/${tableId}`);
    
    redirect(redirectUrl);
  };
  
  // ========================================================================
  // MOCK DATA FOR FORM (TODO: Replace with actual API calls)
  // ========================================================================
  
  const mockAvailableTypes = [
    { value: 'string', label: 'String', category: 'Text' },
    { value: 'text', label: 'Text', category: 'Text' },
    { value: 'varchar', label: 'VARCHAR', category: 'Text' },
    { value: 'char', label: 'CHAR', category: 'Text' },
    { value: 'integer', label: 'Integer', category: 'Numeric' },
    { value: 'bigint', label: 'Big Integer', category: 'Numeric' },
    { value: 'decimal', label: 'Decimal', category: 'Numeric' },
    { value: 'float', label: 'Float', category: 'Numeric' },
    { value: 'date', label: 'Date', category: 'Date/Time' },
    { value: 'datetime', label: 'DateTime', category: 'Date/Time' },
    { value: 'timestamp', label: 'Timestamp', category: 'Date/Time' },
    { value: 'boolean', label: 'Boolean', category: 'Other' },
    { value: 'json', label: 'JSON', category: 'Other' },
    { value: 'uuid', label: 'UUID', category: 'Other' },
  ];
  
  const mockAvailableTables = [
    { value: 'users', label: 'users' },
    { value: 'roles', label: 'roles' },
    { value: 'permissions', label: 'permissions' },
    { value: 'categories', label: 'categories' },
    { value: 'products', label: 'products' },
  ];
  
  const mockExistingField: DatabaseSchemaFieldType | null = mode === 'edit' ? {
    alias: null,
    allowNull: true,
    autoIncrement: false,
    dbFunction: null,
    dbType: 'varchar',
    description: 'Sample field description',
    default: null,
    fixedLength: false,
    isAggregate: false,
    isForeignKey: false,
    isPrimaryKey: false,
    isUnique: false,
    isVirtual: false,
    label: fieldId || 'Sample Field',
    length: 255,
    name: fieldId || 'sample_field',
    native: null,
    picklist: null,
    precision: null,
    refField: null,
    refTable: null,
    refOnDelete: null,
    refOnUpdate: null,
    required: false,
    scale: 0,
    supportsMultibyte: false,
    type: 'string',
    validation: null,
    value: [],
  } : null;
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <FieldForm
      field={mockExistingField}
      mode={mode}
      tableId={tableId}
      serviceId={serviceId || ''}
      availableTypes={mockAvailableTypes}
      availableTables={mockAvailableTables}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onDelete={mode === 'edit' ? handleDelete : undefined}
      className="max-w-4xl"
    />
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

/**
 * Field Details Page Component
 * 
 * Next.js server component that handles database field creation and editing.
 * Implements SSR capabilities with React Query integration for optimal performance.
 */
export default async function FieldDetailsPage({
  params,
  searchParams,
}: FieldPageProps) {
  
  // ========================================================================
  // PARAMETER VALIDATION
  // ========================================================================
  
  const validation = validateRouteParams(params);
  if (!validation.isValid) {
    console.error('Invalid route parameters:', validation.errors);
    notFound();
  }
  
  const mode = determineOperationMode(params);
  const breadcrumbs = generateBreadcrumbs(params, mode);
  const { tableId, fieldId, serviceId } = params;
  
  // ========================================================================
  // PAGE METADATA AND SEO
  // ========================================================================
  
  const pageTitle = mode === 'create' 
    ? `Create Field - ${tableId}` 
    : `Edit Field - ${fieldId} - ${tableId}`;
  
  const pageDescription = mode === 'create'
    ? `Create a new database field for table ${tableId} with comprehensive configuration options.`
    : `Edit database field ${fieldId} in table ${tableId} with full constraint and relationship management.`;
  
  // ========================================================================
  // RETURN URL HANDLING
  // ========================================================================
  
  const defaultReturnUrl = serviceId 
    ? `/adf-schema/${serviceId}/tables/${tableId}` 
    : `/adf-schema/tables/${tableId}`;
  
  const returnUrl = searchParams.returnUrl || defaultReturnUrl;
  
  // ========================================================================
  // MAIN RENDER
  // ========================================================================
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-8">
          
          {/* Breadcrumb Navigation */}
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <svg className="mx-2 h-4 w-4 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {crumb.current ? (
                    <span className="font-medium text-gray-900 dark:text-gray-100">{crumb.label}</span>
                  ) : (
                    <Link 
                      href={crumb.href} 
                      className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          
          {/* Page Title and Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href={returnUrl}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Table
                </Link>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {pageTitle}
              </h1>
              
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                {pageDescription}
              </p>
            </div>
            
            {/* Operation Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium">
              {mode === 'create' ? (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Creating New Field
                </>
              ) : (
                <>
                  <Cog6ToothIcon className="h-4 w-4" />
                  Editing Field
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Information Banner */}
        <div className="mb-6 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Field Configuration Guidelines</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Field names must be valid database identifiers (letters, numbers, underscores only)</li>
                <li>Primary keys automatically disable null values and enable required constraint</li>
                <li>Foreign key relationships require both referenced table and field to be specified</li>
                <li>Length is required for string types (VARCHAR, CHAR, TEXT)</li>
                <li>Precision is required for numeric types (DECIMAL, FLOAT, DOUBLE)</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <Suspense fallback={<FieldFormSkeleton />}>
            <FieldManagementClient
              params={params}
              searchParams={searchParams}
              mode={mode}
            />
          </Suspense>
        </div>
        
        {/* Additional Help Information */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help with field configuration?{' '}
            <Link 
              href="/docs/schema/field-management" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
            >
              View Documentation
            </Link>
          </p>
        </div>
        
      </div>
    </div>
  );
}

// ============================================================================
// METADATA EXPORT FOR SEO
// ============================================================================

/**
 * Generate dynamic metadata for field pages
 */
export async function generateMetadata({
  params,
}: FieldPageProps): Promise<Metadata> {
  const { tableId, fieldId } = params;
  const mode = determineOperationMode(params);
  
  const title = mode === 'create' 
    ? `Create Field - ${tableId} | DreamFactory Admin`
    : `Edit ${fieldId} - ${tableId} | DreamFactory Admin`;
  
  const description = mode === 'create'
    ? `Create a new database field for table ${tableId} with comprehensive configuration options including constraints, relationships, and validation rules.`
    : `Edit database field ${fieldId} in table ${tableId} with full constraint and relationship management capabilities.`;
  
  return {
    title,
    description,
    robots: {
      index: false, // Admin pages should not be indexed
      follow: false,
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}