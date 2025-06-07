/**
 * @fileoverview Table styling variants using class-variance-authority (CVA) and Tailwind CSS
 * 
 * This module provides WCAG 2.1 AA compliant table styling variants for the DreamFactory
 * Admin Interface, ensuring consistent design system implementation across all table
 * components with proper accessibility support.
 * 
 * Key Features:
 * - WCAG 2.1 AA color compliance with minimum 4.5:1 contrast ratios
 * - Class-variance-authority integration for maintainable variant definitions
 * - Design token implementation with semantic color scales
 * - Focus ring system with 2px outline and proper offset for keyboard navigation
 * - Responsive design patterns with Tailwind CSS breakpoint utilities
 * 
 * @author DreamFactory Admin Interface Team
 * @version 1.0.0
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Table container variants with WCAG 2.1 AA compliant styling
 * 
 * Provides consistent table wrapper styling with proper accessibility support,
 * responsive behavior, and theme-aware color implementation.
 */
export const tableContainerVariants = cva(
  [
    // Base styles - applied to all table containers
    'relative',
    'w-full',
    'overflow-hidden',
    'rounded-lg',
    'border',
    'border-gray-200',
    'dark:border-gray-700',
    'bg-white',
    'dark:bg-gray-900',
    'shadow-sm',
    'transition-all',
    'duration-200',
    // Focus management for keyboard navigation
    'focus-within:ring-2',
    'focus-within:ring-primary-600',
    'focus-within:ring-offset-2',
    'focus-within:ring-offset-white',
    'dark:focus-within:ring-offset-gray-900',
  ],
  {
    variants: {
      /**
       * Size variants for different table layouts
       * Compact: Reduced padding for dense data display
       * Default: Standard spacing for balanced readability
       * Comfortable: Increased padding for enhanced readability
       */
      size: {
        compact: [
          'text-sm',
          'leading-tight',
        ],
        default: [
          'text-sm',
          'leading-normal',
        ],
        comfortable: [
          'text-base',
          'leading-relaxed',
        ],
      },
      
      /**
       * Theme variants with WCAG 2.1 AA compliant colors
       * Ensures proper contrast ratios across light and dark themes
       */
      theme: {
        light: [
          'bg-white',
          'border-gray-200',
          'text-gray-900',
          'shadow-gray-900/5',
        ],
        dark: [
          'bg-gray-900',
          'border-gray-700', 
          'text-gray-100',
          'shadow-gray-900/20',
        ],
        auto: [
          'bg-white',
          'dark:bg-gray-900',
          'border-gray-200',
          'dark:border-gray-700',
          'text-gray-900',
          'dark:text-gray-100',
          'shadow-gray-900/5',
          'dark:shadow-gray-900/20',
        ],
      },
      
      /**
       * Density variants for different data visualization needs
       * Affects overall table spacing and visual hierarchy
       */
      density: {
        sparse: [
          'space-y-4',
        ],
        normal: [
          'space-y-2',
        ],
        dense: [
          'space-y-1',
        ],
      },
      
      /**
       * Interactive state variants
       * Provides visual feedback for user interactions
       */
      interactive: {
        none: [],
        hoverable: [
          'hover:shadow-md',
          'hover:border-gray-300',
          'dark:hover:border-gray-600',
        ],
        selectable: [
          'cursor-pointer',
          'hover:shadow-lg',
          'hover:border-primary-300',
          'dark:hover:border-primary-600',
          'hover:bg-primary-50',
          'dark:hover:bg-primary-900/10',
        ],
      },
    },
    defaultVariants: {
      size: 'default',
      theme: 'auto',
      density: 'normal',
      interactive: 'hoverable',
    },
  }
);

/**
 * Table element variants with accessibility-focused styling
 * 
 * Core table element styling with WCAG compliant color schemes,
 * proper spacing, and responsive behavior patterns.
 */
export const tableVariants = cva(
  [
    // Base table styles
    'w-full',
    'table-auto',
    'border-collapse',
    'text-left',
    'transition-colors',
    'duration-200',
  ],
  {
    variants: {
      /**
       * Size variants affecting cell padding and typography
       */
      size: {
        compact: [
          'text-xs',
          '[&_th]:px-2',
          '[&_th]:py-1.5',
          '[&_td]:px-2', 
          '[&_td]:py-1.5',
        ],
        default: [
          'text-sm',
          '[&_th]:px-4',
          '[&_th]:py-3',
          '[&_td]:px-4',
          '[&_td]:py-3',
        ],
        comfortable: [
          'text-base',
          '[&_th]:px-6',
          '[&_th]:py-4',
          '[&_td]:px-6',
          '[&_td]:py-4',
        ],
      },
      
      /**
       * Border variants for visual separation
       * All options maintain WCAG 3:1 contrast for UI components
       */
      bordered: {
        none: [],
        horizontal: [
          '[&_tr]:border-b',
          '[&_tr]:border-gray-200',
          'dark:[&_tr]:border-gray-700',
        ],
        vertical: [
          '[&_th]:border-r',
          '[&_th]:border-gray-200',
          'dark:[&_th]:border-gray-700',
          '[&_td]:border-r',
          '[&_td]:border-gray-200', 
          'dark:[&_td]:border-gray-700',
          '[&_th:last-child]:border-r-0',
          '[&_td:last-child]:border-r-0',
        ],
        full: [
          '[&_tr]:border-b',
          '[&_tr]:border-gray-200',
          'dark:[&_tr]:border-gray-700',
          '[&_th]:border-r',
          '[&_th]:border-gray-200',
          'dark:[&_th]:border-gray-700',
          '[&_td]:border-r',
          '[&_td]:border-gray-200',
          'dark:[&_td]:border-gray-700',
          '[&_th:last-child]:border-r-0',
          '[&_td:last-child]:border-r-0',
        ],
      },
      
      /**
       * Striped variants for improved readability
       * Maintains 4.5:1 contrast ratio for text readability
       */
      striped: {
        none: [],
        odd: [
          '[&_tr:nth-child(odd)]:bg-gray-50',
          'dark:[&_tr:nth-child(odd)]:bg-gray-800/50',
        ],
        even: [
          '[&_tr:nth-child(even)]:bg-gray-50',
          'dark:[&_tr:nth-child(even)]:bg-gray-800/50', 
        ],
      },
    },
    defaultVariants: {
      size: 'default',
      bordered: 'horizontal',
      striped: 'none',
    },
  }
);

/**
 * Table header variants with enhanced accessibility
 * 
 * Ensures proper semantic hierarchy and WCAG compliant styling
 * for table headers with sorting and filtering capabilities.
 */
export const tableHeaderVariants = cva(
  [
    // Base header styles
    'bg-gray-50',
    'dark:bg-gray-800',
    'text-gray-900',
    'dark:text-gray-100',
    'font-semibold',
    'text-left',
    'border-b-2',
    'border-gray-200',
    'dark:border-gray-600',
    'transition-colors',
    'duration-200',
  ],
  {
    variants: {
      /**
       * Sortable header variants with keyboard navigation support
       */
      sortable: {
        false: [],
        true: [
          'cursor-pointer',
          'hover:bg-gray-100',
          'dark:hover:bg-gray-700',
          'focus-visible:outline-none',
          'focus-visible:ring-2',
          'focus-visible:ring-primary-600',
          'focus-visible:ring-offset-2',
          'focus-visible:ring-offset-gray-50',
          'dark:focus-visible:ring-offset-gray-800',
          'select-none',
          // WCAG compliant touch target size
          'min-h-[44px]',
          'flex',
          'items-center',
          'justify-between',
        ],
      },
      
      /**
       * Sort direction indicators
       */
      sortDirection: {
        none: [],
        asc: [
          'after:content-["↑"]',
          'after:ml-2',
          'after:text-primary-600',
          'dark:after:text-primary-400',
        ],
        desc: [
          'after:content-["↓"]',
          'after:ml-2', 
          'after:text-primary-600',
          'dark:after:text-primary-400',
        ],
      },
      
      /**
       * Header alignment variants
       */
      align: {
        left: ['text-left', 'justify-start'],
        center: ['text-center', 'justify-center'],
        right: ['text-right', 'justify-end'],
      },
    },
    defaultVariants: {
      sortable: false,
      sortDirection: 'none',
      align: 'left',
    },
  }
);

/**
 * Table cell variants with state management
 * 
 * Provides comprehensive cell styling with proper focus management,
 * selection states, and semantic color application.
 */
export const tableCellVariants = cva(
  [
    // Base cell styles
    'text-gray-900',
    'dark:text-gray-100',
    'transition-all',
    'duration-200',
    'border-b',
    'border-gray-200',
    'dark:border-gray-700',
  ],
  {
    variants: {
      /**
       * Cell state variants with WCAG compliant colors
       */
      state: {
        default: [],
        selected: [
          'bg-primary-50',
          'dark:bg-primary-900/20',
          'border-primary-200',
          'dark:border-primary-700',
          'text-primary-900',
          'dark:text-primary-100',
        ],
        error: [
          'bg-error-50',
          'dark:bg-error-900/20', 
          'border-error-200',
          'dark:border-error-700',
          'text-error-900',
          'dark:text-error-100',
        ],
        warning: [
          'bg-warning-50',
          'dark:bg-warning-900/20',
          'border-warning-200', 
          'dark:border-warning-700',
          'text-warning-900',
          'dark:text-warning-100',
        ],
        success: [
          'bg-success-50',
          'dark:bg-success-900/20',
          'border-success-200',
          'dark:border-success-700', 
          'text-success-900',
          'dark:text-success-100',
        ],
      },
      
      /**
       * Interactive cell variants
       */
      interactive: {
        none: [],
        clickable: [
          'cursor-pointer',
          'hover:bg-gray-50',
          'dark:hover:bg-gray-800/50',
          'focus-visible:outline-none',
          'focus-visible:ring-2',
          'focus-visible:ring-primary-600',
          'focus-visible:ring-offset-2',
          'focus-visible:ring-offset-white',
          'dark:focus-visible:ring-offset-gray-900',
        ],
        editable: [
          'cursor-text',
          'hover:bg-blue-50',
          'dark:hover:bg-blue-900/20',
          'focus-within:bg-blue-50',
          'dark:focus-within:bg-blue-900/20',
          'focus-within:ring-2',
          'focus-within:ring-blue-600',
          'focus-within:ring-offset-2',
          'focus-within:ring-offset-white',
          'dark:focus-within:ring-offset-gray-900',
        ],
      },
      
      /**
       * Cell content alignment
       */
      align: {
        left: ['text-left'],
        center: ['text-center'],
        right: ['text-right'],
      },
      
      /**
       * Cell content type variants for semantic styling
       */
      contentType: {
        text: [],
        number: [
          'font-mono',
          'tabular-nums',
        ],
        status: [
          'font-medium',
        ],
        action: [
          'text-center',
        ],
      },
    },
    defaultVariants: {
      state: 'default',
      interactive: 'none',
      align: 'left',
      contentType: 'text',
    },
  }
);

/**
 * Status badge variants for table cells
 * 
 * WCAG 2.1 AA compliant status indicators with proper color semantics
 * and accessibility features for screen readers.
 */
export const statusBadgeVariants = cva(
  [
    // Base badge styles
    'inline-flex',
    'items-center',
    'rounded-full',
    'px-2.5',
    'py-0.5',
    'text-xs',
    'font-medium',
    'ring-1',
    'ring-inset',
    'transition-colors',
    'duration-200',
    // WCAG touch target compliance
    'min-h-[24px]',
  ],
  {
    variants: {
      /**
       * Status variant colors - all WCAG 2.1 AA compliant
       * Color values adjusted to meet 4.5:1 contrast requirements
       */
      status: {
        success: [
          'text-green-800',
          'bg-green-50',
          'ring-green-600/20',
          'dark:text-green-400',
          'dark:bg-green-900/20',
          'dark:ring-green-400/30',
        ],
        warning: [
          'text-yellow-800',
          'bg-yellow-50', 
          'ring-yellow-600/20',
          'dark:text-yellow-400',
          'dark:bg-yellow-900/20',
          'dark:ring-yellow-400/30',
        ],
        error: [
          'text-red-800',
          'bg-red-50',
          'ring-red-600/20',
          'dark:text-red-400',
          'dark:bg-red-900/20',
          'dark:ring-red-400/30',
        ],
        info: [
          'text-blue-800',
          'bg-blue-50',
          'ring-blue-600/20',
          'dark:text-blue-400',
          'dark:bg-blue-900/20',
          'dark:ring-blue-400/30',
        ],
        neutral: [
          'text-gray-800',
          'bg-gray-50',
          'ring-gray-600/20',
          'dark:text-gray-400',
          'dark:bg-gray-900/20',
          'dark:ring-gray-400/30',
        ],
        primary: [
          'text-primary-800',
          'bg-primary-50',
          'ring-primary-600/20',
          'dark:text-primary-400',
          'dark:bg-primary-900/20',
          'dark:ring-primary-400/30',
        ],
      },
      
      /**
       * Badge size variants
       */
      size: {
        sm: [
          'px-2',
          'py-1',
          'text-xs',
          'min-h-[20px]',
        ],
        default: [
          'px-2.5',
          'py-0.5',
          'text-xs',
          'min-h-[24px]',
        ],
        lg: [
          'px-3',
          'py-1',
          'text-sm',
          'min-h-[28px]',
        ],
      },
    },
    defaultVariants: {
      status: 'neutral',
      size: 'default',
    },
  }
);

/**
 * Action button variants for table cells
 * 
 * Accessible button styling with proper focus management and
 * WCAG compliant interactive states.
 */
export const tableActionVariants = cva(
  [
    // Base action button styles
    'inline-flex',
    'items-center',
    'justify-center',
    'rounded-md',
    'text-sm',
    'font-medium',
    'transition-all',
    'duration-200',
    'border',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:pointer-events-none',
    // WCAG touch target compliance
    'min-h-[44px]',
    'min-w-[44px]',
  ],
  {
    variants: {
      /**
       * Action button variants with semantic colors
       */
      variant: {
        primary: [
          'bg-primary-600',
          'text-white',
          'border-primary-600',
          'hover:bg-primary-700',
          'hover:border-primary-700',
          'focus-visible:ring-primary-600',
          'focus-visible:ring-offset-white',
          'dark:focus-visible:ring-offset-gray-900',
        ],
        secondary: [
          'bg-white',
          'text-gray-700',
          'border-gray-300',
          'hover:bg-gray-50',
          'hover:border-gray-400',
          'focus-visible:ring-gray-600',
          'focus-visible:ring-offset-white',
          'dark:bg-gray-800',
          'dark:text-gray-300',
          'dark:border-gray-600',
          'dark:hover:bg-gray-700',
          'dark:hover:border-gray-500',
          'dark:focus-visible:ring-offset-gray-900',
        ],
        danger: [
          'bg-red-600',
          'text-white',
          'border-red-600',
          'hover:bg-red-700',
          'hover:border-red-700',
          'focus-visible:ring-red-600',
          'focus-visible:ring-offset-white',
          'dark:focus-visible:ring-offset-gray-900',
        ],
        ghost: [
          'bg-transparent',
          'text-gray-600',
          'border-transparent',
          'hover:bg-gray-100',
          'hover:text-gray-700',
          'focus-visible:ring-gray-600',
          'focus-visible:ring-offset-white',
          'dark:text-gray-400',
          'dark:hover:bg-gray-800',
          'dark:hover:text-gray-300',
          'dark:focus-visible:ring-offset-gray-900',
        ],
      },
      
      /**
       * Action button sizes
       */
      size: {
        sm: [
          'h-8',
          'w-8',
          'text-xs',
        ],
        default: [
          'h-10',
          'w-10',
          'text-sm',
        ],
        lg: [
          'h-12', 
          'w-12',
          'text-base',
        ],
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'default',
    },
  }
);

/**
 * Type definitions for component variant props
 * 
 * Provides TypeScript support with full autocompletion and type safety
 * for all table variant configurations.
 */
export type TableContainerVariants = VariantProps<typeof tableContainerVariants>;
export type TableVariants = VariantProps<typeof tableVariants>;
export type TableHeaderVariants = VariantProps<typeof tableHeaderVariants>;
export type TableCellVariants = VariantProps<typeof tableCellVariants>;
export type StatusBadgeVariants = VariantProps<typeof statusBadgeVariants>;
export type TableActionVariants = VariantProps<typeof tableActionVariants>;

/**
 * Utility functions for combining table variants
 * 
 * Helper functions that provide common variant combinations and
 * responsive behavior patterns for table components.
 */

/**
 * Creates responsive table container classes
 * 
 * @param variants - Container variant options
 * @param className - Additional custom classes
 * @returns Merged class string with responsive behavior
 */
export function createTableContainer(
  variants?: TableContainerVariants,
  className?: string
): string {
  return cn(tableContainerVariants(variants), className);
}

/**
 * Creates accessible table element classes
 * 
 * @param variants - Table variant options
 * @param className - Additional custom classes  
 * @returns Merged class string with accessibility features
 */
export function createTable(
  variants?: TableVariants,
  className?: string
): string {
  return cn(tableVariants(variants), className);
}

/**
 * Creates sortable table header classes
 * 
 * @param variants - Header variant options
 * @param className - Additional custom classes
 * @returns Merged class string with sorting capabilities
 */
export function createTableHeader(
  variants?: TableHeaderVariants,
  className?: string
): string {
  return cn(tableHeaderVariants(variants), className);
}

/**
 * Creates interactive table cell classes
 * 
 * @param variants - Cell variant options
 * @param className - Additional custom classes
 * @returns Merged class string with interaction states
 */
export function createTableCell(
  variants?: TableCellVariants,
  className?: string
): string {
  return cn(tableCellVariants(variants), className);
}

/**
 * Creates WCAG compliant status badge classes
 * 
 * @param variants - Badge variant options
 * @param className - Additional custom classes
 * @returns Merged class string with semantic colors
 */
export function createStatusBadge(
  variants?: StatusBadgeVariants,
  className?: string
): string {
  return cn(statusBadgeVariants(variants), className);
}

/**
 * Creates accessible table action button classes
 * 
 * @param variants - Action variant options
 * @param className - Additional custom classes
 * @returns Merged class string with accessibility features
 */
export function createTableAction(
  variants?: TableActionVariants,
  className?: string
): string {
  return cn(tableActionVariants(variants), className);
}

/**
 * Responsive table configuration presets
 * 
 * Pre-configured variant combinations for common table use cases
 * that follow DreamFactory design system patterns.
 */
export const tablePresets = {
  /**
   * Standard data table configuration
   * Balanced readability and information density
   */
  standard: {
    container: {
      size: 'default' as const,
      theme: 'auto' as const,
      density: 'normal' as const,
      interactive: 'hoverable' as const,
    },
    table: {
      size: 'default' as const,
      bordered: 'horizontal' as const,
      striped: 'none' as const,
    },
  },
  
  /**
   * Compact data table configuration  
   * Maximum information density for dashboard views
   */
  compact: {
    container: {
      size: 'compact' as const,
      theme: 'auto' as const,
      density: 'dense' as const,
      interactive: 'hoverable' as const,
    },
    table: {
      size: 'compact' as const,
      bordered: 'horizontal' as const,
      striped: 'odd' as const,
    },
  },
  
  /**
   * Comfortable reading configuration
   * Enhanced readability for complex data review
   */
  comfortable: {
    container: {
      size: 'comfortable' as const,
      theme: 'auto' as const,
      density: 'sparse' as const,
      interactive: 'selectable' as const,
    },
    table: {
      size: 'comfortable' as const,
      bordered: 'full' as const,
      striped: 'none' as const,
    },
  },
} as const;

/**
 * Accessibility utilities for table components
 * 
 * Helper functions to ensure WCAG 2.1 AA compliance in dynamic scenarios
 */
export const tableA11yUtils = {
  /**
   * Validates color contrast for dynamic table content
   * 
   * @param foreground - Foreground color value
   * @param background - Background color value
   * @returns Boolean indicating WCAG AA compliance
   */
  validateContrast: (foreground: string, background: string): boolean => {
    // Implementation would use WCAG contrast calculation
    // This is a placeholder for the actual contrast validation
    return true;
  },
  
  /**
   * Generates appropriate ARIA labels for table cells
   * 
   * @param content - Cell content
   * @param columnHeader - Column header text
   * @param rowIndex - Row index for context
   * @returns ARIA label string
   */
  generateCellAriaLabel: (
    content: string,
    columnHeader: string,
    rowIndex: number
  ): string => {
    return `${columnHeader}: ${content}, row ${rowIndex + 1}`;
  },
  
  /**
   * Creates keyboard navigation hint text
   * 
   * @param isInteractive - Whether the table supports interaction
   * @returns Screen reader instructions
   */
  getKeyboardHints: (isInteractive: boolean): string => {
    const baseHint = 'Use arrow keys to navigate table cells.';
    const interactiveHint = ' Press Enter or Space to interact with selected cell.';
    return isInteractive ? baseHint + interactiveHint : baseHint;
  },
} as const;