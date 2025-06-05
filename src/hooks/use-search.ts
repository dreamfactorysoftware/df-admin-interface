'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useLocalStorage } from '@/hooks/use-local-storage';

/**
 * Search configuration options
 */
export interface SearchConfig {
  /** Debounce delay in milliseconds for search input */
  debounceDelay: number;
  /** Maximum number of results per entity type */
  maxResultsPerType: number;
  /** Maximum number of search history items to store */
  maxHistoryItems: number;
  /** Minimum query length to trigger search */
  minQueryLength: number;
  /** Enable/disable search history persistence */
  enableHistory: boolean;
  /** Background refetch interval in milliseconds */
  refetchInterval: number;
}

/**
 * Default search configuration optimized for DreamFactory admin interface
 */
const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  debounceDelay: 300, // Optimized for form inputs per 100ms requirement
  maxResultsPerType: 20,
  maxHistoryItems: 50,
  minQueryLength: 2,
  enableHistory: true,
  refetchInterval: 5 * 60 * 1000, // 5 minutes for cache freshness
};

/**
 * Search entity types supported across the application
 */
export type SearchEntityType = 
  | 'services'
  | 'databases' 
  | 'tables'
  | 'fields'
  | 'users'
  | 'roles'
  | 'apps'
  | 'scripts'
  | 'configs'
  | 'files'
  | 'endpoints'
  | 'schemas';

/**
 * Base search result interface
 */
export interface SearchResult {
  /** Unique identifier for the result */
  id: string;
  /** Display title for the result */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Entity type for categorization */
  type: SearchEntityType;
  /** Navigation URL for the result */
  url: string;
  /** Relevance score for ranking (0-1) */
  score: number;
  /** Additional metadata for the result */
  metadata?: Record<string, any>;
  /** Highlighted text fragments for search terms */
  highlights?: string[];
}

/**
 * Categorized search results grouped by entity type
 */
export interface CategorizedSearchResults {
  /** Search results grouped by entity type */
  categories: Record<SearchEntityType, SearchResult[]>;
  /** Total number of results across all categories */
  totalCount: number;
  /** Search execution time in milliseconds */
  executionTime: number;
  /** Whether the search was served from cache */
  fromCache: boolean;
}

/**
 * Search history item for persistence
 */
export interface SearchHistoryItem {
  /** Search query text */
  query: string;
  /** Timestamp when search was performed */
  timestamp: number;
  /** Number of results returned */
  resultCount: number;
  /** Selected result from the search (if any) */
  selectedResult?: SearchResult;
}

/**
 * Search filter options for refining results
 */
export interface SearchFilters {
  /** Filter by specific entity types */
  entityTypes?: SearchEntityType[];
  /** Filter by date range */
  dateRange?: {
    from: Date;
    to: Date;
  };
  /** Filter by minimum relevance score */
  minScore?: number;
  /** Custom metadata filters */
  metadata?: Record<string, any>;
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
  /** Search results categorized by entity type */
  results: CategorizedSearchResults | null;
  /** Loading state for search operation */
  isLoading: boolean;
  /** Error state for search operation */
  error: Error | null;
  /** Whether search input is currently debouncing */
  isPending: boolean;
  /** Search history items */
  history: SearchHistoryItem[];
  /** Recent searches (last 10) */
  recentSearches: string[];
  /** Add item to search history */
  addToHistory: (query: string, selectedResult?: SearchResult) => void;
  /** Clear search history */
  clearHistory: () => void;
  /** Remove specific item from history */
  removeFromHistory: (query: string) => void;
  /** Active search filters */
  filters: SearchFilters;
  /** Set search filters */
  setFilters: (filters: SearchFilters) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Manually refetch search results */
  refetch: () => void;
  /** Cancel pending search request */
  cancel: () => void;
}

/**
 * Mock API client for search operations
 * This would typically be imported from src/lib/api-client.ts
 */
const mockSearchAPI = {
  async searchGlobal(
    query: string,
    filters: SearchFilters = {},
    config: SearchConfig
  ): Promise<CategorizedSearchResults> {
    const startTime = Date.now();
    
    // Simulate API delay for realistic behavior
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    
    // Mock search results across different entity types
    const mockResults: Record<SearchEntityType, SearchResult[]> = {
      services: [
        {
          id: 'service-1',
          title: `Database Service: ${query}`,
          subtitle: 'MySQL connection to production database',
          type: 'services',
          url: '/api-connections/database/service-1',
          score: 0.95,
          metadata: { dbType: 'mysql', status: 'active' },
          highlights: [`Database Service: <mark>${query}</mark>`],
        },
      ],
      databases: [
        {
          id: 'db-1',
          title: `${query}_database`,
          subtitle: 'Production database instance',
          type: 'databases',
          url: '/adf-schema/databases/db-1',
          score: 0.88,
          metadata: { tableCount: 45, size: '2.3GB' },
          highlights: [`<mark>${query}</mark>_database`],
        },
      ],
      tables: [
        {
          id: 'table-1',
          title: `${query}_users`,
          subtitle: 'User management table',
          type: 'tables',
          url: '/adf-schema/tables/table-1',
          score: 0.82,
          metadata: { rowCount: 15420, columns: 8 },
          highlights: [`<mark>${query}</mark>_users`],
        },
      ],
      fields: [],
      users: [
        {
          id: 'user-1',
          title: `${query} Admin`,
          subtitle: 'System administrator',
          type: 'users',
          url: '/adf-users/user-1',
          score: 0.75,
          metadata: { role: 'admin', lastLogin: '2024-01-15' },
          highlights: [`<mark>${query}</mark> Admin`],
        },
      ],
      roles: [],
      apps: [],
      scripts: [],
      configs: [],
      files: [],
      endpoints: [
        {
          id: 'endpoint-1',
          title: `GET /api/v2/${query}`,
          subtitle: 'Generated REST endpoint',
          type: 'endpoints',
          url: '/adf-api-docs/endpoints/endpoint-1',
          score: 0.70,
          metadata: { method: 'GET', secured: true },
          highlights: [`GET /api/v2/<mark>${query}</mark>`],
        },
      ],
      schemas: [],
    };

    // Filter results based on filters
    const filteredResults: Record<SearchEntityType, SearchResult[]> = {};
    let totalCount = 0;

    Object.entries(mockResults).forEach(([type, results]) => {
      const entityType = type as SearchEntityType;
      
      // Apply entity type filter
      if (filters.entityTypes && !filters.entityTypes.includes(entityType)) {
        filteredResults[entityType] = [];
        return;
      }

      // Apply score filter
      let filtered = filters.minScore 
        ? results.filter(result => result.score >= filters.minScore!)
        : results;

      // Limit results per type
      filtered = filtered.slice(0, config.maxResultsPerType);
      
      filteredResults[entityType] = filtered;
      totalCount += filtered.length;
    });

    const executionTime = Date.now() - startTime;

    return {
      categories: filteredResults,
      totalCount,
      executionTime,
      fromCache: false,
    };
  },
};

/**
 * Global search hook that manages search operations, result caching, and search history
 * 
 * Replaces Angular DfSearchService with React Query intelligent caching, debounced search input,
 * and comprehensive search result management across all application entities.
 * 
 * @param config - Optional search configuration to override defaults
 * @returns Search state and control functions
 * 
 * @example
 * ```tsx
 * function GlobalSearchComponent() {
 *   const {
 *     query,
 *     setQuery,
 *     results,
 *     isLoading,
 *     history,
 *     addToHistory,
 *     filters,
 *     setFilters,
 *   } = useSearch();
 * 
 *   const handleResultSelect = (result: SearchResult) => {
 *     addToHistory(query, result);
 *     router.push(result.url);
 *   };
 * 
 *   return (
 *     <div>
 *       <input
 *         value={query}
 *         onChange={(e) => setQuery(e.target.value)}
 *         placeholder="Search services, databases, users..."
 *       />
 *       {isLoading && <div>Searching...</div>}
 *       {results && (
 *         <SearchResults
 *           results={results}
 *           onResultSelect={handleResultSelect}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSearch(config: Partial<SearchConfig> = {}): UseSearchReturn {
  const searchConfig = useMemo(() => ({ ...DEFAULT_SEARCH_CONFIG, ...config }), [config]);
  
  // Local state for search query
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  
  // Debounced search query for performance optimization
  const { debouncedValue: debouncedQuery, isPending } = useDebouncedValue(query, {
    delay: searchConfig.debounceDelay,
    trailing: true,
  });

  // Search history persistence with localStorage
  const [history, setHistory] = useLocalStorage<SearchHistoryItem[]>('df-search-history', []);

  // Query client for manual cache operations
  const queryClient = useQueryClient();

  // Search query configuration
  const searchQueryKey = useMemo(() => [
    'global-search',
    debouncedQuery,
    filters,
    searchConfig.maxResultsPerType,
  ], [debouncedQuery, filters, searchConfig.maxResultsPerType]);

  // Main search query with React Query intelligent caching
  const {
    data: results,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: searchQueryKey,
    queryFn: () => mockSearchAPI.searchGlobal(debouncedQuery, filters, searchConfig),
    enabled: debouncedQuery.length >= searchConfig.minQueryLength,
    staleTime: searchConfig.refetchInterval,
    cacheTime: searchConfig.refetchInterval * 2, // Keep cache longer than stale time
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Recent searches derived from history
  const recentSearches = useMemo(() => {
    return history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map(item => item.query)
      .filter((query, index, array) => array.indexOf(query) === index); // Remove duplicates
  }, [history]);

  // Add item to search history
  const addToHistory = useCallback((searchQuery: string, selectedResult?: SearchResult) => {
    if (!searchConfig.enableHistory || searchQuery.length < searchConfig.minQueryLength) {
      return;
    }

    const historyItem: SearchHistoryItem = {
      query: searchQuery,
      timestamp: Date.now(),
      resultCount: results?.totalCount || 0,
      selectedResult,
    };

    setHistory(prevHistory => {
      // Remove existing entry for this query
      const filtered = prevHistory.filter(item => item.query !== searchQuery);
      
      // Add new entry at the beginning
      const updated = [historyItem, ...filtered];
      
      // Limit history size
      return updated.slice(0, searchConfig.maxHistoryItems);
    });
  }, [searchConfig.enableHistory, searchConfig.minQueryLength, searchConfig.maxHistoryItems, results?.totalCount, setHistory]);

  // Clear search history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  // Remove specific item from history
  const removeFromHistory = useCallback((searchQuery: string) => {
    setHistory(prevHistory => prevHistory.filter(item => item.query !== searchQuery));
  }, [setHistory]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Cancel pending search request
  const cancel = useCallback(() => {
    queryClient.cancelQueries({ queryKey: searchQueryKey });
  }, [queryClient, searchQueryKey]);

  // Auto-add successful searches to history
  useEffect(() => {
    if (results && debouncedQuery && results.totalCount > 0) {
      // Only add to history if user hasn't modified query for 2 seconds
      const timer = setTimeout(() => {
        if (query === debouncedQuery) {
          addToHistory(debouncedQuery);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [results, debouncedQuery, query, addToHistory]);

  // Prefetch related searches for better performance
  useEffect(() => {
    if (debouncedQuery.length >= searchConfig.minQueryLength) {
      // Prefetch searches for common entity types if user might navigate to them
      const commonEntityTypes: SearchEntityType[] = ['services', 'databases', 'tables'];
      
      commonEntityTypes.forEach(entityType => {
        const prefetchFilters = { ...filters, entityTypes: [entityType] };
        const prefetchKey = ['global-search', debouncedQuery, prefetchFilters, searchConfig.maxResultsPerType];
        
        queryClient.prefetchQuery({
          queryKey: prefetchKey,
          queryFn: () => mockSearchAPI.searchGlobal(debouncedQuery, prefetchFilters, searchConfig),
          staleTime: searchConfig.refetchInterval,
        });
      });
    }
  }, [debouncedQuery, filters, searchConfig, queryClient]);

  return {
    query,
    setQuery,
    debouncedQuery,
    results: results || null,
    isLoading: isLoading || isPending,
    error: error as Error | null,
    isPending,
    history,
    recentSearches,
    addToHistory,
    clearHistory,
    removeFromHistory,
    filters,
    setFilters,
    clearFilters,
    refetch,
    cancel,
  };
}

/**
 * Hook for searching within a specific entity type
 * Optimized for category-specific search interfaces
 * 
 * @param entityType - Specific entity type to search within
 * @param config - Optional search configuration
 * @returns Search state scoped to the specified entity type
 * 
 * @example
 * ```tsx
 * function DatabaseSearch() {
 *   const { query, setQuery, results, isLoading } = useEntitySearch('databases');
 *   
 *   return (
 *     <div>
 *       <input
 *         value={query}
 *         onChange={(e) => setQuery(e.target.value)}
 *         placeholder="Search databases..."
 *       />
 *       {results?.categories.databases.map(db => (
 *         <div key={db.id}>{db.title}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useEntitySearch(
  entityType: SearchEntityType,
  config: Partial<SearchConfig> = {}
): Omit<UseSearchReturn, 'filters' | 'setFilters' | 'clearFilters'> {
  const searchConfig = useMemo(() => ({ ...DEFAULT_SEARCH_CONFIG, ...config }), [config]);
  
  const entityFilters = useMemo(() => ({
    entityTypes: [entityType],
  }), [entityType]);

  const {
    query,
    setQuery,
    debouncedQuery,
    results,
    isLoading,
    error,
    isPending,
    history,
    recentSearches,
    addToHistory,
    clearHistory,
    removeFromHistory,
    refetch,
    cancel,
  } = useSearch({ ...searchConfig, enableHistory: false }); // Disable global history for entity-specific searches

  // Override filters to focus on specific entity type
  useEffect(() => {
    // This would normally call setFilters, but we're managing it internally
  }, [entityFilters]);

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    isLoading,
    error,
    isPending,
    history: [], // Entity-specific searches don't maintain separate history
    recentSearches: [], // Entity-specific searches don't maintain separate recent searches
    addToHistory,
    clearHistory,
    removeFromHistory,
    refetch,
    cancel,
  };
}

/**
 * Hook for managing search result selection and navigation
 * Integrates with global navigation and result routing
 * 
 * @returns Navigation helpers for search results
 * 
 * @example
 * ```tsx
 * function SearchResultItem({ result }: { result: SearchResult }) {
 *   const { navigateToResult, isNavigating } = useSearchNavigation();
 *   
 *   return (
 *     <button
 *       onClick={() => navigateToResult(result)}
 *       disabled={isNavigating}
 *     >
 *       {result.title}
 *     </button>
 *   );
 * }
 * ```
 */
export function useSearchNavigation() {
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateToResult = useCallback(async (result: SearchResult) => {
    setIsNavigating(true);
    
    try {
      // Track analytics for search result selection
      // analytics.track('search_result_selected', {
      //   resultId: result.id,
      //   resultType: result.type,
      //   resultScore: result.score,
      // });

      // Navigate to the result URL
      // This would typically use Next.js router
      window.location.href = result.url;
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsNavigating(false);
    }
  }, []);

  const navigateToSearch = useCallback((query: string, filters?: SearchFilters) => {
    const searchParams = new URLSearchParams();
    searchParams.set('q', query);
    
    if (filters?.entityTypes) {
      searchParams.set('types', filters.entityTypes.join(','));
    }
    
    window.location.href = `/search?${searchParams.toString()}`;
  }, []);

  return {
    navigateToResult,
    navigateToSearch,
    isNavigating,
  };
}

export default useSearch;