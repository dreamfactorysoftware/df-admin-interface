'use client';

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
  useState,
} from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  PopupConfig,
  PopupContextType,
  PopupState,
  PopupInstance,
  PopupResult,
  PopupGlobalSettings,
  UsePopupReturn,
  PopupProviderProps,
  AuthRedirectReason,
  DEFAULT_POPUP_CONFIG,
  DEFAULT_GLOBAL_SETTINGS,
  POPUP_Z_INDEX,
  PopupButtonType,
} from './types';

/**
 * Popup State Store using Zustand for centralized popup management
 * Replaces Angular service singleton patterns with React state management
 */
interface PopupStore {
  /** Current popup state */
  state: PopupState;
  /** Active popup instances map */
  activePopups: Map<string, PopupInstance>;
  /** Global popup settings */
  globalSettings: PopupGlobalSettings;
  /** Z-index counter for layering management */
  zIndexCounter: number;
  /** Animation queue for managing transitions */
  animationQueue: string[];
  
  // Actions for popup management
  /** Add a new popup instance */
  addPopup: (popup: PopupInstance) => void;
  /** Remove popup by ID */
  removePopup: (id: string) => void;
  /** Update popup configuration */
  updatePopup: (id: string, config: Partial<PopupConfig>) => void;
  /** Update global settings */
  updateGlobalSettings: (settings: Partial<PopupGlobalSettings>) => void;
  /** Clear all popups */
  clearAllPopups: () => void;
  /** Get next z-index value */
  getNextZIndex: () => number;
}

/**
 * Zustand store for popup state management
 * Provides centralized state with persistence and debugging capabilities
 */
const usePopupStore = create<PopupStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      state: {
        activePopups: new Map(),
        defaultConfig: DEFAULT_POPUP_CONFIG,
        globalSettings: DEFAULT_GLOBAL_SETTINGS,
        animationQueue: [],
        zIndexCounter: POPUP_Z_INDEX.base,
      },
      activePopups: new Map(),
      globalSettings: DEFAULT_GLOBAL_SETTINGS,
      zIndexCounter: POPUP_Z_INDEX.base,
      animationQueue: [],

      // Actions
      addPopup: (popup: PopupInstance) => {
        const { activePopups, globalSettings } = get();
        const newActivePopups = new Map(activePopups);
        
        // Check max concurrent popups limit
        if (newActivePopups.size >= globalSettings.maxConcurrentPopups) {
          // Handle stacking mode
          if (globalSettings.stackingMode === 'replace') {
            // Remove oldest popup
            const oldestId = Array.from(newActivePopups.keys())[0];
            if (oldestId) {
              const oldestPopup = newActivePopups.get(oldestId);
              oldestPopup?.resolver?.({
                action: 'dismissal',
                success: false,
              });
              newActivePopups.delete(oldestId);
            }
          } else if (globalSettings.stackingMode === 'queue') {
            // Add to animation queue for later processing
            set(state => ({
              animationQueue: [...state.animationQueue, popup.id]
            }));
            return;
          }
        }

        // Add popup to active map
        newActivePopups.set(popup.id, popup);
        
        set(state => ({
          activePopups: newActivePopups,
          state: {
            ...state.state,
            activePopups: newActivePopups,
          }
        }));
      },

      removePopup: (id: string) => {
        const { activePopups, animationQueue } = get();
        const newActivePopups = new Map(activePopups);
        
        // Remove from active popups
        newActivePopups.delete(id);
        
        // Process next popup from queue
        const newAnimationQueue = animationQueue.filter(queueId => queueId !== id);
        
        set(state => ({
          activePopups: newActivePopups,
          animationQueue: newAnimationQueue,
          state: {
            ...state.state,
            activePopups: newActivePopups,
            animationQueue: newAnimationQueue,
          }
        }));

        // Process next queued popup if in queue mode
        if (newAnimationQueue.length > 0 && get().globalSettings.stackingMode === 'queue') {
          // Trigger next popup after animation delay
          setTimeout(() => {
            const nextPopupId = newAnimationQueue[0];
            // Implementation would trigger next popup here
          }, 300);
        }
      },

      updatePopup: (id: string, config: Partial<PopupConfig>) => {
        const { activePopups } = get();
        const popup = activePopups.get(id);
        
        if (popup) {
          const updatedPopup: PopupInstance = {
            ...popup,
            config: { ...popup.config, ...config },
            updatedAt: Date.now(),
          };
          
          const newActivePopups = new Map(activePopups);
          newActivePopups.set(id, updatedPopup);
          
          set(state => ({
            activePopups: newActivePopups,
            state: {
              ...state.state,
              activePopups: newActivePopups,
            }
          }));
        }
      },

      updateGlobalSettings: (settings: Partial<PopupGlobalSettings>) => {
        const newSettings = { ...get().globalSettings, ...settings };
        set(state => ({
          globalSettings: newSettings,
          state: {
            ...state.state,
            globalSettings: newSettings,
          }
        }));
      },

      clearAllPopups: () => {
        const { activePopups } = get();
        
        // Resolve all active popups with dismissal
        activePopups.forEach(popup => {
          popup.resolver?.({
            action: 'dismissal',
            success: false,
          });
        });

        set(state => ({
          activePopups: new Map(),
          animationQueue: [],
          state: {
            ...state.state,
            activePopups: new Map(),
            animationQueue: [],
          }
        }));
      },

      getNextZIndex: () => {
        const currentZ = get().zIndexCounter;
        const nextZ = currentZ + POPUP_Z_INDEX.increment;
        
        set({ zIndexCounter: nextZ });
        return nextZ;
      },
    }),
    {
      name: 'popup-store',
    }
  )
);

/**
 * React Context for popup management
 * Provides popup functionality throughout the component tree
 */
const PopupContext = createContext<PopupContextType | null>(null);

/**
 * Popup Provider Component
 * Application-wide popup state management using React Context
 * Replaces Angular dependency injection with React context patterns
 * 
 * @param props PopupProviderProps configuration
 */
export function PopupProvider({
  children,
  defaultSettings,
  defaultConfig,
  authCallbacks,
  portalContainer,
}: PopupProviderProps) {
  const store = usePopupStore();
  const subscribersRef = useRef<Set<(state: PopupState) => void>>(new Set());
  const [, forceRender] = useState({});

  // Initialize default settings
  useEffect(() => {
    if (defaultSettings) {
      store.updateGlobalSettings(defaultSettings);
    }
  }, [defaultSettings, store]);

  // Force re-render when store updates to notify subscribers
  useEffect(() => {
    const unsubscribe = usePopupStore.subscribe((state) => {
      subscribersRef.current.forEach(callback => callback(state.state));
      forceRender({});
    });
    
    return unsubscribe;
  }, []);

  /**
   * Show popup with configuration and return promise
   * Implements promise-based workflows for async popup handling
   */
  const showPopup = useCallback(
    (config: PopupConfig): Promise<PopupResult> => {
      return new Promise((resolve) => {
        const id = `popup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();
        
        const popupInstance: PopupInstance = {
          id,
          config: { ...DEFAULT_POPUP_CONFIG, ...defaultConfig, ...config },
          state: {
            isVisible: true,
            isTransitioning: false,
            zIndex: store.getNextZIndex(),
            hasFocus: true,
            lastInteraction: now,
          },
          createdAt: now,
          updatedAt: now,
          resolver: resolve,
        };

        // Add to store
        store.addPopup(popupInstance);
      });
    },
    [store, defaultConfig]
  );

  /**
   * Close specific popup by ID
   */
  const closePopup = useCallback(
    (id: string, result?: PopupResult) => {
      const popup = store.activePopups.get(id);
      if (popup) {
        const finalResult: PopupResult = result || {
          action: 'dismissal',
          success: false,
        };
        
        popup.resolver?.(finalResult);
        store.removePopup(id);
      }
    },
    [store]
  );

  /**
   * Close all active popups
   */
  const closeAllPopups = useCallback(() => {
    store.clearAllPopups();
  }, [store]);

  /**
   * Update popup configuration
   */
  const updatePopup = useCallback(
    (id: string, config: Partial<PopupConfig>) => {
      store.updatePopup(id, config);
    },
    [store]
  );

  /**
   * Check if popup is currently active
   */
  const isPopupActive = useCallback(
    (id: string): boolean => {
      return store.activePopups.has(id);
    },
    [store.activePopups]
  );

  /**
   * Get popup instance by ID
   */
  const getPopup = useCallback(
    (id: string): PopupInstance | undefined => {
      return store.activePopups.get(id);
    },
    [store.activePopups]
  );

  /**
   * Update global settings
   */
  const updateGlobalSettings = useCallback(
    (settings: Partial<PopupGlobalSettings>) => {
      store.updateGlobalSettings(settings);
    },
    [store]
  );

  /**
   * Subscribe to popup state changes
   */
  const subscribe = useCallback(
    (callback: (state: PopupState) => void): (() => void) => {
      subscribersRef.current.add(callback);
      
      // Return unsubscribe function
      return () => {
        subscribersRef.current.delete(callback);
      };
    },
    []
  );

  // Context value
  const contextValue: PopupContextType = {
    state: store.state,
    showPopup,
    closePopup,
    closeAllPopups,
    updatePopup,
    isPopupActive,
    getPopup,
    updateGlobalSettings,
    subscribe,
    auth: authCallbacks || {
      onAuthRedirect: (redirectUrl, reason) => {
        console.warn('onAuthRedirect not implemented:', redirectUrl, reason);
      },
      onLogout: async (reason) => {
        console.warn('onLogout not implemented:', reason);
      },
    },
  };

  return (
    <PopupContext.Provider value={contextValue}>
      {children}
    </PopupContext.Provider>
  );
}

/**
 * usePopup Hook - Primary interface for popup management
 * Replaces Angular PopupOverlayService with React hook patterns
 * Provides promise-based API for programmatic popup control
 */
export function usePopup(): UsePopupReturn {
  const context = useContext(PopupContext);
  
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }

  const { showPopup: contextShowPopup, state } = context;

  /**
   * Show popup with configuration
   */
  const showPopup = useCallback(
    (config: PopupConfig): Promise<PopupResult> => {
      return contextShowPopup(config);
    },
    [contextShowPopup]
  );

  /**
   * Show confirmation popup with predefined styling
   */
  const confirm = useCallback(
    (message: string, options: Partial<PopupConfig> = {}): Promise<boolean> => {
      const config: PopupConfig = {
        ...DEFAULT_POPUP_CONFIG,
        message,
        variant: 'confirmation',
        showRemindMeLater: false,
        ...options,
      };

      return contextShowPopup(config).then(result => result.success);
    },
    [contextShowPopup]
  );

  /**
   * Show alert popup with predefined styling
   */
  const alert = useCallback(
    (message: string, options: Partial<PopupConfig> = {}): Promise<void> => {
      const config: PopupConfig = {
        ...DEFAULT_POPUP_CONFIG,
        message,
        variant: 'info',
        showRemindMeLater: false,
        ...options,
      };

      return contextShowPopup(config).then(() => void 0);
    },
    [contextShowPopup]
  );

  /**
   * Show prompt popup for user input
   */
  const prompt = useCallback(
    (
      message: string,
      defaultValue: string = '',
      options: Partial<PopupConfig> = {}
    ): Promise<string | null> => {
      const config: PopupConfig = {
        ...DEFAULT_POPUP_CONFIG,
        message,
        variant: 'default',
        showRemindMeLater: false,
        ...options,
      };

      return contextShowPopup(config).then(result => {
        return result.success ? (result.data as string) || defaultValue : null;
      });
    },
    [contextShowPopup]
  );

  /**
   * Show authentication-related popup
   */
  const authPopup = useCallback(
    (
      type: AuthRedirectReason,
      options: Partial<PopupConfig> = {}
    ): Promise<PopupResult> => {
      const authMessages = {
        sessionExpired: 'Your session has expired. Please log in again.',
        loginRequired: 'Please log in to access this feature.',
        insufficientPermissions: 'You do not have permission to perform this action.',
        accountLocked: 'Your account has been locked. Please contact support.',
        passwordExpired: 'Your password has expired. Please update it.',
        maintenanceMode: 'The system is currently under maintenance.',
      };

      const config: PopupConfig = {
        ...DEFAULT_POPUP_CONFIG,
        message: authMessages[type],
        variant: 'authentication',
        title: 'Authentication Required',
        ...options,
      };

      return contextShowPopup(config);
    },
    [contextShowPopup]
  );

  /**
   * Close all active popups
   */
  const closeAll = useCallback(() => {
    context.closeAllPopups();
  }, [context]);

  return {
    showPopup,
    confirm,
    alert,
    prompt,
    authPopup,
    closeAll,
    state,
  };
}

/**
 * Custom hook for managing popup backdrop and escape key handling
 * Implements WCAG 2.1 AA compliant keyboard navigation and focus management
 */
export function usePopupHandlers(
  isOpen: boolean,
  onClose: () => void,
  dismissOnClickOutside: boolean = true,
  returnFocusRef?: React.RefObject<HTMLElement>
) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previous focus for restoration
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape, { capture: true });
      return () => {
        document.removeEventListener('keydown', handleEscape, { capture: true });
      };
    }
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (
        dismissOnClickOutside &&
        event.target === event.currentTarget
      ) {
        onClose();
      }
    },
    [dismissOnClickOutside, onClose]
  );

  // Restore focus when popup closes
  useEffect(() => {
    if (!isOpen) {
      const elementToFocus = returnFocusRef?.current || previousFocusRef.current;
      
      if (elementToFocus && document.contains(elementToFocus)) {
        // Small delay to ensure popup is fully unmounted
        setTimeout(() => {
          elementToFocus.focus();
        }, 100);
      }
    }
  }, [isOpen, returnFocusRef]);

  return {
    handleBackdropClick,
  };
}

/**
 * Higher-order component for adding popup functionality to components
 * Provides popup context injection for non-hook compatible scenarios
 */
export function withPopup<P extends object>(
  Component: React.ComponentType<P & { popup: UsePopupReturn }>
) {
  return function PopupEnhancedComponent(props: P) {
    const popup = usePopup();
    return <Component {...props} popup={popup} />;
  };
}

/**
 * Utility function for creating popup configuration presets
 * Helps maintain consistent popup styling across the application
 */
export function createPopupPreset(
  baseConfig: Partial<PopupConfig>
): (config?: Partial<PopupConfig>) => PopupConfig {
  return (config = {}) => ({
    ...DEFAULT_POPUP_CONFIG,
    ...baseConfig,
    ...config,
  });
}

/**
 * Common popup presets for DreamFactory application workflows
 */
export const popupPresets = {
  /** Password security notice popup */
  passwordSecurity: createPopupPreset({
    variant: 'authentication',
    title: 'Password Security Notice',
    showRemindMeLater: true,
    size: 'md',
    accessibility: {
      role: 'alertdialog',
      trapFocus: true,
      initialFocus: 'confirm',
      announceOnOpen: true,
      modal: true,
    },
  }),

  /** Database connection confirmation */
  databaseConnection: createPopupPreset({
    variant: 'confirmation',
    title: 'Database Connection',
    showRemindMeLater: false,
    size: 'lg',
  }),

  /** API generation success */
  apiGenerated: createPopupPreset({
    variant: 'success',
    title: 'API Generated Successfully',
    showRemindMeLater: false,
    autoCloseTimeout: 5000,
    size: 'md',
  }),

  /** Error notification */
  error: createPopupPreset({
    variant: 'error',
    title: 'Error',
    showRemindMeLater: false,
    showCloseButton: true,
    size: 'md',
  }),

  /** System maintenance notice */
  maintenance: createPopupPreset({
    variant: 'warning',
    title: 'System Maintenance',
    dismissOnClickOutside: false,
    showCloseButton: false,
    size: 'lg',
  }),
};

// Export types for external usage
export type {
  PopupConfig,
  PopupContextType,
  PopupState,
  PopupInstance,
  PopupResult,
  UsePopupReturn,
  PopupProviderProps,
} from './types';

// Export utilities
export { DEFAULT_POPUP_CONFIG, DEFAULT_GLOBAL_SETTINGS } from './types';

// Default export for common usage
export default usePopup;