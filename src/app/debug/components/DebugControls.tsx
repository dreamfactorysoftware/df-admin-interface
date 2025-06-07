'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogClose 
} from '@/components/ui/dialog';
import { 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Settings, 
  Copy,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';

// Types for debug actions and state management
interface DebugAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  shortcut?: string;
  description: string;
  requiresConfirmation: boolean;
  action: () => Promise<void> | void;
}

interface DebugState {
  isLoading: boolean;
  lastAction: string | null;
  actionCount: number;
  errors: string[];
  successes: string[];
}

interface ConfirmationDialog {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  action: (() => Promise<void> | void) | null;
  variant: 'default' | 'destructive';
}

interface ExportImportDialog {
  isOpen: boolean;
  mode: 'export' | 'import' | null;
}

/**
 * Debug controls component providing interactive actions for debug data management
 * including clear, export, import, and refresh operations with confirmation dialogs
 * and keyboard shortcuts for enhanced developer productivity.
 * 
 * Implements WCAG 2.1 AA accessibility standards with proper ARIA labeling,
 * keyboard navigation, and screen reader support.
 */
export default function DebugControls() {
  // State management for debug operations
  const [debugState, setDebugState] = useState<DebugState>({
    isLoading: false,
    lastAction: null,
    actionCount: 0,
    errors: [],
    successes: []
  });

  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: '',
    action: null,
    variant: 'default'
  });

  const [exportImportDialog, setExportImportDialog] = useState<ExportImportDialog>({
    isOpen: false,
    mode: null
  });

  // Debug utilities (would normally be imported from lib/debug-utils.ts)
  const debugUtils = useMemo(() => ({
    async clearDebugData(): Promise<void> {
      try {
        // Clear localStorage debug entries
        const keys = Object.keys(localStorage).filter(key => 
          key.startsWith('debug_') || 
          key.startsWith('df_debug_') ||
          key.includes('_debug')
        );
        
        keys.forEach(key => localStorage.removeItem(key));
        
        // Clear React Query cache for debug-related queries
        if (typeof window !== 'undefined' && (window as any).queryClient) {
          await (window as any).queryClient.clear();
        }
        
        // Clear session storage debug data
        const sessionKeys = Object.keys(sessionStorage).filter(key => 
          key.startsWith('debug_') || key.includes('_debug')
        );
        sessionKeys.forEach(key => sessionStorage.removeItem(key));

        console.log('Debug data cleared successfully');
      } catch (error) {
        console.error('Failed to clear debug data:', error);
        throw new Error('Failed to clear debug data');
      }
    },

    async exportDebugData(): Promise<void> {
      try {
        const debugData = {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          localStorage: {} as Record<string, any>,
          sessionStorage: {} as Record<string, any>,
          reactQueryCache: null as any,
          nextjsMetrics: null as any,
          userAgent: navigator.userAgent,
          url: window.location.href
        };

        // Collect localStorage debug data
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('debug_') || key.includes('_debug')) {
            try {
              debugData.localStorage[key] = JSON.parse(localStorage.getItem(key) || '{}');
            } catch {
              debugData.localStorage[key] = localStorage.getItem(key);
            }
          }
        });

        // Collect sessionStorage debug data
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('debug_') || key.includes('_debug')) {
            try {
              debugData.sessionStorage[key] = JSON.parse(sessionStorage.getItem(key) || '{}');
            } catch {
              debugData.sessionStorage[key] = sessionStorage.getItem(key);
            }
          }
        });

        // Collect React Query cache data if available
        if (typeof window !== 'undefined' && (window as any).queryClient) {
          debugData.reactQueryCache = (window as any).queryClient.getQueryCache().getAll().map((query: any) => ({
            queryKey: query.queryKey,
            state: query.state,
            dataUpdatedAt: query.dataUpdatedAt
          }));
        }

        // Create and download file
        const blob = new Blob([JSON.stringify(debugData, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `debug-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('Debug data exported successfully');
      } catch (error) {
        console.error('Failed to export debug data:', error);
        throw new Error('Failed to export debug data');
      }
    },

    async refreshDebugInfo(): Promise<void> {
      try {
        // Trigger React Query refetch for debug queries
        if (typeof window !== 'undefined' && (window as any).queryClient) {
          await (window as any).queryClient.invalidateQueries({
            predicate: (query: any) => 
              query.queryKey.some((key: string) => 
                typeof key === 'string' && key.includes('debug')
              )
          });
        }

        // Trigger window storage event for localStorage updates
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'debug_refresh',
          newValue: Date.now().toString()
        }));

        console.log('Debug info refreshed successfully');
      } catch (error) {
        console.error('Failed to refresh debug info:', error);
        throw new Error('Failed to refresh debug info');
      }
    },

    async copyDebugToClipboard(): Promise<void> {
      try {
        const debugInfo = {
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          localStorage: Object.keys(localStorage).filter(key => 
            key.startsWith('debug_') || key.includes('_debug')
          ).reduce((acc, key) => {
            acc[key] = localStorage.getItem(key);
            return acc;
          }, {} as Record<string, string | null>)
        };

        await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
        console.log('Debug info copied to clipboard');
      } catch (error) {
        console.error('Failed to copy debug info:', error);
        throw new Error('Failed to copy debug info to clipboard');
      }
    }
  }), []);

  // Debug action handlers with loading state management
  const executeAction = useCallback(async (
    actionId: string,
    action: () => Promise<void> | void
  ) => {
    setDebugState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await action();
      setDebugState(prev => ({
        ...prev,
        isLoading: false,
        lastAction: actionId,
        actionCount: prev.actionCount + 1,
        successes: [...prev.successes, `${actionId} completed successfully`],
        errors: prev.errors.filter((_, index) => index < 4) // Keep last 5 errors
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setDebugState(prev => ({
        ...prev,
        isLoading: false,
        errors: [errorMessage, ...prev.errors].slice(0, 5) // Keep last 5 errors
      }));
    }
  }, []);

  // Define debug actions with enhanced functionality
  const debugActions = useMemo<DebugAction[]>(() => [
    {
      id: 'refresh',
      label: 'Refresh Debug Info',
      icon: RotateCcw,
      variant: 'default',
      shortcut: 'Ctrl+R',
      description: 'Refresh all debug information and invalidate cached data',
      requiresConfirmation: false,
      action: () => executeAction('refresh', debugUtils.refreshDebugInfo)
    },
    {
      id: 'export',
      label: 'Export Debug Data',
      icon: Download,
      variant: 'secondary',
      shortcut: 'Ctrl+E',
      description: 'Export all debug data to JSON file for analysis',
      requiresConfirmation: false,
      action: () => {
        setExportImportDialog({ isOpen: true, mode: 'export' });
      }
    },
    {
      id: 'copy',
      label: 'Copy to Clipboard',
      icon: Copy,
      variant: 'outline',
      shortcut: 'Ctrl+C',
      description: 'Copy current debug information to clipboard',
      requiresConfirmation: false,
      action: () => executeAction('copy', debugUtils.copyDebugToClipboard)
    },
    {
      id: 'clear',
      label: 'Clear Debug Data',
      icon: Trash2,
      variant: 'destructive',
      shortcut: 'Ctrl+Shift+Del',
      description: 'Clear all debug data from localStorage and cache',
      requiresConfirmation: true,
      action: () => executeAction('clear', debugUtils.clearDebugData)
    },
    {
      id: 'devtools',
      label: 'Open DevTools',
      icon: ExternalLink,
      variant: 'ghost',
      shortcut: 'F12',
      description: 'Open browser developer tools for advanced debugging',
      requiresConfirmation: false,
      action: () => {
        // Note: This would typically open React Query DevTools or similar
        console.log('DevTools action - would open React Query DevTools or similar');
        if (typeof window !== 'undefined') {
          // Trigger any DevTools opening logic here
          window.dispatchEvent(new CustomEvent('debug:open-devtools'));
        }
      }
    }
  ], [executeAction, debugUtils]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (process.env.NODE_ENV !== 'development') return;

      const action = debugActions.find(action => {
        if (!action.shortcut) return false;
        
        const parts = action.shortcut.split('+');
        const key = parts[parts.length - 1];
        const needsCtrl = parts.includes('Ctrl');
        const needsShift = parts.includes('Shift');

        return (
          event.key === key &&
          event.ctrlKey === needsCtrl &&
          event.shiftKey === needsShift
        );
      });

      if (action) {
        event.preventDefault();
        handleActionClick(action);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [debugActions]);

  // Action click handler with confirmation logic
  const handleActionClick = useCallback((action: DebugAction) => {
    if (action.requiresConfirmation) {
      setConfirmDialog({
        isOpen: true,
        title: `Confirm ${action.label}`,
        description: `Are you sure you want to ${action.label.toLowerCase()}? ${action.description}`,
        confirmText: action.label,
        action: action.action,
        variant: action.variant === 'destructive' ? 'destructive' : 'default'
      });
    } else {
      action.action();
    }
  }, []);

  // Confirmation dialog handlers
  const handleConfirmAction = useCallback(async () => {
    if (confirmDialog.action) {
      await confirmDialog.action();
    }
    setConfirmDialog(prev => ({ ...prev, isOpen: false, action: null }));
  }, [confirmDialog.action]);

  const handleCancelConfirmation = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false, action: null }));
  }, []);

  // Export dialog handler
  const handleExportData = useCallback(async () => {
    await executeAction('export', debugUtils.exportDebugData);
    setExportImportDialog({ isOpen: false, mode: null });
  }, [executeAction, debugUtils]);

  // Clear old messages
  useEffect(() => {
    const interval = setInterval(() => {
      setDebugState(prev => ({
        ...prev,
        errors: prev.errors.slice(0, 3),
        successes: prev.successes.slice(0, 3)
      }));
    }, 10000); // Clear old messages every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div 
      className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
      role="region"
      aria-label="Debug Controls"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Debug Controls
        </h3>
        {debugState.isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            Processing...
          </div>
        )}
      </div>

      {/* Status Messages */}
      {debugState.errors.length > 0 && (
        <div className="space-y-2">
          {debugState.errors.map((error, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 p-2 text-sm text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
              role="alert"
              aria-live="polite"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          ))}
        </div>
      )}

      {debugState.successes.length > 0 && (
        <div className="space-y-2">
          {debugState.successes.slice(0, 2).map((success, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 p-2 text-sm text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {debugActions.map((action) => {
          const IconComponent = action.icon;
          return (
            <Button
              key={action.id}
              variant={action.variant}
              onClick={() => handleActionClick(action)}
              disabled={debugState.isLoading}
              className="flex items-center gap-2 h-auto p-3 text-left justify-start"
              title={`${action.description}${action.shortcut ? ` (${action.shortcut})` : ''}`}
              aria-label={`${action.label}. ${action.description}${action.shortcut ? `. Keyboard shortcut: ${action.shortcut}` : ''}`}
            >
              <IconComponent className="h-4 w-4 flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span className="font-medium">{action.label}</span>
                {action.shortcut && (
                  <span className="text-xs opacity-70">{action.shortcut}</span>
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {/* Stats */}
      {debugState.actionCount > 0 && (
        <div className="flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Info className="h-4 w-4" />
            Actions performed: {debugState.actionCount}
          </div>
          {debugState.lastAction && (
            <div>Last action: {debugState.lastAction}</div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={handleCancelConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.variant === 'destructive' && (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" onClick={handleCancelConfirmation}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant={confirmDialog.variant}
              onClick={handleConfirmAction}
              disabled={debugState.isLoading}
            >
              {debugState.isLoading ? 'Processing...' : confirmDialog.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export/Import Dialog */}
      <Dialog 
        open={exportImportDialog.isOpen} 
        onOpenChange={() => setExportImportDialog({ isOpen: false, mode: null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Debug Data
            </DialogTitle>
            <DialogDescription>
              This will download a JSON file containing all debug information including
              localStorage data, React Query cache status, and application state.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Export includes:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>LocalStorage debug entries</li>
                  <li>SessionStorage debug data</li>
                  <li>React Query cache state</li>
                  <li>Application environment info</li>
                  <li>Current page context</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleExportData} disabled={debugState.isLoading}>
              {debugState.isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}