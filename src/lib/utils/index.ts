/**
 * Utility Functions Index
 * 
 * Centralized export file for common utility functions used throughout the React application.
 * Provides class name concatenation, validation helpers, and general-purpose utilities.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names using clsx and tailwind-merge for dynamic styling
 * 
 * This function is essential for Tailwind CSS class composition, handling:
 * - Conditional class application
 * - Tailwind class deduplication and merging
 * - Dynamic class name generation
 * 
 * @param inputs - Class values to combine (strings, objects, arrays, etc.)
 * @returns Merged and deduplicated class string
 * 
 * @example
 * ```tsx
 * const buttonClasses = cn(
 *   'px-4 py-2 rounded',
 *   isActive && 'bg-blue-500 text-white',
 *   disabled ? 'opacity-50' : 'hover:bg-blue-600'
 * )
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formats a string for display purposes
 * 
 * @param str - String to format
 * @returns Formatted string
 */
export function formatDisplayString(str: string): string {
  if (!str) return ''
  
  // Convert snake_case or kebab-case to Title Case
  return str
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}

/**
 * Debounce function for performance optimization
 * 
 * @param func - Function to debounce
 * @param wait - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Type-safe object keys function
 * 
 * @param obj - Object to get keys from
 * @returns Array of typed object keys
 */
export function typedObjectKeys<T extends Record<string, any>>(
  obj: T
): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>
}

/**
 * Sleep/delay utility for async operations
 * 
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Safe JSON parse with error handling
 * 
 * @param str - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T = any>(str: string, fallback: T): T {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

/**
 * Generate a random ID string
 * 
 * @param length - Length of the ID (default: 8)
 * @returns Random alphanumeric string
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

// Re-export utilities from other modules
export * from './case'
export * from './url'
export * from './file'
export * from './hash'
export * from './filter-queries'
export * from './parse-errors'
export * from './language'
export * from './icons'
export * from './eventScripts'
export * from './route'
export * from './test-utilities'