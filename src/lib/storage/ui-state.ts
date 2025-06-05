/**
 * UI State Management Utilities
 * 
 * Migrated from Angular PopupService and DFStorageService to React hooks.
 * Provides reactive UI state management with localStorage persistence and SSR compatibility.
 * 
 * Key Features:
 * - Popup and dialog visibility state management
 * - First-time user onboarding flag handling
 * - Cross-component UI state synchronization
 * - SSR-safe storage operations with Next.js compatibility
 * - Type-safe storage key management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './ssr-storage';
import { StorageKeys, UIStateConfig, PopupVisibilityState } from './types';
import { isBrowser } from './storage-utils';

/**
 * Storage keys for UI state management
 */
export const UI_STORAGE_KEYS = {
  SHOW_PASSWORD_POPUP: 'showPasswordPopup' as const,
  CONFIG_FIRST_TIME_USER: 'configFirstTimeUser' as const,
  DIALOG_VISIBILITY: 'dialogVisibility' as const,
  ONBOARDING_STATE: 'onboardingState' as const,
  UI_PREFERENCES: 'uiPreferences' as const,
} as const;

/**
 * Default UI state configuration
 */
const DEFAULT_UI_CONFIG: UIStateConfig = {
  showPasswordPopup: false,
  isFirstTimeUser: true,
  dialogVisibility: {},
  onboardingCompleted: false,
  uiPreferences: {
    sidebarCollapsed: false,
    showTooltips: true,
    compactMode: false,
  },
};

/**
 * Default popup visibility state
 */
const DEFAULT_POPUP_STATE: PopupVisibilityState = {
  passwordPopup: false,
  confirmDialog: false,
  settingsDialog: false,
  helpDialog: false,
};

/**
 * Hook for managing password popup visibility state
 * Migrated from Angular PopupService.setShowPopup() and shouldShowPopup()
 * 
 * @returns Object with popup state and control functions
 */
export function usePasswordPopupState() {
  const [showPasswordPopup, setShowPasswordPopupStorage] = useLocalStorage<boolean>(
    UI_STORAGE_KEYS.SHOW_PASSWORD_POPUP,
    DEFAULT_UI_CONFIG.showPasswordPopup
  );

  const [localState, setLocalState] = useState<boolean>(showPasswordPopup);

  // Sync local state with storage on mount and storage changes
  useEffect(() => {
    setLocalState(showPasswordPopup);
  }, [showPasswordPopup]);

  const setShowPopup = useCallback((value: boolean) => {
    setLocalState(value);
    setShowPasswordPopupStorage(value);
  }, [setShowPasswordPopupStorage]);

  const shouldShowPopup = useCallback(() => {
    return localState;
  }, [localState]);

  const togglePopup = useCallback(() => {
    const newValue = !localState;
    setShowPopup(newValue);
  }, [localState, setShowPopup]);

  return {
    showPasswordPopup: localState,
    setShowPopup,
    shouldShowPopup,
    togglePopup,
  };
}

/**
 * Hook for managing first-time user state
 * Migrated from Angular DFStorageService.isFirstTimeUser$ and setIsFirstUser()
 * 
 * @returns Object with first-time user state and control functions
 */
export function useFirstTimeUserState() {
  const [configFirstTimeUser, setConfigFirstTimeUser] = useLocalStorage<boolean>(
    UI_STORAGE_KEYS.CONFIG_FIRST_TIME_USER,
    false
  );

  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(true);

  // Load initial configuration on mount
  useEffect(() => {
    if (isBrowser()) {
      const hasConfig = configFirstTimeUser !== null && configFirstTimeUser !== undefined;
      setIsFirstTimeUser(!hasConfig);
    }
  }, [configFirstTimeUser]);

  const setIsFirstUser = useCallback(() => {
    setConfigFirstTimeUser(true);
    setIsFirstTimeUser(false);
  }, [setConfigFirstTimeUser]);

  const markOnboardingComplete = useCallback(() => {
    setIsFirstUser();
  }, [setIsFirstUser]);

  const resetFirstTimeUser = useCallback(() => {
    setConfigFirstTimeUser(false);
    setIsFirstTimeUser(true);
  }, [setConfigFirstTimeUser]);

  return {
    isFirstTimeUser,
    setIsFirstUser,
    markOnboardingComplete,
    resetFirstTimeUser,
    hasCompletedOnboarding: !isFirstTimeUser,
  };
}

/**
 * Hook for managing general popup and dialog visibility state
 * Provides centralized state management for multiple UI dialogs
 * 
 * @returns Object with dialog visibility state and control functions
 */
export function useDialogVisibilityState() {
  const [dialogState, setDialogState] = useLocalStorage<PopupVisibilityState>(
    UI_STORAGE_KEYS.DIALOG_VISIBILITY,
    DEFAULT_POPUP_STATE
  );

  const [localDialogState, setLocalDialogState] = useState<PopupVisibilityState>(dialogState);

  // Sync local state with storage
  useEffect(() => {
    setLocalDialogState(dialogState);
  }, [dialogState]);

  const showDialog = useCallback((dialogName: keyof PopupVisibilityState) => {
    const newState = { ...localDialogState, [dialogName]: true };
    setLocalDialogState(newState);
    setDialogState(newState);
  }, [localDialogState, setDialogState]);

  const hideDialog = useCallback((dialogName: keyof PopupVisibilityState) => {
    const newState = { ...localDialogState, [dialogName]: false };
    setLocalDialogState(newState);
    setDialogState(newState);
  }, [localDialogState, setDialogState]);

  const toggleDialog = useCallback((dialogName: keyof PopupVisibilityState) => {
    const currentValue = localDialogState[dialogName];
    const newState = { ...localDialogState, [dialogName]: !currentValue };
    setLocalDialogState(newState);
    setDialogState(newState);
  }, [localDialogState, setDialogState]);

  const hideAllDialogs = useCallback(() => {
    const newState = Object.keys(localDialogState).reduce((acc, key) => {
      acc[key as keyof PopupVisibilityState] = false;
      return acc;
    }, {} as PopupVisibilityState);
    setLocalDialogState(newState);
    setDialogState(newState);
  }, [localDialogState, setDialogState]);

  const isDialogVisible = useCallback((dialogName: keyof PopupVisibilityState) => {
    return localDialogState[dialogName] || false;
  }, [localDialogState]);

  return {
    dialogState: localDialogState,
    showDialog,
    hideDialog,
    toggleDialog,
    hideAllDialogs,
    isDialogVisible,
    // Specific dialog helpers for common use cases
    showPasswordDialog: () => showDialog('passwordPopup'),
    hidePasswordDialog: () => hideDialog('passwordPopup'),
    showConfirmDialog: () => showDialog('confirmDialog'),
    hideConfirmDialog: () => hideDialog('confirmDialog'),
    showSettingsDialog: () => showDialog('settingsDialog'),
    hideSettingsDialog: () => hideDialog('settingsDialog'),
    showHelpDialog: () => showDialog('helpDialog'),
    hideHelpDialog: () => hideDialog('helpDialog'),
  };
}

/**
 * Hook for managing comprehensive UI state configuration
 * Combines popup, first-time user, and general UI preferences
 * 
 * @returns Object with full UI state management capabilities
 */
export function useUIState() {
  const [uiConfig, setUIConfig] = useLocalStorage<UIStateConfig>(
    UI_STORAGE_KEYS.UI_PREFERENCES,
    DEFAULT_UI_CONFIG
  );

  const [localUIConfig, setLocalUIConfig] = useState<UIStateConfig>(uiConfig);

  // Individual state hooks for specific functionality
  const passwordPopup = usePasswordPopupState();
  const firstTimeUser = useFirstTimeUserState();
  const dialogVisibility = useDialogVisibilityState();

  // Sync local state with storage
  useEffect(() => {
    setLocalUIConfig(uiConfig);
  }, [uiConfig]);

  const updateUIConfig = useCallback((updates: Partial<UIStateConfig>) => {
    const newConfig = { ...localUIConfig, ...updates };
    setLocalUIConfig(newConfig);
    setUIConfig(newConfig);
  }, [localUIConfig, setUIConfig]);

  const resetUIState = useCallback(() => {
    setLocalUIConfig(DEFAULT_UI_CONFIG);
    setUIConfig(DEFAULT_UI_CONFIG);
    passwordPopup.setShowPopup(false);
    firstTimeUser.resetFirstTimeUser();
    dialogVisibility.hideAllDialogs();
  }, [setUIConfig, passwordPopup, firstTimeUser, dialogVisibility]);

  const toggleSidebar = useCallback(() => {
    const newPreferences = {
      ...localUIConfig.uiPreferences,
      sidebarCollapsed: !localUIConfig.uiPreferences.sidebarCollapsed,
    };
    updateUIConfig({ uiPreferences: newPreferences });
  }, [localUIConfig.uiPreferences, updateUIConfig]);

  const toggleTooltips = useCallback(() => {
    const newPreferences = {
      ...localUIConfig.uiPreferences,
      showTooltips: !localUIConfig.uiPreferences.showTooltips,
    };
    updateUIConfig({ uiPreferences: newPreferences });
  }, [localUIConfig.uiPreferences, updateUIConfig]);

  const toggleCompactMode = useCallback(() => {
    const newPreferences = {
      ...localUIConfig.uiPreferences,
      compactMode: !localUIConfig.uiPreferences.compactMode,
    };
    updateUIConfig({ uiPreferences: newPreferences });
  }, [localUIConfig.uiPreferences, updateUIConfig]);

  // Computed values for component consumption
  const computedState = useMemo(() => ({
    isFirstTimeUser: firstTimeUser.isFirstTimeUser,
    showPasswordPopup: passwordPopup.showPasswordPopup,
    dialogVisibility: dialogVisibility.dialogState,
    uiPreferences: localUIConfig.uiPreferences,
    onboardingCompleted: !firstTimeUser.isFirstTimeUser,
    sidebarCollapsed: localUIConfig.uiPreferences.sidebarCollapsed,
    showTooltips: localUIConfig.uiPreferences.showTooltips,
    compactMode: localUIConfig.uiPreferences.compactMode,
  }), [
    firstTimeUser.isFirstTimeUser,
    passwordPopup.showPasswordPopup,
    dialogVisibility.dialogState,
    localUIConfig.uiPreferences,
  ]);

  return {
    // State
    ...computedState,
    
    // Password popup controls
    passwordPopup,
    
    // First-time user controls
    firstTimeUser,
    
    // Dialog visibility controls
    dialogVisibility,
    
    // General UI configuration
    updateUIConfig,
    resetUIState,
    
    // UI preference toggles
    toggleSidebar,
    toggleTooltips,
    toggleCompactMode,
    
    // Utility functions
    getUIConfig: () => localUIConfig,
    isDialogOpen: (dialogName: keyof PopupVisibilityState) => 
      dialogVisibility.isDialogVisible(dialogName),
  };
}

/**
 * Hook for managing onboarding flow state
 * Tracks user progress through initial application setup
 * 
 * @returns Object with onboarding state and progression controls
 */
export function useOnboardingState() {
  const { isFirstTimeUser, markOnboardingComplete } = useFirstTimeUserState();
  
  const [onboardingStep, setOnboardingStep] = useLocalStorage<number>(
    UI_STORAGE_KEYS.ONBOARDING_STATE,
    0
  );

  const [localStep, setLocalStep] = useState<number>(onboardingStep);

  useEffect(() => {
    setLocalStep(onboardingStep);
  }, [onboardingStep]);

  const advanceOnboardingStep = useCallback(() => {
    const nextStep = localStep + 1;
    setLocalStep(nextStep);
    setOnboardingStep(nextStep);
  }, [localStep, setOnboardingStep]);

  const setOnboardingStepTo = useCallback((step: number) => {
    setLocalStep(step);
    setOnboardingStep(step);
  }, [setOnboardingStep]);

  const completeOnboarding = useCallback(() => {
    markOnboardingComplete();
    setLocalStep(0);
    setOnboardingStep(0);
  }, [markOnboardingComplete, setOnboardingStep]);

  const resetOnboarding = useCallback(() => {
    setLocalStep(0);
    setOnboardingStep(0);
  }, [setOnboardingStep]);

  return {
    isFirstTimeUser,
    currentStep: localStep,
    advanceOnboardingStep,
    setOnboardingStepTo,
    completeOnboarding,
    resetOnboarding,
    isOnboardingActive: isFirstTimeUser && localStep > 0,
  };
}

/**
 * Hook for subscribing to cross-tab UI state synchronization
 * Listens for storage events to sync UI state across browser tabs
 * 
 * @param callback Function to call when UI state changes in another tab
 */
export function useUIStateSynchronization(callback?: () => void) {
  const { resetUIState } = useUIState();

  useEffect(() => {
    if (!isBrowser()) return;

    const handleStorageChange = (event: StorageEvent) => {
      // Check if the changed key is one of our UI state keys
      const uiKeys = Object.values(UI_STORAGE_KEYS);
      if (event.key && uiKeys.includes(event.key as any)) {
        // Trigger callback if provided
        callback?.();
        
        // Force re-render of components using UI state
        window.dispatchEvent(new CustomEvent('ui-state-sync', {
          detail: { key: event.key, oldValue: event.oldValue, newValue: event.newValue }
        }));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [callback]);

  return {
    resetUIState,
  };
}

/**
 * Utility function to check if a specific UI feature is enabled
 * Useful for feature flagging and conditional rendering
 * 
 * @param feature The UI feature to check
 * @returns Boolean indicating if the feature is enabled
 */
export function isUIFeatureEnabled(feature: keyof UIStateConfig['uiPreferences']): boolean {
  if (!isBrowser()) return false;
  
  try {
    const stored = localStorage.getItem(UI_STORAGE_KEYS.UI_PREFERENCES);
    if (!stored) return DEFAULT_UI_CONFIG.uiPreferences[feature];
    
    const config: UIStateConfig = JSON.parse(stored);
    return config.uiPreferences[feature] ?? DEFAULT_UI_CONFIG.uiPreferences[feature];
  } catch {
    return DEFAULT_UI_CONFIG.uiPreferences[feature];
  }
}

/**
 * Utility function to get current UI state without using React hooks
 * Useful for non-component contexts like middleware or utilities
 * 
 * @returns Current UI state configuration
 */
export function getCurrentUIState(): UIStateConfig {
  if (!isBrowser()) return DEFAULT_UI_CONFIG;
  
  try {
    const stored = localStorage.getItem(UI_STORAGE_KEYS.UI_PREFERENCES);
    return stored ? JSON.parse(stored) : DEFAULT_UI_CONFIG;
  } catch {
    return DEFAULT_UI_CONFIG;
  }
}

// Export types and constants for external use
export { DEFAULT_UI_CONFIG, DEFAULT_POPUP_STATE };
export type { UIStateConfig, PopupVisibilityState };