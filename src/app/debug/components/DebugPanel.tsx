/**
 * Debug Panel Container Component for DreamFactory Admin Interface
 * 
 * Main debug panel container component that orchestrates the display of debug information,
 * development metrics, and interactive debug controls. Primary responsibility: providing a
 * comprehensive debugging interface during development with sections for localStorage data,
 * React Query cache status, Next.js development metrics, and application state inspection.
 * 
 * Features:
 * - Development-only component with enhanced debugging capabilities per Summary of Changes transformation requirements
 * - React 19 component composition with TypeScript 5.8+ per React/Next.js Integration Requirements
 * - Tailwind CSS 4.1+ styling with consistent theme injection per React/Next.js Integration Requirements
 * - Integration with Next.js development tools per Summary of Changes debugging enhancement requirements
 * - Collapsible panel sections with localStorage persistence for developer preferences
 * - React Query devtools and cache inspection capabilities
 * - Real-time debug information updates with configurable refresh intervals
 * - Responsive design with mobile-friendly debug controls
 * 
 * Architecture:
 * - Container component following React 19 server component patterns with client-side interactivity
 * - Transforms Angular debug component template structure to React component composition
 * - Implements development environment detection with conditional rendering for production safety
 * - Uses Tailwind CSS responsive debug panel with dark mode support
 * - Integrates with enhanced debugging requirements per Section 0 transformation scope
 * 
 * Security:
 * - Only renders in development environment to prevent security exposure
 * - Implements proper development-only guards for production builds
 * - Uses environment detection for conditional feature availability
 * 
 * @fileoverview Main debug panel orchestration component for DreamFactory Admin Interface refactoring
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo,
  Suspense,
  Fragment 
} from 'react';
import { 
  Bug, 
  Settings, 
  Monitor, 
  Database, 
  ChevronDown, 
  ChevronRight,
  Minimize2,
  Maximize2,
  X,
  AlertTriangle,
  Info,
  Zap,
  Activity,
  BarChart3,
  Code,
  HelpCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

// Import child debug components
import { DebugInfoList } from './DebugInfoList';
import DebugControls from './DebugControls';
import { DebugMetrics } from './DebugMetrics';

// Import UI components and utilities
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useTheme } from '@/hooks/use-theme';

// =============================================================================
// INTERFACES AND TYPES
// =============================================================================

/**
 * Debug panel section configuration
 */
interface DebugSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  component: React.ComponentType<any>;
  defaultExpanded: boolean;
  enabled: boolean;
  badge?: string | number;
}

/**
 * Debug panel layout mode
 */
type DebugPanelMode = 'floating' | 'sidebar' | 'fullscreen' | 'minimized';

/**
 * Debug panel configuration interface
 */
interface DebugPanelConfig {
  mode: DebugPanelMode;
  expandedSections: Set<string>;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoRefresh: boolean;
  refreshInterval: number;
  showWelcome: boolean;
}

/**
 * Debug panel props interface
 */
export interface DebugPanelProps {
  /**
   * Custom CSS class name for the debug panel
   */
  className?: string;
  
  /**
   * Initial mode for the debug panel
   */
  initialMode?: DebugPanelMode;
  
  /**
   * Position of the debug panel when in floating mode
   */
  initialPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  /**
   * Whether to enable React Query devtools integration
   */
  enableQueryDevtools?: boolean;
  
  /**
   * Whether to show detailed component render information
   */
  enableDetailedMetrics?: boolean;
  
  /**
   * Custom sections to add to the debug panel
   */
  customSections?: DebugSection[];
  
  /**
   * Callback when debug panel mode changes
   */
  onModeChange?: (mode: DebugPanelMode) => void;
  
  /**
   * Maximum number of debug entries to display
   */
  maxDebugEntries?: number;
}

// =============================================================================
// TEMPORARY UI COMPONENTS (until ui components are available)
// =============================================================================

/**
 * Temporary Card component until ui/card is implemented
 */
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className, title }) => (
  <div className={cn(
    "rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900",
    className
  )}>
    {title && (
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
    )}
    {children}
  </div>
);

/**
 * Temporary Button component
 */
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  ariaLabel?: string;
  title?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  className,
  disabled = false,
  loading = false,
  icon,
  ariaLabel,
  title,
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
    ghost: "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };
  
  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      aria-label={ariaLabel}
      title={title}
    >
      {loading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

/**
 * Temporary Badge component
 */
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className 
}) => {
  const baseClasses = "inline-flex items-center rounded-full font-medium";
  
  const variantClasses = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    success: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    error: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  };
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </span>
  );
};

// =============================================================================
// CUSTOM HOOK FOR DEBUG INFO
// =============================================================================

/**
 * Custom hook for debug information management
 * Temporary implementation until use-debug-info.ts is created
 */
const useDebugInfo = () => {
  const [debugEntries, setDebugEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const refreshDebugInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate fetching debug information
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get debug info from various sources
      const newEntries = [];
      
      // LocalStorage debug data
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('debug') || key.includes('df_'))) {
            newEntries.push({
              source: 'localStorage',
              key,
              value: localStorage.getItem(key),
              timestamp: Date.now(),
            });
          }
        }
      } catch (error) {
        console.warn('Failed to read localStorage for debug info:', error);
      }
      
      // React Query cache info (if available)
      if (typeof window !== 'undefined' && (window as any).queryClient) {
        try {
          const queryCache = (window as any).queryClient.getQueryCache();
          const queries = queryCache.getAll();
          newEntries.push({
            source: 'reactQuery',
            key: 'cache_status',
            value: {
              totalQueries: queries.length,
              activeQueries: queries.filter((q: any) => q.state.status === 'success').length,
              staleQueries: queries.filter((q: any) => q.isStale()).length,
            },
            timestamp: Date.now(),
          });
        } catch (error) {
          console.warn('Failed to read React Query cache for debug info:', error);
        }
      }
      
      // Performance metrics
      try {
        const perfEntries = performance.getEntriesByType('navigation');
        if (perfEntries.length > 0) {
          const navEntry = perfEntries[0] as PerformanceNavigationTiming;
          newEntries.push({
            source: 'performance',
            key: 'navigation_timing',
            value: {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              totalLoadTime: navEntry.loadEventEnd - navEntry.fetchStart,
            },
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        console.warn('Failed to get performance metrics for debug info:', error);
      }
      
      setDebugEntries(newEntries);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh debug info:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshDebugInfo();
  }, [refreshDebugInfo]);

  return {
    debugEntries,
    isLoading,
    lastUpdate,
    refreshDebugInfo,
  };
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Main Debug Panel Component
 * 
 * Comprehensive debugging interface that provides developers with essential
 * debugging tools and information during development. Only renders in
 * development environment for security.
 */
export const DebugPanel: React.FC<DebugPanelProps> = ({
  className,
  initialMode = 'floating',
  initialPosition = 'bottom-right',
  enableQueryDevtools = true,
  enableDetailedMetrics = true,
  customSections = [],
  onModeChange,
  maxDebugEntries = 1000,
}) => {
  // =============================================================================
  // ENVIRONMENT AND DEVELOPMENT CHECK
  // =============================================================================
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Don't render in production for security
  if (!isDevelopment) {
    return null;
  }

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  const { theme } = useTheme();
  const { debugEntries, isLoading, lastUpdate, refreshDebugInfo } = useDebugInfo();

  // Panel configuration with localStorage persistence
  const [config, setConfig] = useLocalStorage<DebugPanelConfig>('debug-panel-config', {
    defaultValue: {
      mode: initialMode,
      expandedSections: new Set(['info', 'controls']),
      position: initialPosition,
      autoRefresh: true,
      refreshInterval: 5000,
      showWelcome: true,
    },
    syncAcrossTabs: false,
  });

  // Local state
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // =============================================================================
  // DEBUG SECTIONS CONFIGURATION
  // =============================================================================

  const defaultSections: DebugSection[] = useMemo(() => [
    {
      id: 'info',
      title: 'Debug Information',
      icon: Info,
      description: 'Application debug entries and localStorage data',
      component: DebugInfoList,
      defaultExpanded: true,
      enabled: true,
      badge: debugEntries.length > 0 ? debugEntries.length : undefined,
    },
    {
      id: 'controls',
      title: 'Debug Controls',
      icon: Settings,
      description: 'Interactive debug actions and data management',
      component: DebugControls,
      defaultExpanded: true,
      enabled: true,
    },
    {
      id: 'metrics',
      title: 'Performance Metrics',
      icon: BarChart3,
      description: 'Real-time performance monitoring and React Query cache status',
      component: DebugMetrics,
      defaultExpanded: false,
      enabled: enableDetailedMetrics,
    },
    ...customSections,
  ].filter(section => section.enabled), [debugEntries.length, enableDetailedMetrics, customSections]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Update configuration with localStorage persistence
   */
  const updateConfig = useCallback((updates: Partial<DebugPanelConfig>) => {
    if (!config) return;
    
    const newConfig = { ...config, ...updates };
    const result = setConfig(newConfig);
    
    if (!result.success) {
      console.warn('Failed to update debug panel config:', result.error);
    }
    
    // Notify mode change
    if (updates.mode && onModeChange) {
      onModeChange(updates.mode);
    }
  }, [config, setConfig, onModeChange]);

  /**
   * Toggle section expansion
   */
  const toggleSection = useCallback((sectionId: string) => {
    if (!config) return;
    
    const newExpanded = new Set(config.expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    
    updateConfig({ expandedSections: newExpanded });
  }, [config, updateConfig]);

  /**
   * Change panel mode
   */
  const changeMode = useCallback((mode: DebugPanelMode) => {
    updateConfig({ mode });
  }, [updateConfig]);

  /**
   * Toggle panel visibility
   */
  const toggleVisibility = useCallback(() => {
    setIsVisible(!isVisible);
  }, [isVisible]);

  /**
   * Close panel completely
   */
  const closePanel = useCallback(() => {
    setIsVisible(false);
    updateConfig({ showWelcome: false });
  }, [updateConfig]);

  /**
   * Handle manual refresh
   */
  const handleRefresh = useCallback(() => {
    refreshDebugInfo();
  }, [refreshDebugInfo]);

  // =============================================================================
  // AUTO-REFRESH EFFECT
  // =============================================================================

  useEffect(() => {
    if (!config?.autoRefresh || !config.refreshInterval) return;

    const interval = setInterval(() => {
      refreshDebugInfo();
    }, config.refreshInterval);

    return () => clearInterval(interval);
  }, [config?.autoRefresh, config?.refreshInterval, refreshDebugInfo]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  /**
   * Get position classes for floating mode
   */
  const getPositionClasses = useCallback(() => {
    if (!config) return '';
    
    switch (config.position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  }, [config]);

  /**
   * Get mode-specific classes
   */
  const getModeClasses = useCallback(() => {
    if (!config) return '';
    
    switch (config.mode) {
      case 'floating':
        return `fixed ${getPositionClasses()} z-50 max-w-md w-80`;
      case 'sidebar':
        return 'fixed top-0 right-0 z-50 h-full w-96 border-l';
      case 'fullscreen':
        return 'fixed inset-0 z-50';
      case 'minimized':
        return `fixed ${getPositionClasses()} z-50`;
      default:
        return `fixed ${getPositionClasses()} z-50 max-w-md w-80`;
    }
  }, [config, getPositionClasses]);

  /**
   * Render section content
   */
  const renderSection = useCallback((section: DebugSection) => {
    if (!config) return null;
    
    const isExpanded = config.expandedSections.has(section.id);
    const IconComponent = section.icon;
    const SectionComponent = section.component;

    return (
      <div key={section.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        {/* Section Header */}
        <button
          onClick={() => toggleSection(section.id)}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          aria-expanded={isExpanded}
          aria-controls={`debug-section-${section.id}`}
        >
          <div className="flex items-center gap-3">
            <IconComponent className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {section.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {section.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {section.badge && (
              <Badge variant="info" size="sm">
                {section.badge}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </button>

        {/* Section Content */}
        {isExpanded && (
          <div
            id={`debug-section-${section.id}`}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center p-8">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    Loading {section.title.toLowerCase()}...
                  </div>
                </div>
              }
            >
              <SectionComponent
                maxEntries={maxDebugEntries}
                enableQueryDevtools={enableQueryDevtools}
                enableDetailedMetrics={enableDetailedMetrics}
              />
            </Suspense>
          </div>
        )}
      </div>
    );
  }, [config, toggleSection, maxDebugEntries, enableQueryDevtools, enableDetailedMetrics]);

  /**
   * Render minimized mode
   */
  const renderMinimized = useCallback(() => (
    <Button
      onClick={() => changeMode('floating')}
      variant="default"
      size="md"
      className="!rounded-full !p-3 shadow-lg"
      ariaLabel="Open debug panel"
      title="Debug Panel - Click to expand"
      icon={<Bug className="h-5 w-5" />}
    >
      <Badge variant="info" size="sm" className="ml-2">
        DEV
      </Badge>
    </Button>
  ), [changeMode]);

  /**
   * Render panel header
   */
  const renderHeader = useCallback(() => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <Bug className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Debug Panel
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Development Tools
          </p>
        </div>
        <Badge variant="warning" size="sm">
          DEV ONLY
        </Badge>
      </div>

      <div className="flex items-center gap-1">
        {/* Refresh Button */}
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          className="!p-2"
          loading={isLoading}
          ariaLabel="Refresh debug information"
          title="Refresh debug information"
          icon={<RefreshCw className="h-4 w-4" />}
        />

        {/* Mode Switcher */}
        <div className="hidden sm:flex items-center gap-1">
          <Button
            onClick={() => changeMode('floating')}
            variant={config?.mode === 'floating' ? 'default' : 'ghost'}
            size="sm"
            className="!p-2"
            ariaLabel="Floating mode"
            title="Floating mode"
            icon={<Monitor className="h-4 w-4" />}
          />
          <Button
            onClick={() => changeMode('sidebar')}
            variant={config?.mode === 'sidebar' ? 'default' : 'ghost'}
            size="sm"
            className="!p-2"
            ariaLabel="Sidebar mode"
            title="Sidebar mode"
            icon={<Maximize2 className="h-4 w-4" />}
          />
        </div>

        {/* Minimize/Close */}
        <Button
          onClick={() => changeMode('minimized')}
          variant="ghost"
          size="sm"
          className="!p-2"
          ariaLabel="Minimize panel"
          title="Minimize panel"
          icon={<Minimize2 className="h-4 w-4" />}
        />
        <Button
          onClick={closePanel}
          variant="ghost"
          size="sm"
          className="!p-2 text-red-600 hover:text-red-700"
          ariaLabel="Close debug panel"
          title="Close debug panel"
          icon={<X className="h-4 w-4" />}
        />
      </div>
    </div>
  ), [config?.mode, isLoading, handleRefresh, changeMode, closePanel]);

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  // Render minimized mode
  if (config?.mode === 'minimized') {
    return (
      <div className={cn(getModeClasses(), className)}>
        {renderMinimized()}
      </div>
    );
  }

  // Main panel render
  return (
    <div
      className={cn(
        getModeClasses(),
        "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl",
        config?.mode === 'floating' && "rounded-lg",
        className
      )}
      role="complementary"
      aria-label="Debug Panel"
    >
      {/* Header */}
      {renderHeader()}

      {/* Content */}
      <div className={cn(
        "overflow-hidden",
        config?.mode === 'floating' && "max-h-[80vh]",
        config?.mode === 'sidebar' && "h-[calc(100vh-80px)]",
        config?.mode === 'fullscreen' && "h-[calc(100vh-80px)]"
      )}>
        {defaultSections.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {defaultSections.map(renderSection)}
          </div>
        ) : (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Debug Sections Available
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Debug sections will appear here when enabled
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with development notice */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3 w-3" />
            Development Environment Only
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3" />
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

DebugPanel.displayName = 'DebugPanel';

export default DebugPanel;