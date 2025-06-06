/**
 * Search Dialog Component System - Barrel Export
 * 
 * Comprehensive export file for the React 19/Next.js 15.1 search dialog component system,
 * replacing Angular df-search-dialog with modern React patterns and enhanced functionality.
 * 
 * Provides centralized exports for:
 * - Main SearchDialog component with command palette functionality
 * - Sub-components for advanced customization (SearchResultItem, SearchInput)
 * - TypeScript interfaces and types for complete type safety
 * - Utility hooks for search management and keyboard navigation
 * - Search result formatters and keyboard utilities
 * - Type guards for runtime type checking
 * 
 * Features:
 * - WCAG 2.1 AA accessibility compliance with keyboard navigation support
 * - React Query integration for intelligent search result caching
 * - Debounced search input with 300ms delay for optimal performance
 * - Recent searches persistence with local storage cleanup
 * - Global keyboard shortcuts (Cmd/Ctrl+K) for search activation
 * - Mobile-responsive design with touch-friendly interactions
 * - Dark mode support with proper contrast ratios
 * - Headless UI primitives for accessible modal and combobox patterns
 * 
 * @fileoverview Barrel export for search dialog component system
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

// =============================================================================
// MAIN COMPONENTS
// =============================================================================

/**
 * Main SearchDialog component - both default and named export per requirements
 * Global search dialog with command palette functionality, accessibility features,
 * and responsive design. Replaces Angular df-search-dialog component.
 */
export { SearchDialog as default, SearchDialog } from './search-dialog';

/**
 * SearchResultItem component for advanced customization
 * Individual search result item with keyboard navigation, accessibility,
 * and visual hierarchy. Supports custom styling and metadata display.
 */
export { SearchResultItem, default as SearchResultItemComponent } from './search-result-item';

/**
 * SearchInput component for standalone search functionality
 * Specialized search input with debouncing, keyboard shortcuts, and accessibility.
 * Can be used independently for custom search implementations.
 */
export { SearchInput, type SearchInputProps } from './search-input';

// =============================================================================
// TYPESCRIPT INTERFACES AND TYPES
// =============================================================================

/**
 * Core search dialog interfaces and types for complete type safety
 */
export type {
  // Main component interfaces
  SearchDialogProps,
  SearchDialogRef,
  SearchDialogState,
  
  // Search result interfaces
  SearchResult,
  SearchResultGroup,
  SearchResultAction,
  SearchKeyboardEvent,
  
  // Configuration interfaces
  SearchA11yConfig,
  SearchResponsiveConfig,
  RecentSearches,
  
  // Context and utility interfaces
  SearchContextValue,
  
  // Utility types for specific result metadata
  SearchResultMetadataByType,
  TypedSearchResult,
} from './types';

/**
 * Search result type enumeration for categorization
 * Supports all major DreamFactory entities and system components
 */
export { SearchResultType } from './types';

/**
 * Type guard functions for runtime type checking
 * Provides safe type narrowing for search results and events
 */
export { 
  isSearchResult, 
  isSearchResultGroup, 
  isSearchKeyboardEvent 
} from './types';

// =============================================================================
// UTILITY HOOKS FOR SEARCH MANAGEMENT
// =============================================================================

/**
 * Custom hook for managing recent searches with local storage persistence
 * Provides automatic cleanup and intelligent search history management
 * 
 * @param maxCount - Maximum number of recent searches to retain (default: 10)
 * @returns Object with recent searches array and management functions
 */
export const useRecentSearches = (maxCount: number = 10) => {
  // Re-export the internal hook from search-dialog for external use
  // This hook is defined in the SearchDialog component but can be useful standalone
  const { useState, useEffect, useCallback } = require('react');
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
};

/**
 * Custom hook for debounced search functionality with React Query integration
 * Provides intelligent caching, error handling, and performance optimization
 * 
 * @param query - Current search query string
 * @param debounceDelay - Debounce delay in milliseconds (default: 300ms)
 * @param minQueryLength - Minimum query length to trigger search (default: 2)
 * @returns Object with search results, loading state, and error handling
 */
export const useSearchQuery = (
  query: string, 
  debounceDelay: number = 300, 
  minQueryLength: number = 2
) => {
  const { useState, useEffect } = require('react');
  const { useQuery } = require('@tanstack/react-query');
  
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
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < minQueryLength) {
        return [];
      }

      // This would be replaced with actual API call in production
      const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      return response.json();
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
};

/**
 * Custom hook for keyboard navigation within search results
 * Provides arrow key navigation, selection handling, and accessibility support
 * 
 * @param results - Array of search result groups
 * @param onSelect - Callback for result selection
 * @param onClose - Callback for closing search dialog
 * @returns Object with navigation state and keyboard event handlers
 */
export const useSearchNavigation = (
  results: SearchResultGroup[],
  onSelect: (result: SearchResult) => void,
  onClose: () => void
) => {
  const { useState, useMemo, useCallback, useEffect } = require('react');
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
};

// =============================================================================
// SEARCH RESULT FORMATTERS AND UTILITIES
// =============================================================================

/**
 * Format search result title with highlighting for search terms
 * Creates accessible highlighted text for screen readers
 * 
 * @param text - Text to format
 * @param searchQuery - Search query to highlight
 * @returns Formatted text with highlight markers
 */
export const formatSearchResultTitle = (text: string, searchQuery: string): string => {
  if (!searchQuery || !text) return text;
  
  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '**$1**'); // Use markdown-style highlighting
};

/**
 * Format search result metadata for display
 * Provides consistent formatting across different result types
 * 
 * @param result - Search result with metadata
 * @returns Formatted metadata string
 */
export const formatSearchResultMetadata = (result: SearchResult): string => {
  const { type, metadata } = result;
  
  switch (type) {
    case SearchResultType.DATABASE_SERVICE:
      if (metadata?.database) {
        const { tableCount, connectionStatus, engine } = metadata.database;
        return `${tableCount || 0} tables • ${engine || 'Unknown'} • ${connectionStatus || 'unknown'}`;
      }
      break;
      
    case SearchResultType.DATABASE_TABLE:
      if (metadata?.database) {
        const { fieldCount } = metadata.database;
        return `${fieldCount || 0} fields`;
      }
      break;
      
    case SearchResultType.USER:
      if (metadata?.user) {
        const { role, status } = metadata.user;
        return `${role || 'User'} • ${status || 'unknown'}`;
      }
      break;
      
    default:
      return result.subtitle || '';
  }
  
  return result.subtitle || '';
};

/**
 * Sort search results by relevance and type priority
 * Implements intelligent sorting based on search score and result type
 * 
 * @param results - Array of search results to sort
 * @param query - Search query for relevance calculation
 * @returns Sorted array of search results
 */
export const sortSearchResults = (results: SearchResult[], query: string): SearchResult[] => {
  // Define type priority order
  const typePriority: Record<SearchResultType, number> = {
    [SearchResultType.DATABASE_SERVICE]: 1,
    [SearchResultType.DATABASE_TABLE]: 2,
    [SearchResultType.DATABASE_FIELD]: 3,
    [SearchResultType.USER]: 4,
    [SearchResultType.ADMIN]: 4,
    [SearchResultType.ROLE]: 5,
    [SearchResultType.API_ENDPOINT]: 6,
    [SearchResultType.API_DOCUMENTATION]: 7,
    [SearchResultType.SYSTEM_SETTING]: 8,
    [SearchResultType.APPLICATION]: 9,
    [SearchResultType.EVENT_SCRIPT]: 10,
    [SearchResultType.EMAIL_TEMPLATE]: 11,
    [SearchResultType.FILE]: 12,
    [SearchResultType.REPORT]: 13,
    [SearchResultType.SCHEDULED_TASK]: 14,
    [SearchResultType.LOOKUP_KEY]: 15,
    [SearchResultType.API_LIMIT]: 16,
  };

  return results.sort((a, b) => {
    // First, sort by relevance score if available
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    if (scoreA !== scoreB) {
      return scoreB - scoreA; // Higher score first
    }
    
    // Then by type priority
    const priorityA = typePriority[a.type] || 999;
    const priorityB = typePriority[b.type] || 999;
    if (priorityA !== priorityB) {
      return priorityA - priorityB; // Lower priority number first
    }
    
    // Finally by title relevance (exact match, starts with, contains)
    const queryLower = query.toLowerCase();
    const titleA = a.title.toLowerCase();
    const titleB = b.title.toLowerCase();
    
    // Exact match
    if (titleA === queryLower && titleB !== queryLower) return -1;
    if (titleB === queryLower && titleA !== queryLower) return 1;
    
    // Starts with
    if (titleA.startsWith(queryLower) && !titleB.startsWith(queryLower)) return -1;
    if (titleB.startsWith(queryLower) && !titleA.startsWith(queryLower)) return 1;
    
    // Alphabetical
    return titleA.localeCompare(titleB);
  });
};

/**
 * Group search results by type for organized display
 * Creates SearchResultGroup objects from flat result arrays
 * 
 * @param results - Array of flat search results
 * @param maxPerGroup - Maximum results per group (default: 8)
 * @returns Array of SearchResultGroup objects
 */
export const groupSearchResults = (
  results: SearchResult[], 
  maxPerGroup: number = 8
): SearchResultGroup[] => {
  // Group results by type
  const grouped = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<SearchResultType, SearchResult[]>);

  // Convert to SearchResultGroup objects
  return Object.entries(grouped).map(([type, groupResults]) => {
    const resultType = type as SearchResultType;
    const limitedResults = groupResults.slice(0, maxPerGroup);
    
    // Get group metadata
    const groupTitles: Record<SearchResultType, string> = {
      [SearchResultType.DATABASE_SERVICE]: 'Database Services',
      [SearchResultType.DATABASE_TABLE]: 'Tables',
      [SearchResultType.DATABASE_FIELD]: 'Fields',
      [SearchResultType.USER]: 'Users',
      [SearchResultType.ADMIN]: 'Administrators',
      [SearchResultType.ROLE]: 'Roles',
      [SearchResultType.SYSTEM_SETTING]: 'System Settings',
      [SearchResultType.API_DOCUMENTATION]: 'API Documentation',
      [SearchResultType.API_ENDPOINT]: 'API Endpoints',
      [SearchResultType.APPLICATION]: 'Applications',
      [SearchResultType.EVENT_SCRIPT]: 'Event Scripts',
      [SearchResultType.EMAIL_TEMPLATE]: 'Email Templates',
      [SearchResultType.FILE]: 'Files',
      [SearchResultType.REPORT]: 'Reports',
      [SearchResultType.SCHEDULED_TASK]: 'Scheduled Tasks',
      [SearchResultType.LOOKUP_KEY]: 'Lookup Keys',
      [SearchResultType.API_LIMIT]: 'API Limits',
    };

    return {
      type: resultType,
      title: groupTitles[resultType] || type,
      description: `${groupResults.length} ${groupResults.length === 1 ? 'result' : 'results'}`,
      results: limitedResults,
      totalCount: groupResults.length,
      filterable: true,
      collapsible: false,
      defaultCollapsed: false,
    };
  });
};

// =============================================================================
// KEYBOARD UTILITIES FOR GLOBAL SHORTCUT INTEGRATION
// =============================================================================

/**
 * Global keyboard shortcut manager for search activation
 * Handles Cmd/Ctrl+K shortcut registration and cleanup
 * 
 * @param callback - Function to call when shortcut is triggered
 * @returns Cleanup function to remove event listener
 */
export const useGlobalSearchShortcut = (callback: () => void) => {
  const { useEffect } = require('react');
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd/Ctrl+K
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        event.stopPropagation();
        callback();
      }
    };

    // Add event listener to document for global capture
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    
    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [callback]);
};

/**
 * Keyboard navigation utilities for search results
 * Provides helper functions for managing keyboard interactions
 */
export const searchKeyboardUtils = {
  /**
   * Check if event should trigger search dialog
   */
  isSearchTrigger: (event: KeyboardEvent): boolean => {
    return (event.metaKey || event.ctrlKey) && event.key === 'k';
  },
  
  /**
   * Check if event should close search dialog
   */
  isCloseEvent: (event: KeyboardEvent): boolean => {
    return event.key === 'Escape';
  },
  
  /**
   * Check if event should navigate results
   */
  isNavigationEvent: (event: KeyboardEvent): boolean => {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
  },
  
  /**
   * Check if event should select result
   */
  isSelectionEvent: (event: KeyboardEvent): boolean => {
    return event.key === 'Enter' || event.key === ' ';
  },
  
  /**
   * Get navigation direction from keyboard event
   */
  getNavigationDirection: (event: KeyboardEvent): 'up' | 'down' | 'left' | 'right' | null => {
    switch (event.key) {
      case 'ArrowUp': return 'up';
      case 'ArrowDown': return 'down';
      case 'ArrowLeft': return 'left';
      case 'ArrowRight': return 'right';
      default: return null;
    }
  },
  
  /**
   * Prevent default behavior for handled keyboard events
   */
  handleKeyboardEvent: (event: KeyboardEvent, handler: () => void): void => {
    event.preventDefault();
    event.stopPropagation();
    handler();
  },
};

// =============================================================================
// SEARCH CONTEXT UTILITIES
// =============================================================================

/**
 * Search result cache utilities for performance optimization
 * Provides intelligent caching and invalidation strategies
 */
export const searchCacheUtils = {
  /**
   * Generate cache key for search query
   */
  getCacheKey: (query: string, filters?: any): string => {
    const filterString = filters ? JSON.stringify(filters) : '';
    return `search:${query}:${filterString}`;
  },
  
  /**
   * Check if search results are still valid
   */
  isResultValid: (timestamp: number, maxAge: number = 300000): boolean => {
    return Date.now() - timestamp < maxAge; // Default 5 minutes
  },
  
  /**
   * Invalidate search cache for specific pattern
   */
  invalidateCache: (pattern: string): void => {
    // This would integrate with React Query's cache invalidation
    // Implementation depends on the specific caching strategy
    console.debug(`Invalidating search cache for pattern: ${pattern}`);
  },
};

// =============================================================================
// EXPORTS SUMMARY
// =============================================================================

/**
 * Complete export summary for search dialog component system:
 * 
 * Components:
 * - SearchDialog (default export) - Main search dialog component
 * - SearchDialog (named export) - Same component for flexibility
 * - SearchResultItem - Individual result item component
 * - SearchInput - Standalone search input component
 * 
 * Types:
 * - All TypeScript interfaces and enums from types.ts
 * - Type guards for runtime type checking
 * 
 * Hooks:
 * - useRecentSearches - Recent search management
 * - useSearchQuery - Debounced search with React Query
 * - useSearchNavigation - Keyboard navigation
 * - useGlobalSearchShortcut - Global keyboard shortcuts
 * 
 * Utilities:
 * - formatSearchResultTitle - Text formatting with highlights
 * - formatSearchResultMetadata - Metadata formatting
 * - sortSearchResults - Intelligent result sorting
 * - groupSearchResults - Result grouping by type
 * - searchKeyboardUtils - Keyboard event utilities
 * - searchCacheUtils - Cache management utilities
 * 
 * This barrel export provides a complete API for implementing
 * search functionality throughout the React/Next.js application.
 */