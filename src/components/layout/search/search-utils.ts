/**
 * Search utility functions for the DreamFactory Admin Interface
 * Provides pure TypeScript utilities for search functionality including translation key generation,
 * result formatting, navigation path utilities, and local storage operations
 */

import type { 
  SearchResults, 
  SearchResultGroup, 
  SearchResultItem, 
  SearchHistoryItem,
  SearchEntityType,
  NavigationDirection,
  SearchResultFormatOptions
} from '@/types/search';
import type { NavigationItem } from '@/types/navigation';

/**
 * Default configuration for search functionality
 */
export const DEFAULT_SEARCH_CONFIG = {
  debounceDelay: 2000,
  maxResultsPerGroup: 10,
  maxRecentSearches: 10,
  minQueryLength: 2,
  storageKey: 'df-search-history',
  enableAnalytics: true,
  enabledCategories: ['admin', 'user', 'service', 'role', 'app', 'script', 'limit', 'template'],
} as const;

/**
 * Storage keys for different search data
 */
export const STORAGE_KEYS = {
  recentSearches: 'df-search-recent',
  searchPreferences: 'df-search-preferences',
  searchAnalytics: 'df-search-analytics',
} as const;

/**
 * Translation key generation utilities
 */
export const translationUtils = {
  /**
   * Converts a navigation path to a translation key
   * Matches the original Angular implementation pattern
   * 
   * @param path - Navigation path (e.g., 'api-connections/database')
   * @returns Translation key (e.g., 'nav.api-connections.database.nav')
   * 
   * @example
   * ```typescript
   * getTranslationKey('api-connections/database') // 'nav.api-connections.database.nav'
   * getTranslationKey('admin-settings/users') // 'nav.admin-settings.users.nav'
   * ```
   */
  getTranslationKey: (path: string): string => {
    if (!path || typeof path !== 'string') {
      return 'nav.unknown.nav';
    }
    
    // Remove leading/trailing slashes and convert to dot notation
    const normalizedPath = path
      .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
      .replace(/\/+/g, '.'); // Replace slashes with dots
    
    return `nav.${normalizedPath}.nav`;
  },

  /**
   * Converts a translation key back to a navigation path
   * 
   * @param translationKey - Translation key (e.g., 'nav.api-connections.database.nav')
   * @returns Navigation path (e.g., 'api-connections/database')
   */
  getPathFromTranslationKey: (translationKey: string): string => {
    if (!translationKey || typeof translationKey !== 'string') {
      return '';
    }
    
    // Remove 'nav.' prefix and '.nav' suffix, then convert dots to slashes
    return translationKey
      .replace(/^nav\./, '') // Remove 'nav.' prefix
      .replace(/\.nav$/, '') // Remove '.nav' suffix
      .replace(/\./g, '/'); // Convert dots to slashes
  },

  /**
   * Generates translation keys for search result groups
   * 
   * @param groups - Array of search result groups
   * @returns Map of group paths to translation keys
   */
  getGroupTranslationKeys: (groups: SearchResultGroup[]): Map<string, string> => {
    const keyMap = new Map<string, string>();
    
    groups.forEach(group => {
      keyMap.set(group.path, translationUtils.getTranslationKey(group.path));
    });
    
    return keyMap;
  },
};

/**
 * Search result processing utilities
 */
export const resultProcessingUtils = {
  /**
   * Groups search results by path/category
   * 
   * @param items - Array of search result items with paths
   * @returns Array of grouped search results
   */
  groupResultsByPath: (items: Array<SearchResultItem & { path: string }>): SearchResultGroup[] => {
    const groupMap = new Map<string, SearchResultItem[]>();
    
    items.forEach(item => {
      const { path, ...resultItem } = item;
      if (!groupMap.has(path)) {
        groupMap.set(path, []);
      }
      groupMap.get(path)!.push(resultItem);
    });
    
    return Array.from(groupMap.entries()).map(([path, groupItems]) => ({
      path,
      items: groupItems,
      totalCount: groupItems.length,
      title: translationUtils.getTranslationKey(path),
    }));
  },

  /**
   * Filters search results based on query and entity types
   * 
   * @param groups - Search result groups to filter
   * @param query - Search query for filtering
   * @param entityTypes - Optional entity types to filter by
   * @returns Filtered search result groups
   */
  filterResults: (
    groups: SearchResultGroup[], 
    query: string, 
    entityTypes?: SearchEntityType[]
  ): SearchResultGroup[] => {
    if (!query.trim()) {
      return groups;
    }

    const lowercaseQuery = query.toLowerCase().trim();
    
    return groups
      .map(group => ({
        ...group,
        items: group.items.filter(item => 
          item.label.toLowerCase().includes(lowercaseQuery) ||
          item.description?.toLowerCase().includes(lowercaseQuery)
        ),
      }))
      .filter(group => group.items.length > 0)
      .filter(group => {
        if (!entityTypes || entityTypes.length === 0) {
          return true;
        }
        // Map paths to entity types (simplified mapping)
        const pathEntityTypeMap: Record<string, SearchEntityType> = {
          'admin-settings/admins': 'admin',
          'admin-settings/users': 'user',
          'api-connections': 'service',
          'api-security/roles': 'role',
          'api-security/rate-limiting': 'limit',
        };
        
        const entityType = pathEntityTypeMap[group.path];
        return entityType ? entityTypes.includes(entityType) : true;
      });
  },

  /**
   * Sorts search result groups by relevance and item count
   * 
   * @param groups - Search result groups to sort
   * @param query - Search query for relevance scoring
   * @returns Sorted search result groups
   */
  sortResultsByRelevance: (groups: SearchResultGroup[], query: string): SearchResultGroup[] => {
    const lowercaseQuery = query.toLowerCase().trim();
    
    return [...groups].sort((a, b) => {
      // Calculate relevance score for each group
      const scoreA = calculateGroupRelevance(a, lowercaseQuery);
      const scoreB = calculateGroupRelevance(b, lowercaseQuery);
      
      // Sort by relevance first, then by item count
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Higher score first
      }
      
      return b.items.length - a.items.length; // More items first
    });
  },

  /**
   * Limits the number of items per group and total groups
   * 
   * @param groups - Search result groups to limit
   * @param maxItemsPerGroup - Maximum items per group
   * @param maxGroups - Maximum number of groups
   * @returns Limited search result groups
   */
  limitResults: (
    groups: SearchResultGroup[], 
    maxItemsPerGroup: number = DEFAULT_SEARCH_CONFIG.maxResultsPerGroup,
    maxGroups?: number
  ): SearchResultGroup[] => {
    let limitedGroups = groups.map(group => ({
      ...group,
      items: group.items.slice(0, maxItemsPerGroup),
      hasMore: group.items.length > maxItemsPerGroup,
    }));

    if (maxGroups && maxGroups > 0) {
      limitedGroups = limitedGroups.slice(0, maxGroups);
    }

    return limitedGroups;
  },
};

/**
 * Navigation path utilities
 */
export const navigationUtils = {
  /**
   * Converts search result to full navigation path
   * 
   * @param group - Search result group
   * @param item - Search result item
   * @returns Complete navigation path
   */
  buildNavigationPath: (group: SearchResultGroup, item: SearchResultItem): string => {
    const basePath = group.path.startsWith('/') ? group.path : `/${group.path}`;
    
    if (item.segment) {
      return `${basePath}/${item.segment}`;
    }
    
    return basePath;
  },

  /**
   * Generates breadcrumb trail from navigation path
   * 
   * @param path - Navigation path
   * @returns Array of breadcrumb segments
   */
  getBreadcrumbFromPath: (path: string): Array<{ label: string; path: string }> => {
    if (!path || path === '/') {
      return [];
    }

    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: Array<{ label: string; path: string }> = [];
    
    let currentPath = '';
    segments.forEach(segment => {
      currentPath += `/${segment}`;
      breadcrumbs.push({
        label: segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        path: currentPath,
      });
    });
    
    return breadcrumbs;
  },

  /**
   * Validates if a navigation path is accessible
   * 
   * @param path - Navigation path to validate
   * @param navigationItems - Available navigation items
   * @returns Whether the path is accessible
   */
  isPathAccessible: (path: string, navigationItems: NavigationItem[]): boolean => {
    const findItemByPath = (items: NavigationItem[], targetPath: string): NavigationItem | null => {
      for (const item of items) {
        if (item.href === targetPath) {
          return item;
        }
        if (item.children) {
          const found = findItemByPath(item.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    return findItemByPath(navigationItems, path) !== null;
  },
};

/**
 * Local storage utilities for search history and preferences
 */
export const storageUtils = {
  /**
   * Retrieves recent search history from local storage
   * 
   * @returns Array of recent search history items
   */
  getRecentSearches: (): SearchHistoryItem[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.recentSearches);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored) as SearchHistoryItem[];
      
      // Validate and filter valid items
      return parsed
        .filter(item => 
          item.query && 
          typeof item.timestamp === 'number' && 
          item.timestamp > 0
        )
        .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
        .slice(0, DEFAULT_SEARCH_CONFIG.maxRecentSearches);
    } catch (error) {
      console.warn('Failed to retrieve recent searches:', error);
      return [];
    }
  },

  /**
   * Saves search history item to local storage
   * 
   * @param searchItem - Search history item to save
   */
  saveSearchToHistory: (searchItem: SearchHistoryItem): void => {
    try {
      const recentSearches = storageUtils.getRecentSearches();
      
      // Remove existing search with same query
      const filteredSearches = recentSearches.filter(
        item => item.query.toLowerCase() !== searchItem.query.toLowerCase()
      );
      
      // Add new search at the beginning
      const updatedSearches = [searchItem, ...filteredSearches]
        .slice(0, DEFAULT_SEARCH_CONFIG.maxRecentSearches);
      
      localStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(updatedSearches));
    } catch (error) {
      console.warn('Failed to save search to history:', error);
    }
  },

  /**
   * Clears all search history from local storage
   */
  clearSearchHistory: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.recentSearches);
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  },

  /**
   * Gets search preferences from local storage
   * 
   * @returns Search preferences object
   */
  getSearchPreferences: (): Partial<typeof DEFAULT_SEARCH_CONFIG> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.searchPreferences);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to retrieve search preferences:', error);
      return {};
    }
  },

  /**
   * Saves search preferences to local storage
   * 
   * @param preferences - Search preferences to save
   */
  saveSearchPreferences: (preferences: Partial<typeof DEFAULT_SEARCH_CONFIG>): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.searchPreferences, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save search preferences:', error);
    }
  },
};

/**
 * Search result formatting utilities
 */
export const formatUtils = {
  /**
   * Highlights matching text in search results
   * 
   * @param text - Text to highlight
   * @param query - Search query to highlight
   * @returns Text with highlighted matches
   */
  highlightMatches: (text: string, query: string): string => {
    if (!query.trim() || !text) return text;
    
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    return text.replace(regex, '<mark>$1</mark>');
  },

  /**
   * Truncates text with ellipsis
   * 
   * @param text - Text to truncate
   * @param maxLength - Maximum length before truncation
   * @returns Truncated text
   */
  truncateText: (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) return text;
    
    return `${text.slice(0, maxLength).trim()}...`;
  },

  /**
   * Formats search result count for display
   * 
   * @param count - Number of results
   * @returns Formatted count string
   */
  formatResultCount: (count: number): string => {
    if (count === 0) return 'No results';
    if (count === 1) return '1 result';
    if (count < 1000) return `${count} results`;
    
    const rounded = Math.floor(count / 100) / 10;
    return `${rounded}K+ results`;
  },

  /**
   * Formats timestamp for search history display
   * 
   * @param timestamp - Unix timestamp
   * @returns Formatted time string
   */
  formatTimestamp: (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    
    if (diff < minute) return 'Just now';
    if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
    if (diff < day) return `${Math.floor(diff / hour)}h ago`;
    if (diff < week) return `${Math.floor(diff / day)}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  },

  /**
   * Formats search results for display with options
   * 
   * @param groups - Search result groups
   * @param query - Search query
   * @param options - Formatting options
   * @returns Formatted search result groups
   */
  formatSearchResults: (
    groups: SearchResultGroup[], 
    query: string,
    options: Partial<SearchResultFormatOptions> = {}
  ): SearchResultGroup[] => {
    const {
      highlightMatches = true,
      maxLabelLength = 50,
      showResultCounts = true,
    } = options;

    return groups.map(group => ({
      ...group,
      items: group.items.map(item => ({
        ...item,
        label: highlightMatches 
          ? formatUtils.highlightMatches(
              formatUtils.truncateText(item.label, maxLabelLength),
              query
            )
          : formatUtils.truncateText(item.label, maxLabelLength),
        description: item.description 
          ? highlightMatches
            ? formatUtils.highlightMatches(item.description, query)
            : item.description
          : undefined,
      })),
      title: showResultCounts 
        ? `${group.title} (${group.items.length})`
        : group.title,
    }));
  },
};

/**
 * Keyboard navigation utilities
 */
export const keyboardUtils = {
  /**
   * Calculates next selected index for keyboard navigation
   * 
   * @param currentIndex - Current selected index
   * @param direction - Navigation direction
   * @param totalItems - Total number of items
   * @returns New selected index
   */
  getNextIndex: (
    currentIndex: number, 
    direction: NavigationDirection, 
    totalItems: number
  ): number => {
    if (totalItems === 0) return -1;
    
    switch (direction) {
      case 'up':
        return currentIndex <= 0 ? totalItems - 1 : currentIndex - 1;
      case 'down':
        return currentIndex >= totalItems - 1 ? 0 : currentIndex + 1;
      case 'first':
        return 0;
      case 'last':
        return totalItems - 1;
      default:
        return currentIndex;
    }
  },

  /**
   * Flattens search result groups into a single array for navigation
   * 
   * @param groups - Search result groups
   * @returns Flattened array with group and item information
   */
  flattenResultsForNavigation: (groups: SearchResultGroup[]): Array<{
    type: 'group' | 'item';
    groupIndex: number;
    itemIndex?: number;
    group: SearchResultGroup;
    item?: SearchResultItem;
  }> => {
    const flattened: Array<{
      type: 'group' | 'item';
      groupIndex: number;
      itemIndex?: number;
      group: SearchResultGroup;
      item?: SearchResultItem;
    }> = [];

    groups.forEach((group, groupIndex) => {
      // Add group header
      flattened.push({
        type: 'group',
        groupIndex,
        group,
      });

      // Add group items
      group.items.forEach((item, itemIndex) => {
        flattened.push({
          type: 'item',
          groupIndex,
          itemIndex,
          group,
          item,
        });
      });
    });

    return flattened;
  },

  /**
   * Gets the currently selected result item for keyboard navigation
   * 
   * @param groups - Search result groups
   * @param selectedIndex - Current selected index
   * @returns Selected result item or null
   */
  getSelectedResult: (
    groups: SearchResultGroup[], 
    selectedIndex: number
  ): { group: SearchResultGroup; item: SearchResultItem } | null => {
    const flattened = keyboardUtils.flattenResultsForNavigation(groups);
    const selected = flattened[selectedIndex];
    
    if (selected && selected.type === 'item' && selected.item) {
      return {
        group: selected.group,
        item: selected.item,
      };
    }
    
    return null;
  },
};

/**
 * Helper function to calculate relevance score for a search result group
 * 
 * @param group - Search result group
 * @param query - Search query
 * @returns Relevance score (higher is better)
 */
function calculateGroupRelevance(group: SearchResultGroup, query: string): number {
  let score = 0;
  
  // Score based on path matches
  if (group.path.toLowerCase().includes(query)) {
    score += 10;
  }
  
  // Score based on title matches
  if (group.title?.toLowerCase().includes(query)) {
    score += 8;
  }
  
  // Score based on item label matches
  group.items.forEach(item => {
    if (item.label.toLowerCase().includes(query)) {
      score += 5;
    }
    if (item.description?.toLowerCase().includes(query)) {
      score += 2;
    }
    
    // Exact matches get higher scores
    if (item.label.toLowerCase() === query) {
      score += 15;
    }
  });
  
  return score;
}

/**
 * Accessibility utilities for search functionality
 */
export const accessibilityUtils = {
  /**
   * Generates ARIA live region announcements for search results
   * 
   * @param groups - Search result groups
   * @param query - Search query
   * @returns Announcement text for screen readers
   */
  generateResultsAnnouncement: (groups: SearchResultGroup[], query: string): string => {
    const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0);
    
    if (totalItems === 0) {
      return `No search results found for "${query}"`;
    }
    
    const groupCount = groups.length;
    const groupText = groupCount === 1 ? 'category' : 'categories';
    const itemText = totalItems === 1 ? 'result' : 'results';
    
    return `Found ${totalItems} ${itemText} in ${groupCount} ${groupText} for "${query}"`;
  },

  /**
   * Generates ARIA label for search result item
   * 
   * @param group - Search result group
   * @param item - Search result item
   * @param position - Position in results
   * @returns ARIA label text
   */
  generateItemAriaLabel: (
    group: SearchResultGroup, 
    item: SearchResultItem, 
    position: number
  ): string => {
    const groupName = group.title || group.path;
    let label = `${item.label} in ${groupName}`;
    
    if (item.description) {
      label += `, ${item.description}`;
    }
    
    if (item.badge) {
      label += `, ${item.badge}`;
    }
    
    return `${label}. Result ${position}`;
  },
};

/**
 * Main export object with all utility categories
 */
export const searchUtils = {
  translation: translationUtils,
  resultProcessing: resultProcessingUtils,
  navigation: navigationUtils,
  storage: storageUtils,
  format: formatUtils,
  keyboard: keyboardUtils,
  accessibility: accessibilityUtils,
  config: DEFAULT_SEARCH_CONFIG,
  storageKeys: STORAGE_KEYS,
} as const;

// Individual utility exports for tree-shaking
export { 
  translationUtils,
  resultProcessingUtils,
  navigationUtils,
  storageUtils,
  formatUtils,
  keyboardUtils,
  accessibilityUtils,
};

// Export default configuration and constants
export { DEFAULT_SEARCH_CONFIG, STORAGE_KEYS };

export default searchUtils;