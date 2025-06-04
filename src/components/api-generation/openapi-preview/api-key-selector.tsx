/**
 * API Key Selector Component
 * 
 * React component for managing API key selection and copying functionality within OpenAPI 
 * documentation views. Provides dropdown interface for available API keys with preview display, 
 * copy-to-clipboard functionality, and integration with clipboard notifications.
 * 
 * Features:
 * - Headless UI Listbox component with Tailwind CSS styling
 * - React hooks for clipboard operations and state management
 * - Secure API key handling with preview truncation
 * - Toast notifications for copy confirmation
 * - Real-time API key availability using React Query
 * - Accessibility features and keyboard navigation
 * 
 * @fileoverview API key selector component extracted from Angular template patterns
 * @version 1.0.0
 * @since React 19.0.0 + Next.js 15.1
 */

'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Listbox } from '@headlessui/react';
import { ChevronDownIcon, CheckIcon, KeyIcon, ClipboardIcon, ClipboardDocumentCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import type { ApiKeyInfo } from '../types';

// ============================================================================
// Component Props & Types
// ============================================================================

/**
 * API Key Selector component props
 */
export interface ApiKeySelectorProps {
  /** Currently selected API key ID */
  readonly selectedKeyId?: string;
  /** Callback when API key selection changes */
  readonly onKeySelect?: (keyId: string | null, keyInfo: ApiKeyInfo | null) => void;
  /** Callback when API key is copied to clipboard */
  readonly onKeyCopied?: (keyId: string, success: boolean) => void;
  /** Whether the selector is disabled */
  readonly disabled?: boolean;
  /** Placeholder text when no key is selected */
  readonly placeholder?: string;
  /** Additional CSS classes */
  readonly className?: string;
  /** Whether to show the copy button */
  readonly showCopyButton?: boolean;
  /** Whether to show key preview (truncated) */
  readonly showKeyPreview?: boolean;
  /** Custom key preview length */
  readonly previewLength?: number;
  /** Whether to auto-select first available key */
  readonly autoSelectFirst?: boolean;
  /** Service ID for filtering keys (optional) */
  readonly serviceId?: string;
}

/**
 * Validation schema for API key selector props
 */
const ApiKeySelectorPropsSchema = z.object({
  selectedKeyId: z.string().optional(),
  onKeySelect: z.function().optional(),
  onKeyCopied: z.function().optional(),
  disabled: z.boolean().optional(),
  placeholder: z.string().optional(),
  className: z.string().optional(),
  showCopyButton: z.boolean().optional(),
  showKeyPreview: z.boolean().optional(),
  previewLength: z.number().min(4).max(50).optional(),
  autoSelectFirst: z.boolean().optional(),
  serviceId: z.string().optional(),
}).strict();

/**
 * Internal component state
 */
interface ComponentState {
  readonly isOpen: boolean;
  readonly copyStatus: 'idle' | 'copying' | 'success' | 'error';
  readonly lastCopiedKey: string | null;
  readonly focusedIndex: number;
}

// ============================================================================
// Hooks and Data Fetching
// ============================================================================

/**
 * Custom hook for API keys data fetching
 * Simulates the use-api-keys.ts hook functionality
 */
function useApiKeys(serviceId?: string) {
  return useQuery({
    queryKey: ['api-keys', serviceId],
    queryFn: async (): Promise<ApiKeyInfo[]> => {
      const response = await fetch(`/api/v2/system/api_key${serviceId ? `?service_id=${serviceId}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }
      const data = await response.json();
      return data.resource || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      return failureCount < 3 && error instanceof Error && error.message.includes('Failed to fetch');
    },
  });
}

/**
 * Custom hook for clipboard operations
 * Simulates the use-clipboard.ts hook functionality
 */
function useClipboard() {
  const [status, setStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      setStatus('copying');
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Use the modern Clipboard API if available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!success) {
          throw new Error('Copy command failed');
        }
      }

      setStatus('success');
      
      // Reset status after 2 seconds
      timeoutRef.current = setTimeout(() => {
        setStatus('idle');
      }, 2000);

      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setStatus('error');
      
      // Reset status after 2 seconds
      timeoutRef.current = setTimeout(() => {
        setStatus('idle');
      }, 2000);

      return false;
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { copyToClipboard, status };
}

// ============================================================================
// Toast Notification Hook
// ============================================================================

/**
 * Simple toast hook for notifications
 * Simulates toast.tsx functionality
 */
function useToast() {
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // In a real implementation, this would integrate with a toast notification system
    // For now, we'll use a simple console log and could be enhanced with a proper toast library
    const event = new CustomEvent('show-toast', {
      detail: { message, type }
    });
    window.dispatchEvent(event);
  }, []);

  return { showToast };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Truncates API key for secure display
 */
function truncateApiKey(key: string, length: number = 8): string {
  if (key.length <= length + 4) {
    return key; // Don't truncate very short keys
  }
  const start = key.substring(0, Math.floor(length / 2));
  const end = key.substring(key.length - Math.floor(length / 2));
  return `${start}...${end}`;
}

/**
 * Formats API key for display with additional metadata
 */
function formatKeyDisplay(keyInfo: ApiKeyInfo, showPreview: boolean, previewLength: number): string {
  const preview = showPreview ? ` (${truncateApiKey(keyInfo.key, previewLength)})` : '';
  const status = keyInfo.isActive ? '' : ' (Inactive)';
  const expiry = keyInfo.expiresAt 
    ? ` - Expires ${new Date(keyInfo.expiresAt).toLocaleDateString()}`
    : '';
  
  return `${keyInfo.name}${preview}${status}${expiry}`;
}

/**
 * Validates if API key is usable
 */
function isKeyUsable(keyInfo: ApiKeyInfo): boolean {
  if (!keyInfo.isActive) return false;
  if (keyInfo.expiresAt && new Date(keyInfo.expiresAt) <= new Date()) return false;
  return true;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * API Key Selector Component
 * 
 * Provides a dropdown interface for selecting API keys with copy functionality
 * and secure preview display. Integrates with OpenAPI documentation workflow.
 */
export function ApiKeySelector({
  selectedKeyId,
  onKeySelect,
  onKeyCopied,
  disabled = false,
  placeholder = 'Select an API key',
  className,
  showCopyButton = true,
  showKeyPreview = true,
  previewLength = 8,
  autoSelectFirst = false,
  serviceId,
}: ApiKeySelectorProps) {
  // Validate props
  const validationResult = ApiKeySelectorPropsSchema.safeParse({
    selectedKeyId,
    onKeySelect,
    onKeyCopied,
    disabled,
    placeholder,
    className,
    showCopyButton,
    showKeyPreview,
    previewLength,
    autoSelectFirst,
    serviceId,
  });

  if (!validationResult.success) {
    console.error('Invalid props for ApiKeySelector:', validationResult.error);
  }

  // Component state
  const [state, setState] = useState<ComponentState>({
    isOpen: false,
    copyStatus: 'idle',
    lastCopiedKey: null,
    focusedIndex: -1,
  });

  // Hooks
  const { data: apiKeys = [], isLoading, error, refetch } = useApiKeys(serviceId);
  const { copyToClipboard, status: clipboardStatus } = useClipboard();
  const { showToast } = useToast();

  // Memoized computations
  const sortedApiKeys = useMemo(() => {
    return [...apiKeys].sort((a, b) => {
      // Sort by active status first, then by name
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [apiKeys]);

  const selectedKey = useMemo(() => {
    return selectedKeyId ? sortedApiKeys.find(key => key.id === selectedKeyId) : null;
  }, [selectedKeyId, sortedApiKeys]);

  const usableKeys = useMemo(() => {
    return sortedApiKeys.filter(isKeyUsable);
  }, [sortedApiKeys]);

  // Auto-select first key if enabled and no key is selected
  useEffect(() => {
    if (autoSelectFirst && !selectedKeyId && usableKeys.length > 0) {
      const firstKey = usableKeys[0];
      onKeySelect?.(firstKey.id, firstKey);
    }
  }, [autoSelectFirst, selectedKeyId, usableKeys, onKeySelect]);

  // Handle key selection
  const handleKeySelect = useCallback((keyInfo: ApiKeyInfo | null) => {
    if (disabled) return;
    
    onKeySelect?.(keyInfo?.id || null, keyInfo);
    setState(prev => ({ ...prev, isOpen: false }));
  }, [disabled, onKeySelect]);

  // Handle copy to clipboard
  const handleCopyKey = useCallback(async (keyInfo: ApiKeyInfo, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (disabled || !showCopyButton) return;

    setState(prev => ({ 
      ...prev, 
      copyStatus: 'copying',
      lastCopiedKey: keyInfo.id 
    }));

    const success = await copyToClipboard(keyInfo.key);
    
    setState(prev => ({ 
      ...prev, 
      copyStatus: success ? 'success' : 'error',
    }));

    // Show toast notification
    showToast(
      success 
        ? `API key "${keyInfo.name}" copied to clipboard`
        : 'Failed to copy API key',
      success ? 'success' : 'error'
    );

    // Notify parent component
    onKeyCopied?.(keyInfo.id, success);

    // Reset copy status after delay
    setTimeout(() => {
      setState(prev => ({ 
        ...prev, 
        copyStatus: 'idle',
        lastCopiedKey: null 
      }));
    }, 2000);
  }, [disabled, showCopyButton, copyToClipboard, showToast, onKeyCopied]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        if (!state.isOpen) {
          setState(prev => ({ ...prev, isOpen: true }));
          event.preventDefault();
        }
        break;
      case 'Escape':
        if (state.isOpen) {
          setState(prev => ({ ...prev, isOpen: false, focusedIndex: -1 }));
          event.preventDefault();
        }
        break;
      case 'ArrowDown':
        if (state.isOpen && state.focusedIndex < sortedApiKeys.length - 1) {
          setState(prev => ({ ...prev, focusedIndex: prev.focusedIndex + 1 }));
          event.preventDefault();
        }
        break;
      case 'ArrowUp':
        if (state.isOpen && state.focusedIndex > 0) {
          setState(prev => ({ ...prev, focusedIndex: prev.focusedIndex - 1 }));
          event.preventDefault();
        }
        break;
    }
  }, [disabled, state.isOpen, state.focusedIndex, sortedApiKeys.length]);

  // Render loading state
  if (isLoading) {
    return (
      <div className={cn(
        'relative w-full',
        className
      )}>
        <div className="flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm cursor-not-allowed opacity-50 dark:bg-gray-800 dark:border-gray-600">
          <div className="flex items-center space-x-2">
            <KeyIcon className="w-4 h-4 text-gray-400 animate-pulse" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading API keys...</span>
          </div>
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={cn(
        'relative w-full',
        className
      )}>
        <div className="flex items-center justify-between w-full px-3 py-2 bg-red-50 border border-red-300 rounded-lg shadow-sm dark:bg-red-900/20 dark:border-red-700">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-400">
              Failed to load API keys
            </span>
          </div>
          <button
            onClick={() => refetch()}
            className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (sortedApiKeys.length === 0) {
    return (
      <div className={cn(
        'relative w-full',
        className
      )}>
        <div className="flex items-center justify-between w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm cursor-not-allowed dark:bg-gray-800 dark:border-gray-600">
          <div className="flex items-center space-x-2">
            <KeyIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">No API keys available</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full', className)}>
      <Listbox 
        value={selectedKey} 
        onChange={handleKeySelect}
        disabled={disabled}
      >
        <div className="relative">
          <Listbox.Button 
            className={cn(
              'relative w-full cursor-default rounded-lg py-2 pl-3 pr-10 text-left shadow-sm',
              'border border-gray-300 bg-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
              'dark:border-gray-600 dark:bg-gray-800',
              disabled && 'cursor-not-allowed opacity-50',
              'sm:text-sm'
            )}
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center space-x-2">
              <KeyIcon className={cn(
                'w-4 h-4',
                selectedKey && isKeyUsable(selectedKey) 
                  ? 'text-green-500' 
                  : 'text-gray-400'
              )} />
              <span className={cn(
                'block truncate',
                selectedKey 
                  ? 'text-gray-900 dark:text-gray-100' 
                  : 'text-gray-500 dark:text-gray-400'
              )}>
                {selectedKey 
                  ? formatKeyDisplay(selectedKey, showKeyPreview, previewLength) 
                  : placeholder
                }
              </span>
            </div>
            
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>

          <Listbox.Options className={cn(
            'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg',
            'ring-1 ring-black ring-opacity-5 focus:outline-none',
            'dark:bg-gray-800 dark:ring-gray-600',
            'sm:text-sm'
          )}>
            {sortedApiKeys.map((keyInfo) => {
              const isUsable = isKeyUsable(keyInfo);
              const isSelected = selectedKey?.id === keyInfo.id;
              const isCopying = state.copyStatus === 'copying' && state.lastCopiedKey === keyInfo.id;
              const showSuccess = state.copyStatus === 'success' && state.lastCopiedKey === keyInfo.id;

              return (
                <Listbox.Option
                  key={keyInfo.id}
                  value={keyInfo}
                  className={({ active }) => cn(
                    'relative cursor-default select-none py-2 pl-3 pr-12',
                    active 
                      ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100' 
                      : 'text-gray-900 dark:text-gray-100',
                    !isUsable && 'opacity-60'
                  )}
                  disabled={!isUsable}
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <KeyIcon className={cn(
                            'w-4 h-4 flex-shrink-0',
                            isUsable ? 'text-green-500' : 'text-red-500'
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className={cn(
                                'block truncate font-medium',
                                selected ? 'font-semibold' : 'font-normal'
                              )}>
                                {keyInfo.name}
                              </span>
                              {!keyInfo.isActive && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  Inactive
                                </span>
                              )}
                            </div>
                            
                            {showKeyPreview && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {truncateApiKey(keyInfo.key, previewLength)}
                              </div>
                            )}
                            
                            {keyInfo.expiresAt && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Expires {new Date(keyInfo.expiresAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 ml-2">
                          {showCopyButton && isUsable && (
                            <button
                              onClick={(e) => handleCopyKey(keyInfo, e)}
                              disabled={isCopying}
                              className={cn(
                                'p-1.5 rounded-md transition-colors',
                                'hover:bg-gray-100 dark:hover:bg-gray-700',
                                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                                isCopying && 'animate-pulse',
                                showSuccess && 'text-green-600 dark:text-green-400'
                              )}
                              title={`Copy ${keyInfo.name} to clipboard`}
                            >
                              {showSuccess ? (
                                <ClipboardDocumentCheckIcon className="w-4 h-4" />
                              ) : (
                                <ClipboardIcon className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {selected && (
                            <CheckIcon
                              className={cn(
                                'w-4 h-4',
                                active 
                                  ? 'text-primary-600 dark:text-primary-400' 
                                  : 'text-primary-600 dark:text-primary-400'
                              )}
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </Listbox.Option>
              );
            })}
          </Listbox.Options>
        </div>
      </Listbox>

      {/* Copy status indicator */}
      {state.copyStatus !== 'idle' && (
        <div className={cn(
          'absolute top-full mt-1 left-0 right-0 px-3 py-1 text-xs rounded-md shadow-sm',
          state.copyStatus === 'success' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          state.copyStatus === 'error' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          state.copyStatus === 'copying' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        )}>
          {state.copyStatus === 'copying' && 'Copying to clipboard...'}
          {state.copyStatus === 'success' && 'Copied to clipboard!'}
          {state.copyStatus === 'error' && 'Failed to copy'}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Component Exports and Display Name
// ============================================================================

ApiKeySelector.displayName = 'ApiKeySelector';

export default ApiKeySelector;

// Export types for external usage
export type { ApiKeySelectorProps };