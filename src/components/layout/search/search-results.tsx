'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Search, Clock, Plus, Database, Users, Settings, FileText, Shield, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types for search functionality
interface SearchResult {
  id: string;
  title: string;
  description?: string;
  path: string;
  type: 'service' | 'table' | 'user' | 'setting' | 'documentation' | 'dashboard';
  category: string;
  icon?: string;
  metadata?: {
    serviceType?: string;
    tableCount?: number;
    lastModified?: string;
  };
}

interface SearchResultGroup {
  category: string;
  label: string;
  results: SearchResult[];
  icon: React.ComponentType<{ className?: string }>;
}

interface SearchResultsProps {
  results?: SearchResult[];
  recentSearches?: SearchResult[];
  query?: string;
  isLoading?: boolean;
  onResultSelect?: (result: SearchResult) => void;
  onClose?: () => void;
  className?: string;
}

// Category configuration with icons and labels
const CATEGORY_CONFIG = {
  'database-services': {
    label: 'Database Services',
    icon: Database,
    priority: 1,
  },
  'schemas': {
    label: 'Tables & Schemas',
    icon: FileText,
    priority: 2,
  },
  'users': {
    label: 'Users & Roles',
    icon: Users,
    priority: 3,
  },
  'security': {
    label: 'Security & API Keys',
    icon: Shield,
    priority: 4,
  },
  'settings': {
    label: 'System Settings',
    icon: Settings,
    priority: 5,
  },
  'dashboard': {
    label: 'Dashboard & Reports',
    icon: Home,
    priority: 6,
  },
  'recent': {
    label: 'Recent Searches',
    icon: Clock,
    priority: 0,
  },
} as const;

// Result type icons
const getResultIcon = (type: SearchResult['type']) => {
  switch (type) {
    case 'service':
      return Database;
    case 'table':
      return FileText;
    case 'user':
      return Users;
    case 'setting':
      return Settings;
    case 'documentation':
      return FileText;
    case 'dashboard':
      return Home;
    default:
      return Search;
  }
};

// Group results by category
const groupResults = (results: SearchResult[]): SearchResultGroup[] => {
  const grouped = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return Object.entries(grouped)
    .map(([category, categoryResults]) => {
      const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || {
        label: category,
        icon: Search,
        priority: 999,
      };
      
      return {
        category,
        label: config.label,
        results: categoryResults,
        icon: config.icon,
      };
    })
    .sort((a, b) => {
      const aPriority = CATEGORY_CONFIG[a.category as keyof typeof CATEGORY_CONFIG]?.priority ?? 999;
      const bPriority = CATEGORY_CONFIG[b.category as keyof typeof CATEGORY_CONFIG]?.priority ?? 999;
      return aPriority - bPriority;
    });
};

// Main SearchResults component
export function SearchResults({
  results = [],
  recentSearches = [],
  query = '',
  isLoading = false,
  onResultSelect,
  onClose,
  className,
}: SearchResultsProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [focusedGroup, setFocusedGroup] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultRefs = useRef<(HTMLElement | null)[]>([]);

  // Group search results
  const groupedResults = groupResults(results);
  const hasRecentSearches = recentSearches.length > 0;
  
  // Add recent searches as first group if available and no search query
  const allGroups = !query && hasRecentSearches
    ? [
        {
          category: 'recent',
          label: 'Recent Searches',
          results: recentSearches.slice(0, 5),
          icon: Clock,
        },
        ...groupedResults,
      ]
    : groupedResults;

  // Flatten all results for keyboard navigation
  const allResults = allGroups.flatMap(group => group.results);

  // Handle result selection
  const handleResultSelect = useCallback((result: SearchResult) => {
    onResultSelect?.(result);
    onClose?.();
    router.push(result.path);
  }, [onResultSelect, onClose, router]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev < allResults.length - 1 ? prev + 1 : 0;
            // Scroll result into view
            const resultElement = resultRefs.current[newIndex];
            if (resultElement) {
              resultElement.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
              });
            }
            return newIndex;
          });
          break;

        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev > 0 ? prev - 1 : allResults.length - 1;
            // Scroll result into view
            const resultElement = resultRefs.current[newIndex];
            if (resultElement) {
              resultElement.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
              });
            }
            return newIndex;
          });
          break;

        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && allResults[selectedIndex]) {
            handleResultSelect(allResults[selectedIndex]);
          }
          break;

        case 'Escape':
          event.preventDefault();
          onClose?.();
          break;

        case 'Home':
          event.preventDefault();
          setSelectedIndex(0);
          const firstResult = resultRefs.current[0];
          if (firstResult) {
            firstResult.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            });
          }
          break;

        case 'End':
          event.preventDefault();
          const lastIndex = allResults.length - 1;
          setSelectedIndex(lastIndex);
          const lastResult = resultRefs.current[lastIndex];
          if (lastResult) {
            lastResult.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            });
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [allResults, selectedIndex, handleResultSelect, onClose]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1);
    setFocusedGroup(-1);
  }, [results, query]);

  // Loading state
  if (isLoading) {
    return (
      <div 
        className={cn("space-y-4", className)}
        data-testid="search-results-loading"
        role="status"
        aria-label="Loading search results"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
            <div className="space-y-2 ml-4">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!query && !hasRecentSearches) {
    return (
      <div 
        className={cn("text-center py-8", className)}
        data-testid="search-results-empty-initial"
      >
        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Start searching
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
          Find database services, tables, users, and system settings quickly with our global search.
        </p>
      </div>
    );
  }

  // No results state
  if (query && allGroups.length === 0) {
    return (
      <div 
        className={cn("text-center py-8", className)}
        data-testid="search-results-empty"
      >
        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No results found
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
          Try adjusting your search terms or explore different categories.
        </p>
        <div className="mt-6">
          <Link
            href="/api-connections/database/create"
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={onClose}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Database Service
          </Link>
        </div>
      </div>
    );
  }

  // Results display
  let resultIndex = 0;

  return (
    <div 
      ref={containerRef}
      className={cn("space-y-6", className)}
      data-testid="search-results-container"
      role="listbox"
      aria-label={`Search results for "${query}"`}
    >
      {allGroups.map((group, groupIndex) => {
        const groupStartIndex = resultIndex;
        const GroupIcon = group.icon;

        return (
          <div 
            key={group.category}
            className="space-y-2"
            data-testid={`search-group-${group.category}`}
          >
            {/* Group Header */}
            <div className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-md">
              <GroupIcon className="h-4 w-4" />
              <span>{group.label}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({group.results.length})
              </span>
            </div>

            {/* Group Results */}
            <div className="space-y-1" role="group" aria-labelledby={`group-${group.category}`}>
              {group.results.map((result, index) => {
                const currentIndex = resultIndex++;
                const isSelected = currentIndex === selectedIndex;
                const ResultIcon = getResultIcon(result.type);

                return (
                  <Link
                    key={result.id}
                    href={result.path}
                    ref={(el) => {
                      resultRefs.current[currentIndex] = el;
                    }}
                    className={cn(
                      "block p-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                      isSelected
                        ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700"
                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      handleResultSelect(result);
                    }}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    data-testid={`search-result-${result.id}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-label={`${result.title} - ${result.description || result.category}`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Result Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={cn(
                          "p-2 rounded-md",
                          isSelected 
                            ? "bg-primary-100 dark:bg-primary-800" 
                            : "bg-gray-100 dark:bg-gray-800"
                        )}>
                          <ResultIcon className={cn(
                            "h-4 w-4",
                            isSelected 
                              ? "text-primary-600 dark:text-primary-400" 
                              : "text-gray-600 dark:text-gray-400"
                          )} />
                        </div>
                      </div>

                      {/* Result Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={cn(
                            "text-sm font-medium truncate",
                            isSelected 
                              ? "text-primary-900 dark:text-primary-100" 
                              : "text-gray-900 dark:text-gray-100"
                          )}>
                            {result.title}
                          </h4>
                          <ChevronRight className={cn(
                            "h-4 w-4 flex-shrink-0 ml-2",
                            isSelected 
                              ? "text-primary-500 dark:text-primary-400" 
                              : "text-gray-400 dark:text-gray-500"
                          )} />
                        </div>

                        {result.description && (
                          <p className={cn(
                            "text-sm mt-1 line-clamp-2",
                            isSelected 
                              ? "text-primary-700 dark:text-primary-300" 
                              : "text-gray-600 dark:text-gray-400"
                          )}>
                            {result.description}
                          </p>
                        )}

                        {/* Metadata */}
                        {result.metadata && (
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {result.metadata.serviceType && (
                              <span className="flex items-center">
                                <span className="font-medium">Type:</span>
                                <span className="ml-1 uppercase">{result.metadata.serviceType}</span>
                              </span>
                            )}
                            {result.metadata.tableCount && (
                              <span className="flex items-center">
                                <span className="font-medium">Tables:</span>
                                <span className="ml-1">{result.metadata.tableCount}</span>
                              </span>
                            )}
                            {result.metadata.lastModified && (
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{result.metadata.lastModified}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Keyboard navigation hint */}
      <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
        <div className="flex items-center justify-between">
          <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
          {selectedIndex >= 0 && (
            <span>
              {selectedIndex + 1} of {allResults.length}
            </span>
          )}
        </div>
      </div>

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isLoading && "Loading search results"}
        {!isLoading && query && (
          `Found ${allResults.length} results for "${query}"`
        )}
        {selectedIndex >= 0 && allResults[selectedIndex] && (
          `Selected ${allResults[selectedIndex].title}`
        )}
      </div>
    </div>
  );
}

// Export utility functions for external use
export { groupResults, getResultIcon };

// Export types for external consumption
export type { SearchResult, SearchResultGroup, SearchResultsProps };