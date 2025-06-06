/**
 * @fileoverview Wizard Provider Component for API Generation Wizard
 * 
 * React context provider component that manages global wizard state, step navigation,
 * and shared functionality across all generation wizard components. Implements Zustand
 * store integration for wizard state management and provides context for multi-step
 * API generation workflow.
 * 
 * Supports F-003 REST API Endpoint Generation per Section 2.1 Feature Catalog with
 * React/Next.js Integration Requirements compliance. Replaces Angular service-based
 * state management with React Context API and Zustand store per Section 4.3 State
 * Management Workflows.
 * 
 * @module WizardProvider
 * @version 1.0.0
 */

'use client';

import React, { createContext, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';

// Internal imports
import { apiClient } from '../../../lib/api-client';
import { 
  WizardState, 
  WizardActions, 
  WizardStep, 
  GenerationStatus, 
  DatabaseTable, 
  EndpointConfiguration,
  OpenAPISpec,
  GenerationResult,
  WizardProviderProps,
  TableSelectionFormData,
  EndpointConfigurationFormData,
  HTTPMethod
} from './types';
import { 
  WIZARD_STEPS,
  WIZARD_STEP_CONFIG,
  WIZARD_QUERY_KEYS,
  REACT_QUERY_CONFIG,
  WIZARD_MUTATION_CONFIG,
  DEFAULT_ENABLED_METHODS,
  DEFAULT_ENDPOINT_CONFIG,
  VALIDATION_MESSAGES
} from './constants';

// ============================================================================
// ZUSTAND STORE DEFINITION
// ============================================================================

/**
 * Zustand store interface for wizard state management
 * Replaces Angular service-based patterns with React state management
 */
interface WizardStore extends WizardState, WizardActions {
  // Internal actions for store management
  _setLoading: (loading: boolean) => void;
  _setError: (error?: string) => void;
  _setGenerationStatus: (status: GenerationStatus) => void;
  _updateValidationErrors: (stepKey: string, errors: string[]) => void;
  _clearValidationErrors: () => void;
}

/**
 * Default wizard state configuration
 */
const defaultState: WizardState = {
  currentStep: WizardStep.TABLE_SELECTION,
  loading: false,
  error: undefined,
  generationStatus: GenerationStatus.IDLE,
  serviceName: '',
  availableTables: [],
  selectedTables: [],
  endpointConfigurations: [],
  generatedSpec: undefined,
  generationProgress: 0,
  generationResult: undefined,
  validationErrors: {}
};

/**
 * Create Zustand store with subscribeWithSelector middleware for reactive updates
 * Implements state management per Section 5.2 Component Details
 */
const useWizardStore = create<WizardStore>()(
  subscribeWithSelector((set, get) => ({
    ...defaultState,

    // ========================================================================
    // NAVIGATION ACTIONS
    // ========================================================================

    nextStep: async (): Promise<boolean> => {
      const state = get();
      const currentStepConfig = WIZARD_STEP_CONFIG[state.currentStep];
      
      try {
        // Validate current step before proceeding
        const isValid = await get().validateCurrentStep();
        if (!isValid) {
          return false;
        }

        // Move to next step if available
        if (currentStepConfig.nextStep) {
          set({ currentStep: currentStepConfig.nextStep });
          return true;
        }

        return false;
      } catch (error) {
        console.error('Failed to proceed to next step:', error);
        set({ error: `Navigation error: ${error instanceof Error ? error.message : 'Unknown error'}` });
        return false;
      }
    },

    previousStep: (): void => {
      const state = get();
      const currentStepConfig = WIZARD_STEP_CONFIG[state.currentStep];
      
      if (currentStepConfig.prevStep) {
        set({ 
          currentStep: currentStepConfig.prevStep,
          error: undefined // Clear any errors when going back
        });
      }
    },

    goToStep: (step: WizardStep): void => {
      set({ 
        currentStep: step,
        error: undefined // Clear errors when manually navigating
      });
    },

    // ========================================================================
    // STATE MANAGEMENT ACTIONS
    // ========================================================================

    reset: (): void => {
      set({
        ...defaultState,
        serviceName: get().serviceName // Preserve service name
      });
    },

    updateState: (updates: Partial<WizardState>): void => {
      set(produce((state: WizardStore) => {
        Object.assign(state, updates);
      }));
    },

    // ========================================================================
    // VALIDATION ACTIONS
    // ========================================================================

    validateCurrentStep: async (): Promise<boolean> => {
      const state = get();
      
      try {
        set({ _setLoading: true } as any);
        get()._clearValidationErrors();

        switch (state.currentStep) {
          case WizardStep.TABLE_SELECTION:
            return get()._validateTableSelection();
          
          case WizardStep.ENDPOINT_CONFIGURATION:
            return get()._validateEndpointConfiguration();
          
          case WizardStep.GENERATION_PREVIEW:
            return get()._validateGenerationPreview();
          
          case WizardStep.GENERATION_PROGRESS:
            return true; // Progress step doesn't require validation
          
          default:
            return true;
        }
      } catch (error) {
        console.error('Step validation failed:', error);
        get()._setError(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
      } finally {
        get()._setLoading(false);
      }
    },

    // ========================================================================
    // INTERNAL ACTIONS
    // ========================================================================

    _setLoading: (loading: boolean): void => {
      set({ loading });
    },

    _setError: (error?: string): void => {
      set({ error });
    },

    _setGenerationStatus: (status: GenerationStatus): void => {
      set({ generationStatus: status });
    },

    _updateValidationErrors: (stepKey: string, errors: string[]): void => {
      set(produce((state: WizardStore) => {
        state.validationErrors[stepKey] = errors;
      }));
    },

    _clearValidationErrors: (): void => {
      set({ validationErrors: {} });
    },

    // ========================================================================
    // VALIDATION HELPERS
    // ========================================================================

    _validateTableSelection(): boolean {
      const state = get();
      const errors: string[] = [];

      if (state.selectedTables.length === 0) {
        errors.push(VALIDATION_MESSAGES.tableSelection.required);
      }

      if (state.selectedTables.length > 50) {
        errors.push(VALIDATION_MESSAGES.tableSelection.tooMany);
      }

      if (errors.length > 0) {
        get()._updateValidationErrors('tableSelection', errors);
        return false;
      }

      return true;
    },

    _validateEndpointConfiguration(): boolean {
      const state = get();
      const errors: string[] = [];

      // Validate that each selected table has at least one HTTP method enabled
      for (const table of state.selectedTables) {
        const config = state.endpointConfigurations.find(c => c.tableName === table.name);
        
        if (!config) {
          errors.push(`Configuration missing for table: ${table.name}`);
          continue;
        }

        if (config.enabledMethods.length === 0) {
          errors.push(`At least one HTTP method must be enabled for table: ${table.name}`);
        }

        // Validate that at least one read operation is enabled
        const hasReadOperation = config.enabledMethods.includes(HTTPMethod.GET);
        if (!hasReadOperation) {
          errors.push(`At least one read operation (GET) must be enabled for table: ${table.name}`);
        }
      }

      if (errors.length > 0) {
        get()._updateValidationErrors('endpointConfiguration', errors);
        return false;
      }

      return true;
    },

    _validateGenerationPreview(): boolean {
      const state = get();
      
      if (!state.generatedSpec) {
        get()._updateValidationErrors('generationPreview', ['OpenAPI specification must be generated before proceeding']);
        return false;
      }

      return true;
    }
  }))
);

// ============================================================================
// REACT CONTEXT DEFINITION
// ============================================================================

/**
 * Context interface for wizard provider
 */
interface WizardContextValue {
  // Wizard state
  state: WizardState;
  actions: WizardActions;
  
  // React Query data and mutations
  tablesQuery: ReturnType<typeof useQuery>;
  generatePreviewMutation: ReturnType<typeof useMutation>;
  generateApiMutation: ReturnType<typeof useMutation>;
  
  // Convenience methods
  isLoading: boolean;
  canProceed: boolean;
  canGoBack: boolean;
  currentStepConfig: typeof WIZARD_STEP_CONFIG[WizardStep];
}

/**
 * React context for wizard state and actions
 */
const WizardContext = createContext<WizardContextValue | null>(null);

// ============================================================================
// CUSTOM HOOK FOR WIZARD ACCESS
// ============================================================================

/**
 * Custom hook to access wizard context
 * Provides type-safe access to wizard state and actions
 */
export const useWizard = (): WizardContextValue => {
  const context = useContext(WizardContext);
  
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  
  return context;
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch available tables for a database service
 */
const fetchTables = async (serviceName: string): Promise<DatabaseTable[]> => {
  const response = await apiClient.get<{ resource: any[] }>(`/${serviceName}/_schema`);
  
  if (!response.resource) {
    throw new Error('Failed to fetch database schema');
  }

  // Transform API response to DatabaseTable format
  return response.resource.map((table: any) => ({
    name: table.name,
    label: table.label || table.name,
    description: table.description || '',
    schema: table.schema,
    rowCount: table.row_count,
    fields: table.field || [],
    primaryKey: table.primary_key || [],
    foreignKeys: table.foreign_key || [],
    selected: false,
    expanded: false,
    hasExistingAPI: false
  }));
};

/**
 * Generate OpenAPI specification preview
 */
const generatePreview = async (data: { 
  serviceName: string; 
  configurations: EndpointConfiguration[] 
}): Promise<OpenAPISpec> => {
  const response = await apiClient.post<OpenAPISpec>(
    `/api/preview/${data.serviceName}`,
    { configurations: data.configurations }
  );
  
  if (!response.data) {
    throw new Error('Failed to generate OpenAPI preview');
  }

  return response.data;
};

/**
 * Generate actual API endpoints
 */
const generateApi = async (data: {
  serviceName: string;
  configurations: EndpointConfiguration[];
  openApiSpec: OpenAPISpec;
}): Promise<GenerationResult> => {
  const response = await apiClient.post<GenerationResult>(
    `/api/v2/system/service/${data.serviceName}/generate`,
    {
      configurations: data.configurations,
      openApiSpec: data.openApiSpec
    }
  );

  if (!response.data) {
    throw new Error('Failed to generate API endpoints');
  }

  return response.data;
};

// ============================================================================
// WIZARD PROVIDER COMPONENT
// ============================================================================

/**
 * Wizard Provider Component
 * 
 * Provides wizard state management and React Query integration for the
 * API generation wizard workflow. Implements Zustand store integration
 * and context-based state sharing across all wizard components.
 * 
 * @param props - WizardProviderProps including children, serviceName, and initial state
 */
export const WizardProvider: React.FC<WizardProviderProps> = ({
  children,
  serviceName,
  initialState
}) => {
  const queryClient = useQueryClient();
  
  // Access Zustand store
  const state = useWizardStore((state) => ({
    currentStep: state.currentStep,
    loading: state.loading,
    error: state.error,
    generationStatus: state.generationStatus,
    serviceName: state.serviceName,
    availableTables: state.availableTables,
    selectedTables: state.selectedTables,
    endpointConfigurations: state.endpointConfigurations,
    generatedSpec: state.generatedSpec,
    generationProgress: state.generationProgress,
    generationResult: state.generationResult,
    validationErrors: state.validationErrors
  }));

  const actions = useWizardStore((state) => ({
    nextStep: state.nextStep,
    previousStep: state.previousStep,
    goToStep: state.goToStep,
    reset: state.reset,
    updateState: state.updateState,
    validateCurrentStep: state.validateCurrentStep
  }));

  // Initialize store with service name and initial state
  useEffect(() => {
    useWizardStore.getState().updateState({
      serviceName,
      ...initialState
    });
  }, [serviceName, initialState]);

  // ========================================================================
  // REACT QUERY HOOKS
  // ========================================================================

  /**
   * Query for available database tables
   * Uses React Query intelligent caching per Section 3.2.4
   */
  const tablesQuery = useQuery({
    queryKey: WIZARD_QUERY_KEYS.TABLES(serviceName),
    queryFn: () => fetchTables(serviceName),
    enabled: !!serviceName,
    staleTime: REACT_QUERY_CONFIG.staleTime,
    cacheTime: REACT_QUERY_CONFIG.cacheTime,
    refetchOnWindowFocus: REACT_QUERY_CONFIG.refetchOnWindowFocus,
    retry: REACT_QUERY_CONFIG.retry,
    retryDelay: REACT_QUERY_CONFIG.retryDelay,
    onSuccess: (tables) => {
      useWizardStore.getState().updateState({ availableTables: tables });
    },
    onError: (error) => {
      console.error('Failed to fetch tables:', error);
      useWizardStore.getState()._setError(`Failed to load database tables: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  /**
   * Mutation for generating OpenAPI preview
   * Supports real-time preview capabilities for F-003 requirements
   */
  const generatePreviewMutation = useMutation({
    mutationFn: generatePreview,
    ...WIZARD_MUTATION_CONFIG,
    onMutate: () => {
      useWizardStore.getState()._setGenerationStatus(GenerationStatus.VALIDATING);
    },
    onSuccess: (spec) => {
      useWizardStore.getState().updateState({
        generatedSpec: spec,
        generationStatus: GenerationStatus.CONFIGURING
      });
    },
    onError: (error) => {
      console.error('Preview generation failed:', error);
      useWizardStore.getState()._setError(`Preview generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      useWizardStore.getState()._setGenerationStatus(GenerationStatus.ERROR);
    }
  });

  /**
   * Mutation for final API generation
   */
  const generateApiMutation = useMutation({
    mutationFn: generateApi,
    ...WIZARD_MUTATION_CONFIG,
    onMutate: () => {
      useWizardStore.getState()._setGenerationStatus(GenerationStatus.GENERATING);
      useWizardStore.getState().updateState({ generationProgress: 0 });
    },
    onSuccess: (result) => {
      useWizardStore.getState().updateState({
        generationResult: result,
        generationStatus: GenerationStatus.COMPLETED,
        generationProgress: 100
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['api-docs'] });
    },
    onError: (error) => {
      console.error('API generation failed:', error);
      useWizardStore.getState()._setError(`API generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      useWizardStore.getState()._setGenerationStatus(GenerationStatus.ERROR);
    }
  });

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  const currentStepConfig = useMemo(() => 
    WIZARD_STEP_CONFIG[state.currentStep], 
    [state.currentStep]
  );

  const isLoading = useMemo(() => 
    state.loading || tablesQuery.isLoading || generatePreviewMutation.isLoading || generateApiMutation.isLoading,
    [state.loading, tablesQuery.isLoading, generatePreviewMutation.isLoading, generateApiMutation.isLoading]
  );

  const canProceed = useMemo(() => {
    if (isLoading) return false;
    
    switch (state.currentStep) {
      case WizardStep.TABLE_SELECTION:
        return state.selectedTables.length > 0;
      case WizardStep.ENDPOINT_CONFIGURATION:
        return state.endpointConfigurations.length > 0;
      case WizardStep.GENERATION_PREVIEW:
        return !!state.generatedSpec;
      case WizardStep.GENERATION_PROGRESS:
        return state.generationStatus === GenerationStatus.COMPLETED;
      default:
        return true;
    }
  }, [state.currentStep, state.selectedTables, state.endpointConfigurations, state.generatedSpec, state.generationStatus, isLoading]);

  const canGoBack = useMemo(() => 
    !!currentStepConfig.prevStep && !isLoading,
    [currentStepConfig.prevStep, isLoading]
  );

  // ========================================================================
  // CONTEXT VALUE
  // ========================================================================

  const contextValue: WizardContextValue = useMemo(() => ({
    state,
    actions,
    tablesQuery,
    generatePreviewMutation,
    generateApiMutation,
    isLoading,
    canProceed,
    canGoBack,
    currentStepConfig
  }), [
    state, 
    actions, 
    tablesQuery, 
    generatePreviewMutation, 
    generateApiMutation, 
    isLoading, 
    canProceed, 
    canGoBack, 
    currentStepConfig
  ]);

  // ========================================================================
  // ERROR BOUNDARY INTEGRATION
  // ========================================================================

  useEffect(() => {
    if (state.error) {
      console.error('Wizard error:', state.error);
      // Could integrate with error reporting service here
    }
  }, [state.error]);

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <WizardContext.Provider value={contextValue}>
      {children}
    </WizardContext.Provider>
  );
};

// ============================================================================
// ADDITIONAL HOOKS FOR SPECIFIC WIZARD FUNCTIONALITY
// ============================================================================

/**
 * Hook for table selection step functionality
 */
export const useTableSelection = () => {
  const { state, actions } = useWizard();
  
  const selectTable = useCallback((table: DatabaseTable) => {
    const updatedTables = state.selectedTables.some(t => t.name === table.name)
      ? state.selectedTables.filter(t => t.name !== table.name)
      : [...state.selectedTables, { ...table, selected: true }];
    
    actions.updateState({ selectedTables: updatedTables });
  }, [state.selectedTables, actions]);

  const selectAllTables = useCallback((tables: DatabaseTable[]) => {
    const allSelected = tables.map(table => ({ ...table, selected: true }));
    actions.updateState({ selectedTables: allSelected });
  }, [actions]);

  const clearSelection = useCallback(() => {
    actions.updateState({ selectedTables: [] });
  }, [actions]);

  return {
    availableTables: state.availableTables,
    selectedTables: state.selectedTables,
    selectTable,
    selectAllTables,
    clearSelection
  };
};

/**
 * Hook for endpoint configuration step functionality
 */
export const useEndpointConfiguration = () => {
  const { state, actions } = useWizard();

  const updateConfiguration = useCallback((tableName: string, config: Partial<EndpointConfiguration>) => {
    const configurations = [...state.endpointConfigurations];
    const existingIndex = configurations.findIndex(c => c.tableName === tableName);
    
    if (existingIndex >= 0) {
      configurations[existingIndex] = { ...configurations[existingIndex], ...config };
    } else {
      // Create default configuration for new table
      const defaultConfig: EndpointConfiguration = {
        tableName,
        basePath: `/${tableName.toLowerCase()}`,
        enabledMethods: [...DEFAULT_ENABLED_METHODS],
        methodConfigurations: {},
        security: {
          requireAuth: false,
          requiredRoles: [],
          apiKeyPermissions: []
        },
        customParameters: [],
        enabled: true,
        ...config
      };
      configurations.push(defaultConfig);
    }
    
    actions.updateState({ endpointConfigurations: configurations });
  }, [state.endpointConfigurations, actions]);

  return {
    configurations: state.endpointConfigurations,
    selectedTables: state.selectedTables,
    updateConfiguration
  };
};

/**
 * Hook for generation preview step functionality
 */
export const useGenerationPreview = () => {
  const { state, generatePreviewMutation } = useWizard();

  const generatePreview = useCallback(() => {
    if (state.serviceName && state.endpointConfigurations.length > 0) {
      generatePreviewMutation.mutate({
        serviceName: state.serviceName,
        configurations: state.endpointConfigurations
      });
    }
  }, [state.serviceName, state.endpointConfigurations, generatePreviewMutation]);

  return {
    generatedSpec: state.generatedSpec,
    configurations: state.endpointConfigurations,
    generatePreview,
    isGenerating: generatePreviewMutation.isLoading
  };
};

// Export types for external use
export type { WizardContextValue };