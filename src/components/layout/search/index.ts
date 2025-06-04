/**
 * @fileoverview Barrel export file for search components
 * 
 * Provides centralized imports for DreamFactory Admin Interface search functionality.
 * Enables clean imports like `import { SearchDialog, SearchInput, SearchResults } from '@/components/layout/search'`
 * with full TypeScript support and tree-shaking optimization.
 * 
 * The search system provides global search capabilities across all DreamFactory entities including
 * services, users, roles, applications, event scripts, and system configurations with real-time
 * results and intelligent caching for sub-50ms response times.
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 */

// =============================================================================
// SEARCH COMPONENTS
// =============================================================================

/**
 * Main search modal component that provides global search functionality using Headless UI Dialog
 * with React Query integration. Renders a responsive search interface with debounced input,
 * real-time results, recent searches, and accessible navigation.
 * 
 * Features:
 * - Headless UI Dialog for WCAG 2.1 AA compliance
 * - React Query for intelligent caching with sub-50ms response times
 * - Debounced input with 2000ms delay matching Angular implementation
 * - Keyboard navigation with Escape to close and Enter to navigate
 * - Responsive design with mobile-optimized touch targets
 * 
 * @example
 * ```tsx
 * import { SearchDialog } from '@/components/layout/search';
 * 
 * function App() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   
 *   return (
 *     <SearchDialog 
 *       isOpen={isOpen} 
 *       onClose={() => setIsOpen(false)} 
 *     />
 *   );
 * }
 * ```
 */
export { SearchDialog } from './search-dialog';
export type { 
  SearchDialogProps,
  SearchDialogRef
} from './search-dialog';

/**
 * Search input component with React Hook Form integration, debounced input handling,
 * and responsive design. Provides the search field UI with proper accessibility attributes,
 * loading states, and integration with global search functionality.
 * 
 * Features:
 * - React Hook Form integration for controlled input with validation
 * - Debounced input handling with configurable delay (default 2000ms)
 * - Tailwind CSS styling with outline appearance and responsive sizing
 * - Loading state indicators synchronized with React Query operations
 * - ARIA attributes for screen reader support
 * 
 * @example
 * ```tsx
 * import { SearchInput } from '@/components/layout/search';
 * 
 * function SearchForm() {
 *   const { searchQuery, setSearchQuery, isLoading } = useSearch();
 *   
 *   return (
 *     <SearchInput
 *       value={searchQuery}
 *       onChange={setSearchQuery}
 *       loading={isLoading}
 *       placeholder="Search services, users, roles..."
 *     />
 *   );
 * }
 * ```
 */
export { SearchInput } from './search-input';
export type { 
  SearchInputProps,
  SearchInputRef
} from './search-input';

/**
 * Search results display component that renders grouped search results with navigation
 * capabilities. Handles both live search results and recent searches with proper grouping,
 * accessible navigation, and responsive design.
 * 
 * Features:
 * - Grouped results display with hierarchical structure
 * - Next.js Link components for optimized navigation with prefetching
 * - Keyboard navigation with arrow keys and Enter key support
 * - Responsive design with mobile-optimized touch targets
 * - Loading and empty states for improved user experience
 * - ARIA attributes for screen reader compatibility
 * 
 * @example
 * ```tsx
 * import { SearchResults } from '@/components/layout/search';
 * 
 * function SearchInterface() {
 *   const { results, isLoading, error } = useSearchResults(query);
 *   
 *   return (
 *     <SearchResults
 *       results={results}
 *       loading={isLoading}
 *       error={error}
 *       onNavigate={(path) => router.push(path)}
 *     />
 *   );
 * }
 * ```
 */
export { SearchResults } from './search-results';
export type { 
  SearchResultsProps,
  SearchResultGroup,
  SearchResultItem
} from './search-results';

// =============================================================================
// SEARCH UTILITIES AND HELPERS
// =============================================================================

/**
 * Utility functions for search functionality including translation key generation,
 * result formatting, and search result processing. Provides helper functions for
 * converting search paths to translation keys and formatting search results for display.
 * 
 * Functions:
 * - `getTranslationKey`: Converts navigation paths to translation keys
 * - `formatSearchResults`: Groups and formats search results for display
 * - `getServiceRoute`: Maps service types to their corresponding routes
 * - `createSearchFilter`: Generates filter queries for different entity types
 * - `processSearchResponse`: Transforms API responses into display format
 * 
 * @example
 * ```tsx
 * import { getTranslationKey, formatSearchResults } from '@/components/layout/search';
 * 
 * function ResultsProcessor() {
 *   const translationKey = getTranslationKey('api-connections/database');
 *   // Returns: 'nav.api-connections.database.nav'
 *   
 *   const formatted = formatSearchResults(rawResults);
 *   // Returns structured SearchResultGroup[]
 * }
 * ```
 */
export {
  getTranslationKey,
  formatSearchResults,
  getServiceRoute,
  createSearchFilter,
  processSearchResponse,
  debounceSearchQuery,
  validateSearchQuery,
  normalizeSearchTerm
} from './search-utils';

// =============================================================================
// SEARCH TYPES AND INTERFACES
// =============================================================================

/**
 * Core search result type representing a group of search results for a specific path/category.
 * Each group contains a navigation path and an array of matching items.
 */
export type SearchResult = {
  /** Navigation path for the result group (e.g., 'api-connections/database') */
  path: string;
  /** Array of individual items within this result group */
  items: SearchResultItem[];
  /** Optional group metadata */
  metadata?: SearchResultMetadata;
};

/**
 * Individual search result item within a result group.
 */
export type SearchResultItem = {
  /** Display label for the search result */
  label: string;
  /** URL segment or identifier for navigation */
  segment: string | number;
  /** Optional description for additional context */
  description?: string;
  /** Optional icon identifier */
  icon?: string;
  /** Whether this item represents a creation action */
  isCreation?: boolean;
  /** Optional metadata for the item */
  metadata?: SearchItemMetadata;
};

/**
 * Metadata for search result groups.
 */
export type SearchResultMetadata = {
  /** Total count of items in this group */
  totalCount?: number;
  /** Whether more items are available */
  hasMore?: boolean;
  /** Group category for styling/behavior */
  category?: SearchCategory;
  /** Priority for display ordering */
  priority?: number;
};

/**
 * Metadata for individual search result items.
 */
export type SearchItemMetadata = {
  /** Last modified timestamp */
  lastModified?: string;
  /** Item status */
  status?: 'active' | 'inactive' | 'pending' | 'error';
  /** Additional tags */
  tags?: string[];
  /** Relevance score for sorting */
  relevance?: number;
};

/**
 * Search query configuration and options.
 */
export type SearchQuery = {
  /** The search term */
  term: string;
  /** Filter by specific categories */
  categories?: SearchCategory[];
  /** Maximum number of results per category */
  limit?: number;
  /** Whether to include recent searches */
  includeRecents?: boolean;
  /** Minimum query length to trigger search */
  minLength?: number;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
};

/**
 * Search configuration options.
 */
export type SearchConfig = {
  /** Enable/disable specific search categories */
  enabledCategories: SearchCategory[];
  /** Default search options */
  defaultQuery: Partial<SearchQuery>;
  /** Cache configuration */
  cache: SearchCacheConfig;
  /** UI configuration */
  ui: SearchUIConfig;
};

/**
 * Cache configuration for search operations.
 */
export type SearchCacheConfig = {
  /** Cache TTL in milliseconds */
  ttl: number;
  /** Maximum cache size */
  maxSize: number;
  /** Whether to enable background refresh */
  backgroundRefresh: boolean;
};

/**
 * UI configuration for search components.
 */
export type SearchUIConfig = {
  /** Show/hide recent searches */
  showRecents: boolean;
  /** Maximum number of recent searches to store */
  maxRecents: number;
  /** Show/hide search suggestions */
  showSuggestions: boolean;
  /** Highlight matching text */
  highlightMatches: boolean;
};

/**
 * Search categories for filtering and organization.
 */
export type SearchCategory = 
  | 'services'
  | 'users' 
  | 'admins'
  | 'roles'
  | 'applications'
  | 'scripts'
  | 'limits'
  | 'templates'
  | 'config'
  | 'logs'
  | 'docs';

/**
 * Search state management interface.
 */
export type SearchState = {
  /** Current query */
  query: string;
  /** Search results */
  results: SearchResult[];
  /** Recent searches */
  recents: SearchResult[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Whether search dialog is open */
  isOpen: boolean;
};

/**
 * Search actions for state management.
 */
export type SearchActions = {
  /** Set search query */
  setQuery: (query: string) => void;
  /** Set search results */
  setResults: (results: SearchResult[]) => void;
  /** Add to recent searches */
  addRecent: (result: SearchResult) => void;
  /** Clear recent searches */
  clearRecents: () => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error state */
  setError: (error: string | null) => void;
  /** Toggle search dialog */
  toggleDialog: () => void;
  /** Close search dialog */
  closeDialog: () => void;
};

/**
 * Search hook return type.
 */
export type UseSearchReturn = SearchState & SearchActions & {
  /** Perform search operation */
  search: (term: string) => Promise<void>;
  /** Navigate to search result */
  navigate: (path: string, segment: string | number) => void;
  /** Check if query is valid */
  isValidQuery: (query: string) => boolean;
  /** Get filtered results */
  getFilteredResults: (category?: SearchCategory) => SearchResult[];
};

/**
 * Search API response types.
 */
export type SearchApiResponse<T = any> = {
  /** Response data */
  resource: T[];
  /** Response metadata */
  meta?: {
    count?: number;
    offset?: number;
    limit?: number;
  };
};

/**
 * Error types for search operations.
 */
export type SearchError = {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Additional error details */
  details?: Record<string, any>;
  /** Whether the error is retryable */
  retryable?: boolean;
};

// =============================================================================
// SEARCH CONSTANTS
// =============================================================================

/**
 * Default search configuration values.
 */
export const SEARCH_DEFAULTS = {
  /** Default debounce delay in milliseconds */
  DEBOUNCE_MS: 2000,
  /** Minimum query length */
  MIN_QUERY_LENGTH: 2,
  /** Maximum results per category */
  MAX_RESULTS_PER_CATEGORY: 10,
  /** Maximum recent searches to store */
  MAX_RECENT_SEARCHES: 5,
  /** Cache TTL in milliseconds */
  CACHE_TTL: 300000, // 5 minutes
} as const;

/**
 * Search category configurations.
 */
export const SEARCH_CATEGORIES: Record<SearchCategory, { label: string; icon: string; priority: number }> = {
  services: { label: 'Services', icon: 'database', priority: 1 },
  users: { label: 'Users', icon: 'users', priority: 2 },
  admins: { label: 'Administrators', icon: 'shield', priority: 3 },
  roles: { label: 'Roles', icon: 'key', priority: 4 },
  applications: { label: 'Applications', icon: 'app', priority: 5 },
  scripts: { label: 'Event Scripts', icon: 'code', priority: 6 },
  limits: { label: 'Rate Limits', icon: 'gauge', priority: 7 },
  templates: { label: 'Email Templates', icon: 'mail', priority: 8 },
  config: { label: 'Configuration', icon: 'settings', priority: 9 },
  logs: { label: 'Logs', icon: 'file-text', priority: 10 },
  docs: { label: 'Documentation', icon: 'book', priority: 11 },
} as const;

/**
 * Keyboard shortcuts for search functionality.
 */
export const SEARCH_SHORTCUTS = {
  /** Open search dialog */
  OPEN: 'cmd+k',
  /** Close search dialog */
  CLOSE: 'Escape',
  /** Navigate to first result */
  SELECT_FIRST: 'Enter',
  /** Navigate down in results */
  NEXT: 'ArrowDown',
  /** Navigate up in results */
  PREVIOUS: 'ArrowUp',
  /** Clear search query */
  CLEAR: 'cmd+backspace',
} as const;

// =============================================================================
// TYPE GUARDS AND VALIDATORS
// =============================================================================

/**
 * Type guard to check if a value is a valid search category.
 */
export const isValidSearchCategory = (category: unknown): category is SearchCategory => {
  return typeof category === 'string' && category in SEARCH_CATEGORIES;
};

/**
 * Type guard to check if a value is a valid search result.
 */
export const isValidSearchResult = (result: unknown): result is SearchResult => {
  return (
    typeof result === 'object' &&
    result !== null &&
    'path' in result &&
    'items' in result &&
    typeof (result as SearchResult).path === 'string' &&
    Array.isArray((result as SearchResult).items)
  );
};

/**
 * Validates search query parameters.
 */
export const validateSearchQuery = (query: SearchQuery): boolean => {
  if (!query.term || typeof query.term !== 'string') return false;
  if (query.term.length < (query.minLength ?? SEARCH_DEFAULTS.MIN_QUERY_LENGTH)) return false;
  if (query.categories && !query.categories.every(isValidSearchCategory)) return false;
  return true;
};

/**
 * Validates search result structure.
 */
export const validateSearchResults = (results: unknown): results is SearchResult[] => {
  return Array.isArray(results) && results.every(isValidSearchResult);
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates a search filter query for API requests.
 */
export const createSearchFilterQuery = (term: string, category: SearchCategory): string => {
  // Implementation would depend on the specific API filter format
  const normalizedTerm = term.toLowerCase().trim();
  
  switch (category) {
    case 'services':
      return `name like "${normalizedTerm}%" or label like "${normalizedTerm}%"`;
    case 'users':
    case 'admins':
      return `name like "${normalizedTerm}%" or email like "${normalizedTerm}%"`;
    case 'roles':
      return `name like "${normalizedTerm}%" or description like "${normalizedTerm}%"`;
    default:
      return `name like "${normalizedTerm}%"`;
  }
};

/**
 * Sorts search results by relevance and priority.
 */
export const sortSearchResults = (results: SearchResult[]): SearchResult[] => {
  return results.sort((a, b) => {
    const aPriority = a.metadata?.priority ?? 999;
    const bPriority = b.metadata?.priority ?? 999;
    return aPriority - bPriority;
  });
};

/**
 * Highlights matching text in search results.
 */
export const highlightSearchTerm = (text: string, term: string): string => {
  if (!term.trim()) return text;
  
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

// Re-export common React types for search components
export type { 
  ReactNode, 
  ReactElement, 
  ComponentType, 
  FC, 
  PropsWithChildren,
  RefObject,
  ForwardedRef
} from 'react';

// Re-export common form types for search input
export type { 
  FieldPath, 
  FieldValues, 
  Control, 
  UseFormRegister,
  UseFormWatch
} from 'react-hook-form';

// Re-export router types for navigation
export type { 
  AppRouterInstance,
  NavigateOptions 
} from 'next/dist/shared/lib/app-router-context.shared-runtime';