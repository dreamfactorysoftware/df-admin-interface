/**
 * Search Module Barrel Exports
 * 
 * Provides clean import paths for all search-related components, hooks, utilities, and types.
 * Organized for optimal tree-shaking and developer experience with comprehensive TypeScript support.
 * 
 * @example Basic component usage
 * ```tsx
 * import { SearchDialog, SearchInput, SearchResults } from '@/components/layout/search';
 * ```
 * 
 * @example Individual imports for optimal bundle size
 * ```tsx
 * import { SearchDialog } from '@/components/layout/search';
 * import { useSearchDialog } from '@/components/layout/search';
 * import { searchResults, getTranslationKey } from '@/components/layout/search';
 * ```
 * 
 * @example Type-only imports
 * ```tsx
 * import type { SearchResult, SearchDialogProps, SearchOptions } from '@/components/layout/search';
 * ```
 */

// ========================================
// Component Exports
// ========================================

/**
 * Main search dialog component with React Query integration and accessibility features.
 * Provides modal search interface with keyboard navigation and recent searches.
 */
export { SearchDialog, default as SearchDialogDefault } from './search-dialog';

/**
 * Search input component with React Hook Form integration and debounced input handling.
 * Features responsive design, loading states, and accessibility compliance.
 */
export { SearchInput, default as SearchInputDefault } from './search-input';

/**
 * Search results display component with keyboard navigation and result grouping.
 * Supports various result types with icons, metadata, and accessibility features.
 */
export { SearchResults } from './search-results';

// ========================================
// React Hooks
// ========================================

/**
 * Hook for integrating SearchDialog with global app state.
 * Provides convenient access to search dialog state management.
 */
export { useSearchDialog } from './search-dialog';

// ========================================
// Utility Functions
// ========================================

/**
 * Translation and internationalization utilities for converting paths to i18n keys.
 * Maintains compatibility with existing Angular i18n structure.
 */
export {
  getTranslationKey,
  getBreadcrumbTranslationKeys,
  getNavigationTranslationKeys,
} from './search-utils';

/**
 * Core search functionality including fuzzy matching, result scoring, and filtering.
 * Provides comprehensive search capabilities with performance optimization.
 */
export {
  searchResults,
  groupResultsByCategory,
  filterResultsByCategory,
  sortSearchResults,
} from './search-utils';

/**
 * Recent searches persistence and management utilities.
 * Handles localStorage operations with error handling and data validation.
 */
export {
  saveRecentSearch,
  getRecentSearches,
  clearRecentSearches,
  recentSearchesToResults,
} from './search-utils';

/**
 * Navigation and routing utilities for search result handling.
 * Provides breadcrumb generation and path manipulation functions.
 */
export {
  resultPathToRoute,
  generateBreadcrumbs,
} from './search-utils';

/**
 * Keyboard navigation and accessibility support utilities.
 * Handles keyboard events and ARIA attribute generation for search interfaces.
 */
export {
  handleSearchKeyboardNavigation,
  getSearchResultAriaAttributes,
  getSearchPlaceholder,
} from './search-utils';

/**
 * Search result processing utilities from SearchResults component.
 * Provides result grouping and icon selection functionality.
 */
export {
  groupResults,
  getResultIcon,
} from './search-results';

// ========================================
// TypeScript Type Exports
// ========================================

/**
 * Component prop interfaces for search components.
 * Provides type safety for component usage and customization.
 */
export type {
  SearchDialogProps,
  SearchInputProps,
  SearchResultsProps,
} from './search-dialog';

export type {
  SearchFormData,
  SearchState,
} from './search-input';

export type {
  SearchResultGroup,
} from './search-results';

/**
 * Core search data types and interfaces.
 * Defines the structure of search results, filters, and configuration options.
 */
export type {
  SearchResult,
  SearchCategory,
  SearchFilter,
  SearchOptions,
  SearchResults as SearchResultsData,
  RecentSearch,
  BreadcrumbItem,
} from './search-utils';

// ========================================
// Re-exports for Convenience
// ========================================

/**
 * Default export providing the main SearchDialog component for common usage patterns.
 * Allows for `import SearchDialog from '@/components/layout/search'` syntax.
 */
export { SearchDialog as default } from './search-dialog';

// ========================================
// Module Documentation
// ========================================

/**
 * Search Module Overview
 * 
 * This module provides a comprehensive search system for the DreamFactory Admin Interface,
 * featuring:
 * 
 * **Core Components:**
 * - `SearchDialog`: Modal search interface with global keyboard shortcuts
 * - `SearchInput`: Form input with debouncing and validation
 * - `SearchResults`: Results display with keyboard navigation and grouping
 * 
 * **Key Features:**
 * - React Query integration for intelligent caching and real-time updates
 * - Accessibility compliance with WCAG 2.1 AA standards
 * - Responsive design with mobile-optimized touch targets
 * - Keyboard navigation with arrow keys, Enter, and Escape
 * - Recent searches with localStorage persistence
 * - Fuzzy search matching with typo tolerance
 * - Result categorization and priority-based sorting
 * - Dark theme support with Tailwind CSS
 * - TypeScript support with comprehensive type definitions
 * 
 * **Performance Optimizations:**
 * - Debounced input handling (2000ms delay)
 * - Virtual scrolling for large result sets
 * - Intelligent result caching with React Query
 * - Tree-shaking optimized exports
 * - Lazy loading support for large datasets
 * 
 * **Accessibility Features:**
 * - Screen reader announcements for search status
 * - Keyboard-only navigation support
 * - Proper ARIA labels and roles
 * - Focus management with dialog open/close
 * - High contrast ratio support
 * 
 * **Integration:**
 * - Next.js App Router compatibility
 * - React Hook Form integration
 * - Zustand state management support
 * - Headless UI dialog components
 * - Tailwind CSS styling system
 * 
 * @version 1.0.0
 * @since Next.js 15.1 migration
 */

/**
 * Usage Examples
 * 
 * @example Basic search dialog integration
 * ```tsx
 * import { SearchDialog, useSearchDialog } from '@/components/layout/search';
 * 
 * function App() {
 *   const { isOpen, openSearch, closeSearch } = useSearchDialog();
 *   
 *   return (
 *     <>
 *       <button onClick={() => openSearch()}>Search</button>
 *       <SearchDialog open={isOpen} onClose={closeSearch} />
 *     </>
 *   );
 * }
 * ```
 * 
 * @example Custom search input in a form
 * ```tsx
 * import { SearchInput, type SearchFormData } from '@/components/layout/search';
 * import { useForm } from 'react-hook-form';
 * 
 * function SearchForm() {
 *   const { control } = useForm<SearchFormData>();
 *   
 *   return (
 *     <SearchInput
 *       control={control}
 *       placeholder="Search services..."
 *       onSearchExecute={(query) => console.log('Searching:', query)}
 *     />
 *   );
 * }
 * ```
 * 
 * @example Manual search with utilities
 * ```tsx
 * import { searchResults, type SearchResult } from '@/components/layout/search';
 * 
 * const results: SearchResult[] = [
 *   {
 *     id: '1',
 *     title: 'MySQL Database',
 *     path: '/api-connections/database/mysql',
 *     category: 'database-services',
 *     keywords: ['mysql', 'database', 'sql'],
 *     priority: 10,
 *   },
 * ];
 * 
 * const searchData = searchResults(results, 'mysql', {
 *   fuzzy: true,
 *   limit: 10,
 *   searchDescriptions: true,
 * });
 * 
 * console.log(`Found ${searchData.results.length} results`);
 * ```
 * 
 * @example Translation key generation
 * ```tsx
 * import { getTranslationKey, getBreadcrumbTranslationKeys } from '@/components/layout/search';
 * 
 * const titleKey = getTranslationKey('/api-connections/database/create');
 * // Returns: 'apiConnections.database.create'
 * 
 * const breadcrumbKeys = getBreadcrumbTranslationKeys('/api-connections/database/mysql');
 * // Returns: ['home.dashboard', 'apiConnections', 'apiConnections.database', 'apiConnections.database.mysql']
 * ```
 * 
 * @example Recent searches management
 * ```tsx
 * import { 
 *   saveRecentSearch, 
 *   getRecentSearches, 
 *   clearRecentSearches 
 * } from '@/components/layout/search';
 * 
 * // Save a search
 * saveRecentSearch('mysql database', 5, 'result-123');
 * 
 * // Get recent searches
 * const recent = getRecentSearches();
 * 
 * // Clear all recent searches
 * clearRecentSearches();
 * ```
 */