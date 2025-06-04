/**
 * Search Utility Functions
 * 
 * Pure TypeScript utility functions for search functionality including translation key generation,
 * result formatting, and search result processing. Provides helper functions for converting search
 * paths to translation keys and formatting search results for display components.
 * 
 * Features:
 * - Translation key generation matching Angular implementation pattern
 * - Search result processing utilities for grouping, filtering, and sorting
 * - Local storage utilities for persisting recent search history
 * - Type-safe interfaces with comprehensive TypeScript definitions
 * - Performance-optimized utilities suitable for frequent search operations
 * - Keyboard navigation and accessibility support
 */

// ========================================
// Type Definitions
// ========================================

/**
 * Search result item representing a navigable page or feature
 */
export interface SearchResult {
  /** Unique identifier for the search result */
  id: string;
  /** Display title for the search result */
  title: string;
  /** Optional description or subtitle */
  description?: string;
  /** Navigation path (Next.js route) */
  path: string;
  /** Category for grouping results */
  category: SearchCategory;
  /** Keywords for enhanced search matching */
  keywords: string[];
  /** Icon identifier for display */
  icon?: string;
  /** Priority for sorting (higher = more important) */
  priority: number;
  /** Whether this item requires specific permissions */
  requiresAuth?: boolean;
  /** Tags for additional filtering */
  tags?: string[];
  /** Last access timestamp for recent items */
  lastAccessed?: number;
}

/**
 * Search categories for organizing results
 */
export type SearchCategory = 
  | 'database-services'
  | 'schema-management'
  | 'api-generation'
  | 'user-management'
  | 'system-settings'
  | 'security'
  | 'documentation'
  | 'tools'
  | 'recent';

/**
 * Search filter configuration
 */
export interface SearchFilter {
  /** Category to filter by */
  category?: SearchCategory;
  /** Tags to filter by */
  tags?: string[];
  /** Whether to include recent items only */
  recentOnly?: boolean;
  /** Minimum priority level */
  minPriority?: number;
  /** Whether to require authentication */
  requiresAuth?: boolean;
}

/**
 * Search options for customizing search behavior
 */
export interface SearchOptions {
  /** Whether to perform fuzzy matching */
  fuzzy?: boolean;
  /** Maximum number of results to return */
  limit?: number;
  /** Minimum search term length to trigger search */
  minLength?: number;
  /** Whether to include descriptions in search */
  searchDescriptions?: boolean;
  /** Whether to include keywords in search */
  searchKeywords?: boolean;
  /** Filter configuration */
  filter?: SearchFilter;
}

/**
 * Processed search results with metadata
 */
export interface SearchResults {
  /** Array of matching search results */
  results: SearchResult[];
  /** Total number of matches before pagination */
  totalCount: number;
  /** Search term used */
  query: string;
  /** Time taken for search processing in milliseconds */
  processingTime: number;
  /** Grouped results by category */
  groupedResults: Map<SearchCategory, SearchResult[]>;
  /** Suggested corrections for typos */
  suggestions?: string[];
}

/**
 * Recent search entry
 */
export interface RecentSearch {
  /** Search query */
  query: string;
  /** Timestamp of search */
  timestamp: number;
  /** Number of results found */
  resultCount: number;
  /** Selected result if any */
  selectedResult?: string;
}

/**
 * Navigation breadcrumb item
 */
export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Navigation path */
  path?: string;
  /** Whether this is the current page */
  current?: boolean;
}

// ========================================
// Translation Key Generation
// ========================================

/**
 * Converts a navigation path to a translation key following Angular pattern
 * Maintains compatibility with existing i18n structure
 * 
 * @param path - Next.js route path (e.g., '/api-connections/database/create')
 * @returns Translation key (e.g., 'apiConnections.database.create')
 */
export function getTranslationKey(path: string): string {
  if (!path || path === '/') {
    return 'home.dashboard';
  }

  // Remove leading slash and split by segments
  const segments = path.replace(/^\//, '').split('/');
  
  // Convert kebab-case to camelCase for each segment
  const camelCaseSegments = segments.map(segment => {
    // Handle dynamic route segments [id], [service], etc.
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const param = segment.slice(1, -1);
      return `${param}Details`;
    }
    
    // Convert kebab-case to camelCase
    return segment.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  });

  return camelCaseSegments.join('.');
}

/**
 * Generates breadcrumb translation keys from a path
 * 
 * @param path - Navigation path
 * @returns Array of translation keys for each breadcrumb level
 */
export function getBreadcrumbTranslationKeys(path: string): string[] {
  if (!path || path === '/') {
    return ['home.dashboard'];
  }

  const segments = path.replace(/^\//, '').split('/');
  const keys: string[] = ['home.dashboard']; // Always include home

  let currentPath = '';
  for (const segment of segments) {
    currentPath += (currentPath ? '.' : '') + segment.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Handle dynamic segments
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const param = segment.slice(1, -1);
      currentPath = currentPath.replace(segment, `${param}Details`);
    }
    
    keys.push(currentPath);
  }

  return keys;
}

/**
 * Generates section-specific translation keys for navigation
 * 
 * @param path - Navigation path
 * @returns Object with translation keys for different UI elements
 */
export function getNavigationTranslationKeys(path: string): {
  title: string;
  description: string;
  breadcrumb: string;
  section: string;
} {
  const baseKey = getTranslationKey(path);
  
  return {
    title: `${baseKey}.title`,
    description: `${baseKey}.description`,
    breadcrumb: `${baseKey}.breadcrumb`,
    section: `${baseKey}.section`
  };
}

// ========================================
// Search Result Processing
// ========================================

/**
 * Searches through provided search results with fuzzy matching and filtering
 * 
 * @param results - Array of search results to search through
 * @param query - Search query string
 * @param options - Search options and filters
 * @returns Processed search results with metadata
 */
export function searchResults(
  results: SearchResult[],
  query: string,
  options: SearchOptions = {}
): SearchResults {
  const startTime = performance.now();
  
  const {
    fuzzy = true,
    limit = 50,
    minLength = 1,
    searchDescriptions = true,
    searchKeywords = true,
    filter = {}
  } = options;

  // Return empty results for short queries
  if (query.length < minLength) {
    return {
      results: [],
      totalCount: 0,
      query,
      processingTime: performance.now() - startTime,
      groupedResults: new Map()
    };
  }

  const normalizedQuery = query.toLowerCase().trim();
  let filteredResults = results;

  // Apply filters
  if (filter.category) {
    filteredResults = filteredResults.filter(result => result.category === filter.category);
  }
  
  if (filter.tags && filter.tags.length > 0) {
    filteredResults = filteredResults.filter(result => 
      result.tags?.some(tag => filter.tags!.includes(tag))
    );
  }
  
  if (filter.requiresAuth !== undefined) {
    filteredResults = filteredResults.filter(result => 
      result.requiresAuth === filter.requiresAuth
    );
  }
  
  if (filter.minPriority !== undefined) {
    filteredResults = filteredResults.filter(result => 
      result.priority >= filter.minPriority!
    );
  }

  // Score and filter results based on query
  const scoredResults = filteredResults
    .map(result => ({
      ...result,
      score: calculateSearchScore(result, normalizedQuery, {
        searchDescriptions,
        searchKeywords,
        fuzzy
      })
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => {
      // Sort by score descending, then by priority descending
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.priority - a.priority;
    });

  // Apply limit
  const limitedResults = scoredResults.slice(0, limit);
  
  // Group results by category
  const groupedResults = groupResultsByCategory(limitedResults);

  const processingTime = performance.now() - startTime;

  return {
    results: limitedResults,
    totalCount: scoredResults.length,
    query,
    processingTime,
    groupedResults,
    suggestions: fuzzy ? generateSuggestions(query, results) : undefined
  };
}

/**
 * Calculates search relevance score for a result
 * 
 * @param result - Search result to score
 * @param query - Normalized search query
 * @param options - Scoring options
 * @returns Relevance score (0 = no match, higher = better match)
 */
function calculateSearchScore(
  result: SearchResult,
  query: string,
  options: {
    searchDescriptions: boolean;
    searchKeywords: boolean;
    fuzzy: boolean;
  }
): number {
  let score = 0;
  const { searchDescriptions, searchKeywords, fuzzy } = options;

  // Exact title match - highest score
  if (result.title.toLowerCase().includes(query)) {
    score += 100;
    
    // Bonus for exact match at start
    if (result.title.toLowerCase().startsWith(query)) {
      score += 50;
    }
  }

  // Path match
  if (result.path.toLowerCase().includes(query)) {
    score += 75;
  }

  // Description match
  if (searchDescriptions && result.description?.toLowerCase().includes(query)) {
    score += 25;
  }

  // Keywords match
  if (searchKeywords && result.keywords.some(keyword => 
    keyword.toLowerCase().includes(query)
  )) {
    score += 40;
  }

  // Tags match
  if (result.tags?.some(tag => tag.toLowerCase().includes(query))) {
    score += 30;
  }

  // Fuzzy matching for typos
  if (fuzzy && score === 0) {
    const fuzzyScore = calculateFuzzyScore(result.title.toLowerCase(), query);
    if (fuzzyScore > 0.7) {
      score += Math.floor(fuzzyScore * 20);
    }
  }

  // Priority boost
  score += result.priority;

  // Recent access boost
  if (result.lastAccessed) {
    const hoursSinceAccess = (Date.now() - result.lastAccessed) / (1000 * 60 * 60);
    if (hoursSinceAccess < 24) {
      score += Math.floor((24 - hoursSinceAccess) / 2);
    }
  }

  return score;
}

/**
 * Simple fuzzy matching algorithm using Levenshtein distance
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score between 0 and 1
 */
function calculateFuzzyScore(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLength);
}

/**
 * Calculates Levenshtein distance between two strings
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Edit distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Groups search results by category
 * 
 * @param results - Search results to group
 * @returns Map of category to results
 */
export function groupResultsByCategory(results: SearchResult[]): Map<SearchCategory, SearchResult[]> {
  const grouped = new Map<SearchCategory, SearchResult[]>();

  for (const result of results) {
    const category = result.category;
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(result);
  }

  return grouped;
}

/**
 * Filters search results by category
 * 
 * @param results - Search results to filter
 * @param categories - Categories to include
 * @returns Filtered results
 */
export function filterResultsByCategory(
  results: SearchResult[],
  categories: SearchCategory[]
): SearchResult[] {
  return results.filter(result => categories.includes(result.category));
}

/**
 * Sorts search results by various criteria
 * 
 * @param results - Results to sort
 * @param sortBy - Sort criteria
 * @param direction - Sort direction
 * @returns Sorted results
 */
export function sortSearchResults(
  results: SearchResult[],
  sortBy: 'relevance' | 'alphabetical' | 'priority' | 'recent',
  direction: 'asc' | 'desc' = 'desc'
): SearchResult[] {
  const sorted = [...results].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'alphabetical':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'priority':
        comparison = a.priority - b.priority;
        break;
      case 'recent':
        comparison = (a.lastAccessed || 0) - (b.lastAccessed || 0);
        break;
      case 'relevance':
      default:
        // Relevance is handled by search scoring
        return 0;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

// ========================================
// Recent Searches and Local Storage
// ========================================

const RECENT_SEARCHES_KEY = 'dreamfactory:recent-searches';
const MAX_RECENT_SEARCHES = 10;

/**
 * Saves a search query to recent searches in localStorage
 * 
 * @param query - Search query to save
 * @param resultCount - Number of results found
 * @param selectedResult - ID of selected result if any
 */
export function saveRecentSearch(
  query: string,
  resultCount: number,
  selectedResult?: string
): void {
  if (!query.trim() || typeof window === 'undefined') {
    return;
  }

  try {
    const recent = getRecentSearches();
    
    // Remove existing entry with same query
    const filtered = recent.filter(search => search.query !== query);
    
    // Add new entry at the beginning
    const newSearch: RecentSearch = {
      query: query.trim(),
      timestamp: Date.now(),
      resultCount,
      selectedResult
    };
    
    filtered.unshift(newSearch);
    
    // Keep only the most recent searches
    const limited = filtered.slice(0, MAX_RECENT_SEARCHES);
    
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(limited));
  } catch (error) {
    console.warn('Failed to save recent search:', error);
  }
}

/**
 * Retrieves recent searches from localStorage
 * 
 * @returns Array of recent searches, most recent first
 */
export function getRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as RecentSearch[];
    
    // Filter out old searches (older than 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return parsed.filter(search => search.timestamp > thirtyDaysAgo);
  } catch (error) {
    console.warn('Failed to load recent searches:', error);
    return [];
  }
}

/**
 * Clears all recent searches from localStorage
 */
export function clearRecentSearches(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.warn('Failed to clear recent searches:', error);
  }
}

/**
 * Converts recent searches to search results for display
 * 
 * @param recentSearches - Array of recent searches
 * @returns Array of search results for recent searches
 */
export function recentSearchesToResults(recentSearches: RecentSearch[]): SearchResult[] {
  return recentSearches.map((search, index) => ({
    id: `recent-${index}`,
    title: search.query,
    description: `${search.resultCount} results found`,
    path: '', // Recent searches don't have paths
    category: 'recent' as SearchCategory,
    keywords: [search.query],
    priority: 10 - index, // More recent = higher priority
    lastAccessed: search.timestamp
  }));
}

// ========================================
// Navigation Utilities
// ========================================

/**
 * Converts a search result path to a Next.js navigation route
 * 
 * @param path - Search result path
 * @param params - Route parameters to inject
 * @returns Next.js compatible route path
 */
export function resultPathToRoute(path: string, params: Record<string, string> = {}): string {
  let route = path;

  // Replace parameter placeholders with actual values
  for (const [key, value] of Object.entries(params)) {
    route = route.replace(`[${key}]`, value);
  }

  return route;
}

/**
 * Generates breadcrumb items from a navigation path
 * 
 * @param path - Current navigation path
 * @param titleMap - Optional mapping of paths to custom titles
 * @returns Array of breadcrumb items
 */
export function generateBreadcrumbs(
  path: string,
  titleMap: Record<string, string> = {}
): BreadcrumbItem[] {
  if (!path || path === '/') {
    return [{ label: 'Dashboard', path: '/', current: true }];
  }

  const segments = path.replace(/^\//, '').split('/');
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', path: '/' }
  ];

  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    
    const isLast = i === segments.length - 1;
    const label = titleMap[currentPath] || formatSegmentLabel(segment);
    
    breadcrumbs.push({
      label,
      path: isLast ? undefined : currentPath,
      current: isLast
    });
  }

  return breadcrumbs;
}

/**
 * Formats a URL segment into a readable label
 * 
 * @param segment - URL segment to format
 * @returns Formatted label
 */
function formatSegmentLabel(segment: string): string {
  // Handle dynamic segments
  if (segment.startsWith('[') && segment.endsWith(']')) {
    const param = segment.slice(1, -1);
    return param.charAt(0).toUpperCase() + param.slice(1);
  }

  // Convert kebab-case to Title Case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ========================================
// Keyboard Navigation Support
// ========================================

/**
 * Handles keyboard navigation for search results
 * 
 * @param event - Keyboard event
 * @param results - Current search results
 * @param selectedIndex - Currently selected result index
 * @param onSelectionChange - Callback for selection changes
 * @param onActivate - Callback for result activation (Enter)
 * @returns New selected index or null if no change
 */
export function handleSearchKeyboardNavigation(
  event: KeyboardEvent,
  results: SearchResult[],
  selectedIndex: number,
  onSelectionChange: (index: number) => void,
  onActivate: (result: SearchResult) => void
): number | null {
  if (results.length === 0) {
    return null;
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      const nextIndex = selectedIndex < results.length - 1 ? selectedIndex + 1 : 0;
      onSelectionChange(nextIndex);
      return nextIndex;

    case 'ArrowUp':
      event.preventDefault();
      const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : results.length - 1;
      onSelectionChange(prevIndex);
      return prevIndex;

    case 'Enter':
      event.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        onActivate(results[selectedIndex]);
      }
      return selectedIndex;

    case 'Escape':
      event.preventDefault();
      onSelectionChange(-1);
      return -1;

    case 'Home':
      event.preventDefault();
      onSelectionChange(0);
      return 0;

    case 'End':
      event.preventDefault();
      const lastIndex = results.length - 1;
      onSelectionChange(lastIndex);
      return lastIndex;

    default:
      return null;
  }
}

/**
 * Gets ARIA attributes for search result items
 * 
 * @param index - Result index
 * @param isSelected - Whether the result is currently selected
 * @param totalResults - Total number of results
 * @returns ARIA attributes object
 */
export function getSearchResultAriaAttributes(
  index: number,
  isSelected: boolean,
  totalResults: number
): Record<string, string | number | boolean> {
  return {
    role: 'option',
    'aria-selected': isSelected,
    'aria-posinset': index + 1,
    'aria-setsize': totalResults,
    tabIndex: isSelected ? 0 : -1,
    id: `search-result-${index}`
  };
}

// ========================================
// Search Suggestions
// ========================================

/**
 * Generates search suggestions based on available results
 * 
 * @param query - Current search query
 * @param allResults - All available search results
 * @returns Array of suggested search terms
 */
function generateSuggestions(query: string, allResults: SearchResult[]): string[] {
  if (query.length < 2) {
    return [];
  }

  const suggestions = new Set<string>();
  const normalizedQuery = query.toLowerCase();

  // Extract words from titles and keywords
  const words = new Set<string>();
  
  for (const result of allResults) {
    // Add title words
    result.title.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) words.add(word);
    });
    
    // Add keywords
    result.keywords.forEach(keyword => {
      keyword.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) words.add(word);
      });
    });
  }

  // Find words that are similar to the query
  for (const word of words) {
    if (word.includes(normalizedQuery) && word !== normalizedQuery) {
      suggestions.add(word);
    } else if (calculateFuzzyScore(word, normalizedQuery) > 0.6) {
      suggestions.add(word);
    }
  }

  return Array.from(suggestions).slice(0, 5);
}

/**
 * Gets search placeholder text based on context
 * 
 * @param context - Current page context
 * @returns Appropriate placeholder text
 */
export function getSearchPlaceholder(context?: string): string {
  const placeholders: Record<string, string> = {
    'database-services': 'Search database services...',
    'schema-management': 'Search tables and fields...',
    'api-generation': 'Search API endpoints...',
    'user-management': 'Search users and roles...',
    'system-settings': 'Search system settings...',
    'security': 'Search security settings...',
    'documentation': 'Search documentation...'
  };

  return placeholders[context || ''] || 'Search DreamFactory Admin...';
}