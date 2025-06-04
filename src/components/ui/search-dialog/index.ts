/**
 * Search Dialog Component System - Barrel Export
 * 
 * This module provides a comprehensive command palette-style search dialog system
 * for the DreamFactory Admin Interface. Implements WCAG 2.1 AA accessibility standards
 * and follows React 19/Next.js 15.1 architectural patterns.
 * 
 * @fileoverview Centralized exports for search dialog components, hooks, utilities, and types
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

/**
 * Main search dialog component - provides global search functionality
 * with keyboard navigation, debounced input, and accessibility features.
 * 
 * @example
 * ```tsx
 * import { SearchDialog } from '@/components/ui/search-dialog';
 * 
 * function GlobalSearch() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   
 *   return (
 *     <SearchDialog 
 *       isOpen={isOpen}
 *       onClose={() => setIsOpen(false)}
 *       onNavigate={(path) => router.push(path)}
 *     />
 *   );
 * }
 * ```
 */
export { SearchDialog } from './search-dialog';

/**
 * Default export for compatibility with dynamic imports
 * Enables: import SearchDialog from '@/components/ui/search-dialog'
 */
export { SearchDialog as default } from './search-dialog';

/**
 * Search input component with debouncing and keyboard shortcuts.
 * Used internally by SearchDialog but can be used standalone.
 * 
 * @example
 * ```tsx
 * import { SearchInput } from '@/components/ui/search-dialog';
 * 
 * <SearchInput
 *   value={query}
 *   onChange={setQuery}
 *   placeholder="Search databases, tables, users..."
 *   className="w-full"
 * />
 * ```
 */
export { SearchInput } from './search-input';

/**
 * Individual search result item component with keyboard navigation
 * and proper accessibility features.
 * 
 * @example
 * ```tsx
 * import { SearchResultItem } from '@/components/ui/search-dialog';
 * 
 * <SearchResultItem
 *   result={searchResult}
 *   isSelected={selectedIndex === index}
 *   onSelect={() => handleSelect(result)}
 *   onMouseEnter={() => setSelectedIndex(index)}
 * />
 * ```
 */
export { SearchResultItem } from './search-result-item';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Core TypeScript interfaces and types for search functionality.
 * Provides complete type safety across the search system.
 */
export type {
  // Main component props interfaces
  SearchDialogProps,
  SearchInputProps,
  SearchResultItemProps,
  
  // Data structure types
  SearchResult,
  SearchResultGroup,
  SearchResultType,
  SearchCategory,
  
  // State management types
  SearchDialogState,
  SearchFilters,
  SearchQueryOptions,
  
  // Event handler types
  SearchKeyboardEvent,
  SearchNavigationEvent,
  SearchSelectionEvent,
  
  // Configuration types
  SearchA11yConfig,
  SearchKeyboardConfig,
  SearchPerformanceConfig,
  
  // Recent searches types
  RecentSearches,
  RecentSearchItem,
  RecentSearchConfig,
  
  // Response types
  SearchApiResponse,
  SearchErrorResponse,
  SearchMetadata,
} from './types';

// =============================================================================
// UTILITY FUNCTION EXPORTS
// =============================================================================

/**
 * Custom React hook for search functionality with React Query integration.
 * Provides debounced search, caching, and error handling.
 * 
 * @example
 * ```tsx
 * import { useSearch } from '@/components/ui/search-dialog';
 * 
 * function MyComponent() {
 *   const {
 *     query,
 *     setQuery,
 *     results,
 *     isLoading,
 *     error,
 *     clearSearch
 *   } = useSearch({
 *     debounceMs: 300,
 *     minQueryLength: 2,
 *     categories: ['database', 'table', 'user']
 *   });
 *   
 *   return (
 *     // Search implementation
 *   );
 * }
 * ```
 */
export { useSearch } from '../../../hooks/use-search';

/**
 * Hook for managing recent searches with localStorage persistence.
 * Automatically handles cleanup and provides search history.
 * 
 * @example
 * ```tsx
 * import { useRecentSearches } from '@/components/ui/search-dialog';
 * 
 * const {
 *   recentSearches,
 *   addRecentSearch,
 *   removeRecentSearch,
 *   clearRecentSearches
 * } = useRecentSearches({
 *   maxItems: 10,
 *   storageKey: 'df-recent-searches'
 * });
 * ```
 */
export { useRecentSearches } from '../../../hooks/use-recent-searches';

/**
 * Global keyboard shortcut hook for search dialog triggers.
 * Implements Cmd/Ctrl+K functionality per Section 7.6.4.
 * 
 * @example
 * ```tsx
 * import { useSearchKeyboard } from '@/components/ui/search-dialog';
 * 
 * function App() {
 *   const [isSearchOpen, setIsSearchOpen] = useState(false);
 *   
 *   useSearchKeyboard({
 *     onOpen: () => setIsSearchOpen(true),
 *     enabled: !isSearchOpen,
 *     preventDefault: true
 *   });
 *   
 *   return (
 *     <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
 *   );
 * }
 * ```
 */
export { useSearchKeyboard } from '../../../hooks/use-search-keyboard';

// =============================================================================
// SEARCH UTILITY FUNCTIONS
// =============================================================================

/**
 * Search result formatting utilities for consistent display.
 * Handles result type detection, icon assignment, and content formatting.
 */
export {
  /**
   * Formats raw search results into consistent display format
   * 
   * @example
   * ```tsx
   * import { formatSearchResults } from '@/components/ui/search-dialog';
   * 
   * const formattedResults = formatSearchResults(apiResults, {
   *   highlightQuery: true,
   *   groupByCategory: true,
   *   maxResults: 50
   * });
   * ```
   */
  formatSearchResults,
  
  /**
   * Groups search results by category for organized display
   * 
   * @example
   * ```tsx
   * import { groupSearchResults } from '@/components/ui/search-dialog';
   * 
   * const groupedResults = groupSearchResults(results, {
   *   categories: ['database', 'table', 'user', 'setting'],
   *   sortWithinGroups: true
   * });
   * ```
   */
  groupSearchResults,
  
  /**
   * Highlights query matches within search result text
   * 
   * @example
   * ```tsx
   * import { highlightSearchMatches } from '@/components/ui/search-dialog';
   * 
   * const highlighted = highlightSearchMatches(
   *   'User Management Settings',
   *   'user',
   *   { className: 'bg-yellow-200 font-semibold' }
   * );
   * ```
   */
  highlightSearchMatches,
  
  /**
   * Filters search results based on category, permissions, and user context
   * 
   * @example
   * ```tsx
   * import { filterSearchResults } from '@/components/ui/search-dialog';
   * 
   * const filtered = filterSearchResults(results, {
   *   categories: ['database'],
   *   userPermissions: ['database.read'],
   *   excludeTypes: ['archived']
   * });
   * ```
   */
  filterSearchResults,
  
  /**
   * Calculates search result relevance scores for sorting
   * 
   * @example
   * ```tsx
   * import { calculateRelevanceScore } from '@/components/ui/search-dialog';
   * 
   * const score = calculateRelevanceScore(result, query, {
   *   titleWeight: 2.0,
   *   descriptionWeight: 1.0,
   *   categoryWeight: 0.5
   * });
   * ```
   */
  calculateRelevanceScore,
  
} from '../../../lib/search-utils';

// =============================================================================
// SEARCH NAVIGATION UTILITIES
// =============================================================================

/**
 * Navigation and routing utilities for search result handling.
 * Provides consistent navigation patterns across search results.
 */
export {
  /**
   * Handles navigation to search result targets with proper route mapping
   * 
   * @example
   * ```tsx
   * import { navigateToSearchResult } from '@/components/ui/search-dialog';
   * 
   * const handleResultSelect = (result: SearchResult) => {
   *   navigateToSearchResult(result, router, {
   *     openInNewTab: result.type === 'external',
   *     preserveSearchState: false
   *   });
   * };
   * ```
   */
  navigateToSearchResult,
  
  /**
   * Generates route paths for different search result types
   * 
   * @example
   * ```tsx
   * import { getSearchResultRoute } from '@/components/ui/search-dialog';
   * 
   * const route = getSearchResultRoute(result, {
   *   includeParams: true,
   *   absolutePath: false
   * });
   * ```
   */
  getSearchResultRoute,
  
  /**
   * Determines if a search result is accessible based on user permissions
   * 
   * @example
   * ```tsx
   * import { isSearchResultAccessible } from '@/components/ui/search-dialog';
   * 
   * const canAccess = isSearchResultAccessible(result, userPermissions, {
   *   checkRolePermissions: true,
   *   includeReadOnly: false
   * });
   * ```
   */
  isSearchResultAccessible,
  
} from '../../../lib/search-navigation';

// =============================================================================
// KEYBOARD NAVIGATION UTILITIES
// =============================================================================

/**
 * Keyboard navigation utilities for command palette interactions.
 * Implements accessible keyboard navigation patterns per Section 7.6.4.
 */
export {
  /**
   * Global search keyboard shortcut keys configuration
   * 
   * @example
   * ```tsx
   * import { SEARCH_KEYBOARD_SHORTCUTS } from '@/components/ui/search-dialog';
   * 
   * // Access predefined shortcuts
   * const openShortcut = SEARCH_KEYBOARD_SHORTCUTS.OPEN_SEARCH; // 'Cmd+K' or 'Ctrl+K'
   * const closeShortcut = SEARCH_KEYBOARD_SHORTCUTS.CLOSE_DIALOG; // 'Escape'
   * ```
   */
  SEARCH_KEYBOARD_SHORTCUTS,
  
  /**
   * Keyboard event handler for arrow navigation within search results
   * 
   * @example
   * ```tsx
   * import { handleSearchKeyNavigation } from '@/components/ui/search-dialog';
   * 
   * const onKeyDown = (event: KeyboardEvent) => {
   *   const action = handleSearchKeyNavigation(event, {
   *     currentIndex: selectedIndex,
   *     resultCount: results.length,
   *     enableWrapAround: true
   *   });
   *   
   *   if (action) {
   *     setSelectedIndex(action.newIndex);
   *     if (action.shouldSelect) {
   *       handleResultSelect(results[action.newIndex]);
   *     }
   *   }
   * };
   * ```
   */
  handleSearchKeyNavigation,
  
  /**
   * Accessibility helper for proper ARIA announcements during navigation
   * 
   * @example
   * ```tsx
   * import { announceSearchNavigation } from '@/components/ui/search-dialog';
   * 
   * // Announce current selection to screen readers
   * announceSearchNavigation(result, selectedIndex, totalResults, {
   *   includeInstructions: true,
   *   polite: false // use assertive for immediate feedback
   * });
   * ```
   */
  announceSearchNavigation,
  
} from '../../../lib/search-keyboard';

// =============================================================================
// ACCESSIBILITY UTILITIES
// =============================================================================

/**
 * WCAG 2.1 AA accessibility utilities for search components.
 * Ensures proper screen reader support and keyboard navigation.
 */
export {
  /**
   * Generates proper ARIA attributes for search components
   * 
   * @example
   * ```tsx
   * import { getSearchAriaAttributes } from '@/components/ui/search-dialog';
   * 
   * const ariaProps = getSearchAriaAttributes({
   *   role: 'combobox',
   *   hasResults: results.length > 0,
   *   selectedIndex: currentSelection,
   *   isExpanded: isOpen
   * });
   * ```
   */
  getSearchAriaAttributes,
  
  /**
   * Screen reader announcement helper for search state changes
   * 
   * @example
   * ```tsx
   * import { announceSearchState } from '@/components/ui/search-dialog';
   * 
   * // Announce search results count
   * announceSearchState(`Found ${results.length} results for "${query}"`, {
   *   priority: 'polite',
   *   includeInstructions: true
   * });
   * ```
   */
  announceSearchState,
  
} from '../../../lib/search-accessibility';

// =============================================================================
// SEARCH CONFIGURATION CONSTANTS
// =============================================================================

/**
 * Default configuration constants for search functionality.
 * Provides consistent defaults across the application.
 */
export const SEARCH_CONFIG = {
  /**
   * Default debounce delay for search input (milliseconds)
   * Optimized for responsive search without excessive API calls
   */
  DEFAULT_DEBOUNCE_MS: 300,
  
  /**
   * Minimum query length before triggering search
   * Prevents excessive API calls for very short queries
   */
  MIN_QUERY_LENGTH: 2,
  
  /**
   * Maximum number of search results to display
   * Ensures good performance with large result sets
   */
  MAX_RESULTS: 50,
  
  /**
   * Maximum number of recent searches to store
   * Balances utility with localStorage size
   */
  MAX_RECENT_SEARCHES: 10,
  
  /**
   * Default search categories included in global search
   * Can be overridden per search instance
   */
  DEFAULT_CATEGORIES: [
    'database',
    'table', 
    'user',
    'role',
    'setting',
    'api-docs'
  ] as const,
  
  /**
   * LocalStorage key for persisting recent searches
   * Consistent across the application
   */
  RECENT_SEARCHES_KEY: 'dreamfactory-recent-searches',
  
  /**
   * Search result cache duration (milliseconds)
   * Balances freshness with performance
   */
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  
} as const;

/**
 * Accessibility configuration constants per WCAG 2.1 AA standards
 */
export const SEARCH_A11Y_CONFIG = {
  /**
   * Minimum contrast ratio for search result highlighting
   */
  MIN_CONTRAST_RATIO: 4.5,
  
  /**
   * Focus indicator thickness (pixels)
   */
  FOCUS_OUTLINE_WIDTH: 2,
  
  /**
   * Minimum touch target size for mobile (pixels)
   */
  MIN_TOUCH_TARGET: 44,
  
  /**
   * Screen reader announcement delay (milliseconds)
   */
  ANNOUNCEMENT_DELAY: 100,
  
} as const;

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

/**
 * Re-export commonly used types from other modules for convenience
 */
export type { Database, DatabaseService } from '../../../types/database';
export type { User, UserRole } from '../../../types/user';
export type { ApiEndpoint } from '../../../types/api';

/**
 * Re-export utility functions commonly used with search
 */
export { cn, formatDate, debounce } from '../../../lib/utils';

// =============================================================================
// MODULE INFORMATION
// =============================================================================

/**
 * Module metadata for development and debugging
 */
export const SEARCH_MODULE_INFO = {
  name: 'SearchDialogSystem',
  version: '1.0.0',
  compatibility: {
    react: '>=19.0.0',
    nextjs: '>=15.1.0',
    typescript: '>=5.8.0'
  },
  features: [
    'Global command palette search',
    'Keyboard navigation (Cmd/Ctrl+K)',
    'WCAG 2.1 AA accessibility',
    'Debounced search input',
    'Recent searches persistence',
    'Multi-category filtering',
    'React Query caching',
    'Mobile responsive design',
    'Dark mode support',
    'Screen reader optimized'
  ],
  exports: {
    components: ['SearchDialog', 'SearchInput', 'SearchResultItem'],
    hooks: ['useSearch', 'useRecentSearches', 'useSearchKeyboard'],
    utilities: [
      'formatSearchResults',
      'navigateToSearchResult', 
      'handleSearchKeyNavigation',
      'getSearchAriaAttributes'
    ],
    types: [
      'SearchDialogProps',
      'SearchResult',
      'SearchResultType',
      'SearchA11yConfig'
    ]
  }
} as const;