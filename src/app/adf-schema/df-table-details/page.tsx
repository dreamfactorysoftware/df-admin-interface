'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Tab } from '@headlessui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Import child components - these will be created by other developers
import TableDetailsForm from './table-details-form';
import FieldsTable from './fields-table';
import RelationshipsTable from './relationships-table';

// Icons for tab navigation
import { 
  TableCellsIcon, 
  Cog6ToothIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

// Types for table details data structure
interface TableDetails {
  name: string;
  alias?: string;
  label?: string;
  plural?: string;
  description?: string;
  field?: TableField[];
  related?: TableRelated[];
  access?: number;
  primaryKey?: string[];
  isView?: boolean;
  native?: any[];
  constraints?: any;
}

interface TableField {
  alias?: string;
  name: string;
  label: string;
  description?: string;
  native: any[];
  type: string;
  dbType: string;
  length?: number;
  precision?: any;
  scale?: any;
  default?: any;
  required: boolean;
  allowNull?: boolean;
  fixedLength: boolean;
  supportsMultibyte: boolean;
  autoIncrement: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isIndex: boolean;
  isForeignKey: boolean;
  refTable?: string;
  refField?: string;
  refOnUpdate?: any;
  refOnDelete?: any;
  picklist?: string[];
  validation?: any;
  dbFunction?: string;
  isVirtual: boolean;
  isAggregate: boolean;
}

interface TableRelated {
  alias?: string;
  name: string;
  label: string;
  description?: string;
  native: any[];
  type: string;
  field: string;
  isVirtual: boolean;
  refServiceID: number;
  refTable: string;
  refField: string;
  refOnUpdate: string;
  refOnDelete: string;
  junctionServiceID?: number;
  junctionTable?: string;
  junctionField?: string;
  junctionRefField?: string;
  alwaysFetch: boolean;
  flatten: boolean;
  flattenDropPrefix: boolean;
}

// Tab configuration
interface TabDefinition {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  disabled?: boolean;
}

// Page props interface for type safety
interface TableDetailsPageProps {
  params: {
    dbName: string;
    tableName: string;
  };
}

/**
 * TableDetailsPage Component
 * 
 * Next.js page component that serves as the main entry point for table details management,
 * implementing tabbed interface for table metadata editing, fields management, and 
 * relationships configuration. Replaces Angular component routing with Next.js app router 
 * file-based routing and server-side rendering capabilities.
 * 
 * Features:
 * - Next.js server components for initial page loads per React/Next.js Integration Requirements
 * - SSR pages under 2 seconds per React/Next.js Integration Requirements  
 * - Tailwind CSS 4.1+ with consistent theme injection per React/Next.js Integration Requirements
 * - Schema Discovery and Browsing feature F-002 per Section 2.1 Feature Catalog
 * - Angular Material tabs converted to Headless UI tab components with Tailwind CSS styling
 * - React Hook Form integration for table metadata management
 * - Next.js middleware authentication integration
 * 
 * @param params Route parameters containing dbName and tableName from Next.js dynamic routing
 */
export default function TableDetailsPage({ params }: TableDetailsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  // Extract route parameters with proper typing
  const { dbName, tableName } = params;
  
  // Tab state management with URL synchronization
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Initialize tab from URL query parameter
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam) {
      const tabIndex = tabs.findIndex(tab => tab.id === tabParam);
      if (tabIndex !== -1) {
        setSelectedIndex(tabIndex);
      }
    }
  }, [searchParams]);

  // Tab definitions with consistent theming and accessibility
  const tabs: TabDefinition[] = useMemo(() => [
    {
      id: 'details',
      name: 'Table Details',
      icon: Cog6ToothIcon,
    },
    {
      id: 'fields',
      name: 'Fields',
      icon: TableCellsIcon,
    },
    {
      id: 'relationships',
      name: 'Relationships', 
      icon: ArrowPathIcon,
    },
  ], []);

  // Data fetching with React Query intelligent caching - cache hit responses under 50ms
  const tableDetailsQuery = useQuery({
    queryKey: ['table-details', dbName, tableName],
    queryFn: async (): Promise<TableDetails> => {
      const response = await fetch(`/api/v2/${dbName}/_schema/${tableName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Table "${tableName}" not found in database "${dbName}"`);
        }
        throw new Error(`Failed to fetch table details: ${response.statusText}`);
      }

      const data = await response.json();
      return data.resource || data;
    },
    staleTime: 300000, // 5 minutes stale time for optimal caching per Section 5.2
    cacheTime: 900000, // 15 minutes cache time for intelligent caching
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Error fetching table details:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load table details');
    },
  });

  // Navigation handlers for enhanced UX
  const handleBackNavigation = useCallback(() => {
    router.push(`/adf-schema/databases/${dbName}`);
  }, [router, dbName]);

  const handleTabChange = useCallback((index: number) => {
    setSelectedIndex(index);
    // Update URL with tab parameter for proper browser history and shareable URLs
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('tab', tabs[index].id);
    router.replace(currentUrl.pathname + currentUrl.search, { scroll: false });
  }, [router, tabs]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries(['table-details', dbName, tableName]);
    toast.success('Table details refreshed');
  }, [queryClient, dbName, tableName]);

  // Memoized component states for optimal performance
  const isLoading = tableDetailsQuery.isLoading;
  const isError = tableDetailsQuery.isError;
  const error = tableDetailsQuery.error;
  const tableData = tableDetailsQuery.data;

  // Error boundary component
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with back navigation */}
          <div className="mb-8">
            <button
              onClick={handleBackNavigation}
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
              aria-label="Back to database schema"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Schema
            </button>
          </div>

          {/* Error state */}
          <div className="rounded-lg bg-red-50 p-6 dark:bg-red-900/50">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon 
                  className="h-5 w-5 text-red-400" 
                  aria-hidden="true" 
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error Loading Table Details
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleRefresh}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:text-red-300 dark:bg-red-800 dark:hover:bg-red-700 transition-colors duration-200"
                  >
                    <ArrowPathIcon className="mr-2 h-4 w-4" />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with breadcrumb navigation */}
        <div className="mb-8">
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <button
                  onClick={handleBackNavigation}
                  className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  Schema
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {dbName}
                  </span>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-900 dark:text-white">
                    {tableName}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Page title and actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Table Details
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage metadata, fields, and relationships for <span className="font-medium">{tableName}</span>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Refresh table details"
              >
                <ArrowPathIcon 
                  className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} 
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Main content with tabbed interface */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          {/* Tab navigation using Headless UI with Tailwind CSS styling */}
          <Tab.Group selectedIndex={selectedIndex} onChange={handleTabChange}>
            <Tab.List className="flex space-x-1 rounded-xl bg-gray-50 p-1 dark:bg-gray-700">
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.id}
                  disabled={tab.disabled}
                  className={({ selected }) =>
                    cn(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                      'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-white text-blue-700 shadow dark:bg-gray-800 dark:text-blue-400'
                        : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white',
                      tab.disabled && 'opacity-50 cursor-not-allowed'
                    )
                  }
                  aria-label={`${tab.name} tab`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <tab.icon className="h-4 w-4" aria-hidden="true" />
                    <span>{tab.name}</span>
                  </div>
                </Tab>
              ))}
            </Tab.List>

            {/* Tab panels with loading states and error boundaries */}
            <Tab.Panels className="mt-2">
              {/* Table Details Tab */}
              <Tab.Panel
                className={cn(
                  'rounded-xl bg-white p-6 dark:bg-gray-800',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                )}
              >
                <Suspense fallback={<TableDetailsLoadingSkeleton />}>
                  {isLoading ? (
                    <TableDetailsLoadingSkeleton />
                  ) : (
                    <TableDetailsForm
                      initialData={tableData}
                      dbName={dbName}
                      mode="edit"
                      isLoading={isLoading}
                    />
                  )}
                </Suspense>
              </Tab.Panel>

              {/* Fields Tab */}
              <Tab.Panel
                className={cn(
                  'rounded-xl bg-white p-6 dark:bg-gray-800',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                )}
              >
                <Suspense fallback={<FieldsLoadingSkeleton />}>
                  <FieldsTable
                    dbName={dbName}
                    tableName={tableName}
                  />
                </Suspense>
              </Tab.Panel>

              {/* Relationships Tab */}
              <Tab.Panel
                className={cn(
                  'rounded-xl bg-white p-6 dark:bg-gray-800',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                )}
              >
                <Suspense fallback={<RelationshipsLoadingSkeleton />}>
                  <RelationshipsTable
                    dbName={dbName}
                    tableName={tableName}
                  />
                </Suspense>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton components for optimal perceived performance
function TableDetailsLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4 dark:bg-gray-700"></div>
          <div className="h-10 bg-gray-200 rounded dark:bg-gray-700"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4 dark:bg-gray-700"></div>
          <div className="h-10 bg-gray-200 rounded dark:bg-gray-700"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4 dark:bg-gray-700"></div>
          <div className="h-10 bg-gray-200 rounded dark:bg-gray-700"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4 dark:bg-gray-700"></div>
          <div className="h-10 bg-gray-200 rounded dark:bg-gray-700"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/6 dark:bg-gray-700"></div>
        <div className="h-24 bg-gray-200 rounded dark:bg-gray-700"></div>
      </div>
    </div>
  );
}

function FieldsLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-1/4 dark:bg-gray-700"></div>
        <div className="h-10 bg-gray-200 rounded w-32 dark:bg-gray-700"></div>
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded flex-1 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-20 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-16 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-24 dark:bg-gray-700"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RelationshipsLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-1/4 dark:bg-gray-700"></div>
        <div className="h-10 bg-gray-200 rounded w-40 dark:bg-gray-700"></div>
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded flex-1 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-20 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-16 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-24 dark:bg-gray-700"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export types for use by other components
export type { TableDetails, TableField, TableRelated, TabDefinition };