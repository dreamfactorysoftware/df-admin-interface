/**
 * Event Scripts Types for DreamFactory Admin Interface
 * 
 * Comprehensive TypeScript definitions for event scripts management,
 * supporting React Hook Form validation and React Query optimization.
 * Provides type safety for script creation, editing, and execution.
 * 
 * Features:
 * - Script configuration and metadata management
 * - Event endpoint configuration workflows
 * - Zod validation schemas for type safety
 * - React Query integration support
 * - Storage service integration
 * - Code editor mode definitions
 */

import { z } from 'zod';

// ============================================================================
// CORE SCRIPT TYPES
// ============================================================================

/**
 * Supported script types in DreamFactory
 */
export const ScriptTypes = [
  'nodejs',
  'php', 
  'python',
  'python3'
] as const;

export type ScriptType = typeof ScriptTypes[number];

/**
 * ACE Editor modes for different script types
 */
export enum AceEditorMode {
  JSON = 'json',
  YAML = 'yaml',
  TEXT = 'text',
  NODEJS = 'nodejs',
  PHP = 'php',
  PYTHON = 'python',
  PYTHON3 = 'python3',
  JAVASCRIPT = 'javascript',
}

/**
 * Script type definitions with editor configurations
 */
export const SCRIPT_TYPE_DEFINITIONS = [
  {
    label: 'Node.js',
    value: AceEditorMode.NODEJS,
    extension: 'js',
    mode: 'javascript'
  },
  {
    label: 'PHP',
    value: AceEditorMode.PHP, 
    extension: 'php',
    mode: 'php'
  },
  {
    label: 'Python',
    value: AceEditorMode.PYTHON,
    extension: 'py',
    mode: 'python'
  },
  {
    label: 'Python 3',
    value: AceEditorMode.PYTHON3,
    extension: 'py', 
    mode: 'python'
  },
] as const;

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Script configuration validation schema
 */
export const ScriptConfigValidator = z.object({
  name: z.string()
    .min(1, 'Script name is required')
    .max(80, 'Script name must be 80 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_\-\.]*$/, 'Script name must start with a letter and contain only letters, numbers, underscores, hyphens, and dots'),
  type: z.enum(ScriptTypes, {
    errorMap: () => ({ message: 'Please select a valid script type' })
  }),
  content: z.string()
    .min(1, 'Script content is required')
    .max(1000000, 'Script content must be less than 1MB'),
  storageServiceId: z.number().optional(),
  storagePath: z.string()
    .max(500, 'Storage path must be 500 characters or less')
    .optional(),
  isActive: z.boolean().default(true),
  allowEventModification: z.boolean().default(false),
  config: z.record(z.any()).optional(),
});

/**
 * Script creation validation schema
 */
export const ScriptCreateValidator = ScriptConfigValidator.extend({
  // Additional validation for creation
});

/**
 * Script update validation schema  
 */
export const ScriptUpdateValidator = ScriptConfigValidator.partial().extend({
  name: z.string().optional(), // Name can't be changed in edit mode
  lastModifiedDate: z.string().optional()
});

// ============================================================================
// SCRIPT INTERFACES
// ============================================================================

/**
 * Core script object interface
 */
export interface ScriptObject {
  name: string;
  type: ScriptType;
  content: string;
  isActive: boolean;
  allowEventModification: boolean;
  storageServiceId?: number;
  scmRepository?: string;
  scmReference?: string;
  storagePath?: string;
  config?: any;
  createdById?: number;
  createdDate?: string;
  lastModifiedById?: number;
  lastModifiedDate?: string;
}

/**
 * GitHub file object interface for SCM integration
 */
export interface GithubFileObject {
  content: string;
  download_url: string;
  encoding: string;
  git_url: string;
  html_url: string;
  name: string;
  path: string;
  sha: string;
  size: number;
  type: string;
  url: string;
  _links: { 
    self: string; 
    git: string; 
    html: string; 
  };
}

/**
 * Script event configuration
 */
export interface ScriptEvent {
  name: string;
  endpoints: Array<string>;
  parameter?: { 
    [key: string]: Array<string> 
  };
  [key: string]: any;
}

/**
 * Script event response structure
 */
export interface ScriptEventResponse {
  [serviceName: string]: {
    [eventName: string]: {
      type: string;
      endpoints: Array<string>;
      parameter?: { 
        [key: string]: Array<string> 
      };
    };
  };
}

/**
 * Grouped script events for UI display
 */
export interface GroupedScriptEvents {
  name: string;
  endpoints: string[];
}

/**
 * Script execution result
 */
export interface ScriptExecutionResult {
  success: boolean;
  result?: any;
  error?: {
    message: string;
    code?: string;
    line?: number;
    stack?: string;
  };
  executionTime: number;
  memoryUsage?: number;
}

/**
 * Script validation result
 */
export interface ScriptValidationResult {
  valid: boolean;
  errors?: Array<{
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings?: Array<{
    line: number;
    column: number;
    message: string;
  }>;
}

/**
 * Script editor configuration
 */
export interface ScriptEditorConfig {
  mode: AceEditorMode;
  theme: 'light' | 'dark';
  fontSize: number;
  tabSize: number;
  useSoftTabs: boolean;
  showLineNumbers: boolean;
  showGutter: boolean;
  highlightActiveLine: boolean;
  enableLiveAutocompletion: boolean;
  enableSnippets: boolean;
  wrapEnabled: boolean;
}

// ============================================================================
// FORM INTERFACES
// ============================================================================

/**
 * Script form data interface
 */
export interface ScriptFormData {
  name: string;
  type: ScriptType;
  content: string;
  storageServiceId?: number;
  storagePath?: string;
  isActive: boolean;
  allowEventModification: boolean;
  config?: Record<string, any>;
}

/**
 * Script metadata for display
 */
export interface ScriptMetadata {
  name: string;
  type: ScriptType;
  size: number;
  lastModified: string;
  isActive: boolean;
  executionCount?: number;
  lastExecuted?: string;
  averageExecutionTime?: number;
}

/**
 * Script creation workflow step
 */
export interface ScriptCreationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  data?: any;
}

/**
 * Script creation workflow state
 */
export interface ScriptCreationWorkflow {
  currentStep: number;
  steps: ScriptCreationStep[];
  scriptData: Partial<ScriptFormData>;
  selectedService?: string;
  selectedEvent?: string;
  selectedRoute?: string;
  selectedTable?: string;
  completeName?: string;
}

// ============================================================================
// STORAGE SERVICE INTEGRATION
// ============================================================================

/**
 * Storage service integration options
 */
export interface StorageServiceOption {
  id: number;
  name: string;
  label: string;
  type: 'local_file' | 'aws_s3' | 'azure_blob' | 'gcs' | 'ftp';
  config: {
    container?: string;
    path?: string;
    region?: string;
  };
}

/**
 * Script storage configuration
 */
export interface ScriptStorageConfig {
  serviceId: number;
  serviceName: string;
  path: string;
  autoSync: boolean;
  compression: boolean;
  backup: boolean;
}

// ============================================================================
// API AND HOOKS INTEGRATION
// ============================================================================

/**
 * Script query keys for React Query
 */
export const ScriptQueryKeys = {
  all: ['scripts'] as const,
  lists: () => [...ScriptQueryKeys.all, 'list'] as const,
  list: (filters?: ScriptListFilters) => [...ScriptQueryKeys.lists(), filters] as const,
  details: () => [...ScriptQueryKeys.all, 'detail'] as const,
  detail: (name: string) => [...ScriptQueryKeys.details(), name] as const,
  events: () => [...ScriptQueryKeys.all, 'events'] as const,
  eventsByService: (serviceName: string) => [...ScriptQueryKeys.events(), serviceName] as const,
  validation: (content: string, type: ScriptType) => [...ScriptQueryKeys.all, 'validation', content, type] as const,
  execution: (name: string) => [...ScriptQueryKeys.all, 'execution', name] as const,
} as const;

/**
 * Script list filters
 */
export interface ScriptListFilters {
  type?: ScriptType;
  active?: boolean;
  search?: string;
  service?: string;
  sortBy?: 'name' | 'type' | 'created' | 'modified' | 'lastExecuted';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Script list response
 */
export interface ScriptListResponse {
  scripts: ScriptMetadata[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Script API response wrapper
 */
export interface ScriptAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

/**
 * Script editor component props
 */
export interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: ScriptType;
  theme?: 'light' | 'dark';
  height?: string;
  width?: string;
  readOnly?: boolean;
  showLineNumbers?: boolean;
  showGutter?: boolean;
  highlightActiveLine?: boolean;
  fontSize?: number;
  tabSize?: number;
  onValidate?: (result: ScriptValidationResult) => void;
  onExecute?: () => void;
  className?: string;
}

/**
 * Script form component props
 */
export interface ScriptFormProps {
  script?: ScriptObject;
  mode: 'create' | 'edit';
  onSubmit: (data: ScriptFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  storageServices: StorageServiceOption[];
  scriptEvents?: ScriptEventResponse;
}

/**
 * Link service component props
 */
export interface LinkServiceProps {
  selectedService?: string;
  selectedEvent?: string;
  selectedRoute?: string;
  selectedTable?: string;
  onServiceChange: (service: string) => void;
  onEventChange: (event: string) => void;
  onRouteChange: (route: string) => void;
  onTableChange?: (table: string) => void;
  scriptEvents: ScriptEventResponse;
  storageServices: StorageServiceOption[];
}

// ============================================================================
// HELPER TYPES AND UTILITIES
// ============================================================================

/**
 * Script operation result
 */
export interface ScriptOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Script deployment status
 */
export interface ScriptDeploymentStatus {
  status: 'pending' | 'deploying' | 'deployed' | 'failed';
  environment: string;
  lastDeployed?: string;
  logs?: string[];
  error?: string;
}

/**
 * Script backup information
 */
export interface ScriptBackup {
  id: string;
  scriptName: string;
  content: string;
  timestamp: string;
  version: string;
  comment?: string;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Re-export Zod validators for external use
export {
  ScriptConfigValidator,
  ScriptCreateValidator,
  ScriptUpdateValidator
};

// Type utilities
export type ScriptConfigData = z.infer<typeof ScriptConfigValidator>;
export type ScriptCreateData = z.infer<typeof ScriptCreateValidator>;
export type ScriptUpdateData = z.infer<typeof ScriptUpdateValidator>;

// Default exports for common types
export type {
  ScriptObject as DefaultScript,
  ScriptMetadata as DefaultScriptMetadata,
  ScriptFormData as DefaultScriptFormData,
  ScriptEditorConfig as DefaultScriptEditorConfig
};