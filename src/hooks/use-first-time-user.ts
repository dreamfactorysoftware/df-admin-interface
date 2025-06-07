/**
 * First-Time User Detection Hook for DreamFactory React/Next.js Admin Interface
 * 
 * Comprehensive first-time user detection and onboarding state management that replaces
 * Angular DFStorageService patterns with React state management for first-time user workflows
 * and enhanced onboarding experiences throughout the application.
 * 
 * Key Features:
 * - First-time user detection with localStorage persistence across browser sessions
 * - Comprehensive onboarding state management with tutorial progression tracking
 * - Integration with authentication system for first-time user flag coordination
 * - User experience customization based on first-time user status and user roles
 * - Onboarding completion workflows with automatic state updates and persistence
 * - Tutorial and help system integration with contextual guidance flows
 * 
 * Performance Features:
 * - Automatic localStorage synchronization with cross-tab state management
 * - Optimized state updates with debounced persistence for performance
 * - Memory-efficient state management with automatic cleanup on unmount
 * - Integration with React Query patterns for server-side onboarding data
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from './use-local-storage';
import type { UserProfile, UserSession, AdminCapability } from '../types/user';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Onboarding step categories for different workflows
 */
export type OnboardingCategory = 
  | 'welcome'
  | 'dashboard'
  | 'database_service'
  | 'schema_discovery'
  | 'api_generation'
  | 'user_management'
  | 'system_configuration'
  | 'security_setup'
  | 'advanced_features';

/**
 * Tutorial step status for progression tracking
 */
export type TutorialStepStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

/**
 * Onboarding step definition for guided workflows
 */
export interface OnboardingStep {
  id: string;
  category: OnboardingCategory;
  title: string;
  description: string;
  status: TutorialStepStatus;
  order: number;
  isRequired: boolean;
  requiredRole?: string[];
  requiredCapabilities?: AdminCapability[];
  dependencies?: string[]; // Other step IDs that must be completed first
  estimatedDuration: number; // in minutes
  helpArticleId?: string;
  videoUrl?: string;
  completed_at?: string;
  skipped_at?: string;
}

/**
 * Tutorial series for comprehensive onboarding workflows
 */
export interface TutorialSeries {
  id: string;
  category: OnboardingCategory;
  title: string;
  description: string;
  steps: OnboardingStep[];
  isRequired: boolean;
  requiredRole?: string[];
  requiredCapabilities?: AdminCapability[];
  estimatedDuration: number;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  status: TutorialStepStatus;
  started_at?: string;
  completed_at?: string;
}

/**
 * User onboarding preferences and customization
 */
export interface OnboardingPreferences {
  showWelcomeTooltips: boolean;
  autoStartTutorials: boolean;
  enableContextualHelp: boolean;
  preferredTutorialSpeed: 'slow' | 'normal' | 'fast';
  completedIntroductions: string[];
  dismissedNotifications: string[];
  preferredHelpFormat: 'tooltip' | 'modal' | 'sidebar' | 'video';
  skipOptionalSteps: boolean;
  enableProgressTracking: boolean;
}

/**
 * First-time user experience flags and states
 */
export interface FirstTimeUserFlags {
  isFirstTimeUser: boolean;
  hasSeenWelcomeModal: boolean;
  hasCreatedFirstService: boolean;
  hasGeneratedFirstAPI: boolean;
  hasConfiguredSecurity: boolean;
  hasInvitedUsers: boolean;
  hasExploredDocumentation: boolean;
  hasUsedAdvancedFeatures: boolean;
  hasCompletedOnboarding: boolean;
  registrationSource?: 'organic' | 'invitation' | 'trial' | 'demo';
  firstLoginDate?: string;
  onboardingStartedDate?: string;
  onboardingCompletedDate?: string;
}

/**
 * Comprehensive first-time user state
 */
export interface FirstTimeUserState {
  flags: FirstTimeUserFlags;
  preferences: OnboardingPreferences;
  tutorials: TutorialSeries[];
  currentTutorial?: TutorialSeries;
  currentStep?: OnboardingStep;
  availableSteps: OnboardingStep[];
  nextRecommendedSteps: OnboardingStep[];
  progressOverall: {
    completed: number;
    total: number;
    percentage: number;
  };
  lastActivity?: string;
  onboardingSessionId?: string;
}

/**
 * Hook return interface for first-time user management
 */
export interface UseFirstTimeUserReturn {
  // Core state
  isFirstTimeUser: boolean;
  isOnboardingActive: boolean;
  isOnboardingCompleted: boolean;
  firstTimeUserState: FirstTimeUserState;
  
  // Tutorial management
  currentTutorial: TutorialSeries | null;
  currentStep: OnboardingStep | null;
  availableTutorials: TutorialSeries[];
  nextRecommendedSteps: OnboardingStep[];
  progressOverall: { completed: number; total: number; percentage: number };
  
  // Actions
  markFirstTimeUserCompleted: () => void;
  startOnboarding: (category?: OnboardingCategory) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  
  // Tutorial actions
  startTutorial: (tutorialId: string) => void;
  completeTutorial: (tutorialId: string) => void;
  skipTutorial: (tutorialId: string) => void;
  
  // Step actions
  startStep: (stepId: string) => void;
  completeStep: (stepId: string) => void;
  skipStep: (stepId: string) => void;
  goToStep: (stepId: string) => void;
  getNextStep: () => OnboardingStep | null;
  getPreviousStep: () => OnboardingStep | null;
  
  // Experience customization
  updatePreferences: (preferences: Partial<OnboardingPreferences>) => void;
  markFeatureIntroduced: (featureId: string) => void;
  dismissNotification: (notificationId: string) => void;
  shouldShowTooltip: (tooltipId: string) => boolean;
  shouldShowHelp: (contextId: string) => boolean;
  
  // User role integration
  getAvailableStepsForUser: (user: UserProfile) => OnboardingStep[];
  isStepAvailableForUser: (stepId: string, user: UserProfile) => boolean;
  getRecommendedTutorialsForRole: (role: string) => TutorialSeries[];
  
  // Persistence and synchronization
  saveState: () => void;
  loadState: () => void;
  syncWithServer: () => Promise<void>;
  exportProgress: () => string;
  importProgress: (data: string) => boolean;
  
  // Analytics and tracking
  trackOnboardingEvent: (event: string, metadata?: Record<string, any>) => void;
  getOnboardingAnalytics: () => Record<string, any>;
  getCompletionTimeEstimate: () => number;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default onboarding preferences
 */
const DEFAULT_PREFERENCES: OnboardingPreferences = {
  showWelcomeTooltips: true,
  autoStartTutorials: true,
  enableContextualHelp: true,
  preferredTutorialSpeed: 'normal',
  completedIntroductions: [],
  dismissedNotifications: [],
  preferredHelpFormat: 'tooltip',
  skipOptionalSteps: false,
  enableProgressTracking: true,
};

/**
 * Default first-time user flags
 */
const DEFAULT_FLAGS: FirstTimeUserFlags = {
  isFirstTimeUser: true,
  hasSeenWelcomeModal: false,
  hasCreatedFirstService: false,
  hasGeneratedFirstAPI: false,
  hasConfiguredSecurity: false,
  hasInvitedUsers: false,
  hasExploredDocumentation: false,
  hasUsedAdvancedFeatures: false,
  hasCompletedOnboarding: false,
  registrationSource: 'organic',
  firstLoginDate: new Date().toISOString(),
};

/**
 * Default tutorial series configuration for comprehensive onboarding
 */
const DEFAULT_TUTORIAL_SERIES: TutorialSeries[] = [
  {
    id: 'welcome_tour',
    category: 'welcome',
    title: 'Welcome to DreamFactory',
    description: 'Get started with the basics and learn about key features',
    steps: [
      {
        id: 'welcome_modal',
        category: 'welcome',
        title: 'Welcome to DreamFactory',
        description: 'Learn about DreamFactory\'s capabilities for API generation',
        status: 'not_started',
        order: 1,
        isRequired: true,
        dependencies: [],
        estimatedDuration: 2,
        helpArticleId: 'getting_started',
      },
      {
        id: 'dashboard_overview',
        category: 'dashboard',
        title: 'Dashboard Overview',
        description: 'Understand the main dashboard and navigation',
        status: 'not_started',
        order: 2,
        isRequired: true,
        dependencies: ['welcome_modal'],
        estimatedDuration: 3,
        helpArticleId: 'dashboard_guide',
      },
      {
        id: 'navigation_tour',
        category: 'dashboard',
        title: 'Navigation Tour',
        description: 'Learn about main navigation and key sections',
        status: 'not_started',
        order: 3,
        isRequired: false,
        dependencies: ['dashboard_overview'],
        estimatedDuration: 5,
        helpArticleId: 'navigation_guide',
      },
    ],
    isRequired: true,
    estimatedDuration: 10,
    progress: { completed: 0, total: 3, percentage: 0 },
    status: 'not_started',
  },
  {
    id: 'first_api_creation',
    category: 'database_service',
    title: 'Create Your First API',
    description: 'Complete end-to-end workflow for API generation',
    steps: [
      {
        id: 'create_database_service',
        category: 'database_service',
        title: 'Create Database Service',
        description: 'Set up your first database connection',
        status: 'not_started',
        order: 1,
        isRequired: true,
        dependencies: ['dashboard_overview'],
        estimatedDuration: 5,
        helpArticleId: 'database_connection',
        videoUrl: '/videos/database-setup.mp4',
      },
      {
        id: 'test_connection',
        category: 'database_service',
        title: 'Test Database Connection',
        description: 'Verify your database connection is working',
        status: 'not_started',
        order: 2,
        isRequired: true,
        dependencies: ['create_database_service'],
        estimatedDuration: 2,
        helpArticleId: 'connection_testing',
      },
      {
        id: 'discover_schema',
        category: 'schema_discovery',
        title: 'Discover Database Schema',
        description: 'Explore your database tables and structure',
        status: 'not_started',
        order: 3,
        isRequired: true,
        dependencies: ['test_connection'],
        estimatedDuration: 8,
        helpArticleId: 'schema_discovery',
        videoUrl: '/videos/schema-exploration.mp4',
      },
      {
        id: 'generate_first_api',
        category: 'api_generation',
        title: 'Generate Your First API',
        description: 'Create REST APIs for your database tables',
        status: 'not_started',
        order: 4,
        isRequired: true,
        dependencies: ['discover_schema'],
        estimatedDuration: 10,
        helpArticleId: 'api_generation',
        videoUrl: '/videos/api-generation.mp4',
      },
      {
        id: 'test_generated_api',
        category: 'api_generation',
        title: 'Test Your Generated API',
        description: 'Learn how to test and use your new APIs',
        status: 'not_started',
        order: 5,
        isRequired: false,
        dependencies: ['generate_first_api'],
        estimatedDuration: 7,
        helpArticleId: 'api_testing',
      },
    ],
    isRequired: true,
    estimatedDuration: 32,
    progress: { completed: 0, total: 5, percentage: 0 },
    status: 'not_started',
  },
  {
    id: 'security_configuration',
    category: 'security_setup',
    title: 'Security Configuration',
    description: 'Set up security roles and API access control',
    steps: [
      {
        id: 'create_api_key',
        category: 'security_setup',
        title: 'Create API Key',
        description: 'Generate API keys for secure access',
        status: 'not_started',
        order: 1,
        isRequired: true,
        dependencies: ['generate_first_api'],
        estimatedDuration: 5,
        helpArticleId: 'api_keys',
      },
      {
        id: 'configure_roles',
        category: 'security_setup',
        title: 'Configure User Roles',
        description: 'Set up role-based access control',
        status: 'not_started',
        order: 2,
        isRequired: false,
        requiredRole: ['admin'],
        requiredCapabilities: ['security_management'],
        dependencies: ['create_api_key'],
        estimatedDuration: 10,
        helpArticleId: 'role_management',
      },
    ],
    isRequired: false,
    requiredRole: ['admin'],
    estimatedDuration: 15,
    progress: { completed: 0, total: 2, percentage: 0 },
    status: 'not_started',
  },
  {
    id: 'user_management',
    category: 'user_management',
    title: 'User Management',
    description: 'Invite and manage team members',
    steps: [
      {
        id: 'invite_first_user',
        category: 'user_management',
        title: 'Invite Team Members',
        description: 'Add your first team member',
        status: 'not_started',
        order: 1,
        isRequired: false,
        requiredRole: ['admin'],
        requiredCapabilities: ['user_management'],
        dependencies: ['configure_roles'],
        estimatedDuration: 5,
        helpArticleId: 'user_invitations',
      },
    ],
    isRequired: false,
    requiredRole: ['admin'],
    requiredCapabilities: ['user_management'],
    estimatedDuration: 5,
    progress: { completed: 0, total: 1, percentage: 0 },
    status: 'not_started',
  },
];

// ============================================================================
// MAIN HOOK IMPLEMENTATION
// ============================================================================

/**
 * First-time user detection and onboarding management hook
 * 
 * Provides comprehensive first-time user experience management with localStorage persistence,
 * tutorial progression tracking, user role integration, and onboarding workflow coordination.
 * Replaces Angular DFStorageService patterns with modern React state management.
 * 
 * @param user - Current user profile for role-based customization
 * @param session - Current user session for integration with authentication
 * @returns Comprehensive first-time user management interface
 */
export function useFirstTimeUser(
  user?: UserProfile | null,
  session?: UserSession | null
): UseFirstTimeUserReturn {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Main first-time user state with localStorage persistence
  const [firstTimeUserState, setFirstTimeUserState] = useLocalStorage<FirstTimeUserState>(
    'dreamFactory_firstTimeUser',
    {
      flags: DEFAULT_FLAGS,
      preferences: DEFAULT_PREFERENCES,
      tutorials: DEFAULT_TUTORIAL_SERIES,
      availableSteps: [],
      nextRecommendedSteps: [],
      progressOverall: { completed: 0, total: 0, percentage: 0 },
      onboardingSessionId: crypto.randomUUID?.() || `session_${Date.now()}`,
    }
  );

  // Derived state for quick access
  const [currentTutorial, setCurrentTutorial] = useState<TutorialSeries | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [onboardingStartTime] = useState<Date>(new Date());

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Main first-time user detection flag
   */
  const isFirstTimeUser = useMemo(() => {
    return firstTimeUserState.flags.isFirstTimeUser && !firstTimeUserState.flags.hasCompletedOnboarding;
  }, [firstTimeUserState.flags.isFirstTimeUser, firstTimeUserState.flags.hasCompletedOnboarding]);

  /**
   * Check if onboarding is currently active
   */
  const isOnboardingActive = useMemo(() => {
    return isFirstTimeUser && firstTimeUserState.onboardingStartedDate && !firstTimeUserState.flags.hasCompletedOnboarding;
  }, [isFirstTimeUser, firstTimeUserState.onboardingStartedDate, firstTimeUserState.flags.hasCompletedOnboarding]);

  /**
   * Check if onboarding has been completed
   */
  const isOnboardingCompleted = useMemo(() => {
    return firstTimeUserState.flags.hasCompletedOnboarding || false;
  }, [firstTimeUserState.flags.hasCompletedOnboarding]);

  /**
   * Available tutorials based on user role and capabilities
   */
  const availableTutorials = useMemo(() => {
    if (!user) return firstTimeUserState.tutorials;

    return firstTimeUserState.tutorials.filter(tutorial => {
      // Check role requirements
      if (tutorial.requiredRole && tutorial.requiredRole.length > 0) {
        const userRole = user.role?.name || '';
        if (!tutorial.requiredRole.includes(userRole)) {
          return false;
        }
      }

      // Check capability requirements for admin users
      if (tutorial.requiredCapabilities && tutorial.requiredCapabilities.length > 0) {
        const adminUser = user as any; // Type assertion for admin capabilities
        const userCapabilities = adminUser.adminCapabilities || [];
        return tutorial.requiredCapabilities.some(cap => userCapabilities.includes(cap));
      }

      return true;
    });
  }, [firstTimeUserState.tutorials, user]);

  /**
   * Available steps based on user permissions and tutorial dependencies
   */
  const availableSteps = useMemo(() => {
    const allSteps = availableTutorials.flatMap(tutorial => tutorial.steps);
    return allSteps.filter(step => {
      // Check role requirements
      if (step.requiredRole && step.requiredRole.length > 0) {
        const userRole = user?.role?.name || '';
        if (!step.requiredRole.includes(userRole)) {
          return false;
        }
      }

      // Check capability requirements
      if (step.requiredCapabilities && step.requiredCapabilities.length > 0) {
        const adminUser = user as any;
        const userCapabilities = adminUser.adminCapabilities || [];
        return step.requiredCapabilities.some(cap => userCapabilities.includes(cap));
      }

      // Check dependencies
      if (step.dependencies && step.dependencies.length > 0) {
        return step.dependencies.every(depId => {
          const depStep = allSteps.find(s => s.id === depId);
          return depStep?.status === 'completed';
        });
      }

      return true;
    });
  }, [availableTutorials, user]);

  /**
   * Next recommended steps for progressive onboarding
   */
  const nextRecommendedSteps = useMemo(() => {
    return availableSteps
      .filter(step => step.status === 'not_started' && step.isRequired)
      .sort((a, b) => a.order - b.order)
      .slice(0, 3); // Show top 3 recommended steps
  }, [availableSteps]);

  /**
   * Overall progress calculation
   */
  const progressOverall = useMemo(() => {
    const totalSteps = availableSteps.length;
    const completedSteps = availableSteps.filter(step => step.status === 'completed').length;
    const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return {
      completed: completedSteps,
      total: totalSteps,
      percentage,
    };
  }, [availableSteps]);

  // ============================================================================
  // CORE ACTIONS
  // ============================================================================

  /**
   * Mark first-time user as completed (legacy compatibility)
   */
  const markFirstTimeUserCompleted = useCallback(() => {
    setFirstTimeUserState(prev => ({
      ...prev,
      flags: {
        ...prev.flags,
        isFirstTimeUser: false,
        hasCompletedOnboarding: true,
        onboardingCompletedDate: new Date().toISOString(),
      },
      lastActivity: new Date().toISOString(),
    }));
  }, [setFirstTimeUserState]);

  /**
   * Start onboarding process
   */
  const startOnboarding = useCallback((category?: OnboardingCategory) => {
    const startDate = new Date().toISOString();
    
    setFirstTimeUserState(prev => ({
      ...prev,
      flags: {
        ...prev.flags,
        isFirstTimeUser: true,
        hasCompletedOnboarding: false,
        onboardingStartedDate: startDate,
      },
      lastActivity: startDate,
    }));

    // Start with recommended tutorial or specific category
    if (category) {
      const targetTutorial = availableTutorials.find(t => t.category === category);
      if (targetTutorial) {
        startTutorial(targetTutorial.id);
      }
    } else {
      // Start with welcome tour by default
      const welcomeTutorial = availableTutorials.find(t => t.id === 'welcome_tour');
      if (welcomeTutorial) {
        startTutorial(welcomeTutorial.id);
      }
    }
  }, [setFirstTimeUserState, availableTutorials]);

  /**
   * Complete entire onboarding process
   */
  const completeOnboarding = useCallback(() => {
    const completedDate = new Date().toISOString();
    
    setFirstTimeUserState(prev => ({
      ...prev,
      flags: {
        ...prev.flags,
        isFirstTimeUser: false,
        hasCompletedOnboarding: true,
        onboardingCompletedDate: completedDate,
      },
      lastActivity: completedDate,
    }));

    setCurrentTutorial(null);
    setCurrentStep(null);
  }, [setFirstTimeUserState]);

  /**
   * Skip onboarding process
   */
  const skipOnboarding = useCallback(() => {
    const skippedDate = new Date().toISOString();
    
    setFirstTimeUserState(prev => ({
      ...prev,
      flags: {
        ...prev.flags,
        isFirstTimeUser: false,
        hasCompletedOnboarding: true,
        onboardingCompletedDate: skippedDate,
      },
      tutorials: prev.tutorials.map(tutorial => ({
        ...tutorial,
        status: 'skipped' as TutorialStepStatus,
        steps: tutorial.steps.map(step => ({
          ...step,
          status: 'skipped' as TutorialStepStatus,
          skipped_at: skippedDate,
        })),
      })),
      lastActivity: skippedDate,
    }));

    setCurrentTutorial(null);
    setCurrentStep(null);
  }, [setFirstTimeUserState]);

  /**
   * Reset onboarding to start fresh
   */
  const resetOnboarding = useCallback(() => {
    setFirstTimeUserState({
      flags: { ...DEFAULT_FLAGS, firstLoginDate: new Date().toISOString() },
      preferences: DEFAULT_PREFERENCES,
      tutorials: DEFAULT_TUTORIAL_SERIES,
      availableSteps: [],
      nextRecommendedSteps: [],
      progressOverall: { completed: 0, total: 0, percentage: 0 },
      onboardingSessionId: crypto.randomUUID?.() || `session_${Date.now()}`,
    });

    setCurrentTutorial(null);
    setCurrentStep(null);
  }, [setFirstTimeUserState]);

  // ============================================================================
  // TUTORIAL MANAGEMENT
  // ============================================================================

  /**
   * Start a specific tutorial
   */
  const startTutorial = useCallback((tutorialId: string) => {
    const tutorial = availableTutorials.find(t => t.id === tutorialId);
    if (!tutorial) return;

    const startedDate = new Date().toISOString();
    
    setFirstTimeUserState(prev => ({
      ...prev,
      tutorials: prev.tutorials.map(t => 
        t.id === tutorialId 
          ? { ...t, status: 'in_progress' as TutorialStepStatus, started_at: startedDate }
          : t
      ),
      currentTutorial: tutorial,
      lastActivity: startedDate,
    }));

    setCurrentTutorial({ ...tutorial, status: 'in_progress', started_at: startedDate });
    
    // Start first available step
    const firstStep = tutorial.steps.find(step => step.status === 'not_started');
    if (firstStep) {
      startStep(firstStep.id);
    }
  }, [availableTutorials, setFirstTimeUserState]);

  /**
   * Complete a tutorial
   */
  const completeTutorial = useCallback((tutorialId: string) => {
    const completedDate = new Date().toISOString();
    
    setFirstTimeUserState(prev => ({
      ...prev,
      tutorials: prev.tutorials.map(t => 
        t.id === tutorialId 
          ? { 
              ...t, 
              status: 'completed' as TutorialStepStatus,
              completed_at: completedDate,
              steps: t.steps.map(step => ({
                ...step,
                status: step.status === 'not_started' ? 'completed' as TutorialStepStatus : step.status,
                completed_at: step.status === 'not_started' ? completedDate : step.completed_at,
              })),
            }
          : t
      ),
      lastActivity: completedDate,
    }));

    // Move to next tutorial if available
    const nextTutorial = availableTutorials.find(t => 
      t.status === 'not_started' && 
      t.id !== tutorialId
    );
    
    if (nextTutorial) {
      setCurrentTutorial(nextTutorial);
    } else {
      setCurrentTutorial(null);
      setCurrentStep(null);
    }
  }, [availableTutorials, setFirstTimeUserState]);

  /**
   * Skip a tutorial
   */
  const skipTutorial = useCallback((tutorialId: string) => {
    const skippedDate = new Date().toISOString();
    
    setFirstTimeUserState(prev => ({
      ...prev,
      tutorials: prev.tutorials.map(t => 
        t.id === tutorialId 
          ? { 
              ...t, 
              status: 'skipped' as TutorialStepStatus,
              steps: t.steps.map(step => ({
                ...step,
                status: step.status === 'not_started' ? 'skipped' as TutorialStepStatus : step.status,
                skipped_at: step.status === 'not_started' ? skippedDate : step.skipped_at,
              })),
            }
          : t
      ),
      lastActivity: skippedDate,
    }));

    if (currentTutorial?.id === tutorialId) {
      setCurrentTutorial(null);
      setCurrentStep(null);
    }
  }, [currentTutorial, setFirstTimeUserState]);

  // ============================================================================
  // STEP MANAGEMENT
  // ============================================================================

  /**
   * Start a specific step
   */
  const startStep = useCallback((stepId: string) => {
    const step = availableSteps.find(s => s.id === stepId);
    if (!step) return;

    const startedDate = new Date().toISOString();
    
    setFirstTimeUserState(prev => ({
      ...prev,
      tutorials: prev.tutorials.map(tutorial => ({
        ...tutorial,
        steps: tutorial.steps.map(s => 
          s.id === stepId 
            ? { ...s, status: 'in_progress' as TutorialStepStatus }
            : s
        ),
      })),
      currentStep: step,
      lastActivity: startedDate,
    }));

    setCurrentStep({ ...step, status: 'in_progress' });
  }, [availableSteps, setFirstTimeUserState]);

  /**
   * Complete a specific step
   */
  const completeStep = useCallback((stepId: string) => {
    const completedDate = new Date().toISOString();
    
    setFirstTimeUserState(prev => ({
      ...prev,
      tutorials: prev.tutorials.map(tutorial => ({
        ...tutorial,
        steps: tutorial.steps.map(s => 
          s.id === stepId 
            ? { ...s, status: 'completed' as TutorialStepStatus, completed_at: completedDate }
            : s
        ),
      })),
      lastActivity: completedDate,
    }));

    // Update flags based on completed step
    if (stepId === 'create_database_service') {
      setFirstTimeUserState(prev => ({
        ...prev,
        flags: { ...prev.flags, hasCreatedFirstService: true },
      }));
    } else if (stepId === 'generate_first_api') {
      setFirstTimeUserState(prev => ({
        ...prev,
        flags: { ...prev.flags, hasGeneratedFirstAPI: true },
      }));
    } else if (stepId === 'configure_roles') {
      setFirstTimeUserState(prev => ({
        ...prev,
        flags: { ...prev.flags, hasConfiguredSecurity: true },
      }));
    } else if (stepId === 'invite_first_user') {
      setFirstTimeUserState(prev => ({
        ...prev,
        flags: { ...prev.flags, hasInvitedUsers: true },
      }));
    }

    // Move to next step automatically
    const nextStep = getNextStep();
    if (nextStep) {
      setCurrentStep(nextStep);
    } else {
      setCurrentStep(null);
      // Check if tutorial is complete
      if (currentTutorial) {
        const allStepsCompleted = currentTutorial.steps.every(s => 
          s.status === 'completed' || s.status === 'skipped' || !s.isRequired
        );
        if (allStepsCompleted) {
          completeTutorial(currentTutorial.id);
        }
      }
    }
  }, [setFirstTimeUserState, currentTutorial]);

  /**
   * Skip a specific step
   */
  const skipStep = useCallback((stepId: string) => {
    const skippedDate = new Date().toISOString();
    
    setFirstTimeUserState(prev => ({
      ...prev,
      tutorials: prev.tutorials.map(tutorial => ({
        ...tutorial,
        steps: tutorial.steps.map(s => 
          s.id === stepId 
            ? { ...s, status: 'skipped' as TutorialStepStatus, skipped_at: skippedDate }
            : s
        ),
      })),
      lastActivity: skippedDate,
    }));

    // Move to next step
    const nextStep = getNextStep();
    if (nextStep) {
      setCurrentStep(nextStep);
    } else {
      setCurrentStep(null);
    }
  }, [setFirstTimeUserState]);

  /**
   * Navigate directly to a specific step
   */
  const goToStep = useCallback((stepId: string) => {
    const step = availableSteps.find(s => s.id === stepId);
    if (!step) return;

    // Check if dependencies are met
    const allDependenciesMet = step.dependencies?.every(depId => {
      const depStep = availableSteps.find(s => s.id === depId);
      return depStep?.status === 'completed';
    }) ?? true;

    if (allDependenciesMet) {
      startStep(stepId);
    }
  }, [availableSteps, startStep]);

  /**
   * Get the next step in sequence
   */
  const getNextStep = useCallback((): OnboardingStep | null => {
    if (!currentStep || !currentTutorial) return null;

    const currentStepIndex = currentTutorial.steps.findIndex(s => s.id === currentStep.id);
    const nextSteps = currentTutorial.steps
      .slice(currentStepIndex + 1)
      .filter(step => step.status === 'not_started');

    return nextSteps[0] || null;
  }, [currentStep, currentTutorial]);

  /**
   * Get the previous step in sequence
   */
  const getPreviousStep = useCallback((): OnboardingStep | null => {
    if (!currentStep || !currentTutorial) return null;

    const currentStepIndex = currentTutorial.steps.findIndex(s => s.id === currentStep.id);
    const previousSteps = currentTutorial.steps
      .slice(0, currentStepIndex)
      .reverse();

    return previousSteps[0] || null;
  }, [currentStep, currentTutorial]);

  // ============================================================================
  // EXPERIENCE CUSTOMIZATION
  // ============================================================================

  /**
   * Update user onboarding preferences
   */
  const updatePreferences = useCallback((preferences: Partial<OnboardingPreferences>) => {
    setFirstTimeUserState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences },
      lastActivity: new Date().toISOString(),
    }));
  }, [setFirstTimeUserState]);

  /**
   * Mark a feature as introduced/seen
   */
  const markFeatureIntroduced = useCallback((featureId: string) => {
    setFirstTimeUserState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        completedIntroductions: [
          ...prev.preferences.completedIntroductions.filter(id => id !== featureId),
          featureId,
        ],
      },
      lastActivity: new Date().toISOString(),
    }));
  }, [setFirstTimeUserState]);

  /**
   * Dismiss a notification permanently
   */
  const dismissNotification = useCallback((notificationId: string) => {
    setFirstTimeUserState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        dismissedNotifications: [
          ...prev.preferences.dismissedNotifications.filter(id => id !== notificationId),
          notificationId,
        ],
      },
      lastActivity: new Date().toISOString(),
    }));
  }, [setFirstTimeUserState]);

  /**
   * Check if a tooltip should be shown
   */
  const shouldShowTooltip = useCallback((tooltipId: string): boolean => {
    if (!firstTimeUserState.preferences.showWelcomeTooltips) return false;
    if (firstTimeUserState.preferences.dismissedNotifications.includes(tooltipId)) return false;
    if (firstTimeUserState.preferences.completedIntroductions.includes(tooltipId)) return false;
    return isFirstTimeUser;
  }, [firstTimeUserState.preferences, isFirstTimeUser]);

  /**
   * Check if contextual help should be shown
   */
  const shouldShowHelp = useCallback((contextId: string): boolean => {
    if (!firstTimeUserState.preferences.enableContextualHelp) return false;
    if (firstTimeUserState.preferences.dismissedNotifications.includes(contextId)) return false;
    return isFirstTimeUser || firstTimeUserState.preferences.completedIntroductions.length < 5;
  }, [firstTimeUserState.preferences, isFirstTimeUser]);

  // ============================================================================
  // USER ROLE INTEGRATION
  // ============================================================================

  /**
   * Get available steps for a specific user
   */
  const getAvailableStepsForUser = useCallback((userProfile: UserProfile): OnboardingStep[] => {
    const allSteps = availableTutorials.flatMap(tutorial => tutorial.steps);
    return allSteps.filter(step => {
      // Check role requirements
      if (step.requiredRole && step.requiredRole.length > 0) {
        const userRole = userProfile.role?.name || '';
        if (!step.requiredRole.includes(userRole)) {
          return false;
        }
      }

      // Check capability requirements
      if (step.requiredCapabilities && step.requiredCapabilities.length > 0) {
        const adminUser = userProfile as any;
        const userCapabilities = adminUser.adminCapabilities || [];
        return step.requiredCapabilities.some(cap => userCapabilities.includes(cap));
      }

      return true;
    });
  }, [availableTutorials]);

  /**
   * Check if a step is available for a specific user
   */
  const isStepAvailableForUser = useCallback((stepId: string, userProfile: UserProfile): boolean => {
    const userSteps = getAvailableStepsForUser(userProfile);
    return userSteps.some(step => step.id === stepId);
  }, [getAvailableStepsForUser]);

  /**
   * Get recommended tutorials for a user role
   */
  const getRecommendedTutorialsForRole = useCallback((role: string): TutorialSeries[] => {
    return availableTutorials.filter(tutorial => {
      if (!tutorial.requiredRole || tutorial.requiredRole.length === 0) return true;
      return tutorial.requiredRole.includes(role);
    });
  }, [availableTutorials]);

  // ============================================================================
  // PERSISTENCE AND SYNCHRONIZATION
  // ============================================================================

  /**
   * Save current state (handled automatically by useLocalStorage)
   */
  const saveState = useCallback(() => {
    // State is automatically saved via useLocalStorage hook
    // This method is provided for explicit save calls if needed
  }, []);

  /**
   * Load state (handled automatically by useLocalStorage)
   */
  const loadState = useCallback(() => {
    // State is automatically loaded via useLocalStorage hook
    // This method is provided for explicit load calls if needed
  }, []);

  /**
   * Sync with server (placeholder for future implementation)
   */
  const syncWithServer = useCallback(async (): Promise<void> => {
    // TODO: Implement server synchronization when user profile endpoint supports onboarding data
    // This would sync onboarding progress with user profile on the server
    try {
      // Example implementation:
      // await apiClient.updateUserOnboardingProgress(user?.id, firstTimeUserState);
    } catch (error) {
      console.error('Failed to sync onboarding state with server:', error);
    }
  }, [firstTimeUserState, user]);

  /**
   * Export progress as JSON string
   */
  const exportProgress = useCallback((): string => {
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      userId: user?.id,
      state: firstTimeUserState,
    }, null, 2);
  }, [firstTimeUserState, user]);

  /**
   * Import progress from JSON string
   */
  const importProgress = useCallback((data: string): boolean => {
    try {
      const imported = JSON.parse(data);
      if (imported.state && imported.version) {
        setFirstTimeUserState(imported.state);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import onboarding progress:', error);
      return false;
    }
  }, [setFirstTimeUserState]);

  // ============================================================================
  // ANALYTICS AND TRACKING
  // ============================================================================

  /**
   * Track onboarding events for analytics
   */
  const trackOnboardingEvent = useCallback((event: string, metadata?: Record<string, any>) => {
    // TODO: Integrate with analytics system
    console.log('Onboarding Event:', event, {
      userId: user?.id,
      sessionId: firstTimeUserState.onboardingSessionId,
      currentTutorial: currentTutorial?.id,
      currentStep: currentStep?.id,
      progress: progressOverall,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }, [user, firstTimeUserState.onboardingSessionId, currentTutorial, currentStep, progressOverall]);

  /**
   * Get onboarding analytics data
   */
  const getOnboardingAnalytics = useCallback((): Record<string, any> => {
    const completedSteps = availableSteps.filter(step => step.status === 'completed');
    const skippedSteps = availableSteps.filter(step => step.status === 'skipped');
    const timeSpent = onboardingStartTime ? Date.now() - onboardingStartTime.getTime() : 0;

    return {
      totalSteps: availableSteps.length,
      completedSteps: completedSteps.length,
      skippedSteps: skippedSteps.length,
      completionPercentage: progressOverall.percentage,
      timeSpentMinutes: Math.round(timeSpent / (1000 * 60)),
      tutorialsStarted: firstTimeUserState.tutorials.filter(t => t.status !== 'not_started').length,
      tutorialsCompleted: firstTimeUserState.tutorials.filter(t => t.status === 'completed').length,
      preferredHelpFormat: firstTimeUserState.preferences.preferredHelpFormat,
      tutorialSpeed: firstTimeUserState.preferences.preferredTutorialSpeed,
      userId: user?.id,
      userRole: user?.role?.name,
      sessionId: firstTimeUserState.onboardingSessionId,
    };
  }, [availableSteps, progressOverall, firstTimeUserState, onboardingStartTime, user]);

  /**
   * Get estimated completion time for remaining onboarding
   */
  const getCompletionTimeEstimate = useCallback((): number => {
    const remainingSteps = availableSteps.filter(step => step.status === 'not_started');
    return remainingSteps.reduce((total, step) => total + step.estimatedDuration, 0);
  }, [availableSteps]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Initialize first-time user state based on localStorage
   */
  useEffect(() => {
    // Check if this is truly a first-time user (no localStorage entry)
    const hasStoredConfig = localStorage.getItem('dreamFactory_firstTimeUser');
    
    if (!hasStoredConfig) {
      // This is a genuine first-time user
      setFirstTimeUserState(prev => ({
        ...prev,
        flags: {
          ...prev.flags,
          isFirstTimeUser: true,
          firstLoginDate: new Date().toISOString(),
        },
      }));
    }
  }, [setFirstTimeUserState]);

  /**
   * Update available steps when user or tutorials change
   */
  useEffect(() => {
    setFirstTimeUserState(prev => ({
      ...prev,
      availableSteps,
      nextRecommendedSteps,
      progressOverall,
    }));
  }, [availableSteps, nextRecommendedSteps, progressOverall, setFirstTimeUserState]);

  /**
   * Auto-complete onboarding when all required steps are done
   */
  useEffect(() => {
    const requiredSteps = availableSteps.filter(step => step.isRequired);
    const completedRequiredSteps = requiredSteps.filter(step => step.status === 'completed');
    
    if (requiredSteps.length > 0 && completedRequiredSteps.length === requiredSteps.length) {
      if (!firstTimeUserState.flags.hasCompletedOnboarding) {
        completeOnboarding();
      }
    }
  }, [availableSteps, firstTimeUserState.flags.hasCompletedOnboarding, completeOnboarding]);

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  return {
    // Core state
    isFirstTimeUser,
    isOnboardingActive,
    isOnboardingCompleted,
    firstTimeUserState,
    
    // Tutorial management
    currentTutorial,
    currentStep,
    availableTutorials,
    nextRecommendedSteps,
    progressOverall,
    
    // Actions
    markFirstTimeUserCompleted,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    
    // Tutorial actions
    startTutorial,
    completeTutorial,
    skipTutorial,
    
    // Step actions
    startStep,
    completeStep,
    skipStep,
    goToStep,
    getNextStep,
    getPreviousStep,
    
    // Experience customization
    updatePreferences,
    markFeatureIntroduced,
    dismissNotification,
    shouldShowTooltip,
    shouldShowHelp,
    
    // User role integration
    getAvailableStepsForUser,
    isStepAvailableForUser,
    getRecommendedTutorialsForRole,
    
    // Persistence and synchronization
    saveState,
    loadState,
    syncWithServer,
    exportProgress,
    importProgress,
    
    // Analytics and tracking
    trackOnboardingEvent,
    getOnboardingAnalytics,
    getCompletionTimeEstimate,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user should see onboarding based on their profile
 */
export function shouldShowOnboardingForUser(user: UserProfile | null): boolean {
  if (!user) return false;
  
  // Check if user has completed onboarding
  const storedState = localStorage.getItem('dreamFactory_firstTimeUser');
  if (storedState) {
    try {
      const parsed = JSON.parse(storedState);
      return !parsed.flags?.hasCompletedOnboarding;
    } catch {
      return true; // Show onboarding if stored state is corrupted
    }
  }
  
  return true; // Show onboarding for new users
}

/**
 * Get onboarding steps available for user role
 */
export function getOnboardingStepsForRole(role: string): OnboardingStep[] {
  return DEFAULT_TUTORIAL_SERIES
    .filter(tutorial => !tutorial.requiredRole || tutorial.requiredRole.includes(role))
    .flatMap(tutorial => tutorial.steps)
    .filter(step => !step.requiredRole || step.requiredRole.includes(role));
}

/**
 * Calculate onboarding completion percentage for a user
 */
export function calculateOnboardingCompletion(user: UserProfile | null): number {
  if (!user) return 0;
  
  const availableSteps = getOnboardingStepsForRole(user.role?.name || '');
  const storedState = localStorage.getItem('dreamFactory_firstTimeUser');
  
  if (!storedState) return 0;
  
  try {
    const parsed = JSON.parse(storedState);
    const allSteps = parsed.tutorials?.flatMap((t: TutorialSeries) => t.steps) || [];
    const completedSteps = allSteps.filter((s: OnboardingStep) => s.status === 'completed');
    
    return availableSteps.length > 0 ? Math.round((completedSteps.length / availableSteps.length) * 100) : 0;
  } catch {
    return 0;
  }
}

// Default export
export default useFirstTimeUser;