/**
 * UI State Management Utilities for DreamFactory Admin Interface
 * 
 * Provides React hooks for managing application-wide interface preferences,
 * popup visibility, first-time user flags, and other transient UI state with
 * localStorage persistence and cross-component synchronization.
 * 
 * Migrated from Angular PopupService and DFStorageService to React hook patterns
 * while maintaining SSR compatibility and state persistence across browser sessions.
 */

import { useCallback, useMemo } from 'react';
import { useLocalStorage, useSessionStorage } from './ssr-storage';
import { 
  STORAGE_KEYS, 
  PopupState, 
  OnboardingState, 
  UIState,
  NavigationState,
  type StorageKey 
} from './types';

// =============================================================================
// Constants and Default Values
// =============================================================================

/**
 * Default popup visibility state
 */
const DEFAULT_POPUP_STATE: PopupState = {
  showPasswordPopup: false,
};

/**
 * Default onboarding state for first-time user detection
 */
const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  isFirstTimeUser: true,
  configFirstTimeUser: true,
  completedSteps: [],
  tourSkipped: false,
};

/**
 * Default navigation state
 */
const DEFAULT_NAVIGATION_STATE: NavigationState = {
  currentRoute: '/',
  history: [],
  breadcrumbs: [],
};

/**
 * Default UI state combining all interface state types
 */
const DEFAULT_UI_STATE: UIState = {
  popups: DEFAULT_POPUP_STATE,
  onboarding: DEFAULT_ONBOARDING_STATE,
  navigation: DEFAULT_NAVIGATION_STATE,
  loading: {},
  errors: {},
};

// =============================================================================
// Popup State Management Hook
// =============================================================================

/**
 * Hook for managing popup and dialog visibility state with localStorage persistence.
 * Replaces Angular PopupService functionality with React state patterns.
 * 
 * @returns Popup state management interface
 */
export function usePopupState() {
  const [popupState, setPopupState, removePopupState] = useLocalStorage<PopupState>(
    STORAGE_KEYS.SHOW_PASSWORD_POPUP,
    {
      defaultValue: DEFAULT_POPUP_STATE,
      syncAcrossTabs: true,
    }
  );

  /**
   * Shows a specific popup by name
   * @param popupName - Name of the popup to show
   */
  const showPopup = useCallback((popupName: keyof PopupState) => {
    setPopupState(prevState => ({
      ...prevState,
      [popupName]: true,
    }));
  }, [setPopupState]);

  /**
   * Hides a specific popup by name
   * @param popupName - Name of the popup to hide
   */
  const hidePopup = useCallback((popupName: keyof PopupState) => {
    setPopupState(prevState => ({
      ...prevState,
      [popupName]: false,
    }));
  }, [setPopupState]);

  /**
   * Toggles a popup's visibility state
   * @param popupName - Name of the popup to toggle
   */
  const togglePopup = useCallback((popupName: keyof PopupState) => {
    setPopupState(prevState => ({
      ...prevState,
      [popupName]: !prevState[popupName],
    }));
  }, [setPopupState]);

  /**
   * Shows the password complexity popup (specific Angular migration requirement)
   */
  const showPasswordPopup = useCallback(() => {
    showPopup('showPasswordPopup');
  }, [showPopup]);

  /**
   * Hides the password complexity popup
   */
  const hidePasswordPopup = useCallback(() => {
    hidePopup('showPasswordPopup');
  }, [hidePopup]);

  /**
   * Checks if a specific popup is currently visible
   * @param popupName - Name of the popup to check
   * @returns True if popup is visible
   */
  const isPopupVisible = useCallback((popupName: keyof PopupState): boolean => {
    return popupState[popupName] || false;
  }, [popupState]);

  /**
   * Hides all popups
   */
  const hideAllPopups = useCallback(() => {
    const clearedState = Object.keys(popupState).reduce((acc, key) => {
      acc[key as keyof PopupState] = false;
      return acc;
    }, {} as PopupState);
    setPopupState(clearedState);
  }, [popupState, setPopupState]);

  /**
   * Adds a new popup to the state
   * @param popupName - Name of the new popup
   * @param initialState - Initial visibility state (default: false)
   */
  const addPopup = useCallback((popupName: string, initialState: boolean = false) => {
    setPopupState(prevState => ({
      ...prevState,
      [popupName]: initialState,
    }));
  }, [setPopupState]);

  /**
   * Removes a popup from the state
   * @param popupName - Name of the popup to remove
   */
  const removePopup = useCallback((popupName: string) => {
    setPopupState(prevState => {
      const newState = { ...prevState };
      delete newState[popupName as keyof PopupState];
      return newState;
    });
  }, [setPopupState]);

  return {
    // State
    popupState,
    
    // Actions
    showPopup,
    hidePopup,
    togglePopup,
    showPasswordPopup,
    hidePasswordPopup,
    hideAllPopups,
    addPopup,
    removePopup,
    
    // Queries
    isPopupVisible,
    
    // Utilities
    clearPopupState: removePopupState,
  };
}

// =============================================================================
// Onboarding State Management Hook
// =============================================================================

/**
 * Hook for managing first-time user onboarding state and flow detection.
 * Replaces Angular DFStorageService first-time user functionality.
 * 
 * @returns Onboarding state management interface
 */
export function useOnboardingState() {
  const [onboardingState, setOnboardingState, removeOnboardingState] = useLocalStorage<OnboardingState>(
    STORAGE_KEYS.CONFIG_FIRST_TIME_USER,
    {
      defaultValue: DEFAULT_ONBOARDING_STATE,
      syncAcrossTabs: true,
    }
  );

  /**
   * Marks the user as no longer a first-time user
   */
  const completeFirstTimeSetup = useCallback(() => {
    setOnboardingState(prevState => ({
      ...prevState,
      isFirstTimeUser: false,
      configFirstTimeUser: false,
    }));
  }, [setOnboardingState]);

  /**
   * Marks a specific onboarding step as completed
   * @param stepName - Name of the completed step
   */
  const completeOnboardingStep = useCallback((stepName: string) => {
    setOnboardingState(prevState => ({
      ...prevState,
      completedSteps: [...new Set([...prevState.completedSteps, stepName])],
    }));
  }, [setOnboardingState]);

  /**
   * Checks if a specific onboarding step has been completed
   * @param stepName - Name of the step to check
   * @returns True if step is completed
   */
  const isStepCompleted = useCallback((stepName: string): boolean => {
    return onboardingState.completedSteps.includes(stepName);
  }, [onboardingState.completedSteps]);

  /**
   * Marks the onboarding tour as skipped
   */
  const skipOnboardingTour = useCallback(() => {
    setOnboardingState(prevState => ({
      ...prevState,
      tourSkipped: true,
      isFirstTimeUser: false,
    }));
  }, [setOnboardingState]);

  /**
   * Resets onboarding state (useful for testing or user preference)
   */
  const resetOnboardingState = useCallback(() => {
    setOnboardingState(DEFAULT_ONBOARDING_STATE);
  }, [setOnboardingState]);

  /**
   * Sets the config first-time user flag specifically (Angular migration requirement)
   * @param isFirstTime - Whether user is accessing config for the first time
   */
  const setConfigFirstTimeUser = useCallback((isFirstTime: boolean) => {
    setOnboardingState(prevState => ({
      ...prevState,
      configFirstTimeUser: isFirstTime,
    }));
  }, [setOnboardingState]);

  /**
   * Gets the total number of completed onboarding steps
   */
  const completedStepsCount = useMemo(() => {
    return onboardingState.completedSteps.length;
  }, [onboardingState.completedSteps]);

  /**
   * Checks if user should see onboarding content
   */
  const shouldShowOnboarding = useMemo(() => {
    return onboardingState.isFirstTimeUser && !onboardingState.tourSkipped;
  }, [onboardingState.isFirstTimeUser, onboardingState.tourSkipped]);

  return {
    // State
    onboardingState,
    
    // Computed properties
    completedStepsCount,
    shouldShowOnboarding,
    
    // Actions
    completeFirstTimeSetup,
    completeOnboardingStep,
    skipOnboardingTour,
    resetOnboardingState,
    setConfigFirstTimeUser,
    
    // Queries
    isStepCompleted,
    
    // Utilities
    clearOnboardingState: removeOnboardingState,
  };
}

// =============================================================================
// General UI State Management Hook
// =============================================================================

/**
 * Hook for managing general application UI state including loading states,
 * error states, and component visibility. Provides centralized state management
 * for UI elements that need to be coordinated across components.
 * 
 * @returns UI state management interface
 */
export function useUIState() {
  // Use sessionStorage for temporary UI state that shouldn't persist across sessions
  const [uiState, setUIState, removeUIState] = useSessionStorage<UIState>(
    'df_ui_state',
    {
      defaultValue: DEFAULT_UI_STATE,
    }
  );

  /**
   * Sets loading state for a specific operation
   * @param operation - Name of the operation
   * @param isLoading - Whether the operation is loading
   */
  const setLoading = useCallback((operation: string, isLoading: boolean) => {
    setUIState(prevState => ({
      ...prevState,
      loading: {
        ...prevState.loading,
        [operation]: isLoading,
      },
    }));
  }, [setUIState]);

  /**
   * Sets error state for a specific component
   * @param component - Name of the component
   * @param error - Error message or null to clear
   */
  const setError = useCallback((component: string, error: string | null) => {
    setUIState(prevState => ({
      ...prevState,
      errors: {
        ...prevState.errors,
        [component]: error,
      },
    }));
  }, [setUIState]);

  /**
   * Updates navigation state
   * @param updates - Partial navigation state updates
   */
  const updateNavigationState = useCallback((updates: Partial<NavigationState>) => {
    setUIState(prevState => ({
      ...prevState,
      navigation: {
        ...prevState.navigation,
        ...updates,
      },
    }));
  }, [setUIState]);

  /**
   * Adds a route to navigation history
   * @param route - Route path to add
   */
  const addToNavigationHistory = useCallback((route: string) => {
    setUIState(prevState => ({
      ...prevState,
      navigation: {
        ...prevState.navigation,
        currentRoute: route,
        history: [...prevState.navigation.history.slice(-9), route], // Keep last 10 routes
      },
    }));
  }, [setUIState]);

  /**
   * Checks if a specific operation is currently loading
   * @param operation - Name of the operation to check
   * @returns True if operation is loading
   */
  const isLoading = useCallback((operation: string): boolean => {
    return uiState.loading[operation] || false;
  }, [uiState.loading]);

  /**
   * Gets error message for a specific component
   * @param component - Name of the component
   * @returns Error message or null if no error
   */
  const getError = useCallback((component: string): string | null => {
    return uiState.errors[component] || null;
  }, [uiState.errors]);

  /**
   * Checks if any operation is currently loading
   */
  const isAnyLoading = useMemo(() => {
    return Object.values(uiState.loading).some(loading => loading);
  }, [uiState.loading]);

  /**
   * Checks if there are any active errors
   */
  const hasAnyErrors = useMemo(() => {
    return Object.values(uiState.errors).some(error => error !== null);
  }, [uiState.errors]);

  /**
   * Clears all loading states
   */
  const clearAllLoading = useCallback(() => {
    setUIState(prevState => ({
      ...prevState,
      loading: {},
    }));
  }, [setUIState]);

  /**
   * Clears all error states
   */
  const clearAllErrors = useCallback(() => {
    setUIState(prevState => ({
      ...prevState,
      errors: {},
    }));
  }, [setUIState]);

  /**
   * Clears loading state for a specific operation
   * @param operation - Name of the operation to clear
   */
  const clearLoading = useCallback((operation: string) => {
    setLoading(operation, false);
  }, [setLoading]);

  /**
   * Clears error state for a specific component
   * @param component - Name of the component to clear
   */
  const clearError = useCallback((component: string) => {
    setError(component, null);
  }, [setError]);

  return {
    // State
    uiState,
    
    // Computed properties
    isAnyLoading,
    hasAnyErrors,
    
    // Loading state management
    setLoading,
    clearLoading,
    clearAllLoading,
    isLoading,
    
    // Error state management
    setError,
    clearError,
    clearAllErrors,
    getError,
    
    // Navigation state management
    updateNavigationState,
    addToNavigationHistory,
    
    // Utilities
    clearUIState: removeUIState,
  };
}

// =============================================================================
// Combined UI State Hook
// =============================================================================

/**
 * Combined hook that provides access to all UI state management functionality.
 * Useful for components that need to manage multiple types of UI state.
 * 
 * @returns Combined UI state management interface
 */
export function useUIStateManager() {
  const popupManager = usePopupState();
  const onboardingManager = useOnboardingState();
  const uiManager = useUIState();

  /**
   * Clears all UI state (useful for logout or reset scenarios)
   */
  const clearAllUIState = useCallback(() => {
    popupManager.clearPopupState();
    onboardingManager.clearOnboardingState();
    uiManager.clearUIState();
  }, [popupManager, onboardingManager, uiManager]);

  /**
   * Resets UI state to defaults without clearing persistence
   */
  const resetUIState = useCallback(() => {
    popupManager.hideAllPopups();
    uiManager.clearAllLoading();
    uiManager.clearAllErrors();
  }, [popupManager, uiManager]);

  return {
    // Individual managers
    popup: popupManager,
    onboarding: onboardingManager,
    ui: uiManager,
    
    // Combined actions
    clearAllUIState,
    resetUIState,
  };
}

// =============================================================================
// UI State Utilities
// =============================================================================

/**
 * Utility functions for UI state management that can be used outside of React components
 */
export const uiStateUtils = {
  /**
   * Storage keys used by UI state management
   */
  STORAGE_KEYS: {
    POPUP_STATE: STORAGE_KEYS.SHOW_PASSWORD_POPUP,
    ONBOARDING_STATE: STORAGE_KEYS.CONFIG_FIRST_TIME_USER,
  },

  /**
   * Default state values for initialization
   */
  defaults: {
    POPUP_STATE: DEFAULT_POPUP_STATE,
    ONBOARDING_STATE: DEFAULT_ONBOARDING_STATE,
    UI_STATE: DEFAULT_UI_STATE,
  },
  
  /**
   * Type guards for UI state validation
   */
  isValidPopupState: (value: any): value is PopupState => {
    return value && typeof value === 'object' && typeof value.showPasswordPopup === 'boolean';
  },
  
  isValidOnboardingState: (value: any): value is OnboardingState => {
    return (
      value &&
      typeof value === 'object' &&
      typeof value.isFirstTimeUser === 'boolean' &&
      typeof value.configFirstTimeUser === 'boolean' &&
      Array.isArray(value.completedSteps)
    );
  },
};

// =============================================================================
// Export Types and Hooks
// =============================================================================

export type {
  PopupState,
  OnboardingState,
  UIState,
  NavigationState,
} from './types';

// Export all hooks as default
export default {
  usePopupState,
  useOnboardingState,
  useUIState,
  useUIStateManager,
  uiStateUtils,
};