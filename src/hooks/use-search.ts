import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounceValue, useSearchDebounce } from './use-debounce';

/**
 * Configuration options for search functionality
 */
export interface SearchOptions {
  /** Debounce delay in milliseconds (default: 400ms) */
  debounceDelay?: number;
  /** Minimum search term length to trigger search (default: 2) */
  minSearchLength?: number;
  /** Enable search history persistence (default: true) */
  enableHistory?: boolean;
  /** Maximum number of recent searches to store (default: 10) */
  maxHistoryItems?: number;
  /** Cache time for search results in milliseconds (default: 5 minutes) */
  cacheTime?: number;
  /** Stale time for search results in milliseconds (default: 2 minutes) */
  staleTime?: number;
  /** Include entity type filters (default: true) */
  enableFiltering?: boolean;
  /** Custom API client for search operations */
  apiClient?: SearchApiClient;
}

/**
 * Search result item interface
 */
export interface SearchResultItem {
  /** Display label for the search result */
  label: string;
  /** Route segment for navigation (ID or slug) */
  segment: string | number;
  /** Entity type for categorization */
  type: SearchEntityType;
  /** Additional metadata for the search result */
  metadata?: Record<string, any>;
}

/**
 * Search result group by entity type and route
 */
export interface SearchResultGroup {
  /** Navigation path for the result group */
  path: string;
  /** Entity type for categorization */
  entityType: SearchEntityType;
  /** Array of search result items in this group */
  items: SearchResultItem[];
  /** Total count of results for this entity type */
  totalCount?: number;
}

/**
 * Comprehensive search result interface
 */
export interface SearchResult {
  /** Grouped search results by entity type */
  groups: SearchResultGroup[];
  /** Search query that generated these results */
  query: string;
  /** Total number of results across all groups */
  totalResults: number;
  /** Search execution timestamp */
  timestamp: number;
  /** Search performance metrics */
  metadata: {
    /** Search execution time in milliseconds */
    executionTime: number;
    /** Number of API calls made */
    apiCalls: number;
    /** Whether results were served from cache */
    fromCache: boolean;
  };
}

/**
 * Supported entity types for search
 */
export type SearchEntityType = 
  | 'admins'
  | 'users' 
  | 'services'
  | 'serviceTypes'
  | 'roles'
  | 'apps'
  | 'eventScripts'
  | 'limits'
  | 'emailTemplates'
  | 'schemas'
  | 'tables'
  | 'endpoints';

/**
 * Search history item interface
 */
export interface SearchHistoryItem {
  /** Search query */
  query: string;
  /** Number of results found */
  resultCount: number;
  /** Timestamp when search was performed */
  timestamp: number;
  /** Entity types that had results */
  entityTypes: SearchEntityType[];
}

/**
 * Search filter configuration
 */
export interface SearchFilter {
  /** Entity types to include in search */
  entityTypes: SearchEntityType[];
  /** Date range filter for results */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Custom search options */
  options?: Record<string, any>;
}

/**
 * API client interface for search operations
 */
export interface SearchApiClient {
  /** Search across all entity types */
  searchAll: (query: string, filter?: SearchFilter) => Promise<SearchResult>;
  /** Search specific entity type */
  searchEntity: (query: string, entityType: SearchEntityType) => Promise<SearchResultGroup>;
  /** Get search suggestions based on partial input */
  getSuggestions: (query: string) => Promise<string[]>;
}

/**
 * Search hook return interface
 */
export interface UseSearchReturn {
  /** Current search query */
  query: string;
  /** Set the search query */
  setQuery: (query: string) => void;
  /** Debounced search query */
  debouncedQuery: string;
  /** Search results */
  results: SearchResult | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Search history */
  history: SearchHistoryItem[];
  /** Recent searches (subset of history) */
  recentSearches: SearchHistoryItem[];
  /** Clear search query and results */
  clearSearch: () => void;
  /** Clear search history */
  clearHistory: () => void;
  /** Perform immediate search without debouncing */
  executeSearch: (query: string) => Promise<void>;
  /** Active search filters */
  filters: SearchFilter;
  /** Update search filters */
  setFilters: (filters: Partial<SearchFilter>) => void;
  /** Whether search is pending (debouncing) */
  isPending: boolean;
  /** Cancel pending search */
  cancelSearch: () => void;
  /** Search performance metrics */
  metrics: SearchResult['metadata'] | null;
  /** Prefetch search results for a query */
  prefetchSearch: (query: string) => Promise<void>;
}

/**
 * Local storage key for search history
 */
const SEARCH_HISTORY_KEY = 'df-search-history';

/**
 * Default search options
 */
const DEFAULT_OPTIONS: Required<SearchOptions> = {
  debounceDelay: 400,
  minSearchLength: 2,
  enableHistory: true,
  maxHistoryItems: 10,
  cacheTime: 5 * 60 * 1000, // 5 minutes
  staleTime: 2 * 60 * 1000, // 2 minutes
  enableFiltering: true,
  apiClient: null as any, // Will be provided or use default
};

/**
 * Default API client implementation
 * This provides a mock implementation that can be replaced with actual API calls
 */
const createDefaultApiClient = (): SearchApiClient => ({
  searchAll: async (query: string, filter?: SearchFilter): Promise<SearchResult> => {
    // Mock implementation - replace with actual API client
    console.warn('Using mock search API client. Please provide a real implementation.');
    
    const mockResults: SearchResult = {
      groups: [],
      query,
      totalResults: 0,
      timestamp: Date.now(),
      metadata: {
        executionTime: 150,
        apiCalls: 1,
        fromCache: false,
      },
    };
    
    return new Promise(resolve => {
      setTimeout(() => resolve(mockResults), 150);
    });
  },
  
  searchEntity: async (query: string, entityType: SearchEntityType): Promise<SearchResultGroup> => {
    // Mock implementation
    return {
      path: `/${entityType}`,
      entityType,
      items: [],
      totalCount: 0,
    };
  },
  
  getSuggestions: async (query: string): Promise<string[]> => {
    // Mock implementation
    return [];
  },
});

/**
 * Hook for managing search history with localStorage persistence
 */
const useSearchHistory = (maxItems: number, enabled: boolean) => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    if (!enabled) return;
    
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsedHistory = JSON.parse(stored) as SearchHistoryItem[];
        setHistory(parsedHistory.slice(0, maxItems));
      }
    } catch (error) {
      console.warn('Failed to load search history from localStorage:', error);
    }
  }, [maxItems, enabled]);

  // Save history to localStorage when it changes
  useEffect(() => {
    if (!enabled) return;
    
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save search history to localStorage:', error);
    }
  }, [history, enabled]);

  const addToHistory = useCallback((item: SearchHistoryItem) => {
    if (!enabled) return;
    
    setHistory(prev => {
      // Remove any existing entry with the same query
      const filtered = prev.filter(h => h.query !== item.query);
      // Add new entry at the beginning
      const updated = [item, ...filtered];
      // Trim to max items
      return updated.slice(0, maxItems);
    });
  }, [maxItems, enabled]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (enabled) {
      try {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
      } catch (error) {
        console.warn('Failed to clear search history from localStorage:', error);
      }
    }
  }, [enabled]);

  const recentSearches = history.slice(0, 5);

  return { history, addToHistory, clearHistory, recentSearches };
};

/**
 * Global search functionality hook with React Query intelligent caching,
 * debounced search input, and comprehensive search result management.
 * 
 * Replaces Angular DfSearchService with enhanced performance and caching capabilities.
 * 
 * @param options Configuration options for search behavior
 * @returns Search functionality interface
 * 
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const {
 *     query,
 *     setQuery,
 *     results,
 *     isLoading,
 *     history,
 *     clearSearch,
 *     filters,
 *     setFilters
 *   } = useSearch({
 *     debounceDelay: 300,
 *     minSearchLength: 2,
 *     enableHistory: true,
 *   });
 *   
 *   return (
 *     <div className="search-container">
 *       <input
 *         type="text"
 *         value={query}
 *         onChange={(e) => setQuery(e.target.value)}
 *         placeholder="Search across all entities..."
 *         className="search-input"
 *       />
 *       
 *       {isLoading && <div className="loading">Searching...</div>}
 *       
 *       {results && (
 *         <div className="search-results">
 *           <div className="results-summary">
 *             Found {results.totalResults} results in {results.metadata.executionTime}ms
 *           </div>
 *           
 *           {results.groups.map((group) => (
 *             <div key={group.entityType} className="result-group">
 *               <h3>{group.entityType} ({group.items.length})</h3>
 *               {group.items.map((item) => (
 *                 <div key={item.segment} className="result-item">
 *                   <a href={`${group.path}/${item.segment}`}>
 *                     {item.label}
 *                   </a>
 *                 </div>
 *               ))}
 *             </div>
 *           ))}
 *         </div>
 *       )}
 *       
 *       {history.length > 0 && (
 *         <div className="search-history">
 *           <h4>Recent Searches</h4>
 *           {history.map((item) => (
 *             <button
 *               key={item.timestamp}
 *               onClick={() => setQuery(item.query)}
 *               className="history-item"
 *             >
 *               {item.query} ({item.resultCount} results)
 *             </button>
 *           ))}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSearch(options: SearchOptions = {}): UseSearchReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const queryClient = useQueryClient();
  
  // Search state
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter>({
    entityTypes: [], // Empty means search all types
  });

  // API client
  const apiClient = opts.apiClient || createDefaultApiClient();

  // Debounced search with advanced options
  const { debouncedValue: debouncedQuery, isPending, cancel } = useSearchDebounce(
    query,
    () => {}, // We handle the actual search in useQuery
    {
      delay: opts.debounceDelay,
      minLength: opts.minSearchLength,
    }
  );

  // Search history management
  const { history, addToHistory, clearHistory, recentSearches } = useSearchHistory(
    opts.maxHistoryItems,
    opts.enableHistory
  );

  // Search query key factory
  const createSearchQueryKey = (searchQuery: string, searchFilters: SearchFilter) => [
    'search',
    searchQuery,
    searchFilters,
  ];

  // Main search query with React Query
  const {
    data: results,
    isLoading,
    error,
    refetch: executeSearchQuery,
  } = useQuery({
    queryKey: createSearchQueryKey(debouncedQuery, filters),
    queryFn: async () => {
      const startTime = Date.now();
      
      try {
        const result = await apiClient.searchAll(debouncedQuery, filters);
        const executionTime = Date.now() - startTime;
        
        // Update result metadata
        result.metadata.executionTime = executionTime;
        
        // Add to search history if results were found
        if (result.totalResults > 0) {
          addToHistory({
            query: debouncedQuery,
            resultCount: result.totalResults,
            timestamp: Date.now(),
            entityTypes: result.groups.map(group => group.entityType),
          });
        }
        
        return result;
      } catch (err) {
        console.error('Search failed:', err);
        throw err;
      }
    },
    enabled: debouncedQuery.length >= opts.minSearchLength,
    staleTime: opts.staleTime,
    gcTime: opts.cacheTime, // Updated from cacheTime in TanStack Query v5
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Execute immediate search without debouncing
  const executeSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < opts.minSearchLength) {
      return;
    }

    try {
      // Update the query to trigger the search
      setQuery(searchQuery);
      
      // Force refetch with the new query
      await queryClient.refetchQueries({
        queryKey: createSearchQueryKey(searchQuery, filters),
      });
    } catch (error) {
      console.error('Immediate search failed:', error);
    }
  }, [filters, opts.minSearchLength, queryClient]);

  // Prefetch search results
  const prefetchSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < opts.minSearchLength) {
      return;
    }

    await queryClient.prefetchQuery({
      queryKey: createSearchQueryKey(searchQuery, filters),
      queryFn: () => apiClient.searchAll(searchQuery, filters),
      staleTime: opts.staleTime,
    });
  }, [apiClient, filters, opts.minSearchLength, opts.staleTime, queryClient]);

  // Clear search and results
  const clearSearch = useCallback(() => {
    setQuery('');
    cancel(); // Cancel any pending debounced search
    
    // Optionally clear the cache for search queries
    queryClient.removeQueries({
      queryKey: ['search'],
      exact: false,
    });
  }, [cancel, queryClient]);

  // Update filters with intelligent cache invalidation
  const updateFilters = useCallback((newFilters: Partial<SearchFilter>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      // Invalidate search queries when filters change
      queryClient.invalidateQueries({
        queryKey: ['search'],
        exact: false,
      });
      
      return updated;
    });
  }, [queryClient]);

  // Cancel search function
  const cancelSearch = useCallback(() => {
    cancel();
    
    // Cancel any ongoing queries
    queryClient.cancelQueries({
      queryKey: ['search'],
      exact: false,
    });
  }, [cancel, queryClient]);

  // Compute search metrics
  const metrics = results?.metadata || null;

  return {
    query,
    setQuery,
    debouncedQuery,
    results: results || null,
    isLoading,
    error: error as Error | null,
    history,
    recentSearches,
    clearSearch,
    clearHistory,
    executeSearch,
    filters,
    setFilters: updateFilters,
    isPending,
    cancelSearch,
    metrics,
    prefetchSearch,
  };
}

/**
 * Hook for search suggestions based on query input
 * 
 * @param query Current search query
 * @param apiClient API client for search operations
 * @returns Search suggestions with loading state
 */
export function useSearchSuggestions(
  query: string,
  apiClient?: SearchApiClient,
  options: { enabled?: boolean; debounceDelay?: number } = {}
) {
  const { enabled = true, debounceDelay = 300 } = options;
  const client = apiClient || createDefaultApiClient();
  const debouncedQuery = useDebounceValue(query, debounceDelay);

  return useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: () => client.getSuggestions(debouncedQuery),
    enabled: enabled && debouncedQuery.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for entity-specific search
 * 
 * @param query Search query
 * @param entityType Specific entity type to search
 * @param apiClient API client for search operations
 * @returns Entity-specific search results
 */
export function useEntitySearch(
  query: string,
  entityType: SearchEntityType,
  apiClient?: SearchApiClient,
  options: SearchOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const client = apiClient || createDefaultApiClient();
  const debouncedQuery = useDebounceValue(query, opts.debounceDelay);

  return useQuery({
    queryKey: ['entity-search', entityType, debouncedQuery],
    queryFn: () => client.searchEntity(debouncedQuery, entityType),
    enabled: debouncedQuery.length >= opts.minSearchLength,
    staleTime: opts.staleTime,
    gcTime: opts.cacheTime,
    retry: 2,
  });
}

export default useSearch;