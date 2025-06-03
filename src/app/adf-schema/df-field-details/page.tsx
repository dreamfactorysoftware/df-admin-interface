/**
 * Database Field Details Page Component
 * 
 * Next.js server component that serves as the main route handler for database field
 * creation and editing within the ADF Schema Builder. Implements server-side rendering
 * with React Query for data fetching, supporting both create and edit modes per
 * Next.js app router architecture.
 * 
 * Routing Patterns:
 * - Create mode: /adf-schema/[service]/[table]/field
 * - Edit mode: /adf-schema/[service]/[table]/field/[fieldName]
 * 
 * Features:
 * - Next.js server component with SSR under 2 seconds
 * - React Query-powered field data fetching with intelligent caching
 * - Dynamic routing with type-safe parameter extraction
 * - Authentication validation via Next.js middleware
 * - Comprehensive error handling and loading states
 * - WCAG 2.1 AA compliant navigation and layout
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import React, { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  DatabaseIcon,
  TableIcon,
  SquaresPlusIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline'

// Internal components and utilities
import { FieldForm } from './field-form'
import { LoadingSpinner } from '@/components/ui/loading'
import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

// Type imports
import type {
  FieldDetailPageProps,
  FieldDetailRouteParams,
  FieldSearchParams,
  FieldNavigationContext,
  DatabaseSchemaFieldType,
  FieldFormSubmissionContext
} from './df-field-details.types'

// Hook imports
import { FieldDetailClientComponent } from './field-detail-client'

// =============================================================================
// METADATA GENERATION
// =============================================================================

export async function generateMetadata({
  params,
  searchParams
}: FieldDetailPageProps): Promise<Metadata> {
  const { service, table, fieldId } = await params
  const mode = fieldId ? 'edit' : 'create'
  
  const baseTitle = mode === 'edit' 
    ? `Edit Field: ${fieldId}`
    : 'Create New Field'
  
  const description = mode === 'edit'
    ? `Edit database field configuration for ${fieldId} in table ${table} of service ${service}`
    : `Create a new database field in table ${table} of service ${service}`

  return {
    title: `${baseTitle} - ${table} - DreamFactory Admin`,
    description,
    openGraph: {
      title: baseTitle,
      description,
      type: 'website'
    },
    robots: {
      index: false, // Admin interface should not be indexed
      follow: false
    }
  }
}

// =============================================================================
// ROUTE PARAMETER VALIDATION
// =============================================================================

/**
 * Validates and extracts route parameters with proper type safety
 */
async function validateRouteParams(params: FieldDetailRouteParams['params']): Promise<{
  serviceName: string
  tableName: string
  fieldName?: string
  isEditMode: boolean
}> {
  const { service, table, fieldId } = await params
  
  // Basic parameter validation
  if (!service || typeof service !== 'string' || service.trim().length === 0) {
    throw new Error('Service name is required and must be a valid string')
  }
  
  if (!table || typeof table !== 'string' || table.trim().length === 0) {
    throw new Error('Table name is required and must be a valid string')
  }
  
  // Validate service and table name format (basic alphanumeric + underscore)
  const namePattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/
  
  if (!namePattern.test(service)) {
    throw new Error('Service name contains invalid characters')
  }
  
  if (!namePattern.test(table)) {
    throw new Error('Table name contains invalid characters')
  }
  
  // Field name validation for edit mode
  const isEditMode = Boolean(fieldId)
  if (isEditMode && (!fieldId || typeof fieldId !== 'string' || fieldId.trim().length === 0)) {
    throw new Error('Field name is required for edit mode')
  }
  
  if (isEditMode && fieldId && !namePattern.test(fieldId)) {
    throw new Error('Field name contains invalid characters')
  }
  
  return {
    serviceName: service.trim(),
    tableName: table.trim(),
    fieldName: isEditMode ? fieldId?.trim() : undefined,
    isEditMode
  }
}

/**
 * Validates search parameters and provides defaults
 */
function validateSearchParams(searchParams: FieldSearchParams): {
  mode: 'create' | 'edit'
  tab: 'basic' | 'constraints' | 'relationships' | 'functions'
  returnUrl?: string
} {
  const mode = searchParams.mode === 'edit' ? 'edit' : 'create'
  const validTabs = ['basic', 'constraints', 'relationships', 'functions'] as const
  const tab = validTabs.includes(searchParams.tab as any) 
    ? (searchParams.tab as typeof validTabs[number])
    : 'basic'
  
  // Validate return URL if provided
  let returnUrl: string | undefined
  if (searchParams.returnUrl) {
    try {
      // Ensure return URL is relative to prevent open redirect attacks
      const url = new URL(searchParams.returnUrl, 'http://localhost')
      if (url.pathname.startsWith('/')) {
        returnUrl = url.pathname + url.search + url.hash
      }
    } catch {
      // Invalid URL format, ignore
    }
  }
  
  return { mode, tab, returnUrl }
}

// =============================================================================
// NAVIGATION HELPERS
// =============================================================================

/**
 * Generates breadcrumb navigation items
 */
function generateBreadcrumbs(context: FieldNavigationContext): Array<{
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  isCurrent?: boolean
}> {
  const { serviceName, tableName, fieldName, isEditMode } = context
  
  return [
    {
      label: 'Home',
      href: '/',
      icon: HomeIcon
    },
    {
      label: 'Schema',
      href: '/adf-schema',
      icon: DatabaseIcon
    },
    {
      label: serviceName,
      href: `/adf-schema/${serviceName}`,
      icon: DatabaseIcon
    },
    {
      label: tableName,
      href: `/adf-schema/${serviceName}/${tableName}`,
      icon: TableIcon
    },
    {
      label: isEditMode ? `Edit Field: ${fieldName}` : 'Create Field',
      icon: isEditMode ? PencilSquareIcon : SquaresPlusIcon,
      isCurrent: true
    }
  ]
}

/**
 * Breadcrumb navigation component
 */
function BreadcrumbNavigation({ 
  context 
}: { 
  context: FieldNavigationContext 
}) {
  const breadcrumbs = generateBreadcrumbs(context)
  
  return (
    <nav 
      className="flex mb-6"
      aria-label="Breadcrumb navigation"
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1
          const Icon = item.icon
          
          return (
            <li key={index} className="inline-flex items-center">
              {index > 0 && (
                <svg
                  className="w-3 h-3 text-gray-400 mx-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 6 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m1 9 4-4-4-4"
                  />
                </svg>
              )}
              
              {isLast || !item.href ? (
                <span 
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium",
                    isLast 
                      ? "text-gray-700 dark:text-gray-300" 
                      : "text-gray-500 dark:text-gray-400"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Back navigation component
 */
function BackNavigation({ 
  context,
  returnUrl
}: { 
  context: FieldNavigationContext
  returnUrl?: string
}) {
  const { serviceName, tableName } = context
  const backUrl = returnUrl || `/adf-schema/${serviceName}/${tableName}`
  
  return (
    <div className="mb-6">
      <Link
        href={backUrl}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to {tableName} Table
      </Link>
    </div>
  )
}

// =============================================================================
// PAGE HEADER COMPONENT
// =============================================================================

/**
 * Page header with title and description
 */
function PageHeader({ 
  context 
}: { 
  context: FieldNavigationContext 
}) {
  const { tableName, fieldName, isEditMode } = context
  
  const title = isEditMode 
    ? `Edit Field: ${fieldName}`
    : 'Create New Field'
  
  const description = isEditMode
    ? `Modify the configuration and properties of the ${fieldName} field`
    : `Add a new field to the ${tableName} table with custom properties and constraints`
  
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
        {description}
      </p>
    </div>
  )
}

// =============================================================================
// ERROR BOUNDARY AND LOADING COMPONENTS
// =============================================================================

/**
 * Error display component
 */
function ErrorDisplay({ 
  error,
  retry
}: { 
  error: Error
  retry?: () => void
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Alert
        variant="error"
        title="Page Load Error"
        message={error.message}
        actions={retry && [
          {
            label: 'Try Again',
            onClick: retry,
            variant: 'outline'
          }
        ]}
        icon={ExclamationTriangleIcon}
      />
    </div>
  )
}

/**
 * Loading skeleton component
 */
function FieldDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Navigation skeleton */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-300 rounded dark:bg-gray-600" />
        <div className="w-32 h-4 bg-gray-300 rounded dark:bg-gray-600" />
      </div>
      
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="w-64 h-8 bg-gray-300 rounded dark:bg-gray-600" />
        <div className="w-96 h-4 bg-gray-300 rounded dark:bg-gray-600" />
      </div>
      
      {/* Form skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          <div className="w-48 h-6 bg-gray-300 rounded dark:bg-gray-600" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="w-24 h-4 bg-gray-300 rounded dark:bg-gray-600" />
                <div className="w-full h-10 bg-gray-300 rounded dark:bg-gray-600" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/**
 * Field Details Page - Main Server Component
 */
export default async function FieldDetailsPage({
  params,
  searchParams
}: FieldDetailPageProps) {
  try {
    // Validate and extract route parameters
    const routeData = await validateRouteParams(params)
    const { serviceName, tableName, fieldName, isEditMode } = routeData
    
    // Validate search parameters
    const searchData = validateSearchParams(await searchParams)
    const { returnUrl } = searchData
    
    // Create navigation context
    const navigationContext: FieldNavigationContext = {
      serviceName,
      tableName,
      fieldName,
      isEditMode,
      previousUrl: returnUrl
    }
    
    // Create form submission context
    const submissionContext: FieldFormSubmissionContext = {
      serviceName,
      tableName,
      fieldName,
      isEditMode
    }
    
    // Server-side validation - ensure field exists for edit mode
    if (isEditMode && !fieldName) {
      notFound()
    }
    
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Navigation */}
        <BackNavigation 
          context={navigationContext}
          returnUrl={returnUrl}
        />
        
        <BreadcrumbNavigation context={navigationContext} />
        
        {/* Page Header */}
        <PageHeader context={navigationContext} />
        
        {/* Main Content */}
        <Suspense fallback={<FieldDetailsSkeleton />}>
          <FieldDetailClientComponent
            context={submissionContext}
            navigationContext={navigationContext}
            returnUrl={returnUrl}
          />
        </Suspense>
      </div>
    )
    
  } catch (error) {
    console.error('Field Details Page Error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Service name') || 
          error.message.includes('Table name') || 
          error.message.includes('Field name')) {
        // Invalid parameters - return 404
        notFound()
      }
    }
    
    // Generic error display
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <ErrorDisplay 
          error={error instanceof Error ? error : new Error('An unexpected error occurred')}
          retry={() => window.location.reload()}
        />
      </div>
    )
  }
}

// =============================================================================
// STATIC PARAMS GENERATION (for build optimization)
// =============================================================================

/**
 * Generate static params for common routes
 * This helps with build optimization but is optional for dynamic routes
 */
export async function generateStaticParams(): Promise<Array<{
  service: string
  table: string
  fieldId?: string
}>> {
  // Return empty array to enable full dynamic rendering
  // In production, you might want to pre-generate common field editing routes
  return []
}

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

export type { FieldDetailPageProps }
export { 
  generateMetadata,
  generateStaticParams,
  BreadcrumbNavigation,
  BackNavigation,
  PageHeader,
  ErrorDisplay,
  FieldDetailsSkeleton
}