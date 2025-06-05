/**
 * API rate-limiting types and payload structures maintaining compatibility while supporting React component patterns.
 * 
 * These types preserve the exact API contracts from the original Angular implementation
 * while providing enhanced TypeScript support for React Query patterns, React Hook Form
 * integration, and component composition used throughout the modernized Next.js application.
 * Maintains full compatibility with DreamFactory Core backend rate limiting endpoints.
 * 
 * @module LimitTypes
 * @version 1.0.0
 * @since Next.js 15.1 / React 19 migration
 */

import type { RoleType } from './role';
import type { Service } from './service';
import type { UserProfile } from './user';

// =============================================================================
// CORE LIMIT TYPES
// =============================================================================

/**
 * Supported limit types for rate limiting configuration.
 * Maps to backend limit_type configurations in DreamFactory API endpoints.
 */
export type LimitTypeCategory = 
  | 'api'
  | 'user'
  | 'role'
  | 'service'
  | 'endpoint'
  | 'global';

/**
 * Time period units for rate limiting windows.
 * Used with rate configuration to define the temporal scope of rate limits.
 */
export type LimitPeriod = 
  | 'minute'
  | 'hour' 
  | 'day'
  | '7-day'
  | '30-day';

/**
 * HTTP verb types for endpoint-specific rate limiting.
 * Maps to REST API method restrictions for granular access control.
 */
export type LimitVerb = 
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | '*'; // wildcard for all verbs

// =============================================================================
// CACHE AND TRACKING TYPES
// =============================================================================

/**
 * Cache limit tracking interface for rate limit state management.
 * Maintains real-time tracking of rate limit consumption and remaining quota.
 * Used by React Query for cache invalidation and SWR for real-time updates.
 * 
 * @interface CacheLimitType
 * @example
 * ```tsx
 * // React component displaying rate limit status
 * function RateLimitStatus({ cacheLimit }: { cacheLimit: CacheLimitType }) {
 *   const remainingPercent = (cacheLimit.remaining / cacheLimit.max) * 100;
 *   
 *   return (
 *     <div className="flex items-center space-x-2">
 *       <div className="w-24 bg-gray-200 rounded-full h-2">
 *         <div 
 *           className="bg-blue-600 h-2 rounded-full" 
 *           style={{ width: `${remainingPercent}%` }}
 *         />
 *       </div>
 *       <span className="text-sm text-gray-600">
 *         {cacheLimit.remaining}/{cacheLimit.max} remaining
 *       </span>
 *     </div>
 *   );
 * }
 * ```
 */
export interface CacheLimitType {
  /** Unique cache limit identifier for tracking purposes */
  id: number;
  
  /** Cache key identifier for rate limit lookup and management */
  key: string;
  
  /** Maximum allowed requests/operations within the time period */
  max: number;
  
  /** Current number of attempts made within the current period */
  attempts: number;
  
  /** Remaining requests/operations available in the current period */
  remaining: number;
  
  /** Optional expiration timestamp for cache entry cleanup */
  expiresAt?: string;
  
  /** Optional last reset timestamp for period tracking */
  lastReset?: string;
}

// =============================================================================
// MAIN LIMIT ENTITY
// =============================================================================

/**
 * Complete rate limit entity interface with full audit trail and relationships.
 * 
 * Represents the complete limit object as returned from DreamFactory API endpoints.
 * Used in limit creation/editing forms, detailed views, and comprehensive rate limit
 * management workflows. Fully compatible with React Hook Form validation
 * and React Query mutations for CRUD operations.
 * 
 * @interface LimitType
 * @example
 * ```tsx
 * // React Hook Form integration with limit editing
 * function LimitEditForm({ limit }: { limit: LimitType }) {
 *   const { register, handleSubmit, watch, formState: { errors } } = useForm<LimitType>({
 *     defaultValues: limit,
 *     resolver: zodResolver(limitSchema)
 *   });
 * 
 *   const limitType = watch('type');
 *   
 *   const updateLimitMutation = useMutation({
 *     mutationFn: updateLimit,
 *     onSuccess: () => {
 *       queryClient.invalidateQueries(['limits']);
 *       queryClient.invalidateQueries(['limit', limit.id]);
 *     }
 *   });
 * 
 *   return (
 *     <form onSubmit={handleSubmit(updateLimitMutation.mutate)}>
 *       <input {...register('name')} placeholder="Limit name" />
 *       <textarea {...register('description')} placeholder="Description" />
 *       <select {...register('type')}>
 *         <option value="api">API Limit</option>
 *         <option value="user">User Limit</option>
 *         <option value="role">Role Limit</option>
 *       </select>
 *       
 *       {limitType === 'endpoint' && (
 *         <input {...register('endpoint')} placeholder="Endpoint path" />
 *       )}
 *       
 *       <input type="number" {...register('rate')} placeholder="Rate limit" />
 *       <select {...register('period')}>
 *         <option value="minute">Per Minute</option>
 *         <option value="hour">Per Hour</option>
 *         <option value="day">Per Day</option>
 *       </select>
 *     </form>
 *   );
 * }
 * ```
 */
export interface LimitType {
  /** ISO 8601 creation timestamp for audit and sorting purposes */
  createdDate: string;
  
  /** Detailed description of the rate limit for documentation and clarity */
  description: string;
  
  /** Specific endpoint path for endpoint-type limits (null for other types) */
  endpoint: string | null;
  
  /** Unique limit identifier matching database primary key */
  id: number;
  
  /** Rate limit activation status for enforcement control */
  isActive: boolean;
  
  /** Generated cache key text for rate limit lookup optimization */
  keyText: string;
  
  /** ISO 8601 last modification timestamp for audit purposes */
  lastModifiedDate: string;
  
  /** Array of cache limit entries for real-time tracking and monitoring */
  limitCacheByLimitId: CacheLimitType[];
  
  /** Human-readable limit name displayed in UI components */
  name: string;
  
  /** Time period for rate limit window (minute, hour, day, etc.) */
  period: LimitPeriod;
  
  /** Maximum number of requests/operations allowed per period */
  rate: number;
  
  /** Associated role entity for role-based limits (null for other types) */
  roleByRoleId: RoleType | null;
  
  /** Role ID foreign key for role-based rate limiting (null if not applicable) */
  roleId: number | null;
  
  /** Associated service entity for service-based limits (null for other types) */
  serviceByServiceId: Service | null;
  
  /** Service ID foreign key for service-based rate limiting (null if not applicable) */
  serviceId: number | null;
  
  /** Limit type category determining the scope and application of the rate limit */
  type: LimitTypeCategory;
  
  /** Associated user entity for user-based limits (null for other types) */
  userByUserId: UserProfile | null;
  
  /** User ID foreign key for user-based rate limiting (null if not applicable) */
  userId: number | null;
  
  /** HTTP verb restriction for endpoint limits (null for non-endpoint limits) */
  verb: LimitVerb | null;
}

// =============================================================================
// TABLE DISPLAY TYPES
// =============================================================================

/**
 * Simplified limit interface for table display and basic operations.
 * 
 * Used primarily in limit management tables and listing components where only
 * essential limit information is needed. Optimized for React table components
 * with TanStack Virtual and provides clean data transformation patterns.
 * 
 * @interface LimitTableRowData
 * @example
 * ```tsx
 * // React component usage with limit table
 * function LimitTableRow({ limit }: { limit: LimitTableRowData }) {
 *   return (
 *     <tr className="border-b hover:bg-gray-50">
 *       <td className="px-4 py-2">{limit.name}</td>
 *       <td className="px-4 py-2">
 *         <Badge variant="outline">{limit.limitType}</Badge>
 *       </td>
 *       <td className="px-4 py-2">{limit.limitRate}</td>
 *       <td className="px-4 py-2">{limit.limitCounter}</td>
 *       <td className="px-4 py-2">
 *         <Badge variant={limit.active ? 'success' : 'secondary'}>
 *           {limit.active ? 'Active' : 'Inactive'}
 *         </Badge>
 *       </td>
 *     </tr>
 *   );
 * }
 * ```
 */
export interface LimitTableRowData {
  /** Unique limit identifier for database operations and routing */
  id: number;
  
  /** Human-readable limit name displayed in table cells */
  name: string;
  
  /** Limit type category as string for display purposes */
  limitType: string;
  
  /** Rate limit value as formatted string for table presentation */
  limitRate: string;
  
  /** Counter identifier or description for tracking purposes */
  limitCounter: string;
  
  /** Associated user ID for user-specific limits (null if not applicable) */
  user: number | null;
  
  /** Associated service ID for service-specific limits (null if not applicable) */
  service: number | null;
  
  /** Associated role ID for role-specific limits (null if not applicable) */
  role: number | null;
  
  /** Limit activation status for UI state management */
  active: boolean;
}

// =============================================================================
// PAYLOAD TYPES FOR API OPERATIONS
// =============================================================================

/**
 * Payload interface for creating new rate limits.
 * 
 * Used with React Hook Form for limit creation workflows and API mutations.
 * Excludes auto-generated fields like ID and timestamps while including
 * cache initialization data for immediate rate limit enforcement.
 * 
 * @interface CreateLimitPayload
 * @example
 * ```tsx
 * // React Hook Form with limit creation
 * function CreateLimitForm() {
 *   const { register, handleSubmit, watch } = useForm<CreateLimitPayload>();
 *   
 *   const createLimitMutation = useMutation({
 *     mutationFn: (data: CreateLimitPayload) => createLimit(data),
 *     onSuccess: () => {
 *       queryClient.invalidateQueries(['limits']);
 *       toast.success('Rate limit created successfully');
 *     }
 *   });
 * 
 *   const limitType = watch('type');
 * 
 *   return (
 *     <form onSubmit={handleSubmit(createLimitMutation.mutate)}>
 *       <input {...register('name', { required: 'Name is required' })} />
 *       <textarea {...register('description')} />
 *       
 *       <select {...register('type', { required: 'Type is required' })}>
 *         <option value="api">API Limit</option>
 *         <option value="user">User Limit</option>
 *         <option value="role">Role Limit</option>
 *         <option value="service">Service Limit</option>
 *         <option value="endpoint">Endpoint Limit</option>
 *       </select>
 * 
 *       {limitType === 'user' && (
 *         <select {...register('userId')}>
 *           {users.map(user => (
 *             <option key={user.id} value={user.id}>{user.name}</option>
 *           ))}
 *         </select>
 *       )}
 * 
 *       <input 
 *         type="number" 
 *         {...register('rate', { required: 'Rate is required' })} 
 *         placeholder="Rate limit"
 *       />
 *       
 *       <select {...register('period')}>
 *         <option value="minute">Per Minute</option>
 *         <option value="hour">Per Hour</option>
 *         <option value="day">Per Day</option>
 *       </select>
 *       
 *       <input type="checkbox" {...register('isActive')} />
 *     </form>
 *   );
 * }
 * ```
 */
export interface CreateLimitPayload {
  /** Initial cache configuration data for rate limit tracking setup */
  cacheData: object;
  
  /** Descriptive text explaining the purpose and scope of the rate limit */
  description: string | null;
  
  /** Specific endpoint path for endpoint-type limits */
  endpoint: string | null;
  
  /** Initial activation status for the new rate limit */
  isActive: boolean;
  
  /** Unique name identifier for the rate limit */
  name: string;
  
  /** Time period for the rate limit window */
  period: LimitPeriod;
  
  /** Rate limit value as string for form compatibility */
  rate: string;
  
  /** Role ID for role-based limits */
  roleId: number | null;
  
  /** Service ID for service-based limits */
  serviceId: number | null;
  
  /** Limit type category */
  type: LimitTypeCategory;
  
  /** User ID for user-based limits */
  userId: number | null;
  
  /** HTTP verb restriction for endpoint limits */
  verb: LimitVerb | null;
}

/**
 * Payload interface for updating existing rate limits.
 * 
 * Extends CreateLimitPayload with required ID and audit fields while
 * excluding cache data (managed separately) and converting rate to number.
 * Used with React Hook Form for limit editing workflows and API mutations.
 * 
 * @interface UpdateLimitPayload
 * @example
 * ```tsx
 * // React Hook Form with limit updates
 * function UpdateLimitForm({ existingLimit }: { existingLimit: LimitType }) {
 *   const { register, handleSubmit, formState: { errors } } = useForm<UpdateLimitPayload>({
 *     defaultValues: {
 *       id: existingLimit.id,
 *       name: existingLimit.name,
 *       description: existingLimit.description,
 *       rate: existingLimit.rate,
 *       period: existingLimit.period,
 *       isActive: existingLimit.isActive,
 *       type: existingLimit.type,
 *       // ... other fields
 *     }
 *   });
 *   
 *   const updateLimitMutation = useMutation({
 *     mutationFn: (data: UpdateLimitPayload) => updateLimit(data),
 *     onSuccess: () => {
 *       queryClient.invalidateQueries(['limits']);
 *       queryClient.invalidateQueries(['limit', existingLimit.id]);
 *     }
 *   });
 * 
 *   return (
 *     <form onSubmit={handleSubmit(updateLimitMutation.mutate)}>
 *       <input {...register('name')} />
 *       <textarea {...register('description')} />
 *       <input type="number" {...register('rate')} />
 *       <select {...register('period')}>
 *         <option value="minute">Per Minute</option>
 *         <option value="hour">Per Hour</option>
 *         <option value="day">Per Day</option>
 *       </select>
 *       <input type="checkbox" {...register('isActive')} />
 *     </form>
 *   );
 * }
 * ```
 */
export interface UpdateLimitPayload extends Omit<CreateLimitPayload, 'cacheData' | 'rate'> {
  /** Unique identifier of the limit being updated */
  id: number;
  
  /** Original creation timestamp (preserved for audit trail) */
  createdDate: string;
  
  /** Last modification timestamp (updated by backend) */
  lastModifiedDate: string;
  
  /** Rate limit value as number for precise calculations */
  rate: number;
}

// =============================================================================
// REACT COMPONENT INTEGRATION TYPES
// =============================================================================

/**
 * Union type for limit-related operations supporting both display and full data scenarios.
 * Useful for React components that may receive either simplified or complete limit data.
 * 
 * @example
 * ```tsx
 * function LimitComponent({ limit }: { limit: AnyLimit }) {
 *   // Type guard for full limit data
 *   if ('createdDate' in limit) {
 *     return <DetailedLimitView limit={limit} />;
 *   }
 *   return <SimpleLimitView limit={limit} />;
 * }
 * ```
 */
export type AnyLimit = LimitTableRowData | LimitType;

/**
 * React component props interface for limit-related components.
 * Provides type safety for limit prop passing and component composition.
 * 
 * @interface LimitComponentProps
 * @example
 * ```tsx
 * const LimitCard: React.FC<LimitComponentProps> = ({ 
 *   limit, 
 *   onEdit, 
 *   onDelete, 
 *   onToggleActive,
 *   readonly = false 
 * }) => (
 *   <Card className={readonly ? 'opacity-75' : ''}>
 *     <CardHeader>
 *       <CardTitle className="flex items-center justify-between">
 *         {limit.name}
 *         <Badge variant={isLimitType(limit) && limit.isActive ? 'success' : 'secondary'}>
 *           {isLimitType(limit) ? (limit.isActive ? 'Active' : 'Inactive') : 
 *            (limit.active ? 'Active' : 'Inactive')}
 *         </Badge>
 *       </CardTitle>
 *     </CardHeader>
 *     <CardContent>
 *       <p className="text-sm text-gray-600">
 *         {isLimitType(limit) ? limit.description : `Type: ${limit.limitType}`}
 *       </p>
 *       {isLimitType(limit) && (
 *         <p className="text-sm">
 *           Rate: {limit.rate} per {limit.period}
 *         </p>
 *       )}
 *     </CardContent>
 *     {!readonly && (
 *       <CardActions>
 *         <Button onClick={() => onEdit?.(limit)}>Edit</Button>
 *         <Button 
 *           variant="outline" 
 *           onClick={() => onToggleActive?.(limit.id, !isLimitActive(limit))}
 *         >
 *           {isLimitActive(limit) ? 'Deactivate' : 'Activate'}
 *         </Button>
 *         <Button variant="destructive" onClick={() => onDelete?.(limit.id)}>
 *           Delete
 *         </Button>
 *       </CardActions>
 *     )}
 *   </Card>
 * );
 * ```
 */
export interface LimitComponentProps {
  /** Limit data for display and operations */
  limit: AnyLimit;
  
  /** Optional edit handler for limit modification workflows */
  onEdit?: (limit: AnyLimit) => void;
  
  /** Optional delete handler for limit removal operations */
  onDelete?: (limitId: number) => void;
  
  /** Optional toggle handler for activating/deactivating limits */
  onToggleActive?: (limitId: number, isActive: boolean) => void;
  
  /** Optional selection handler for multi-limit operations */
  onSelect?: (limitId: number, selected: boolean) => void;
  
  /** Optional flag for read-only display mode */
  readonly?: boolean;
  
  /** Optional CSS classes for component styling */
  className?: string;
  
  /** Optional variant for different display styles */
  variant?: 'card' | 'row' | 'compact';
}

/**
 * Limit configuration hook interface for React Hook Form integration.
 * Provides comprehensive form state management for limit creation and editing.
 * 
 * @interface LimitFormHook
 * @example
 * ```tsx
 * function useLimitForm(initialLimit?: LimitType): LimitFormHook {
 *   const { register, handleSubmit, watch, formState, setValue, reset } = useForm<CreateLimitPayload | UpdateLimitPayload>({
 *     defaultValues: initialLimit ? transformLimitToPayload(initialLimit) : getDefaultLimitPayload()
 *   });
 * 
 *   const [isSubmitting, setIsSubmitting] = useState(false);
 *   const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({});
 * 
 *   const submitForm = async (data: CreateLimitPayload | UpdateLimitPayload) => {
 *     setIsSubmitting(true);
 *     try {
 *       if ('id' in data) {
 *         await updateLimit(data);
 *       } else {
 *         await createLimit(data);
 *       }
 *       setSubmitErrors({});
 *     } catch (error) {
 *       setSubmitErrors({ submit: error.message });
 *     } finally {
 *       setIsSubmitting(false);
 *     }
 *   };
 * 
 *   return {
 *     register,
 *     handleSubmit,
 *     watch,
 *     formState,
 *     isSubmitting,
 *     submitForm,
 *     errors: { ...formState.errors, ...submitErrors },
 *     setValue,
 *     reset
 *   };
 * }
 * ```
 */
export interface LimitFormHook {
  /** React Hook Form register function for form field binding */
  register: any;
  
  /** React Hook Form handleSubmit function for form submission */
  handleSubmit: any;
  
  /** React Hook Form watch function for reactive field monitoring */
  watch: any;
  
  /** React Hook Form state including validation errors and submission status */
  formState: any;
  
  /** Loading state for form submission operations */
  isSubmitting: boolean;
  
  /** Function to submit form data with error handling */
  submitForm: (data: CreateLimitPayload | UpdateLimitPayload) => Promise<void>;
  
  /** Combined validation and submission errors */
  errors: Record<string, string>;
  
  /** Function to programmatically set field values */
  setValue: any;
  
  /** Function to reset form to initial state */
  reset: any;
}

/**
 * Limit list management hook interface for data fetching and operations.
 * Integrates with SWR/React Query for optimal data synchronization.
 * 
 * @interface LimitListHook
 * @example
 * ```tsx
 * function useLimitList(filters?: LimitFilters): LimitListHook {
 *   const { data, error, mutate } = useSWR(
 *     ['limits', filters],
 *     () => fetchLimits(filters)
 *   );
 * 
 *   const deleteLimitMutation = useMutation({
 *     mutationFn: deleteLimit,
 *     onSuccess: () => mutate()
 *   });
 * 
 *   const toggleLimitMutation = useMutation({
 *     mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
 *       updateLimit({ id, isActive }),
 *     onSuccess: () => mutate()
 *   });
 * 
 *   return {
 *     limits: data?.limits || [],
 *     isLoading: !data && !error,
 *     error,
 *     refetch: () => mutate(),
 *     deleteLimit: deleteLimitMutation.mutate,
 *     toggleLimit: toggleLimitMutation.mutate,
 *     isDeleting: deleteLimitMutation.isLoading,
 *     isToggling: toggleLimitMutation.isLoading
 *   };
 * }
 * ```
 */
export interface LimitListHook {
  /** Array of limit table row data for display */
  limits: LimitTableRowData[];
  
  /** Loading state for initial data fetch */
  isLoading: boolean;
  
  /** Error state for failed data operations */
  error: Error | null;
  
  /** Function to manually refetch limit data */
  refetch: () => Promise<void>;
  
  /** Function to delete a limit by ID */
  deleteLimit: (id: number) => Promise<void>;
  
  /** Function to toggle limit active status */
  toggleLimit: (id: number, isActive: boolean) => Promise<void>;
  
  /** Loading state for delete operations */
  isDeleting: boolean;
  
  /** Loading state for toggle operations */
  isToggling: boolean;
}

// =============================================================================
// UTILITY TYPES AND HELPERS
// =============================================================================

/**
 * Filter configuration for limit list queries.
 * Used with React Hook Form for search and filtering interfaces.
 */
export interface LimitFilters {
  /** Text search across limit names and descriptions */
  search?: string;
  
  /** Filter by limit type category */
  type?: LimitTypeCategory;
  
  /** Filter by active status */
  isActive?: boolean;
  
  /** Filter by associated user ID */
  userId?: number;
  
  /** Filter by associated role ID */
  roleId?: number;
  
  /** Filter by associated service ID */
  serviceId?: number;
  
  /** Pagination offset */
  offset?: number;
  
  /** Pagination limit */
  limit?: number;
  
  /** Sort field */
  sortBy?: 'name' | 'type' | 'rate' | 'createdDate' | 'lastModifiedDate';
  
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Type guard to check if a limit object is a complete LimitType.
 * Useful for React components that handle both LimitTableRowData and LimitType.
 * 
 * @param limit - Limit object to check
 * @returns True if limit is LimitType, false if LimitTableRowData
 * 
 * @example
 * ```tsx
 * function LimitDisplay({ limit }: { limit: AnyLimit }) {
 *   if (isLimitType(limit)) {
 *     return (
 *       <div>
 *         <h3>{limit.name}</h3>
 *         <p>{limit.description}</p>
 *         <p>Rate: {limit.rate} per {limit.period}</p>
 *         <p>Created: {new Date(limit.createdDate).toLocaleDateString()}</p>
 *         <p>Modified: {new Date(limit.lastModifiedDate).toLocaleDateString()}</p>
 *       </div>
 *     );
 *   }
 *   
 *   return (
 *     <div>
 *       <h3>{limit.name}</h3>
 *       <p>Type: {limit.limitType}</p>
 *       <p>Rate: {limit.limitRate}</p>
 *       <p>Status: {limit.active ? 'Active' : 'Inactive'}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const isLimitType = (limit: AnyLimit): limit is LimitType => {
  return 'createdDate' in limit && 'lastModifiedDate' in limit && 'rate' in limit;
};

/**
 * Helper function to extract active status from any limit type.
 * Provides consistent access to activation state across different limit interfaces.
 * 
 * @param limit - Limit object of any type
 * @returns Boolean active status
 */
export const isLimitActive = (limit: AnyLimit): boolean => {
  return isLimitType(limit) ? limit.isActive : limit.active;
};

/**
 * Utility function for transforming LimitType to LimitTableRowData for table display.
 * Maintains consistency with original Angular component mapping patterns.
 * 
 * @param limit - Complete limit entity from API
 * @returns Simplified limit data optimized for table display
 * 
 * @example
 * ```tsx
 * const mapLimitTypeToRow: LimitMapper = (limit: LimitType): LimitTableRowData => ({
 *   id: limit.id,
 *   name: limit.name,
 *   limitType: limit.type,
 *   limitRate: `${limit.rate} per ${limit.period}`,
 *   limitCounter: limit.keyText || 'N/A',
 *   user: limit.userId,
 *   service: limit.serviceId,
 *   role: limit.roleId,
 *   active: limit.isActive,
 * });
 * ```
 */
export type LimitMapper = (limit: LimitType) => LimitTableRowData;

/**
 * Default limit mapper function implementation.
 * Provides consistent data transformation between LimitType and LimitTableRowData interfaces.
 * Maintains backward compatibility with Angular component patterns.
 * 
 * @param limit - Complete limit entity from DreamFactory API
 * @returns Simplified limit data optimized for table display
 */
export const mapLimitTypeToRow: LimitMapper = (limit: LimitType): LimitTableRowData => ({
  id: limit.id,
  name: limit.name,
  limitType: limit.type,
  limitRate: `${limit.rate} per ${limit.period}`,
  limitCounter: limit.keyText || `${limit.name}_${limit.type}`,
  user: limit.userId,
  service: limit.serviceId,
  role: limit.roleId,
  active: limit.isActive,
});

/**
 * Utility function to get default values for limit creation forms.
 * Provides sensible defaults for React Hook Form initialization.
 * 
 * @param type - Optional limit type to set specific defaults
 * @returns Default limit payload for form initialization
 */
export function getDefaultLimitPayload(type?: LimitTypeCategory): Partial<CreateLimitPayload> {
  return {
    cacheData: {},
    description: '',
    endpoint: null,
    isActive: true,
    name: '',
    period: 'hour',
    rate: '100',
    roleId: null,
    serviceId: null,
    type: type || 'api',
    userId: null,
    verb: null,
  };
}

/**
 * Utility function to transform LimitType to UpdateLimitPayload.
 * Used for populating edit forms with existing limit data.
 * 
 * @param limit - Existing limit entity
 * @returns Update payload for form initialization
 */
export function transformLimitToUpdatePayload(limit: LimitType): UpdateLimitPayload {
  return {
    id: limit.id,
    createdDate: limit.createdDate,
    lastModifiedDate: limit.lastModifiedDate,
    description: limit.description,
    endpoint: limit.endpoint,
    isActive: limit.isActive,
    name: limit.name,
    period: limit.period,
    rate: limit.rate,
    roleId: limit.roleId,
    serviceId: limit.serviceId,
    type: limit.type,
    userId: limit.userId,
    verb: limit.verb,
  };
}

/**
 * Limit type metadata for UI display and form options.
 * Provides human-readable labels and descriptions for limit types.
 */
export const LimitTypeMetadata = {
  api: { 
    label: 'API Limit', 
    description: 'Global API rate limiting across all endpoints',
    icon: '🌐',
    color: 'blue'
  },
  user: { 
    label: 'User Limit', 
    description: 'Rate limiting specific to individual users',
    icon: '👤',
    color: 'green'
  },
  role: { 
    label: 'Role Limit', 
    description: 'Rate limiting applied to user roles',
    icon: '🛡️',
    color: 'purple'
  },
  service: { 
    label: 'Service Limit', 
    description: 'Rate limiting for specific database services',
    icon: '🔧',
    color: 'orange'
  },
  endpoint: { 
    label: 'Endpoint Limit', 
    description: 'Rate limiting for specific API endpoints',
    icon: '🎯',
    color: 'red'
  },
  global: { 
    label: 'Global Limit', 
    description: 'System-wide rate limiting configuration',
    icon: '🌍',
    color: 'gray'
  },
} as const;

/**
 * Period metadata for time window configuration.
 * Provides display labels and duration information for rate limit periods.
 */
export const PeriodMetadata = {
  minute: { label: 'Per Minute', seconds: 60, shortLabel: '/min' },
  hour: { label: 'Per Hour', seconds: 3600, shortLabel: '/hr' },
  day: { label: 'Per Day', seconds: 86400, shortLabel: '/day' },
  '7-day': { label: 'Per Week', seconds: 604800, shortLabel: '/week' },
  '30-day': { label: 'Per Month', seconds: 2592000, shortLabel: '/month' },
} as const;

/**
 * Export all types for convenient importing
 */
export type {
  // Core types
  LimitTypeCategory,
  LimitPeriod,
  LimitVerb,
  
  // Cache and tracking
  CacheLimitType,
  
  // Main entity
  LimitType,
  LimitTableRowData,
  
  // Payload types
  CreateLimitPayload,
  UpdateLimitPayload,
  
  // Component integration
  AnyLimit,
  LimitComponentProps,
  LimitFormHook,
  LimitListHook,
  LimitFilters,
  
  // Utility types
  LimitMapper,
};