/**
 * TypeScript type definitions for API endpoint configuration components.
 * Provides comprehensive typing for HTTP method selection, endpoint parameters,
 * and validation schemas ensuring type-safe API generation workflows.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpMethodOption {
  value: HttpMethod;
  label: string;
  description: string;
  disabled?: boolean;
  icon?: string;
  color?: string;
}

export interface HttpMethodSelectorProps {
  /** The name attribute for form field registration */
  name: string;
  /** Label text for the selector */
  label?: string;
  /** Help text to display below the selector */
  description?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Default selected HTTP method */
  defaultValue?: HttpMethod;
  /** Array of methods to exclude from selection */
  excludeMethods?: HttpMethod[];
  /** Callback fired when method selection changes */
  onMethodChange?: (method: HttpMethod | undefined) => void;
  /** Whether to show method-specific configuration options */
  showMethodConfig?: boolean;
  /** CSS class names to apply to the component */
  className?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

export interface MethodSpecificConfig {
  /** Configuration options specific to the selected HTTP method */
  allowBody?: boolean;
  allowParameters?: boolean;
  requireAuth?: boolean;
  supportsCaching?: boolean;
  idempotent?: boolean;
  safe?: boolean;
}

export interface EndpointConfig {
  /** HTTP method for the endpoint */
  method: HttpMethod;
  /** Path parameters configuration */
  pathParams?: ParameterConfig[];
  /** Query parameters configuration */
  queryParams?: ParameterConfig[];
  /** Request body configuration (for POST, PUT, PATCH) */
  requestBody?: RequestBodyConfig;
  /** Response configuration */
  responses?: ResponseConfig[];
  /** Security requirements */
  security?: SecurityConfig;
  /** Method-specific configuration */
  methodConfig?: MethodSpecificConfig;
}

export interface ParameterConfig {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Whether parameter is required */
  required: boolean;
  /** Parameter description */
  description?: string;
  /** Default value */
  defaultValue?: any;
  /** Validation schema */
  validation?: ValidationRule[];
  /** Example values */
  examples?: any[];
}

export interface RequestBodyConfig {
  /** Content type */
  contentType: string;
  /** Schema definition */
  schema: any;
  /** Whether body is required */
  required: boolean;
  /** Example payload */
  example?: any;
}

export interface ResponseConfig {
  /** HTTP status code */
  statusCode: number;
  /** Response description */
  description: string;
  /** Response schema */
  schema?: any;
  /** Example response */
  example?: any;
}

export interface SecurityConfig {
  /** Authentication type */
  authType: 'none' | 'api-key' | 'bearer' | 'basic' | 'oauth2';
  /** Required roles */
  roles?: string[];
  /** Required permissions */
  permissions?: string[];
}

export interface ValidationRule {
  /** Validation type */
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  /** Validation value */
  value?: any;
  /** Error message */
  message: string;
}

export interface HttpMethodFormData {
  /** Selected HTTP method */
  method: HttpMethod;
  /** Additional configuration fields */
  [key: string]: any;
}

/** HTTP method constants with associated metadata */
export const HTTP_METHODS: Record<HttpMethod, HttpMethodOption> = {
  GET: {
    value: 'GET',
    label: 'GET',
    description: 'Retrieve data from the server. Safe and idempotent operation.',
    color: 'green',
    icon: 'download'
  },
  POST: {
    value: 'POST',
    label: 'POST',
    description: 'Create new resources on the server. Not idempotent.',
    color: 'blue',
    icon: 'plus'
  },
  PUT: {
    value: 'PUT',
    label: 'PUT',
    description: 'Create or completely replace a resource. Idempotent operation.',
    color: 'orange',
    icon: 'upload'
  },
  PATCH: {
    value: 'PATCH',
    label: 'PATCH',
    description: 'Partially update an existing resource. Not necessarily idempotent.',
    color: 'yellow',
    icon: 'edit'
  },
  DELETE: {
    value: 'DELETE',
    label: 'DELETE',
    description: 'Remove a resource from the server. Idempotent operation.',
    color: 'red',
    icon: 'trash'
  }
} as const;

/** Method-specific configuration mapping */
export const METHOD_CONFIGS: Record<HttpMethod, MethodSpecificConfig> = {
  GET: {
    allowBody: false,
    allowParameters: true,
    requireAuth: false,
    supportsCaching: true,
    idempotent: true,
    safe: true
  },
  POST: {
    allowBody: true,
    allowParameters: true,
    requireAuth: true,
    supportsCaching: false,
    idempotent: false,
    safe: false
  },
  PUT: {
    allowBody: true,
    allowParameters: true,
    requireAuth: true,
    supportsCaching: false,
    idempotent: true,
    safe: false
  },
  PATCH: {
    allowBody: true,
    allowParameters: true,
    requireAuth: true,
    supportsCaching: false,
    idempotent: false,
    safe: false
  },
  DELETE: {
    allowBody: false,
    allowParameters: true,
    requireAuth: true,
    supportsCaching: false,
    idempotent: true,
    safe: false
  }
} as const;

/** Type guard to check if value is a valid HTTP method */
export function isHttpMethod(value: any): value is HttpMethod {
  return typeof value === 'string' && value in HTTP_METHODS;
}

/** Get method-specific configuration for an HTTP method */
export function getMethodConfig(method: HttpMethod): MethodSpecificConfig {
  return METHOD_CONFIGS[method];
}

/** Get available HTTP methods excluding specified ones */
export function getAvailableMethods(exclude: HttpMethod[] = []): HttpMethodOption[] {
  return Object.values(HTTP_METHODS).filter(method => !exclude.includes(method.value));
}