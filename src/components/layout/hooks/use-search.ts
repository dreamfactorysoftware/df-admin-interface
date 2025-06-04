'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

// Core hook dependencies (will be created separately)
import { useDebounce } from '@/hooks/use-debounce';
import { useLocalStorage } from '@/hooks/use-local-storage';

/**
 * Search entity types that can be searched across the application
 */
export type SearchEntityType = 
  | 'services' 
  | 'tables' 
  | 'fields' 
  | 'schemas' 
  | 'users' 
  | 'roles' 
  | 'apps' 
  | 'scripts' 
  | 'files';

/**
 * Individual search result item
 */
export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: SearchEntityType;
  path: string;
  metadata?: Record<string, any>;
  highlightedTitle?: string;
  highlightedDescription?: string;
}

/**
 * Grouped search results by entity type
 */
export interface SearchResultGroup {
  type: SearchEntityType;
  label: string;
  results: SearchResult[];
  totalCount: number;
}

/**
 * Search API response structure
 */
export interface SearchResponse {
  query: string;
  total: number;
  groups: SearchResultGroup[];
  executionTime: number;
}

/**
 * Search dialog state configuration
 */
export interface SearchDialogState {
  isOpen: boolean;
  position?: { x: number; y: number };
}

/**
 * Recent search entry for local storage
 */
export interface RecentSearch {
  query: string;
  timestamp: number;
  resultCount: number;
}

/**
 * Search hook options for configuration
 */
export interface UseSearchOptions {
  debounceDelay?: number;
  maxRecentSearches?: number;
  enableCaching?: boolean;
  cacheTime?: number;
  staleTime?: number;
}

/**
 * Search hook return interface
 */
export interface UseSearchReturn {
  // Search input state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  debouncedQuery: string;
  
  // Search results
  searchResults: SearchResponse | null;
  isSearching: boolean;
  searchError: Error | null;
  
  // Search dialog state
  dialogState: SearchDialogState;
  openSearchDialog: (position?: { x: number; y: number }) => void;
  closeSearchDialog: () => void;
  
  // Search operations
  executeSearch: (query: string) => Promise<SearchResponse | null>;
  clearSearch: () => void;
  
  // Recent searches
  recentSearches: RecentSearch[];
  addRecentSearch: (query: string, resultCount: number) => void;
  clearRecentSearches: () => void;
  
  // Navigation
  navigateToResult: (result: SearchResult) => void;
}

/**
 * Mock API client for search operations
 * This should be replaced with actual API client when available
 */
const searchApiClient = {
  async search(query: string): Promise<SearchResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Mock search results for different entity types
    const mockResults: SearchResultGroup[] = [
      {
        type: 'services',
        label: 'Database Services',
        results: [
          {
            id: 'service-1',
            title: `MySQL Production Service`,
            description: `Production MySQL database service with ${query} configuration`,
            type: 'services',
            path: '/api-connections/database/mysql-prod',
            metadata: { database: 'mysql', status: 'active' }
          }
        ],
        totalCount: 1
      },
      {
        type: 'tables',
        label: 'Database Tables',
        results: [
          {
            id: 'table-1',
            title: `user_${query}`,
            description: `Table containing user data matching ${query}`,
            type: 'tables',
            path: '/adf-schema/tables/user_data',
            metadata: { rows: 1250, service: 'mysql-prod' }
          }
        ],
        totalCount: 1
      }
    ].filter(group => 
      group.results.some(result => 
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description?.toLowerCase().includes(query.toLowerCase())
      )
    );

    return {
      query,
      total: mockResults.reduce((sum, group) => sum + group.totalCount, 0),
      groups: mockResults,
      executionTime: Math.round(50 + Math.random() * 100)
    };
  }
};

/**
 * Global search functionality hook with debounced input handling, React Query caching,
 * and search dialog integration. Replaces Angular search service patterns with React
 * Query caching and optimized search workflows.
 * 
 * Features:
 * - Debounced search input with configurable delay (default 1000ms)
 * - React Query caching with intelligent cache invalidation
 * - Search dialog state management with position controls
 * - Recent searches persistence with localStorage
 * - Cross-component search functionality integration
 * - Comprehensive error handling and validation
 * 
 * @param options Configuration options for search behavior
 * @returns Search state and operations interface
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceDelay = 1000,
    maxRecentSearches = 10,
    enableCaching = true,
    cacheTime = 300000, // 5 minutes
    staleTime = 30000,  // 30 seconds
  } = options;

  const router = useRouter();
  const queryClient = useQueryClient();

  // Search input state with debouncing for performance optimization
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedQuery = useDebounce(searchQuery, debounceDelay);

  // Search dialog state management
  const [dialogState, setDialogState] = useState<SearchDialogState>({
    isOpen: false,
  });

  // Recent searches persistence using localStorage
  const [recentSearches, setRecentSearches] = useLocalStorage<RecentSearch[]>(
    'df-recent-searches',
    []
  );

  // React Query for search operations with intelligent caching
  const {
    data: searchResults,
    error: searchError,
    isLoading: isSearching,
    refetch: refetchSearch,
  } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: () => searchApiClient.search(debouncedQuery),
    enabled: Boolean(debouncedQuery && debouncedQuery.trim().length >= 2),
    staleTime: enableCaching ? staleTime : 0,
    cacheTime: enableCaching ? cacheTime : 0,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Keep previous data while fetching new results for better UX
    keepPreviousData: true,
    // Background refetching for fresh data
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Search execution mutation for manual search operations
  const searchMutation = useMutation({
    mutationFn: (query: string) => searchApiClient.search(query),
    onSuccess: (data, query) => {
      // Update the query cache with new results
      queryClient.setQueryData(['global-search', query], data);
      
      // Add to recent searches if results found
      if (data.total > 0) {
        addRecentSearch(query, data.total);
      }
    },
    onError: (error) => {
      console.error('Search execution failed:', error);
    },
  });

  /**
   * Opens the search dialog with optional positioning
   */
  const openSearchDialog = useCallback((position?: { x: number; y: number }) => {
    setDialogState({
      isOpen: true,
      position,
    });
  }, []);

  /**
   * Closes the search dialog and optionally clears search state
   */
  const closeSearchDialog = useCallback(() => {
    setDialogState({
      isOpen: false,
      position: undefined,
    });
  }, []);

  /**
   * Executes a search operation manually with immediate results
   */
  const executeSearch = useCallback(async (query: string): Promise<SearchResponse | null> => {
    if (!query || query.trim().length < 2) {
      return null;
    }

    try {
      const result = await searchMutation.mutateAsync(query);
      setSearchQuery(query);
      return result;
    } catch (error) {
      console.error('Search execution error:', error);
      return null;
    }
  }, [searchMutation]);

  /**
   * Clears current search state and results
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    // Clear the cache for the current query
    if (debouncedQuery) {
      queryClient.removeQueries(['global-search', debouncedQuery]);
    }
  }, [debouncedQuery, queryClient]);

  /**
   * Adds a search query to recent searches with deduplication
   */
  const addRecentSearch = useCallback((query: string, resultCount: number) => {
    if (!query || query.trim().length < 2) return;

    const newRecentSearch: RecentSearch = {
      query: query.trim(),
      timestamp: Date.now(),
      resultCount,
    };

    setRecentSearches(prevRecent => {
      // Remove duplicate queries
      const filtered = prevRecent.filter(
        recent => recent.query.toLowerCase() !== query.toLowerCase()
      );
      
      // Add new search at the beginning and limit to max count
      return [newRecentSearch, ...filtered].slice(0, maxRecentSearches);
    });
  }, [maxRecentSearches, setRecentSearches]);

  /**
   * Clears all recent searches from localStorage
   */
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, [setRecentSearches]);

  /**
   * Navigates to a search result and closes the search dialog
   */
  const navigateToResult = useCallback((result: SearchResult) => {
    // Add to recent searches if valid result
    if (searchResults) {
      addRecentSearch(searchResults.query, searchResults.total);
    }
    
    // Close dialog before navigation
    closeSearchDialog();
    
    // Navigate using Next.js router
    router.push(result.path);
  }, [searchResults, addRecentSearch, closeSearchDialog, router]);

  // Effect to automatically add successful searches to recent searches
  useEffect(() => {
    if (searchResults && searchResults.total > 0 && debouncedQuery) {
      addRecentSearch(debouncedQuery, searchResults.total);
    }
  }, [searchResults, debouncedQuery, addRecentSearch]);

  // Memoized return object for performance optimization
  const returnValue = useMemo(() => ({
    // Search input state
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    
    // Search results with null fallback
    searchResults: searchResults || null,
    isSearching: isSearching || searchMutation.isLoading,
    searchError: searchError || searchMutation.error,
    
    // Search dialog state
    dialogState,
    openSearchDialog,
    closeSearchDialog,
    
    // Search operations
    executeSearch,
    clearSearch,
    
    // Recent searches
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    
    // Navigation
    navigateToResult,
  }), [
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    searchResults,
    isSearching,
    searchError,
    searchMutation.isLoading,
    searchMutation.error,
    dialogState,
    openSearchDialog,
    closeSearchDialog,
    executeSearch,
    clearSearch,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    navigateToResult,
  ]);

  return returnValue;
}

/**
 * Hook for accessing global search state across components
 * Provides a singleton-like pattern for search state
 */
export function useGlobalSearch() {
  return useSearch({
    debounceDelay: 1000,
    maxRecentSearches: 10,
    enableCaching: true,
    cacheTime: 300000,
    staleTime: 30000,
  });
}

/**
 * Utility function to generate translation keys for search result groups
 * Maintains compatibility with Angular translation patterns
 */
export function getSearchTranslationKey(type: SearchEntityType): string {
  const keyMap: Record<SearchEntityType, string> = {
    services: 'search.groups.services',
    tables: 'search.groups.tables',
    fields: 'search.groups.fields',
    schemas: 'search.groups.schemas',
    users: 'search.groups.users',
    roles: 'search.groups.roles',
    apps: 'search.groups.apps',
    scripts: 'search.groups.scripts',
    files: 'search.groups.files',
  };
  
  return keyMap[type] || `search.groups.${type}`;
}

/**
 * Utility function to format search result paths for navigation
 */
export function formatSearchResultPath(result: SearchResult): string {
  // Ensure path starts with '/' for Next.js routing
  return result.path.startsWith('/') ? result.path : `/${result.path}`;
}

/**
 * Type guard to check if a search result is valid for navigation
 */
export function isValidSearchResult(result: any): result is SearchResult {
  return (
    result &&
    typeof result.id === 'string' &&
    typeof result.title === 'string' &&
    typeof result.type === 'string' &&
    typeof result.path === 'string'
  );
}

export default useSearch;