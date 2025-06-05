/**
 * Application data interfaces maintaining full compatibility while supporting React component patterns.
 * 
 * These types preserve the exact API contracts from the original Angular implementation
 * while providing enhanced TypeScript support for React Query patterns, React Hook Form
 * integration, and component composition used throughout the modernized Next.js application.
 * 
 * Application types support multiple deployment strategies:
 * - Type 0: No application specified
 * - Type 1: File/Storage-based applications with configurable storage services
 * - Type 2: Remote URL-based applications with external hosting
 * - Type 3: Path-based applications with custom routing
 * 
 * @module AppTypes
 * @version 1.0.0
 * @since Next.js 15.1 / React 19 migration
 */

import { RoleType } from './role';

/**
 * Simplified application interface for table display and basic operations.
 * 
 * Used primarily in application management tables and listing components where only
 * essential application information is needed. Optimized for React table components
 * with TanStack Virtual and provides clean data transformation patterns.
 * 
 * @interface AppRow
 * @example
 * ```tsx
 * // React component usage with application table
 * function AppTableRow({ app }: { app: AppRow }) {
 *   return (
 *     <tr className="border-b hover:bg-gray-50">
 *       <td className="px-4 py-2">{app.name}</td>
 *       <td className="px-4 py-2">{app.role}</td>
 *       <td className="px-4 py-2">
 *         <Badge variant={app.active ? 'success' : 'secondary'}>
 *           {app.active ? 'Active' : 'Inactive'}
 *         </Badge>
 *       </td>
 *       <td className="px-4 py-2">
 *         <Button 
 *           variant="ghost" 
 *           size="sm"
 *           onClick={() => window.open(app.launchUrl, '_blank')}
 *         >
 *           Launch
 *         </Button>
 *       </td>
 *     </tr>
 *   );
 * }
 * ```
 */
export interface AppRow {
  /** Unique application identifier for database operations and routing */
  id: number;
  
  /** Human-readable application name displayed in UI components */
  name: string;
  
  /** Associated role name for access control display */
  role: string;
  
  /** API key for application authentication and API access */
  apiKey: string;
  
  /** Optional application description for user understanding and documentation */
  description?: string;
  
  /** Application activation status for access control and UI state management */
  active: boolean;
  
  /** Launch URL for application access and navigation */
  launchUrl: string;
  
  /** ID of user who created this application for audit trail tracking */
  createdById: number;
}

/**
 * Complete application entity interface with full audit trail and metadata.
 * 
 * Represents the complete application object as returned from DreamFactory API endpoints.
 * Used in application creation/editing forms, detailed views, and comprehensive application
 * management workflows. Fully compatible with React Hook Form validation
 * and React Query mutations for CRUD operations.
 * 
 * @interface AppType
 * @example
 * ```tsx
 * // React Hook Form integration example
 * function AppEditForm({ app }: { app: AppType }) {
 *   const { register, handleSubmit, watch, formState: { errors } } = useForm<AppType>({
 *     defaultValues: app,
 *     resolver: zodResolver(appSchema)
 *   });
 * 
 *   const appType = watch('type');
 *   const updateAppMutation = useMutation({
 *     mutationFn: updateApp,
 *     onSuccess: () => queryClient.invalidateQueries(['apps'])
 *   });
 * 
 *   return (
 *     <form onSubmit={handleSubmit(updateAppMutation.mutate)}>
 *       <input {...register('name')} />
 *       <textarea {...register('description')} />
 *       
 *       {appType === 1 && (
 *         <>
 *           <input {...register('storageServiceId')} />
 *           <input {...register('storageContainer')} />
 *           <input {...register('path')} />
 *         </>
 *       )}
 *       
 *       {appType === 2 && (
 *         <input {...register('url')} />
 *       )}
 *       
 *       <input type="checkbox" {...register('isActive')} />
 *     </form>
 *   );
 * }
 * ```
 */
export interface AppType {
  /** Unique application identifier matching database primary key */
  id: number;
  
  /** Application name matching the simplified AppRow interface for consistency */
  name: string;
  
  /** API key for application authentication and API access */
  apiKey: string;
  
  /** Application description for comprehensive documentation and user guidance */
  description: string;
  
  /** Application activation status - matches 'active' field in AppRow for consistency */
  isActive: boolean;
  
  /** 
   * Application type determining deployment and access strategy:
   * - 0: No application specified (placeholder/disabled)
   * - 1: File/Storage-based application (requires storage configuration)
   * - 2: Remote URL-based application (requires external URL)
   * - 3: Path-based application (requires custom path routing)
   */
  type: number;
  
  /** 
   * Optional path for file-based (type 1) and path-based (type 3) applications.
   * Used for routing and file system access patterns.
   */
  path?: string;
  
  /** 
   * Optional URL for remote applications (type 2).
   * Must be a valid HTTP/HTTPS URL for external application hosting.
   */
  url?: string;
  
  /** 
   * Optional storage service ID for file-based applications (type 1).
   * References the DreamFactory storage service configuration.
   * Common values: 3 (file service), 4 (log service)
   */
  storageServiceId?: number;
  
  /** 
   * Optional storage container for file-based applications (type 1).
   * Defines the container/directory within the storage service.
   * Default: 'applications'
   */
  storageContainer?: string;
  
  /** Flag indicating if application requires fullscreen display mode */
  requiresFullscreen: boolean;
  
  /** Flag indicating if fullscreen toggle controls are available to users */
  allowFullscreenToggle: boolean;
  
  /** UI location for fullscreen toggle controls (e.g., 'header', 'sidebar') */
  toggleLocation: string;
  
  /** Optional role ID for default application access control */
  roleId?: number;
  
  /** ISO 8601 creation timestamp for audit and sorting purposes */
  createdDate: string;
  
  /** ISO 8601 last modification timestamp for audit purposes */
  lastModifiedDate: string;
  
  /** ID of user who created this application for audit trail tracking */
  createdById: number;
  
  /** ID of user who last modified this application for change tracking */
  lastModifiedById?: number;
  
  /** Launch URL for application access and navigation - matches AppRow interface */
  launchUrl: string;
  
  /** 
   * Optional complete role object for applications with role-based access control.
   * Populated when fetching applications with role relationships.
   * Used by React components for role display and permission checking.
   */
  roleByRoleId?: RoleType;
}

/**
 * Application payload interface for API create/update operations.
 * 
 * Represents the data structure required for creating or updating applications
 * through DreamFactory API endpoints. Uses snake_case naming conventions to
 * match the backend API contract exactly. Optimized for React Hook Form
 * submission and form validation scenarios.
 * 
 * @interface AppPayload
 * @example
 * ```tsx
 * // React Hook Form submission example
 * function CreateAppForm() {
 *   const { register, handleSubmit, watch } = useForm<AppPayload>();
 *   const appType = watch('type');
 *   
 *   const createMutation = useMutation({
 *     mutationFn: (data: AppPayload) => createApp(data),
 *     onSuccess: () => {
 *       queryClient.invalidateQueries(['apps']);
 *       navigate('/apps');
 *     }
 *   });
 * 
 *   return (
 *     <form onSubmit={handleSubmit(createMutation.mutate)}>
 *       <input {...register('name', { required: true })} />
 *       <textarea {...register('description')} />
 *       <select {...register('type', { required: true })}>
 *         <option value={0}>No Application</option>
 *         <option value={1}>File/Storage Based</option>
 *         <option value={2}>Remote URL</option>
 *         <option value={3}>Path Based</option>
 *       </select>
 *       
 *       {appType === 1 && (
 *         <>
 *           <input {...register('storage_service_id')} />
 *           <input {...register('storage_container')} />
 *           <input {...register('path')} />
 *         </>
 *       )}
 *       
 *       {appType === 2 && (
 *         <input {...register('url')} />
 *       )}
 *       
 *       {appType === 3 && (
 *         <input {...register('path')} />
 *       )}
 *       
 *       <input type="checkbox" {...register('is_active')} />
 *     </form>
 *   );
 * }
 * ```
 */
export interface AppPayload {
  /** Application name - required field for all application types */
  name: string;
  
  /** Optional application description for documentation purposes */
  description?: string;
  
  /** 
   * Application type (0=none, 1=file/storage, 2=remote URL, 3=path-based)
   * Determines required and optional fields for application configuration
   */
  type: number;
  
  /** Optional role ID for default application access control */
  role_id?: number;
  
  /** Application activation status for access control */
  is_active: boolean;
  
  /** Optional URL for remote applications (required when type === 2) */
  url?: string;
  
  /** Optional storage service ID for file-based applications (required when type === 1) */
  storage_service_id?: number;
  
  /** Optional storage container for file-based applications (required when type === 1) */
  storage_container?: string;
  
  /** Optional path for file-based and path-based applications (required when type === 1 or 3) */
  path?: string;
}

/**
 * Type union for application-related operations supporting both display and full data scenarios.
 * Useful for React components that may receive either simplified or complete application data.
 * 
 * @example
 * ```tsx
 * function AppComponent({ app }: { app: AnyApp }) {
 *   // Type guard for full application data
 *   if ('createdDate' in app) {
 *     return <DetailedAppView app={app} />;
 *   }
 *   return <SimpleAppView app={app} />;
 * }
 * ```
 */
export type AnyApp = AppRow | AppType;

/**
 * Type for application data transformation between API and display formats.
 * Used in React Query select functions and data mapping utilities.
 * 
 * @example
 * ```tsx
 * // React Query with data transformation
 * const { data: displayApps } = useQuery({
 *   queryKey: ['apps'],
 *   queryFn: fetchApps,
 *   select: (data: AppType[]): AppRow[] => 
 *     data.map(mapAppTypeToRow)
 * });
 * ```
 */
export type AppDataTransform<T extends AnyApp = AppType> = T extends AppType
  ? (app: AppType) => AppRow
  : (app: AppRow) => AppRow;

/**
 * Partial application interface for form submissions and updates.
 * Excludes read-only fields like ID and audit timestamps.
 * Optimized for React Hook Form and form validation scenarios.
 * 
 * @example
 * ```tsx
 * function EditAppForm({ app }: { app: AppType }) {
 *   const { register, handleSubmit } = useForm<AppFormData>({
 *     defaultValues: {
 *       name: app.name,
 *       description: app.description,
 *       type: app.type,
 *       isActive: app.isActive,
 *       // ... other editable fields
 *     }
 *   });
 *   
 *   const updateMutation = useMutation({
 *     mutationFn: (data: AppFormData) => updateApp(app.id, data)
 *   });
 * 
 *   return (
 *     <form onSubmit={handleSubmit(updateMutation.mutate)}>
 *       <input {...register('name', { required: true })} />
 *       <textarea {...register('description')} />
 *       <input type="checkbox" {...register('isActive')} />
 *     </form>
 *   );
 * }
 * ```
 */
export type AppFormData = Omit<
  AppType,
  'id' | 'apiKey' | 'createdDate' | 'lastModifiedDate' | 'createdById' | 'lastModifiedById' | 'launchUrl'
>;

/**
 * Utility function type for transforming AppType to AppRow for table display.
 * Maintains consistency with original Angular component mapping patterns.
 * 
 * @param app - Complete application entity from API
 * @returns Simplified application data for table display
 * 
 * @example
 * ```tsx
 * const mapAppTypeToRow: AppMapper = (app: AppType): AppRow => ({
 *   id: app.id,
 *   name: app.name,
 *   role: app.roleByRoleId?.name || 'No Role',
 *   apiKey: app.apiKey,
 *   description: app.description || '',
 *   active: app.isActive,
 *   launchUrl: app.launchUrl,
 *   createdById: app.createdById,
 * });
 * ```
 */
export type AppMapper = (app: AppType) => AppRow;

/**
 * React component props interface for application-related components.
 * Provides type safety for application prop passing and component composition.
 * 
 * @example
 * ```tsx
 * const AppCard: React.FC<AppComponentProps> = ({ 
 *   app, 
 *   onEdit, 
 *   onDelete, 
 *   onLaunch,
 *   readonly = false 
 * }) => (
 *   <Card>
 *     <CardHeader>
 *       <CardTitle className="flex items-center justify-between">
 *         {app.name}
 *         <Badge variant={app.active ? 'success' : 'secondary'}>
 *           {app.active ? 'Active' : 'Inactive'}
 *         </Badge>
 *       </CardTitle>
 *     </CardHeader>
 *     <CardContent>
 *       <p className="text-sm text-gray-600">{app.description}</p>
 *       {isAppType(app) && app.roleByRoleId && (
 *         <p className="text-xs text-gray-500 mt-2">
 *           Role: {app.roleByRoleId.name}
 *         </p>
 *       )}
 *     </CardContent>
 *     <CardActions className="flex gap-2">
 *       <Button 
 *         variant="default" 
 *         size="sm"
 *         onClick={() => onLaunch?.(app.launchUrl)}
 *       >
 *         Launch
 *       </Button>
 *       {!readonly && (
 *         <>
 *           <Button 
 *             variant="outline" 
 *             size="sm"
 *             onClick={() => onEdit?.(app)}
 *           >
 *             Edit
 *           </Button>
 *           <Button 
 *             variant="destructive" 
 *             size="sm"
 *             onClick={() => onDelete?.(app.id)}
 *           >
 *             Delete
 *           </Button>
 *         </>
 *       )}
 *     </CardActions>
 *   </Card>
 * );
 * ```
 */
export interface AppComponentProps {
  /** Application data for display and operations */
  app: AnyApp;
  
  /** Optional edit handler for application modification workflows */
  onEdit?: (app: AnyApp) => void;
  
  /** Optional delete handler for application removal operations */
  onDelete?: (appId: number) => void;
  
  /** Optional launch handler for application navigation */
  onLaunch?: (launchUrl: string) => void;
  
  /** Optional selection handler for multi-application operations */
  onSelect?: (appId: number, selected: boolean) => void;
  
  /** Optional flag for read-only display mode */
  readonly?: boolean;
  
  /** Optional CSS classes for component styling */
  className?: string;
}

/**
 * Application type enumeration for type-safe application configuration.
 * Provides clear constants for application type validation and UI logic.
 * 
 * @example
 * ```tsx
 * function AppTypeSelector({ value, onChange }: { 
 *   value: number; 
 *   onChange: (type: number) => void;
 * }) {
 *   return (
 *     <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
 *       <option value={AppTypeEnum.NONE}>No Application</option>
 *       <option value={AppTypeEnum.FILE_STORAGE}>File/Storage Based</option>
 *       <option value={AppTypeEnum.REMOTE_URL}>Remote URL</option>
 *       <option value={AppTypeEnum.PATH_BASED}>Path Based</option>
 *     </select>
 *   );
 * }
 * ```
 */
export enum AppTypeEnum {
  /** No application specified - placeholder/disabled state */
  NONE = 0,
  /** File/Storage-based application requiring storage service configuration */
  FILE_STORAGE = 1,
  /** Remote URL-based application requiring external URL */
  REMOTE_URL = 2,
  /** Path-based application requiring custom path routing */
  PATH_BASED = 3,
}

/**
 * Application configuration validation interface for React Hook Form integration.
 * Provides type-safe validation rules for different application types.
 * 
 * @example
 * ```tsx
 * function useAppValidation(appType: number): AppValidationRules {
 *   return useMemo(() => {
 *     const rules: AppValidationRules = {
 *       name: { required: 'Application name is required' },
 *       type: { required: 'Application type must be selected' },
 *       is_active: {},
 *     };
 * 
 *     if (appType === AppTypeEnum.REMOTE_URL) {
 *       rules.url = { 
 *         required: 'URL is required for remote applications',
 *         pattern: {
 *           value: /^https?:\/\/.+/,
 *           message: 'URL must be a valid HTTP/HTTPS address'
 *         }
 *       };
 *     }
 * 
 *     if (appType === AppTypeEnum.FILE_STORAGE) {
 *       rules.storage_service_id = { required: 'Storage service is required' };
 *       rules.storage_container = { required: 'Storage container is required' };
 *       rules.path = { required: 'Path is required for file-based applications' };
 *     }
 * 
 *     if (appType === AppTypeEnum.PATH_BASED) {
 *       rules.path = { required: 'Path is required for path-based applications' };
 *     }
 * 
 *     return rules;
 *   }, [appType]);
 * }
 * ```
 */
export interface AppValidationRules {
  name?: { required?: string; minLength?: { value: number; message: string } };
  description?: { maxLength?: { value: number; message: string } };
  type?: { required?: string };
  role_id?: { required?: string };
  is_active?: Record<string, never>;
  url?: { required?: string; pattern?: { value: RegExp; message: string } };
  storage_service_id?: { required?: string };
  storage_container?: { required?: string };
  path?: { required?: string; pattern?: { value: RegExp; message: string } };
}

/**
 * Default application mapper function implementation.
 * Provides consistent data transformation between AppType and AppRow interfaces.
 * Maintains backward compatibility with Angular component patterns.
 * 
 * @param app - Complete application entity from DreamFactory API
 * @returns Simplified application data optimized for table display
 */
export const mapAppTypeToRow: AppMapper = (app: AppType): AppRow => ({
  id: app.id,
  name: app.name,
  role: app.roleByRoleId?.name || 'No Role',
  apiKey: app.apiKey,
  description: app.description || '',
  active: app.isActive,
  launchUrl: app.launchUrl,
  createdById: app.createdById,
});

/**
 * Type guard to check if an application object is a complete AppType.
 * Useful for React components that handle both AppRow and AppType.
 * 
 * @param app - Application object to check
 * @returns True if app is AppType, false if AppRow
 * 
 * @example
 * ```tsx
 * function AppDisplay({ app }: { app: AnyApp }) {
 *   if (isAppType(app)) {
 *     return (
 *       <div>
 *         <h3>{app.name}</h3>
 *         <p>Type: {getAppTypeLabel(app.type)}</p>
 *         <p>Created: {new Date(app.createdDate).toLocaleDateString()}</p>
 *         <p>Modified: {new Date(app.lastModifiedDate).toLocaleDateString()}</p>
 *         {app.roleByRoleId && (
 *           <p>Role: {app.roleByRoleId.name}</p>
 *         )}
 *       </div>
 *     );
 *   }
 *   
 *   return (
 *     <div>
 *       <h3>{app.name}</h3>
 *       <p>Role: {app.role}</p>
 *       <p>Description: {app.description}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const isAppType = (app: AnyApp): app is AppType => {
  return 'createdDate' in app && 'lastModifiedDate' in app && 'type' in app;
};

/**
 * Utility function to get human-readable label for application type.
 * Useful for UI display and form options.
 * 
 * @param type - Application type number
 * @returns Human-readable type label
 * 
 * @example
 * ```tsx
 * function AppTypeDisplay({ type }: { type: number }) {
 *   return (
 *     <Badge variant="outline">
 *       {getAppTypeLabel(type)}
 *     </Badge>
 *   );
 * }
 * ```
 */
export const getAppTypeLabel = (type: number): string => {
  switch (type) {
    case AppTypeEnum.NONE:
      return 'No Application';
    case AppTypeEnum.FILE_STORAGE:
      return 'File/Storage Based';
    case AppTypeEnum.REMOTE_URL:
      return 'Remote URL';
    case AppTypeEnum.PATH_BASED:
      return 'Path Based';
    default:
      return 'Unknown Type';
  }
};

/**
 * Utility type for React Query operations on application data.
 * Provides type safety for query keys, mutation functions, and cache operations.
 */
export type AppQueryOperations = {
  /** Query key factory for application-related queries */
  queryKey: (params?: { id?: number; active?: boolean; type?: number }) => string[];
  
  /** Mutation function type for application creation */
  createApp: (data: AppPayload) => Promise<AppType>;
  
  /** Mutation function type for application updates */
  updateApp: (id: number, data: Partial<AppPayload>) => Promise<AppType>;
  
  /** Mutation function type for application deletion */
  deleteApp: (id: number) => Promise<void>;
  
  /** Mutation function type for API key regeneration */
  refreshApiKey: (id: number) => Promise<AppType>;
  
  /** Query function type for application listing with pagination and filtering */
  getApps: (params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
    type?: number;
    fields?: string;
    related?: string;
  }) => Promise<{ resource: AppType[]; meta: { count: number } }>;
};

/**
 * Application URL generation utility for different application types.
 * Maintains compatibility with original Angular URL generation logic.
 * 
 * @param app - Application data for URL generation
 * @param origin - Base URL origin (e.g., window.location.origin)
 * @returns Generated application launch URL
 * 
 * @example
 * ```tsx
 * function AppLaunchButton({ app }: { app: AppType }) {
 *   const launchUrl = useMemo(() => 
 *     generateAppUrl(app, window.location.origin), [app]);
 *   
 *   return (
 *     <Button onClick={() => window.open(launchUrl, '_blank')}>
 *       Launch Application
 *     </Button>
 *   );
 * }
 * ```
 */
export const generateAppUrl = (app: AppType, origin: string): string => {
  if (app.type === AppTypeEnum.REMOTE_URL && app.url) {
    return app.url;
  }
  
  if (app.type === AppTypeEnum.FILE_STORAGE) {
    const servicePrefix = app.storageServiceId === 3 ? 'file/' : 
                         app.storageServiceId === 4 ? 'log/' : '';
    const container = app.storageContainer || 'applications';
    const path = app.path || '';
    
    return `${origin}/${servicePrefix}${container}/${path}`.replace(/\/+/g, '/');
  }
  
  if (app.type === AppTypeEnum.PATH_BASED && app.path) {
    return `${origin}/${app.path}`.replace(/\/+/g, '/');
  }
  
  return origin;
};