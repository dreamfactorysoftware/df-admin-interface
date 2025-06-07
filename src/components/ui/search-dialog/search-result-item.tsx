'use client';

import React, { forwardRef, KeyboardEvent, MouseEvent } from 'react';
import { 
  Database, 
  Table, 
  User, 
  Settings, 
  FileText, 
  Users, 
  Shield, 
  Code, 
  Folder, 
  Book, 
  Server,
  Hash,
  ChevronRight 
} from 'lucide-react';
import { SearchResult, SearchResultType } from './types';
import { cn } from '@/lib/utils';

/**
 * Props interface for the SearchResultItem component
 * Supports comprehensive keyboard navigation and accessibility features
 */
interface SearchResultItemProps {
  /** Search result data containing all display information */
  result: SearchResult;
  /** Whether this result is currently selected/focused */
  isSelected?: boolean;
  /** Callback when result is clicked or selected */
  onSelect?: (result: SearchResult) => void;
  /** Callback for keyboard navigation events */
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>, result: SearchResult) => void;
  /** Whether to use compact mode for mobile displays */
  compact?: boolean;
  /** Additional CSS classes for custom styling */
  className?: string;
  /** Whether to highlight search terms in title/description */
  highlightTerms?: boolean;
  /** Current search query for highlighting */
  searchQuery?: string;
  /** Whether to show metadata badges */
  showMetadata?: boolean;
  /** Accessibility label override */
  ariaLabel?: string;
  /** Whether to show result type icon */
  showIcon?: boolean;
  /** Whether to show chevron indicator */
  showChevron?: boolean;
}

/**
 * Icon mapping for different search result types
 * Uses Lucide React icons for consistent visual design
 */
const RESULT_TYPE_ICONS: Record<SearchResultType, React.ComponentType<{ className?: string }>> = {
  [SearchResultType.DATABASE]: Database,
  [SearchResultType.TABLE]: Table,
  [SearchResultType.FIELD]: Hash,
  [SearchResultType.USER]: User,
  [SearchResultType.ADMIN]: Users,
  [SearchResultType.ROLE]: Shield,
  [SearchResultType.SERVICE]: Server,
  [SearchResultType.SETTING]: Settings,
  [SearchResultType.SCRIPT]: Code,
  [SearchResultType.FILE]: FileText,
  [SearchResultType.APP]: Folder,
  [SearchResultType.DOCUMENTATION]: Book,
};

/**
 * Color mapping for different result types
 * WCAG 2.1 AA compliant colors for proper contrast
 */
const RESULT_TYPE_COLORS: Record<SearchResultType, string> = {
  [SearchResultType.DATABASE]: 'text-blue-600 dark:text-blue-400',
  [SearchResultType.TABLE]: 'text-green-600 dark:text-green-400',
  [SearchResultType.FIELD]: 'text-purple-600 dark:text-purple-400',
  [SearchResultType.USER]: 'text-orange-600 dark:text-orange-400',
  [SearchResultType.ADMIN]: 'text-red-600 dark:text-red-400',
  [SearchResultType.ROLE]: 'text-indigo-600 dark:text-indigo-400',
  [SearchResultType.SERVICE]: 'text-teal-600 dark:text-teal-400',
  [SearchResultType.SETTING]: 'text-gray-600 dark:text-gray-400',
  [SearchResultType.SCRIPT]: 'text-pink-600 dark:text-pink-400',
  [SearchResultType.FILE]: 'text-yellow-600 dark:text-yellow-400',
  [SearchResultType.APP]: 'text-cyan-600 dark:text-cyan-400',
  [SearchResultType.DOCUMENTATION]: 'text-slate-600 dark:text-slate-400',
};

/**
 * Badge background colors for result types
 * WCAG 2.1 AA compliant background colors
 */
const RESULT_TYPE_BADGE_COLORS: Record<SearchResultType, string> = {
  [SearchResultType.DATABASE]: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  [SearchResultType.TABLE]: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  [SearchResultType.FIELD]: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  [SearchResultType.USER]: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  [SearchResultType.ADMIN]: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  [SearchResultType.ROLE]: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
  [SearchResultType.SERVICE]: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800',
  [SearchResultType.SETTING]: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
  [SearchResultType.SCRIPT]: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
  [SearchResultType.FILE]: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
  [SearchResultType.APP]: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
  [SearchResultType.DOCUMENTATION]: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800',
};

/**
 * Utility function to highlight search terms in text
 * Creates accessible highlighted text for screen readers
 */
const highlightSearchTerm = (text: string, searchQuery: string): React.ReactNode => {
  if (!searchQuery || !text) return text;

  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <mark 
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 text-gray-900 dark:text-gray-100 px-0.5 rounded"
          aria-label={`Highlighted: ${part}`}
        >
          {part}
        </mark>
      );
    }
    return part;
  });
};

/**
 * SearchResultItem Component
 * 
 * Displays individual search results with comprehensive accessibility features,
 * keyboard navigation support, and responsive design. Implements WCAG 2.1 AA
 * compliance with proper focus indicators and ARIA labeling.
 * 
 * Features:
 * - Keyboard navigation with arrow keys and enter selection
 * - WCAG 2.1 AA compliant focus indicators with 2px outline
 * - Support for multiple result types with appropriate icons
 * - Visual hierarchy with title, description, and category badges
 * - Hover and focus states with smooth transitions
 * - Compact mode for mobile displays
 * - Proper ARIA labeling for screen reader accessibility
 */
export const SearchResultItem = forwardRef<HTMLDivElement, SearchResultItemProps>(({
  result,
  isSelected = false,
  onSelect,
  onKeyDown,
  compact = false,
  className,
  highlightTerms = true,
  searchQuery = '',
  showMetadata = true,
  ariaLabel,
  showIcon = true,
  showChevron = true,
}, ref) => {
  // Get the appropriate icon component for the result type
  const IconComponent = RESULT_TYPE_ICONS[result.type];
  const iconColorClass = RESULT_TYPE_COLORS[result.type];
  const badgeColorClass = RESULT_TYPE_BADGE_COLORS[result.type];

  /**
   * Handle click events for result selection
   */
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect?.(result);
  };

  /**
   * Handle keyboard events for accessibility navigation
   * Supports Enter and Space for selection
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Let parent handle arrow navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      onKeyDown?.(event, result);
      return;
    }

    // Handle selection keys
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      onSelect?.(result);
    } else {
      onKeyDown?.(event, result);
    }
  };

  /**
   * Generate accessible label for screen readers
   */
  const getAccessibleLabel = (): string => {
    if (ariaLabel) return ariaLabel;

    const baseLabel = `${result.title}, ${result.type}`;
    const descriptionLabel = result.description ? `, ${result.description}` : '';
    const categoryLabel = result.category ? `, in ${result.category}` : '';
    const parentLabel = result.metadata?.parent ? `, under ${result.metadata.parent}` : '';
    
    return `${baseLabel}${descriptionLabel}${categoryLabel}${parentLabel}`;
  };

  /**
   * Format result type for display
   */
  const formatResultType = (type: SearchResultType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      aria-label={getAccessibleLabel()}
      tabIndex={isSelected ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        // Base styles with WCAG 2.1 AA compliant focus indicators
        'flex items-center w-full cursor-pointer transition-all duration-200 ease-in-out',
        'border border-transparent rounded-lg',
        
        // Responsive padding based on compact mode
        compact ? 'px-3 py-2 gap-2' : 'px-4 py-3 gap-3',
        
        // Hover states with smooth transitions
        'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        'hover:border-gray-200 dark:hover:border-gray-700',
        
        // Selected/focused states with WCAG 2.1 AA compliant indicators
        isSelected && [
          'bg-primary-50 dark:bg-primary-900/20',
          'border-primary-200 dark:border-primary-700',
          'shadow-sm',
        ],
        
        // Focus-visible styles for keyboard navigation (2px outline with proper contrast)
        'focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
        'focus-visible:border-primary-300 dark:focus-visible:border-primary-600',
        
        // Active states
        'active:bg-primary-100 dark:active:bg-primary-900/30',
        
        className
      )}
      data-testid={`search-result-${result.id}`}
    >
      {/* Result type icon with proper sizing */}
      {showIcon && IconComponent && (
        <div className={cn(
          'flex-shrink-0 flex items-center justify-center',
          compact ? 'w-5 h-5' : 'w-6 h-6'
        )}>
          <IconComponent 
            className={cn(
              compact ? 'w-4 h-4' : 'w-5 h-5',
              iconColorClass
            )}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Main content area with proper text hierarchy */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Title with optional highlighting */}
        <div className={cn(
          'font-medium text-gray-900 dark:text-gray-100 truncate',
          compact ? 'text-sm' : 'text-base'
        )}>
          {highlightTerms && searchQuery
            ? highlightSearchTerm(result.highlights?.title || result.title, searchQuery)
            : result.title
          }
        </div>

        {/* Description and metadata row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Description with proper truncation */}
          {result.description && (
            <span className={cn(
              'text-gray-600 dark:text-gray-400 truncate flex-1',
              compact ? 'text-xs' : 'text-sm'
            )}>
              {highlightTerms && searchQuery
                ? highlightSearchTerm(result.highlights?.description || result.description, searchQuery)
                : result.description
              }
            </span>
          )}

          {/* Metadata badges */}
          {showMetadata && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Result type badge */}
              <span 
                className={cn(
                  'inline-flex items-center rounded-full border text-xs font-medium',
                  compact ? 'px-1.5 py-0.5' : 'px-2 py-1',
                  badgeColorClass
                )}
                aria-label={`Type: ${formatResultType(result.type)}`}
              >
                {formatResultType(result.type)}
              </span>

              {/* Parent context badge */}
              {result.metadata?.parent && (
                <span 
                  className={cn(
                    'inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 text-xs font-medium',
                    compact ? 'px-1.5 py-0.5' : 'px-2 py-1'
                  )}
                  aria-label={`Parent: ${result.metadata.parent}`}
                >
                  {result.metadata.parent}
                </span>
              )}

              {/* Usage count indicator */}
              {result.metadata?.usageCount && result.metadata.usageCount > 0 && (
                <span 
                  className={cn(
                    'inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-medium',
                    compact ? 'px-1.5 py-0.5' : 'px-2 py-1'
                  )}
                  aria-label={`Used ${result.metadata.usageCount} times`}
                >
                  {result.metadata.usageCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chevron indicator for navigation */}
      {showChevron && (
        <div className="flex-shrink-0 flex items-center">
          <ChevronRight 
            className={cn(
              'text-gray-400 dark:text-gray-500 transition-transform duration-200',
              compact ? 'w-3 h-3' : 'w-4 h-4',
              isSelected && 'transform translate-x-0.5'
            )}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
});

SearchResultItem.displayName = 'SearchResultItem';

export default SearchResultItem;