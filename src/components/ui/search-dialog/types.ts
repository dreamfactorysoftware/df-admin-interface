/**
 * Comprehensive TypeScript interface definitions for the search dialog component system
 * Migrated from Angular dialog types with enhanced React patterns and accessibility support
 */

import { ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';

/**
 * Search result type enumeration supporting multiple result categories
 * Used for proper categorization and visual differentiation of search results
 */
export enum SearchResultType {
  DATABASE = 'database',
  TABLE = 'table',
  FIELD = 'field',
  USER = 'user',
  ADMIN = 'admin',
  ROLE = 'role',
  SERVICE = 'service',
  SETTING = 'setting',
  SCRIPT = 'script',
  FILE = 'file',
  APP = 'app',
  DOCUMENTATION = 'documentation'
}

/**
 * Individual search result interface with comprehensive metadata
 * Supports navigation, categorization, and accessibility features
 */
export interface SearchResult {
  /** Unique identifier for the search result */
  id: string;
  /** Display title for the search result */
  title: string;
  /** Optional description or subtitle */
  description?: string;
  /** Result type for categorization and icon selection */
  type: SearchResultType;
  /** Navigation URL or route for the result */
  url: string;
  /** Optional category for grouping results */
  category?: string;
  /** Optional icon name or component for visual representation */
  icon?: string | ReactNode;
  /** Additional metadata for enhanced search functionality */
  metadata?: {
    /** Parent context (e.g., database name for a table) */
    parent?: string;
    /** Tags for improved search matching */
    tags?: string[];
    /** Last modified date for relevance sorting */
    lastModified?: Date;
    /** Usage frequency for popularity sorting */
    usageCount?: number;
    /** Permissions level for access control */
    permissions?: string[];
  };
  /** Relevance score for search result ranking */
  score?: number;
  /** Highlighted text matches for search term visualization */
  highlights?: {
    title?: string;
    description?: string;
  };
}

/**
 * Search result group interface for organized result presentation
 * Enables categorized display of search results with proper accessibility
 */
export interface SearchResultGroup {
  /** Group identifier for accessibility and navigation */
  id: string;
  /** Display label for the result group */
  label: string;
  /** Array of search results in this group */
  results: SearchResult[];
  /** Optional icon for the group header */
  icon?: string | ReactNode;
  /** Whether the group is expanded by default */
  expanded?: boolean;
  /** Maximum number of results to show initially */
  maxVisible?: number;
}

/**
 * Search dialog component props interface with comprehensive configuration options
 * Replaces Angular Material dialog configuration with React patterns
 */
export interface SearchDialogProps {
  /** Whether the search dialog is currently open */
  open: boolean;
  /** Callback function when dialog should be closed */
  onClose: () => void;
  /** Callback function when a search result is selected */
  onSelect?: (result: SearchResult) => void;
  /** Custom search function override */
  onSearch?: (query: string) => Promise<SearchResult[]> | SearchResult[];
  /** Initial search query */
  initialQuery?: string;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Whether to show recent searches */
  showRecentSearches?: boolean;
  /** Maximum number of recent searches to display */
  maxRecentSearches?: number;
  /** Custom CSS classes for styling */
  className?: string;
  /** Accessibility configuration */
  a11y?: SearchA11yConfig;
  /** Responsive behavior configuration */
  responsive?: SearchResponsiveConfig;
  /** Keyboard navigation configuration */
  keyboard?: SearchKeyboardConfig;
}

/**
 * Search dialog internal state interface for component state management
 * Tracks search terms, selection, loading states, and user interactions
 */
export interface SearchDialogState {
  /** Current search query string */
  query: string;
  /** Search results from the current query */
  results: SearchResult[];
  /** Grouped search results for organized display */
  groupedResults: SearchResultGroup[];
  /** Currently selected result index for keyboard navigation */
  selectedIndex: number;
  /** Whether a search is currently in progress */
  loading: boolean;
  /** Error message if search fails */
  error?: string;
  /** Recent search queries for quick access */
  recentSearches: string[];
  /** Whether to show recent searches section */
  showRecents: boolean;
  /** Debounced query for API calls */
  debouncedQuery: string;
  /** Total number of results available */
  totalResults: number;
  /** Whether more results are available for pagination */
  hasMoreResults: boolean;
}

/**
 * Keyboard navigation event interface for accessible interactions
 * Defines keyboard actions and their corresponding behaviors
 */
export interface SearchKeyboardEvent {
  /** The keyboard key that was pressed */
  key: string;
  /** Whether Ctrl was held during the event */
  ctrlKey: boolean;
  /** Whether Meta (Cmd) was held during the event */
  metaKey: boolean;
  /** Whether Shift was held during the event */
  shiftKey: boolean;
  /** Whether Alt was held during the event */
  altKey: boolean;
  /** Action to perform based on the key combination */
  action: SearchKeyboardAction;
}

/**
 * Keyboard action enumeration for search dialog interactions
 * Defines available keyboard shortcuts and navigation actions
 */
export enum SearchKeyboardAction {
  OPEN_SEARCH = 'open_search',
  CLOSE_SEARCH = 'close_search',
  CLEAR_QUERY = 'clear_query',
  NAVIGATE_UP = 'navigate_up',
  NAVIGATE_DOWN = 'navigate_down',
  SELECT_RESULT = 'select_result',
  SHOW_RECENTS = 'show_recents',
  NEXT_GROUP = 'next_group',
  PREV_GROUP = 'prev_group'
}

/**
 * Recent searches interface for local storage persistence
 * Manages search history with automatic cleanup and privacy considerations
 */
export interface RecentSearches {
  /** Array of recent search queries */
  queries: string[];
  /** Maximum number of queries to store */
  maxCount: number;
  /** Timestamp of last update for cleanup scheduling */
  lastUpdated: Date;
  /** Automatic cleanup configuration */
  cleanup: {
    /** Number of days after which to remove old searches */
    retentionDays: number;
    /** Whether to clean up on app startup */
    cleanupOnStartup: boolean;
  };
}

/**
 * WCAG 2.1 AA accessibility configuration interface
 * Ensures compliance with accessibility standards and screen reader support
 */
export interface SearchA11yConfig {
  /** ARIA label for the search dialog */
  dialogLabel?: string;
  /** ARIA description for the search functionality */
  dialogDescription?: string;
  /** Whether to announce search results to screen readers */
  announceResults?: boolean;
  /** Whether to announce loading states */
  announceLoading?: boolean;
  /** Custom ARIA live region configuration */
  liveRegion?: {
    /** Politeness level for announcements */
    politeness: 'polite' | 'assertive' | 'off';
    /** Whether announcements are atomic */
    atomic: boolean;
  };
  /** Focus management configuration */
  focus?: {
    /** Whether to trap focus within the dialog */
    trapFocus: boolean;
    /** Element to focus when dialog opens */
    initialFocus?: 'input' | 'first-result' | 'close-button';
    /** Element to focus when dialog closes */
    returnFocus?: 'trigger' | 'body' | 'previous';
  };
  /** High contrast mode support */
  highContrast?: boolean;
  /** Reduced motion preferences */
  reducedMotion?: boolean;
}

/**
 * Responsive design configuration for mobile-first approach
 * Defines behavior across different screen sizes and touch interactions
 */
export interface SearchResponsiveConfig {
  /** Breakpoint definitions for responsive behavior */
  breakpoints?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  /** Mobile-specific configuration */
  mobile?: {
    /** Whether to use fullscreen mode on mobile */
    fullscreen: boolean;
    /** Touch interaction enhancements */
    touchOptimized: boolean;
    /** Virtual keyboard handling */
    virtualKeyboard: {
      /** Whether to adjust layout for virtual keyboard */
      adjustLayout: boolean;
      /** Minimum viewport height when keyboard is visible */
      minHeight: number;
    };
  };
  /** Tablet-specific configuration */
  tablet?: {
    /** Maximum width for tablet layout */
    maxWidth: number;
    /** Whether to show side-by-side layout */
    sideBySide: boolean;
  };
  /** Desktop-specific configuration */
  desktop?: {
    /** Maximum width for desktop layout */
    maxWidth: number;
    /** Whether to center the dialog */
    centered: boolean;
  };
}

/**
 * Keyboard navigation configuration interface
 * Defines keyboard shortcuts and navigation behavior
 */
export interface SearchKeyboardConfig {
  /** Global keyboard shortcuts */
  shortcuts?: {
    /** Key combination to open search (default: Cmd/Ctrl+K) */
    open?: string[];
    /** Key to close search (default: Escape) */
    close?: string[];
    /** Key to clear search (default: Escape when input focused) */
    clear?: string[];
  };
  /** Navigation keys configuration */
  navigation?: {
    /** Keys for moving up in results (default: ArrowUp) */
    up?: string[];
    /** Keys for moving down in results (default: ArrowDown) */
    down?: string[];
    /** Keys for selecting result (default: Enter) */
    select?: string[];
    /** Keys for next result group (default: Tab) */
    nextGroup?: string[];
    /** Keys for previous result group (default: Shift+Tab) */
    prevGroup?: string[];
  };
  /** Whether to enable vim-style navigation */
  vimMode?: boolean;
  /** Whether to prevent default browser shortcuts */
  preventDefaults?: boolean;
}

/**
 * Search filter interface for advanced filtering options
 * Enables users to narrow down search results by various criteria
 */
export interface SearchFilter {
  /** Filter identifier */
  id: string;
  /** Display label for the filter */
  label: string;
  /** Filter type for different filtering mechanisms */
  type: 'select' | 'checkbox' | 'date-range' | 'text';
  /** Available filter options for select/checkbox types */
  options?: SearchFilterOption[];
  /** Current filter value */
  value?: any;
  /** Whether the filter is currently active */
  active: boolean;
  /** Number of results that match this filter */
  count?: number;
}

/**
 * Search filter option interface for individual filter choices
 * Used with select and checkbox filter types
 */
export interface SearchFilterOption {
  /** Option value */
  value: string;
  /** Display label for the option */
  label: string;
  /** Number of results that match this option */
  count?: number;
  /** Optional icon for the option */
  icon?: string | ReactNode;
  /** Whether the option is currently selected */
  selected?: boolean;
}

/**
 * Search context interface for provider pattern
 * Enables sharing search state across multiple components
 */
export interface SearchContextValue {
  /** Current search state */
  state: SearchDialogState;
  /** Actions for updating search state */
  actions: {
    /** Update the search query */
    setQuery: (query: string) => void;
    /** Set search results */
    setResults: (results: SearchResult[]) => void;
    /** Set loading state */
    setLoading: (loading: boolean) => void;
    /** Set error state */
    setError: (error: string | undefined) => void;
    /** Add to recent searches */
    addRecentSearch: (query: string) => void;
    /** Clear recent searches */
    clearRecentSearches: () => void;
    /** Select a search result */
    selectResult: (result: SearchResult) => void;
    /** Navigate to next result */
    navigateNext: () => void;
    /** Navigate to previous result */
    navigatePrev: () => void;
  };
  /** Search configuration */
  config: {
    /** Accessibility configuration */
    a11y: SearchA11yConfig;
    /** Responsive configuration */
    responsive: SearchResponsiveConfig;
    /** Keyboard configuration */
    keyboard: SearchKeyboardConfig;
  };
}

/**
 * Search input specific props extending the base search dialog types
 * Provides focused interface for the search input component
 */
export interface SearchInputFormData {
  /** Search query field */
  search: string;
}

/**
 * Search input component ref interface for imperative actions
 * Enables parent components to control the search input programmatically
 */
export interface SearchInputRef {
  /** Focus the search input */
  focus: () => void;
  /** Clear the search input */
  clear: () => void;
  /** Get current input value */
  getValue: () => string;
  /** Set input value programmatically */
  setValue: (value: string) => void;
  /** Trigger search immediately */
  search: () => void;
}

/**
 * Default values for search configuration objects
 * Provides sensible defaults while allowing customization
 */
export const DEFAULT_SEARCH_CONFIG = {
  a11y: {
    dialogLabel: 'Global search',
    dialogDescription: 'Search for databases, tables, users, and settings',
    announceResults: true,
    announceLoading: true,
    liveRegion: {
      politeness: 'polite' as const,
      atomic: true
    },
    focus: {
      trapFocus: true,
      initialFocus: 'input' as const,
      returnFocus: 'trigger' as const
    },
    highContrast: false,
    reducedMotion: false
  },
  responsive: {
    breakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1280
    },
    mobile: {
      fullscreen: true,
      touchOptimized: true,
      virtualKeyboard: {
        adjustLayout: true,
        minHeight: 300
      }
    },
    tablet: {
      maxWidth: 600,
      sideBySide: false
    },
    desktop: {
      maxWidth: 800,
      centered: true
    }
  },
  keyboard: {
    shortcuts: {
      open: ['Cmd+K', 'Ctrl+K'],
      close: ['Escape'],
      clear: ['Escape']
    },
    navigation: {
      up: ['ArrowUp'],
      down: ['ArrowDown'],
      select: ['Enter'],
      nextGroup: ['Tab'],
      prevGroup: ['Shift+Tab']
    },
    vimMode: false,
    preventDefaults: true
  }
} as const;

export default {
  SearchResultType,
  SearchKeyboardAction,
  DEFAULT_SEARCH_CONFIG
};