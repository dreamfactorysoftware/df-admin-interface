/**
 * @fileoverview React popup management service replacing Angular PopupOverlayService
 * 
 * Provides usePopup hook for programmatic popup control with promise-based workflows,
 * automatic cleanup, and context management. Implements popup state management using
 * React context and handles backdrop click behavior, escape key handling, and focus
 * restoration. Supports configuration injection and maintains service-like API for
 * easy migration from Angular patterns.
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 */

import { 
  createContext, 
  useContext, 
  useCallback, 
  useEffect, 
  useRef, 
  useState,
  ReactNode,
  ComponentType,
  PropsWithChildren
} from 'react';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Popup configuration interface replacing Angular POPUP_CONFIG injection token
 */
export interface PopupConfig {
  /** Maximum number of popups that can be open simultaneously */
  maxStack?: number;
  /** Default animation duration in milliseconds */
  animationDuration?: number;
  /** Whether to close popup on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Whether to close popup on escape key press */
  closeOnEscapeKey?: boolean;
  /** Whether to restore focus to previous element when popup closes */
  restoreFocus?: boolean;
  /** Default z-index for popups */
  zIndex?: number;
  /** Scroll strategy when popup is open */
  scrollStrategy?: 'block' | 'reposition' | 'close';
}

/**
 * Popup position configuration matching Angular CDK Overlay positioning
 */
export interface PopupPosition {
  /** Horizontal alignment */
  horizontal?: 'start' | 'center' | 'end';
  /** Vertical alignment */
  vertical?: 'start' | 'center' | 'end';
  /** Custom offset from alignment position */
  offsetX?: number;
  /** Custom offset from alignment position */
  offsetY?: number;
}

/**
 * Popup size configuration
 */
export interface PopupSize {
  /** Width of the popup */
  width?: string | number;
  /** Height of the popup */
  height?: string | number;
  /** Minimum width */
  minWidth?: string | number;
  /** Minimum height */
  minHeight?: string | number;
  /** Maximum width */
  maxWidth?: string | number;
  /** Maximum height */
  maxHeight?: string | number;
}

/**
 * Popup options for opening a popup instance
 */
export interface PopupOptions {
  /** Popup position configuration */
  position?: PopupPosition;
  /** Popup size configuration */
  size?: PopupSize;
  /** Custom CSS classes to apply */
  className?: string;
  /** Whether popup has backdrop */
  hasBackdrop?: boolean;
  /** Custom backdrop CSS classes */
  backdropClass?: string;
  /** Whether to close on backdrop click (overrides global config) */
  closeOnBackdropClick?: boolean;
  /** Whether to close on escape key (overrides global config) */
  closeOnEscapeKey?: boolean;
  /** Whether to restore focus (overrides global config) */
  restoreFocus?: boolean;
  /** Custom z-index for this popup */
  zIndex?: number;
  /** Animation configuration */
  animation?: {
    /** Enter animation duration */
    enterDuration?: number;
    /** Exit animation duration */
    exitDuration?: number;
    /** Custom enter animation classes */
    enterClass?: string;
    /** Custom exit animation classes */
    exitClass?: string;
  };
  /** Accessibility configuration */
  a11y?: {
    /** ARIA role */
    role?: string;
    /** ARIA label */
    ariaLabel?: string;
    /** ARIA labelledby */
    ariaLabelledBy?: string;
    /** ARIA describedby */
    ariaDescribedBy?: string;
  };
  /** Data to pass to popup component */
  data?: any;
}

/**
 * Popup reference interface for managing individual popup instances
 */
export interface PopupRef<T = any> {
  /** Unique ID of the popup instance */
  id: string;
  /** Close the popup with optional result data */
  close: (result?: T) => void;
  /** Promise that resolves when popup closes */
  afterClosed: () => Promise<T | undefined>;
  /** Observable-like subscription to popup close events */
  onClose: (callback: (result?: T) => void) => () => void;
  /** Update popup configuration */
  updateConfig: (options: Partial<PopupOptions>) => void;
  /** Get current popup configuration */
  getConfig: () => PopupOptions;
  /** Check if popup is currently open */
  isOpen: () => boolean;
}

/**
 * Popup instance internal state
 */
interface PopupInstance {
  id: string;
  component: ComponentType<any> | ReactNode;
  options: PopupOptions;
  data?: any;
  isOpen: boolean;
  isClosing: boolean;
  previousActiveElement?: Element | null;
  closePromise?: Promise<any>;
  closeResolve?: (result?: any) => void;
  closeReject?: (error?: any) => void;
  closeCallbacks: Set<(result?: any) => void>;
}

/**
 * Popup context value interface
 */
interface PopupContextValue {
  /** Current popup instances */
  popups: PopupInstance[];
  /** Open a new popup */
  openPopup: <T = any>(
    component: ComponentType<any> | ReactNode,
    options?: PopupOptions
  ) => PopupRef<T>;
  /** Close a specific popup */
  closePopup: (id: string, result?: any) => void;
  /** Close all popups */
  closeAllPopups: () => void;
  /** Get popup by ID */
  getPopup: (id: string) => PopupInstance | undefined;
  /** Configuration */
  config: PopupConfig;
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

/**
 * Default popup configuration matching Angular CDK Overlay defaults
 */
const defaultConfig: PopupConfig = {
  maxStack: 5,
  animationDuration: 300,
  closeOnBackdropClick: true,
  closeOnEscapeKey: true,
  restoreFocus: true,
  zIndex: 1040,
  scrollStrategy: 'block'
};

/**
 * Default popup options
 */
const defaultOptions: PopupOptions = {
  position: {
    horizontal: 'center',
    vertical: 'center'
  },
  hasBackdrop: true,
  closeOnBackdropClick: true,
  closeOnEscapeKey: true,
  restoreFocus: true,
  a11y: {
    role: 'dialog',
    ariaLabel: 'Popup dialog'
  }
};

// =============================================================================
// POPUP CONTEXT
// =============================================================================

/**
 * React context for popup state management
 */
const PopupContext = createContext<PopupContextValue | null>(null);

/**
 * Hook to access popup context with error handling
 */
const usePopupContext = (): PopupContextValue => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error(
      'usePopupContext must be used within a PopupProvider. ' +
      'Ensure your component is wrapped with <PopupProvider>.'
    );
  }
  return context;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate unique popup ID
 */
const generatePopupId = (): string => {
  return `popup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Merge popup options with defaults
 */
const mergeOptions = (options?: PopupOptions): PopupOptions => {
  return {
    ...defaultOptions,
    ...options,
    position: {
      ...defaultOptions.position,
      ...options?.position
    },
    animation: {
      enterDuration: defaultConfig.animationDuration,
      exitDuration: defaultConfig.animationDuration,
      ...options?.animation
    },
    a11y: {
      ...defaultOptions.a11y,
      ...options?.a11y
    }
  };
};

/**
 * Get the currently active (focused) element
 */
const getActiveElement = (): Element | null => {
  return document.activeElement;
};

/**
 * Restore focus to an element safely
 */
const restoreFocus = (element: Element | null): void => {
  if (element && typeof (element as any).focus === 'function') {
    try {
      (element as any).focus();
    } catch (error) {
      console.warn('Failed to restore focus:', error);
    }
  }
};

// =============================================================================
// POPUP PROVIDER COMPONENT
// =============================================================================

/**
 * Props for PopupProvider component
 */
export interface PopupProviderProps extends PropsWithChildren {
  /** Custom popup configuration */
  config?: Partial<PopupConfig>;
}

/**
 * PopupProvider component for application-wide popup state management
 * 
 * This provider should be placed high in the component tree, typically
 * in the app layout or root component, to ensure popup state is available
 * throughout the application.
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <PopupProvider config={{ maxStack: 3, closeOnBackdropClick: true }}>
 *       <Router>
 *         <Routes>
 *           // Your app routes
 *         </Routes>
 *       </Router>
 *     </PopupProvider>
 *   );
 * }
 * ```
 */
export const PopupProvider: React.FC<PopupProviderProps> = ({ 
  children, 
  config: userConfig = {} 
}) => {
  // Merge user config with defaults
  const config = { ...defaultConfig, ...userConfig };
  
  // Popup instances state
  const [popups, setPopups] = useState<PopupInstance[]>([]);
  
  // Refs for cleanup
  const keydownHandlerRef = useRef<((event: KeyboardEvent) => void) | null>(null);
  const scrollHandlerRef = useRef<(() => void) | null>(null);

  /**
   * Open a new popup instance
   */
  const openPopup = useCallback(<T = any>(
    component: ComponentType<any> | ReactNode,
    options?: PopupOptions
  ): PopupRef<T> => {
    const id = generatePopupId();
    const mergedOptions = mergeOptions(options);
    const previousActiveElement = config.restoreFocus ? getActiveElement() : null;

    // Create close promise for async workflows
    let closeResolve: (result?: T) => void;
    let closeReject: (error?: any) => void;
    const closePromise = new Promise<T | undefined>((resolve, reject) => {
      closeResolve = resolve;
      closeReject = reject;
    });

    // Create popup instance
    const instance: PopupInstance = {
      id,
      component,
      options: mergedOptions,
      data: mergedOptions.data,
      isOpen: true,
      isClosing: false,
      previousActiveElement,
      closePromise,
      closeResolve: closeResolve!,
      closeReject: closeReject!,
      closeCallbacks: new Set()
    };

    // Add to popups stack
    setPopups(prevPopups => {
      // Respect max stack limit
      const newPopups = [...prevPopups, instance];
      if (config.maxStack && newPopups.length > config.maxStack) {
        // Close oldest popup if stack limit exceeded
        const oldestPopup = newPopups.shift();
        if (oldestPopup && !oldestPopup.isClosing) {
          oldestPopup.closeResolve?.(undefined);
        }
      }
      return newPopups;
    });

    // Create popup reference object
    const popupRef: PopupRef<T> = {
      id,
      close: (result?: T) => closePopup(id, result),
      afterClosed: () => closePromise,
      onClose: (callback: (result?: T) => void) => {
        instance.closeCallbacks.add(callback);
        return () => instance.closeCallbacks.delete(callback);
      },
      updateConfig: (newOptions: Partial<PopupOptions>) => {
        setPopups(prevPopups =>
          prevPopups.map(popup =>
            popup.id === id
              ? { ...popup, options: { ...popup.options, ...newOptions } }
              : popup
          )
        );
      },
      getConfig: () => instance.options,
      isOpen: () => {
        return popups.some(popup => popup.id === id && popup.isOpen);
      }
    };

    return popupRef;
  }, [config, popups]);

  /**
   * Close a specific popup instance
   */
  const closePopup = useCallback((id: string, result?: any) => {
    setPopups(prevPopups => {
      const popup = prevPopups.find(p => p.id === id);
      if (!popup || popup.isClosing) {
        return prevPopups;
      }

      // Mark as closing
      const updatedPopups = prevPopups.map(p =>
        p.id === id ? { ...p, isClosing: true } : p
      );

      // Handle async close workflow
      setTimeout(() => {
        // Restore focus if configured
        if (popup.options.restoreFocus && popup.previousActiveElement) {
          restoreFocus(popup.previousActiveElement);
        }

        // Notify close callbacks
        popup.closeCallbacks.forEach(callback => {
          try {
            callback(result);
          } catch (error) {
            console.error('Error in popup close callback:', error);
          }
        });

        // Resolve close promise
        popup.closeResolve?.(result);

        // Remove from stack
        setPopups(currentPopups => 
          currentPopups.filter(p => p.id !== id)
        );
      }, popup.options.animation?.exitDuration || config.animationDuration);

      return updatedPopups;
    });
  }, [config.animationDuration]);

  /**
   * Close all popup instances
   */
  const closeAllPopups = useCallback(() => {
    popups.forEach(popup => {
      if (!popup.isClosing) {
        closePopup(popup.id);
      }
    });
  }, [popups, closePopup]);

  /**
   * Get popup instance by ID
   */
  const getPopup = useCallback((id: string): PopupInstance | undefined => {
    return popups.find(popup => popup.id === id);
  }, [popups]);

  // Setup global keyboard event handling for escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && popups.length > 0) {
        // Find the topmost popup that allows escape key closing
        const topPopup = popups[popups.length - 1];
        if (topPopup && !topPopup.isClosing && 
            (topPopup.options.closeOnEscapeKey ?? config.closeOnEscapeKey)) {
          event.preventDefault();
          closePopup(topPopup.id);
        }
      }
    };

    keydownHandlerRef.current = handleKeyDown;
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (keydownHandlerRef.current) {
        document.removeEventListener('keydown', keydownHandlerRef.current);
        keydownHandlerRef.current = null;
      }
    };
  }, [popups, config.closeOnEscapeKey, closePopup]);

  // Setup scroll strategy handling
  useEffect(() => {
    if (popups.length > 0 && config.scrollStrategy === 'block') {
      // Block page scrolling when popups are open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [popups.length, config.scrollStrategy]);

  // Setup scroll position monitoring for reposition strategy
  useEffect(() => {
    if (popups.length > 0 && config.scrollStrategy === 'reposition') {
      const handleScroll = () => {
        // Trigger popup position recalculation
        // This would be implemented in the popup rendering component
        popups.forEach(popup => {
          if (!popup.isClosing) {
            // Dispatch custom event for position update
            window.dispatchEvent(new CustomEvent(`popup-reposition-${popup.id}`));
          }
        });
      };

      scrollHandlerRef.current = handleScroll;
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll, { passive: true });

      return () => {
        if (scrollHandlerRef.current) {
          window.removeEventListener('scroll', scrollHandlerRef.current);
          window.removeEventListener('resize', scrollHandlerRef.current);
          scrollHandlerRef.current = null;
        }
      };
    }
  }, [popups, config.scrollStrategy]);

  // Close all popups on unmount
  useEffect(() => {
    return () => {
      popups.forEach(popup => {
        if (!popup.isClosing) {
          popup.closeResolve?.(undefined);
        }
      });
    };
  }, []);

  // Context value
  const contextValue: PopupContextValue = {
    popups,
    openPopup,
    closePopup,
    closeAllPopups,
    getPopup,
    config
  };

  return (
    <PopupContext.Provider value={contextValue}>
      {children}
    </PopupContext.Provider>
  );
};

// =============================================================================
// MAIN POPUP HOOK
// =============================================================================

/**
 * Hook for programmatic popup management
 * 
 * This hook provides a service-like API similar to Angular's PopupOverlayService
 * but adapted for React patterns with promise-based workflows and automatic cleanup.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const popup = usePopup();
 * 
 *   const handleOpenDialog = async () => {
 *     try {
 *       const result = await popup.open(MyDialogComponent, {
 *         data: { title: 'Confirm Action' },
 *         closeOnBackdropClick: false
 *       }).afterClosed();
 *       
 *       if (result) {
 *         console.log('User confirmed:', result);
 *       }
 *     } catch (error) {
 *       console.error('Dialog error:', error);
 *     }
 *   };
 * 
 *   return (
 *     <button onClick={handleOpenDialog}>
 *       Open Dialog
 *     </button>
 *   );
 * }
 * ```
 */
export const usePopup = () => {
  const context = usePopupContext();

  return {
    /**
     * Open a popup with the specified component and options
     * @param component React component or JSX element to render in popup
     * @param options Configuration options for the popup
     * @returns PopupRef for managing the popup instance
     */
    open: context.openPopup,

    /**
     * Close a specific popup by ID
     * @param id Popup instance ID
     * @param result Optional result data to pass to close handlers
     */
    close: context.closePopup,

    /**
     * Close all currently open popups
     */
    closeAll: context.closeAllPopups,

    /**
     * Get popup instance by ID
     * @param id Popup instance ID
     * @returns Popup instance or undefined if not found
     */
    get: context.getPopup,

    /**
     * Get current popup configuration
     */
    getConfig: () => context.config,

    /**
     * Check if any popups are currently open
     */
    hasOpenPopups: () => context.popups.length > 0,

    /**
     * Get count of currently open popups
     */
    getOpenCount: () => context.popups.length
  };
};

// =============================================================================
// CONVENIENCE HOOKS AND UTILITIES
// =============================================================================

/**
 * Hook for popup queue management
 * 
 * Provides utilities for managing multiple popups in sequence
 */
export const usePopupQueue = () => {
  const popup = usePopup();
  const queueRef = useRef<Array<() => Promise<any>>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addToQueue = useCallback(<T = any>(
    component: ComponentType<any> | ReactNode,
    options?: PopupOptions
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const popupFunction = async () => {
        try {
          const ref = popup.open<T>(component, options);
          const result = await ref.afterClosed();
          resolve(result as T);
        } catch (error) {
          reject(error);
        }
      };

      queueRef.current.push(popupFunction);
      
      if (!isProcessing) {
        processQueue();
      }
    });
  }, [popup, isProcessing]);

  const processQueue = useCallback(async () => {
    if (isProcessing || queueRef.current.length === 0) {
      return;
    }

    setIsProcessing(true);
    
    while (queueRef.current.length > 0) {
      const nextPopup = queueRef.current.shift();
      if (nextPopup) {
        await nextPopup();
      }
    }
    
    setIsProcessing(false);
  }, [isProcessing]);

  const clearQueue = useCallback(() => {
    queueRef.current = [];
  }, []);

  return {
    addToQueue,
    clearQueue,
    queueLength: queueRef.current.length,
    isProcessing
  };
};

/**
 * Hook for popup configuration injection
 * 
 * Provides a way to inject configuration for child components,
 * similar to Angular's dependency injection patterns
 */
export const usePopupConfig = (): PopupConfig => {
  const context = usePopupContext();
  return context.config;
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  PopupConfig,
  PopupPosition,
  PopupSize,
  PopupOptions,
  PopupRef,
  PopupProviderProps
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default export containing all popup utilities
 */
export default {
  PopupProvider,
  usePopup,
  usePopupQueue,
  usePopupConfig,
  defaultConfig,
  defaultOptions
};