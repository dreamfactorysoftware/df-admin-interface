/**
 * First-Time User Detection and Onboarding Management Hook
 * 
 * This hook manages first-time user detection, onboarding state progression, and tutorial 
 * completion workflows. It replaces the Angular DFStorageService patterns with React state 
 * management for comprehensive first-time user experiences throughout the application.
 * 
 * Features:
 * - First-time user detection with localStorage persistence across browser sessions
 * - Onboarding state management with tutorial progression and completion tracking
 * - Integration with authentication system for first-time user flag coordination
 * - User experience customization based on first-time user status and user roles
 * - Onboarding completion workflows with automatic state updates and persistence
 * - Tutorial and help system integration with first-time user experience flows
 * 
 * Migrated from Angular DFStorageService to React patterns with enhanced onboarding capabilities.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserProfile, UserRole } from '@/types/user';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Onboarding step configuration
 */
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component?: string;
  required: boolean;
  completed: boolean;
  skippable: boolean;
  estimatedTime?: number; // in minutes
  prerequisites?: string[];
  icon?: string;
  order: number;
}

/**
 * Tutorial configuration
 */
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  category: TutorialCategory;
  targetAudience: UserRole['name'][];
  estimatedTime: number;
  priority: 'high' | 'medium' | 'low';
  autoStart?: boolean;
}

/**
 * Individual tutorial step
 */
export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'type' | 'navigate';
  nextTrigger?: 'click' | 'auto' | 'manual';
  duration?: number; // auto-advance time in seconds
}

/**
 * Tutorial categories
 */
export type TutorialCategory = 
  | 'getting-started'
  | 'database-setup'
  | 'api-generation'
  | 'user-management'
  | 'security-setup'
  | 'advanced-features';

/**
 * Onboarding state structure
 */
export interface OnboardingState {
  isFirstTimeUser: boolean;
  hasCompletedOnboarding: boolean;
  currentStep?: string;
  completedSteps: string[];
  skippedSteps: string[];
  startedAt?: string;
  completedAt?: string;
  lastActiveStep?: string;
  progress: number; // 0-100
  userPreferences: OnboardingPreferences;
}

/**
 * User onboarding preferences
 */
export interface OnboardingPreferences {
  showTutorials: boolean;
  showHelperText: boolean;
  showProgressIndicators: boolean;
  autoAdvanceTutorials: boolean;
  preferredPace: 'slow' | 'normal' | 'fast';
  skipOptionalSteps: boolean;
  reminderFrequency: 'none' | 'daily' | 'weekly';
  completedTutorials: string[];
  dismissedTutorials: string[];
}

/**
 * First-time user context
 */
export interface FirstTimeUserContext {
  isFirstTimeUser: boolean;
  onboardingState: OnboardingState;
  currentTutorial?: Tutorial;
  availableTutorials: Tutorial[];
  userRole?: UserRole;
  showOnboarding: boolean;
}

/**
 * Hook return type
 */
export interface UseFirstTimeUserReturn {
  // State
  isFirstTimeUser: boolean;
  isOnboardingActive: boolean;
  hasCompletedOnboarding: boolean;
  onboardingState: OnboardingState;
  currentStep?: OnboardingStep;
  availableSteps: OnboardingStep[];
  currentTutorial?: Tutorial;
  availableTutorials: Tutorial[];
  context: FirstTimeUserContext;
  
  // Progress tracking
  progress: number;
  completedStepsCount: number;
  totalStepsCount: number;
  remainingStepsCount: number;
  
  // Actions
  markAsReturningUser: () => void;
  startOnboarding: (stepId?: string) => void;
  completeOnboarding: () => void;
  completeStep: (stepId: string) => void;
  skipStep: (stepId: string) => void;
  goToStep: (stepId: string) => void;
  resetOnboarding: () => void;
  
  // Tutorial management
  startTutorial: (tutorialId: string) => void;
  completeTutorial: (tutorialId: string) => void;
  dismissTutorial: (tutorialId: string) => void;
  pauseTutorial: () => void;
  resumeTutorial: () => void;
  
  // Preferences
  updatePreferences: (preferences: Partial<OnboardingPreferences>) => void;
  showHelpForFeature: (featureId: string) => boolean;
  shouldShowTutorial: (tutorialId: string) => boolean;
  
  // Utilities
  isStepCompleted: (stepId: string) => boolean;
  isStepSkipped: (stepId: string) => boolean;
  canAccessStep: (stepId: string) => boolean;
  getNextStep: () => OnboardingStep | undefined;
  getPreviousStep: () => OnboardingStep | undefined;
}

// ============================================================================
// Constants and Configuration
// ============================================================================

/**
 * localStorage keys for persistence
 */
const STORAGE_KEYS = {
  FIRST_TIME_USER: 'configFirstTimeUser',
  ONBOARDING_STATE: 'df_onboarding_state',
  ONBOARDING_PREFERENCES: 'df_onboarding_preferences',
  TUTORIAL_STATE: 'df_tutorial_state',
} as const;

/**
 * Default onboarding preferences
 */
const DEFAULT_PREFERENCES: OnboardingPreferences = {
  showTutorials: true,
  showHelperText: true,
  showProgressIndicators: true,
  autoAdvanceTutorials: false,
  preferredPace: 'normal',
  skipOptionalSteps: false,
  reminderFrequency: 'none',
  completedTutorials: [],
  dismissedTutorials: [],
};

/**
 * Default onboarding steps configuration
 */
const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to DreamFactory',
    description: 'Get familiar with the DreamFactory Admin Interface',
    required: true,
    completed: false,
    skippable: false,
    estimatedTime: 2,
    icon: '👋',
    order: 1,
  },
  {
    id: 'dashboard-tour',
    title: 'Dashboard Overview',
    description: 'Learn about the main dashboard and navigation',
    required: true,
    completed: false,
    skippable: true,
    estimatedTime: 3,
    prerequisites: ['welcome'],
    icon: '📊',
    order: 2,
  },
  {
    id: 'database-connection',
    title: 'Create Your First Database Service',
    description: 'Connect to your database and explore schema discovery',
    required: true,
    completed: false,
    skippable: false,
    estimatedTime: 5,
    prerequisites: ['dashboard-tour'],
    icon: '🔌',
    order: 3,
  },
  {
    id: 'api-generation',
    title: 'Generate REST APIs',
    description: 'Create REST endpoints from your database tables',
    required: true,
    completed: false,
    skippable: false,
    estimatedTime: 4,
    prerequisites: ['database-connection'],
    icon: '⚡',
    order: 4,
  },
  {
    id: 'api-testing',
    title: 'Test Your APIs',
    description: 'Learn how to test and document your generated APIs',
    required: false,
    completed: false,
    skippable: true,
    estimatedTime: 3,
    prerequisites: ['api-generation'],
    icon: '🧪',
    order: 5,
  },
  {
    id: 'security-setup',
    title: 'Configure API Security',
    description: 'Set up authentication and access controls',
    required: false,
    completed: false,
    skippable: true,
    estimatedTime: 6,
    prerequisites: ['api-generation'],
    icon: '🔒',
    order: 6,
  },
  {
    id: 'user-management',
    title: 'Manage Users and Roles',
    description: 'Learn how to add users and configure permissions',
    required: false,
    completed: false,
    skippable: true,
    estimatedTime: 4,
    prerequisites: ['security-setup'],
    icon: '👥',
    order: 7,
  },
  {
    id: 'completion',
    title: 'Onboarding Complete',
    description: 'You\'re ready to use DreamFactory! Explore additional features',
    required: true,
    completed: false,
    skippable: false,
    estimatedTime: 1,
    prerequisites: ['api-generation'],
    icon: '🎉',
    order: 8,
  },
];

/**
 * Tutorial configurations by category
 */
const DEFAULT_TUTORIALS: Tutorial[] = [
  {
    id: 'quick-start',
    title: '5-Minute Quick Start',
    description: 'Generate your first API in under 5 minutes',
    category: 'getting-started',
    targetAudience: ['admin', 'developer'],
    estimatedTime: 5,
    priority: 'high',
    autoStart: true,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to DreamFactory',
        content: 'Let\'s create your first API in just a few steps!',
      },
      {
        id: 'create-service',
        title: 'Create Database Service',
        content: 'Click the "Create Service" button to connect your database',
        target: '[data-testid="create-service-button"]',
        position: 'bottom',
        action: 'click',
        nextTrigger: 'click',
      },
      {
        id: 'test-connection',
        title: 'Test Connection',
        content: 'Fill in your database details and test the connection',
        target: '[data-testid="test-connection-button"]',
        position: 'top',
        action: 'click',
        nextTrigger: 'auto',
        duration: 3,
      },
      {
        id: 'generate-apis',
        title: 'Generate APIs',
        content: 'Your APIs are now generated and ready to use!',
        nextTrigger: 'manual',
      },
    ],
  },
  {
    id: 'database-advanced',
    title: 'Advanced Database Features',
    description: 'Learn about relationships, views, and stored procedures',
    category: 'database-setup',
    targetAudience: ['admin', 'developer'],
    estimatedTime: 15,
    priority: 'medium',
    steps: [],
  },
  {
    id: 'security-best-practices',
    title: 'Security Best Practices',
    description: 'Implement proper authentication and authorization',
    category: 'security-setup',
    targetAudience: ['admin'],
    estimatedTime: 20,
    priority: 'high',
    steps: [],
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safe localStorage operations with error handling
 */
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    } catch (error) {
      console.warn(`Failed to read from localStorage (${key}):`, error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn(`Failed to write to localStorage (${key}):`, error);
    }
  },
  
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Failed to remove from localStorage (${key}):`, error);
    }
  },
};

/**
 * Parse JSON with error handling
 */
function safeJsonParse<T>(json: string | null, defaultValue: T): T {
  if (!json) return defaultValue;
  
  try {
    return JSON.parse(json);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return defaultValue;
  }
}

/**
 * Check if user meets tutorial target audience
 */
function meetsTutorialAudience(tutorial: Tutorial, userRole?: UserRole): boolean {
  if (!userRole || tutorial.targetAudience.length === 0) {
    return true;
  }
  return tutorial.targetAudience.includes(userRole.name);
}

/**
 * Calculate onboarding progress percentage
 */
function calculateProgress(completed: string[], total: OnboardingStep[]): number {
  if (total.length === 0) return 0;
  const requiredSteps = total.filter(step => step.required);
  const completedRequired = completed.filter(stepId => 
    requiredSteps.some(step => step.id === stepId)
  );
  return Math.round((completedRequired.length / requiredSteps.length) * 100);
}

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * First-time user detection and onboarding management hook
 */
export function useFirstTimeUser(user?: UserProfile | null): UseFirstTimeUserReturn {
  // ============================================================================
  // State Management
  // ============================================================================
  
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(() => {
    // Load initial state from localStorage or use defaults
    const storedFirstTime = safeLocalStorage.getItem(STORAGE_KEYS.FIRST_TIME_USER);
    const storedOnboardingState = safeLocalStorage.getItem(STORAGE_KEYS.ONBOARDING_STATE);
    
    const isFirstTimeUser = storedFirstTime ? 
      JSON.parse(storedFirstTime) === true : 
      true; // Default to true for new users
    
    const defaultState: OnboardingState = {
      isFirstTimeUser,
      hasCompletedOnboarding: false,
      completedSteps: [],
      skippedSteps: [],
      progress: 0,
      userPreferences: DEFAULT_PREFERENCES,
    };
    
    return storedOnboardingState ? 
      safeJsonParse(storedOnboardingState, defaultState) : 
      defaultState;
  });
  
  const [preferences, setPreferences] = useState<OnboardingPreferences>(() => {
    const storedPreferences = safeLocalStorage.getItem(STORAGE_KEYS.ONBOARDING_PREFERENCES);
    return storedPreferences ? 
      safeJsonParse(storedPreferences, DEFAULT_PREFERENCES) : 
      DEFAULT_PREFERENCES;
  });
  
  const [currentTutorialId, setCurrentTutorialId] = useState<string | undefined>();
  const [onboardingSteps] = useState<OnboardingStep[]>(DEFAULT_ONBOARDING_STEPS);
  const [tutorials] = useState<Tutorial[]>(DEFAULT_TUTORIALS);
  
  // ============================================================================
  // Computed Values
  // ============================================================================
  
  const availableSteps = useMemo(() => {
    return onboardingSteps
      .map(step => ({
        ...step,
        completed: onboardingState.completedSteps.includes(step.id),
      }))
      .sort((a, b) => a.order - b.order);
  }, [onboardingSteps, onboardingState.completedSteps]);
  
  const currentStep = useMemo(() => {
    if (!onboardingState.currentStep) return undefined;
    return availableSteps.find(step => step.id === onboardingState.currentStep);
  }, [availableSteps, onboardingState.currentStep]);
  
  const currentTutorial = useMemo(() => {
    if (!currentTutorialId) return undefined;
    return tutorials.find(tutorial => tutorial.id === currentTutorialId);
  }, [tutorials, currentTutorialId]);
  
  const availableTutorials = useMemo(() => {
    return tutorials.filter(tutorial => 
      meetsTutorialAudience(tutorial, user?.user_to_app_to_role_by_user_id?.[0]?.role)
    );
  }, [tutorials, user]);
  
  const progress = useMemo(() => {
    return calculateProgress(onboardingState.completedSteps, availableSteps);
  }, [onboardingState.completedSteps, availableSteps]);
  
  const completedStepsCount = onboardingState.completedSteps.length;
  const totalStepsCount = availableSteps.length;
  const remainingStepsCount = totalStepsCount - completedStepsCount;
  
  const context: FirstTimeUserContext = useMemo(() => ({
    isFirstTimeUser: onboardingState.isFirstTimeUser,
    onboardingState,
    currentTutorial,
    availableTutorials,
    userRole: user?.user_to_app_to_role_by_user_id?.[0]?.role,
    showOnboarding: onboardingState.isFirstTimeUser && !onboardingState.hasCompletedOnboarding,
  }), [onboardingState, currentTutorial, availableTutorials, user]);
  
  // ============================================================================
  // Persistence Effects
  // ============================================================================
  
  useEffect(() => {
    safeLocalStorage.setItem(
      STORAGE_KEYS.ONBOARDING_STATE, 
      JSON.stringify(onboardingState)
    );
  }, [onboardingState]);
  
  useEffect(() => {
    safeLocalStorage.setItem(
      STORAGE_KEYS.ONBOARDING_PREFERENCES, 
      JSON.stringify(preferences)
    );
  }, [preferences]);
  
  useEffect(() => {
    safeLocalStorage.setItem(
      STORAGE_KEYS.FIRST_TIME_USER, 
      JSON.stringify(!onboardingState.isFirstTimeUser)
    );
  }, [onboardingState.isFirstTimeUser]);
  
  // ============================================================================
  // Action Handlers
  // ============================================================================
  
  const markAsReturningUser = useCallback(() => {
    setOnboardingState(prev => ({
      ...prev,
      isFirstTimeUser: false,
      hasCompletedOnboarding: true,
      completedAt: new Date().toISOString(),
    }));
  }, []);
  
  const startOnboarding = useCallback((stepId?: string) => {
    const firstStep = stepId || availableSteps[0]?.id;
    setOnboardingState(prev => ({
      ...prev,
      currentStep: firstStep,
      startedAt: prev.startedAt || new Date().toISOString(),
    }));
  }, [availableSteps]);
  
  const completeOnboarding = useCallback(() => {
    setOnboardingState(prev => ({
      ...prev,
      hasCompletedOnboarding: true,
      isFirstTimeUser: false,
      completedAt: new Date().toISOString(),
      progress: 100,
    }));
  }, []);
  
  const completeStep = useCallback((stepId: string) => {
    setOnboardingState(prev => {
      const updatedCompleted = [...prev.completedSteps];
      if (!updatedCompleted.includes(stepId)) {
        updatedCompleted.push(stepId);
      }
      
      const updatedSkipped = prev.skippedSteps.filter(id => id !== stepId);
      const newProgress = calculateProgress(updatedCompleted, availableSteps);
      
      // Auto-advance to next step if configured
      const completedStep = availableSteps.find(step => step.id === stepId);
      const nextStep = getNextStep(stepId, availableSteps, updatedCompleted);
      
      return {
        ...prev,
        completedSteps: updatedCompleted,
        skippedSteps: updatedSkipped,
        currentStep: nextStep?.id,
        lastActiveStep: stepId,
        progress: newProgress,
        hasCompletedOnboarding: newProgress === 100,
        completedAt: newProgress === 100 ? new Date().toISOString() : prev.completedAt,
      };
    });
  }, [availableSteps]);
  
  const skipStep = useCallback((stepId: string) => {
    setOnboardingState(prev => {
      const step = availableSteps.find(s => s.id === stepId);
      if (!step?.skippable) return prev; // Can't skip required steps
      
      const updatedSkipped = [...prev.skippedSteps];
      if (!updatedSkipped.includes(stepId)) {
        updatedSkipped.push(stepId);
      }
      
      const nextStep = getNextStep(stepId, availableSteps, prev.completedSteps);
      
      return {
        ...prev,
        skippedSteps: updatedSkipped,
        currentStep: nextStep?.id,
        lastActiveStep: stepId,
      };
    });
  }, [availableSteps]);
  
  const goToStep = useCallback((stepId: string) => {
    const step = availableSteps.find(s => s.id === stepId);
    if (!step) return;
    
    // Check prerequisites
    const canAccess = canAccessStep(stepId, availableSteps, onboardingState.completedSteps);
    if (!canAccess) return;
    
    setOnboardingState(prev => ({
      ...prev,
      currentStep: stepId,
    }));
  }, [availableSteps, onboardingState.completedSteps]);
  
  const resetOnboarding = useCallback(() => {
    setOnboardingState({
      isFirstTimeUser: true,
      hasCompletedOnboarding: false,
      completedSteps: [],
      skippedSteps: [],
      progress: 0,
      userPreferences: preferences,
      currentStep: availableSteps[0]?.id,
    });
    setCurrentTutorialId(undefined);
  }, [availableSteps, preferences]);
  
  // Tutorial management
  const startTutorial = useCallback((tutorialId: string) => {
    const tutorial = tutorials.find(t => t.id === tutorialId);
    if (!tutorial) return;
    
    setCurrentTutorialId(tutorialId);
  }, [tutorials]);
  
  const completeTutorial = useCallback((tutorialId: string) => {
    setPreferences(prev => ({
      ...prev,
      completedTutorials: [...prev.completedTutorials, tutorialId],
    }));
    setCurrentTutorialId(undefined);
  }, []);
  
  const dismissTutorial = useCallback((tutorialId: string) => {
    setPreferences(prev => ({
      ...prev,
      dismissedTutorials: [...prev.dismissedTutorials, tutorialId],
    }));
    setCurrentTutorialId(undefined);
  }, []);
  
  const pauseTutorial = useCallback(() => {
    setCurrentTutorialId(undefined);
  }, []);
  
  const resumeTutorial = useCallback(() => {
    // Resume last tutorial or start appropriate one
    const relevantTutorial = availableTutorials.find(t => 
      !preferences.completedTutorials.includes(t.id) &&
      !preferences.dismissedTutorials.includes(t.id)
    );
    if (relevantTutorial) {
      setCurrentTutorialId(relevantTutorial.id);
    }
  }, [availableTutorials, preferences]);
  
  const updatePreferences = useCallback((newPreferences: Partial<OnboardingPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences,
    }));
  }, []);
  
  // ============================================================================
  // Utility Functions
  // ============================================================================
  
  const showHelpForFeature = useCallback((featureId: string): boolean => {
    return preferences.showHelperText && onboardingState.isFirstTimeUser;
  }, [preferences.showHelperText, onboardingState.isFirstTimeUser]);
  
  const shouldShowTutorial = useCallback((tutorialId: string): boolean => {
    return preferences.showTutorials &&
           !preferences.completedTutorials.includes(tutorialId) &&
           !preferences.dismissedTutorials.includes(tutorialId);
  }, [preferences]);
  
  const isStepCompleted = useCallback((stepId: string): boolean => {
    return onboardingState.completedSteps.includes(stepId);
  }, [onboardingState.completedSteps]);
  
  const isStepSkipped = useCallback((stepId: string): boolean => {
    return onboardingState.skippedSteps.includes(stepId);
  }, [onboardingState.skippedSteps]);
  
  const canAccessStepFunc = useCallback((stepId: string): boolean => {
    return canAccessStep(stepId, availableSteps, onboardingState.completedSteps);
  }, [availableSteps, onboardingState.completedSteps]);
  
  const getNextStep = useCallback((): OnboardingStep | undefined => {
    if (!onboardingState.currentStep) return availableSteps[0];
    return getNextStepHelper(onboardingState.currentStep, availableSteps, onboardingState.completedSteps);
  }, [onboardingState.currentStep, availableSteps, onboardingState.completedSteps]);
  
  const getPreviousStep = useCallback((): OnboardingStep | undefined => {
    if (!onboardingState.currentStep) return undefined;
    const currentIndex = availableSteps.findIndex(step => step.id === onboardingState.currentStep);
    return currentIndex > 0 ? availableSteps[currentIndex - 1] : undefined;
  }, [onboardingState.currentStep, availableSteps]);
  
  // ============================================================================
  // Return Hook Interface
  // ============================================================================
  
  return {
    // State
    isFirstTimeUser: onboardingState.isFirstTimeUser,
    isOnboardingActive: !onboardingState.hasCompletedOnboarding && onboardingState.isFirstTimeUser,
    hasCompletedOnboarding: onboardingState.hasCompletedOnboarding,
    onboardingState,
    currentStep,
    availableSteps,
    currentTutorial,
    availableTutorials,
    context,
    
    // Progress tracking
    progress,
    completedStepsCount,
    totalStepsCount,
    remainingStepsCount,
    
    // Actions
    markAsReturningUser,
    startOnboarding,
    completeOnboarding,
    completeStep,
    skipStep,
    goToStep,
    resetOnboarding,
    
    // Tutorial management
    startTutorial,
    completeTutorial,
    dismissTutorial,
    pauseTutorial,
    resumeTutorial,
    
    // Preferences
    updatePreferences,
    showHelpForFeature,
    shouldShowTutorial,
    
    // Utilities
    isStepCompleted,
    isStepSkipped,
    canAccessStep: canAccessStepFunc,
    getNextStep,
    getPreviousStep,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a step can be accessed based on prerequisites
 */
function canAccessStep(
  stepId: string, 
  steps: OnboardingStep[], 
  completed: string[]
): boolean {
  const step = steps.find(s => s.id === stepId);
  if (!step) return false;
  
  if (!step.prerequisites || step.prerequisites.length === 0) {
    return true;
  }
  
  return step.prerequisites.every(prereq => completed.includes(prereq));
}

/**
 * Get the next available step
 */
function getNextStep(
  currentStepId: string, 
  steps: OnboardingStep[], 
  completed: string[]
): OnboardingStep | undefined {
  const currentIndex = steps.findIndex(step => step.id === currentStepId);
  if (currentIndex === -1) return steps[0];
  
  for (let i = currentIndex + 1; i < steps.length; i++) {
    const step = steps[i];
    if (canAccessStep(step.id, steps, completed) && !completed.includes(step.id)) {
      return step;
    }
  }
  
  return undefined;
}

/**
 * Helper function for getNextStep callback
 */
function getNextStepHelper(
  currentStepId: string, 
  steps: OnboardingStep[], 
  completed: string[]
): OnboardingStep | undefined {
  return getNextStep(currentStepId, steps, completed);
}

/**
 * Export hook for use throughout the application
 */
export default useFirstTimeUser;

/**
 * Export types for external use
 */
export type {
  OnboardingStep,
  Tutorial,
  TutorialStep,
  TutorialCategory,
  OnboardingState,
  OnboardingPreferences,
  FirstTimeUserContext,
  UseFirstTimeUserReturn,
};