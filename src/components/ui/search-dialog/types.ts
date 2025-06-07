/**
 * Search Dialog Component Type Definitions
 * 
 * Comprehensive TypeScript interface definitions for the search dialog component system,
 * migrated from Angular dialog types to React patterns. Defines props interfaces for search 
 * functionality, result types, accessibility configurations, and keyboard navigation.
 * Ensures type safety across the entire search workflow including debounced queries,
 * recent searches, and navigation actions.
 * 
 * Features:
 * - TypeScript 5.8+ interface definitions with complete type safety
 * - React-specific type definitions for props, refs, and callback functions
 * - Search result typing supporting multiple data categories and navigation contexts
 * - Keyboard navigation type definitions for accessible command palette interactions
 * - WCAG 2.1 AA accessibility configuration interfaces per Section 7.7.1
 * - Mobile-first responsive design types with touch interaction support
 * 
 * @version 1.0.0
 * @since 2024
 */

import { ReactNode, RefObject, ComponentType, KeyboardEvent, MouseEvent } from 'react';
import type { BaseComponent, ComponentVariant, ComponentSize, ResponsiveValue } from '@/types/ui';
import type { DatabaseType, DatabaseService, DatabaseTable, DatabaseField } from '@/types/database';

// ============================================================================
// SEARCH RESULT TYPES
// ============================================================================

/**
 * Search result type enumeration supporting multiple result categories
 * Replaces Angular Material dialog configuration with React patterns
 */
export enum SearchResultType {
  /** Database service connections */
  DATABASE_SERVICE = 'database_service',
  /** Database schemas */
  DATABASE_SCHEMA = 'database_schema', 
  /** Database tables */
  DATABASE_TABLE = 'database_table',
  /** Database fields/columns */
  DATABASE_FIELD = 'database_field',
  /** User accounts */
  USER = 'user',
  /** Admin accounts */
  ADMIN = 'admin',
  /** System settings pages */
  SYSTEM_SETTING = 'system_setting',
  /** API endpoints */
  API_ENDPOINT = 'api_endpoint',
  /** Documentation pages */
  DOCUMENTATION = 'documentation',
  /** Application modules */
  APP_MODULE = 'app_module',
  /** Event scripts */
  EVENT_SCRIPT = 'event_script',
  /** File resources */
  FILE_RESOURCE = 'file_resource',
  /** Recent searches */
  RECENT_SEARCH = 'recent_search',
  /** Navigation shortcuts */
  NAVIGATION = 'navigation',
}

/**
 * Individual search result interface with comprehensive metadata
 * Enhanced from Angular Material result structure
 */
export interface SearchResult {
  /** Unique identifier for the search result */
  id: string;
  /** Result type for categorization and filtering */
  type: SearchResultType;
  /** Display title/name of the result */
  title: string;
  /** Optional subtitle or secondary information */
  subtitle?: string;
  /** Detailed description of the result */
  description?: string;
  /** Navigation URL or identifier */
  href?: string;
  /** Icon component for visual identification */
  icon?: ComponentType<{ className?: string }>;
  /** Badge text for additional context */
  badge?: string;
  /** Badge variant for styling */
  badgeVariant?: ComponentVariant;
  /** Whether the result is currently active/selected */
  isActive?: boolean;
  /** Whether the result is disabled/unavailable */
  isDisabled?: boolean;
  /** Whether the result is a favorite */
  isFavorite?: boolean;
  /** Result relevance score (0-1) for ranking */
  relevanceScore?: number;
  /** Timestamp of last access/modification */
  lastAccessed?: string;
  /** Number of times this result has been accessed */
  accessCount?: number;
  /** Additional metadata based on result type */
  metadata?: SearchResultMetadata;
  /** Parent/context information */
  parent?: {
    type: SearchResultType;
    title: string;
    href?: string;
  };
  /** Keywords for enhanced search matching */
  keywords?: string[];
  /** Breadcrumb navigation path */
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  
  // Accessibility enhancements
  /** ARIA label for screen readers */
  ariaLabel?: string;
  /** ARIA description for additional context */
  ariaDescription?: string;
  /** Screen reader announcement text */
  announcement?: string;
}

/**
 * Search result metadata union type for different result categories
 */
export type SearchResultMetadata = 
  | DatabaseServiceMetadata
  | DatabaseTableMetadata  
  | DatabaseFieldMetadata
  | UserMetadata
  | SystemSettingMetadata
  | ApiEndpointMetadata
  | DocumentationMetadata
  | NavigationMetadata;

/**
 * Database service specific metadata
 */
export interface DatabaseServiceMetadata {
  type: 'database_service';
  /** Database type (MySQL, PostgreSQL, etc.) */
  databaseType: DatabaseType;
  /** Connection status */
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  /** Number of schemas in the database */
  schemaCount?: number;
  /** Number of tables across all schemas */
  tableCount?: number;
  /** Service configuration summary */
  config?: {
    host: string;
    port: number;
    database: string;
  };
}

/**
 * Database table specific metadata
 */
export interface DatabaseTableMetadata {
  type: 'database_table';
  /** Parent service name */
  serviceName: string;
  /** Schema name containing the table */
  schemaName?: string;
  /** Table type (table, view, materialized_view) */
  tableType: 'table' | 'view' | 'materialized_view';
  /** Number of fields in the table */
  fieldCount: number;
  /** Approximate row count */
  rowCount?: number;
  /** Whether table has primary key */
  hasPrimaryKey: boolean;
  /** Whether table has foreign keys */
  hasForeignKeys: boolean;
}

/**
 * Database field specific metadata
 */
export interface DatabaseFieldMetadata {
  type: 'database_field';
  /** Parent service name */
  serviceName: string;
  /** Parent table name */
  tableName: string;
  /** Schema name */
  schemaName?: string;
  /** Field data type */
  dataType: string;
  /** Whether field is primary key */
  isPrimaryKey: boolean;
  /** Whether field is foreign key */
  isForeignKey: boolean;
  /** Whether field is required */
  isRequired: boolean;
  /** Whether field is unique */
  isUnique: boolean;
}

/**
 * User account specific metadata
 */
export interface UserMetadata {
  type: 'user';
  /** User email address */
  email: string;
  /** User status */
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  /** User role names */
  roles: string[];
  /** Last login timestamp */
  lastLogin?: string;
  /** Whether user is admin */
  isAdmin: boolean;
}

/**
 * System setting specific metadata
 */
export interface SystemSettingMetadata {
  type: 'system_setting';
  /** Setting category */
  category: 'general' | 'security' | 'database' | 'api' | 'email' | 'cache' | 'cors';
  /** Setting key/identifier */
  key: string;
  /** Whether setting requires restart */
  requiresRestart: boolean;
  /** Whether setting is read-only */
  isReadOnly: boolean;
}

/**
 * API endpoint specific metadata
 */
export interface ApiEndpointMetadata {
  type: 'api_endpoint';
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** API path */
  path: string;
  /** Parent service name */
  serviceName?: string;
  /** Whether endpoint requires authentication */
  requiresAuth: boolean;
  /** Endpoint status */
  status: 'active' | 'deprecated' | 'beta';
}

/**
 * Documentation specific metadata
 */
export interface DocumentationMetadata {
  type: 'documentation';
  /** Documentation category */
  category: 'getting-started' | 'api-reference' | 'guides' | 'examples' | 'troubleshooting';
  /** Content type */
  contentType: 'markdown' | 'html' | 'video' | 'tutorial';
  /** Reading time estimate in minutes */
  readingTime?: number;
  /** Whether documentation is external */
  isExternal: boolean;
}

/**
 * Navigation specific metadata
 */
export interface NavigationMetadata {
  type: 'navigation';
  /** Navigation section */
  section: 'main' | 'settings' | 'admin' | 'tools' | 'help';
  /** Whether navigation item has children */
  hasChildren: boolean;
  /** Parent navigation item */
  parentPath?: string;
  /** Keyboard shortcut */
  shortcut?: string;
}

/**
 * Search result group interface for categorized results
 * Supports hierarchical organization and lazy loading
 */
export interface SearchResultGroup {
  /** Group identifier */
  id: string;
  /** Group display label */
  label: string;
  /** Group description */
  description?: string;
  /** Icon for the group */
  icon?: ComponentType<{ className?: string }>;
  /** Results in this group */
  results: SearchResult[];
  /** Total number of results (for pagination) */
  totalCount: number;
  /** Whether more results are available */
  hasMore: boolean;
  /** Whether group is currently loading */
  isLoading: boolean;
  /** Whether group is expanded in UI */
  isExpanded: boolean;
  /** Group order/priority for display */
  order: number;
  /** Whether group supports infinite scrolling */
  supportsInfiniteScroll: boolean;
  /** Load more results callback */
  onLoadMore?: () => Promise<void>;
  
  // Accessibility
  /** ARIA label for the group */
  ariaLabel?: string;
  /** ARIA description for screen readers */
  ariaDescription?: string;
}

// ============================================================================
// SEARCH DIALOG COMPONENT INTERFACES
// ============================================================================

/**
 * Search dialog props interface replacing Angular Material dialog configuration
 * Enhanced with React patterns and accessibility features
 */
export interface SearchDialogProps extends BaseComponent {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Initial search term */
  initialSearchTerm?: string;
  /** Placeholder text for search input */
  placeholder?: string;
  /** Whether to show recent searches */
  showRecentSearches?: boolean;
  /** Whether to show search shortcuts */
  showShortcuts?: boolean;
  /** Whether to enable global search (all categories) */
  enableGlobalSearch?: boolean;
  /** Restricted search categories */
  searchCategories?: SearchResultType[];
  /** Maximum number of results per category */
  maxResultsPerCategory?: number;
  /** Debounce delay for search queries in milliseconds */
  debounceDelay?: number;
  /** Minimum characters required to trigger search */
  minSearchLength?: number;
  /** Whether to auto-focus search input on open */
  autoFocus?: boolean;
  /** Whether to clear search on close */
  clearOnClose?: boolean;
  /** Whether to close on selection */
  closeOnSelect?: boolean;
  /** Whether to close on outside click */
  closeOnOverlayClick?: boolean;
  /** Whether to close on escape key */
  closeOnEscape?: boolean;
  
  // Callbacks
  /** Search function with debouncing */
  onSearch: (term: string, categories?: SearchResultType[]) => Promise<SearchResultGroup[]>;
  /** Callback when a result is selected */
  onSelect: (result: SearchResult) => void;
  /** Callback when a result is focused */
  onResultFocus?: (result: SearchResult | null) => void;
  /** Callback when search input changes */
  onSearchChange?: (term: string) => void;
  /** Callback for adding to favorites */
  onToggleFavorite?: (result: SearchResult) => void;
  /** Callback for clearing recent searches */
  onClearRecentSearches?: () => void;
  
  // Customization
  /** Custom search input renderer */
  renderSearchInput?: (props: SearchInputProps) => ReactNode;
  /** Custom result item renderer */
  renderResult?: (result: SearchResult, isSelected: boolean) => ReactNode;
  /** Custom group header renderer */
  renderGroupHeader?: (group: SearchResultGroup) => ReactNode;
  /** Custom empty state renderer */
  renderEmptyState?: (searchTerm: string) => ReactNode;
  /** Custom loading state renderer */
  renderLoadingState?: () => ReactNode;
  /** Custom error state renderer */
  renderErrorState?: (error: string) => ReactNode;
  
  // Configuration
  /** Recent searches configuration */
  recentSearches?: RecentSearchesConfig;
  /** Keyboard navigation configuration */
  keyboardNavigation?: KeyboardNavigationConfig;
  /** Accessibility configuration */
  accessibility?: SearchA11yConfig;
  /** Responsive configuration */
  responsive?: SearchResponsiveConfig;
  /** Virtual scrolling configuration for large result sets */
  virtualScrolling?: VirtualScrollingConfig;
  
  // Analytics and tracking
  /** Analytics tracking function */
  onAnalyticsEvent?: (event: SearchAnalyticsEvent) => void;
  /** Performance metrics callback */
  onPerformanceMetric?: (metric: SearchPerformanceMetric) => void;
}

/**
 * Search input props interface for custom renderers
 */
export interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Input change handler */
  onChange: (value: string) => void;
  /** Input focus handler */
  onFocus: () => void;
  /** Input blur handler */
  onBlur: () => void;
  /** Keyboard event handler */
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** Input placeholder text */
  placeholder: string;
  /** Whether input should auto-focus */
  autoFocus: boolean;
  /** Input reference for focus management */
  ref: RefObject<HTMLInputElement>;
  /** Whether input is loading */
  loading: boolean;
  /** Input accessibility configuration */
  accessibility: SearchA11yConfig;
}

/**
 * Search dialog state interface for component state management
 * Supports advanced features like search history and selection tracking
 */
export interface SearchDialogState {
  /** Current search term */
  searchTerm: string;
  /** Whether search is currently active */
  isSearching: boolean;
  /** Whether initial load is complete */
  isLoaded: boolean;
  /** Current search results grouped by category */
  resultGroups: SearchResultGroup[];
  /** Currently selected/focused result index */
  selectedIndex: number;
  /** Currently selected group index */
  selectedGroupIndex: number;
  /** Recent search terms */
  recentSearches: string[];
  /** Search error message */
  error?: string;
  /** Loading state for different operations */
  loadingStates: {
    search: boolean;
    loadMore: boolean;
    recentSearches: boolean;
  };
  /** Search performance metrics */
  metrics: {
    searchStartTime?: number;
    searchDuration?: number;
    resultCount: number;
    cacheHit: boolean;
  };
  /** Search filters */
  filters: {
    categories: SearchResultType[];
    favorites: boolean;
    recent: boolean;
  };
  /** UI state */
  ui: {
    showRecentSearches: boolean;
    showShortcuts: boolean;
    expandedGroups: Set<string>;
    scrollPosition: number;
  };
}

// ============================================================================
// KEYBOARD NAVIGATION TYPES
// ============================================================================

/**
 * Keyboard navigation event interface for accessible command palette interactions
 * Enhanced for WCAG 2.1 AA compliance with proper focus management
 */
export interface SearchKeyboardEvent {
  /** Original keyboard event */
  originalEvent: KeyboardEvent<HTMLElement>;
  /** Key that was pressed */
  key: string;
  /** Key code for legacy compatibility */
  keyCode: number;
  /** Whether Ctrl/Cmd was pressed */
  ctrlKey: boolean;
  /** Whether Alt was pressed */
  altKey: boolean;
  /** Whether Shift was pressed */
  shiftKey: boolean;
  /** Whether Meta (Cmd) was pressed */
  metaKey: boolean;
  /** Current focus context */
  context: SearchFocusContext;
  /** Current selection state */
  selection: {
    groupIndex: number;
    resultIndex: number;
    result: SearchResult | null;
  };
  /** Available navigation actions */
  actions: SearchKeyboardActions;
}

/**
 * Search focus context for keyboard navigation
 */
export type SearchFocusContext = 
  | 'search-input'
  | 'result-list'
  | 'group-header'
  | 'action-buttons'
  | 'recent-searches'
  | 'shortcuts';

/**
 * Keyboard navigation actions interface
 */
export interface SearchKeyboardActions {
  /** Move selection up */
  moveUp: () => void;
  /** Move selection down */
  moveDown: () => void;
  /** Move to previous group */
  moveToPreviousGroup: () => void;
  /** Move to next group */
  moveToNextGroup: () => void;
  /** Select current result */
  selectCurrent: () => void;
  /** Focus search input */
  focusSearch: () => void;
  /** Close dialog */
  closeDialog: () => void;
  /** Toggle group expansion */
  toggleGroup: () => void;
  /** Add to favorites */
  toggleFavorite: () => void;
  /** Clear search */
  clearSearch: () => void;
  /** Show shortcuts help */
  showShortcuts: () => void;
}

/**
 * Keyboard navigation configuration
 */
export interface KeyboardNavigationConfig {
  /** Whether keyboard navigation is enabled */
  enabled: boolean;
  /** Whether to wrap selection at boundaries */
  wrapSelection: boolean;
  /** Whether to auto-select first result */
  autoSelectFirst: boolean;
  /** Keyboard shortcuts map */
  shortcuts: {
    /** Close dialog shortcut */
    close: string[];
    /** Select result shortcut */
    select: string[];
    /** Move up shortcut */
    moveUp: string[];
    /** Move down shortcut */
    moveDown: string[];
    /** Toggle favorites shortcut */
    toggleFavorite: string[];
    /** Clear search shortcut */
    clearSearch: string[];
    /** Focus search shortcut */
    focusSearch: string[];
  };
  /** Whether to announce selection changes */
  announceChanges: boolean;
  /** Custom key handler */
  customKeyHandler?: (event: SearchKeyboardEvent) => boolean;
}

// ============================================================================
// RECENT SEARCHES INTERFACE
// ============================================================================

/**
 * Recent searches interface for local storage persistence
 * Includes automatic cleanup configuration and privacy controls
 */
export interface RecentSearches {
  /** Array of recent search terms */
  searches: RecentSearchItem[];
  /** Maximum number of searches to retain */
  maxItems: number;
  /** Whether recent searches are enabled */
  enabled: boolean;
  /** Auto-cleanup configuration */
  cleanup: {
    /** Maximum age in days before auto-removal */
    maxAge: number;
    /** Whether to clean up on app start */
    cleanupOnStart: boolean;
    /** Whether to clean up duplicate entries */
    removeDuplicates: boolean;
  };
  /** Privacy configuration */
  privacy: {
    /** Whether to exclude sensitive terms */
    excludeSensitive: boolean;
    /** Patterns to exclude from recent searches */
    excludePatterns: string[];
    /** Whether to encrypt stored searches */
    encrypt: boolean;
  };
}

/**
 * Individual recent search item
 */
export interface RecentSearchItem {
  /** Search term */
  term: string;
  /** Timestamp of the search */
  timestamp: string;
  /** Number of times this term was searched */
  count: number;
  /** Category context if available */
  category?: SearchResultType;
  /** Selected result from this search */
  selectedResult?: {
    id: string;
    title: string;
    type: SearchResultType;
  };
  /** Whether search was successful (had results) */
  hasResults: boolean;
}

/**
 * Recent searches configuration
 */
export interface RecentSearchesConfig {
  /** Whether to enable recent searches */
  enabled: boolean;
  /** Maximum number of recent searches to store */
  maxItems: number;
  /** Storage key for localStorage */
  storageKey: string;
  /** Auto-cleanup settings */
  autoCleanup: {
    /** Enable automatic cleanup */
    enabled: boolean;
    /** Maximum age in days */
    maxAge: number;
    /** Remove duplicates */
    removeDuplicates: boolean;
  };
  /** Privacy settings */
  privacy: {
    /** Exclude sensitive search terms */
    excludeSensitive: boolean;
    /** Patterns to exclude */
    excludePatterns: string[];
  };
}

// ============================================================================
// ACCESSIBILITY CONFIGURATION TYPES
// ============================================================================

/**
 * Search accessibility configuration for WCAG 2.1 AA compliance
 * Comprehensive a11y settings for inclusive design
 */
export interface SearchA11yConfig {
  /** Screen reader announcements */
  announcements: {
    /** Announce search results count */
    announceResultCount: boolean;
    /** Announce selection changes */
    announceSelectionChange: boolean;
    /** Announce loading states */
    announceLoading: boolean;
    /** Announce errors */
    announceErrors: boolean;
    /** Custom announcement messages */
    messages: {
      /** Message when results are found */
      resultsFound: (count: number) => string;
      /** Message when no results are found */
      noResults: (term: string) => string;
      /** Message when loading */
      loading: string;
      /** Message when selection changes */
      selectionChanged: (result: SearchResult) => string;
      /** Message for keyboard shortcuts */
      keyboardHelp: string;
    };
  };
  
  /** Focus management */
  focusManagement: {
    /** Auto-focus search input when dialog opens */
    autoFocusSearch: boolean;
    /** Return focus to trigger element on close */
    returnFocus: boolean;
    /** Focus trap within dialog */
    trapFocus: boolean;
    /** Focus visible indicators */
    focusVisible: boolean;
    /** Skip to content links */
    skipLinks: boolean;
  };
  
  /** ARIA attributes and roles */
  aria: {
    /** Main dialog role */
    dialogRole: 'dialog' | 'search';
    /** Results list role */
    resultsRole: 'listbox' | 'menu' | 'tree';
    /** Result item role */
    resultRole: 'option' | 'menuitem' | 'treeitem';
    /** Live region for announcements */
    liveRegion: 'polite' | 'assertive' | 'off';
    /** Custom ARIA labels */
    labels: {
      /** Search input label */
      searchInput: string;
      /** Results list label */
      resultsList: string;
      /** Close button label */
      closeButton: string;
      /** Clear search label */
      clearSearch: string;
      /** Favorites toggle label */
      toggleFavorite: string;
      /** Group expand/collapse label */
      toggleGroup: (expanded: boolean) => string;
    };
  };
  
  /** High contrast mode support */
  highContrast: {
    /** Enable high contrast detection */
    enabled: boolean;
    /** Force high contrast colors */
    forceColors: boolean;
    /** Enhanced border visibility */
    enhancedBorders: boolean;
  };
  
  /** Motion and animation preferences */
  motion: {
    /** Respect prefers-reduced-motion */
    respectReducedMotion: boolean;
    /** Disable animations in reduced motion */
    disableAnimations: boolean;
    /** Reduced animation duration */
    reducedDuration: number;
  };
  
  /** Touch and pointer support */
  touch: {
    /** Minimum touch target size */
    minTouchTarget: number;
    /** Touch-friendly spacing */
    touchSpacing: number;
    /** Pointer coarse detection */
    detectCoarsePointer: boolean;
  };
}

// ============================================================================
// RESPONSIVE DESIGN TYPES
// ============================================================================

/**
 * Search dialog responsive configuration for mobile-first approach
 * Supports touch interactions and adaptive layouts
 */
export interface SearchResponsiveConfig {
  /** Breakpoint-specific configurations */
  breakpoints: {
    /** Mobile configuration (< 768px) */
    mobile: SearchBreakpointConfig;
    /** Tablet configuration (768px - 1024px) */
    tablet: SearchBreakpointConfig;
    /** Desktop configuration (>= 1024px) */
    desktop: SearchBreakpointConfig;
  };
  
  /** Touch interaction support */
  touch: {
    /** Enable touch gestures */
    enableGestures: boolean;
    /** Swipe to dismiss */
    swipeToDismiss: boolean;
    /** Touch-friendly scrolling */
    touchScrolling: boolean;
    /** Haptic feedback support */
    hapticFeedback: boolean;
  };
  
  /** Adaptive layout features */
  layout: {
    /** Auto-adjust dialog size */
    autoSize: boolean;
    /** Full-screen on mobile */
    fullScreenMobile: boolean;
    /** Adaptive result display */
    adaptiveResults: boolean;
    /** Dynamic column count */
    dynamicColumns: boolean;
  };
  
  /** Performance optimizations */
  performance: {
    /** Virtual scrolling threshold */
    virtualScrollThreshold: number;
    /** Image lazy loading */
    lazyLoadImages: boolean;
    /** Debounce touch events */
    touchDebounce: number;
  };
}

/**
 * Breakpoint-specific search configuration
 */
export interface SearchBreakpointConfig {
  /** Dialog positioning */
  position: 'center' | 'top' | 'fullscreen';
  /** Maximum dialog width */
  maxWidth: string;
  /** Maximum dialog height */
  maxHeight: string;
  /** Results per group */
  resultsPerGroup: number;
  /** Show group headers */
  showGroupHeaders: boolean;
  /** Show result descriptions */
  showDescriptions: boolean;
  /** Show result icons */
  showIcons: boolean;
  /** Compact result layout */
  compactLayout: boolean;
  /** Search input size */
  inputSize: ComponentSize;
}

// ============================================================================
// VIRTUAL SCROLLING CONFIGURATION
// ============================================================================

/**
 * Virtual scrolling configuration for large result sets
 * Optimized for performance with 1000+ search results
 */
export interface VirtualScrollingConfig {
  /** Enable virtual scrolling */
  enabled: boolean;
  /** Estimated item height in pixels */
  itemHeight: number;
  /** Number of items to render outside viewport */
  overscan: number;
  /** Buffer size for smoother scrolling */
  bufferSize: number;
  /** Enable dynamic height calculation */
  dynamicHeight: boolean;
  /** Scroll threshold for loading more results */
  loadMoreThreshold: number;
  /** Whether to maintain scroll position */
  maintainScrollPosition: boolean;
}

// ============================================================================
// ANALYTICS AND PERFORMANCE TYPES
// ============================================================================

/**
 * Search analytics event for tracking user interactions
 */
export interface SearchAnalyticsEvent {
  /** Event type */
  type: 'search' | 'select' | 'clear' | 'close' | 'favorite' | 'recent_select';
  /** Event timestamp */
  timestamp: string;
  /** Search term (if applicable) */
  searchTerm?: string;
  /** Selected result (if applicable) */
  result?: SearchResult;
  /** Search context */
  context: {
    /** Results count when action occurred */
    resultCount: number;
    /** Search duration in milliseconds */
    searchDuration: number;
    /** Whether result was from cache */
    fromCache: boolean;
    /** User session identifier */
    sessionId: string;
  };
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Search performance metric for monitoring
 */
export interface SearchPerformanceMetric {
  /** Metric type */
  type: 'search_duration' | 'render_time' | 'cache_hit_rate' | 'error_rate';
  /** Metric value */
  value: number;
  /** Metric unit */
  unit: 'ms' | 'percent' | 'count';
  /** Timestamp */
  timestamp: string;
  /** Additional context */
  context: {
    /** Search term length */
    searchTermLength: number;
    /** Result count */
    resultCount: number;
    /** Whether cached */
    cached: boolean;
    /** User device type */
    deviceType: 'mobile' | 'tablet' | 'desktop';
  };
}

// ============================================================================
// UTILITY TYPES AND HELPERS
// ============================================================================

/**
 * Search dialog action type for state management
 */
export type SearchDialogAction = 
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_RESULTS'; payload: SearchResultGroup[] }
  | { type: 'SET_SELECTED_INDEX'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_RECENT_SEARCH'; payload: string }
  | { type: 'CLEAR_RECENT_SEARCHES' }
  | { type: 'TOGGLE_GROUP'; payload: string }
  | { type: 'RESET_STATE' };

/**
 * Search dialog context type for React context provider
 */
export interface SearchDialogContextType {
  /** Current dialog state */
  state: SearchDialogState;
  /** State dispatch function */
  dispatch: (action: SearchDialogAction) => void;
  /** Configuration object */
  config: Pick<SearchDialogProps, 'accessibility' | 'keyboardNavigation' | 'responsive'>;
  /** Utility functions */
  utils: {
    /** Check if result is selected */
    isResultSelected: (result: SearchResult) => boolean;
    /** Get selected result */
    getSelectedResult: () => SearchResult | null;
    /** Format result for display */
    formatResult: (result: SearchResult) => string;
    /** Get result icon */
    getResultIcon: (result: SearchResult) => ComponentType<any> | null;
  };
}

/**
 * Search result renderer props for custom components
 */
export interface SearchResultRendererProps {
  /** Result to render */
  result: SearchResult;
  /** Whether result is currently selected */
  isSelected: boolean;
  /** Whether result is focused */
  isFocused: boolean;
  /** Selection handler */
  onSelect: (result: SearchResult) => void;
  /** Focus handler */
  onFocus: (result: SearchResult) => void;
  /** Favorite toggle handler */
  onToggleFavorite?: (result: SearchResult) => void;
  /** Additional CSS classes */
  className?: string;
  /** Accessibility configuration */
  accessibility: SearchA11yConfig;
}

/**
 * Search group renderer props for custom components
 */
export interface SearchGroupRendererProps {
  /** Group to render */
  group: SearchResultGroup;
  /** Whether group is expanded */
  isExpanded: boolean;
  /** Expansion toggle handler */
  onToggleExpanded: (groupId: string) => void;
  /** Load more handler */
  onLoadMore?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Accessibility configuration */
  accessibility: SearchA11yConfig;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default keyboard navigation configuration
 */
export const DEFAULT_KEYBOARD_CONFIG: KeyboardNavigationConfig = {
  enabled: true,
  wrapSelection: true,
  autoSelectFirst: true,
  shortcuts: {
    close: ['Escape'],
    select: ['Enter'],
    moveUp: ['ArrowUp'],
    moveDown: ['ArrowDown'],
    toggleFavorite: ['f'],
    clearSearch: ['Escape'],
    focusSearch: ['/'],
  },
  announceChanges: true,
};

/**
 * Default accessibility configuration
 */
export const DEFAULT_A11Y_CONFIG: SearchA11yConfig = {
  announcements: {
    announceResultCount: true,
    announceSelectionChange: true,
    announceLoading: true,
    announceErrors: true,
    messages: {
      resultsFound: (count: number) => `${count} results found`,
      noResults: (term: string) => `No results found for "${term}"`,
      loading: 'Searching...',
      selectionChanged: (result: SearchResult) => `Selected ${result.title}`,
      keyboardHelp: 'Use arrow keys to navigate, Enter to select, Escape to close',
    },
  },
  focusManagement: {
    autoFocusSearch: true,
    returnFocus: true,
    trapFocus: true,
    focusVisible: true,
    skipLinks: true,
  },
  aria: {
    dialogRole: 'dialog',
    resultsRole: 'listbox',
    resultRole: 'option',
    liveRegion: 'polite',
    labels: {
      searchInput: 'Search',
      resultsList: 'Search results',
      closeButton: 'Close search dialog',
      clearSearch: 'Clear search',
      toggleFavorite: 'Toggle favorite',
      toggleGroup: (expanded: boolean) => expanded ? 'Collapse group' : 'Expand group',
    },
  },
  highContrast: {
    enabled: true,
    forceColors: false,
    enhancedBorders: true,
  },
  motion: {
    respectReducedMotion: true,
    disableAnimations: true,
    reducedDuration: 150,
  },
  touch: {
    minTouchTarget: 44,
    touchSpacing: 8,
    detectCoarsePointer: true,
  },
};

/**
 * Default responsive configuration
 */
export const DEFAULT_RESPONSIVE_CONFIG: SearchResponsiveConfig = {
  breakpoints: {
    mobile: {
      position: 'fullscreen',
      maxWidth: '100vw',
      maxHeight: '100vh',
      resultsPerGroup: 5,
      showGroupHeaders: true,
      showDescriptions: false,
      showIcons: true,
      compactLayout: true,
      inputSize: 'lg',
    },
    tablet: {
      position: 'center',
      maxWidth: '600px',
      maxHeight: '80vh',
      resultsPerGroup: 8,
      showGroupHeaders: true,
      showDescriptions: true,
      showIcons: true,
      compactLayout: false,
      inputSize: 'md',
    },
    desktop: {
      position: 'center',
      maxWidth: '800px',
      maxHeight: '600px',
      resultsPerGroup: 10,
      showGroupHeaders: true,
      showDescriptions: true,
      showIcons: true,
      compactLayout: false,
      inputSize: 'md',
    },
  },
  touch: {
    enableGestures: true,
    swipeToDismiss: true,
    touchScrolling: true,
    hapticFeedback: false,
  },
  layout: {
    autoSize: true,
    fullScreenMobile: true,
    adaptiveResults: true,
    dynamicColumns: false,
  },
  performance: {
    virtualScrollThreshold: 100,
    lazyLoadImages: true,
    touchDebounce: 16,
  },
};

// Export all types for consumption by React components
export type {
  // Re-export for convenience
  ReactNode,
  ComponentType,
  KeyboardEvent,
  MouseEvent,
  RefObject,
};