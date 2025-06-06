'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { apiClient, type ApiResponse } from '@/lib/api-client';
import { useDebouncedValue, type DebounceOptions } from '@/hooks/use-debounce';

/**
 * Search result interfaces and types
 */
export interface SearchResult {
  /** Unique identifier for the search result */
  id: string;
  /** Display title for the result */
  title: string;
  /** Optional description or subtitle */
  description?: string;
  /** Navigation path for the result */
  path: string;
  /** Result category (e.g., 'database', 'service', 'table', 'user') */
  category: string;
  /** Optional icon identifier */
  icon?: string;
  /** Additional metadata for the result */
  metadata?: Record<string, any>;
  /** Search relevance score */
  score?: number;
}

/**
 * Search API response structure
 */
export interface SearchApiResponse {
  /** Array of search results */
  results: SearchResult[];
  /** Total number of available results (for pagination) */
  total: number;
  /** Original search query */
  query: string;
  /** Response time in milliseconds */
  took: number;
  /** Available facets/categories */
  facets?: Record<string, number>;
}

/**
 * Search options and parameters
 */
export interface SearchOptions {
  /** Search query string */
  query: string;
  /** Filter by specific categories */
  categories?: string[];
  /** Maximum number of results to return */
  limit?: number;
  /** Pagination offset */
  offset?: number;
  /** Include metadata in results */
  includeMetadata?: boolean;
  /** Minimum search score threshold */
  minScore?: number;
}

/**
 * Search dialog state management
 */
export interface SearchDialogState {
  /** Whether the search dialog is open */
  isOpen: boolean;
  /** Current search query in the dialog */
  query: string;
  /** Dialog position (for future enhancements) */
  position?: { x: number; y: number };
}

/**
 * Recent search item for history tracking
 */
export interface RecentSearch {
  /** Search query */
  query: string;
  /** When the search was performed */
  timestamp: number;
  /** Number of results returned */
  resultCount: number;
}

/**
 * Configuration options for the search hook
 */
export interface UseSearchOptions {
  /** Debounce delay in milliseconds (default: 1000ms per requirements) */
  debounceDelay?: number;
  /** Enable search result caching */
  enableCache?: boolean;
  /** Cache time in milliseconds */
  cacheTime?: number;
  /** Stale time in milliseconds */
  staleTime?: number;
  /** Enable recent search tracking */
  trackRecentSearches?: boolean;
  /** Maximum number of recent searches to store */
  maxRecentSearches?: number;
  /** Enable automatic search on input */
  autoSearch?: boolean;
  /** Minimum query length to trigger search */
  minQueryLength?: number;
}

/**
 * Search hook return type with comprehensive functionality
 */
export interface UseSearchReturn {
  // Search execution
  /** Current search query */
  query: string;
  /** Set search query */
  setQuery: (query: string) => void;
  /** Debounced search query */
  debouncedQuery: string;
  /** Execute search with specified options */
  search: (options: Partial<SearchOptions>) => Promise<SearchApiResponse | undefined>;
  /** Clear current search */
  clearSearch: () => void;

  // Search results
  /** Current search results */
  results: SearchResult[];
  /** Search response metadata */
  searchResponse: SearchApiResponse | undefined;
  /** Whether search is loading */
  isLoading: boolean;
  /** Whether search is fetching (background) */
  isFetching: boolean;
  /** Search error if any */
  error: Error | null;
  /** Whether there are more results available */
  hasMore: boolean;

  // Search dialog state
  /** Search dialog state */
  dialogState: SearchDialogState;
  /** Open search dialog */
  openDialog: (initialQuery?: string) => void;
  /** Close search dialog */
  closeDialog: () => void;
  /** Toggle search dialog */
  toggleDialog: () => void;

  // Recent searches
  /** Array of recent searches */
  recentSearches: RecentSearch[];
  /** Add search to recent history */
  addToRecentSearches: (query: string, resultCount: number) => void;
  /** Clear recent searches */
  clearRecentSearches: () => void;

  // Validation and utilities
  /** Whether current query is valid for searching */
  isValidQuery: boolean;
  /** Submit search with validation */
  submitSearch: () => Promise<void>;
  /** Navigation helper for search results */
  navigateToResult: (result: SearchResult) => void;
}

/**
 * Default search configuration
 */
const DEFAULT_SEARCH_OPTIONS: Required<UseSearchOptions> = {
  debounceDelay: 1000, // 1000ms as per requirements
  enableCache: true,
  cacheTime: 300000, // 5 minutes
  staleTime: 30000, // 30 seconds
  trackRecentSearches: true,
  maxRecentSearches: 10,
  autoSearch: true,
  minQueryLength: 2,
};

/**
 * Local storage key for recent searches
 */
const RECENT_SEARCHES_KEY = 'dreamfactory-search-recent';

/**
 * Global search functionality hook with debounced input handling, React Query caching,
 * and search dialog integration. Replaces Angular search service patterns with React
 * Query caching and optimized search workflows.
 * 
 * Features:
 * - Debounced search input with configurable delay (1000ms default)
 * - React Query caching with sub-50ms cache hit responses
 * - Search dialog state management with position and visibility controls
 * - Recent search history with localStorage persistence
 * - Search result categorization and filtering
 * - Comprehensive error handling and validation
 * - Search submission with proper user feedback
 * 
 * @param options - Configuration options for search behavior
 * @returns Comprehensive search functionality and state management
 * 
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const {
 *     query,
 *     setQuery,
 *     results,
 *     isLoading,
 *     openDialog,
 *     dialogState,
 *     submitSearch,
 *     navigateToResult,
 *   } = useSearch({
 *     debounceDelay: 500,
 *     autoSearch: true,
 *   });
 * 
 *   return (
 *     <div>
 *       <input
 *         value={query}
 *         onChange={(e) => setQuery(e.target.value)}
 *         onKeyPress={(e) => e.key === 'Enter' && submitSearch()}
 *       />
 *       {isLoading && <div>Searching...</div>}
 *       {results.map((result) => (
 *         <div key={result.id} onClick={() => navigateToResult(result)}>
 *           {result.title}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Usage with search dialog integration
 * function HeaderSearch() {
 *   const { openDialog, dialogState, closeDialog } = useSearch();
 * 
 *   return (
 *     <>
 *       <button onClick={() => openDialog()}>
 *         Search (Cmd+K)
 *       </button>
 *       <SearchDialog
 *         open={dialogState.isOpen}
 *         onClose={closeDialog}
 *         initialQuery={dialogState.query}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const config = useMemo(() => ({ ...DEFAULT_SEARCH_OPTIONS, ...options }), [options]);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Search state management
  const [query, setQuery] = useState<string>('');
  const [dialogState, setDialogState] = useState<SearchDialogState>({
    isOpen: false,
    query: '',
  });

  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Debounced query for automatic search triggering
  const { debouncedValue: debouncedQuery, isPending } = useDebouncedValue(
    query,
    {
      delay: config.debounceDelay,
      trailing: true,
    } as DebounceOptions
  );

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (config.trackRecentSearches && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as RecentSearch[];
          // Filter out searches older than 30 days
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          const filtered = parsed.filter(search => search.timestamp > thirtyDaysAgo);
          setRecentSearches(filtered.slice(0, config.maxRecentSearches));
        }
      } catch (error) {
        console.warn('Failed to load recent searches:', error);
      }
    }
  }, [config.trackRecentSearches, config.maxRecentSearches]);

  // Validation helper
  const isValidQuery = useMemo(() => {
    return debouncedQuery.trim().length >= config.minQueryLength;
  }, [debouncedQuery, config.minQueryLength]);

  // Search query using React Query for intelligent caching
  const searchQueryKey = ['search', debouncedQuery];
  const {
    data: searchResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: searchQueryKey,
    queryFn: async (): Promise<SearchApiResponse> => {
      if (!isValidQuery) {
        return {
          results: [],
          total: 0,
          query: debouncedQuery,
          took: 0,
        };
      }

      try {
        const searchOptions: SearchOptions = {
          query: debouncedQuery.trim(),
          limit: 50,
          includeMetadata: true,
        };

        // Execute search via API client
        const response = await apiClient.post<SearchApiResponse>(
          '/search',
          searchOptions,
          {
            timeout: 5000, // 5 second timeout
            retries: 1,
          }
        );

        if (response.data) {
          return response.data;
        }

        throw new Error('Invalid search response format');
      } catch (error) {
        console.error('Search API error:', error);
        throw error;
      }
    },
    enabled: config.autoSearch && config.enableCache && isValidQuery,
    staleTime: config.staleTime,
    gcTime: config.cacheTime,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Extract search results with fallback
  const results = useMemo(() => {
    return searchResponse?.results || [];
  }, [searchResponse]);

  // Check if there are more results available
  const hasMore = useMemo(() => {
    if (!searchResponse) return false;
    return searchResponse.results.length < searchResponse.total;
  }, [searchResponse]);

  // Manual search function for advanced use cases
  const search = useCallback(async (searchOptions: Partial<SearchOptions>): Promise<SearchApiResponse | undefined> => {
    const options: SearchOptions = {
      query: query.trim(),
      limit: 50,
      includeMetadata: true,
      ...searchOptions,
    };

    if (!options.query || options.query.length < config.minQueryLength) {
      throw new Error(`Query must be at least ${config.minQueryLength} characters long`);
    }

    try {
      const response = await apiClient.post<SearchApiResponse>(
        '/search',
        options,
        {
          timeout: 10000, // Longer timeout for manual searches
          retries: 2,
        }
      );

      if (response.data) {
        // Update query cache with manual search results
        queryClient.setQueryData(['search', options.query], response.data);
        
        // Add to recent searches if tracking enabled
        if (config.trackRecentSearches) {
          addToRecentSearches(options.query, response.data.results.length);
        }

        return response.data;
      }

      throw new Error('Invalid search response format');
    } catch (error) {
      console.error('Manual search error:', error);
      throw error;
    }
  }, [query, config.minQueryLength, config.trackRecentSearches, queryClient]);

  // Search submission with validation and error handling
  const submitSearch = useCallback(async (): Promise<void> => {
    if (!isValidQuery) {
      throw new Error(`Please enter at least ${config.minQueryLength} characters to search`);
    }

    try {
      await search({ query: debouncedQuery });
    } catch (error) {
      console.error('Search submission failed:', error);
      throw error;
    }
  }, [isValidQuery, config.minQueryLength, search, debouncedQuery]);

  // Clear search function
  const clearSearch = useCallback(() => {
    setQuery('');
    // Clear cache for empty searches
    queryClient.removeQueries({ queryKey: ['search', ''] });
  }, [queryClient]);

  // Dialog state management functions
  const openDialog = useCallback((initialQuery?: string) => {
    setDialogState({
      isOpen: true,
      query: initialQuery || query,
    });
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [query]);

  const closeDialog = useCallback(() => {
    setDialogState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const toggleDialog = useCallback(() => {
    setDialogState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
  }, []);

  // Recent searches management
  const addToRecentSearches = useCallback((searchQuery: string, resultCount: number) => {
    if (!config.trackRecentSearches || !searchQuery.trim()) return;

    const newSearch: RecentSearch = {
      query: searchQuery.trim(),
      timestamp: Date.now(),
      resultCount,
    };

    setRecentSearches(prev => {
      // Remove any existing search with the same query
      const filtered = prev.filter(search => search.query !== newSearch.query);
      // Add new search to the beginning and limit the total
      const updated = [newSearch, ...filtered].slice(0, config.maxRecentSearches);
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch (error) {
          console.warn('Failed to save recent searches:', error);
        }
      }
      
      return updated;
    });
  }, [config.trackRecentSearches, config.maxRecentSearches]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(RECENT_SEARCHES_KEY);
      } catch (error) {
        console.warn('Failed to clear recent searches:', error);
      }
    }
  }, []);

  // Navigation helper for search results
  const navigateToResult = useCallback((result: SearchResult) => {
    // Add to recent searches
    if (config.trackRecentSearches) {
      addToRecentSearches(query, 1);
    }
    
    // Navigate using Next.js router
    router.push(result.path);
    
    // Close dialog if open
    if (dialogState.isOpen) {
      closeDialog();
    }
  }, [config.trackRecentSearches, addToRecentSearches, query, router, dialogState.isOpen, closeDialog]);

  // Auto-add successful searches to recent history
  useEffect(() => {
    if (searchResponse && searchResponse.results.length > 0 && isValidQuery) {
      addToRecentSearches(debouncedQuery, searchResponse.results.length);
    }
  }, [searchResponse, isValidQuery, debouncedQuery, addToRecentSearches]);

  return {
    // Search execution
    query,
    setQuery,
    debouncedQuery,
    search,
    clearSearch,

    // Search results
    results,
    searchResponse,
    isLoading: isLoading || isPending,
    isFetching,
    error: error as Error | null,
    hasMore,

    // Search dialog state
    dialogState,
    openDialog,
    closeDialog,
    toggleDialog,

    // Recent searches
    recentSearches,
    addToRecentSearches,
    clearRecentSearches,

    // Validation and utilities
    isValidQuery,
    submitSearch,
    navigateToResult,
  };
}

/**
 * Simplified search hook for basic use cases without dialog management
 * 
 * @param initialQuery - Initial search query
 * @param options - Search configuration options
 * @returns Basic search functionality
 * 
 * @example
 * ```tsx
 * function SimpleSearch() {
 *   const { query, setQuery, results, isLoading } = useSimpleSearch('', {
 *     debounceDelay: 300,
 *   });
 * 
 *   return (
 *     <div>
 *       <input value={query} onChange={(e) => setQuery(e.target.value)} />
 *       {results.map(result => <div key={result.id}>{result.title}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSimpleSearch(
  initialQuery: string = '',
  options: UseSearchOptions = {}
) {
  const search = useSearch(options);
  
  useEffect(() => {
    if (initialQuery) {
      search.setQuery(initialQuery);
    }
  }, [initialQuery, search.setQuery]);

  return {
    query: search.query,
    setQuery: search.setQuery,
    results: search.results,
    isLoading: search.isLoading,
    error: search.error,
    clearSearch: search.clearSearch,
  };
}

// Export types for external consumption
export type {
  SearchOptions,
  SearchResult,
  SearchApiResponse,
  SearchDialogState,
  RecentSearch,
  UseSearchOptions,
  UseSearchReturn,
};

// Default export
export default useSearch;