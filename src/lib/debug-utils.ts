/**
 * Debug Utilities
 * 
 * Comprehensive debug information management utilities for the DreamFactory Admin Interface.
 * Supports debug entry lifecycle, formatting, search, and filtering operations.
 * 
 * Features:
 * - Type-safe debug entry structures
 * - JSON syntax highlighting
 * - Advanced filtering and search
 * - Debug level categorization
 * - Export/import functionality
 */

import { format, parseISO, isValid } from 'date-fns';

// ============================================================================
// DEBUG ENTRY TYPES
// ============================================================================

export type DebugLevel = 'debug' | 'info' | 'warn' | 'error' | 'trace';

export interface DebugEntry {
  id: string;
  timestamp: string;
  level: DebugLevel;
  category: string;
  message: string;
  data?: unknown;
  stack?: string;
  source?: string;
  session?: string;
}

export interface DebugFilter {
  level?: DebugLevel[];
  category?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: string[];
}

export interface DebugStats {
  total: number;
  byLevel: Record<DebugLevel, number>;
  byCategory: Record<string, number>;
  lastEntry?: DebugEntry;
  oldestEntry?: DebugEntry;
}

// ============================================================================
// DEBUG ENTRY CREATION AND VALIDATION
// ============================================================================

/**
 * Create a new debug entry with automatic timestamp and ID generation
 */
export function createDebugEntry(
  level: DebugLevel,
  category: string,
  message: string,
  data?: unknown,
  source?: string
): DebugEntry {
  return {
    id: generateDebugId(),
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
    source,
    session: getSessionId(),
  };
}

/**
 * Validate debug entry structure
 */
export function isValidDebugEntry(entry: unknown): entry is DebugEntry {
  if (!entry || typeof entry !== 'object') return false;
  
  const debug = entry as Record<string, unknown>;
  
  return (
    typeof debug.id === 'string' &&
    typeof debug.timestamp === 'string' &&
    typeof debug.level === 'string' &&
    ['debug', 'info', 'warn', 'error', 'trace'].includes(debug.level as string) &&
    typeof debug.category === 'string' &&
    typeof debug.message === 'string'
  );
}

/**
 * Sanitize debug entries array, removing invalid entries
 */
export function sanitizeDebugEntries(entries: unknown[]): DebugEntry[] {
  return entries.filter(isValidDebugEntry);
}

// ============================================================================
// FILTERING AND SEARCH
// ============================================================================

/**
 * Filter debug entries based on criteria
 */
export function filterDebugEntries(entries: DebugEntry[], filter: DebugFilter): DebugEntry[] {
  return entries.filter(entry => {
    // Level filter
    if (filter.level && filter.level.length > 0) {
      if (!filter.level.includes(entry.level)) return false;
    }
    
    // Category filter
    if (filter.category && filter.category.length > 0) {
      if (!filter.category.includes(entry.category)) return false;
    }
    
    // Source filter
    if (filter.source && filter.source.length > 0) {
      if (!entry.source || !filter.source.includes(entry.source)) return false;
    }
    
    // Date range filter
    if (filter.dateFrom || filter.dateTo) {
      const entryDate = new Date(entry.timestamp);
      if (filter.dateFrom && entryDate < new Date(filter.dateFrom)) return false;
      if (filter.dateTo && entryDate > new Date(filter.dateTo)) return false;
    }
    
    // Search filter (case-insensitive, searches message and stringified data)
    if (filter.search && filter.search.trim()) {
      const searchTerm = filter.search.toLowerCase().trim();
      const searchableText = [
        entry.message,
        entry.category,
        entry.source || '',
        entry.data ? JSON.stringify(entry.data) : '',
        entry.stack || ''
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchTerm)) return false;
    }
    
    return true;
  });
}

/**
 * Search debug entries with advanced text matching
 */
export function searchDebugEntries(entries: DebugEntry[], query: string): DebugEntry[] {
  if (!query.trim()) return entries;
  
  const searchTerms = query.toLowerCase().trim().split(/\s+/);
  
  return entries.filter(entry => {
    const searchableContent = [
      entry.message,
      entry.category,
      entry.level,
      entry.source || '',
      formatTimestamp(entry.timestamp),
      entry.data ? JSON.stringify(entry.data) : ''
    ].join(' ').toLowerCase();
    
    return searchTerms.every(term => searchableContent.includes(term));
  });
}

// ============================================================================
// FORMATTING AND DISPLAY
// ============================================================================

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string, includeSeconds = true): string {
  try {
    const date = parseISO(timestamp);
    if (!isValid(date)) return timestamp;
    
    const formatString = includeSeconds ? 'MMM dd, yyyy HH:mm:ss' : 'MMM dd, yyyy HH:mm';
    return format(date, formatString);
  } catch {
    return timestamp;
  }
}

/**
 * Format debug data as pretty-printed JSON
 */
export function formatDebugData(data: unknown): string {
  if (data === undefined || data === null) return '';
  
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * Get CSS classes for debug level styling
 */
export function getDebugLevelStyles(level: DebugLevel): {
  badge: string;
  text: string;
  background: string;
} {
  const styles = {
    debug: {
      badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      text: 'text-gray-600 dark:text-gray-400',
      background: 'border-l-gray-300 dark:border-l-gray-600'
    },
    info: {
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      text: 'text-blue-600 dark:text-blue-400',
      background: 'border-l-blue-300 dark:border-l-blue-600'
    },
    warn: {
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      text: 'text-yellow-600 dark:text-yellow-400',
      background: 'border-l-yellow-300 dark:border-l-yellow-600'
    },
    error: {
      badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      text: 'text-red-600 dark:text-red-400',
      background: 'border-l-red-300 dark:border-l-red-600'
    },
    trace: {
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      text: 'text-purple-600 dark:text-purple-400',
      background: 'border-l-purple-300 dark:border-l-purple-600'
    }
  };
  
  return styles[level];
}

/**
 * Get debug level priority for sorting
 */
export function getDebugLevelPriority(level: DebugLevel): number {
  const priorities = { error: 5, warn: 4, info: 3, debug: 2, trace: 1 };
  return priorities[level];
}

// ============================================================================
// STATISTICS AND ANALYSIS
// ============================================================================

/**
 * Generate debug statistics from entries
 */
export function generateDebugStats(entries: DebugEntry[]): DebugStats {
  const stats: DebugStats = {
    total: entries.length,
    byLevel: { debug: 0, info: 0, warn: 0, error: 0, trace: 0 },
    byCategory: {}
  };
  
  if (entries.length === 0) return stats;
  
  // Sort by timestamp for oldest/newest
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  stats.oldestEntry = sortedEntries[0];
  stats.lastEntry = sortedEntries[sortedEntries.length - 1];
  
  // Count by level and category
  entries.forEach(entry => {
    stats.byLevel[entry.level]++;
    stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;
  });
  
  return stats;
}

/**
 * Get unique categories from debug entries
 */
export function getUniqueCategories(entries: DebugEntry[]): string[] {
  const categories = new Set(entries.map(entry => entry.category));
  return Array.from(categories).sort();
}

/**
 * Get unique sources from debug entries
 */
export function getUniqueSources(entries: DebugEntry[]): string[] {
  const sources = new Set(
    entries.map(entry => entry.source).filter(Boolean) as string[]
  );
  return Array.from(sources).sort();
}

// ============================================================================
// SORTING
// ============================================================================

export type DebugSortField = 'timestamp' | 'level' | 'category' | 'message';
export type DebugSortDirection = 'asc' | 'desc';

/**
 * Sort debug entries by field and direction
 */
export function sortDebugEntries(
  entries: DebugEntry[],
  field: DebugSortField,
  direction: DebugSortDirection = 'desc'
): DebugEntry[] {
  const sortedEntries = [...entries];
  
  sortedEntries.sort((a, b) => {
    let comparison = 0;
    
    switch (field) {
      case 'timestamp':
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        break;
      case 'level':
        comparison = getDebugLevelPriority(b.level) - getDebugLevelPriority(a.level);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'message':
        comparison = a.message.localeCompare(b.message);
        break;
    }
    
    return direction === 'asc' ? comparison : -comparison;
  });
  
  return sortedEntries;
}

// ============================================================================
// EXPORT AND IMPORT
// ============================================================================

/**
 * Export debug entries as JSON
 */
export function exportDebugEntries(entries: DebugEntry[]): string {
  const exportData = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    count: entries.length,
    entries
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import debug entries from JSON
 */
export function importDebugEntries(jsonString: string): DebugEntry[] {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Handle different import formats
    if (Array.isArray(parsed)) {
      return sanitizeDebugEntries(parsed);
    }
    
    if (parsed.entries && Array.isArray(parsed.entries)) {
      return sanitizeDebugEntries(parsed.entries);
    }
    
    return [];
  } catch {
    return [];
  }
}

/**
 * Download debug entries as a JSON file
 */
export function downloadDebugEntries(entries: DebugEntry[], filename?: string): void {
  const json = exportDebugEntries(entries);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `debug-entries-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique debug entry ID
 */
function generateDebugId(): string {
  return `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get or create session ID for debug tracking
 */
function getSessionId(): string {
  const storageKey = '__debug_session_id__';
  let sessionId = localStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

/**
 * Debounce function for search performance
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Copy text to clipboard with error handling
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    } catch {
      return false;
    }
  }
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Legacy debug info migration from old format
 */
export function migrateLegacyDebugInfo(legacyData: string[]): DebugEntry[] {
  return legacyData.map((message, index) => createDebugEntry(
    'info',
    'legacy',
    message,
    undefined,
    'localStorage'
  ));
}