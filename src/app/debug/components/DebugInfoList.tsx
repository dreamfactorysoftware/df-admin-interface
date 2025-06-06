/**
 * Debug Information List Component
 * 
 * Displays debug entries from localStorage and other debug sources in a structured, 
 * interactive format with filtering, search capabilities, and detailed view options.
 * Essential for development debugging workflow and troubleshooting during development cycles.
 * 
 * Features:
 * - Virtual scrolling support for large debug datasets per Section 5.2 component scaling
 * - Enhanced filtering and search per Summary of Changes debugging transformation  
 * - React hooks for localStorage integration with automatic updates per Section 4.3 state management
 * - Tailwind CSS responsive styling with dark mode support per React/Next.js Integration Requirements
 * - Expandable debug entries with JSON formatting and syntax highlighting
 * - Copy-to-clipboard functionality for developer productivity enhancements
 * 
 * @fileoverview Debug information list component for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { 
  useState, 
  useMemo, 
  useCallback, 
  useEffect, 
  useRef,
  Fragment
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  Search, 
  Filter, 
  Copy, 
  ChevronDown, 
  ChevronRight, 
  Trash2, 
  RefreshCw,
  Download,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Code,
  Eye,
  EyeOff
} from 'lucide-react';

import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input/input';
import { useLocalStorage } from '@/hooks/use-local-storage';

// =============================================================================
// DEBUG TYPES AND INTERFACES
// =============================================================================

/**
 * Debug entry severity levels
 */
export type DebugLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Debug entry source types
 */
export type DebugSource = 
  | 'api-client'
  | 'auth-service' 
  | 'database-service'
  | 'schema-discovery'
  | 'api-generation'
  | 'ui-component'
  | 'middleware'
  | 'system'
  | 'user-action'
  | 'performance'
  | 'error-boundary'
  | 'unknown';

/**
 * Debug entry data structure
 */
export interface DebugEntry {
  /** Unique identifier for the debug entry */
  id: string;
  /** Timestamp when the debug entry was created */
  timestamp: number;
  /** Debug level/severity */
  level: DebugLevel;
  /** Source component or service */
  source: DebugSource;
  /** Debug message or title */
  message: string;
  /** Additional debug data (objects, arrays, etc.) */
  data?: unknown;
  /** Stack trace for errors */
  stack?: string;
  /** User ID associated with the debug entry */
  userId?: string;
  /** Session ID for tracking */
  sessionId?: string;
  /** Request ID for API calls */
  requestId?: string;
  /** Performance timing data */
  timing?: {
    start: number;
    end?: number;
    duration?: number;
  };
  /** Additional context metadata */
  context?: Record<string, unknown>;
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Debug filter configuration
 */
export interface DebugFilter {
  /** Filter by debug level */
  levels: DebugLevel[];
  /** Filter by source */
  sources: DebugSource[];
  /** Time range filter */
  timeRange?: {
    start: Date;
    end: Date;
  };
  /** Search query */
  searchQuery: string;
  /** Show only entries with data */
  hasDataOnly: boolean;
  /** Show only entries with errors */
  errorsOnly: boolean;
  /** Filter by tags */
  tags: string[];
}

/**
 * Component props interface
 */
export interface DebugInfoListProps {
  /** Custom CSS class name */
  className?: string;
  /** Maximum number of entries to display */
  maxEntries?: number;
  /** Auto-refresh interval in milliseconds */
  autoRefreshInterval?: number;
  /** Enable virtual scrolling */
  enableVirtualScrolling?: boolean;
  /** Initial filter state */
  initialFilter?: Partial<DebugFilter>;
  /** Callback when entry is selected */
  onEntrySelect?: (entry: DebugEntry) => void;
  /** Callback when entries are cleared */
  onEntriesCleared?: () => void;
  /** Enable export functionality */
  enableExport?: boolean;
}

// =============================================================================
// DEBUG UTILITIES
// =============================================================================

/**
 * Debug level configurations with colors and icons
 */
const DEBUG_LEVEL_CONFIG: Record<DebugLevel, {
  color: string;
  bgColor: string;
  textColor: string;
  icon: React.ComponentType<any>;
  label: string;
}> = {
  trace: {
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: Eye,
    label: 'Trace'
  },
  debug: {
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: Code,
    label: 'Debug'
  },
  info: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: Info,
    label: 'Info'
  },
  warn: {
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    icon: AlertCircle,
    label: 'Warning'
  },
  error: {
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    icon: XCircle,
    label: 'Error'
  },
  fatal: {
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-800 dark:text-red-200',
    icon: XCircle,
    label: 'Fatal'
  }
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleString();
};

/**
 * Format JSON data for display with syntax highlighting
 */
const formatJsonData = (data: unknown): string => {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

/**
 * Copy text to clipboard with fallback
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  } catch {
    return false;
  }
};

/**
 * Get debug entries from localStorage and other sources
 */
const getDebugEntries = (): DebugEntry[] => {
  const entries: DebugEntry[] = [];

  // Get entries from localStorage
  try {
    const storedEntries = localStorage.getItem('debug-entries');
    if (storedEntries) {
      const parsed = JSON.parse(storedEntries);
      if (Array.isArray(parsed)) {
        entries.push(...parsed);
      }
    }
  } catch (error) {
    console.warn('Failed to parse debug entries from localStorage:', error);
  }

  // Get entries from sessionStorage
  try {
    const sessionEntries = sessionStorage.getItem('debug-entries');
    if (sessionEntries) {
      const parsed = JSON.parse(sessionEntries);
      if (Array.isArray(parsed)) {
        entries.push(...parsed.map(entry => ({ ...entry, source: 'session' as DebugSource })));
      }
    }
  } catch (error) {
    console.warn('Failed to parse debug entries from sessionStorage:', error);
  }

  // Get performance entries
  try {
    const perfEntries = performance.getEntriesByType('navigation');
    perfEntries.forEach((entry, index) => {
      entries.push({
        id: `perf-nav-${index}`,
        timestamp: entry.startTime,
        level: 'info',
        source: 'performance',
        message: 'Navigation Performance',
        data: {
          type: entry.entryType,
          duration: entry.duration,
          loadEventEnd: (entry as PerformanceNavigationTiming).loadEventEnd,
          domContentLoadedEventEnd: (entry as PerformanceNavigationTiming).domContentLoadedEventEnd,
        },
        timing: {
          start: entry.startTime,
          end: entry.startTime + entry.duration,
          duration: entry.duration,
        }
      });
    });
  } catch (error) {
    console.warn('Failed to get performance entries:', error);
  }

  // Sort by timestamp (newest first)
  return entries.sort((a, b) => b.timestamp - a.timestamp);
};

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

/**
 * Debug Information List Component
 */
export const DebugInfoList: React.FC<DebugInfoListProps> = ({
  className = '',
  maxEntries = 1000,
  autoRefreshInterval = 5000,
  enableVirtualScrolling = true,
  initialFilter = {},
  onEntrySelect,
  onEntriesCleared,
  enableExport = true,
}) => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  const [debugEntries, setDebugEntries] = useState<DebugEntry[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);

  // Filter state with localStorage persistence
  const [filter, setFilter] = useLocalStorage<DebugFilter>('debug-filter', {
    defaultValue: {
      levels: ['debug', 'info', 'warn', 'error', 'fatal'],
      sources: [],
      searchQuery: '',
      hasDataOnly: false,
      errorsOnly: false,
      tags: [],
      ...initialFilter,
    },
    syncAcrossTabs: true,
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  // =============================================================================
  // DATA FETCHING AND MANAGEMENT
  // =============================================================================

  /**
   * Load debug entries from various sources
   */
  const loadDebugEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const entries = getDebugEntries();
      setDebugEntries(entries.slice(0, maxEntries));
    } catch (error) {
      console.error('Failed to load debug entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [maxEntries]);

  /**
   * Clear all debug entries
   */
  const clearDebugEntries = useCallback(() => {
    try {
      localStorage.removeItem('debug-entries');
      sessionStorage.removeItem('debug-entries');
      setDebugEntries([]);
      setExpandedEntries(new Set());
      setSelectedEntry(null);
      onEntriesCleared?.();
    } catch (error) {
      console.error('Failed to clear debug entries:', error);
    }
  }, [onEntriesCleared]);

  /**
   * Export debug entries to JSON file
   */
  const exportDebugEntries = useCallback(() => {
    try {
      const dataStr = JSON.stringify(filteredEntries, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `debug-entries-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export debug entries:', error);
    }
  }, []);

  // =============================================================================
  // FILTERING AND SEARCH
  // =============================================================================

  /**
   * Filter and search debug entries
   */
  const filteredEntries = useMemo(() => {
    if (!filter) return debugEntries;

    return debugEntries.filter(entry => {
      // Level filter
      if (filter.levels.length > 0 && !filter.levels.includes(entry.level)) {
        return false;
      }

      // Source filter
      if (filter.sources.length > 0 && !filter.sources.includes(entry.source)) {
        return false;
      }

      // Time range filter
      if (filter.timeRange) {
        const entryDate = new Date(entry.timestamp);
        if (entryDate < filter.timeRange.start || entryDate > filter.timeRange.end) {
          return false;
        }
      }

      // Search query filter
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const searchableText = [
          entry.message,
          entry.source,
          entry.level,
          entry.stack,
          JSON.stringify(entry.data),
          JSON.stringify(entry.context),
          ...(entry.tags || [])
        ].join(' ').toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Has data filter
      if (filter.hasDataOnly && !entry.data) {
        return false;
      }

      // Errors only filter
      if (filter.errorsOnly && !['error', 'fatal'].includes(entry.level)) {
        return false;
      }

      // Tags filter
      if (filter.tags.length > 0) {
        const entryTags = entry.tags || [];
        const hasMatchingTag = filter.tags.some(tag => entryTags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }, [debugEntries, filter]);

  // =============================================================================
  // VIRTUAL SCROLLING SETUP
  // =============================================================================

  const virtualizer = useVirtualizer({
    count: filteredEntries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated height per entry
    enabled: enableVirtualScrolling,
    overscan: 10,
  });

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Toggle entry expansion
   */
  const toggleEntryExpansion = useCallback((entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  }, []);

  /**
   * Select entry
   */
  const selectEntry = useCallback((entry: DebugEntry) => {
    setSelectedEntry(entry.id);
    onEntrySelect?.(entry);
  }, [onEntrySelect]);

  /**
   * Copy entry data to clipboard
   */
  const copyEntryData = useCallback(async (entry: DebugEntry) => {
    const entryData = {
      ...entry,
      formattedTimestamp: formatTimestamp(entry.timestamp),
    };
    
    const success = await copyToClipboard(formatJsonData(entryData));
    if (success) {
      setCopyNotification(entry.id);
      setTimeout(() => setCopyNotification(null), 2000);
    }
  }, []);

  /**
   * Update filter
   */
  const updateFilter = useCallback((updates: Partial<DebugFilter>) => {
    if (!filter) return;
    
    const result = setFilter({ ...filter, ...updates });
    if (!result.success) {
      console.warn('Failed to update debug filter:', result.error);
    }
  }, [filter, setFilter]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initial load
  useEffect(() => {
    loadDebugEntries();
  }, [loadDebugEntries]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(loadDebugEntries, autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, loadDebugEntries]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'debug-entries') {
        loadDebugEntries();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadDebugEntries]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  /**
   * Render debug entry
   */
  const renderDebugEntry = useCallback((entry: DebugEntry, index: number) => {
    const config = DEBUG_LEVEL_CONFIG[entry.level];
    const isExpanded = expandedEntries.has(entry.id);
    const isSelected = selectedEntry === entry.id;
    const isCopied = copyNotification === entry.id;
    const IconComponent = config.icon;

    return (
      <div
        key={entry.id}
        className={`
          border-b border-gray-200 dark:border-gray-700 p-4 transition-all duration-200
          hover:bg-gray-50 dark:hover:bg-gray-800/50
          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : ''}
          ${config.bgColor}
        `}
        onClick={() => selectEntry(entry)}
      >
        {/* Entry Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Level Icon */}
            <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>
              <IconComponent className="h-4 w-4" />
            </div>

            {/* Entry Content */}
            <div className="min-w-0 flex-1">
              {/* Message and Metadata */}
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-medium text-sm ${config.textColor}`}>
                  {entry.message}
                </span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  {entry.source}
                </span>
              </div>

              {/* Timestamp and Additional Info */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(entry.timestamp)}
                </span>
                {entry.requestId && (
                  <span>ID: {entry.requestId.slice(-8)}</span>
                )}
                {entry.timing?.duration && (
                  <span>{Math.round(entry.timing.duration)}ms</span>
                )}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex gap-1">
                    {entry.tags.map(tag => (
                      <span 
                        key={tag}
                        className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                copyEntryData(entry);
              }}
              className="h-8 w-8 p-0"
              ariaLabel="Copy entry data"
            >
              {isCopied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>

            {(entry.data || entry.stack || entry.context) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleEntryExpansion(entry.id);
                }}
                className="h-8 w-8 p-0"
                ariaLabel={isExpanded ? "Collapse entry" : "Expand entry"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
            {/* Debug Data */}
            {entry.data && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data
                </h4>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-xs overflow-x-auto">
                  <code>{formatJsonData(entry.data)}</code>
                </pre>
              </div>
            )}

            {/* Stack Trace */}
            {entry.stack && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stack Trace
                </h4>
                <pre className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-xs overflow-x-auto text-red-700 dark:text-red-300">
                  <code>{entry.stack}</code>
                </pre>
              </div>
            )}

            {/* Context */}
            {entry.context && Object.keys(entry.context).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Context
                </h4>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-xs overflow-x-auto">
                  <code>{formatJsonData(entry.context)}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [
    expandedEntries,
    selectedEntry,
    copyNotification,
    selectEntry,
    copyEntryData,
    toggleEntryExpansion,
  ]);

  /**
   * Render filter controls
   */
  const renderFilterControls = useCallback(() => {
    if (!filter || !showFilters) return null;

    const availableSources = Array.from(
      new Set(debugEntries.map(entry => entry.source))
    ).sort();

    const availableTags = Array.from(
      new Set(debugEntries.flatMap(entry => entry.tags || []))
    ).sort();

    return (
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="space-y-4">
          {/* Search Input */}
          <div>
            <Input
              placeholder="Search debug entries..."
              value={filter.searchQuery}
              onChange={(e) => updateFilter({ searchQuery: e.target.value })}
              prefix={<Search className="h-4 w-4" />}
              className="w-full"
            />
          </div>

          {/* Level Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Debug Levels
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DEBUG_LEVEL_CONFIG).map(([level, config]) => {
                const isSelected = filter.levels.includes(level as DebugLevel);
                return (
                  <Button
                    key={level}
                    variant={isSelected ? "primary" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newLevels = isSelected
                        ? filter.levels.filter(l => l !== level)
                        : [...filter.levels, level as DebugLevel];
                      updateFilter({ levels: newLevels });
                    }}
                    className="text-xs"
                  >
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Source Filters */}
          {availableSources.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sources
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSources.map(source => {
                  const isSelected = filter.sources.includes(source);
                  return (
                    <Button
                      key={source}
                      variant={isSelected ? "primary" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newSources = isSelected
                          ? filter.sources.filter(s => s !== source)
                          : [...filter.sources, source];
                        updateFilter({ sources: newSources });
                      }}
                      className="text-xs"
                    >
                      {source}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter.hasDataOnly ? "primary" : "outline"}
              size="sm"
              onClick={() => updateFilter({ hasDataOnly: !filter.hasDataOnly })}
              className="text-xs"
            >
              Has Data Only
            </Button>
            <Button
              variant={filter.errorsOnly ? "primary" : "outline"}
              size="sm"
              onClick={() => updateFilter({ errorsOnly: !filter.errorsOnly })}
              className="text-xs"
            >
              Errors Only
            </Button>
          </div>
        </div>
      </div>
    );
  }, [filter, showFilters, debugEntries, updateFilter]);

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Debug Information
            </h2>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm rounded">
              {filteredEntries.length} entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter className="h-4 w-4" />}
              ariaLabel="Toggle filters"
            >
              Filters
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadDebugEntries}
              loading={isLoading}
              icon={<RefreshCw className="h-4 w-4" />}
              ariaLabel="Refresh debug entries"
            >
              Refresh
            </Button>

            {enableExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportDebugEntries}
                icon={<Download className="h-4 w-4" />}
                ariaLabel="Export debug entries"
              >
                Export
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={clearDebugEntries}
              icon={<Trash2 className="h-4 w-4" />}
              ariaLabel="Clear all debug entries"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      {renderFilterControls()}

      {/* Debug Entries List */}
      <div className="flex-1 overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No debug entries found</p>
              <p className="text-sm">
                {debugEntries.length === 0
                  ? "Debug entries will appear here as they are generated"
                  : "Try adjusting your filters to see more entries"
                }
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={parentRef}
            className="h-full overflow-auto"
            style={{ contain: 'strict' }}
          >
            {enableVirtualScrolling ? (
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    {renderDebugEntry(filteredEntries[virtualItem.index], virtualItem.index)}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {filteredEntries.map((entry, index) => 
                  renderDebugEntry(entry, index)
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

DebugInfoList.displayName = 'DebugInfoList';

export default DebugInfoList;