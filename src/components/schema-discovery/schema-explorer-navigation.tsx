/**
 * Schema Explorer Navigation Component
 * 
 * React component providing breadcrumb navigation, schema path tracking, and drill-down 
 * capabilities for database schema exploration. Features navigation history, bookmarking, 
 * and quick access to frequently viewed schemas with full keyboard accessibility support.
 * 
 * @fileoverview Schema navigation with breadcrumbs and history for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ChevronRightIcon, 
  HomeIcon, 
  BookmarkIcon, 
  ClockIcon,
  StarIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { 
  BookmarkIcon as BookmarkSolidIcon,
  StarIcon as StarSolidIcon 
} from '@heroicons/react/24/solid';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Schema navigation path segment
 */
export interface SchemaPathSegment {
  /** Unique identifier for the path segment */
  id: string;
  /** Display label for the segment */
  label: string;
  /** Type of schema element */
  type: 'database' | 'service' | 'schema' | 'table' | 'field' | 'relationship';
  /** Full path to this segment */
  path: string;
  /** Additional metadata for the segment */
  metadata?: {
    /** Icon name or component identifier */
    icon?: string;
    /** Description or tooltip text */
    description?: string;
    /** Custom data for the segment */
    data?: Record<string, any>;
  };
}

/**
 * Navigation history entry
 */
export interface NavigationHistoryEntry {
  /** Unique identifier for the history entry */
  id: string;
  /** Complete path segments at time of visit */
  pathSegments: SchemaPathSegment[];
  /** Timestamp when the path was visited */
  timestamp: number;
  /** Display title for the history entry */
  title: string;
  /** Full URL path */
  url: string;
  /** Visit count for popularity sorting */
  visitCount: number;
}

/**
 * Bookmarked schema path
 */
export interface SchemaBookmark {
  /** Unique identifier for the bookmark */
  id: string;
  /** Display name for the bookmark */
  name: string;
  /** Complete path segments for the bookmark */
  pathSegments: SchemaPathSegment[];
  /** Full URL path */
  url: string;
  /** Timestamp when bookmarked */
  createdAt: number;
  /** Optional description */
  description?: string;
  /** Whether this is a favorite bookmark */
  isFavorite: boolean;
  /** Custom tags for organization */
  tags: string[];
}

/**
 * Quick access item for frequently viewed schemas
 */
export interface QuickAccessItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Path segments */
  pathSegments: SchemaPathSegment[];
  /** URL path */
  url: string;
  /** Access frequency score */
  score: number;
  /** Last accessed timestamp */
  lastAccessed: number;
  /** Icon for display */
  icon?: string;
}

/**
 * Navigation store state interface
 */
interface NavigationState {
  /** Current path segments */
  currentPath: SchemaPathSegment[];
  /** Navigation history */
  history: NavigationHistoryEntry[];
  /** Bookmarked paths */
  bookmarks: SchemaBookmark[];
  /** Quick access items */
  quickAccess: QuickAccessItem[];
  /** Current history index for back/forward navigation */
  historyIndex: number;
  /** Search query for filtering */
  searchQuery: string;
  /** Whether sidebar is expanded */
  isExpanded: boolean;
  /** Recently viewed items limit */
  maxHistoryItems: number;
  /** Quick access items limit */
  maxQuickAccessItems: number;
}

/**
 * Navigation store actions interface
 */
interface NavigationActions {
  /** Set current navigation path */
  setCurrentPath: (path: SchemaPathSegment[]) => void;
  /** Add entry to navigation history */
  addToHistory: (entry: Omit<NavigationHistoryEntry, 'id' | 'timestamp' | 'visitCount'>) => void;
  /** Navigate back in history */
  goBack: () => void;
  /** Navigate forward in history */
  goForward: () => void;
  /** Add bookmark */
  addBookmark: (bookmark: Omit<SchemaBookmark, 'id' | 'createdAt'>) => void;
  /** Remove bookmark */
  removeBookmark: (id: string) => void;
  /** Toggle bookmark favorite status */
  toggleBookmarkFavorite: (id: string) => void;
  /** Update bookmark */
  updateBookmark: (id: string, updates: Partial<SchemaBookmark>) => void;
  /** Update quick access items */
  updateQuickAccess: (path: SchemaPathSegment[], url: string) => void;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Toggle sidebar expansion */
  toggleExpanded: () => void;
  /** Clear all history */
  clearHistory: () => void;
  /** Clear all bookmarks */
  clearBookmarks: () => void;
  /** Export navigation data */
  exportData: () => string;
  /** Import navigation data */
  importData: (data: string) => boolean;
}

type NavigationStore = NavigationState & NavigationActions;

// =============================================================================
// ZUSTAND STORE IMPLEMENTATION
// =============================================================================

/**
 * Navigation store using Zustand for schema explorer state management
 * Integrates with localStorage for persistence across sessions
 */
const useNavigationStore = create<NavigationStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentPath: [],
        history: [],
        bookmarks: [],
        quickAccess: [],
        historyIndex: -1,
        searchQuery: '',
        isExpanded: true,
        maxHistoryItems: 50,
        maxQuickAccessItems: 10,

        // Actions
        setCurrentPath: (path: SchemaPathSegment[]) => {
          set({ currentPath: path });
        },

        addToHistory: (entry) => {
          const { history, maxHistoryItems } = get();
          const id = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const timestamp = Date.now();
          
          // Check if this path already exists in history
          const existingIndex = history.findIndex(h => h.url === entry.url);
          
          let newHistory: NavigationHistoryEntry[];
          if (existingIndex >= 0) {
            // Update existing entry
            newHistory = history.map((h, index) => 
              index === existingIndex 
                ? { ...h, timestamp, visitCount: h.visitCount + 1 }
                : h
            );
          } else {
            // Add new entry
            const newEntry: NavigationHistoryEntry = {
              id,
              timestamp,
              visitCount: 1,
              ...entry,
            };
            newHistory = [newEntry, ...history].slice(0, maxHistoryItems);
          }
          
          set({ 
            history: newHistory,
            historyIndex: 0 
          });
        },

        goBack: () => {
          const { history, historyIndex } = get();
          if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            set({ historyIndex: newIndex });
            return history[newIndex];
          }
          return null;
        },

        goForward: () => {
          const { history, historyIndex } = get();
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            set({ historyIndex: newIndex });
            return history[newIndex];
          }
          return null;
        },

        addBookmark: (bookmark) => {
          const { bookmarks } = get();
          const id = `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const createdAt = Date.now();
          
          // Check if bookmark already exists
          const exists = bookmarks.some(b => b.url === bookmark.url);
          if (exists) return;
          
          const newBookmark: SchemaBookmark = {
            id,
            createdAt,
            ...bookmark,
          };
          
          set({ bookmarks: [newBookmark, ...bookmarks] });
        },

        removeBookmark: (id: string) => {
          const { bookmarks } = get();
          set({ bookmarks: bookmarks.filter(b => b.id !== id) });
        },

        toggleBookmarkFavorite: (id: string) => {
          const { bookmarks } = get();
          set({
            bookmarks: bookmarks.map(b => 
              b.id === id ? { ...b, isFavorite: !b.isFavorite } : b
            ),
          });
        },

        updateBookmark: (id: string, updates: Partial<SchemaBookmark>) => {
          const { bookmarks } = get();
          set({
            bookmarks: bookmarks.map(b => 
              b.id === id ? { ...b, ...updates } : b
            ),
          });
        },

        updateQuickAccess: (path: SchemaPathSegment[], url: string) => {
          const { quickAccess, maxQuickAccessItems } = get();
          const label = path[path.length - 1]?.label || 'Unknown';
          const id = `quick_${url.replace(/[^a-zA-Z0-9]/g, '_')}`;
          
          const existingIndex = quickAccess.findIndex(qa => qa.id === id);
          let newQuickAccess: QuickAccessItem[];
          
          if (existingIndex >= 0) {
            // Update existing item
            newQuickAccess = quickAccess.map((qa, index) => 
              index === existingIndex 
                ? { 
                    ...qa, 
                    score: qa.score + 1, 
                    lastAccessed: Date.now(),
                    pathSegments: path 
                  }
                : qa
            );
          } else {
            // Add new item
            const newItem: QuickAccessItem = {
              id,
              label,
              pathSegments: path,
              url,
              score: 1,
              lastAccessed: Date.now(),
              icon: path[path.length - 1]?.metadata?.icon,
            };
            newQuickAccess = [newItem, ...quickAccess];
          }
          
          // Sort by score and limit items
          newQuickAccess = newQuickAccess
            .sort((a, b) => b.score - a.score)
            .slice(0, maxQuickAccessItems);
          
          set({ quickAccess: newQuickAccess });
        },

        setSearchQuery: (query: string) => {
          set({ searchQuery: query });
        },

        toggleExpanded: () => {
          set(state => ({ isExpanded: !state.isExpanded }));
        },

        clearHistory: () => {
          set({ history: [], historyIndex: -1 });
        },

        clearBookmarks: () => {
          set({ bookmarks: [] });
        },

        exportData: () => {
          const { history, bookmarks, quickAccess } = get();
          return JSON.stringify({ history, bookmarks, quickAccess }, null, 2);
        },

        importData: (data: string) => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.history) set({ history: parsed.history });
            if (parsed.bookmarks) set({ bookmarks: parsed.bookmarks });
            if (parsed.quickAccess) set({ quickAccess: parsed.quickAccess });
            return true;
          } catch {
            return false;
          }
        },
      }),
      {
        name: 'schema-navigation-store',
        partialize: (state) => ({
          history: state.history,
          bookmarks: state.bookmarks,
          quickAccess: state.quickAccess,
          isExpanded: state.isExpanded,
          maxHistoryItems: state.maxHistoryItems,
          maxQuickAccessItems: state.maxQuickAccessItems,
        }),
      }
    ),
    {
      name: 'Schema Navigation Store',
    }
  )
);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate schema path from URL parameters
 */
const generatePathFromParams = (searchParams: URLSearchParams): SchemaPathSegment[] => {
  const service = searchParams.get('service');
  const schema = searchParams.get('schema');
  const table = searchParams.get('table');
  const field = searchParams.get('field');
  
  const path: SchemaPathSegment[] = [];
  
  if (service) {
    path.push({
      id: `service_${service}`,
      label: service,
      type: 'service',
      path: `/api-connections/database/${service}`,
      metadata: { icon: 'database' }
    });
  }
  
  if (schema) {
    path.push({
      id: `schema_${schema}`,
      label: schema,
      type: 'schema', 
      path: `/api-connections/database/${service}/schema?schema=${schema}`,
      metadata: { icon: 'folder' }
    });
  }
  
  if (table) {
    path.push({
      id: `table_${table}`,
      label: table,
      type: 'table',
      path: `/api-connections/database/${service}/schema?schema=${schema}&table=${table}`,
      metadata: { icon: 'table' }
    });
  }
  
  if (field) {
    path.push({
      id: `field_${field}`,
      label: field,
      type: 'field',
      path: `/api-connections/database/${service}/schema?schema=${schema}&table=${table}&field=${field}`,
      metadata: { icon: 'column' }
    });
  }
  
  return path;
};

/**
 * Create URL from path segments
 */
const createUrlFromPath = (segments: SchemaPathSegment[]): string => {
  if (segments.length === 0) return '/api-connections/database';
  return segments[segments.length - 1].path;
};

/**
 * Generate title from path segments
 */
const generateTitle = (segments: SchemaPathSegment[]): string => {
  if (segments.length === 0) return 'Schema Explorer';
  return segments.map(s => s.label).join(' › ');
};

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

/**
 * Props for the SchemaExplorerNavigation component
 */
export interface SchemaExplorerNavigationProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the compact version */
  compact?: boolean;
  /** Callback when navigation changes */
  onNavigationChange?: (path: SchemaPathSegment[]) => void;
  /** Whether to enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;
  /** Maximum number of breadcrumb segments to show before truncation */
  maxBreadcrumbSegments?: number;
}

/**
 * Schema Explorer Navigation Component
 * 
 * Provides comprehensive navigation capabilities for database schema exploration
 * including breadcrumbs, history, bookmarks, and quick access functionality.
 */
export function SchemaExplorerNavigation({
  className = '',
  compact = false,
  onNavigationChange,
  enableKeyboardShortcuts = true,
  maxBreadcrumbSegments = 5,
}: SchemaExplorerNavigationProps) {
  // =============================================================================
  // HOOKS AND STATE
  // =============================================================================
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Navigation store
  const {
    currentPath,
    history,
    bookmarks,
    quickAccess,
    historyIndex,
    searchQuery,
    isExpanded,
    setCurrentPath,
    addToHistory,
    goBack,
    goForward,
    addBookmark,
    removeBookmark,
    toggleBookmarkFavorite,
    updateQuickAccess,
    setSearchQuery,
    toggleExpanded,
  } = useNavigationStore();
  
  // Local component state
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  // Generate current path from URL parameters
  const urlPath = useMemo(() => 
    generatePathFromParams(searchParams), 
    [searchParams]
  );
  
  // Check if current path is bookmarked
  const isCurrentPathBookmarked = useMemo(() => {
    const currentUrl = createUrlFromPath(currentPath);
    return bookmarks.some(b => b.url === currentUrl);
  }, [currentPath, bookmarks]);
  
  // Filter items based on search query
  const filteredBookmarks = useMemo(() => {
    if (!searchQuery) return bookmarks;
    const query = searchQuery.toLowerCase();
    return bookmarks.filter(b => 
      b.name.toLowerCase().includes(query) ||
      b.pathSegments.some(s => s.label.toLowerCase().includes(query))
    );
  }, [bookmarks, searchQuery]);
  
  const filteredHistory = useMemo(() => {
    if (!searchQuery) return history.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return history
      .filter(h => 
        h.title.toLowerCase().includes(query) ||
        h.pathSegments.some(s => s.label.toLowerCase().includes(query))
      )
      .slice(0, 20);
  }, [history, searchQuery]);
  
  // Recent and frequent items for quick access
  const recentItems = useMemo(() => 
    history
      .slice(0, 5)
      .map(h => ({
        id: h.id,
        label: h.title,
        pathSegments: h.pathSegments,
        url: h.url,
        type: 'recent' as const,
      })),
    [history]
  );
  
  const frequentItems = useMemo(() => 
    quickAccess
      .slice(0, 5)
      .map(qa => ({
        id: qa.id,
        label: qa.label,
        pathSegments: qa.pathSegments,
        url: qa.url,
        type: 'frequent' as const,
      })),
    [quickAccess]
  );
  
  // Navigation controls state
  const canGoBack = historyIndex < history.length - 1;
  const canGoForward = historyIndex > 0;
  
  // Truncated breadcrumb segments for display
  const displaySegments = useMemo(() => {
    if (currentPath.length <= maxBreadcrumbSegments) {
      return currentPath;
    }
    
    // Show first segment, ellipsis, and last segments
    const firstSegment = currentPath[0];
    const lastSegments = currentPath.slice(-2);
    
    return [
      firstSegment,
      {
        id: 'ellipsis',
        label: '...',
        type: 'ellipsis' as const,
        path: '',
        metadata: { truncated: true }
      },
      ...lastSegments,
    ];
  }, [currentPath, maxBreadcrumbSegments]);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  /**
   * Handle navigation to a specific path
   */
  const handleNavigate = useCallback((segments: SchemaPathSegment[]) => {
    const url = createUrlFromPath(segments);
    const title = generateTitle(segments);
    
    // Update current path
    setCurrentPath(segments);
    
    // Add to history
    addToHistory({
      pathSegments: segments,
      title,
      url,
    });
    
    // Update quick access
    updateQuickAccess(segments, url);
    
    // Navigate using Next.js router
    router.push(url);
    
    // Notify parent component
    onNavigationChange?.(segments);
  }, [setCurrentPath, addToHistory, updateQuickAccess, router, onNavigationChange]);
  
  /**
   * Handle breadcrumb segment click
   */
  const handleBreadcrumbClick = useCallback((segmentIndex: number) => {
    const targetSegments = currentPath.slice(0, segmentIndex + 1);
    handleNavigate(targetSegments);
  }, [currentPath, handleNavigate]);
  
  /**
   * Handle back/forward navigation
   */
  const handleHistoryNavigation = useCallback((direction: 'back' | 'forward') => {
    const historyEntry = direction === 'back' ? goBack() : goForward();
    if (historyEntry) {
      setCurrentPath(historyEntry.pathSegments);
      router.push(historyEntry.url);
      onNavigationChange?.(historyEntry.pathSegments);
    }
  }, [goBack, goForward, setCurrentPath, router, onNavigationChange]);
  
  /**
   * Handle bookmark toggle
   */
  const handleBookmarkToggle = useCallback(() => {
    if (isCurrentPathBookmarked) {
      const currentUrl = createUrlFromPath(currentPath);
      const bookmark = bookmarks.find(b => b.url === currentUrl);
      if (bookmark) {
        removeBookmark(bookmark.id);
      }
    } else {
      const name = generateTitle(currentPath);
      const url = createUrlFromPath(currentPath);
      addBookmark({
        name,
        pathSegments: currentPath,
        url,
        description: `Bookmark for ${name}`,
        isFavorite: false,
        tags: [],
      });
    }
  }, [isCurrentPathBookmarked, currentPath, bookmarks, removeBookmark, addBookmark]);
  
  // =============================================================================
  // KEYBOARD SHORTCUTS
  // =============================================================================
  
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        isSearchFocused
      ) {
        return;
      }
      
      const { ctrlKey, metaKey, altKey, key } = event;
      const modKey = ctrlKey || metaKey;
      
      switch (true) {
        // Alt + Left Arrow: Go back
        case altKey && key === 'ArrowLeft':
          event.preventDefault();
          if (canGoBack) handleHistoryNavigation('back');
          break;
          
        // Alt + Right Arrow: Go forward
        case altKey && key === 'ArrowRight':
          event.preventDefault();
          if (canGoForward) handleHistoryNavigation('forward');
          break;
          
        // Ctrl/Cmd + B: Toggle bookmark
        case modKey && key === 'b':
          event.preventDefault();
          handleBookmarkToggle();
          break;
          
        // Ctrl/Cmd + K: Focus search
        case modKey && key === 'k':
          event.preventDefault();
          document.getElementById('schema-nav-search')?.focus();
          break;
          
        // Ctrl/Cmd + H: Toggle history
        case modKey && key === 'h':
          event.preventDefault();
          setShowHistory(!showHistory);
          break;
          
        // Ctrl/Cmd + Shift + B: Toggle bookmarks
        case modKey && event.shiftKey && key === 'B':
          event.preventDefault();
          setShowBookmarks(!showBookmarks);
          break;
          
        // Escape: Close all dropdowns
        case key === 'Escape':
          setShowBookmarks(false);
          setShowHistory(false);
          setShowQuickAccess(false);
          setSearchQuery('');
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    enableKeyboardShortcuts,
    isSearchFocused,
    canGoBack,
    canGoForward,
    showHistory,
    showBookmarks,
    handleHistoryNavigation,
    handleBookmarkToggle,
    setSearchQuery,
  ]);
  
  // =============================================================================
  // SYNC URL WITH CURRENT PATH
  // =============================================================================
  
  useEffect(() => {
    if (JSON.stringify(urlPath) !== JSON.stringify(currentPath)) {
      setCurrentPath(urlPath);
      
      if (urlPath.length > 0) {
        const title = generateTitle(urlPath);
        const url = createUrlFromPath(urlPath);
        
        addToHistory({
          pathSegments: urlPath,
          title,
          url,
        });
        
        updateQuickAccess(urlPath, url);
        onNavigationChange?.(urlPath);
      }
    }
  }, [urlPath, currentPath, setCurrentPath, addToHistory, updateQuickAccess, onNavigationChange]);
  
  // =============================================================================
  // RENDER HELPERS
  // =============================================================================
  
  const renderBreadcrumbSegment = (segment: SchemaPathSegment, index: number, isLast: boolean) => (
    <Fragment key={segment.id}>
      {index > 0 && (
        <ChevronRightIcon 
          className="flex-shrink-0 h-4 w-4 text-gray-400" 
          aria-hidden="true" 
        />
      )}
      {segment.type === 'ellipsis' ? (
        <span className="flex items-center space-x-1 text-gray-500">
          <EllipsisHorizontalIcon className="h-4 w-4" />
        </span>
      ) : (
        <button
          onClick={() => !isLast && handleBreadcrumbClick(index)}
          className={`
            flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-medium transition-colors
            ${isLast 
              ? 'text-gray-900 dark:text-gray-100 cursor-default' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
          disabled={isLast}
          aria-current={isLast ? 'page' : undefined}
        >
          {index === 0 && (
            <HomeIcon className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{segment.label}</span>
        </button>
      )}
    </Fragment>
  );
  
  const renderQuickAccessItem = (item: typeof recentItems[0] | typeof frequentItems[0]) => (
    <button
      key={item.id}
      onClick={() => handleNavigate(item.pathSegments)}
      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md flex items-center space-x-3"
    >
      {item.type === 'recent' ? (
        <ClockIcon className="h-4 w-4 text-gray-400" />
      ) : (
        <StarIcon className="h-4 w-4 text-gray-400" />
      )}
      <span className="truncate">{item.label}</span>
    </button>
  );
  
  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  return (
    <nav 
      className={`
        bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 
        ${compact ? 'py-2' : 'py-3'} px-4 ${className}
      `}
      aria-label="Schema navigation"
    >
      <div className="flex items-center justify-between space-x-4">
        {/* Left section: Back/Forward + Breadcrumbs */}
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {/* Back/Forward buttons */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={() => handleHistoryNavigation('back')}
              disabled={!canGoBack}
              className={`
                p-1.5 rounded-md transition-colors
                ${canGoBack 
                  ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800' 
                  : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                }
              `}
              title="Go back (Alt + ←)"
              aria-label="Go back in navigation history"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => handleHistoryNavigation('forward')}
              disabled={!canGoForward}
              className={`
                p-1.5 rounded-md transition-colors
                ${canGoForward 
                  ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800' 
                  : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                }
              `}
              title="Go forward (Alt + →)"
              aria-label="Go forward in navigation history"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
          
          {/* Breadcrumb navigation */}
          <div className="flex items-center space-x-1 min-w-0 overflow-hidden">
            <nav className="flex items-center space-x-1" aria-label="Breadcrumb">
              {displaySegments.length > 0 ? (
                displaySegments.map((segment, index) => 
                  renderBreadcrumbSegment(segment, index, index === displaySegments.length - 1)
                )
              ) : (
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  Select a database service to explore schemas
                </span>
              )}
            </nav>
          </div>
        </div>
        
        {/* Right section: Search + Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Search */}
          {!compact && (
            <div className="relative">
              <input
                id="schema-nav-search"
                type="text"
                placeholder="Search navigation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-48 pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Search bookmarks and history"
              />
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          
          {/* Bookmark toggle */}
          {currentPath.length > 0 && (
            <button
              onClick={handleBookmarkToggle}
              className={`
                p-1.5 rounded-md transition-colors
                ${isCurrentPathBookmarked 
                  ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                } hover:bg-gray-100 dark:hover:bg-gray-800
              `}
              title={`${isCurrentPathBookmarked ? 'Remove' : 'Add'} bookmark (Ctrl + B)`}
              aria-label={`${isCurrentPathBookmarked ? 'Remove' : 'Add'} bookmark for current path`}
            >
              {isCurrentPathBookmarked ? (
                <BookmarkSolidIcon className="h-4 w-4" />
              ) : (
                <BookmarkIcon className="h-4 w-4" />
              )}
            </button>
          )}
          
          {/* Quick access dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowQuickAccess(!showQuickAccess)}
              className="p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Quick access"
              aria-label="Show quick access menu"
              aria-expanded={showQuickAccess}
            >
              <StarIcon className="h-4 w-4" />
            </button>
            
            {showQuickAccess && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Quick Access
                  </h3>
                </div>
                
                {recentItems.length > 0 && (
                  <div className="p-2">
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Recent
                    </h4>
                    <div className="space-y-1">
                      {recentItems.map(renderQuickAccessItem)}
                    </div>
                  </div>
                )}
                
                {frequentItems.length > 0 && (
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Frequent
                    </h4>
                    <div className="space-y-1">
                      {frequentItems.map(renderQuickAccessItem)}
                    </div>
                  </div>
                )}
                
                {recentItems.length === 0 && frequentItems.length === 0 && (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No quick access items yet
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* History dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Navigation history (Ctrl + H)"
              aria-label="Show navigation history"
              aria-expanded={showHistory}
            >
              <ClockIcon className="h-4 w-4" />
            </button>
            
            {showHistory && (
              <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Navigation History
                  </h3>
                </div>
                
                <div className="p-2">
                  {filteredHistory.length > 0 ? (
                    <div className="space-y-1">
                      {filteredHistory.map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => handleNavigate(entry.pathSegments)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {entry.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(entry.timestamp).toLocaleString()} • {entry.visitCount} visits
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      {searchQuery ? 'No matching history items' : 'No navigation history yet'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Bookmarks dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBookmarks(!showBookmarks)}
              className="p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Bookmarks (Ctrl + Shift + B)"
              aria-label="Show bookmarks"
              aria-expanded={showBookmarks}
            >
              <BookmarkIcon className="h-4 w-4" />
            </button>
            
            {showBookmarks && (
              <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Bookmarks
                  </h3>
                </div>
                
                <div className="p-2">
                  {filteredBookmarks.length > 0 ? (
                    <div className="space-y-1">
                      {filteredBookmarks.map((bookmark) => (
                        <div key={bookmark.id} className="flex items-center space-x-2">
                          <button
                            onClick={() => handleNavigate(bookmark.pathSegments)}
                            className="flex-1 text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                          >
                            <div className="flex items-center space-x-2">
                              {bookmark.isFavorite && (
                                <StarSolidIcon className="h-3 w-3 text-yellow-500" />
                              )}
                              <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {bookmark.name}
                              </span>
                            </div>
                            {bookmark.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {bookmark.description}
                              </div>
                            )}
                          </button>
                          
                          <button
                            onClick={() => toggleBookmarkFavorite(bookmark.id)}
                            className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                            title={bookmark.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            aria-label={bookmark.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            {bookmark.isFavorite ? (
                              <StarSolidIcon className="h-3 w-3" />
                            ) : (
                              <StarIcon className="h-3 w-3" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => removeBookmark(bookmark.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove bookmark"
                            aria-label="Remove bookmark"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      {searchQuery ? 'No matching bookmarks' : 'No bookmarks yet'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Keyboard shortcuts help */}
      {enableKeyboardShortcuts && (
        <div className="sr-only">
          <p>Keyboard shortcuts available:</p>
          <ul>
            <li>Alt + Left Arrow: Go back</li>
            <li>Alt + Right Arrow: Go forward</li>
            <li>Ctrl/Cmd + B: Toggle bookmark</li>
            <li>Ctrl/Cmd + K: Focus search</li>
            <li>Ctrl/Cmd + H: Toggle history</li>
            <li>Ctrl/Cmd + Shift + B: Toggle bookmarks</li>
            <li>Escape: Close all dropdowns</li>
          </ul>
        </div>
      )}
    </nav>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default SchemaExplorerNavigation;

// Hook for external components to access navigation store
export const useSchemaNavigation = () => useNavigationStore();

// Utility function for generating navigation paths
export { generatePathFromParams, createUrlFromPath, generateTitle };

// Type exports
export type {
  SchemaPathSegment,
  NavigationHistoryEntry,
  SchemaBookmark,
  QuickAccessItem,
  SchemaExplorerNavigationProps,
};