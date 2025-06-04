/**
 * Debug Controls Component
 * 
 * Interactive debug controls component providing comprehensive debug data management
 * including clear, export, import, and refresh operations. Transforms Angular Material
 * button components to Tailwind CSS styled action buttons with enhanced functionality.
 * 
 * Features:
 * - Export/import debug data functionality
 * - Confirmation dialogs for destructive actions
 * - Keyboard shortcuts for common operations
 * - React Hook Form integration for configuration
 * - WCAG 2.1 AA compliance with accessibility features
 * - Integration with Next.js development APIs
 * 
 * Key Transformations:
 * - Angular click event handlers → React event handling patterns
 * - Angular Material buttons → Tailwind CSS styled components
 * - RxJS observables → React state management
 * - Angular services → React hooks and utilities
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Settings, 
  Copy,
  FileText,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn, formatBytes, formatRelativeTime, isDevelopment } from '@/lib/utils';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface DebugEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  component?: string;
  userId?: string;
}

interface DebugData {
  entries: DebugEntry[];
  metadata: {
    version: string;
    environment: string;
    timestamp: number;
    totalEntries: number;
  };
}

interface DebugActions {
  clearDebugInfo: () => Promise<void>;
  exportDebugData: () => Promise<DebugData>;
  importDebugData: (data: DebugData) => Promise<void>;
  refreshDebugData: () => Promise<void>;
  addDebugEntry: (entry: Omit<DebugEntry, 'id' | 'timestamp'>) => Promise<void>;
  getDebugStats: () => {
    totalEntries: number;
    errorCount: number;
    warningCount: number;
    lastUpdated: number;
  };
}

interface DebugUtils {
  validateDebugData: (data: any) => data is DebugData;
  formatDebugData: (data: DebugData) => string;
  parseDebugData: (content: string) => DebugData | null;
  generateDebugReport: () => Promise<string>;
  compressDebugData: (data: DebugData) => Promise<Blob>;
  decompressDebugData: (blob: Blob) => Promise<DebugData>;
}

// Mock implementations for dependencies that don't exist yet
const mockUseDebugActions = (): DebugActions => {
  return {
    clearDebugInfo: async () => {
      localStorage.removeItem('debugInfo');
      window.dispatchEvent(new CustomEvent('debugDataChanged'));
    },
    exportDebugData: async () => {
      const entries = JSON.parse(localStorage.getItem('debugInfo') || '[]');
      return {
        entries,
        metadata: {
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          timestamp: Date.now(),
          totalEntries: entries.length
        }
      };
    },
    importDebugData: async (data: DebugData) => {
      localStorage.setItem('debugInfo', JSON.stringify(data.entries));
      window.dispatchEvent(new CustomEvent('debugDataChanged'));
    },
    refreshDebugData: async () => {
      window.dispatchEvent(new CustomEvent('debugDataChanged'));
    },
    addDebugEntry: async (entry) => {
      const entries = JSON.parse(localStorage.getItem('debugInfo') || '[]');
      const newEntry: DebugEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: Date.now()
      };
      entries.push(newEntry);
      localStorage.setItem('debugInfo', JSON.stringify(entries));
      window.dispatchEvent(new CustomEvent('debugDataChanged'));
    },
    getDebugStats: () => {
      const entries: DebugEntry[] = JSON.parse(localStorage.getItem('debugInfo') || '[]');
      return {
        totalEntries: entries.length,
        errorCount: entries.filter(e => e.level === 'error').length,
        warningCount: entries.filter(e => e.level === 'warn').length,
        lastUpdated: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0
      };
    }
  };
};

const mockDebugUtils: DebugUtils = {
  validateDebugData: (data: any): data is DebugData => {
    return data && 
           Array.isArray(data.entries) && 
           data.metadata && 
           typeof data.metadata.version === 'string';
  },
  formatDebugData: (data: DebugData) => {
    return JSON.stringify(data, null, 2);
  },
  parseDebugData: (content: string) => {
    try {
      const data = JSON.parse(content);
      return mockDebugUtils.validateDebugData(data) ? data : null;
    } catch {
      return null;
    }
  },
  generateDebugReport: async () => {
    const debugActions = mockUseDebugActions();
    const data = await debugActions.exportDebugData();
    const stats = debugActions.getDebugStats();
    
    return `
Debug Report - ${new Date().toISOString()}
==========================================
Environment: ${data.metadata.environment}
Total Entries: ${stats.totalEntries}
Errors: ${stats.errorCount}
Warnings: ${stats.warningCount}
Last Updated: ${stats.lastUpdated ? new Date(stats.lastUpdated).toISOString() : 'Never'}

Data:
${JSON.stringify(data, null, 2)}
    `.trim();
  },
  compressDebugData: async (data: DebugData) => {
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString], { type: 'application/json' });
  },
  decompressDebugData: async (blob: Blob) => {
    const text = await blob.text();
    return JSON.parse(text);
  }
};

// ============================================================================
// CONFIGURATION SCHEMA
// ============================================================================

const debugConfigSchema = z.object({
  autoExport: z.boolean().default(false),
  exportFormat: z.enum(['json', 'csv', 'txt']).default('json'),
  maxEntries: z.number().min(100).max(10000).default(1000),
  retentionDays: z.number().min(1).max(30).default(7),
  enableCompression: z.boolean().default(true),
  includeMetadata: z.boolean().default(true)
});

type DebugConfig = z.infer<typeof debugConfigSchema>;

// ============================================================================
// SIMPLE DIALOG COMPONENT
// ============================================================================

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, title, description, children }) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      dialogRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        role="dialog"
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="dialog-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {description && (
          <p id="dialog-description" className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>
        )}
        
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const DebugControls: React.FC = () => {
  // Only render in development environment for security
  if (!isDevelopment()) {
    return null;
  }

  // ============================================================================
  // HOOKS AND STATE
  // ============================================================================

  const debugActions = mockUseDebugActions();
  const [isLoading, setIsLoading] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugStats, setDebugStats] = useState(debugActions.getDebugStats());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form for debug configuration
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<DebugConfig>({
    resolver: zodResolver(debugConfigSchema),
    defaultValues: {
      autoExport: false,
      exportFormat: 'json',
      maxEntries: 1000,
      retentionDays: 7,
      enableCompression: true,
      includeMetadata: true
    }
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    const updateStats = () => {
      setDebugStats(debugActions.getDebugStats());
    };

    window.addEventListener('debugDataChanged', updateStats);
    return () => window.removeEventListener('debugDataChanged', updateStats);
  }, [debugActions]);

  useEffect(() => {
    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('debugConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        reset(config);
      } catch (error) {
        console.warn('Failed to load debug config:', error);
      }
    }
  }, [reset]);

  useEffect(() => {
    // Auto-hide success messages
    if (showSuccessMessage) {
      const timer = setTimeout(() => setShowSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  useEffect(() => {
    // Auto-hide error messages
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when no input is focused
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'e':
            e.preventDefault();
            handleExport();
            break;
          case 'i':
            e.preventDefault();
            handleImportClick();
            break;
          case 'r':
            e.preventDefault();
            handleRefresh();
            break;
          case 'delete':
            e.preventDefault();
            setShowClearDialog(true);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleClear = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await debugActions.clearDebugInfo();
      setShowClearDialog(false);
      setShowSuccessMessage('Debug data cleared successfully');
      
      // Add a log entry for the clear action
      await debugActions.addDebugEntry({
        level: 'info',
        message: 'Debug data cleared by user',
        component: 'DebugControls'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear debug data');
    } finally {
      setIsLoading(false);
    }
  }, [debugActions]);

  const handleExport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await debugActions.exportDebugData();
      const config = watch();
      
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (config.exportFormat) {
        case 'csv':
          content = data.entries.map(entry => 
            `"${new Date(entry.timestamp).toISOString()}","${entry.level}","${entry.component || ''}","${entry.message.replace(/"/g, '""')}"`
          ).join('\n');
          content = 'Timestamp,Level,Component,Message\n' + content;
          filename = `debug-data-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        
        case 'txt':
          content = await mockDebugUtils.generateDebugReport();
          filename = `debug-report-${new Date().toISOString().split('T')[0]}.txt`;
          mimeType = 'text/plain';
          break;
        
        default:
          content = mockDebugUtils.formatDebugData(data);
          filename = `debug-data-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowSuccessMessage(`Debug data exported as ${config.exportFormat.toUpperCase()}`);
      
      // Log the export action
      await debugActions.addDebugEntry({
        level: 'info',
        message: `Debug data exported as ${config.exportFormat}`,
        component: 'DebugControls',
        data: { format: config.exportFormat, entriesCount: data.entries.length }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export debug data');
    } finally {
      setIsLoading(false);
    }
  }, [debugActions, watch]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const data = mockDebugUtils.parseDebugData(content);
      
      if (!data) {
        throw new Error('Invalid debug data format');
      }

      await debugActions.importDebugData(data);
      setShowSuccessMessage(`Imported ${data.entries.length} debug entries`);
      
      // Log the import action
      await debugActions.addDebugEntry({
        level: 'info',
        message: `Debug data imported from file: ${file.name}`,
        component: 'DebugControls',
        data: { filename: file.name, entriesCount: data.entries.length }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import debug data');
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [debugActions]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await debugActions.refreshDebugData();
      setShowSuccessMessage('Debug data refreshed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh debug data');
    } finally {
      setIsLoading(false);
    }
  }, [debugActions]);

  const handleCopyStats = useCallback(async () => {
    try {
      const statsText = `Debug Stats:
Total Entries: ${debugStats.totalEntries}
Errors: ${debugStats.errorCount}
Warnings: ${debugStats.warningCount}
Last Updated: ${debugStats.lastUpdated ? formatRelativeTime(debugStats.lastUpdated) : 'Never'}`;
      
      await navigator.clipboard.writeText(statsText);
      setShowSuccessMessage('Stats copied to clipboard');
    } catch (err) {
      setError('Failed to copy stats');
    }
  }, [debugStats]);

  const onConfigSubmit = useCallback((data: DebugConfig) => {
    localStorage.setItem('debugConfig', JSON.stringify(data));
    setShowConfigDialog(false);
    setShowSuccessMessage('Configuration saved');
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Debug Controls
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {debugStats.totalEntries} entries
        </div>
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {debugStats.totalEntries}
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <div className="text-xs text-red-600 dark:text-red-400">Errors</div>
          <div className="text-lg font-semibold text-red-700 dark:text-red-300">
            {debugStats.errorCount}
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
          <div className="text-xs text-yellow-600 dark:text-yellow-400">Warnings</div>
          <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
            {debugStats.warningCount}
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-xs text-blue-600 dark:text-blue-400">Updated</div>
          <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {debugStats.lastUpdated ? formatRelativeTime(debugStats.lastUpdated) : 'Never'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          onClick={handleExport}
          disabled={isLoading || debugStats.totalEntries === 0}
          variant="default"
          size="sm"
          leftIcon={<Download className="h-4 w-4" />}
          title="Export debug data (Ctrl+E)"
        >
          Export
        </Button>

        <Button
          onClick={handleImportClick}
          disabled={isLoading}
          variant="outline"
          size="sm"
          leftIcon={<Upload className="h-4 w-4" />}
          title="Import debug data (Ctrl+I)"
        >
          Import
        </Button>

        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />}
          title="Refresh debug data (Ctrl+R)"
        >
          Refresh
        </Button>

        <Button
          onClick={handleCopyStats}
          disabled={isLoading}
          variant="ghost"
          size="sm"
          leftIcon={<Copy className="h-4 w-4" />}
          title="Copy stats to clipboard"
        >
          Copy Stats
        </Button>

        <Button
          onClick={() => setShowConfigDialog(true)}
          disabled={isLoading}
          variant="ghost"
          size="sm"
          leftIcon={<Settings className="h-4 w-4" />}
          title="Configure debug settings"
        >
          Config
        </Button>

        <Button
          onClick={() => setShowClearDialog(true)}
          disabled={isLoading || debugStats.totalEntries === 0}
          variant="destructive"
          size="sm"
          leftIcon={<Trash2 className="h-4 w-4" />}
          title="Clear all debug data (Ctrl+Delete)"
        >
          Clear All
        </Button>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-3">
        <strong>Shortcuts:</strong> Ctrl+E (Export), Ctrl+I (Import), Ctrl+R (Refresh), Ctrl+Del (Clear)
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{showSuccessMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.txt,.csv"
        onChange={handleImport}
        className="hidden"
        aria-label="Import debug data file"
      />

      {/* Clear Confirmation Dialog */}
      <Dialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Clear Debug Data"
        description="This action cannot be undone. All debug entries will be permanently deleted."
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">
              You are about to delete {debugStats.totalEntries} debug entries.
            </span>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClear}
              loading={isLoading}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Clear All Data
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        title="Debug Configuration"
        description="Configure debug data export and management settings."
      >
        <form onSubmit={handleSubmit(onConfigSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Export Format
            </label>
            <select
              {...register('exportFormat')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="txt">Text Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Entries
            </label>
            <input
              type="number"
              {...register('maxEntries', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              min="100"
              max="10000"
              step="100"
            />
            {errors.maxEntries && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.maxEntries.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Retention (days)
            </label>
            <input
              type="number"
              {...register('retentionDays', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              min="1"
              max="30"
            />
            {errors.retentionDays && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.retentionDays.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('autoExport')}
                id="autoExport"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="autoExport" className="text-sm text-gray-700 dark:text-gray-300">
                Auto-export on threshold
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('enableCompression')}
                id="enableCompression"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="enableCompression" className="text-sm text-gray-700 dark:text-gray-300">
                Enable compression
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('includeMetadata')}
                id="includeMetadata"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="includeMetadata" className="text-sm text-gray-700 dark:text-gray-300">
                Include metadata
              </label>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfigDialog(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Save Configuration
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default DebugControls;