/**
 * Search Dialog Component Type Definitions
 * 
 * Comprehensive TypeScript interface definitions for the search dialog component system,
 * migrated from Angular dialog types to React 19/Next.js 15.1 patterns.
 * 
 * Supports global search functionality, result categorization, keyboard navigation,
 * and WCAG 2.1 AA accessibility compliance per technical specification Section 7.7.1.
 * 
 * @fileoverview Search dialog type definitions for React 19 component system
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

import { type ReactNode, type RefObject, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  type BaseComponentProps,
  type AccessibilityProps,
  type ThemeProps,
  type ResponsiveProps,
  type AnimationProps,
  type FocusProps,
  type ControlledProps,
  type EventHandlers
} from '@/types/ui';

/**
 * Search result type enumeration supporting multiple data categories
 * Matches the system's primary navigation and management entities
 */
export enum SearchResultType {
  /** Database service connections and configurations */
  DATABASE_SERVICE = 'database_service',
  /** Database tables within discovered schemas */
  DATABASE_TABLE = 'database_table',
  /** Database fields/columns within tables */
  DATABASE_FIELD = 'database_field',
  /** System users and account management */
  USER = 'user',
  /** Administrative users with elevated permissions */
  ADMIN = 'admin',
  /** User roles and permission groups */
  ROLE = 'role',
  /** System configuration settings */
  SYSTEM_SETTING = 'system_setting',
  /** API documentation and endpoint information */
  API_DOCUMENTATION = 'api_documentation',
  /** Generated API endpoints */
  API_ENDPOINT = 'api_endpoint',
  /** Application configurations */
  APPLICATION = 'application',
  /** Event scripts and automation */
  EVENT_SCRIPT = 'event_script',
  /** Email templates and notifications */
  EMAIL_TEMPLATE = 'email_template',
  /** File system navigation */
  FILE = 'file',
  /** System reports and analytics */
  REPORT = 'report',
  /** Scheduled tasks and jobs */
  SCHEDULED_TASK = 'scheduled_task',
  /** Global lookup keys */
  LOOKUP_KEY = 'lookup_key',
  /** Rate limiting and API limits */
  API_LIMIT = 'api_limit'
}

/**
 * Individual search result interface with comprehensive metadata
 * Supports hierarchical navigation and contextual information display
 */
export interface SearchResult {
  /** Unique identifier for the result */
  id: string;
  /** Result category type */
  type: SearchResultType;
  /** Display title/name of the result */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Detailed description for screen readers */
  description?: string;
  /** Navigation URL or route */
  href?: string;
  /** Icon name or React component for visual representation */
  icon?: string | ReactNode;
  /** Visual badge text (e.g., table count, user status) */
  badge?: string;
  /** Badge color variant for categorization */
  badgeColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  /** Parent entity information for hierarchical display */
  parent?: {
    id: string;
    title: string;
    type: SearchResultType;
  };
  /** Search relevance score (0-1) for result ordering */
  score?: number;
  /** Last modified timestamp for recency sorting */
  lastModified?: Date;
  /** Additional metadata for specific result types */
  metadata?: {
    /** Database-specific information */
    database?: {
      connectionStatus?: 'connected' | 'disconnected' | 'error';
      tableCount?: number;
      fieldCount?: number;
      engine?: string;
    };
    /** User-specific information */
    user?: {
      role?: string;
      status?: 'active' | 'inactive' | 'pending';
      lastLogin?: Date;
    };
    /** API-specific information */
    api?: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      endpoint?: string;
      deprecated?: boolean;
    };
    /** File-specific information */
    file?: {
      size?: number;
      extension?: string;
      mimeType?: string;
    };
  };
  /** Custom action handlers for result interaction */
  actions?: Array<{
    label: string;
    icon?: string | ReactNode;
    handler: () => void;
    hotkey?: string;
  }>;
}

/**
 * Grouped search results interface for categorized display
 * Enables organized presentation of search results by type
 */
export interface SearchResultGroup {
  /** Group identifier matching SearchResultType */
  type: SearchResultType;
  /** Display title for the group */
  title: string;
  /** Group description for accessibility */
  description?: string;
  /** Icon for the entire group */
  icon?: string | ReactNode;
  /** Array of results in this group */
  results: SearchResult[];
  /** Total number of available results (may exceed results.length) */
  totalCount?: number;
  /** Whether this group supports further filtering */
  filterable?: boolean;
  /** Whether this group can be collapsed/expanded */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
}

/**
 * Search dialog component state interface for comprehensive state management
 * Tracks search terms, selection state, and UI interaction state
 */
export interface SearchDialogState {
  /** Current search query string */
  query: string;
  /** Whether search is currently active/loading */
  isSearching: boolean;
  /** Current search results organized by groups */
  results: SearchResultGroup[];
  /** Currently selected result index (for keyboard navigation) */
  selectedIndex: number;
  /** Currently selected group index */
  selectedGroupIndex: number;
  /** Search error state */
  error?: string;
  /** Whether the dialog is currently open */
  isOpen: boolean;
  /** Recent search queries for quick access */
  recentSearches: string[];
  /** Whether to show recent searches */
  showRecentSearches: boolean;
  /** Loading state for different operations */
  loadingStates: {
    initial: boolean;
    searching: boolean;
    navigating: boolean;
  };
  /** Search filters and options */
  filters: {
    /** Filter by result types */
    types?: SearchResultType[];
    /** Date range filtering */
    dateRange?: {
      start: Date;
      end: Date;
    };
    /** Only show results user has access to */
    accessibleOnly?: boolean;
  };
  /** Pagination for large result sets */
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    hasNextPage: boolean;
  };
}

/**
 * Keyboard navigation event interface for accessible command palette interactions
 * Extends React's KeyboardEvent with search-specific navigation context
 */
export interface SearchKeyboardEvent extends ReactKeyboardEvent<HTMLElement> {
  /** The navigation action being performed */
  action: 'navigate' | 'select' | 'close' | 'filter' | 'expand' | 'collapse';
  /** Target result or group being navigated to */
  target?: {
    type: 'result' | 'group';
    index: number;
    groupIndex?: number;
  };
  /** Whether the event should prevent default browser behavior */
  shouldPreventDefault: boolean;
  /** Whether the event should stop propagation */
  shouldStopPropagation: boolean;
}

/**
 * Recent searches interface for local storage persistence
 * Manages search history with automatic cleanup and categorization
 */
export interface RecentSearches {
  /** Maximum number of recent searches to retain */
  maxCount: number;
  /** Automatic cleanup interval in milliseconds */
  cleanupInterval: number;
  /** Array of recent search entries */
  searches: Array<{
    /** Search query string */
    query: string;
    /** Timestamp when search was performed */
    timestamp: Date;
    /** Result count for this search */
    resultCount?: number;
    /** Most relevant result type for categorization */
    primaryResultType?: SearchResultType;
    /** Whether this search produced useful results */
    wasSuccessful?: boolean;
  }>;
  /** Search frequency tracking for intelligent suggestions */
  frequencies: Record<string, number>;
  /** User preference for saving searches */
  enabled: boolean;
  /** Storage key for persistence */
  storageKey: string;
  /** Cleanup configuration */
  cleanup: {
    /** Remove searches older than this many days */
    maxAgeDays: number;
    /** Remove searches with low success rate */
    removeUnsuccessful: boolean;
    /** Minimum frequency to retain search */
    minFrequency: number;
  };
}

/**
 * WCAG 2.1 AA accessibility configuration interface
 * Comprehensive accessibility settings for inclusive search experience
 */
export interface SearchA11yConfig {
  /** Keyboard navigation configuration */
  keyboard: {
    /** Enable arrow key navigation between results */
    arrowKeyNavigation: boolean;
    /** Enable Enter key for result selection */
    enterKeySelection: boolean;
    /** Enable Escape key for dialog dismissal */
    escapeKeyClose: boolean;
    /** Enable Tab key for focus management */
    tabKeyNavigation: boolean;
    /** Custom hotkey assignments */
    customHotkeys: Record<string, () => void>;
    /** Whether to announce navigation changes */
    announceNavigation: boolean;
  };
  /** Screen reader support configuration */
  screenReader: {
    /** Announce search results count */
    announceResultCount: boolean;
    /** Announce selected result details */
    announceSelection: boolean;
    /** Announce search status changes */
    announceStatus: boolean;
    /** Live region politeness level */
    liveRegionPoliteness: 'polite' | 'assertive' | 'off';
    /** Include detailed descriptions in announcements */
    includeDescriptions: boolean;
    /** Custom ARIA labels for specific elements */
    customLabels: {
      searchInput?: string;
      resultsList?: string;
      selectedResult?: string;
      noResults?: string;
      loading?: string;
    };
  };
  /** Focus management configuration */
  focus: {
    /** Trap focus within dialog when open */
    trapFocus: boolean;
    /** Restore focus to trigger element on close */
    restoreFocus: boolean;
    /** Auto-focus search input on open */
    autoFocusInput: boolean;
    /** Focus visible indicators */
    focusVisible: boolean;
    /** Custom focus ring styling */
    customFocusRing?: {
      color: string;
      width: string;
      offset: string;
    };
  };
  /** Color and contrast configuration */
  visual: {
    /** High contrast mode support */
    highContrastMode: boolean;
    /** Respect user's reduced motion preference */
    respectReducedMotion: boolean;
    /** Minimum contrast ratio enforcement (4.5:1 for AA) */
    enforceContrastRatio: boolean;
    /** Custom color overrides for accessibility */
    colorOverrides?: {
      focus?: string;
      selection?: string;
      error?: string;
      success?: string;
    };
  };
  /** Touch and mobile accessibility */
  touch: {
    /** Minimum touch target size (44px per WCAG) */
    minTouchTargetSize: number;
    /** Touch gesture support */
    gestureSupport: boolean;
    /** Swipe navigation between results */
    swipeNavigation: boolean;
    /** Haptic feedback on supported devices */
    hapticFeedback: boolean;
  };
}

/**
 * Responsive design configuration for mobile-first approach
 * Defines breakpoint-specific behavior and touch interaction support
 */
export interface SearchResponsiveConfig {
  /** Breakpoint definitions matching Tailwind CSS system */
  breakpoints: {
    sm: string; // 640px
    md: string; // 768px
    lg: string; // 1024px
    xl: string; // 1280px
  };
  /** Mobile-specific configuration */
  mobile: {
    /** Use full screen on mobile devices */
    fullScreen: boolean;
    /** Show search suggestions */
    showSuggestions: boolean;
    /** Enable voice search if supported */
    voiceSearchSupported: boolean;
    /** Virtual keyboard optimization */
    optimizeForVirtualKeyboard: boolean;
    /** Touch-friendly result spacing */
    touchFriendlySpacing: boolean;
  };
  /** Tablet-specific configuration */
  tablet: {
    /** Dialog width as percentage of screen */
    dialogWidth: string;
    /** Show sidebar with filters */
    showFilterSidebar: boolean;
    /** Grid layout for results */
    useGridLayout: boolean;
  };
  /** Desktop-specific configuration */
  desktop: {
    /** Maximum dialog width */
    maxDialogWidth: string;
    /** Enable hover previews */
    hoverPreviews: boolean;
    /** Show keyboard shortcuts */
    showKeyboardShortcuts: boolean;
    /** Multi-column result layout */
    multiColumnLayout: boolean;
  };
  /** Layout adaptation options */
  layout: {
    /** Automatically adjust based on content */
    adaptive: boolean;
    /** Preferred orientation handling */
    preferredOrientation: 'portrait' | 'landscape' | 'auto';
    /** Content density options */
    density: 'compact' | 'normal' | 'comfortable';
  };
}

/**
 * Main search dialog component props interface
 * Replaces Angular Material dialog configuration with React 19 patterns
 */
export interface SearchDialogProps 
  extends BaseComponentProps<HTMLDivElement>,
          AccessibilityProps,
          ThemeProps,
          ResponsiveProps,
          AnimationProps,
          FocusProps,
          ControlledProps<boolean> {
  
  /** Whether the search dialog is currently open */
  open: boolean;
  /** Handler for dialog open/close state changes */
  onOpenChange: (open: boolean) => void;
  /** Initial search query to populate */
  initialQuery?: string;
  /** Placeholder text for search input */
  placeholder?: string;
  /** Custom search handler function */
  onSearch?: (query: string, filters?: SearchDialogState['filters']) => Promise<SearchResultGroup[]>;
  /** Result selection handler */
  onSelectResult: (result: SearchResult) => void;
  /** Dialog close handler */
  onClose?: () => void;
  
  /** Configuration options */
  config?: {
    /** Accessibility configuration */
    accessibility?: Partial<SearchA11yConfig>;
    /** Responsive behavior configuration */
    responsive?: Partial<SearchResponsiveConfig>;
    /** Recent searches configuration */
    recentSearches?: Partial<RecentSearches>;
    /** Maximum number of results to show per group */
    maxResultsPerGroup?: number;
    /** Enable search suggestions */
    enableSuggestions?: boolean;
    /** Debounce delay for search queries in milliseconds */
    debounceDelay?: number;
    /** Minimum query length to trigger search */
    minQueryLength?: number;
  };

  /** UI customization options */
  customization?: {
    /** Custom search input component */
    SearchInput?: React.ComponentType<any>;
    /** Custom result item component */
    ResultItem?: React.ComponentType<{ result: SearchResult; isSelected: boolean }>;
    /** Custom group header component */
    GroupHeader?: React.ComponentType<{ group: SearchResultGroup; isExpanded: boolean }>;
    /** Custom empty state component */
    EmptyState?: React.ComponentType<{ query: string }>;
    /** Custom loading component */
    LoadingComponent?: React.ComponentType;
    /** Custom error component */
    ErrorComponent?: React.ComponentType<{ error: string; onRetry: () => void }>;
  };

  /** Event handlers for extended functionality */
  eventHandlers?: {
    /** Search query change handler */
    onQueryChange?: (query: string) => void;
    /** Keyboard navigation handler */
    onKeyboardNavigation?: (event: SearchKeyboardEvent) => void;
    /** Result hover handler for previews */
    onResultHover?: (result: SearchResult | null) => void;
    /** Filter change handler */
    onFilterChange?: (filters: SearchDialogState['filters']) => void;
    /** Analytics tracking handler */
    onTrackEvent?: (event: string, data: Record<string, any>) => void;
  };

  /** Advanced features */
  features?: {
    /** Enable result grouping */
    enableGrouping?: boolean;
    /** Enable result filtering */
    enableFiltering?: boolean;
    /** Enable result sorting */
    enableSorting?: boolean;
    /** Enable infinite scroll for large result sets */
    enableInfiniteScroll?: boolean;
    /** Enable result previews */
    enablePreviews?: boolean;
    /** Enable voice search (where supported) */
    enableVoiceSearch?: boolean;
    /** Enable search history */
    enableHistory?: boolean;
  };

  /** Dialog positioning and styling */
  positioning?: {
    /** Dialog position relative to trigger */
    position?: 'center' | 'top' | 'bottom';
    /** Custom positioning offset */
    offset?: { x: number; y: number };
    /** Whether dialog should adapt to available space */
    adaptive?: boolean;
  };

  /** Performance optimization options */
  performance?: {
    /** Enable result virtualization for large lists */
    enableVirtualization?: boolean;
    /** Result cache duration in milliseconds */
    cacheResultsDuration?: number;
    /** Lazy load result details */
    lazyLoadDetails?: boolean;
    /** Prefetch related results */
    prefetchRelated?: boolean;
  };

  /** Integration options */
  integration?: {
    /** Custom API client for search requests */
    apiClient?: any;
    /** Custom analytics tracker */
    analytics?: any;
    /** Custom logger for debugging */
    logger?: any;
    /** URL state synchronization */
    syncWithURL?: boolean;
  };

  /** Ref for programmatic access to dialog methods */
  ref?: RefObject<SearchDialogRef>;
}

/**
 * Search dialog ref interface for programmatic control
 * Provides imperative API for external components
 */
export interface SearchDialogRef {
  /** Programmatically open the dialog */
  open: () => void;
  /** Programmatically close the dialog */
  close: () => void;
  /** Focus the search input */
  focusInput: () => void;
  /** Clear the current search */
  clearSearch: () => void;
  /** Set search query programmatically */
  setQuery: (query: string) => void;
  /** Trigger search manually */
  triggerSearch: (query?: string) => Promise<void>;
  /** Navigate to specific result by index */
  navigateToResult: (groupIndex: number, resultIndex: number) => void;
  /** Get current search state */
  getState: () => SearchDialogState;
  /** Reset dialog to initial state */
  reset: () => void;
}

/**
 * Search context interface for sharing search state across components
 * Enables global search state management and coordination
 */
export interface SearchContextValue {
  /** Global search state */
  state: SearchDialogState;
  /** Search state setter */
  setState: (state: Partial<SearchDialogState>) => void;
  /** Global search function */
  search: (query: string, filters?: SearchDialogState['filters']) => Promise<SearchResultGroup[]>;
  /** Recent searches management */
  recentSearches: RecentSearches;
  /** Add to recent searches */
  addRecentSearch: (query: string, resultCount?: number, primaryType?: SearchResultType) => void;
  /** Clear recent searches */
  clearRecentSearches: () => void;
  /** Global accessibility configuration */
  a11yConfig: SearchA11yConfig;
  /** Update accessibility configuration */
  updateA11yConfig: (config: Partial<SearchA11yConfig>) => void;
  /** Global responsive configuration */
  responsiveConfig: SearchResponsiveConfig;
  /** Track search analytics event */
  trackEvent: (event: string, data: Record<string, any>) => void;
}

/**
 * Search result action interface for contextual actions
 * Defines available actions for each result type
 */
export interface SearchResultAction {
  /** Action identifier */
  id: string;
  /** Action label for display */
  label: string;
  /** Action description for accessibility */
  description?: string;
  /** Action icon */
  icon?: string | ReactNode;
  /** Keyboard shortcut */
  hotkey?: string;
  /** Action handler function */
  handler: (result: SearchResult) => void | Promise<void>;
  /** Whether action is disabled */
  disabled?: boolean;
  /** Action variant for styling */
  variant?: 'primary' | 'secondary' | 'destructive';
  /** Confirmation required before execution */
  requiresConfirmation?: boolean;
  /** Custom confirmation message */
  confirmationMessage?: string;
}

/**
 * Type guard functions for runtime type checking
 */
export const isSearchResult = (value: any): value is SearchResult => {
  return value && typeof value.id === 'string' && typeof value.type === 'string' && typeof value.title === 'string';
};

export const isSearchResultGroup = (value: any): value is SearchResultGroup => {
  return value && typeof value.type === 'string' && typeof value.title === 'string' && Array.isArray(value.results);
};

export const isSearchKeyboardEvent = (value: any): value is SearchKeyboardEvent => {
  return value && typeof value.action === 'string' && typeof value.shouldPreventDefault === 'boolean';
};

/**
 * Utility type for extracting result metadata by type
 */
export type SearchResultMetadataByType<T extends SearchResultType> = 
  T extends SearchResultType.DATABASE_SERVICE | SearchResultType.DATABASE_TABLE | SearchResultType.DATABASE_FIELD
    ? NonNullable<SearchResult['metadata']>['database']
    : T extends SearchResultType.USER | SearchResultType.ADMIN
    ? NonNullable<SearchResult['metadata']>['user']
    : T extends SearchResultType.API_ENDPOINT | SearchResultType.API_DOCUMENTATION
    ? NonNullable<SearchResult['metadata']>['api']
    : T extends SearchResultType.FILE
    ? NonNullable<SearchResult['metadata']>['file']
    : never;

/**
 * Utility type for strict result type checking
 */
export type TypedSearchResult<T extends SearchResultType> = SearchResult & {
  type: T;
  metadata?: {
    [K in keyof SearchResult['metadata']]: K extends keyof SearchResultMetadataByType<T>
      ? SearchResultMetadataByType<T>[K]
      : SearchResult['metadata'][K];
  };
};

/**
 * Export all interfaces and types for external consumption
 */
export type {
  BaseComponentProps,
  AccessibilityProps,
  ThemeProps,
  ResponsiveProps,
  AnimationProps,
  FocusProps,
  ControlledProps,
  EventHandlers
} from '@/types/ui';