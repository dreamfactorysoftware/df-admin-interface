'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, 
  Plus, 
  Database, 
  Table, 
  Users, 
  Settings, 
  FileText, 
  Shield, 
  Code,
  Search,
  Clock,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { 
  SearchResults, 
  SearchResultGroup, 
  SearchResultItem, 
  SearchEntityType 
} from '@/types/search';
import { useSearch } from '@/hooks/use-search';

/**
 * Props for the SearchResults component
 */
interface SearchResultsProps {
  /** Search results data from React Query */
  results: SearchResults | null;
  /** Whether search is currently loading */
  isLoading?: boolean;
  /** Error state for search operation */
  error?: string | null;
  /** Recent searches to display when no results */
  recentSearches?: string[];
  /** Callback when a result is selected */
  onResultSelect?: (group: SearchResultGroup, item: SearchResultItem) => void;
  /** Callback when recent search is selected */
  onRecentSearchSelect?: (query: string) => void;
  /** Current query for highlighting */
  query?: string;
  /** Whether to show recent searches */
  showRecentSearches?: boolean;
  /** Maximum number of results to show per group */
  maxResultsPerGroup?: number;
  /** CSS class name */
  className?: string;
}

/**
 * Icon mapping for different entity types
 */
const ENTITY_ICONS: Record<SearchEntityType, React.ComponentType<{ className?: string }>> = {
  services: Database,
  databases: Database,
  tables: Table,
  fields: FileText,
  users: Users,
  roles: Shield,
  apps: Code,
  scripts: Code,
  configs: Settings,
  files: FileText,
  endpoints: Code,
  schemas: Table,
};

/**
 * Color mapping for different entity types
 */
const ENTITY_COLORS: Record<SearchEntityType, string> = {
  services: 'text-blue-500',
  databases: 'text-green-500',
  tables: 'text-purple-500',
  fields: 'text-orange-500',
  users: 'text-indigo-500',
  roles: 'text-red-500',
  apps: 'text-teal-500',
  scripts: 'text-yellow-500',
  configs: 'text-gray-500',
  files: 'text-pink-500',
  endpoints: 'text-cyan-500',
  schemas: 'text-violet-500',
};

/**
 * Group titles for different entity types
 */
const GROUP_TITLES: Record<SearchEntityType, string> = {
  services: 'Database Services',
  databases: 'Databases',
  tables: 'Tables',
  fields: 'Fields',
  users: 'Users',
  roles: 'Roles',
  apps: 'Applications',
  scripts: 'Scripts',
  configs: 'Configuration',
  files: 'Files',
  endpoints: 'API Endpoints',
  schemas: 'Database Schemas',
};

/**
 * SearchResults Component
 * 
 * Displays grouped search results with hierarchical structure, keyboard navigation,
 * and responsive design. Integrates with Next.js routing and React Query caching.
 * 
 * Features:
 * - Grouped results display with visual separation
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Loading and empty states
 * - Recent searches when no active results
 * - Responsive design with mobile-optimized touch targets
 * - Accessibility compliance with ARIA attributes
 * - Next.js Link integration for optimized navigation
 * 
 * @param props - SearchResults component props
 * @returns SearchResults component
 */
export function SearchResults({
  results,
  isLoading = false,
  error = null,
  recentSearches = [],
  onResultSelect,
  onRecentSearchSelect,
  query = '',
  showRecentSearches = true,
  maxResultsPerGroup = 5,
  className,
}: SearchResultsProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [focusedGroup, setFocusedGroup] = useState<string>('');

  // Get all selectable items (flattened from groups + recent searches)
  const selectableItems = React.useMemo(() => {
    const items: Array<{
      type: 'result' | 'recent';
      groupKey?: string;
      item?: SearchResultItem;
      query?: string;
      group?: SearchResultGroup;
    }> = [];

    // Add search results
    if (results?.groups) {
      results.groups.forEach((group, groupIndex) => {
        const groupKey = `${group.path}-${groupIndex}`;
        group.items.slice(0, maxResultsPerGroup).forEach((item) => {
          items.push({
            type: 'result',
            groupKey,
            item,
            group,
          });
        });
      });
    }

    // Add recent searches if showing and no current results
    if (showRecentSearches && (!results || results.totalItems === 0) && recentSearches.length > 0) {
      recentSearches.forEach((recentQuery) => {
        items.push({
          type: 'recent',
          query: recentQuery,
        });
      });
    }

    return items;
  }, [results, recentSearches, showRecentSearches, maxResultsPerGroup]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (selectableItems.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) => {
          const nextIndex = prev + 1;
          return nextIndex >= selectableItems.length ? 0 : nextIndex;
        });
        break;

      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => {
          const nextIndex = prev - 1;
          return nextIndex < 0 ? selectableItems.length - 1 : nextIndex;
        });
        break;

      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < selectableItems.length) {
          const selectedItem = selectableItems[selectedIndex];
          if (selectedItem.type === 'result' && selectedItem.item && selectedItem.group) {
            handleResultSelect(selectedItem.group, selectedItem.item);
          } else if (selectedItem.type === 'recent' && selectedItem.query) {
            handleRecentSearchSelect(selectedItem.query);
          }
        }
        break;

      case 'Escape':
        event.preventDefault();
        setSelectedIndex(-1);
        setFocusedGroup('');
        break;

      case 'Home':
        event.preventDefault();
        setSelectedIndex(0);
        break;

      case 'End':
        event.preventDefault();
        setSelectedIndex(selectableItems.length - 1);
        break;
    }
  }, [selectableItems, selectedIndex]);

  /**
   * Set up keyboard event listeners
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /**
   * Handle result selection and navigation
   */
  const handleResultSelect = useCallback((group: SearchResultGroup, item: SearchResultItem) => {
    onResultSelect?.(group, item);
    
    // Navigate to the result URL using Next.js router
    if (item.url) {
      router.push(item.url);
    } else {
      // Construct URL from group path and item segment
      const url = `/${group.path}/${item.segment}`;
      router.push(url);
    }
  }, [onResultSelect, router]);

  /**
   * Handle recent search selection
   */
  const handleRecentSearchSelect = useCallback((searchQuery: string) => {
    onRecentSearchSelect?.(searchQuery);
  }, [onRecentSearchSelect]);

  /**
   * Highlight matching text in search results
   */
  const highlightText = useCallback((text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark 
          key={index} 
          className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 rounded px-0.5"
        >
          {part}
        </mark>
      ) : part
    );
  }, []);

  /**
   * Loading State
   */
  if (isLoading) {
    return (
      <div 
        className={cn("w-full p-4", className)}
        data-testid="search-results-loading"
        role="status"
        aria-label="Loading search results"
      >
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
              <div className="space-y-2 ml-4">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div 
                    key={j} 
                    className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="sr-only">Searching...</div>
      </div>
    );
  }

  /**
   * Error State
   */
  if (error) {
    return (
      <div 
        className={cn("w-full p-4", className)}
        data-testid="search-results-error"
        role="alert"
        aria-label="Search error"
      >
        <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
          <Search className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Search Error</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Empty State with Recent Searches
   */
  if (!results || results.totalItems === 0) {
    return (
      <div 
        className={cn("w-full p-4", className)}
        data-testid="search-results-empty"
      >
        {showRecentSearches && recentSearches.length > 0 ? (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Recent Searches
              </h3>
            </div>
            <div 
              className="space-y-1"
              role="list"
              aria-label="Recent search queries"
            >
              {recentSearches.slice(0, 5).map((recentQuery, index) => (
                <button
                  key={`${recentQuery}-${index}`}
                  className={cn(
                    "w-full flex items-center space-x-3 p-2 rounded-md text-left transition-colors",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                    selectedIndex === index && "bg-primary-50 dark:bg-primary-900/20"
                  )}
                  onClick={() => handleRecentSearchSelect(recentQuery)}
                  data-testid={`recent-search-${index}`}
                  role="listitem"
                  aria-label={`Recent search: ${recentQuery}`}
                >
                  <Search className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {recentQuery}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {query ? `No results found for "${query}"` : 'Start typing to search...'}
            </p>
          </div>
        )}
      </div>
    );
  }

  /**
   * Results Display
   */
  return (
    <div 
      ref={containerRef}
      className={cn("w-full p-4 space-y-4", className)}
      data-testid="search-results-container"
      role="listbox"
      aria-label={`Search results for ${query}`}
      aria-activedescendant={
        selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined
      }
      tabIndex={0}
    >
      {/* Results Summary */}
      <div 
        className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2"
        data-testid="search-results-summary"
      >
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{results.totalItems}</span> results in{' '}
          <span className="font-medium">{results.totalGroups}</span> categories
          {results.executionTime && (
            <span className="ml-2">
              ({results.executionTime}ms)
            </span>
          )}
        </div>
        {results.hasMoreResults && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            aria-label="View all search results"
          >
            View All
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Result Groups */}
      <div className="space-y-4" role="list">
        {results.groups.map((group, groupIndex) => {
          if (group.items.length === 0) return null;

          const groupKey = `${group.path}-${groupIndex}`;
          const Icon = ENTITY_ICONS[group.path as SearchEntityType] || FileText;
          const iconColor = ENTITY_COLORS[group.path as SearchEntityType] || 'text-gray-500';
          const groupTitle = group.title || GROUP_TITLES[group.path as SearchEntityType] || group.path;

          return (
            <div 
              key={groupKey}
              className="space-y-2"
              data-testid={`search-group-${group.path}`}
              role="listitem"
            >
              {/* Group Header */}
              <div className="flex items-center space-x-2">
                <Icon className={cn("h-4 w-4", iconColor)} />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {groupTitle}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({group.items.length}
                  {group.totalCount && group.totalCount > group.items.length && 
                    ` of ${group.totalCount}`
                  })
                </span>
                {group.hasMore && (
                  <Plus className="h-3 w-3 text-gray-400" />
                )}
              </div>

              {/* Group Items */}
              <div className="ml-6 space-y-1" role="list">
                {group.items.slice(0, maxResultsPerGroup).map((item, itemIndex) => {
                  const globalIndex = results.groups
                    .slice(0, groupIndex)
                    .reduce((acc, g) => acc + Math.min(g.items.length, maxResultsPerGroup), 0) + itemIndex;
                  
                  const isSelected = selectedIndex === globalIndex;
                  const resultUrl = item.url || `/${group.path}/${item.segment}`;

                  return (
                    <Link
                      key={`${groupKey}-${item.segment}-${itemIndex}`}
                      href={resultUrl}
                      className={cn(
                        "block p-2 rounded-md transition-colors group",
                        "hover:bg-gray-100 dark:hover:bg-gray-800",
                        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                        isSelected && "bg-primary-50 dark:bg-primary-900/20"
                      )}
                      onClick={() => handleResultSelect(group, item)}
                      data-testid={`search-result-${globalIndex}`}
                      id={`search-result-${globalIndex}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-label={`${item.label}${item.description ? `: ${item.description}` : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {highlightText(item.label, query)}
                            </p>
                            {item.badge && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {highlightText(item.description, query)}
                            </p>
                          )}
                          {item.metadata && (
                            <div className="flex items-center space-x-2 mt-1">
                              {Object.entries(item.metadata).slice(0, 2).map(([key, value]) => (
                                <span 
                                  key={key}
                                  className="text-xs text-gray-400 dark:text-gray-500"
                                >
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <ChevronRight 
                          className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" 
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Show More Link */}
              {group.items.length > maxResultsPerGroup && (
                <div className="ml-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    aria-label={`View all ${group.totalCount || group.items.length} ${groupTitle.toLowerCase()}`}
                  >
                    View all {group.totalCount || group.items.length} {groupTitle.toLowerCase()}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Keyboard Navigation Help */}
      <div className="sr-only" aria-live="polite">
        {selectedIndex >= 0 && selectedIndex < selectableItems.length && (
          `Result ${selectedIndex + 1} of ${selectableItems.length} selected. Press Enter to navigate, arrow keys to move, Escape to clear selection.`
        )}
      </div>
    </div>
  );
}

export default SearchResults;