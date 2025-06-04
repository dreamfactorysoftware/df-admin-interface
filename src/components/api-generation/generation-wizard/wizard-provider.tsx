'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Types for the wizard state management
interface DatabaseTable {
  id: string;
  name: string;
  label?: string;
  description?: string;
  fields: DatabaseField[];
  relationships: Relationship[];
  selected: boolean;
}

interface DatabaseField {
  id: string;
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: {
    table: string;
    field: string;
  };
}

interface Relationship {
  id: string;
  type: 'one-to-many' | 'many-to-one' | 'many-to-many' | 'one-to-one';
  fromTable: string;
  toTable: string;
  fromField: string;
  toField: string;
}

interface EndpointConfiguration {
  httpMethods: {
    GET: boolean;
    POST: boolean;
    PUT: boolean;
    PATCH: boolean;
    DELETE: boolean;
  };
  enablePagination: boolean;
  enableFiltering: boolean;
  enableSorting: boolean;
  maxPageSize: number;
  customFields: string[];
  securityRules: SecurityRule[];
}

interface SecurityRule {
  id: string;
  method: string;
  roles: string[];
  conditions: string;
  enabled: boolean;
}

interface GenerationProgress {
  currentStep: number;
  completedSteps: number[];
  isGenerating: boolean;
  error: string | null;
  generatedEndpoints: string[];
}

interface OpenAPIPreview {
  specification: Record<string, any> | null;
  isValid: boolean;
  validationErrors: string[];
  lastUpdated: Date | null;
}

// Wizard step definitions
export const WIZARD_STEPS = {
  TABLE_SELECTION: 0,
  ENDPOINT_CONFIGURATION: 1,
  SECURITY_CONFIGURATION: 2,
  PREVIEW_AND_GENERATE: 3,
} as const;

export type WizardStep = typeof WIZARD_STEPS[keyof typeof WIZARD_STEPS];

// Zustand store for wizard state management
interface WizardState {
  // Navigation state
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  isNavigationLocked: boolean;
  
  // Database service context
  serviceId: string | null;
  serviceName: string | null;
  databaseType: string | null;
  
  // Table selection state
  availableTables: DatabaseTable[];
  selectedTables: Map<string, DatabaseTable>;
  tableSearchQuery: string;
  
  // Endpoint configuration state
  endpointConfigurations: Map<string, EndpointConfiguration>;
  globalConfiguration: Partial<EndpointConfiguration>;
  
  // Generation progress state
  generationProgress: GenerationProgress;
  
  // OpenAPI preview state
  openApiPreview: OpenAPIPreview;
  
  // Actions for navigation
  setCurrentStep: (step: WizardStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  markStepCompleted: (step: WizardStep) => void;
  resetWizard: () => void;
  
  // Actions for service context
  setServiceContext: (serviceId: string, serviceName: string, databaseType: string) => void;
  
  // Actions for table management
  setAvailableTables: (tables: DatabaseTable[]) => void;
  toggleTableSelection: (tableId: string) => void;
  selectAllTables: () => void;
  deselectAllTables: () => void;
  setTableSearchQuery: (query: string) => void;
  getFilteredTables: () => DatabaseTable[];
  
  // Actions for endpoint configuration
  updateEndpointConfiguration: (tableId: string, config: Partial<EndpointConfiguration>) => void;
  updateGlobalConfiguration: (config: Partial<EndpointConfiguration>) => void;
  applyGlobalConfigToSelected: () => void;
  
  // Actions for generation process
  startGeneration: () => void;
  updateGenerationProgress: (progress: Partial<GenerationProgress>) => void;
  completeGeneration: (endpoints: string[]) => void;
  setGenerationError: (error: string) => void;
  
  // Actions for OpenAPI preview
  updateOpenApiPreview: (preview: Partial<OpenAPIPreview>) => void;
  validateOpenApiPreview: () => void;
}

const createWizardStore = () => create<WizardState>()(
  subscribeWithSelector((set, get) => ({
    // Initial navigation state
    currentStep: WIZARD_STEPS.TABLE_SELECTION,
    completedSteps: new Set<WizardStep>(),
    isNavigationLocked: false,
    
    // Initial service context
    serviceId: null,
    serviceName: null,
    databaseType: null,
    
    // Initial table state
    availableTables: [],
    selectedTables: new Map<string, DatabaseTable>(),
    tableSearchQuery: '',
    
    // Initial endpoint configuration state
    endpointConfigurations: new Map<string, EndpointConfiguration>(),
    globalConfiguration: {
      httpMethods: {
        GET: true,
        POST: true,
        PUT: true,
        PATCH: false,
        DELETE: false,
      },
      enablePagination: true,
      enableFiltering: true,
      enableSorting: true,
      maxPageSize: 100,
      customFields: [],
      securityRules: [],
    },
    
    // Initial generation progress state
    generationProgress: {
      currentStep: 0,
      completedSteps: [],
      isGenerating: false,
      error: null,
      generatedEndpoints: [],
    },
    
    // Initial OpenAPI preview state
    openApiPreview: {
      specification: null,
      isValid: false,
      validationErrors: [],
      lastUpdated: null,
    },
    
    // Navigation actions
    setCurrentStep: (step: WizardStep) => {
      set((state) => {
        if (state.isNavigationLocked) return state;
        return { currentStep: step };
      });
    },
    
    goToNextStep: () => {
      set((state) => {
        if (state.isNavigationLocked) return state;
        const nextStep = state.currentStep + 1;
        if (nextStep <= WIZARD_STEPS.PREVIEW_AND_GENERATE) {
          return { currentStep: nextStep as WizardStep };
        }
        return state;
      });
    },
    
    goToPreviousStep: () => {
      set((state) => {
        if (state.isNavigationLocked) return state;
        const previousStep = state.currentStep - 1;
        if (previousStep >= WIZARD_STEPS.TABLE_SELECTION) {
          return { currentStep: previousStep as WizardStep };
        }
        return state;
      });
    },
    
    markStepCompleted: (step: WizardStep) => {
      set((state) => ({
        completedSteps: new Set([...state.completedSteps, step]),
      }));
    },
    
    resetWizard: () => {
      set({
        currentStep: WIZARD_STEPS.TABLE_SELECTION,
        completedSteps: new Set<WizardStep>(),
        isNavigationLocked: false,
        selectedTables: new Map<string, DatabaseTable>(),
        tableSearchQuery: '',
        endpointConfigurations: new Map<string, EndpointConfiguration>(),
        generationProgress: {
          currentStep: 0,
          completedSteps: [],
          isGenerating: false,
          error: null,
          generatedEndpoints: [],
        },
        openApiPreview: {
          specification: null,
          isValid: false,
          validationErrors: [],
          lastUpdated: null,
        },
      });
    },
    
    // Service context actions
    setServiceContext: (serviceId: string, serviceName: string, databaseType: string) => {
      set({
        serviceId,
        serviceName,
        databaseType,
      });
    },
    
    // Table management actions
    setAvailableTables: (tables: DatabaseTable[]) => {
      set({ availableTables: tables });
    },
    
    toggleTableSelection: (tableId: string) => {
      set((state) => {
        const newSelectedTables = new Map(state.selectedTables);
        const table = state.availableTables.find(t => t.id === tableId);
        
        if (table) {
          if (newSelectedTables.has(tableId)) {
            newSelectedTables.delete(tableId);
          } else {
            newSelectedTables.set(tableId, { ...table, selected: true });
          }
        }
        
        return { selectedTables: newSelectedTables };
      });
    },
    
    selectAllTables: () => {
      set((state) => {
        const newSelectedTables = new Map<string, DatabaseTable>();
        state.availableTables.forEach(table => {
          newSelectedTables.set(table.id, { ...table, selected: true });
        });
        return { selectedTables: newSelectedTables };
      });
    },
    
    deselectAllTables: () => {
      set({ selectedTables: new Map<string, DatabaseTable>() });
    },
    
    setTableSearchQuery: (query: string) => {
      set({ tableSearchQuery: query });
    },
    
    getFilteredTables: () => {
      const state = get();
      if (!state.tableSearchQuery.trim()) {
        return state.availableTables;
      }
      
      const query = state.tableSearchQuery.toLowerCase();
      return state.availableTables.filter(table => 
        table.name.toLowerCase().includes(query) ||
        (table.label && table.label.toLowerCase().includes(query)) ||
        (table.description && table.description.toLowerCase().includes(query))
      );
    },
    
    // Endpoint configuration actions
    updateEndpointConfiguration: (tableId: string, config: Partial<EndpointConfiguration>) => {
      set((state) => {
        const newConfigurations = new Map(state.endpointConfigurations);
        const currentConfig = newConfigurations.get(tableId) || {
          httpMethods: { GET: true, POST: true, PUT: true, PATCH: false, DELETE: false },
          enablePagination: true,
          enableFiltering: true,
          enableSorting: true,
          maxPageSize: 100,
          customFields: [],
          securityRules: [],
        };
        
        newConfigurations.set(tableId, { ...currentConfig, ...config });
        return { endpointConfigurations: newConfigurations };
      });
    },
    
    updateGlobalConfiguration: (config: Partial<EndpointConfiguration>) => {
      set((state) => ({
        globalConfiguration: { ...state.globalConfiguration, ...config },
      }));
    },
    
    applyGlobalConfigToSelected: () => {
      set((state) => {
        const newConfigurations = new Map(state.endpointConfigurations);
        
        state.selectedTables.forEach((table, tableId) => {
          newConfigurations.set(tableId, {
            ...state.globalConfiguration,
            httpMethods: { ...state.globalConfiguration.httpMethods },
            customFields: [...(state.globalConfiguration.customFields || [])],
            securityRules: [...(state.globalConfiguration.securityRules || [])],
          } as EndpointConfiguration);
        });
        
        return { endpointConfigurations: newConfigurations };
      });
    },
    
    // Generation process actions
    startGeneration: () => {
      set((state) => ({
        isNavigationLocked: true,
        generationProgress: {
          ...state.generationProgress,
          isGenerating: true,
          error: null,
          currentStep: 0,
          completedSteps: [],
        },
      }));
    },
    
    updateGenerationProgress: (progress: Partial<GenerationProgress>) => {
      set((state) => ({
        generationProgress: { ...state.generationProgress, ...progress },
      }));
    },
    
    completeGeneration: (endpoints: string[]) => {
      set((state) => ({
        isNavigationLocked: false,
        generationProgress: {
          ...state.generationProgress,
          isGenerating: false,
          generatedEndpoints: endpoints,
          currentStep: 100,
        },
      }));
    },
    
    setGenerationError: (error: string) => {
      set((state) => ({
        isNavigationLocked: false,
        generationProgress: {
          ...state.generationProgress,
          isGenerating: false,
          error,
        },
      }));
    },
    
    // OpenAPI preview actions
    updateOpenApiPreview: (preview: Partial<OpenAPIPreview>) => {
      set((state) => ({
        openApiPreview: {
          ...state.openApiPreview,
          ...preview,
          lastUpdated: new Date(),
        },
      }));
    },
    
    validateOpenApiPreview: () => {
      set((state) => {
        const { specification } = state.openApiPreview;
        
        if (!specification) {
          return {
            openApiPreview: {
              ...state.openApiPreview,
              isValid: false,
              validationErrors: ['No OpenAPI specification generated'],
            },
          };
        }
        
        // Basic OpenAPI validation
        const errors: string[] = [];
        
        if (!specification.openapi) {
          errors.push('Missing OpenAPI version');
        }
        
        if (!specification.info) {
          errors.push('Missing info section');
        }
        
        if (!specification.paths || Object.keys(specification.paths).length === 0) {
          errors.push('No API paths defined');
        }
        
        return {
          openApiPreview: {
            ...state.openApiPreview,
            isValid: errors.length === 0,
            validationErrors: errors,
          },
        };
      });
    },
  }))
);

// React Context for the wizard provider
interface WizardContextType {
  store: ReturnType<typeof createWizardStore>;
  // Query client for React Query integration
  queryClient: any;
}

const WizardContext = createContext<WizardContextType | null>(null);

// Custom hook to use the wizard context
export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context.store();
};

// Custom hook for wizard navigation
export const useWizardNavigation = () => {
  const wizard = useWizard();
  
  const canGoNext = () => {
    const { currentStep, selectedTables, completedSteps } = wizard;
    
    switch (currentStep) {
      case WIZARD_STEPS.TABLE_SELECTION:
        return selectedTables.size > 0;
      case WIZARD_STEPS.ENDPOINT_CONFIGURATION:
        return completedSteps.has(WIZARD_STEPS.ENDPOINT_CONFIGURATION);
      case WIZARD_STEPS.SECURITY_CONFIGURATION:
        return completedSteps.has(WIZARD_STEPS.SECURITY_CONFIGURATION);
      default:
        return false;
    }
  };
  
  const canGoPrevious = () => {
    return wizard.currentStep > WIZARD_STEPS.TABLE_SELECTION && !wizard.isNavigationLocked;
  };
  
  return {
    canGoNext: canGoNext(),
    canGoPrevious: canGoPrevious(),
    currentStep: wizard.currentStep,
    goToNextStep: wizard.goToNextStep,
    goToPreviousStep: wizard.goToPreviousStep,
    setCurrentStep: wizard.setCurrentStep,
    markStepCompleted: wizard.markStepCompleted,
  };
};

// Custom hook for OpenAPI preview with React Query integration
export const useOpenAPIPreview = () => {
  const wizard = useWizard();
  const queryClient = useContext(WizardContext)?.queryClient;
  
  // React Query for real-time OpenAPI preview generation
  const { data: previewData, isLoading, error, refetch } = useQuery({
    queryKey: ['openapi-preview', wizard.serviceId, Array.from(wizard.selectedTables.keys())],
    queryFn: async () => {
      if (!wizard.serviceId || wizard.selectedTables.size === 0) {
        return null;
      }
      
      // Construct preview request payload
      const previewPayload = {
        serviceId: wizard.serviceId,
        tables: Array.from(wizard.selectedTables.values()),
        configurations: Object.fromEntries(wizard.endpointConfigurations),
        globalConfiguration: wizard.globalConfiguration,
      };
      
      // Call Next.js API route for preview generation
      const response = await fetch(`/api/preview/openapi/${wizard.serviceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(previewPayload),
      });
      
      if (!response.ok) {
        throw new Error(`Preview generation failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: Boolean(wizard.serviceId && wizard.selectedTables.size > 0),
    staleTime: 30000, // 30 seconds
    cacheTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
  
  // Update wizard state when preview data changes
  useEffect(() => {
    if (previewData) {
      wizard.updateOpenApiPreview({
        specification: previewData,
      });
      wizard.validateOpenApiPreview();
    }
  }, [previewData, wizard]);
  
  // Update wizard state on error
  useEffect(() => {
    if (error) {
      wizard.updateOpenApiPreview({
        specification: null,
        isValid: false,
        validationErrors: [error.message],
      });
    }
  }, [error, wizard]);
  
  return {
    preview: wizard.openApiPreview,
    isGenerating: isLoading,
    regeneratePreview: refetch,
    error: error?.message,
  };
};

// Main provider component
interface WizardProviderProps {
  children: ReactNode;
  serviceId?: string;
  serviceName?: string;
  databaseType?: string;
}

export const WizardProvider: React.FC<WizardProviderProps> = ({
  children,
  serviceId,
  serviceName,
  databaseType,
}) => {
  const store = createWizardStore();
  const queryClient = useQueryClient();
  
  // Initialize service context if provided
  useEffect(() => {
    if (serviceId && serviceName && databaseType) {
      store.getState().setServiceContext(serviceId, serviceName, databaseType);
    }
  }, [serviceId, serviceName, databaseType, store]);
  
  // Subscribe to wizard state changes for debugging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const unsubscribe = store.subscribe(
        (state) => state.currentStep,
        (currentStep, previousStep) => {
          console.log('Wizard step changed:', { previousStep, currentStep });
        }
      );
      
      return unsubscribe;
    }
  }, [store]);
  
  const contextValue: WizardContextType = {
    store,
    queryClient,
  };
  
  return (
    <WizardContext.Provider value={contextValue}>
      {children}
    </WizardContext.Provider>
  );
};

// Export wizard step constants for use in components
export { WIZARD_STEPS };

// Export types for use in components
export type {
  WizardStep,
  DatabaseTable,
  DatabaseField,
  Relationship,
  EndpointConfiguration,
  SecurityRule,
  GenerationProgress,
  OpenAPIPreview,
  WizardState,
};