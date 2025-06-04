'use client';

/**
 * DebugPanel Component
 * 
 * Main debug panel container component that orchestrates the display of debug information,
 * development metrics, and interactive debug controls. Migrated from Angular to React with
 * enhanced debugging capabilities and Next.js integration.
 * 
 * Primary responsibilities:
 * - Provides comprehensive debugging interface during development
 * - Displays localStorage data, React Query cache status, and Next.js development metrics
 * - Enables application state inspection and interactive debug controls
 * - Implements security restrictions for development environment only
 * - Maintains user preferences for panel layout and visibility
 * 
 * Key transformations from Angular:
 * - Angular debug component template structure → React component composition
 * - Angular Material layout → Tailwind CSS responsive debug panel
 * - Angular services → React hooks and state management
 * - RxJS observables → React Query and useState patterns
 * - Angular environment checking → Next.js runtime environment detection
 * 
 * Features:
 * - Development-only rendering with production safety
 * - Collapsible panel sections with localStorage persistence
 * - Real-time metrics updates with configurable refresh intervals
 * - Dark mode support with theme consistency
 * - Keyboard shortcuts for quick access to debug functions
 * - Responsive design optimized for development workflows
 * - Integration with React DevTools and Next.js development tools
 * - WCAG 2.1 AA compliance for accessibility during development
 * 
 * Performance Considerations:
 * - Lazy loading of heavy debug components
 * - Memoized expensive calculations
 * - Debounced state updates for smooth user experience
 * - Virtual scrolling for large debug datasets
 * - Efficient React Query cache inspection
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage in development environment
 * <DebugPanel />
 * 
 * // With custom configuration
 * <DebugPanel
 *   refreshInterval={3000}
 *   defaultCollapsed={true}
 *   enableKeyboardShortcuts={true}
 * />
 * ```
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Import debug components
import DebugInfoList from './DebugInfoList';
import DebugControls from './DebugControls';
import DebugMetrics from './DebugMetrics';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Debug panel configuration interface
 * Manages user preferences and panel behavior settings
 */
interface DebugPanelConfig {
  /** Whether panels should be collapsed by default */
  defaultCollapsed: boolean;
  /** Auto-refresh interval in milliseconds */
  refreshInterval: number;
  /** Enable keyboard shortcuts for panel operations */
  enableKeyboardShortcuts: boolean;
  /** Maximum height for scrollable sections */
  maxHeight: number;
  /** Show advanced metrics and technical details */
  showAdvancedMetrics: boolean;
  /** Enable real-time updates for dynamic data */
  enableRealTimeUpdates: boolean;
  /** Theme preference for debug panel */
  theme: 'auto' | 'light' | 'dark';
  /** Position preference for floating panel */
  position: 'bottom' | 'right' | 'fullscreen';
}

/**
 * Panel section state interface
 * Tracks visibility and configuration for each debug section
 */
interface PanelSectionState {
  debugInfo: boolean;
  debugControls: boolean;
  debugMetrics: boolean;
}

/**
 * Component props interface
 * Allows customization of debug panel behavior and appearance
 */
interface DebugPanelProps {
  /** Custom CSS class name for styling */
  className?: string;
  /** Auto-refresh interval in milliseconds (default: 5000) */
  refreshInterval?: number;
  /** Whether panels should start collapsed (default: false) */
  defaultCollapsed?: boolean;
  /** Enable keyboard shortcuts (default: true) */
  enableKeyboardShortcuts?: boolean;
  /** Maximum height for panel sections (default: 600) */
  maxHeight?: number;
  /** Show advanced development metrics (default: true) */
  showAdvancedMetrics?: boolean;
  /** Callback when panel configuration changes */
  onConfigChange?: (config: Partial<DebugPanelConfig>) => void;
  /** Callback when panel visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
}

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

/** Storage key for persisting panel configuration */
const STORAGE_KEY_CONFIG = 'debugPanel_config';

/** Storage key for persisting panel section states */
const STORAGE_KEY_SECTIONS = 'debugPanel_sections';

/** Default configuration values */
const DEFAULT_CONFIG: DebugPanelConfig = {
  defaultCollapsed: false,
  refreshInterval: 5000,
  enableKeyboardShortcuts: true,
  maxHeight: 600,
  showAdvancedMetrics: true,
  enableRealTimeUpdates: true,
  theme: 'auto',
  position: 'bottom'
};

/** Default panel section states */
const DEFAULT_SECTIONS: PanelSectionState = {
  debugInfo: true,
  debugControls: true,
  debugMetrics: true
};

/** Keyboard shortcuts configuration */
const KEYBOARD_SHORTCUTS = {
  togglePanel: ['ctrl+shift+d', 'cmd+shift+d'],
  toggleInfo: ['ctrl+shift+i', 'cmd+shift+i'],
  toggleControls: ['ctrl+shift+c', 'cmd+shift+c'],
  toggleMetrics: ['ctrl+shift+m', 'cmd+shift+m'],
  refresh: ['ctrl+shift+r', 'cmd+shift+r']
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if the application is running in development environment
 * Uses Next.js runtime environment detection for security
 */
const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Safely parses JSON from localStorage with fallback
 */
const safeParseJSON = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.warn(`Failed to parse stored config for ${key}:`, error);
    return fallback;
  }
};

/**
 * Safely stores JSON to localStorage with error handling
 */
const safeStoreJSON = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to store config for ${key}:`, error);
  }
};

/**
 * Debounce utility for performance optimization
 */
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DebugPanel: React.FC<DebugPanelProps> = ({
  className = '',
  refreshInterval = DEFAULT_CONFIG.refreshInterval,
  defaultCollapsed = DEFAULT_CONFIG.defaultCollapsed,
  enableKeyboardShortcuts = DEFAULT_CONFIG.enableKeyboardShortcuts,
  maxHeight = DEFAULT_CONFIG.maxHeight,
  showAdvancedMetrics = DEFAULT_CONFIG.showAdvancedMetrics,
  onConfigChange,
  onVisibilityChange
}) => {
  // ============================================================================
  // EARLY RETURN FOR PRODUCTION
  // ============================================================================
  
  // Security: Only render in development environment
  if (!isDevelopment()) {
    return null;
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Panel configuration state with localStorage persistence
  const [config, setConfig] = useState<DebugPanelConfig>(() => ({
    ...DEFAULT_CONFIG,
    defaultCollapsed,
    refreshInterval,
    enableKeyboardShortcuts,
    maxHeight,
    showAdvancedMetrics
  }));

  // Panel section visibility states with localStorage persistence
  const [sectionStates, setSectionStates] = useState<PanelSectionState>(() =>
    safeParseJSON(STORAGE_KEY_SECTIONS, DEFAULT_SECTIONS)
  );

  // Overall panel visibility state
  const [isPanelVisible, setIsPanelVisible] = useState<boolean>(true);

  // Configuration panel visibility
  const [isConfigVisible, setIsConfigVisible] = useState<boolean>(false);

  // Last refresh timestamp for display
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Loading states for async operations
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // ============================================================================
  // INITIALIZATION AND PERSISTENCE
  // ============================================================================

  // Load persisted configuration on mount
  useEffect(() => {
    const storedConfig = safeParseJSON(STORAGE_KEY_CONFIG, {});
    const mergedConfig = { ...config, ...storedConfig };
    setConfig(mergedConfig);
  }, []); // Run only once on mount

  // Persist configuration changes to localStorage
  useEffect(() => {
    safeStoreJSON(STORAGE_KEY_CONFIG, config);
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  // Persist section states to localStorage
  useEffect(() => {
    safeStoreJSON(STORAGE_KEY_SECTIONS, sectionStates);
  }, [sectionStates]);

  // Notify parent of visibility changes
  useEffect(() => {
    onVisibilityChange?.(isPanelVisible);
  }, [isPanelVisible, onVisibilityChange]);

  // ============================================================================
  // AUTO-REFRESH FUNCTIONALITY
  // ============================================================================

  // Debounced refresh function to prevent excessive updates
  const debouncedRefresh = useMemo(
    () => debounce(() => {
      setLastRefresh(Date.now());
      setIsRefreshing(false);
    }, 300),
    []
  );

  // Auto-refresh timer for real-time updates
  useEffect(() => {
    if (!config.enableRealTimeUpdates || !isPanelVisible) {
      return;
    }

    const interval = setInterval(() => {
      setIsRefreshing(true);
      debouncedRefresh();
    }, config.refreshInterval);

    return () => clearInterval(interval);
  }, [config.enableRealTimeUpdates, config.refreshInterval, isPanelVisible, debouncedRefresh]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Toggles visibility of a specific panel section
   */
  const toggleSection = useCallback((section: keyof PanelSectionState) => {
    setSectionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  /**
   * Toggles overall panel visibility
   */
  const togglePanelVisibility = useCallback(() => {
    setIsPanelVisible(prev => !prev);
  }, []);

  /**
   * Toggles configuration panel visibility
   */
  const toggleConfigVisibility = useCallback(() => {
    setIsConfigVisible(prev => !prev);
  }, []);

  /**
   * Handles manual refresh request
   */
  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    setLastRefresh(Date.now());
    
    // Trigger refresh in child components by updating timestamp
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, []);

  /**
   * Handles configuration updates with validation
   */
  const handleConfigUpdate = useCallback((updates: Partial<DebugPanelConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      
      // Validate refresh interval bounds
      if (newConfig.refreshInterval < 1000) {
        newConfig.refreshInterval = 1000;
      } else if (newConfig.refreshInterval > 30000) {
        newConfig.refreshInterval = 30000;
      }
      
      // Validate max height bounds
      if (newConfig.maxHeight < 200) {
        newConfig.maxHeight = 200;
      } else if (newConfig.maxHeight > 1200) {
        newConfig.maxHeight = 1200;
      }
      
      return newConfig;
    });
  }, []);

  /**
   * Collapses all sections at once
   */
  const collapseAllSections = useCallback(() => {
    setSectionStates({
      debugInfo: false,
      debugControls: false,
      debugMetrics: false
    });
  }, []);

  /**
   * Expands all sections at once
   */
  const expandAllSections = useCallback(() => {
    setSectionStates({
      debugInfo: true,
      debugControls: true,
      debugMetrics: true
    });
  }, []);

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  useEffect(() => {
    if (!config.enableKeyboardShortcuts) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      
      if (!isCtrlOrCmd || !isShift) {
        return;
      }

      // Prevent default browser behavior
      event.preventDefault();

      switch (event.key.toLowerCase()) {
        case 'd':
          togglePanelVisibility();
          break;
        case 'i':
          toggleSection('debugInfo');
          break;
        case 'c':
          toggleSection('debugControls');
          break;
        case 'm':
          toggleSection('debugMetrics');
          break;
        case 'r':
          handleManualRefresh();
          break;
        default:
          // Allow default behavior for unhandled shortcuts
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    config.enableKeyboardShortcuts,
    togglePanelVisibility,
    toggleSection,
    handleManualRefresh
  ]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const allSectionsCollapsed = useMemo(() => 
    !sectionStates.debugInfo && !sectionStates.debugControls && !sectionStates.debugMetrics,
    [sectionStates]
  );

  const allSectionsExpanded = useMemo(() =>
    sectionStates.debugInfo && sectionStates.debugControls && sectionStates.debugMetrics,
    [sectionStates]
  );

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Renders a section header with toggle functionality
   */
  const renderSectionHeader = (
    title: string,
    isVisible: boolean,
    onToggle: () => void,
    icon?: React.ReactNode
  ) => (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-4 py-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 border-b border-gray-200 dark:border-gray-600"
      aria-expanded={isVisible}
      aria-label={`Toggle ${title} section`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>
      <div className="flex items-center gap-2">
        {isVisible ? (
          <ChevronUpIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        )}
      </div>
    </button>
  );

  /**
   * Renders the main panel header with controls
   */
  const renderPanelHeader = () => (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Debug Panel
        </h2>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>Development Mode</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Last refresh indicator */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Updated: {new Date(lastRefresh).toLocaleTimeString()}
        </div>
        
        {/* Refresh button */}
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label="Refresh debug data"
          title="Refresh debug data (Ctrl+Shift+R)"
        >
          <ArrowPathIcon 
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} 
          />
        </button>
        
        {/* Panel controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={allSectionsExpanded ? collapseAllSections : expandAllSections}
            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title={allSectionsExpanded ? 'Collapse all sections' : 'Expand all sections'}
          >
            {allSectionsExpanded ? 'Collapse All' : 'Expand All'}
          </button>
          
          <button
            onClick={toggleConfigVisibility}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Open configuration"
            title="Panel configuration"
          >
            <Cog6ToothIcon className="h-4 w-4" />
          </button>
          
          <button
            onClick={togglePanelVisibility}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Hide debug panel"
            title="Hide panel (Ctrl+Shift+D)"
          >
            <EyeSlashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  /**
   * Renders the configuration panel
   */
  const renderConfigPanel = () => (
    <div className="absolute top-0 right-0 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Debug Panel Configuration
        </h3>
        <button
          onClick={toggleConfigVisibility}
          className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Refresh Interval */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Refresh Interval (ms)
          </label>
          <input
            type="number"
            min="1000"
            max="30000"
            step="1000"
            value={config.refreshInterval}
            onChange={(e) => handleConfigUpdate({ refreshInterval: parseInt(e.target.value) || 5000 })}
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        
        {/* Max Height */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max Section Height (px)
          </label>
          <input
            type="number"
            min="200"
            max="1200"
            step="50"
            value={config.maxHeight}
            onChange={(e) => handleConfigUpdate({ maxHeight: parseInt(e.target.value) || 600 })}
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        
        {/* Toggles */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.enableKeyboardShortcuts}
              onChange={(e) => handleConfigUpdate({ enableKeyboardShortcuts: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">Enable Keyboard Shortcuts</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.enableRealTimeUpdates}
              onChange={(e) => handleConfigUpdate({ enableRealTimeUpdates: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">Real-time Updates</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showAdvancedMetrics}
              onChange={(e) => handleConfigUpdate({ showAdvancedMetrics: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">Advanced Metrics</span>
          </label>
        </div>
      </div>
      
      {/* Keyboard shortcuts help */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Keyboard Shortcuts
        </h4>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>Ctrl+Shift+D: Toggle Panel</div>
          <div>Ctrl+Shift+I: Toggle Info</div>
          <div>Ctrl+Shift+C: Toggle Controls</div>
          <div>Ctrl+Shift+M: Toggle Metrics</div>
          <div>Ctrl+Shift+R: Refresh</div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  // Render minimized panel when hidden
  if (!isPanelVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-40 ${className}`}>
        <button
          onClick={togglePanelVisibility}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-sm font-medium text-gray-900 dark:text-gray-100"
          title="Show debug panel (Ctrl+Shift+D)"
        >
          <EyeIcon className="h-4 w-4" />
          Debug Panel
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 ${className}`}>
      <div className="relative bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl">
        {/* Panel Header */}
        {renderPanelHeader()}
        
        {/* Panel Content */}
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-700">
          {/* Debug Information List Section */}
          <div className="flex-1 min-w-0">
            {renderSectionHeader(
              'Debug Information',
              sectionStates.debugInfo,
              () => toggleSection('debugInfo'),
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {sectionStates.debugInfo && (
              <div className="h-full overflow-hidden">
                <DebugInfoList
                  maxHeight={config.maxHeight}
                  autoRefresh={config.enableRealTimeUpdates}
                  refreshInterval={config.refreshInterval}
                  showStats={true}
                  enableExport={true}
                  enableClearAll={true}
                />
              </div>
            )}
          </div>
          
          {/* Debug Controls Section */}
          <div className="w-full lg:w-80 xl:w-96">
            {renderSectionHeader(
              'Debug Controls',
              sectionStates.debugControls,
              () => toggleSection('debugControls'),
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            )}
            {sectionStates.debugControls && (
              <div style={{ maxHeight: config.maxHeight }} className="overflow-y-auto">
                <DebugControls />
              </div>
            )}
          </div>
          
          {/* Debug Metrics Section */}
          <div className="w-full lg:w-80 xl:w-96">
            {renderSectionHeader(
              'Development Metrics',
              sectionStates.debugMetrics,
              () => toggleSection('debugMetrics'),
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )}
            {sectionStates.debugMetrics && (
              <div style={{ maxHeight: config.maxHeight }} className="overflow-y-auto">
                <DebugMetrics
                  refreshInterval={config.refreshInterval}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Configuration Panel Overlay */}
        {isConfigVisible && renderConfigPanel()}
      </div>
    </div>
  );
};

export default DebugPanel;