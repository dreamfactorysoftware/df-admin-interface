/**
 * Schema Search Filter Component
 * 
 * Advanced search and filtering capabilities for database schemas with debounced input,
 * filter presets, and real-time results. Integrates with TanStack Virtual for efficient
 * rendering of large search result sets.
 * 
 * Features:
 * - React Hook Form with Zod schema validators for all user inputs
 * - Real-time validation under 100ms per React/Next.js Integration Requirements
 * - TanStack Virtual implementation for large search result datasets
 * - WCAG 2.1 AA compliance through Headless UI integration
 * - Debounced input handling for optimal performance
 * - Advanced filtering for schema types, table names, field types, and relationships
 * - React Query integration for search API calls with intelligent caching
 * - Keyboard navigation and accessibility features
 */

'use client';

import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery } from '@tanstack/react-query';
import { Combobox, Listbox, Transition } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  CheckIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, debounce } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { 
  SchemaTable, 
  SchemaField, 
  FieldType, 
  TreeNodeType,
  SchemaQueryParams 
} from '@/types/schema';

// ============================================================================
// SEARCH CONFIGURATION AND TYPES
// ============================================================================

/**
 * Search filter configuration with Zod validation
 */
const SearchFilterSchema = z.object({
  query: z.string().min(0).max(255),
  schemaTypes: z.array(z.enum([
    'table', 'view', 'procedure', 'function', 'sequence', 'field', 'relationship'
  ])).default([]),
  fieldTypes: z.array(z.enum([
    'integer', 'bigint', 'decimal', 'float', 'double', 'string', 'text', 
    'boolean', 'date', 'datetime', 'timestamp', 'time', 'binary', 'json', 
    'xml', 'uuid', 'enum', 'set', 'blob', 'clob', 'geometry'
  ])).default([]),
  tableNamePattern: z.string().min(0).max(100).optional(),
  fieldNamePattern: z.string().min(0).max(100).optional(),
  hasRelationships: z.boolean().optional(),
  hasPrimaryKey: z.boolean().optional(),
  hasForeignKey: z.boolean().optional(),
  isIndexed: z.boolean().optional(),
  caseSensitive: z.boolean().default(false),
  useRegex: z.boolean().default(false),
  maxResults: z.number().min(10).max(1000).default(100),
});

export type SearchFilterValues = z.infer<typeof SearchFilterSchema>;

/**
 * Search result item with virtual scrolling metadata
 */
export interface SearchResultItem {
  id: string;
  type: TreeNodeType;
  name: string;
  label: string;
  description?: string;
  tableName?: string;
  fieldName?: string;
  dataType?: FieldType;
  matchScore: number;
  matchHighlight: string;
  metadata: {
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
    isNullable?: boolean;
    hasIndex?: boolean;
    relationshipCount?: number;
    tableRowCount?: number;
  };
  virtualIndex?: number;
  virtualHeight?: number;
}

/**
 * Search response structure
 */
export interface SearchResponse {
  results: SearchResultItem[];
  totalCount: number;
  searchTime: number;
  hasMore: boolean;
  suggestions: string[];
  facets: {
    schemaTypes: Record<TreeNodeType, number>;
    fieldTypes: Record<FieldType, number>;
    tables: Record<string, number>;
  };
}

/**
 * Filter preset configuration
 */
export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  filters: Partial<SearchFilterValues>;
  popular?: boolean;
}

// ============================================================================
// PREDEFINED FILTER PRESETS
// ============================================================================

const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'tables-only',
    name: 'Tables Only',
    description: 'Search only database tables',
    icon: ({ className, ...props }) => (
      <svg className={className} {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v4m4-4v4m4-4v4" />
      </svg>
    ),
    filters: { schemaTypes: ['table'] },
    popular: true,
  },
  {
    id: 'primary-keys',
    name: 'Primary Keys',
    description: 'Fields that are primary keys',
    icon: ({ className, ...props }) => (
      <svg className={className} {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
    filters: { schemaTypes: ['field'], hasPrimaryKey: true },
    popular: true,
  },
  {
    id: 'foreign-keys',
    name: 'Foreign Keys',
    description: 'Fields with foreign key relationships',
    icon: ({ className, ...props }) => (
      <svg className={className} {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    filters: { schemaTypes: ['field'], hasForeignKey: true },
  },
  {
    id: 'text-fields',
    name: 'Text Fields',
    description: 'String and text data types',
    icon: ({ className, ...props }) => (
      <svg className={className} {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    filters: { schemaTypes: ['field'], fieldTypes: ['string', 'text'] },
    popular: true,
  },
  {
    id: 'numeric-fields',
    name: 'Numeric Fields',
    description: 'Integer, decimal, and float types',
    icon: ({ className, ...props }) => (
      <svg className={className} {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
    ),
    filters: { schemaTypes: ['field'], fieldTypes: ['integer', 'bigint', 'decimal', 'float', 'double'] },
  },
  {
    id: 'date-fields',
    name: 'Date/Time Fields',
    description: 'Date, datetime, and timestamp fields',
    icon: ({ className, ...props }) => (
      <svg className={className} {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    filters: { schemaTypes: ['field'], fieldTypes: ['date', 'datetime', 'timestamp', 'time'] },
  },
];

const SCHEMA_TYPE_OPTIONS = [
  { value: 'table', label: 'Tables', icon: '🗃️' },
  { value: 'view', label: 'Views', icon: '👁️' },
  { value: 'procedure', label: 'Procedures', icon: '⚙️' },
  { value: 'function', label: 'Functions', icon: '𝑓' },
  { value: 'sequence', label: 'Sequences', icon: '🔢' },
  { value: 'field', label: 'Fields', icon: '📄' },
  { value: 'relationship', label: 'Relationships', icon: '🔗' },
] as const;

const FIELD_TYPE_OPTIONS = [
  { value: 'string', label: 'String', icon: '📝' },
  { value: 'text', label: 'Text', icon: '📋' },
  { value: 'integer', label: 'Integer', icon: '🔢' },
  { value: 'decimal', label: 'Decimal', icon: '💯' },
  { value: 'boolean', label: 'Boolean', icon: '☑️' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'datetime', label: 'DateTime', icon: '🕐' },
  { value: 'timestamp', label: 'Timestamp', icon: '⏰' },
  { value: 'json', label: 'JSON', icon: '🗂️' },
  { value: 'uuid', label: 'UUID', icon: '🆔' },
] as const;

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Custom hook for debounced search value
 */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for schema search with React Query integration
 */
function useSchemaSearch(
  serviceName: string,
  filters: SearchFilterValues,
  enabled: boolean = true
) {
  const debouncedFilters = useDebouncedValue(filters, 300);

  return useQuery({
    queryKey: ['schema-search', serviceName, debouncedFilters],
    queryFn: async (): Promise<SearchResponse> => {
      if (!debouncedFilters.query && debouncedFilters.schemaTypes.length === 0) {
        return {
          results: [],
          totalCount: 0,
          searchTime: 0,
          hasMore: false,
          suggestions: [],
          facets: {
            schemaTypes: {} as Record<TreeNodeType, number>,
            fieldTypes: {} as Record<FieldType, number>,
            tables: {},
          },
        };
      }

      const searchParams: SchemaQueryParams = {
        serviceName,
        serviceId: 0, // Will be determined by API
        tableFilter: debouncedFilters.tableNamePattern,
        typeFilter: debouncedFilters.schemaTypes as TreeNodeType[],
        page: 1,
        pageSize: debouncedFilters.maxResults,
      };

      // Construct search endpoint with filters
      const searchEndpoint = `/${serviceName}/_schema/search`;
      const response = await apiClient.post<SearchResponse>(searchEndpoint, {
        query: debouncedFilters.query,
        filters: debouncedFilters,
        params: searchParams,
      });

      return response.data || {
        results: [],
        totalCount: 0,
        searchTime: 0,
        hasMore: false,
        suggestions: [],
        facets: {
          schemaTypes: {} as Record<TreeNodeType, number>,
          fieldTypes: {} as Record<FieldType, number>,
          tables: {},
        },
      };
    },
    enabled: enabled && !!serviceName,
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// ============================================================================
// COMPONENT PROPS AND INTERFACE
// ============================================================================

export interface SchemaSearchFilterProps {
  /**
   * Service name for the database connection
   */
  serviceName: string;
  
  /**
   * Initial search filters
   */
  initialFilters?: Partial<SearchFilterValues>;
  
  /**
   * Callback when search results change
   */
  onResultsChange?: (results: SearchResultItem[]) => void;
  
  /**
   * Callback when a search result item is selected
   */
  onItemSelect?: (item: SearchResultItem) => void;
  
  /**
   * Whether the search is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether to show advanced filters by default
   */
  showAdvancedFilters?: boolean;
  
  /**
   * Maximum height for the results container
   */
  maxHeight?: string;
  
  /**
   * Custom CSS class name
   */
  className?: string;
  
  /**
   * Custom placeholder text for search input
   */
  placeholder?: string;
  
  /**
   * Whether to enable virtual scrolling for results
   */
  enableVirtualScrolling?: boolean;
  
  /**
   * Estimated height for virtual scroll items
   */
  estimatedItemHeight?: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Schema Search Filter Component
 */
export const SchemaSearchFilter: React.FC<SchemaSearchFilterProps> = ({
  serviceName,
  initialFilters = {},
  onResultsChange,
  onItemSelect,
  disabled = false,
  showAdvancedFilters = false,
  maxHeight = '400px',
  className,
  placeholder = 'Search tables, fields, and relationships...',
  enableVirtualScrolling = true,
  estimatedItemHeight = 60,
}) => {
  // ========================================================================
  // COMPONENT STATE AND REFS
  // ========================================================================
  
  const [showAdvanced, setShowAdvanced] = React.useState(showAdvancedFilters);
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  
  // ========================================================================
  // FORM CONFIGURATION
  // ========================================================================
  
  const form = useForm<SearchFilterValues>({
    resolver: zodResolver(SearchFilterSchema),
    defaultValues: {
      query: '',
      schemaTypes: [],
      fieldTypes: [],
      tableNamePattern: '',
      fieldNamePattern: '',
      hasRelationships: undefined,
      hasPrimaryKey: undefined,
      hasForeignKey: undefined,
      isIndexed: undefined,
      caseSensitive: false,
      useRegex: false,
      maxResults: 100,
      ...initialFilters,
    },
    mode: 'onChange', // Real-time validation under 100ms
  });

  const { control, watch, setValue, reset, formState: { errors } } = form;
  const watchedValues = watch();

  // ========================================================================
  // SEARCH QUERY INTEGRATION
  // ========================================================================
  
  const {
    data: searchResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useSchemaSearch(serviceName, watchedValues, !disabled);

  const searchResults = searchResponse?.results || [];
  const totalCount = searchResponse?.totalCount || 0;

  // ========================================================================
  // VIRTUAL SCROLLING SETUP
  // ========================================================================
  
  const virtualizer = useVirtualizer({
    count: searchResults.length,
    getScrollElement: () => resultsContainerRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan: 5,
  });

  const virtualItems = enableVirtualScrolling ? virtualizer.getVirtualItems() : [];

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  const handlePresetSelect = useCallback((preset: FilterPreset) => {
    setSelectedPreset(preset.id);
    
    // Apply preset filters
    Object.entries(preset.filters).forEach(([key, value]) => {
      setValue(key as keyof SearchFilterValues, value as any, { shouldValidate: true });
    });
  }, [setValue]);

  const handleClearFilters = useCallback(() => {
    reset();
    setSelectedPreset(null);
  }, [reset]);

  const handleItemSelect = useCallback((item: SearchResultItem) => {
    onItemSelect?.(item);
  }, [onItemSelect]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      searchInputRef.current?.blur();
      setIsSearchFocused(false);
    }
  }, []);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    onResultsChange?.(searchResults);
  }, [searchResults, onResultsChange]);

  // ========================================================================
  // RENDER HELPERS
  // ========================================================================

  const renderSearchInput = () => (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon 
          className="h-5 w-5 text-gray-400 dark:text-gray-500" 
          aria-hidden="true" 
        />
      </div>
      <Controller
        name="query"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            ref={searchInputRef}
            type="text"
            placeholder={placeholder}
            disabled={disabled}
            error={!!errors.query}
            errorMessage={errors.query?.message}
            className={cn(
              'pl-10 pr-4',
              isSearchFocused && 'ring-2 ring-primary-500 border-transparent',
            )}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onKeyDown={handleKeyDown}
            aria-label="Search schema"
            aria-describedby="search-description"
          />
        )}
      />
      {isLoading && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );

  const renderFilterPresets = () => (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Quick Filters
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {FILTER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePresetSelect(preset)}
            disabled={disabled}
            className={cn(
              'flex items-center space-x-2 p-2 text-sm rounded-md transition-colors',
              'border border-gray-200 dark:border-gray-700',
              'hover:bg-gray-50 dark:hover:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              'disabled:opacity-50 disabled:pointer-events-none',
              selectedPreset === preset.id && 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800',
            )}
            aria-pressed={selectedPreset === preset.id}
          >
            <preset.icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="truncate">{preset.name}</span>
            {preset.popular && (
              <Badge variant="secondary" size="sm">Popular</Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderAdvancedFilters = () => (
    <div className="space-y-4">
      {/* Schema Types Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Schema Types
        </label>
        <Controller
          name="schemaTypes"
          control={control}
          render={({ field }) => (
            <Listbox
              value={field.value}
              onChange={field.onChange}
              multiple
              disabled={disabled}
            >
              <div className="relative">
                <Listbox.Button
                  className={cn(
                    'relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm',
                    'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
                    'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  <span className="block truncate">
                    {field.value.length === 0 
                      ? 'Select schema types...' 
                      : `${field.value.length} type${field.value.length === 1 ? '' : 's'} selected`
                    }
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700 sm:text-sm">
                    {SCHEMA_TYPE_OPTIONS.map((option) => (
                      <Listbox.Option
                        key={option.value}
                        value={option.value}
                        className={({ active, selected }) =>
                          cn(
                            'relative cursor-default select-none py-2 pl-3 pr-9',
                            active ? 'bg-primary-600 text-white' : 'text-gray-900 dark:text-gray-100',
                            selected && 'font-semibold'
                          )
                        }
                      >
                        {({ selected }) => (
                          <>
                            <div className="flex items-center space-x-2">
                              <span className="text-base">{option.icon}</span>
                              <span className="block truncate">{option.label}</span>
                            </div>
                            {selected && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          )}
        />
      </div>

      {/* Field Types Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Field Types
        </label>
        <Controller
          name="fieldTypes"
          control={control}
          render={({ field }) => (
            <Listbox
              value={field.value}
              onChange={field.onChange}
              multiple
              disabled={disabled}
            >
              <div className="relative">
                <Listbox.Button
                  className={cn(
                    'relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm',
                    'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
                    'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  <span className="block truncate">
                    {field.value.length === 0 
                      ? 'Select field types...' 
                      : `${field.value.length} type${field.value.length === 1 ? '' : 's'} selected`
                    }
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700 sm:text-sm">
                    {FIELD_TYPE_OPTIONS.map((option) => (
                      <Listbox.Option
                        key={option.value}
                        value={option.value}
                        className={({ active, selected }) =>
                          cn(
                            'relative cursor-default select-none py-2 pl-3 pr-9',
                            active ? 'bg-primary-600 text-white' : 'text-gray-900 dark:text-gray-100',
                            selected && 'font-semibold'
                          )
                        }
                      >
                        {({ selected }) => (
                          <>
                            <div className="flex items-center space-x-2">
                              <span className="text-base">{option.icon}</span>
                              <span className="block truncate">{option.label}</span>
                            </div>
                            {selected && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          )}
        />
      </div>

      {/* Pattern Filters */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Table Name Pattern
          </label>
          <Controller
            name="tableNamePattern"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                placeholder="e.g., user_*, *_logs"
                disabled={disabled}
                error={!!errors.tableNamePattern}
                errorMessage={errors.tableNamePattern?.message}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Field Name Pattern
          </label>
          <Controller
            name="fieldNamePattern"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                placeholder="e.g., *_id, name*"
                disabled={disabled}
                error={!!errors.fieldNamePattern}
                errorMessage={errors.fieldNamePattern?.message}
              />
            )}
          />
        </div>
      </div>

      {/* Boolean Filters */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Field Properties
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'hasPrimaryKey' as const, label: 'Has Primary Key' },
            { name: 'hasForeignKey' as const, label: 'Has Foreign Key' },
            { name: 'hasRelationships' as const, label: 'Has Relationships' },
            { name: 'isIndexed' as const, label: 'Is Indexed' },
          ].map((filter) => (
            <div key={filter.name} className="flex items-center">
              <Controller
                name={filter.name}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <input
                    {...field}
                    type="checkbox"
                    checked={value === true}
                    onChange={(e) => onChange(e.target.checked ? true : undefined)}
                    disabled={disabled}
                    className={cn(
                      'h-4 w-4 text-primary-600 border-gray-300 rounded',
                      'focus:ring-primary-500 focus:ring-2',
                      'dark:border-gray-600 dark:bg-gray-800',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                  />
                )}
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {filter.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Search Options */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Options
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <Controller
              name="caseSensitive"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <input
                  {...field}
                  type="checkbox"
                  checked={value}
                  onChange={onChange}
                  disabled={disabled}
                  className={cn(
                    'h-4 w-4 text-primary-600 border-gray-300 rounded',
                    'focus:ring-primary-500 focus:ring-2',
                    'dark:border-gray-600 dark:bg-gray-800',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                />
              )}
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Case Sensitive
            </label>
          </div>
          <div className="flex items-center">
            <Controller
              name="useRegex"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <input
                  {...field}
                  type="checkbox"
                  checked={value}
                  onChange={onChange}
                  disabled={disabled}
                  className={cn(
                    'h-4 w-4 text-primary-600 border-gray-300 rounded',
                    'focus:ring-primary-500 focus:ring-2',
                    'dark:border-gray-600 dark:bg-gray-800',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                />
              )}
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Use Regex
            </label>
          </div>
        </div>
      </div>

      {/* Max Results */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Max Results: {watchedValues.maxResults}
        </label>
        <Controller
          name="maxResults"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="range"
              min="10"
              max="1000"
              step="10"
              disabled={disabled}
              className={cn(
                'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
                'dark:bg-gray-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            />
          )}
        />
      </div>
    </div>
  );

  const renderSearchResults = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500 dark:text-gray-400">Searching...</span>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Search failed: {error?.message || 'Unknown error'}
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      );
    }

    if (searchResults.length === 0) {
      return (
        <div className="text-center py-8">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">No results found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Try adjusting your search terms or filters
          </p>
        </div>
      );
    }

    if (enableVirtualScrolling && searchResults.length > 50) {
      return (
        <div
          ref={resultsContainerRef}
          className="overflow-auto"
          style={{ height: maxHeight }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualItem) => {
              const item = searchResults[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <SearchResultItem
                    item={item}
                    onClick={() => handleItemSelect(item)}
                    disabled={disabled}
                  />
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2" style={{ maxHeight, overflowY: 'auto' }}>
        {searchResults.map((item) => (
          <SearchResultItem
            key={item.id}
            item={item}
            onClick={() => handleItemSelect(item)}
            disabled={disabled}
          />
        ))}
      </div>
    );
  };

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  return (
    <div className={cn('space-y-4', className)}>
      {/* Hidden description for screen readers */}
      <div id="search-description" className="sr-only">
        Search through database schemas including tables, fields, relationships, and more.
        Use the advanced filters to narrow your search by type, properties, and patterns.
      </div>

      {/* Search Input */}
      <div className="space-y-3">
        {renderSearchInput()}
        
        {/* Search Stats and Controls */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            {totalCount > 0 && (
              <span>
                {totalCount.toLocaleString()} result{totalCount === 1 ? '' : 's'}
                {searchResponse?.searchTime && (
                  <span className="ml-1">
                    ({searchResponse.searchTime}ms)
                  </span>
                )}
              </span>
            )}
            {searchResponse?.hasMore && (
              <Badge variant="info" size="sm">
                More available
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={disabled}
              className="flex items-center space-x-1"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              <span>Filters</span>
            </Button>
            
            {(watchedValues.query || watchedValues.schemaTypes.length > 0 || watchedValues.fieldTypes.length > 0) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                disabled={disabled}
                className="flex items-center space-x-1"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Clear</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          {renderFilterPresets()}
          <hr className="border-gray-200 dark:border-gray-700" />
          {renderAdvancedFilters()}
        </div>
      )}

      {/* Active Filters Display */}
      {(watchedValues.schemaTypes.length > 0 || watchedValues.fieldTypes.length > 0 || selectedPreset) && (
        <div className="flex flex-wrap gap-2">
          {selectedPreset && (
            <Badge variant="info" dismissible onDismiss={() => setSelectedPreset(null)}>
              Preset: {FILTER_PRESETS.find(p => p.id === selectedPreset)?.name}
            </Badge>
          )}
          {watchedValues.schemaTypes.map((type) => (
            <Badge 
              key={type} 
              variant="outline" 
              dismissible 
              onDismiss={() => {
                const newTypes = watchedValues.schemaTypes.filter(t => t !== type);
                setValue('schemaTypes', newTypes, { shouldValidate: true });
              }}
            >
              {SCHEMA_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type}
            </Badge>
          ))}
          {watchedValues.fieldTypes.map((type) => (
            <Badge 
              key={type} 
              variant="secondary" 
              dismissible 
              onDismiss={() => {
                const newTypes = watchedValues.fieldTypes.filter(t => t !== type);
                setValue('fieldTypes', newTypes, { shouldValidate: true });
              }}
            >
              {FIELD_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type}
            </Badge>
          ))}
        </div>
      )}

      {/* Search Results */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
        {renderSearchResults()}
      </div>

      {/* Search Suggestions */}
      {searchResponse?.suggestions && searchResponse.suggestions.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium">Suggestions:</span>
          {searchResponse.suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setValue('query', suggestion, { shouldValidate: true })}
              className="ml-2 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              disabled={disabled}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SEARCH RESULT ITEM COMPONENT
// ============================================================================

interface SearchResultItemProps {
  item: SearchResultItem;
  onClick: () => void;
  disabled?: boolean;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  item,
  onClick,
  disabled = false,
}) => {
  const getTypeIcon = (type: TreeNodeType) => {
    switch (type) {
      case 'table': return '🗃️';
      case 'view': return '👁️';
      case 'field': return '📄';
      case 'relationship': return '🔗';
      case 'procedure': return '⚙️';
      case 'function': return '𝑓';
      case 'sequence': return '🔢';
      default: return '📋';
    }
  };

  const getTypeColor = (type: TreeNodeType) => {
    switch (type) {
      case 'table': return 'text-blue-600 dark:text-blue-400';
      case 'view': return 'text-green-600 dark:text-green-400';
      case 'field': return 'text-purple-600 dark:text-purple-400';
      case 'relationship': return 'text-orange-600 dark:text-orange-400';
      case 'procedure': return 'text-red-600 dark:text-red-400';
      case 'function': return 'text-indigo-600 dark:text-indigo-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full p-3 text-left rounded-lg transition-colors',
        'border border-gray-200 dark:border-gray-700',
        'hover:bg-gray-50 dark:hover:bg-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 text-lg">
          {getTypeIcon(item.type)}
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              <span dangerouslySetInnerHTML={{ __html: item.matchHighlight }} />
            </h4>
            <Badge variant="outline" size="sm" className={cn('text-xs', getTypeColor(item.type))}>
              {item.type}
            </Badge>
          </div>
          
          {item.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
              {item.description}
            </p>
          )}
          
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            {item.tableName && (
              <span>Table: {item.tableName}</span>
            )}
            {item.dataType && (
              <span>Type: {item.dataType}</span>
            )}
            {item.metadata.isPrimaryKey && (
              <Badge variant="success" size="sm">PK</Badge>
            )}
            {item.metadata.isForeignKey && (
              <Badge variant="warning" size="sm">FK</Badge>
            )}
            {item.metadata.hasIndex && (
              <Badge variant="info" size="sm">Indexed</Badge>
            )}
          </div>
        </div>
        
        <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
          {Math.round(item.matchScore * 100)}%
        </div>
      </div>
    </button>
  );
};

export default SchemaSearchFilter;