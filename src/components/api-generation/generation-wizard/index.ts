/**
 * @fileoverview API Generation Wizard Module Exports
 * 
 * Main barrel export file for the API generation wizard module providing centralized
 * exports for all wizard components, hooks, types, and utilities. Implements 
 * tree-shaking friendly exports for Turbopack optimization and modular component
 * architecture per React/Next.js Integration Requirements.
 * 
 * This module supports F-003 REST API Endpoint Generation feature with React Hook Form
 * powered configuration interfaces and multi-step wizard workflow implementation as
 * specified in Section 2.1 Feature Catalog and Section 4.1 System Workflows.
 * 
 * Key Features:
 * - Primary GenerationWizard component for complete workflow orchestration
 * - Wizard step components for modular UI construction
 * - Context provider for state management across wizard steps
 * - Custom hooks for step-specific functionality
 * - TypeScript types and interfaces for type-safe development
 * - Configuration constants and validation utilities
 * - Optimized exports for Turbopack build performance
 * 
 * Migration Context:
 * Replaces Angular route-based wizard navigation with React component composition
 * following React 19 patterns and Next.js 15.1 app router architecture.
 * 
 * @module APIGenerationWizard
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 * @author DreamFactory Admin Interface Team
 * @license MIT
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 2.1 - FEATURE CATALOG (F-003)
 * @see React/Next.js Integration Requirements - Component Architecture
 * @see Technical Specification Section 4.1 - SYSTEM WORKFLOWS
 */

// ============================================================================
// PRIMARY COMPONENT EXPORTS
// ============================================================================

/**
 * Primary wizard layout component providing complete multi-step API generation workflow.
 * Serves as the main entry point for the wizard with comprehensive state management,
 * step navigation, progress indication, and coordinated step rendering.
 * 
 * @example
 * ```tsx
 * import { GenerationWizard } from '@/components/api-generation/generation-wizard';
 * 
 * function APIGenerationPage() {
 *   return (
 *     <GenerationWizard
 *       serviceId="database-service-1"
 *       serviceName="MySQL Production"
 *       databaseType="mysql"
 *       onComplete={(result) => {
 *         console.log('API generation completed:', result);
 *       }}
 *       onCancel={() => {
 *         router.push('/api-connections/database');
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export { 
  WizardLayout as GenerationWizard,
  WizardLayout
} from './wizard-layout';

// ============================================================================
// CONTEXT PROVIDER AND STATE MANAGEMENT
// ============================================================================

/**
 * Wizard context provider for state management across all wizard steps.
 * Implements Zustand store integration with React Query for data fetching
 * and optimistic updates. Provides centralized state sharing and actions
 * for the complete wizard workflow.
 * 
 * @example
 * ```tsx
 * import { WizardProvider, useWizard } from '@/components/api-generation/generation-wizard';
 * 
 * function WizardApp() {
 *   return (
 *     <WizardProvider
 *       serviceName="mysql-prod"
 *       initialState={{
 *         currentStep: 'table-selection'
 *       }}
 *     >
 *       <GenerationWizard />
 *     </WizardProvider>
 *   );
 * }
 * ```
 */
export {
  WizardProvider
} from './wizard-provider';

// ============================================================================
// CUSTOM HOOKS FOR WIZARD FUNCTIONALITY
// ============================================================================

/**
 * Primary wizard hook providing access to complete wizard state and actions.
 * Offers type-safe access to all wizard functionality including navigation,
 * data management, validation, and React Query integration.
 * 
 * @example
 * ```tsx
 * import { useWizard } from '@/components/api-generation/generation-wizard';
 * 
 * function WizardStep() {
 *   const { state, actions, isLoading, canProceed } = useWizard();
 *   
 *   return (
 *     <div>
 *       <h2>Step: {state.currentStep}</h2>
 *       <button 
 *         onClick={actions.nextStep} 
 *         disabled={!canProceed}
 *       >
 *         Next
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export {
  useWizard
} from './wizard-provider';

/**
 * Table selection step hook providing specialized functionality for database
 * table discovery, selection, and configuration. Handles virtual scrolling
 * for large schemas (1000+ tables) and bulk selection operations.
 * 
 * @example
 * ```tsx
 * import { useTableSelection } from '@/components/api-generation/generation-wizard';
 * 
 * function TableSelectionStep() {
 *   const { 
 *     availableTables, 
 *     selectedTables, 
 *     selectTable, 
 *     clearSelection 
 *   } = useTableSelection();
 *   
 *   return (
 *     <div>
 *       {availableTables.map(table => (
 *         <TableItem 
 *           key={table.name}
 *           table={table}
 *           onSelect={() => selectTable(table)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export {
  useTableSelection
} from './wizard-provider';

/**
 * Endpoint configuration step hook providing functionality for HTTP method
 * configuration, parameter setup, and API endpoint customization. Supports
 * comprehensive CRUD operation configuration with security rules.
 * 
 * @example
 * ```tsx
 * import { useEndpointConfiguration } from '@/components/api-generation/generation-wizard';
 * 
 * function EndpointConfigStep() {
 *   const { configurations, updateConfiguration } = useEndpointConfiguration();
 *   
 *   const handleMethodToggle = (tableName: string, method: string, enabled: boolean) => {
 *     updateConfiguration(tableName, {
 *       enabledMethods: enabled 
 *         ? [...configs.enabledMethods, method]
 *         : configs.enabledMethods.filter(m => m !== method)
 *     });
 *   };
 *   
 *   return <EndpointConfigForm onMethodChange={handleMethodToggle} />;
 * }
 * ```
 */
export {
  useEndpointConfiguration
} from './wizard-provider';

/**
 * Generation preview step hook providing OpenAPI specification generation,
 * code sample creation, and documentation preview functionality. Enables
 * real-time preview capabilities with server-side rendering optimization.
 * 
 * @example
 * ```tsx
 * import { useGenerationPreview } from '@/components/api-generation/generation-wizard';
 * 
 * function PreviewStep() {
 *   const { 
 *     generatedSpec, 
 *     generatePreview, 
 *     isGenerating 
 *   } = useGenerationPreview();
 *   
 *   return (
 *     <div>
 *       <button 
 *         onClick={generatePreview}
 *         disabled={isGenerating}
 *       >
 *         {isGenerating ? 'Generating...' : 'Generate Preview'}
 *       </button>
 *       {generatedSpec && <OpenAPIPreview spec={generatedSpec} />}
 *     </div>
 *   );
 * }
 * ```
 */
export {
  useGenerationPreview
} from './wizard-provider';

// ============================================================================
// TYPE EXPORTS FOR EXTERNAL USAGE
// ============================================================================

/**
 * Core wizard type definitions providing type-safe interfaces for all
 * wizard components, state management, and external integrations.
 * Essential for TypeScript development and IDE support.
 */
export type {
  // Core wizard workflow types
  WizardStep,
  WizardStepInfo,
  WizardState,
  WizardActions,
  WizardContextType,
  
  // Service selection types
  ServiceSelectionData,
  ServiceFilter,
  NewServiceConfig,
  ServiceSelectionFormData,
  
  // Table selection types  
  TableSelectionData,
  SelectedTable,
  SelectedField,
  TableApiConfig,
  HttpMethodConfig,
  TableFilter,
  BulkSelectionState,
  TableSelectionFormData,
  
  // Endpoint configuration types
  EndpointConfigurationData,
  GlobalEndpointSettings,
  TableEndpointConfig,
  HttpMethod,
  MethodConfig,
  CustomEndpoint,
  EndpointConfigurationFormData,
  
  // Security configuration types
  SecurityConfigurationData,
  AuthenticationConfig,
  AuthorizationConfig,
  ApiKeyConfig,
  RbacConfig,
  SecurityConfigurationFormData,
  
  // Generation preview types
  GenerationPreviewData,
  EndpointSummary,
  OpenApiSpecification,
  CodeSample,
  DocumentationPreview,
  SecuritySummary,
  PerformanceEstimation,
  GenerationPreviewFormData,
  
  // Generation result types
  GenerationResult,
  GeneratedServiceInfo,
  GeneratedEndpoint,
  GeneratedSchema,
  
  // Component prop interfaces
  ApiGenerationWizardProps,
  WizardConfig,
  ServiceSelectionStepProps,
  TableSelectionStepProps,
  EndpointConfigurationStepProps,
  SecurityConfigurationStepProps,
  GenerationPreviewStepProps,
  WizardNavigationProps,
  
  // Context value type for external usage
  WizardContextValue
} from './types';

// ============================================================================
// VALIDATION SCHEMAS FOR FORM INTEGRATION
// ============================================================================

/**
 * Zod validation schemas for React Hook Form integration providing
 * comprehensive form validation across all wizard steps. Ensures
 * data integrity and user input validation with real-time feedback.
 * 
 * @example
 * ```tsx
 * import { TableSelectionSchema } from '@/components/api-generation/generation-wizard';
 * import { zodResolver } from '@hookform/resolvers/zod';
 * import { useForm } from 'react-hook-form';
 * 
 * function TableSelectionForm() {
 *   const form = useForm({
 *     resolver: zodResolver(TableSelectionSchema),
 *     defaultValues: {
 *       selectedTables: [],
 *       filter: { hideSystemTables: true }
 *     }
 *   });
 *   
 *   return <form onSubmit={form.handleSubmit(onSubmit)} />;
 * }
 * ```
 */
export {
  ServiceSelectionSchema,
  TableSelectionSchema,
  EndpointConfigurationSchema,
  SecurityConfigurationSchema,
  GenerationPreviewSchema
} from './types';

// ============================================================================
// UTILITY FUNCTIONS AND HELPERS
// ============================================================================

/**
 * Utility functions for wizard step validation, type checking, and
 * state management. Provides helper functions for common wizard
 * operations and data transformations.
 * 
 * @example
 * ```tsx
 * import { 
 *   isValidWizardStep, 
 *   createInitialWizardState,
 *   getValidationSchemaForStep
 * } from '@/components/api-generation/generation-wizard';
 * 
 * // Type-safe step validation
 * const stepParam = router.query.step as string;
 * if (isValidWizardStep(stepParam)) {
 *   setCurrentStep(stepParam);
 * }
 * 
 * // Initialize wizard state
 * const initialState = createInitialWizardState();
 * 
 * // Get validation schema for current step
 * const schema = getValidationSchemaForStep(currentStep);
 * ```
 */
export {
  isValidWizardStep,
  isValidHttpMethod,
  getValidationSchemaForStep,
  createInitialWizardState
} from './types';

// ============================================================================
// CONFIGURATION CONSTANTS AND DEFAULTS
// ============================================================================

/**
 * Wizard configuration constants providing default values, validation rules,
 * HTTP method configurations, and performance settings. Centralized
 * configuration management for consistent wizard behavior.
 * 
 * @example
 * ```tsx
 * import { 
 *   WIZARD_STEPS,
 *   DEFAULT_ENABLED_METHODS,
 *   VALIDATION_RULES,
 *   REACT_QUERY_CONFIG
 * } from '@/components/api-generation/generation-wizard';
 * 
 * // Configure step navigation
 * const stepConfig = WIZARD_STEPS[currentStep];
 * 
 * // Set default HTTP methods
 * const defaultMethods = DEFAULT_ENABLED_METHODS;
 * 
 * // Apply validation rules
 * const maxTables = VALIDATION_RULES.tableSelection.maxTablesAllowed;
 * 
 * // Configure React Query
 * const queryClient = new QueryClient({
 *   defaultOptions: REACT_QUERY_CONFIG.defaultOptions
 * });
 * ```
 */
export {
  WIZARD_STEPS,
  WIZARD_NAVIGATION,
  HTTP_METHOD_DEFAULTS,
  DEFAULT_ENABLED_METHODS,
  METHOD_DISPLAY_ORDER,
  DEFAULT_ENDPOINT_CONFIG,
  STANDARD_QUERY_PARAMETERS,
  VALIDATION_RULES,
  VALIDATION_MESSAGES,
  REACT_QUERY_CONFIG,
  VIRTUAL_SCROLL_CONFIG,
  DEFAULT_SECURITY_CONFIG,
  OPENAPI_CONFIG,
  GENERATION_PROGRESS_CONFIG,
  FIELD_TYPE_DEFAULTS,
  FILTER_OPERATOR_CONFIG,
  PERFORMANCE_CONFIG
} from './constants';

// ============================================================================
// MAIN MODULE DEFAULT EXPORT
// ============================================================================

/**
 * Default export providing the primary GenerationWizard component
 * for convenient importing. Serves as the main entry point for
 * consumers who need the complete wizard functionality.
 * 
 * @example
 * ```tsx
 * // Named import (recommended for tree-shaking)
 * import { GenerationWizard } from '@/components/api-generation/generation-wizard';
 * 
 * // Default import (alternative)
 * import GenerationWizard from '@/components/api-generation/generation-wizard';
 * 
 * function App() {
 *   return <GenerationWizard serviceId="db-1" />;
 * }
 * ```
 */
export { WizardLayout as default } from './wizard-layout';

// ============================================================================
// MODULE DOCUMENTATION AND USAGE NOTES
// ============================================================================

/**
 * Usage Guidelines:
 * 
 * 1. **Primary Component Usage:**
 *    Import GenerationWizard for complete wizard functionality with
 *    built-in state management and step coordination.
 * 
 * 2. **Provider Pattern:**
 *    Wrap wizard components in WizardProvider for shared state
 *    management across custom implementations.
 * 
 * 3. **Custom Hooks:**
 *    Use step-specific hooks (useTableSelection, useEndpointConfiguration)
 *    for granular control over wizard functionality.
 * 
 * 4. **Type Safety:**
 *    Import type definitions for TypeScript development and
 *    IDE autocomplete support.
 * 
 * 5. **Validation:**
 *    Use exported Zod schemas with React Hook Form for
 *    comprehensive form validation.
 * 
 * 6. **Configuration:**
 *    Import constants for consistent wizard behavior and
 *    customization options.
 * 
 * Performance Considerations:
 * 
 * - All exports are optimized for tree-shaking with Turbopack
 * - Components use React.memo and useCallback for optimization
 * - Virtual scrolling handles large datasets (1000+ tables)
 * - React Query provides intelligent caching and background updates
 * - Debounced validation prevents excessive API calls
 * 
 * Migration Notes:
 * 
 * This module replaces Angular-based wizard navigation with React
 * component composition. Key differences:
 * 
 * - Route-based navigation → Component state management
 * - Angular services → React hooks and Context API  
 * - RxJS observables → React Query for data fetching
 * - Angular forms → React Hook Form with Zod validation
 * - Angular Material → Tailwind CSS with Headless UI
 * 
 * Integration Requirements:
 * 
 * - React 19.0.0+ with concurrent features
 * - Next.js 15.1+ with app router
 * - TypeScript 5.8+ with strict mode
 * - Tailwind CSS 4.1+ for styling
 * - React Query for data management
 * - React Hook Form for form handling
 * - Zod for schema validation
 */