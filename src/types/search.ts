/**
 * Search types for the DreamFactory Admin Interface
 * Defines interfaces for search functionality, results, and state management
 */

import type { NavigationItem } from './navigation';

/**
 * Individual search result item
 */
export interface SearchResultItem {
  /** Display label for the search result */
  label: string;
  
  /** URL segment for navigation (id, name, or slug) */
  segment: string | number;
  
  /** Optional description or subtitle */
  description?: string;
  
  /** Optional icon or icon class */
  icon?: string;
  
  /** Optional badge text (e.g., "New", "Active") */
  badge?: string;
  
  /** Additional metadata for the item */
  metadata?: Record<string, any>;
}

/**
 * Grouped search results by path/category
 */
export interface SearchResultGroup {
  /** Navigation path for this group */
  path: string;
  
  /** Items within this group */
  items: SearchResultItem[];
  
  /** Display title for the group */
  title?: string;
  
  /** Optional description for the group */
  description?: string;
  
  /** Group icon */
  icon?: string;
  
  /** Total count of items (may be higher than items.length if paginated) */
  totalCount?: number;
  
  /** Whether this group has more results available */
  hasMore?: boolean;
}

/**
 * Complete search results structure
 */
export interface SearchResults {
  /** Search query that generated these results */
  query: string;
  
  /** Grouped results by category/path */
  groups: SearchResultGroup[];
  
  /** Total number of result groups */
  totalGroups: number;
  
  /** Total number of individual items across all groups */
  totalItems: number;
  
  /** Search execution time in milliseconds */
  executionTime?: number;
  
  /** Whether this search has more results available */
  hasMoreResults?: boolean;
  
  /** Suggested search queries */
  suggestions?: string[];
}

/**
 * Search history item for recent searches
 */
export interface SearchHistoryItem {
  /** Search query */
  query: string;
  
  /** Timestamp when search was performed */
  timestamp: number;
  
  /** Number of results returned */
  resultCount: number;
  
  /** Most relevant result path that was selected */
  selectedPath?: string;
  
  /** User-friendly label for the search */
  label?: string;
}

/**
 * Search state for managing search component state
 */
export interface SearchState {
  /** Current search query */
  query: string;
  
  /** Whether search is currently loading */
  isLoading: boolean;
  
  /** Current search results */
  results: SearchResults | null;
  
  /** Recent search history */
  recentSearches: SearchHistoryItem[];
  
  /** Selected result index for keyboard navigation */
  selectedIndex: number;
  
  /** Whether search dialog/overlay is open */
  isOpen: boolean;
  
  /** Search error state */
  error: string | null;
  
  /** Search suggestions based on input */
  suggestions: string[];
  
  /** Debounced query value */
  debouncedQuery: string;
}

/**
 * Search configuration options
 */
export interface SearchConfig {
  /** Debounce delay in milliseconds */
  debounceDelay: number;
  
  /** Maximum number of results per group */
  maxResultsPerGroup: number;
  
  /** Maximum number of recent searches to store */
  maxRecentSearches: number;
  
  /** Minimum query length to trigger search */
  minQueryLength: number;
  
  /** Search result categories to include */
  enabledCategories: string[];
  
  /** Whether to enable search analytics */
  enableAnalytics: boolean;
  
  /** Local storage key for recent searches */
  storageKey: string;
}

/**
 * Search entity types that can be searched
 */
export type SearchEntityType = 
  | 'admin'
  | 'user' 
  | 'service'
  | 'role'
  | 'app'
  | 'script'
  | 'limit'
  | 'template'
  | 'file'
  | 'log'
  | 'schema'
  | 'table'
  | 'field';

/**
 * Search filters for refining results
 */
export interface SearchFilters {
  /** Entity types to include in search */
  entityTypes?: SearchEntityType[];
  
  /** Date range filter */
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  /** Status filter (active, inactive, etc.) */
  status?: string[];
  
  /** Additional custom filters */
  custom?: Record<string, any>;
}

/**
 * Search options for customizing search behavior
 */
export interface SearchOptions {
  /** Search filters */
  filters?: SearchFilters;
  
  /** Maximum number of results to return */
  limit?: number;
  
  /** Result offset for pagination */
  offset?: number;
  
  /** Sort order for results */
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  
  /** Whether to include suggestions */
  includeSuggestions?: boolean;
  
  /** Whether to include metadata */
  includeMetadata?: boolean;
}

/**
 * Search analytics event
 */
export interface SearchAnalyticsEvent {
  /** Event type */
  type: 'search' | 'select' | 'clear' | 'recent_select';
  
  /** Search query */
  query?: string;
  
  /** Selected result path */
  resultPath?: string;
  
  /** Result position in list */
  resultPosition?: number;
  
  /** Event timestamp */
  timestamp: number;
  
  /** User session ID */
  sessionId?: string;
  
  /** Additional event data */
  metadata?: Record<string, any>;
}

/**
 * Keyboard navigation directions
 */
export type NavigationDirection = 'up' | 'down' | 'first' | 'last';

/**
 * Search keyboard event handler
 */
export interface SearchKeyboardHandler {
  /** Handle arrow key navigation */
  handleNavigation: (direction: NavigationDirection) => void;
  
  /** Handle Enter key selection */
  handleSelection: () => void;
  
  /** Handle Escape key dismissal */
  handleEscape: () => void;
  
  /** Handle Tab key focus management */
  handleTab: (shiftKey: boolean) => void;
}

/**
 * Search accessibility configuration
 */
export interface SearchAccessibilityConfig {
  /** ARIA labels for different search states */
  ariaLabels: {
    searchInput: string;
    searchResults: string;
    searchGroup: string;
    searchItem: string;
    noResults: string;
    loading: string;
  };
  
  /** Screen reader announcements */
  announcements: {
    resultsFound: (count: number) => string;
    resultSelected: (label: string) => string;
    searchCleared: string;
  };
  
  /** Focus management options */
  focusManagement: {
    trapFocus: boolean;
    restoreFocus: boolean;
    initialFocus: string;
  };
}

/**
 * Search result formatting options
 */
export interface SearchResultFormatOptions {
  /** Highlight matching text */
  highlightMatches: boolean;
  
  /** Maximum label length before truncation */
  maxLabelLength: number;
  
  /** Whether to show result count badges */
  showResultCounts: boolean;
  
  /** Whether to show timestamps for recent searches */
  showTimestamps: boolean;
  
  /** Date format for timestamps */
  dateFormat: string;
}

/**
 * Search hook return type
 */
export interface UseSearchReturn {
  /** Current search state */
  state: SearchState;
  
  /** Search function */
  search: (query: string, options?: SearchOptions) => Promise<SearchResults>;
  
  /** Clear search results */
  clearResults: () => void;
  
  /** Clear search history */
  clearHistory: () => void;
  
  /** Add search to history */
  addToHistory: (query: string, results: SearchResults) => void;
  
  /** Get recent searches */
  getRecentSearches: () => SearchHistoryItem[];
  
  /** Navigate to search result */
  navigateToResult: (group: SearchResultGroup, item: SearchResultItem) => void;
  
  /** Keyboard navigation handlers */
  keyboardHandlers: SearchKeyboardHandler;
  
  /** Search configuration */
  config: SearchConfig;
}

export default SearchResults;