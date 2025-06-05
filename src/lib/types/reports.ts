/**
 * Service report data types and analytics interfaces for DreamFactory Admin Interface
 * 
 * This module provides type definitions for service reporting, API usage analytics,
 * and audit logging functionality. Designed for React 19/Next.js 15.1+ integration
 * with support for React Query caching and TanStack Virtual table performance.
 * 
 * @fileoverview Report type definitions maintaining full backend compatibility
 * @version 1.0.0
 */

import { z } from 'zod';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

// =============================================================================
// CORE REPORT TYPES
// =============================================================================

/**
 * Core service report data matching DreamFactory backend structure
 * Maintains complete compatibility with service report endpoints
 * Used for API usage tracking and audit logging
 */
export interface ServiceReportData {
  /** Unique identifier for the report record */
  id: number;
  
  /** Reference to the service that generated this report entry */
  serviceId: number | null;
  
  /** Human-readable name of the service */
  serviceName: string;
  
  /** Email address of the user who made the API request */
  userEmail: string;
  
  /** API action performed (endpoint, operation, etc.) */
  action: string;
  
  /** HTTP verb used for the request */
  requestVerb: string;
  
  /** Timestamp when the report record was initially created */
  createdDate: string;
  
  /** Timestamp when the report record was last modified */
  lastModifiedDate: string;
}

/**
 * Type alias for backward compatibility with existing Angular codebase
 * Preserves ServiceReportData interface contract during migration
 */
export type ServiceReportEntry = ServiceReportData;

/**
 * Service report status for real-time filtering and UI state management
 * Used with React Query for status-based report filtering
 */
export type ReportStatus = 'all' | 'recent' | 'archived' | 'filtered';

/**
 * Report time range options for analytics filtering
 * Supports common time-based report filtering patterns
 */
export type ReportTimeRange = 
  | 'last_hour'
  | 'last_24_hours' 
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'custom';

/**
 * HTTP verb types for request filtering and categorization
 * Maps to standard REST API verbs tracked in service reports
 */
export type RequestVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

// =============================================================================
// REPORT FILTERING AND ANALYTICS TYPES
// =============================================================================

/**
 * Service report filtering criteria for React Hook Form integration
 * Supports advanced filtering and search capabilities
 */
export interface ServiceReportFilters {
  /** Filter by specific service name or ID */
  service?: string | number;
  
  /** Filter by user email address */
  userEmail?: string;
  
  /** Filter by specific action or action pattern */
  action?: string;
  
  /** Filter by HTTP request method */
  requestVerb?: RequestVerb | RequestVerb[];
  
  /** Time range filter for report date filtering */
  timeRange?: ReportTimeRange;
  
  /** Custom date range when timeRange is 'custom' */
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  
  /** Text search across multiple fields */
  searchQuery?: string;
  
  /** Maximum number of records to return */
  limit?: number;
  
  /** Pagination offset for large datasets */
  offset?: number;
  
  /** Sort field and direction */
  sort?: {
    field: keyof ServiceReportData;
    direction: 'asc' | 'desc';
  };
}

/**
 * Service report aggregation data for analytics dashboard
 * Provides summary statistics and metrics for reporting UI
 */
export interface ServiceReportAnalytics {
  /** Total number of API requests in the filtered time period */
  totalRequests: number;
  
  /** Number of unique services accessed */
  uniqueServices: number;
  
  /** Number of unique users making requests */
  uniqueUsers: number;
  
  /** Request breakdown by HTTP verb */
  requestsByVerb: Record<RequestVerb, number>;
  
  /** Top services by request volume */
  topServices: Array<{
    serviceName: string;
    serviceId: number;
    requestCount: number;
    percentage: number;
  }>;
  
  /** Top users by activity */
  topUsers: Array<{
    userEmail: string;
    requestCount: number;
    percentage: number;
  }>;
  
  /** Request volume over time for charting */
  timeSeriesData: Array<{
    timestamp: string;
    requestCount: number;
  }>;
  
  /** Error rate and status statistics */
  errorMetrics: {
    totalErrors: number;
    errorRate: number;
    commonErrors: Array<{
      action: string;
      count: number;
    }>;
  };
}

/**
 * Service report summary for dashboard widgets
 * Condensed analytics data for overview displays
 */
export interface ServiceReportSummary {
  /** Time period for this summary */
  period: ReportTimeRange;
  
  /** Total requests in the period */
  totalRequests: number;
  
  /** Percentage change from previous period */
  changeFromPrevious: number;
  
  /** Most active service in this period */
  topService: {
    name: string;
    requests: number;
  };
  
  /** Most active user in this period */
  topUser: {
    email: string;
    requests: number;
  };
  
  /** Request trend indicator */
  trend: 'up' | 'down' | 'stable';
}

// =============================================================================
// REPORT EXPORT AND GENERATION TYPES
// =============================================================================

/**
 * Report export configuration for data export functionality
 * Supports multiple export formats and filtering options
 */
export interface ReportExportConfig {
  /** Export file format */
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  
  /** Filters to apply during export */
  filters: ServiceReportFilters;
  
  /** Fields to include in export */
  includeFields: Array<keyof ServiceReportData | 'all'>;
  
  /** Include analytics summary in export */
  includeAnalytics: boolean;
  
  /** Export filename (optional) */
  filename?: string;
  
  /** Maximum records to export */
  maxRecords?: number;
}

/**
 * Scheduled report configuration for automated reporting
 * Supports recurring report generation and delivery
 */
export interface ScheduledReportConfig {
  /** Unique identifier for the scheduled report */
  id?: number;
  
  /** Human-readable name for the report */
  name: string;
  
  /** Report description */
  description?: string;
  
  /** Schedule frequency */
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  
  /** Filters to apply for the scheduled report */
  filters: ServiceReportFilters;
  
  /** Export configuration */
  exportConfig: Omit<ReportExportConfig, 'filters'>;
  
  /** Email recipients for report delivery */
  recipients: string[];
  
  /** Whether the scheduled report is active */
  isActive: boolean;
  
  /** Next scheduled execution time */
  nextRunDate?: string;
  
  /** Last execution time */
  lastRunDate?: string;
  
  /** Created and modified timestamps */
  createdDate?: string;
  lastModifiedDate?: string;
}

// =============================================================================
// REACT COMPONENT INTEGRATION TYPES
// =============================================================================

/**
 * Service report table hook return type
 * Integrates with React Query for intelligent data fetching and caching
 */
export interface ServiceReportTableHook {
  /** Current report data with loading state */
  reports: ServiceReportData[];
  
  /** Loading state for initial data fetch */
  isLoading: boolean;
  
  /** Loading state for pagination/filtering updates */
  isFetching: boolean;
  
  /** Error state if data fetching fails */
  error: Error | null;
  
  /** Total number of records matching current filters */
  totalRecords: number;
  
  /** Current filters applied to the data */
  filters: ServiceReportFilters;
  
  /** Update filters and trigger refetch */
  updateFilters: (newFilters: Partial<ServiceReportFilters>) => void;
  
  /** Clear all filters */
  clearFilters: () => void;
  
  /** Manual refetch function */
  refetch: () => Promise<void>;
  
  /** Export current filtered data */
  exportData: (config: ReportExportConfig) => Promise<void>;
  
  /** Pagination state and controls */
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    goToPage: (page: number) => void;
    setPageSize: (size: number) => void;
  };
}

/**
 * Service report analytics hook return type
 * Provides aggregated data and analytics for dashboard components
 */
export interface ServiceReportAnalyticsHook {
  /** Analytics data for current filters */
  analytics: ServiceReportAnalytics | null;
  
  /** Summary data for dashboard widgets */
  summary: ServiceReportSummary | null;
  
  /** Loading state for analytics computation */
  isLoading: boolean;
  
  /** Error state for analytics fetching */
  error: Error | null;
  
  /** Current time range for analytics */
  timeRange: ReportTimeRange;
  
  /** Update time range and recalculate analytics */
  setTimeRange: (range: ReportTimeRange) => void;
  
  /** Custom date range when using 'custom' time range */
  customDateRange: {
    startDate: string;
    endDate: string;
  } | null;
  
  /** Set custom date range */
  setCustomDateRange: (range: { startDate: string; endDate: string }) => void;
  
  /** Refresh analytics data */
  refreshAnalytics: () => Promise<void>;
}

/**
 * Report filter form hook return type
 * Provides React Hook Form integration for report filtering UI
 */
export interface ReportFilterFormHook<T extends FieldValues = ServiceReportFilters> {
  /** React Hook Form instance */
  form: UseFormReturn<T>;
  
  /** Whether form is currently being submitted */
  isSubmitting: boolean;
  
  /** Apply filters from form data */
  applyFilters: (data: T) => Promise<void>;
  
  /** Reset form to default values */
  resetForm: () => void;
  
  /** Current form state for external components */
  formData: T;
  
  /** Form validation errors */
  errors: Record<string, string>;
  
  /** Whether form has been modified */
  isDirty: boolean;
}

/**
 * Report export hook return type
 * Manages report export operations with progress tracking
 */
export interface ReportExportHook {
  /** Whether export is currently in progress */
  isExporting: boolean;
  
  /** Export progress percentage (0-100) */
  progress: number;
  
  /** Error state for export operations */
  error: Error | null;
  
  /** Initiate export with configuration */
  startExport: (config: ReportExportConfig) => Promise<void>;
  
  /** Cancel ongoing export operation */
  cancelExport: () => void;
  
  /** Download exported file */
  downloadFile: (filename: string) => void;
  
  /** Export history for user reference */
  exportHistory: Array<{
    filename: string;
    format: string;
    createdDate: string;
    recordCount: number;
    downloadUrl: string;
  }>;
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for service report data validation
 * Ensures type safety for report data processing
 */
export const ServiceReportDataSchema = z.object({
  id: z.number().int().positive('ID must be a positive integer'),
  serviceId: z.number().int().positive().nullable(),
  serviceName: z.string().min(1, 'Service name is required').max(255, 'Service name too long'),
  userEmail: z.string().email('Invalid email format').max(255, 'Email too long'),
  action: z.string().min(1, 'Action is required').max(500, 'Action description too long'),
  requestVerb: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']),
  createdDate: z.string().datetime('Invalid created date format'),
  lastModifiedDate: z.string().datetime('Invalid modified date format'),
});

/**
 * Zod schema for report filters validation
 * Integrates with React Hook Form for real-time validation
 */
export const ServiceReportFiltersSchema = z.object({
  service: z.union([z.string(), z.number()]).optional(),
  userEmail: z.string().email().optional().or(z.literal('')),
  action: z.string().max(500).optional(),
  requestVerb: z.union([
    z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']),
    z.array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']))
  ]).optional(),
  timeRange: z.enum(['last_hour', 'last_24_hours', 'last_7_days', 'last_30_days', 'last_90_days', 'custom']).optional(),
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }).optional(),
  searchQuery: z.string().max(255).optional(),
  limit: z.number().int().min(1).max(10000).optional(),
  offset: z.number().int().min(0).optional(),
  sort: z.object({
    field: z.enum(['id', 'serviceId', 'serviceName', 'userEmail', 'action', 'requestVerb', 'createdDate', 'lastModifiedDate']),
    direction: z.enum(['asc', 'desc']),
  }).optional(),
});

/**
 * Zod schema for report export configuration validation
 * Ensures valid export parameters and prevents data exposure
 */
export const ReportExportConfigSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json', 'pdf']),
  filters: ServiceReportFiltersSchema,
  includeFields: z.array(z.enum(['id', 'serviceId', 'serviceName', 'userEmail', 'action', 'requestVerb', 'createdDate', 'lastModifiedDate', 'all'])),
  includeAnalytics: z.boolean(),
  filename: z.string().min(1).max(255).optional(),
  maxRecords: z.number().int().min(1).max(100000).optional(),
});

/**
 * Zod schema for scheduled report configuration validation
 * Supports automated report generation with validation
 */
export const ScheduledReportConfigSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1, 'Report name is required').max(255, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  filters: ServiceReportFiltersSchema,
  exportConfig: ReportExportConfigSchema.omit({ filters: true }),
  recipients: z.array(z.string().email('Invalid recipient email')).min(1, 'At least one recipient required'),
  isActive: z.boolean(),
  nextRunDate: z.string().datetime().optional(),
  lastRunDate: z.string().datetime().optional(),
  createdDate: z.string().datetime().optional(),
  lastModifiedDate: z.string().datetime().optional(),
});

// =============================================================================
// UTILITY FUNCTIONS AND HELPERS
// =============================================================================

/**
 * Type guard for service report data validation
 * Enables type-safe report data handling in React components
 */
export function isServiceReportData(data: unknown): data is ServiceReportData {
  return typeof data === 'object' && 
         data !== null && 
         'id' in data && 
         'serviceName' in data &&
         'userEmail' in data &&
         'action' in data &&
         'requestVerb' in data;
}

/**
 * Type guard for valid request verbs
 * Ensures request verb compatibility with backend systems
 */
export function isValidRequestVerb(verb: string): verb is RequestVerb {
  return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'].includes(verb);
}

/**
 * Generate default filter values for React Hook Form initialization
 * Provides sensible defaults for report filtering
 */
export function getDefaultReportFilters(): ServiceReportFilters {
  return {
    timeRange: 'last_24_hours',
    limit: 50,
    offset: 0,
    sort: {
      field: 'lastModifiedDate',
      direction: 'desc',
    },
  };
}

/**
 * Format service report data for table display
 * Optimizes data for TanStack Virtual table rendering
 */
export function formatReportDataForTable(reports: ServiceReportData[]): Array<ServiceReportData & {
  formattedDate: string;
  verbBadge: string;
  actionPreview: string;
}> {
  return reports.map(report => ({
    ...report,
    formattedDate: new Date(report.lastModifiedDate).toLocaleString(),
    verbBadge: report.requestVerb.toLowerCase(),
    actionPreview: report.action.length > 50 ? 
      `${report.action.substring(0, 50)}...` : 
      report.action,
  }));
}

/**
 * Calculate time range boundaries for analytics filtering
 * Supports various predefined time ranges and custom date ranges
 */
export function getTimeRangeBoundaries(timeRange: ReportTimeRange, customRange?: {
  startDate: string;
  endDate: string;
}): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString();
  
  if (timeRange === 'custom' && customRange) {
    return customRange;
  }
  
  let hoursBack: number;
  switch (timeRange) {
    case 'last_hour':
      hoursBack = 1;
      break;
    case 'last_24_hours':
      hoursBack = 24;
      break;
    case 'last_7_days':
      hoursBack = 24 * 7;
      break;
    case 'last_30_days':
      hoursBack = 24 * 30;
      break;
    case 'last_90_days':
      hoursBack = 24 * 90;
      break;
    default:
      hoursBack = 24;
  }
  
  const startDate = new Date(now.getTime() - (hoursBack * 60 * 60 * 1000)).toISOString();
  
  return { startDate, endDate };
}

/**
 * Generate analytics summary from report data
 * Calculates key metrics for dashboard display
 */
export function calculateReportAnalytics(reports: ServiceReportData[]): ServiceReportAnalytics {
  const totalRequests = reports.length;
  const uniqueServices = new Set(reports.map(r => r.serviceName)).size;
  const uniqueUsers = new Set(reports.map(r => r.userEmail)).size;
  
  // Calculate request breakdown by verb
  const requestsByVerb = reports.reduce((acc, report) => {
    const verb = report.requestVerb as RequestVerb;
    acc[verb] = (acc[verb] || 0) + 1;
    return acc;
  }, {} as Record<RequestVerb, number>);
  
  // Calculate top services
  const serviceCount = reports.reduce((acc, report) => {
    const key = `${report.serviceName}:${report.serviceId}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topServices = Object.entries(serviceCount)
    .map(([key, count]) => {
      const [serviceName, serviceId] = key.split(':');
      return {
        serviceName,
        serviceId: parseInt(serviceId),
        requestCount: count,
        percentage: (count / totalRequests) * 100,
      };
    })
    .sort((a, b) => b.requestCount - a.requestCount)
    .slice(0, 10);
  
  // Calculate top users
  const userCount = reports.reduce((acc, report) => {
    acc[report.userEmail] = (acc[report.userEmail] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topUsers = Object.entries(userCount)
    .map(([userEmail, count]) => ({
      userEmail,
      requestCount: count,
      percentage: (count / totalRequests) * 100,
    }))
    .sort((a, b) => b.requestCount - a.requestCount)
    .slice(0, 10);
  
  // Generate time series data (hourly buckets)
  const timeSeriesData = generateTimeSeriesData(reports);
  
  // Calculate error metrics (placeholder - would need error status in real data)
  const errorMetrics = {
    totalErrors: 0,
    errorRate: 0,
    commonErrors: [],
  };
  
  return {
    totalRequests,
    uniqueServices,
    uniqueUsers,
    requestsByVerb,
    topServices,
    topUsers,
    timeSeriesData,
    errorMetrics,
  };
}

/**
 * Generate time series data for chart visualization
 * Creates hourly buckets for request volume over time
 */
function generateTimeSeriesData(reports: ServiceReportData[]): Array<{
  timestamp: string;
  requestCount: number;
}> {
  const hourlyBuckets = reports.reduce((acc, report) => {
    const hour = new Date(report.lastModifiedDate);
    hour.setMinutes(0, 0, 0); // Round to hour
    const hourKey = hour.toISOString();
    
    acc[hourKey] = (acc[hourKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(hourlyBuckets)
    .map(([timestamp, requestCount]) => ({
      timestamp,
      requestCount,
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/**
 * Request verb color mapping for UI components
 * Provides consistent visual feedback using Tailwind CSS classes
 */
export const RequestVerbColors = {
  GET: 'text-blue-600 bg-blue-100',
  POST: 'text-green-600 bg-green-100',
  PUT: 'text-yellow-600 bg-yellow-100',
  PATCH: 'text-orange-600 bg-orange-100',
  DELETE: 'text-red-600 bg-red-100',
  OPTIONS: 'text-gray-600 bg-gray-100',
  HEAD: 'text-purple-600 bg-purple-100',
} as const;

/**
 * Time range display metadata
 * Provides human-readable labels for time range options
 */
export const TimeRangeMetadata = {
  last_hour: { label: 'Last Hour', shortLabel: '1H' },
  last_24_hours: { label: 'Last 24 Hours', shortLabel: '24H' },
  last_7_days: { label: 'Last 7 Days', shortLabel: '7D' },
  last_30_days: { label: 'Last 30 Days', shortLabel: '30D' },
  last_90_days: { label: 'Last 90 Days', shortLabel: '90D' },
  custom: { label: 'Custom Range', shortLabel: 'Custom' },
} as const;

/**
 * Export format metadata
 * Provides display information and capabilities for export formats
 */
export const ExportFormatMetadata = {
  csv: { 
    label: 'CSV', 
    description: 'Comma-separated values', 
    mimeType: 'text/csv',
    extension: '.csv',
    supportsAnalytics: false 
  },
  xlsx: { 
    label: 'Excel', 
    description: 'Microsoft Excel spreadsheet', 
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
    supportsAnalytics: true 
  },
  json: { 
    label: 'JSON', 
    description: 'JavaScript Object Notation', 
    mimeType: 'application/json',
    extension: '.json',
    supportsAnalytics: true 
  },
  pdf: { 
    label: 'PDF', 
    description: 'Portable Document Format', 
    mimeType: 'application/pdf',
    extension: '.pdf',
    supportsAnalytics: true 
  },
} as const;

/**
 * Export all types for convenient importing
 */
export type {
  // Core report types
  ServiceReportData,
  ServiceReportEntry,
  ReportStatus,
  ReportTimeRange,
  RequestVerb,
  
  // Filtering and analytics types
  ServiceReportFilters,
  ServiceReportAnalytics,
  ServiceReportSummary,
  
  // Export and scheduling types
  ReportExportConfig,
  ScheduledReportConfig,
  
  // React integration types
  ServiceReportTableHook,
  ServiceReportAnalyticsHook,
  ReportFilterFormHook,
  ReportExportHook,
};