/**
 * Role-based access control and service metadata types
 * 
 * This module provides comprehensive role management interfaces that maintain
 * full compatibility with existing DreamFactory backend APIs while supporting
 * React component patterns, Next.js middleware authentication, and modern
 * data fetching strategies with SWR/React Query.
 * 
 * @module roles
 * @since React Migration 1.0.0
 */

// =============================================================================
// CORE ROLE PAYLOAD INTERFACES
// =============================================================================

/**
 * Complete role payload structure for role creation and management operations.
 * Maintains full compatibility with DreamFactory role management APIs.
 * 
 * @interface RolePayload
 * @example
 * ```tsx
 * // React Hook Form integration
 * const { handleSubmit } = useForm<RolePayload>();
 * 
 * // SWR mutation for role creation
 * const { trigger: createRole } = useSWRMutation(
 *   '/api/v2/system/role',
 *   (url, { arg }: { arg: RolePayload }) => fetch(url, {
 *     method: 'POST',
 *     body: JSON.stringify(arg)
 *   })
 * );
 * ```
 */
export interface RolePayload {
  /** Optional role identifier for updates */
  id?: number;
  /** Unique role name for identification */
  name: string;
  /** Human-readable role description */
  description: string;
  /** Role activation status for access control */
  isActive: boolean;
  /** Service access permissions configuration */
  roleServiceAccessByRoleId: RoleServiceAccess[];
  /** Role-specific lookup key associations */
  lookupByRoleId: Lookup[];
}

/**
 * Service access control configuration for role-based permissions.
 * Defines granular access control for specific service components.
 * 
 * @interface RoleServiceAccess
 * @example
 * ```tsx
 * // React Query for permission validation
 * const { data: hasAccess } = useQuery({
 *   queryKey: ['role-access', serviceId, component],
 *   queryFn: () => validateServiceAccess(roleServiceAccess),
 *   staleTime: 5 * 60 * 1000, // 5 minutes cache
 * });
 * ```
 */
interface RoleServiceAccess {
  /** Service access record identifier */
  id: number;
  /** Associated role identifier */
  roleId: number;
  /** Target service identifier */
  serviceId: number;
  /** Service component name or wildcard */
  component: string;
  /** HTTP verb permission mask (GET=1, POST=2, PUT=4, PATCH=8, DELETE=16) */
  verbMask: number;
  /** Request context mask: 1=API, 2=SCRIPT, 3=BOTH */
  requestorMask: number;
  /** Advanced filter conditions for data access */
  filters: any[];
  /** Filter operation logic (AND, OR) */
  filterOp: string;
}

/**
 * Role-specific lookup key for dynamic configuration values.
 * Supports environment-specific and role-based configuration.
 * 
 * @interface Lookup
 * @example
 * ```tsx
 * // React component for lookup management
 * const LookupManager: React.FC<{ lookups: Lookup[] }> = ({ lookups }) => {
 *   const { data, mutate } = useSWR('/api/v2/system/lookup', fetcher);
 *   
 *   return (
 *     <div className="space-y-4">
 *       {lookups.map(lookup => (
 *         <LookupEditor key={lookup.id} lookup={lookup} onUpdate={mutate} />
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 */
interface Lookup {
  /** Lookup record identifier */
  id: number;
  /** Associated role identifier */
  roleId: number;
  /** Lookup key name for reference */
  name: string;
  /** Lookup value content */
  value: string;
  /** Privacy flag for sensitive values */
  private: boolean;
  /** Optional lookup description */
  description?: string;
}

// =============================================================================
// REACT COMPONENT INTEGRATION INTERFACES
// =============================================================================

/**
 * Form interface for role access configuration in React components.
 * Optimized for React Hook Form integration with Zod validation.
 * 
 * @interface AccessForm
 * @example
 * ```tsx
 * import { z } from 'zod';
 * import { useForm } from 'react-hook-form';
 * import { zodResolver } from '@hookform/resolvers/zod';
 * 
 * const accessFormSchema = z.object({
 *   service: z.number().min(1, 'Service selection required'),
 *   component: z.number().min(1, 'Component selection required'),
 *   access: z.array(z.number()).min(1, 'At least one permission required'),
 *   requester: z.array(z.number()).min(1, 'Requester type required'),
 *   advancedFilters: z.array(z.any()),
 * });
 * 
 * const AccessFormComponent: React.FC = () => {
 *   const { register, handleSubmit, formState: { errors } } = useForm<AccessForm>({
 *     resolver: zodResolver(accessFormSchema)
 *   });
 *   
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
 *       // Form fields with Tailwind CSS styling
 *     </form>
 *   );
 * };
 * ```
 */
export interface AccessForm {
  /** Dynamic field expansion configuration */
  expandField?: string;
  /** Field expansion operator */
  expandOperator?: string;
  /** Field expansion value */
  expandValue?: string;
  /** Target service identifier */
  service: number;
  /** Target component identifier */
  component: number;
  /** Selected access permission array */
  access: number[];
  /** Requester type selection array */
  requester: number[];
  /** Advanced filter configuration array */
  advancedFilters: any[];
  /** Optional record identifier for updates */
  id?: number;
}

/**
 * React Query cache configuration for role access forms.
 * Optimizes performance for role management interfaces.
 */
export interface AccessFormCacheConfig {
  /** Cache key generation function */
  getCacheKey: (formData: Partial<AccessForm>) => string[];
  /** Stale time for cached form data (default: 5 minutes) */
  staleTime?: number;
  /** Cache time for inactive data (default: 10 minutes) */
  cacheTime?: number;
  /** Background refetch on window focus */
  refetchOnWindowFocus?: boolean;
}

// =============================================================================
// SERVICE RESPONSE INTERFACES
// =============================================================================

/**
 * Complete service response object for role-based access control.
 * Maintains compatibility with DreamFactory service APIs.
 * 
 * @interface ServiceResponseObj
 * @example
 * ```tsx
 * // SWR integration with service data
 * const { data: services, error } = useSWR<ServiceResponseObj[]>(
 *   '/api/v2/system/service',
 *   fetcher,
 *   {
 *     refreshInterval: 30000, // 30 seconds
 *     revalidateOnFocus: false,
 *   }
 * );
 * 
 * // React component rendering
 * if (error) return <ErrorBoundary error={error} />;
 * if (!services) return <LoadingSpinner />;
 * 
 * return (
 *   <ServiceGrid services={services} className="grid grid-cols-3 gap-4" />
 * );
 * ```
 */
export interface ServiceResponseObj {
  /** Service unique identifier */
  id: number;
  /** Service system name */
  name: string;
  /** Human-readable service label */
  label: string;
  /** Service description text */
  description: string;
  /** Service activation status */
  isActive: boolean;
  /** Service type classification */
  type: string;
  /** Configuration mutability flag */
  mutable: boolean;
  /** Deletion permission flag */
  deletable: boolean;
  /** ISO 8601 creation timestamp */
  createdDate: string;
  /** ISO 8601 last modification timestamp */
  lastModifiedDate: string;
  /** Creator user identifier */
  createdById?: number;
  /** Last modifier user identifier */
  lastModifiedById?: number;
  /** Service-specific configuration object */
  config: ServiceConfig;
  /** Associated documentation reference */
  serviceDocByServiceId?: number;
}

/**
 * Service configuration structure for user management services.
 * Supports email templating and invitation workflows.
 */
interface ServiceConfig {
  /** Parent service identifier */
  serviceId: number;
  /** Default application identifier */
  defaultAppId?: number;
  /** Email service for invitations */
  inviteEmailServiceId: number;
  /** Email template for invitations */
  inviteEmailTemplateId: number;
  /** Email service for password operations */
  passwordEmailServiceId: number;
  /** Email template for password operations */
  passwordEmailTemplateId: number;
}

// =============================================================================
// ENHANCED SERVICE ACCESS TYPES
// =============================================================================

/**
 * Enhanced role service access type with audit metadata.
 * Provides complete access control configuration with React integration.
 * 
 * @interface RoleServiceAccessType
 * @example
 * ```tsx
 * // React Query mutation for access updates
 * const { mutate: updateAccess } = useMutation({
 *   mutationFn: (access: RoleServiceAccessType) => 
 *     fetch(`/api/v2/system/role_service_access/${access.id}`, {
 *       method: 'PUT',
 *       body: JSON.stringify(access)
 *     }),
 *   onSuccess: () => {
 *     queryClient.invalidateQueries(['role-access']);
 *     toast.success('Access permissions updated successfully');
 *   },
 *   onError: (error) => {
 *     toast.error('Failed to update access permissions');
 *   }
 * });
 * ```
 */
export interface RoleServiceAccessType {
  /** Access record unique identifier */
  id: number;
  /** Associated role identifier */
  roleId: number;
  /** Target service identifier */
  serviceId: number;
  /** Service component specification */
  component: string;
  /** HTTP verb permission bitmask */
  verbMask: number;
  /** Request context bitmask */
  requestorMask: number;
  /** Advanced filter array (optional) */
  filters?: any[];
  /** Filter operation logic */
  filterOp: string;
  /** ISO 8601 creation timestamp */
  createdDate: string;
  /** ISO 8601 last modification timestamp */
  lastModifiedDate: string;
  /** Creator user identifier (optional) */
  createdById?: number;
  /** Last modifier user identifier (optional) */
  lastModifiedById?: number;
  /** Extended field name for dynamic access */
  extendField: string;
  /** Extended operator type */
  extendOperator: number;
  /** Extended value for dynamic conditions */
  extendValue: string;
}

// =============================================================================
// REACT HOOK INTEGRATION TYPES
// =============================================================================

/**
 * React Hook configuration for role management operations.
 * Provides type-safe integration with modern React patterns.
 * 
 * @interface UseRoleConfig
 * @example
 * ```tsx
 * const useRole = (config: UseRoleConfig) => {
 *   const { data, error, isLoading } = useSWR(
 *     config.roleId ? `/api/v2/system/role/${config.roleId}` : null,
 *     fetcher,
 *     {
 *       refreshInterval: config.refreshInterval,
 *       revalidateOnFocus: config.revalidateOnFocus,
 *     }
 *   );
 *   
 *   return { role: data, error, isLoading };
 * };
 * ```
 */
export interface UseRoleConfig {
  /** Target role identifier */
  roleId?: number;
  /** Automatic refresh interval in milliseconds */
  refreshInterval?: number;
  /** Revalidate data on window focus */
  revalidateOnFocus?: boolean;
  /** Enable suspense mode for React Suspense */
  suspense?: boolean;
  /** Error retry configuration */
  retry?: boolean | number;
}

/**
 * Role permission validation context for React components.
 * Supports Next.js middleware integration and client-side validation.
 * 
 * @interface RolePermissionContext
 * @example
 * ```tsx
 * // React Context for role permissions
 * const RolePermissionProvider: React.FC<PropsWithChildren> = ({ children }) => {
 *   const [permissions, setPermissions] = useState<RolePermissionContext>();
 *   
 *   useEffect(() => {
 *     // Load permissions from Next.js middleware or API
 *     loadUserPermissions().then(setPermissions);
 *   }, []);
 *   
 *   return (
 *     <PermissionContext.Provider value={permissions}>
 *       {children}
 *     </PermissionContext.Provider>
 *   );
 * };
 * ```
 */
export interface RolePermissionContext {
  /** Current user role information */
  userRole: RolePayload | null;
  /** Available service permissions */
  servicePermissions: RoleServiceAccessType[];
  /** Permission validation function */
  hasPermission: (service: string, component: string, verb: string) => boolean;
  /** Permission loading state */
  isLoading: boolean;
  /** Permission error state */
  error: Error | null;
  /** Refresh permissions function */
  refresh: () => Promise<void>;
}

// =============================================================================
// NEXT.JS MIDDLEWARE INTEGRATION TYPES
// =============================================================================

/**
 * Role validation request for Next.js middleware processing.
 * Supports server-side role-based access control enforcement.
 * 
 * @interface RoleValidationRequest
 * @example
 * ```tsx
 * // Next.js middleware usage
 * export async function middleware(request: NextRequest) {
 *   const validationRequest: RoleValidationRequest = {
 *     userId: getUserIdFromToken(request),
 *     requestedPath: request.nextUrl.pathname,
 *     httpMethod: request.method,
 *     serviceContext: extractServiceContext(request),
 *   };
 *   
 *   const hasAccess = await validateRoleAccess(validationRequest);
 *   
 *   if (!hasAccess) {
 *     return NextResponse.redirect(new URL('/access-denied', request.url));
 *   }
 *   
 *   return NextResponse.next();
 * }
 * ```
 */
export interface RoleValidationRequest {
  /** User identifier for role lookup */
  userId: number;
  /** Requested resource path */
  requestedPath: string;
  /** HTTP method for permission checking */
  httpMethod: string;
  /** Service context for permission validation */
  serviceContext?: string;
  /** Additional validation parameters */
  parameters?: Record<string, any>;
}

/**
 * Role validation response from middleware processing.
 * Provides detailed access control decision information.
 */
export interface RoleValidationResponse {
  /** Access granted flag */
  hasAccess: boolean;
  /** User role information */
  userRole?: RolePayload;
  /** Matched service permissions */
  matchedPermissions: RoleServiceAccessType[];
  /** Access denial reason (if applicable) */
  denialReason?: string;
  /** Validation timestamp */
  validatedAt: string;
}

// =============================================================================
// FORM VALIDATION AND ZOD INTEGRATION
// =============================================================================

/**
 * Role form validation configuration for Zod schema integration.
 * Provides comprehensive validation for role management forms.
 * 
 * @interface RoleFormValidation
 * @example
 * ```tsx
 * import { z } from 'zod';
 * 
 * // Zod schema for role payload validation
 * export const rolePayloadSchema = z.object({
 *   name: z.string()
 *     .min(1, 'Role name is required')
 *     .max(50, 'Role name must be less than 50 characters')
 *     .regex(/^[a-zA-Z0-9_-]+$/, 'Role name can only contain letters, numbers, hyphens, and underscores'),
 *   description: z.string()
 *     .min(1, 'Description is required')
 *     .max(255, 'Description must be less than 255 characters'),
 *   isActive: z.boolean(),
 *   roleServiceAccessByRoleId: z.array(roleServiceAccessSchema),
 *   lookupByRoleId: z.array(lookupSchema),
 * });
 * 
 * // React Hook Form integration
 * const CreateRoleForm: React.FC = () => {
 *   const { register, handleSubmit, formState: { errors } } = useForm<RolePayload>({
 *     resolver: zodResolver(rolePayloadSchema)
 *   });
 *   
 *   return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
 * };
 * ```
 */
export interface RoleFormValidation {
  /** Role name validation rules */
  nameValidation: {
    required: boolean;
    minLength: number;
    maxLength: number;
    pattern: RegExp;
  };
  /** Description validation rules */
  descriptionValidation: {
    required: boolean;
    maxLength: number;
  };
  /** Service access validation rules */
  serviceAccessValidation: {
    minimumPermissions: number;
    allowedVerbs: string[];
    allowedRequestors: number[];
  };
}

// =============================================================================
// EXPORT CONSOLIDATED TYPES
// =============================================================================

/**
 * Comprehensive role management type collection for React applications.
 * Provides all necessary types for implementing role-based access control
 * in React/Next.js applications with full DreamFactory API compatibility.
 */
export type {
  // Core interfaces (maintained from Angular)
  RolePayload,
  AccessForm,
  ServiceResponseObj,
  RoleServiceAccessType,
  
  // React integration types
  AccessFormCacheConfig,
  UseRoleConfig,
  RolePermissionContext,
  
  // Next.js middleware types
  RoleValidationRequest,
  RoleValidationResponse,
  
  // Validation types
  RoleFormValidation,
};

/**
 * Role permission constants for HTTP verb bitmasks.
 * Maintains compatibility with DreamFactory permission system.
 */
export const ROLE_PERMISSIONS = {
  READ: 1,      // GET
  CREATE: 2,    // POST  
  UPDATE: 4,    // PUT
  PATCH: 8,     // PATCH
  DELETE: 16,   // DELETE
} as const;

/**
 * Requestor context constants for permission validation.
 * Defines request origination context for access control.
 */
export const REQUESTOR_CONTEXT = {
  API: 1,           // Direct API requests
  SCRIPT: 2,        // Server-side scripts
  API_AND_SCRIPT: 3 // Both API and script access
} as const;

/**
 * Role status constants for role management operations.
 * Provides standardized role state management.
 */
export const ROLE_STATUS = {
  ACTIVE: true,
  INACTIVE: false,
} as const;