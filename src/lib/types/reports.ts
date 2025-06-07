/**
 * Service Report Data Types
 * 
 * This module defines TypeScript types for service report data and related functionality,
 * maintaining API compatibility with DreamFactory backend services while providing
 * enhanced support for React component integration.
 * 
 * The types preserve existing backend service report endpoint contracts and enable
 * seamless integration with React-based report management components.
 */

/**
 * Core service report data structure representing API usage activity.
 * 
 * This type maintains complete compatibility with the DreamFactory backend
 * service report API endpoints and provides the foundation for all report
 * display and management functionality.
 * 
 * @example
 * ```tsx
 * // React component usage
 * const ServiceReportRow: React.FC<{ report: ServiceReportData }> = ({ report }) => (
 *   <tr>
 *     <td>{formatDate(report.lastModifiedDate)}</td>
 *     <td>{report.serviceName}</td>
 *     <td>{report.userEmail}</td>
 *     <td>{report.action}</td>
 *     <td><Badge variant={getVerbColor(report.requestVerb)}>{report.requestVerb}</Badge></td>
 *   </tr>
 * );
 * ```
 */
export type ServiceReportData = {
  /** Unique identifier for the service report entry */
  id: number;
  
  /** Foreign key reference to the service that generated this report */
  serviceId: number | null;
  
  /** Human-readable name of the service */
  serviceName: string;
  
  /** Email address of the user who triggered the action */
  userEmail: string;
  
  /** Description of the action performed (e.g., "create", "read", "update", "delete") */
  action: string;
  
  /** HTTP verb used for the request (e.g., "GET", "POST", "PUT", "DELETE") */
  requestVerb: string;
  
  /** ISO 8601 timestamp when the report entry was first created */
  createdDate: string;
  
  /** ISO 8601 timestamp when the report entry was last modified */
  lastModifiedDate: string;
};

/**
 * Configuration for service report table columns in React components.
 * 
 * Defines the structure for configurable table displays with support
 * for custom rendering, sorting, and filtering capabilities.
 */
export interface ServiceReportColumn {
  /** Unique identifier for the column */
  key: keyof ServiceReportData;
  
  /** Display label for the column header */
  label: string;
  
  /** Whether the column is sortable */
  sortable?: boolean;
  
  /** Whether the column is filterable */
  filterable?: boolean;
  
  /** Custom width for the column */
  width?: string | number;
  
  /** Custom render function for cell content */
  render?: (value: any, report: ServiceReportData) => React.ReactNode;
  
  /** Whether the column is visible by default */
  visible?: boolean;
}

/**
 * Props interface for React components that display service report data.
 * 
 * Provides a consistent interface for report table and list components
 * with support for common interaction patterns and state management.
 */
export interface ServiceReportDisplayProps {
  /** Array of service report data to display */
  reports: ServiceReportData[];
  
  /** Whether data is currently loading */
  loading?: boolean;
  
  /** Error state for data fetching */
  error?: Error | null;
  
  /** Callback fired when report data needs to be refreshed */
  onRefresh?: () => void;
  
  /** Callback fired when a report entry is selected */
  onReportSelect?: (report: ServiceReportData) => void;
  
  /** Configuration for table columns */
  columns?: ServiceReportColumn[];
  
  /** Whether to show pagination controls */
  showPagination?: boolean;
  
  /** Number of items per page */
  itemsPerPage?: number;
  
  /** Current page number (0-indexed) */
  currentPage?: number;
  
  /** Callback fired when page changes */
  onPageChange?: (page: number) => void;
  
  /** Callback fired when page size changes */
  onPageSizeChange?: (size: number) => void;
}

/**
 * Configuration for service report filters in React components.
 * 
 * Enables advanced filtering capabilities for service report data
 * with support for multiple filter types and custom filter functions.
 */
export interface ServiceReportFilterConfig {
  /** Filter by service name */
  serviceName?: string;
  
  /** Filter by user email */
  userEmail?: string;
  
  /** Filter by action type */
  action?: string;
  
  /** Filter by request verb */
  requestVerb?: string;
  
  /** Filter by date range - start date */
  dateFrom?: string;
  
  /** Filter by date range - end date */
  dateTo?: string;
  
  /** Custom filter function for advanced filtering */
  customFilter?: (report: ServiceReportData) => boolean;
}

/**
 * Props interface for service report filter components.
 * 
 * Provides a standardized interface for filter components that work
 * with service report data and support real-time filtering.
 */
export interface ServiceReportFilterProps {
  /** Current filter configuration */
  filters: ServiceReportFilterConfig;
  
  /** Callback fired when filters change */
  onFiltersChange: (filters: ServiceReportFilterConfig) => void;
  
  /** Whether to show advanced filter options */
  showAdvanced?: boolean;
  
  /** Available service names for filter dropdown */
  availableServices?: string[];
  
  /** Available user emails for filter dropdown */
  availableUsers?: string[];
  
  /** Available actions for filter dropdown */
  availableActions?: string[];
  
  /** Available request verbs for filter dropdown */
  availableVerbs?: string[];
  
  /** Callback fired when filters are reset */
  onReset?: () => void;
}

/**
 * Sorting configuration for service report data.
 * 
 * Defines sorting options that can be applied to service report datasets
 * with support for multiple sort criteria and custom sort functions.
 */
export interface ServiceReportSortConfig {
  /** Field to sort by */
  field: keyof ServiceReportData;
  
  /** Sort direction */
  direction: 'asc' | 'desc';
  
  /** Custom sort function */
  customSort?: (a: ServiceReportData, b: ServiceReportData) => number;
}

/**
 * Export configuration for service report data.
 * 
 * Defines options for exporting service report data to various formats
 * with support for custom formatting and field selection.
 */
export interface ServiceReportExportConfig {
  /** Format for export */
  format: 'csv' | 'json' | 'xlsx';
  
  /** Fields to include in export */
  fields?: (keyof ServiceReportData)[];
  
  /** Custom filename for export */
  filename?: string;
  
  /** Whether to include headers in CSV export */
  includeHeaders?: boolean;
  
  /** Custom field formatters */
  formatters?: Partial<Record<keyof ServiceReportData, (value: any) => string>>;
}

/**
 * Hook state interface for service report data management.
 * 
 * Defines the state structure returned by React hooks that manage
 * service report data, providing a consistent interface for data operations.
 */
export interface ServiceReportHookState {
  /** Current service report data */
  reports: ServiceReportData[];
  
  /** Whether data is currently loading */
  loading: boolean;
  
  /** Error state for data operations */
  error: Error | null;
  
  /** Total number of report entries */
  totalCount: number;
  
  /** Current filter configuration */
  filters: ServiceReportFilterConfig;
  
  /** Current sort configuration */
  sort: ServiceReportSortConfig;
  
  /** Current page number */
  currentPage: number;
  
  /** Items per page */
  pageSize: number;
  
  /** Function to refresh data */
  refresh: () => Promise<void>;
  
  /** Function to update filters */
  setFilters: (filters: ServiceReportFilterConfig) => void;
  
  /** Function to update sorting */
  setSort: (sort: ServiceReportSortConfig) => void;
  
  /** Function to change page */
  setPage: (page: number) => void;
  
  /** Function to change page size */
  setPageSize: (size: number) => void;
  
  /** Function to export data */
  exportData: (config: ServiceReportExportConfig) => Promise<void>;
}

/**
 * API response type for service report data endpoints.
 * 
 * Maintains compatibility with DreamFactory backend API responses
 * while providing type safety for React components that consume this data.
 */
export interface ServiceReportApiResponse {
  /** Array of service report data */
  resource: ServiceReportData[];
  
  /** Metadata about the response */
  meta: {
    /** Total number of report entries available */
    count: number;
    
    /** Number of entries in current response */
    limit: number;
    
    /** Offset for pagination */
    offset: number;
    
    /** Whether there are more entries available */
    hasMore?: boolean;
  };
}

/**
 * Query parameters for service report API requests.
 * 
 * Defines the structure for API query parameters that maintain
 * compatibility with existing backend endpoints while supporting
 * enhanced filtering and pagination in React components.
 */
export interface ServiceReportQueryParams {
  /** Maximum number of entries to return */
  limit?: number;
  
  /** Number of entries to skip */
  offset?: number;
  
  /** Filter string for search functionality */
  filter?: string;
  
  /** Field to sort by */
  orderBy?: keyof ServiceReportData;
  
  /** Sort direction */
  orderDir?: 'asc' | 'desc';
  
  /** Additional filter parameters */
  [key: string]: any;
}

/**
 * Default column configuration for service report tables.
 * 
 * Provides a standard set of columns that can be used by React components
 * to display service report data with consistent formatting and behavior.
 */
export const DEFAULT_SERVICE_REPORT_COLUMNS: ServiceReportColumn[] = [
  {
    key: 'lastModifiedDate',
    label: 'Time',
    sortable: true,
    width: '150px',
    render: (value: string) => new Date(value).toLocaleString(),
  },
  {
    key: 'serviceId',
    label: 'Service ID',
    sortable: true,
    width: '100px',
  },
  {
    key: 'serviceName',
    label: 'Service Name',
    sortable: true,
    filterable: true,
  },
  {
    key: 'userEmail',
    label: 'User Email',
    sortable: true,
    filterable: true,
  },
  {
    key: 'action',
    label: 'Action',
    sortable: true,
    filterable: true,
    width: '120px',
  },
  {
    key: 'requestVerb',
    label: 'Request',
    sortable: true,
    filterable: true,
    width: '100px',
  },
];

/**
 * Type guard to check if an object is a valid ServiceReportData.
 * 
 * Provides runtime type checking for service report data to ensure
 * data integrity in React components and API responses.
 */
export function isServiceReportData(obj: any): obj is ServiceReportData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    (typeof obj.serviceId === 'number' || obj.serviceId === null) &&
    typeof obj.serviceName === 'string' &&
    typeof obj.userEmail === 'string' &&
    typeof obj.action === 'string' &&
    typeof obj.requestVerb === 'string' &&
    typeof obj.createdDate === 'string' &&
    typeof obj.lastModifiedDate === 'string'
  );
}

/**
 * Utility type for creating partial updates to service report filter configuration.
 * 
 * Enables type-safe partial updates to filter configurations in React components
 * while maintaining the structure of the full configuration interface.
 */
export type ServiceReportFilterUpdate = Partial<ServiceReportFilterConfig>;

/**
 * Utility type for service report field accessors.
 * 
 * Provides type-safe access to service report data fields for use in
 * sorting, filtering, and display logic within React components.
 */
export type ServiceReportFieldAccessor<T = any> = (report: ServiceReportData) => T;

/**
 * Enhanced service report data with computed fields for React components.
 * 
 * Extends the base ServiceReportData with additional computed properties
 * that are useful for display and interaction in React components.
 */
export interface EnhancedServiceReportData extends ServiceReportData {
  /** Formatted date string for display */
  formattedDate?: string;
  
  /** Human-readable action description */
  actionDescription?: string;
  
  /** Color code for request verb display */
  verbColor?: string;
  
  /** Whether this report entry is selected */
  selected?: boolean;
}