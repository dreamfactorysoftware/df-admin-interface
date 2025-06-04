'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  ChevronRightIcon, 
  HomeIcon, 
  BookmarkIcon as BookmarkOutlineIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  StarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  BookmarkIcon as BookmarkSolidIcon,
  StarIcon as StarSolidIcon 
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

// Types for navigation state and schema paths
interface SchemaBreadcrumb {
  id: string;
  label: string;
  href: string;
  type: 'service' | 'database' | 'table' | 'field';
  icon?: string;
  metadata?: {
    serviceName?: string;
    databaseName?: string;
    tableName?: string;
    fieldName?: string;
  };
}

interface NavigationBookmark {
  id: string;
  label: string;
  href: string;
  schemaPath: SchemaBreadcrumb[];
  timestamp: number;
  isStarred: boolean;
  metadata: {
    serviceName: string;
    databaseName?: string;
    tableName?: string;
    description?: string;
  };
}

interface NavigationHistory {
  id: string;
  path: SchemaBreadcrumb[];
  timestamp: number;
  href: string;
  sessionDuration?: number;
}

interface QuickAccessItem {
  id: string;
  label: string;
  href: string;
  type: 'service' | 'table' | 'bookmark';
  frequency: number;
  lastAccessed: number;
  icon?: string;
}

// Hook for navigation state management (simulating Zustand store interface)
interface NavigationStore {
  breadcrumbs: SchemaBreadcrumb[];
  history: NavigationHistory[];
  bookmarks: NavigationBookmark[];
  quickAccess: QuickAccessItem[];
  setBreadcrumbs: (breadcrumbs: SchemaBreadcrumb[]) => void;
  addToHistory: (path: SchemaBreadcrumb[], href: string) => void;
  addBookmark: (bookmark: Omit<NavigationBookmark, 'id' | 'timestamp'>) => void;
  removeBookmark: (id: string) => void;
  toggleBookmarkStar: (id: string) => void;
  updateQuickAccess: (item: Omit<QuickAccessItem, 'id'>) => void;
  clearHistory: () => void;
}

// Simulated navigation utilities
const navigationUtils = {
  parseSchemaPath: (pathname: string, searchParams: URLSearchParams): SchemaBreadcrumb[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: SchemaBreadcrumb[] = [];

    if (segments.includes('api-connections') && segments.includes('database')) {
      breadcrumbs.push({
        id: 'home',
        label: 'Home',
        href: '/',
        type: 'service',
        icon: '🏠'
      });

      breadcrumbs.push({
        id: 'database-services',
        label: 'Database Services',
        href: '/api-connections/database',
        type: 'service',
        icon: '🔌'
      });

      const serviceId = segments[segments.indexOf('database') + 1];
      if (serviceId && serviceId !== 'create') {
        const serviceName = searchParams.get('service') || serviceId;
        breadcrumbs.push({
          id: `service-${serviceId}`,
          label: serviceName,
          href: `/api-connections/database/${serviceId}`,
          type: 'service',
          icon: '🗄️',
          metadata: { serviceName }
        });

        const schemaSection = segments[segments.indexOf(serviceId) + 1];
        if (schemaSection === 'schema') {
          breadcrumbs.push({
            id: `schema-${serviceId}`,
            label: 'Schema',
            href: `/api-connections/database/${serviceId}/schema`,
            type: 'database',
            icon: '📊',
            metadata: { serviceName, databaseName: 'main' }
          });

          const tableId = searchParams.get('table');
          if (tableId) {
            breadcrumbs.push({
              id: `table-${tableId}`,
              label: tableId,
              href: `/api-connections/database/${serviceId}/schema?table=${tableId}`,
              type: 'table',
              icon: '📋',
              metadata: { serviceName, databaseName: 'main', tableName: tableId }
            });

            const fieldId = searchParams.get('field');
            if (fieldId) {
              breadcrumbs.push({
                id: `field-${fieldId}`,
                label: fieldId,
                href: `/api-connections/database/${serviceId}/schema?table=${tableId}&field=${fieldId}`,
                type: 'field',
                icon: '🏷️',
                metadata: { serviceName, databaseName: 'main', tableName: tableId, fieldName: fieldId }
              });
            }
          }
        }
      }
    }

    return breadcrumbs;
  },

  generateBreadcrumbUrl: (breadcrumb: SchemaBreadcrumb): string => {
    return breadcrumb.href;
  },

  isPathBookmarked: (breadcrumbs: SchemaBreadcrumb[], bookmarks: NavigationBookmark[]): NavigationBookmark | null => {
    const currentHref = breadcrumbs[breadcrumbs.length - 1]?.href;
    return bookmarks.find(bookmark => bookmark.href === currentHref) || null;
  }
};

// Mock hook for navigation store (in real app, this would use Zustand)
const useNavigationStore = (): NavigationStore => {
  const [state, setState] = useState({
    breadcrumbs: [],
    history: [],
    bookmarks: [],
    quickAccess: []
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('df-navigation-state');
      if (stored) {
        const parsedState = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          history: parsedState.history || [],
          bookmarks: parsedState.bookmarks || [],
          quickAccess: parsedState.quickAccess || []
        }));
      }
    } catch (error) {
      console.warn('Failed to load navigation state from localStorage:', error);
    }
  }, []);

  // Save to localStorage when state changes
  const saveToStorage = useCallback((newState: any) => {
    try {
      localStorage.setItem('df-navigation-state', JSON.stringify({
        history: newState.history,
        bookmarks: newState.bookmarks,
        quickAccess: newState.quickAccess
      }));
    } catch (error) {
      console.warn('Failed to save navigation state to localStorage:', error);
    }
  }, []);

  const setBreadcrumbs = useCallback((breadcrumbs: SchemaBreadcrumb[]) => {
    setState(prev => ({ ...prev, breadcrumbs }));
  }, []);

  const addToHistory = useCallback((path: SchemaBreadcrumb[], href: string) => {
    setState(prev => {
      const newHistory = [
        {
          id: `history-${Date.now()}`,
          path,
          timestamp: Date.now(),
          href
        },
        ...prev.history.filter(item => item.href !== href)
      ].slice(0, 50); // Keep last 50 items

      const newState = { ...prev, history: newHistory };
      saveToStorage(newState);
      return newState;
    });
  }, [saveToStorage]);

  const addBookmark = useCallback((bookmark: Omit<NavigationBookmark, 'id' | 'timestamp'>) => {
    setState(prev => {
      const newBookmark: NavigationBookmark = {
        ...bookmark,
        id: `bookmark-${Date.now()}`,
        timestamp: Date.now()
      };

      const newBookmarks = [newBookmark, ...prev.bookmarks];
      const newState = { ...prev, bookmarks: newBookmarks };
      saveToStorage(newState);
      return newState;
    });
  }, [saveToStorage]);

  const removeBookmark = useCallback((id: string) => {
    setState(prev => {
      const newBookmarks = prev.bookmarks.filter(b => b.id !== id);
      const newState = { ...prev, bookmarks: newBookmarks };
      saveToStorage(newState);
      return newState;
    });
  }, [saveToStorage]);

  const toggleBookmarkStar = useCallback((id: string) => {
    setState(prev => {
      const newBookmarks = prev.bookmarks.map(b => 
        b.id === id ? { ...b, isStarred: !b.isStarred } : b
      );
      const newState = { ...prev, bookmarks: newBookmarks };
      saveToStorage(newState);
      return newState;
    });
  }, [saveToStorage]);

  const updateQuickAccess = useCallback((item: Omit<QuickAccessItem, 'id'>) => {
    setState(prev => {
      const existingIndex = prev.quickAccess.findIndex(qa => qa.href === item.href);
      let newQuickAccess;

      if (existingIndex >= 0) {
        newQuickAccess = [...prev.quickAccess];
        newQuickAccess[existingIndex] = {
          ...newQuickAccess[existingIndex],
          frequency: newQuickAccess[existingIndex].frequency + 1,
          lastAccessed: Date.now()
        };
      } else {
        newQuickAccess = [
          {
            ...item,
            id: `qa-${Date.now()}`,
            frequency: 1,
            lastAccessed: Date.now()
          },
          ...prev.quickAccess
        ];
      }

      // Sort by frequency and recency, keep top 10
      newQuickAccess = newQuickAccess
        .sort((a, b) => {
          const scoreA = a.frequency * 0.7 + (Date.now() - a.lastAccessed) / (1000 * 60 * 60 * 24) * 0.3;
          const scoreB = b.frequency * 0.7 + (Date.now() - b.lastAccessed) / (1000 * 60 * 60 * 24) * 0.3;
          return scoreB - scoreA;
        })
        .slice(0, 10);

      const newState = { ...prev, quickAccess: newQuickAccess };
      saveToStorage(newState);
      return newState;
    });
  }, [saveToStorage]);

  const clearHistory = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, history: [] };
      saveToStorage(newState);
      return newState;
    });
  }, [saveToStorage]);

  return {
    ...state,
    setBreadcrumbs,
    addToHistory,
    addBookmark,
    removeBookmark,
    toggleBookmarkStar,
    updateQuickAccess,
    clearHistory
  };
};

// Hook for navigation history (simulating the dependency)
const useNavigationHistory = () => {
  const router = useRouter();
  
  return {
    goBack: () => router.back(),
    goForward: () => router.forward(),
    navigateTo: (href: string) => router.push(href),
    canGoBack: true, // Simplified for demo
    canGoForward: false // Simplified for demo
  };
};

// Main component
interface SchemaExplorerNavigationProps {
  className?: string;
  showQuickAccess?: boolean;
  showBookmarks?: boolean;
  showHistory?: boolean;
  maxQuickAccessItems?: number;
}

export function SchemaExplorerNavigation({
  className,
  showQuickAccess = true,
  showBookmarks = true,
  showHistory = true,
  maxQuickAccessItems = 5
}: SchemaExplorerNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigationStore = useNavigationStore();
  const { navigateTo } = useNavigationHistory();

  // State for UI interactions
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [showQuickAccessMenu, setShowQuickAccessMenu] = useState(false);
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Parse current path into breadcrumbs
  const currentBreadcrumbs = useMemo(() => {
    return navigationUtils.parseSchemaPath(pathname, searchParams);
  }, [pathname, searchParams]);

  // Update store breadcrumbs when path changes
  useEffect(() => {
    navigationStore.setBreadcrumbs(currentBreadcrumbs);
    if (currentBreadcrumbs.length > 0) {
      navigationStore.addToHistory(currentBreadcrumbs, pathname);
    }
  }, [currentBreadcrumbs, pathname, navigationStore]);

  // Check if current path is bookmarked
  const currentBookmark = useMemo(() => {
    return navigationUtils.isPathBookmarked(currentBreadcrumbs, navigationStore.bookmarks);
  }, [currentBreadcrumbs, navigationStore.bookmarks]);

  // Filtered quick access items
  const filteredQuickAccess = useMemo(() => {
    if (!searchQuery) {
      return navigationStore.quickAccess.slice(0, maxQuickAccessItems);
    }
    return navigationStore.quickAccess
      .filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, maxQuickAccessItems);
  }, [navigationStore.quickAccess, searchQuery, maxQuickAccessItems]);

  // Handle bookmark toggle
  const handleBookmarkToggle = useCallback(() => {
    if (currentBookmark) {
      navigationStore.removeBookmark(currentBookmark.id);
    } else if (currentBreadcrumbs.length > 0) {
      const lastBreadcrumb = currentBreadcrumbs[currentBreadcrumbs.length - 1];
      navigationStore.addBookmark({
        label: lastBreadcrumb.label,
        href: lastBreadcrumb.href,
        schemaPath: currentBreadcrumbs,
        isStarred: false,
        metadata: {
          serviceName: lastBreadcrumb.metadata?.serviceName || 'Unknown Service',
          databaseName: lastBreadcrumb.metadata?.databaseName,
          tableName: lastBreadcrumb.metadata?.tableName,
          description: `${lastBreadcrumb.type} in ${lastBreadcrumb.metadata?.serviceName || 'database'}`
        }
      });
    }
  }, [currentBookmark, currentBreadcrumbs, navigationStore]);

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = useCallback((breadcrumb: SchemaBreadcrumb, index: number) => {
    // Update quick access
    navigationStore.updateQuickAccess({
      label: breadcrumb.label,
      href: breadcrumb.href,
      type: breadcrumb.type as 'service' | 'table' | 'bookmark',
      icon: breadcrumb.icon
    });

    navigateTo(breadcrumb.href);
  }, [navigationStore, navigateTo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+B for bookmark toggle
      if (event.altKey && event.key === 'b') {
        event.preventDefault();
        handleBookmarkToggle();
      }
      
      // Alt+H for history
      if (event.altKey && event.key === 'h') {
        event.preventDefault();
        setShowHistoryMenu(prev => !prev);
      }
      
      // Alt+Q for quick access
      if (event.altKey && event.key === 'q') {
        event.preventDefault();
        setShowQuickAccessMenu(prev => !prev);
      }
      
      // Escape to close menus
      if (event.key === 'Escape') {
        setShowBookmarkDialog(false);
        setShowQuickAccessMenu(false);
        setShowHistoryMenu(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleBookmarkToggle]);

  // Quick access component
  const QuickAccessDropdown = () => (
    <div className="relative">
      <button
        onClick={() => setShowQuickAccessMenu(!showQuickAccessMenu)}
        className={cn(
          "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
          "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2",
          "min-h-[44px] min-w-[44px]"
        )}
        aria-label="Quick access to frequently viewed schemas"
        aria-expanded={showQuickAccessMenu}
      >
        <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
        Quick Access
        <ChevronDownIcon className={cn(
          "h-4 w-4 ml-1 transition-transform",
          showQuickAccessMenu && "rotate-180"
        )} />
      </button>
      
      {showQuickAccessMenu && (
        <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search schemas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md",
                  "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                  "focus:ring-2 focus:ring-primary-600 focus:border-transparent",
                  "min-h-[44px]"
                )}
                aria-label="Search frequently accessed schemas"
              />
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {filteredQuickAccess.length > 0 ? (
              <div className="py-1">
                {filteredQuickAccess.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigateTo(item.href);
                      setShowQuickAccessMenu(false);
                      setSearchQuery('');
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300",
                      "hover:bg-gray-100 dark:hover:bg-gray-700",
                      "focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none",
                      "min-h-[44px] flex items-center"
                    )}
                  >
                    <span className="mr-2">{item.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Accessed {item.frequency} times
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No matching schemas found' : 'No frequently accessed items yet'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // History dropdown component
  const HistoryDropdown = () => (
    <div className="relative">
      <button
        onClick={() => setShowHistoryMenu(!showHistoryMenu)}
        className={cn(
          "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
          "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2",
          "min-h-[44px] min-w-[44px]"
        )}
        aria-label="Navigation history"
        aria-expanded={showHistoryMenu}
      >
        <ClockIcon className="h-4 w-4 mr-1" />
        History
        <ChevronDownIcon className={cn(
          "h-4 w-4 ml-1 transition-transform",
          showHistoryMenu && "rotate-180"
        )} />
      </button>
      
      {showHistoryMenu && (
        <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="max-h-64 overflow-y-auto">
            {navigationStore.history.length > 0 ? (
              <div className="py-1">
                {navigationStore.history.slice(0, 10).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigateTo(item.href);
                      setShowHistoryMenu(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300",
                      "hover:bg-gray-100 dark:hover:bg-gray-700",
                      "focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none",
                      "min-h-[44px] flex items-center"
                    )}
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.path[item.path.length - 1]?.label || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </button>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => {
                      navigationStore.clearHistory();
                      setShowHistoryMenu(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400",
                      "hover:bg-red-50 dark:hover:bg-red-900/20",
                      "focus:bg-red-50 dark:focus:bg-red-900/20 focus:outline-none",
                      "min-h-[44px] flex items-center justify-center"
                    )}
                  >
                    Clear History
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                No navigation history yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <nav 
      className={cn(
        "flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400",
        "bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700",
        "px-4 py-3 min-h-[60px]",
        className
      )}
      aria-label="Schema navigation breadcrumbs"
    >
      {/* Skip link for screen readers */}
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>

      {/* Breadcrumb navigation */}
      <div className="flex items-center flex-1 min-w-0">
        <ol className="flex items-center space-x-1" role="list">
          {currentBreadcrumbs.map((breadcrumb, index) => (
            <li key={breadcrumb.id} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon 
                  className="h-4 w-4 text-gray-400 mx-1 flex-shrink-0" 
                  aria-hidden="true" 
                />
              )}
              <button
                onClick={() => handleBreadcrumbClick(breadcrumb, index)}
                className={cn(
                  "inline-flex items-center px-2 py-1 rounded-md transition-colors",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1",
                  "min-h-[32px] min-w-[32px]",
                  index === currentBreadcrumbs.length - 1
                    ? "text-gray-900 dark:text-white font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
                aria-current={index === currentBreadcrumbs.length - 1 ? 'page' : undefined}
              >
                {breadcrumb.icon && (
                  <span className="mr-1" aria-hidden="true">
                    {breadcrumb.icon}
                  </span>
                )}
                <span className="truncate max-w-[150px]">{breadcrumb.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {/* Bookmark toggle */}
        {currentBreadcrumbs.length > 0 && showBookmarks && (
          <button
            onClick={handleBookmarkToggle}
            className={cn(
              "inline-flex items-center px-2 py-2 rounded-md transition-colors",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2",
              "min-h-[44px] min-w-[44px]",
              currentBookmark
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
            aria-label={currentBookmark ? "Remove bookmark" : "Add bookmark"}
            title={`${currentBookmark ? "Remove" : "Add"} bookmark (Alt+B)`}
          >
            {currentBookmark ? (
              <BookmarkSolidIcon className="h-5 w-5" />
            ) : (
              <BookmarkOutlineIcon className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Quick access */}
        {showQuickAccess && <QuickAccessDropdown />}

        {/* History */}
        {showHistory && <HistoryDropdown />}
      </div>

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {currentBreadcrumbs.length > 0 && (
          `Current location: ${currentBreadcrumbs.map(b => b.label).join(' > ')}`
        )}
      </div>
    </nav>
  );
}

export default SchemaExplorerNavigation;