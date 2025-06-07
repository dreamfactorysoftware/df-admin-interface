'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Table, 
  Settings, 
  GitBranch, 
  Database,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Feature Components
import { TableDetailsForm } from './table-details-form';
import { FieldsTable } from './fields-table';
import { RelationshipsTable } from './relationships-table';

// API and Types
import { apiClient } from '@/lib/api-client';
import type { TableDetails } from '@/types/table-details';

/**
 * Tab Configuration for Table Details Management
 * Defines the available tabs and their properties for the tabbed interface
 */
const TAB_CONFIG = {
  details: {
    id: 'details',
    label: 'Table Details',
    icon: Settings,
    description: 'Manage table metadata, naming, and configuration',
  },
  fields: {
    id: 'fields',
    label: 'Fields',
    icon: Table,
    description: 'Manage table fields, data types, and constraints',
  },
  relationships: {
    id: 'relationships',
    label: 'Relationships',
    icon: GitBranch,
    description: 'Configure table relationships and foreign keys',
  },
} as const;

type TabId = keyof typeof TAB_CONFIG;

interface TableDetailsPageClientProps {
  /** Database service name */
  dbName: string;
  /** Table name for operations */
  tableName: string;
  /** Initial active tab */
  initialTab?: TabId;
}

/**
 * Client-Side Table Details Management Component
 * 
 * Implements comprehensive table management interface with tabbed navigation for:
 * - Table metadata editing with React Hook Form validation
 * - Fields management with TanStack Virtual for 1,000+ field support
 * - Relationships configuration with optimistic updates
 * 
 * Architecture Features:
 * - React Query for intelligent caching with cache hit responses under 50ms
 * - Next.js client-side routing for tab navigation
 * - Tailwind CSS 4.1+ styling with consistent theme injection
 * - Error boundaries and loading states for robust UX
 * - Real-time form validation under 100ms per React/Next.js Integration Requirements
 * 
 * Performance Characteristics:
 * - Supports large schema datasets per Section 5.2 Component Details
 * - Optimistic updates for immediate UI feedback
 * - Intelligent cache invalidation for data synchronization
 * - Virtual scrolling for performance with large datasets
 * 
 * @example
 * ```tsx
 * <TableDetailsPageClient 
 *   dbName="mysql_service"
 *   tableName="users"
 *   initialTab="fields"
 * />
 * ```
 */
export function TableDetailsPageClient({
  dbName,
  tableName,
  initialTab = 'details',
}: TableDetailsPageClientProps) {
  // Navigation and state management
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  // Local state for tab management
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch table details with React Query for intelligent caching
  const {
    data: tableData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['table-details', dbName, tableName],
    queryFn: async (): Promise<TableDetails> => {
      const response = await apiClient.get(`${dbName}/_schema/${tableName}`);
      return response;
    },
    enabled: !!(dbName && tableName),
    staleTime: 300000, // 5 minutes per Section 5.2 Component Details
    cacheTime: 900000, // 15 minutes per Section 5.2 Component Details
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  /**
   * Handle tab navigation with URL updates
   * Updates both local state and browser URL for proper navigation
   */
  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    
    // Update URL with current tab for proper browser navigation
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('tab', tabId);
    
    router.replace(`/adf-schema/df-table-details?${newSearchParams.toString()}`, {
      scroll: false,
    });

    // Announce tab change to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only absolute -top-px -left-px w-px h-px overflow-hidden';
    announcement.textContent = `Switched to ${TAB_CONFIG[tabId].label} tab`;
    document.body.appendChild(announcement);
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, [router, searchParams]);

  /**
   * Handle table details form submission
   * Updates table metadata with optimistic updates
   */
  const handleTableDetailsSubmit = useCallback(async (data: any, isJsonMode?: boolean) => {
    try {
      // Optimistic update
      queryClient.setQueryData(['table-details', dbName, tableName], (oldData: any) => {
        if (!oldData) return data;
        return { ...oldData, ...data };
      });

      // API call
      const response = await apiClient.patch(`${dbName}/_schema/${tableName}`, data);
      
      // Update cache with server response
      queryClient.setQueryData(['table-details', dbName, tableName], response);
      
      // Invalidate related queries
      await queryClient.invalidateQueries({
        queryKey: ['table-fields', dbName, tableName],
      });
      await queryClient.invalidateQueries({
        queryKey: ['table-relationships', dbName, tableName],
      });

      toast.success(`Table ${tableName} updated successfully`);
      
    } catch (error) {
      // Revert optimistic update on error
      await queryClient.invalidateQueries({
        queryKey: ['table-details', dbName, tableName],
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update table';
      toast.error(`Failed to update table: ${errorMessage}`);
      throw error;
    }
  }, [dbName, tableName, queryClient]);

  /**
   * Handle global refresh of all table data
   * Invalidates all related caches and refetches data
   */
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Invalidate all related queries
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['table-details', dbName, tableName],
        }),
        queryClient.invalidateQueries({
          queryKey: ['table-fields', dbName, tableName],
        }),
        queryClient.invalidateQueries({
          queryKey: ['table-relationships', dbName, tableName],
        }),
      ]);

      // Refetch current tab data
      await refetch();
      
      toast.success('Table data refreshed successfully');
      
      // Announce refresh to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = 'All table data refreshed';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
      
    } catch (error) {
      console.error('Error refreshing table data:', error);
      toast.error('Failed to refresh table data');
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, dbName, tableName, refetch]);

  /**
   * Navigate back to schema browser
   */
  const handleBackToSchema = useCallback(() => {
    router.push(`/adf-schema?dbName=${dbName}`);
  }, [router, dbName]);

  // Update active tab from URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabId;
    if (tabFromUrl && TAB_CONFIG[tabFromUrl] && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  // Error state rendering
  if (isError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load table details: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button onClick={handleBackToSchema} variant="ghost">
            <Database className="h-4 w-4 mr-2" />
            Back to Schema
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Button
          onClick={handleBackToSchema}
          variant="ghost"
          className="self-start"
        >
          <Database className="h-4 w-4 mr-2" />
          Back to Schema Browser
        </Button>
        
        <Button
          onClick={handleRefreshAll}
          variant="outline"
          disabled={isRefreshing || isLoading}
          className="self-end"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh All Data
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav 
          className="flex space-x-8" 
          aria-label="Table management tabs"
          role="tablist"
        >
          {Object.values(TAB_CONFIG).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabId)}
                className={`
                  group relative py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  ${isActive 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }
                `}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-popover text-popover-foreground rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {tab.description}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Table Details Tab */}
        <div
          id="tabpanel-details"
          role="tabpanel"
          aria-labelledby="tab-details"
          className={activeTab === 'details' ? 'block' : 'hidden'}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-muted-foreground">Loading table details...</span>
              </div>
            </div>
          ) : (
            <TableDetailsForm
              initialData={tableData}
              mode="edit"
              dbName={dbName}
              onSubmit={handleTableDetailsSubmit}
              onCancel={handleBackToSchema}
            />
          )}
        </div>

        {/* Fields Tab */}
        <div
          id="tabpanel-fields"
          role="tabpanel"
          aria-labelledby="tab-fields"
          className={activeTab === 'fields' ? 'block' : 'hidden'}
        >
          <FieldsTable
            dbName={dbName}
            tableName={tableName}
            height={600}
            data-testid="table-fields"
          />
        </div>

        {/* Relationships Tab */}
        <div
          id="tabpanel-relationships"
          role="tabpanel"
          aria-labelledby="tab-relationships"
          className={activeTab === 'relationships' ? 'block' : 'hidden'}
        >
          <RelationshipsTable
            dbName={dbName}
            tableName={tableName}
            className="min-h-[400px]"
          />
        </div>
      </div>
    </div>
  );
}

export default TableDetailsPageClient;