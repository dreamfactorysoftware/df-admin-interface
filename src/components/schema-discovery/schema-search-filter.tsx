/**
 * @fileoverview Schema Search Filter Component
 * 
 * Advanced search and filtering component for database schemas with debounced input,
 * filter presets, and real-time results. Integrates with TanStack Virtual for 
 * efficient rendering of large search result sets.
 * 
 * Features:
 * - Debounced search input with configurable delay
 * - Advanced filtering by schema types, table names, field types, and relationships
 * - Virtual scrolling for 1000+ result sets
 * - Real-time validation under 100ms
 * - WCAG 2.1 AA compliance
 * - React Query integration for intelligent caching
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { Combobox, Disclosure, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Schema filter options for advanced search
 */
export interface SchemaFilterOptions {
  /** Search query text */
  query: string;
  /** Selected schema types to filter by */
  schemaTypes: SchemaType[];
  /** Table name patterns to include */
  tableNamePatterns: string[];
  /** Field types to filter by */
  fieldTypes: FieldType[];
  /** Relationship patterns to include */
  relationshipPatterns: RelationshipPattern[];
  /** Include system tables */
  includeSystemTables: boolean;
  /** Include views */
  includeViews: boolean;
  /** Include procedures */
  includeProcedures: boolean;
  /** Case sensitive search */
  caseSensitive: boolean;
  /** Use regular expressions */
  useRegex: boolean;
}

/**
 * Schema search result item
 */
export interface SchemaSearchResult {
  /** Unique identifier */
  id: string;
  /** Schema name */
  schemaName: string;
  /** Table name */
  tableName: string;
  /** Table type (table, view, procedure) */
  tableType: 'table' | 'view' | 'procedure' | 'function';
  /** Field information if searching within fields */
  field?: {
    name: string;
    type: FieldType;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    isNullable: boolean;
  };
  /** Relationship information if applicable */
  relationship?: {
    type: RelationshipPattern;
    targetTable: string;
    targetSchema: string;
  };
  /** Match score for ranking */
  matchScore: number;
  /** Highlighted text for display */
  highlightedText: string;
}

/**
 * Schema types supported by the filter
 */
export type SchemaType = 
  | 'mysql' 
  | 'postgresql' 
  | 'sqlserver' 
  | 'oracle' 
  | 'mongodb' 
  | 'snowflake'
  | 'sqlite';

/**
 * Field types for filtering
 */
export type FieldType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'date' 
  | 'datetime' 
  | 'timestamp'
  | 'text' 
  | 'json' 
  | 'binary' 
  | 'uuid' 
  | 'enum'
  | 'decimal'
  | 'float'
  | 'integer'
  | 'bigint';

/**
 * Relationship patterns for filtering
 */
export type RelationshipPattern = 
  | 'one-to-one' 
  | 'one-to-many' 
  | 'many-to-one' 
  | 'many-to-many'
  | 'self-referencing'
  | 'polymorphic';

/**
 * Filter preset configurations
 */
export interface FilterPreset {
  /** Preset identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of the preset */
  description: string;
  /** Icon for the preset */
  icon: React.ComponentType<{ className?: string }>;
  /** Filter configuration */
  filters: Partial<SchemaFilterOptions>;
}

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

/**
 * Zod schema for filter form validation
 */
const schemaFilterSchema = z.object({
  query: z.string().min(0).max(500),
  schemaTypes: z.array(z.enum([
    'mysql', 'postgresql', 'sqlserver', 'oracle', 
    'mongodb', 'snowflake', 'sqlite'
  ])).default([]),
  tableNamePatterns: z.array(z.string()).default([]),
  fieldTypes: z.array(z.enum([
    'string', 'number', 'boolean', 'date', 'datetime', 'timestamp',
    'text', 'json', 'binary', 'uuid', 'enum', 'decimal', 'float',
    'integer', 'bigint'
  ])).default([]),
  relationshipPatterns: z.array(z.enum([
    'one-to-one', 'one-to-many', 'many-to-one', 'many-to-many',
    'self-referencing', 'polymorphic'
  ])).default([]),
  includeSystemTables: z.boolean().default(false),
  includeViews: z.boolean().default(true),
  includeProcedures: z.boolean().default(false),
  caseSensitive: z.boolean().default(false),
  useRegex: z.boolean().default(false),
});

type SchemaFilterFormData = z.infer<typeof schemaFilterSchema>;

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Debounce delay for search input (ms)
 */
const SEARCH_DEBOUNCE_DELAY = 300;

/**
 * Maximum number of results to display
 */
const MAX_RESULTS = 1000;

/**
 * Virtual scrolling item height
 */
const ITEM_HEIGHT = 64;

/**
 * Default filter presets
 */
const DEFAULT_FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'all-tables',
    name: 'All Tables',
    description: 'Show all tables and views',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75A1.125 1.125 0 004.5 18.375m-1.125 1.125h2.25m13.5-1.125a1.125 1.125 0 00-1.125-1.125m1.125 1.125h2.25m-13.5-1.125H9c.621 0 1.125.504 1.125 1.125v.375c0 .621-.504 1.125-1.125 1.125h-.375A1.125 1.125 0 017.5 18.375v-.375m13.5-1.125V18.375A1.125 1.125 0 0019.5 19.5v.375c0 .621.504 1.125 1.125 1.125h.375a1.125 1.125 0 001.125-1.125V18.375m-13.5-1.125V6.75A1.125 1.125 0 017.5 5.625h.375c0-.621.504-1.125 1.125-1.125H9c.621 0 1.125.504 1.125 1.125v.375c0 .621-.504 1.125-1.125 1.125H7.5V19.5z" />
      </svg>
    ),
    filters: {
      includeViews: true,
      includeSystemTables: false,
      includeProcedures: false,
    },
  },
  {
    id: 'user-tables',
    name: 'User Tables Only',
    description: 'Show only user-created tables',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    filters: {
      includeViews: false,
      includeSystemTables: false,
      includeProcedures: false,
    },
  },
  {
    id: 'relationships',
    name: 'Tables with Relationships',
    description: 'Show tables that have foreign key relationships',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
    filters: {
      relationshipPatterns: ['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'],
      includeViews: false,
      includeSystemTables: false,
    },
  },
  {
    id: 'primary-keys',
    name: 'Primary Key Fields',
    description: 'Show tables with primary key fields',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159-.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    filters: {
      includeViews: false,
      includeSystemTables: false,
    },
  },
];

/**
 * Available schema types with labels
 */
const SCHEMA_TYPE_OPTIONS = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'sqlserver', label: 'SQL Server' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'sqlite', label: 'SQLite' },
] as const;

/**
 * Available field types with labels
 */
const FIELD_TYPE_OPTIONS = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'DateTime' },
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'text', label: 'Text' },
  { value: 'json', label: 'JSON' },
  { value: 'binary', label: 'Binary' },
  { value: 'uuid', label: 'UUID' },
  { value: 'enum', label: 'Enum' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'float', label: 'Float' },
  { value: 'integer', label: 'Integer' },
  { value: 'bigint', label: 'BigInt' },
] as const;

/**
 * Available relationship patterns with labels
 */
const RELATIONSHIP_PATTERN_OPTIONS = [
  { value: 'one-to-one', label: 'One-to-One' },
  { value: 'one-to-many', label: 'One-to-Many' },
  { value: 'many-to-one', label: 'Many-to-One' },
  { value: 'many-to-many', label: 'Many-to-Many' },
  { value: 'self-referencing', label: 'Self-Referencing' },
  { value: 'polymorphic', label: 'Polymorphic' },
] as const;

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

/**
 * Custom hook for debounced search value
 */
function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

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
 * Custom hook for schema search API integration
 * Note: This is a placeholder implementation that would integrate with the actual API client
 */
function useSchemaSearch(filters: SchemaFilterOptions, enabled: boolean = true) {
  return useQuery({
    queryKey: ['schema-search', filters],
    queryFn: async (): Promise<SchemaSearchResult[]> => {
      // TODO: Replace with actual API client call
      // This is a mock implementation for demonstration
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
      
      // Mock search results
      const mockResults: SchemaSearchResult[] = [];
      
      // Generate mock results based on query
      for (let i = 0; i < Math.min(50, MAX_RESULTS); i++) {
        mockResults.push({
          id: `result-${i}`,
          schemaName: 'main',
          tableName: `table_${i + 1}`,
          tableType: i % 4 === 0 ? 'view' : 'table',
          field: i % 3 === 0 ? {
            name: `field_${i}`,
            type: 'string',
            isPrimaryKey: i % 10 === 0,
            isForeignKey: i % 7 === 0,
            isNullable: i % 2 === 0,
          } : undefined,
          relationship: i % 5 === 0 ? {
            type: 'one-to-many',
            targetTable: `target_table_${i}`,
            targetSchema: 'main',
          } : undefined,
          matchScore: Math.random() * 100,
          highlightedText: `table_${i + 1}`,
        });
      }
      
      return mockResults.sort((a, b) => b.matchScore - a.matchScore);
    },
    enabled: enabled && filters.query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

export interface SchemaSearchFilterProps {
  /** Callback when search results change */
  onResultsChange?: (results: SchemaSearchResult[]) => void;
  /** Callback when a result is selected */
  onResultSelect?: (result: SchemaSearchResult) => void;
  /** Whether the search is currently loading */
  loading?: boolean;
  /** Custom filter presets */
  customPresets?: FilterPreset[];
  /** Whether to show advanced filters */
  showAdvancedFilters?: boolean;
  /** Maximum height for results container */
  maxHeight?: number;
  /** Custom CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Schema Search Filter Component
 * 
 * Provides advanced search and filtering capabilities for database schemas
 * with debounced input, filter presets, and real-time results.
 */
export function SchemaSearchFilter({
  onResultsChange,
  onResultSelect,
  loading: externalLoading = false,
  customPresets = [],
  showAdvancedFilters = true,
  maxHeight = 600,
  className = '',
  testId = 'schema-search-filter',
}: SchemaSearchFilterProps) {
  // =============================================================================
  // STATE AND REFS
  // =============================================================================

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  // Combine default and custom presets
  const allPresets = useMemo(() => [...DEFAULT_FILTER_PRESETS, ...customPresets], [customPresets]);

  // =============================================================================
  // FORM MANAGEMENT
  // =============================================================================

  const form = useForm<SchemaFilterFormData>({
    resolver: zodResolver(schemaFilterSchema),
    defaultValues: {
      query: '',
      schemaTypes: [],
      tableNamePatterns: [],
      fieldTypes: [],
      relationshipPatterns: [],
      includeSystemTables: false,
      includeViews: true,
      includeProcedures: false,
      caseSensitive: false,
      useRegex: false,
    },
    mode: 'onChange', // Enable real-time validation
  });

  const { control, watch, setValue, reset, formState: { errors, isValid } } = form;
  const watchedValues = watch();

  // =============================================================================
  // DEBOUNCED SEARCH
  // =============================================================================

  const debouncedFilters = useDebounced(watchedValues, SEARCH_DEBOUNCE_DELAY);

  // =============================================================================
  // SEARCH QUERY
  // =============================================================================

  const {
    data: searchResults = [],
    isLoading: searchLoading,
    error: searchError,
  } = useSchemaSearch(debouncedFilters as SchemaFilterOptions, debouncedFilters.query.length > 0);

  const isLoading = externalLoading || searchLoading;

  // =============================================================================
  // VIRTUAL SCROLLING
  // =============================================================================

  const virtualizer = useVirtualizer({
    count: searchResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 10,
  });

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Notify parent of results changes
  useEffect(() => {
    onResultsChange?.(searchResults);
  }, [searchResults, onResultsChange]);

  // Show/hide results based on query and focus
  useEffect(() => {
    setShowResults(debouncedFilters.query.length > 0 && searchResults.length > 0);
  }, [debouncedFilters.query, searchResults.length]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Apply a filter preset
   */
  const handleApplyPreset = useCallback((preset: FilterPreset) => {
    setSelectedPreset(preset.id);
    
    // Apply preset filters
    Object.entries(preset.filters).forEach(([key, value]) => {
      if (value !== undefined) {
        setValue(key as keyof SchemaFilterFormData, value, { shouldValidate: true });
      }
    });
  }, [setValue]);

  /**
   * Clear all filters
   */
  const handleClearFilters = useCallback(() => {
    reset();
    setSelectedPreset(null);
  }, [reset]);

  /**
   * Handle result selection
   */
  const handleResultSelect = useCallback((result: SchemaSearchResult) => {
    onResultSelect?.(result);
    setShowResults(false);
  }, [onResultSelect]);

  /**
   * Handle search input changes
   */
  const handleSearchChange = useCallback((value: string) => {
    setValue('query', value, { shouldValidate: true });
    setSelectedPreset(null); // Clear preset selection when manually searching
  }, [setValue]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  /**
   * Render a multi-select combobox
   */
  const renderMultiSelect = useCallback(<T extends string>(
    name: keyof SchemaFilterFormData,
    options: readonly { value: T; label: string }[],
    label: string,
    placeholder: string
  ) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <Combobox
            value={field.value as T[]}
            onChange={field.onChange}
            multiple
          >
            <div className="relative">
              <Combobox.Button className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                <span className="block truncate">
                  {(field.value as T[]).length > 0 
                    ? `${(field.value as T[]).length} selected`
                    : placeholder
                  }
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </span>
              </Combobox.Button>
              
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-800 py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {options.map((option) => (
                    <Combobox.Option
                      key={option.value}
                      value={option.value}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                          active 
                            ? 'bg-primary-600 text-white' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {option.label}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                              <CheckIcon className="h-4 w-4" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>
        </div>
      )}
    />
  ), [control]);

  /**
   * Render search result item
   */
  const renderResultItem = useCallback((index: number) => {
    const result = searchResults[index];
    if (!result) return null;

    return (
      <div
        key={result.id}
        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
        onClick={() => handleResultSelect(result)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleResultSelect(result);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Select ${result.tableName} from ${result.schemaName} schema`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {result.schemaName}.{result.tableName}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              result.tableType === 'table' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                : result.tableType === 'view'
                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                : 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
            }`}>
              {result.tableType}
            </span>
          </div>
          
          {result.field && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Field: {result.field.name} ({result.field.type})
              {result.field.isPrimaryKey && ' • Primary Key'}
              {result.field.isForeignKey && ' • Foreign Key'}
            </div>
          )}
          
          {result.relationship && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Relationship: {result.relationship.type} → {result.relationship.targetTable}
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
          Score: {Math.round(result.matchScore)}
        </div>
      </div>
    );
  }, [searchResults, handleResultSelect]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className={`schema-search-filter ${className}`} data-testid={testId}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        
        <Controller
          name="query"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-3 pl-10 pr-12 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Search tables, fields, and relationships..."
              aria-label="Search schema"
              aria-describedby={errors.query ? 'query-error' : undefined}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          )}
        />
        
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full" />
          </div>
        )}
        
        {watchedValues.query && !isLoading && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => handleSearchChange('')}
            aria-label="Clear search"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {errors.query && (
        <p id="query-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
          {errors.query.message}
        </p>
      )}

      {/* Filter Presets */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Filters</h3>
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Clear All
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {allPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className={`flex items-center space-x-2 p-3 rounded-lg border text-left transition-colors ${
                selectedPreset === preset.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              aria-pressed={selectedPreset === preset.id}
            >
              <preset.icon className="h-4 w-4 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{preset.name}</div>
                <div className="text-xs opacity-75">{preset.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Disclosure>
          {({ open }) => (
            <div className="mt-4">
              <Disclosure.Button className="flex w-full items-center justify-between rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center space-x-2">
                  <AdjustmentsHorizontalIcon className="h-4 w-4" />
                  <span>Advanced Filters</span>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </Disclosure.Button>
              
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Disclosure.Panel className="mt-2 space-y-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
                  {/* Schema Types */}
                  {renderMultiSelect('schemaTypes', SCHEMA_TYPE_OPTIONS, 'Schema Types', 'Select schema types...')}
                  
                  {/* Field Types */}
                  {renderMultiSelect('fieldTypes', FIELD_TYPE_OPTIONS, 'Field Types', 'Select field types...')}
                  
                  {/* Relationship Patterns */}
                  {renderMultiSelect('relationshipPatterns', RELATIONSHIP_PATTERN_OPTIONS, 'Relationship Patterns', 'Select relationship patterns...')}
                  
                  {/* Boolean Options */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Controller
                        name="includeSystemTables"
                        control={control}
                        render={({ field }) => (
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Include system tables</span>
                          </label>
                        )}
                      />
                      
                      <Controller
                        name="includeViews"
                        control={control}
                        render={({ field }) => (
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Include views</span>
                          </label>
                        )}
                      />
                      
                      <Controller
                        name="includeProcedures"
                        control={control}
                        render={({ field }) => (
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Include procedures</span>
                          </label>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Controller
                        name="caseSensitive"
                        control={control}
                        render={({ field }) => (
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Case sensitive</span>
                          </label>
                        )}
                      />
                      
                      <Controller
                        name="useRegex"
                        control={control}
                        render={({ field }) => (
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Use regex</span>
                          </label>
                        )}
                      />
                    </div>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
      )}

      {/* Search Results */}
      {showResults && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Search Results ({searchResults.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowResults(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close results"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          
          <div
            ref={parentRef}
            className="relative overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
            style={{ height: `${Math.min(maxHeight, searchResults.length * ITEM_HEIGHT)}px` }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => (
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
                  {renderResultItem(virtualItem.index)}
                </div>
              ))}
            </div>
          </div>
          
          {searchError && (
            <div className="mt-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">
                Error loading search results. Please try again.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SchemaSearchFilter;