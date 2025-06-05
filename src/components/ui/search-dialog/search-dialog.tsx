/**
 * Global Search Dialog Component
 * 
 * Comprehensive React 19 search dialog implementation with WCAG 2.1 AA accessibility compliance.
 * Provides command palette-style search functionality with real-time results, recent queries,
 * keyboard navigation, and responsive design. Replaces Angular df-search-dialog component
 * with modern React patterns including debounced search, React Query data fetching,
 * and proper focus management.
 * 
 * Features:
 * - Headless UI Combobox and Dialog primitives for accessible search and modal patterns
 * - Tailwind CSS 4.1+ styling with WCAG 2.1 AA compliant design tokens
 * - React Hook Form integration with debounced input for real-time validation under 100ms
 * - @tanstack/react-query for search API caching with intelligent revalidation strategies
 * - Keyboard navigation support including arrow keys, enter, escape, and global shortcuts
 * - Mobile-responsive design supporting touch interactions and different screen sizes
 * - ARIA compliance with proper labeling, announcements, and focus management for screen readers
 * - Recent searches persistence using local storage with automatic cleanup
 * - Cmd/Ctrl+K global keyboard shortcut integration
 * - Smooth animations using Tailwind CSS transitions for enhanced user experience
 * 
 * @fileoverview Global search dialog component for React 19 DreamFactory Admin Interface
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

'use client';

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  startTransition,
  useId,
  forwardRef,
  useImperativeHandle
} from 'react';
import { 
  Combobox, 
  Dialog, 
  Transition 
} from '@headlessui/react';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  ClockIcon,
  CommandLineIcon,
  DatabaseIcon,
  UserGroupIcon,
  CogIcon,
  DocumentTextIcon,
  FolderIcon,
  ChevronRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  type SearchDialogProps,
  type SearchDialogRef,
  type SearchDialogState,
  type SearchResult,
  type SearchResultGroup,
  type SearchResultType,
  type SearchKeyboardEvent,
  SearchResultType as ResultType,
  isSearchResult,
  isSearchResultGroup
} from './types';

/**
 * Default configuration for search dialog behavior and accessibility
 */
const DEFAULT_CONFIG = {
  debounceDelay: 150,
  minQueryLength: 2,
  maxResultsPerGroup: 8,
  maxRecentSearches: 10,
  accessibility: {
    keyboard: {
      arrowKeyNavigation: true,
      enterKeySelection: true,
      escapeKeyClose: true,
      tabKeyNavigation: true,
      announceNavigation: true,
    },
    screenReader: {
      announceResultCount: true,
      announceSelection: true,
      announceStatus: true,
      liveRegionPoliteness: 'polite' as const,
      includeDescriptions: true,
    },
    focus: {
      trapFocus: true,
      restoreFocus: true,
      autoFocusInput: true,
      focusVisible: true,
    },
    touch: {
      minTouchTargetSize: 44,
      gestureSupport: true,
      swipeNavigation: false,
      hapticFeedback: false,
    },
  },
  responsive: {
    mobile: {
      fullScreen: true,
      showSuggestions: true,
      voiceSearchSupported: false,
      optimizeForVirtualKeyboard: true,
      touchFriendlySpacing: true,
    },
    tablet: {
      dialogWidth: '85%',
      showFilterSidebar: false,
      useGridLayout: false,
    },
    desktop: {
      maxDialogWidth: '600px',
      hoverPreviews: true,
      showKeyboardShortcuts: true,
      multiColumnLayout: false,
    },
  },
} as const;

/**
 * Result type icons mapping for consistent visual representation
 */
const RESULT_TYPE_ICONS = {
  [ResultType.DATABASE_SERVICE]: DatabaseIcon,
  [ResultType.DATABASE_TABLE]: FolderIcon,
  [ResultType.DATABASE_FIELD]: CommandLineIcon,
  [ResultType.USER]: UserGroupIcon,
  [ResultType.ADMIN]: UserGroupIcon,
  [ResultType.ROLE]: CogIcon,
  [ResultType.SYSTEM_SETTING]: CogIcon,
  [ResultType.API_DOCUMENTATION]: DocumentTextIcon,
  [ResultType.API_ENDPOINT]: CommandLineIcon,
  [ResultType.APPLICATION]: CogIcon,
  [ResultType.EVENT_SCRIPT]: CommandLineIcon,
  [ResultType.EMAIL_TEMPLATE]: DocumentTextIcon,
  [ResultType.FILE]: FolderIcon,
  [ResultType.REPORT]: DocumentTextIcon,
  [ResultType.SCHEDULED_TASK]: ClockIcon,
  [ResultType.LOOKUP_KEY]: CogIcon,
  [ResultType.API_LIMIT]: CogIcon,
} as const;

/**
 * Hook for managing recent searches with local storage persistence
 */
function useRecentSearches(maxCount: number = DEFAULT_CONFIG.maxRecentSearches) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const storageKey = 'df-admin-recent-searches';

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, maxCount));
        }
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
    }
  }, [maxCount]);

  // Add new search to recent searches
  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim() || query.length < 2) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(search => search !== query);
      const updated = [query, ...filtered].slice(0, maxCount);
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save recent searches:', error);
      }
      
      return updated;
    });
  }, [maxCount]);

  // Clear all recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear recent searches:', error);
    }
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };
}

/**
 * Hook for debounced search functionality with React Query integration
 */
function useSearchQuery(query: string, debounceDelay: number, minQueryLength: number) {
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [query, debounceDelay]);

  // Search API query with React Query
  const searchQuery = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async (): Promise<SearchResultGroup[]> => {
      if (!debouncedQuery || debouncedQuery.length < minQueryLength) {
        return [];
      }

      // Simulate API call for development
      // In production, this would call the actual DreamFactory search API
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Mock search results based on query
      const mockResults: SearchResultGroup[] = [
        {
          type: ResultType.DATABASE_SERVICE,
          title: 'Database Services',
          description: 'Available database connections',
          icon: DatabaseIcon,
          results: [
            {
              id: 'mysql-main',
              type: ResultType.DATABASE_SERVICE,
              title: 'MySQL Main Database',
              subtitle: 'mysql://localhost:3306',
              description: 'Primary application database',
              href: '/api-connections/database/mysql-main',
              badge: '12 tables',
              badgeColor: 'primary',
              metadata: {
                database: {
                  connectionStatus: 'connected',
                  tableCount: 12,
                  fieldCount: 84,
                  engine: 'MySQL 8.0',
                },
              },
            },
          ],
        },
        {
          type: ResultType.DATABASE_TABLE,
          title: 'Database Tables',
          description: 'Tables matching your search',
          icon: FolderIcon,
          results: [
            {
              id: 'users-table',
              type: ResultType.DATABASE_TABLE,
              title: 'users',
              subtitle: 'mysql-main database',
              description: 'User accounts and profiles',
              href: '/api-connections/database/mysql-main/schema/users',
              badge: '8 fields',
              badgeColor: 'secondary',
              parent: {
                id: 'mysql-main',
                title: 'MySQL Main Database',
                type: ResultType.DATABASE_SERVICE,
              },
            },
          ],
        },
      ];

      // Filter results based on query
      return mockResults.filter(group => 
        group.results.some(result => 
          result.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          result.subtitle?.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
      ).map(group => ({
        ...group,
        results: group.results.filter(result => 
          result.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          result.subtitle?.toLowerCase().includes(debouncedQuery.toLowerCase())
        ),
      }));
    },
    enabled: debouncedQuery.length >= minQueryLength,
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
  });

  return {
    debouncedQuery,
    searchResults: searchQuery.data || [],
    isSearching: searchQuery.isLoading,
    searchError: searchQuery.error as Error | null,
    refetch: searchQuery.refetch,
  };
}

/**
 * Hook for keyboard navigation within the search dialog
 */
function useSearchNavigation(
  results: SearchResultGroup[],
  onSelect: (result: SearchResult) => void,
  onClose: () => void
) {
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  // Calculate total results for navigation
  const flatResults = useMemo(() => {
    const flat: Array<{ result: SearchResult; groupIndex: number; resultIndex: number }> = [];
    results.forEach((group, groupIndex) => {
      group.results.forEach((result, resultIndex) => {
        flat.push({ result, groupIndex, resultIndex });
      });
    });
    return flat;
  }, [results]);

  const selectedResult = flatResults[selectedResultIndex]?.result;

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedResultIndex(prev => 
          prev < flatResults.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setSelectedResultIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
        
      case 'Enter':
        event.preventDefault();
        if (selectedResult) {
          onSelect(selectedResult);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  }, [flatResults, selectedResult, onSelect, onClose]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedGroupIndex(0);
    setSelectedResultIndex(0);
  }, [results]);

  return {
    selectedGroupIndex,
    selectedResultIndex,
    selectedResult,
    handleKeyDown,
    setSelectedResultIndex,
  };
}

/**
 * Individual search result item component
 */
const SearchResultItem = React.memo<{
  result: SearchResult;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}>(function SearchResultItem({ result, isSelected, onSelect, index }) {
  const Icon = RESULT_TYPE_ICONS[result.type] || CommandLineIcon;
  const resultId = useId();

  return (
    <Combobox.Option
      value={result}
      className={({ active }) =>
        cn(
          'flex items-center px-4 py-3 cursor-pointer transition-colors duration-150',
          'border-b border-gray-100 dark:border-gray-700 last:border-b-0',
          'min-h-[44px]', // WCAG touch target size
          active || isSelected
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100'
            : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
        )
      }
      onClick={onSelect}
      data-testid={`search-result-${result.type}-${result.id}`}
      aria-label={`${result.title}${result.subtitle ? ` - ${result.subtitle}` : ''}${result.description ? `. ${result.description}` : ''}`}
      role="option"
      aria-selected={isSelected}
      id={resultId}
    >
      {({ active }) => (
        <>
          {/* Icon */}
          <div className="flex-shrink-0 mr-3">
            <Icon 
              className={cn(
                'h-5 w-5',
                active || isSelected
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 dark:text-gray-500'
              )}
              aria-hidden="true"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className={cn(
                  'text-sm font-medium truncate',
                  active || isSelected
                    ? 'text-primary-900 dark:text-primary-100'
                    : 'text-gray-900 dark:text-gray-100'
                )}>
                  {result.title}
                </p>
                {result.subtitle && (
                  <p className={cn(
                    'text-xs truncate mt-0.5',
                    active || isSelected
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-gray-500 dark:text-gray-400'
                  )}>
                    {result.subtitle}
                  </p>
                )}
              </div>

              {/* Badge */}
              {result.badge && (
                <span className={cn(
                  'ml-2 px-2 py-1 text-xs font-medium rounded-full flex-shrink-0',
                  {
                    'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200': result.badgeColor === 'primary',
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': result.badgeColor === 'secondary',
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': result.badgeColor === 'success',
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': result.badgeColor === 'warning',
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': result.badgeColor === 'error',
                  }
                )}>
                  {result.badge}
                </span>
              )}
            </div>

            {/* Parent context */}
            {result.parent && (
              <p className={cn(
                'text-xs mt-1 truncate',
                active || isSelected
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              )}>
                in {result.parent.title}
              </p>
            )}
          </div>

          {/* Navigation arrow */}
          <div className="flex-shrink-0 ml-2">
            <ChevronRightIcon 
              className={cn(
                'h-4 w-4',
                active || isSelected
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 dark:text-gray-500'
              )}
              aria-hidden="true"
            />
          </div>
        </>
      )}
    </Combobox.Option>
  );
});

/**
 * Search result group component
 */
const SearchResultGroup = React.memo<{
  group: SearchResultGroup;
  selectedResultIndex: number;
  onSelectResult: (result: SearchResult) => void;
  startIndex: number;
}>(function SearchResultGroup({ group, selectedResultIndex, onSelectResult, startIndex }) {
  const GroupIcon = group.icon as React.ComponentType<{ className?: string }> || FolderIcon;
  const groupId = useId();

  return (
    <div 
      className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
      data-testid={`search-group-${group.type}`}
      role="group"
      aria-labelledby={groupId}
    >
      {/* Group Header */}
      <div 
        className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700"
        id={groupId}
      >
        <div className="flex items-center">
          <GroupIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" aria-hidden="true" />
          <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            {group.title}
          </h3>
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            ({group.results.length})
          </span>
        </div>
        {group.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {group.description}
          </p>
        )}
      </div>

      {/* Group Results */}
      <div role="listbox" aria-label={`${group.title} results`}>
        {group.results.map((result, index) => (
          <SearchResultItem
            key={result.id}
            result={result}
            isSelected={selectedResultIndex === startIndex + index}
            onSelect={() => onSelectResult(result)}
            index={startIndex + index}
          />
        ))}
      </div>
    </div>
  );
});

/**
 * Recent searches component
 */
const RecentSearches = React.memo<{
  recentSearches: string[];
  onSelectRecent: (query: string) => void;
  onClearRecent: () => void;
}>(function RecentSearches({ recentSearches, onSelectRecent, onClearRecent }) {
  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <div 
      className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
      data-testid="recent-searches-section"
      role="region"
      aria-label="Recent searches"
    >
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide flex items-center">
            <ClockIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Recent Searches
          </h3>
          <button
            onClick={onClearRecent}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 py-1"
            data-testid="clear-recent-searches"
            aria-label="Clear all recent searches"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="px-4 py-2 space-y-1">
        {recentSearches.map((search, index) => (
          <button
            key={`${search}-${index}`}
            onClick={() => onSelectRecent(search)}
            className="block w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[32px]"
            data-testid={`recent-search-${index}`}
            aria-label={`Search for "${search}"`}
          >
            {search}
          </button>
        ))}
      </div>
    </div>
  );
});

/**
 * Empty state component
 */
const EmptyState = React.memo<{
  query: string;
  isSearching: boolean;
  error?: Error | null;
  onRetry?: () => void;
}>(function EmptyState({ query, isSearching, error, onRetry }) {
  if (isSearching) {
    return (
      <div 
        className="flex items-center justify-center py-12"
        data-testid="search-loading-state"
        role="status"
        aria-live="polite"
      >
        <ArrowPathIcon className="h-6 w-6 animate-spin text-primary-600 mr-3" aria-hidden="true" />
        <span className="text-gray-600 dark:text-gray-400">Searching...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-12 px-4"
        data-testid="search-error-state"
        role="alert"
        aria-live="assertive"
      >
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
          Search failed: {error.message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-3 py-1"
            aria-label="Retry search"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (query.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-12 px-4 text-center"
        data-testid="search-initial-state"
      >
        <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Search DreamFactory
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Find database services, tables, users, settings, and more across your DreamFactory instance.
        </p>
        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border">⌘K</kbd> to open search
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      data-testid="search-no-results-state"
      role="status"
      aria-live="polite"
    >
      <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        No results found
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        We couldn't find anything matching "<span className="font-medium">{query}</span>". 
        Try a different search term or check your spelling.
      </p>
    </div>
  );
});

/**
 * Main SearchDialog component
 */
export const SearchDialog = forwardRef<SearchDialogRef, SearchDialogProps>(
  function SearchDialog({
    open,
    onOpenChange,
    initialQuery = '',
    placeholder = 'Search databases, tables, users...',
    onSelectResult,
    onClose,
    config = {},
    customization = {},
    eventHandlers = {},
    className,
    'data-testid': dataTestId,
    ...props
  }, ref) {
    // Merge configuration with defaults
    const mergedConfig = useMemo(() => ({
      ...DEFAULT_CONFIG,
      ...config,
      accessibility: { ...DEFAULT_CONFIG.accessibility, ...config.accessibility },
      responsive: { ...DEFAULT_CONFIG.responsive, ...config.responsive },
    }), [config]);

    // State management
    const [query, setQuery] = useState(initialQuery);
    const [isVisible, setIsVisible] = useState(false);
    const queryClient = useQueryClient();
    
    // Refs for focus management
    const searchInputRef = useRef<HTMLInputElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Custom hooks
    const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches(
      mergedConfig.maxRecentSearches
    );
    
    const { 
      debouncedQuery, 
      searchResults, 
      isSearching, 
      searchError, 
      refetch 
    } = useSearchQuery(
      query, 
      mergedConfig.debounceDelay, 
      mergedConfig.minQueryLength
    );

    const {
      selectedResultIndex,
      selectedResult,
      handleKeyDown,
      setSelectedResultIndex,
    } = useSearchNavigation(searchResults, onSelectResult, () => onOpenChange(false));

    // Form management
    const { control, watch, setValue } = useForm({
      defaultValues: { query: initialQuery },
    });

    const watchedQuery = watch('query');

    // Sync form query with local state
    useEffect(() => {
      setQuery(watchedQuery);
      eventHandlers.onQueryChange?.(watchedQuery);
    }, [watchedQuery, eventHandlers]);

    // Handle dialog open/close
    useEffect(() => {
      if (open) {
        // Store previous focus for restoration
        previousFocusRef.current = document.activeElement as HTMLElement;
        setIsVisible(true);
        
        // Auto-focus input if configured
        if (mergedConfig.accessibility.focus.autoFocusInput) {
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 100);
        }
      } else {
        setIsVisible(false);
        
        // Restore focus if configured
        if (mergedConfig.accessibility.focus.restoreFocus && previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      }
    }, [open, mergedConfig.accessibility.focus]);

    // Global keyboard shortcut handler
    useEffect(() => {
      const handleGlobalKeyDown = (event: KeyboardEvent) => {
        // Cmd/Ctrl+K to open search
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault();
          onOpenChange(true);
        }
      };

      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [onOpenChange]);

    // Handle result selection
    const handleSelectResult = useCallback((result: SearchResult) => {
      // Add to recent searches
      if (query.trim()) {
        addRecentSearch(query.trim());
      }
      
      // Call parent handler
      onSelectResult(result);
      
      // Close dialog
      onOpenChange(false);
      
      // Track analytics if configured
      eventHandlers.onTrackEvent?.('search_result_selected', {
        query: query.trim(),
        resultType: result.type,
        resultId: result.id,
      });
    }, [query, addRecentSearch, onSelectResult, onOpenChange, eventHandlers]);

    // Handle recent search selection
    const handleSelectRecent = useCallback((recentQuery: string) => {
      setValue('query', recentQuery);
      setQuery(recentQuery);
      searchInputRef.current?.focus();
    }, [setValue]);

    // Calculate result indices for navigation
    const resultIndices = useMemo(() => {
      let currentIndex = 0;
      const indices: Array<{ groupIndex: number; startIndex: number; endIndex: number }> = [];
      
      searchResults.forEach((group, groupIndex) => {
        const startIndex = currentIndex;
        const endIndex = currentIndex + group.results.length - 1;
        indices.push({ groupIndex, startIndex, endIndex });
        currentIndex += group.results.length;
      });
      
      return indices;
    }, [searchResults]);

    // Imperative API for ref
    useImperativeHandle(ref, () => ({
      open: () => onOpenChange(true),
      close: () => onOpenChange(false),
      focusInput: () => searchInputRef.current?.focus(),
      clearSearch: () => {
        setValue('query', '');
        setQuery('');
      },
      setQuery: (newQuery: string) => {
        setValue('query', newQuery);
        setQuery(newQuery);
      },
      triggerSearch: async (searchQuery?: string) => {
        if (searchQuery) {
          setValue('query', searchQuery);
          setQuery(searchQuery);
        }
        await refetch();
      },
      navigateToResult: (groupIndex: number, resultIndex: number) => {
        const targetIndex = resultIndices
          .slice(0, groupIndex)
          .reduce((sum, group) => sum + (group.endIndex - group.startIndex + 1), 0) + resultIndex;
        setSelectedResultIndex(targetIndex);
      },
      getState: () => ({
        query,
        isSearching,
        results: searchResults,
        selectedIndex: selectedResultIndex,
        selectedGroupIndex: 0, // Calculate if needed
        error: searchError?.message,
        isOpen: open,
        recentSearches,
        showRecentSearches: query.length === 0,
        loadingStates: {
          initial: false,
          searching: isSearching,
          navigating: false,
        },
        filters: {},
        pagination: {
          page: 1,
          pageSize: mergedConfig.maxResultsPerGroup,
          totalResults: searchResults.reduce((sum, group) => sum + group.results.length, 0),
          hasNextPage: false,
        },
      }),
      reset: () => {
        setValue('query', '');
        setQuery('');
        setSelectedResultIndex(0);
        queryClient.removeQueries({ queryKey: ['search'] });
      },
    }), [
      onOpenChange, setValue, setQuery, refetch, resultIndices, setSelectedResultIndex,
      query, isSearching, searchResults, selectedResultIndex, searchError, open,
      recentSearches, mergedConfig.maxResultsPerGroup, queryClient
    ]);

    // Show recent searches when query is empty
    const showRecentSearches = query.length === 0 && recentSearches.length > 0;
    const hasResults = searchResults.length > 0;
    const showEmptyState = !showRecentSearches && !hasResults && !isSearching;

    return (
      <Transition appear show={open} as={React.Fragment}>
        <Dialog 
          as="div" 
          className="relative z-50"
          onClose={() => onOpenChange(false)}
          data-testid={dataTestId || 'search-dialog'}
          {...props}
        >
          {/* Backdrop */}
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div 
              className="fixed inset-0 bg-black/25 dark:bg-black/50" 
              aria-hidden="true"
            />
          </Transition.Child>

          {/* Dialog positioning */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel 
                  ref={dialogRef}
                  className={cn(
                    'w-full max-w-2xl transform overflow-hidden rounded-xl',
                    'bg-white dark:bg-gray-900 shadow-2xl transition-all',
                    'border border-gray-200 dark:border-gray-700',
                    'max-h-[80vh] flex flex-col',
                    className
                  )}
                  onKeyDown={handleKeyDown}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Global search dialog"
                >
                  <Combobox 
                    value={selectedResult}
                    onChange={handleSelectResult}
                    nullable
                  >
                    {/* Search Input Header */}
                    <div className="relative border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center px-4 py-3">
                        <MagnifyingGlassIcon 
                          className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0" 
                          aria-hidden="true"
                        />
                        <Controller
                          name="query"
                          control={control}
                          render={({ field }) => (
                            <Combobox.Input
                              {...field}
                              ref={searchInputRef}
                              className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-base"
                              placeholder={placeholder}
                              autoComplete="off"
                              spellCheck={false}
                              data-testid="search-input"
                              aria-label="Search query input"
                              aria-describedby="search-instructions"
                              onChange={(e) => {
                                field.onChange(e);
                                startTransition(() => {
                                  setQuery(e.target.value);
                                });
                              }}
                            />
                          )}
                        />
                        {query && (
                          <button
                            onClick={() => {
                              setValue('query', '');
                              setQuery('');
                              searchInputRef.current?.focus();
                            }}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                            data-testid="clear-search-button"
                            aria-label="Clear search query"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Search instructions for screen readers */}
                      <div id="search-instructions" className="sr-only">
                        Use arrow keys to navigate results, Enter to select, Escape to close.
                        {hasResults && ` ${searchResults.reduce((sum, group) => sum + group.results.length, 0)} results found.`}
                      </div>
                    </div>

                    {/* Results Container */}
                    <div className="flex-1 overflow-y-auto">
                      <Combobox.Options 
                        static 
                        className="max-h-96 divide-y divide-gray-100 dark:divide-gray-700"
                        data-testid="search-results-container"
                        role="listbox"
                        aria-label="Search results"
                      >
                        {/* Recent Searches */}
                        {showRecentSearches && (
                          <RecentSearches
                            recentSearches={recentSearches}
                            onSelectRecent={handleSelectRecent}
                            onClearRecent={clearRecentSearches}
                          />
                        )}

                        {/* Search Results */}
                        {hasResults && (
                          <>
                            {resultIndices.map(({ groupIndex, startIndex }) => (
                              <SearchResultGroup
                                key={searchResults[groupIndex].type}
                                group={searchResults[groupIndex]}
                                selectedResultIndex={selectedResultIndex}
                                onSelectResult={handleSelectResult}
                                startIndex={startIndex}
                              />
                            ))}
                          </>
                        )}

                        {/* Empty States */}
                        {showEmptyState && (
                          <EmptyState
                            query={query}
                            isSearching={isSearching}
                            error={searchError}
                            onRetry={refetch}
                          />
                        )}
                      </Combobox.Options>
                    </div>

                    {/* Footer with keyboard shortcuts */}
                    {mergedConfig.responsive.desktop.showKeyboardShortcuts && (
                      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border text-[10px]">↑↓</kbd>
                              <span className="ml-1">navigate</span>
                            </span>
                            <span className="flex items-center">
                              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border text-[10px]">↵</kbd>
                              <span className="ml-1">select</span>
                            </span>
                            <span className="flex items-center">
                              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border text-[10px]">esc</kbd>
                              <span className="ml-1">close</span>
                            </span>
                          </div>
                          {hasResults && (
                            <span>
                              {searchResults.reduce((sum, group) => sum + group.results.length, 0)} results
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Combobox>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }
);

export default SearchDialog;

/**
 * Export types for external use
 */
export type {
  SearchDialogProps,
  SearchDialogRef,
  SearchDialogState,
  SearchResult,
  SearchResultGroup,
  SearchResultType,
  SearchKeyboardEvent,
} from './types';