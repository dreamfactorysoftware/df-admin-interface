/**
 * Role data interfaces maintaining full compatibility while supporting React component patterns.
 * 
 * These types preserve the exact API contracts from the original Angular implementation
 * while providing enhanced TypeScript support for React Query patterns, React Hook Form
 * integration, and component composition used throughout the modernized Next.js application.
 * 
 * @module RoleTypes
 * @version 1.0.0
 * @since Next.js 15.1 / React 19 migration
 */

/**
 * Simplified role interface for table display and basic operations.
 * 
 * Used primarily in role management tables and listing components where only
 * essential role information is needed. Optimized for React table components
 * with TanStack Virtual and provides clean data transformation patterns.
 * 
 * @interface RoleRow
 * @example
 * ```tsx
 * // React component usage with role table
 * function RoleTableRow({ role }: { role: RoleRow }) {
 *   return (
 *     <tr className="border-b hover:bg-gray-50">
 *       <td className="px-4 py-2">{role.name}</td>
 *       <td className="px-4 py-2">{role.description}</td>
 *       <td className="px-4 py-2">
 *         <Badge variant={role.active ? 'success' : 'secondary'}>
 *           {role.active ? 'Active' : 'Inactive'}
 *         </Badge>
 *       </td>
 *     </tr>
 *   );
 * }
 * ```
 */
export interface RoleRow {
  /** Unique role identifier for database operations and routing */
  id: number;
  
  /** Human-readable role name displayed in UI components */
  name: string;
  
  /** Optional role description for user understanding and documentation */
  description: string;
  
  /** Role activation status for access control and UI state management */
  active: boolean;
}

/**
 * Complete role entity interface with full audit trail and metadata.
 * 
 * Represents the complete role object as returned from DreamFactory API endpoints.
 * Used in role creation/editing forms, detailed views, and comprehensive role
 * management workflows. Fully compatible with React Hook Form validation
 * and React Query mutations for CRUD operations.
 * 
 * @interface RoleType
 * @example
 * ```tsx
 * // React Hook Form integration example
 * function RoleEditForm({ role }: { role: RoleType }) {
 *   const { register, handleSubmit, formState: { errors } } = useForm<RoleType>({
 *     defaultValues: role,
 *     resolver: zodResolver(roleSchema)
 *   });
 * 
 *   const updateRoleMutation = useMutation({
 *     mutationFn: updateRole,
 *     onSuccess: () => queryClient.invalidateQueries(['roles'])
 *   });
 * 
 *   return (
 *     <form onSubmit={handleSubmit(updateRoleMutation.mutate)}>
 *       <input {...register('name')} />
 *       <textarea {...register('description')} />
 *       <input type="checkbox" {...register('isActive')} />
 *     </form>
 *   );
 * }
 * ```
 */
export interface RoleType {
  /** Role description for comprehensive documentation and user guidance */
  description: string;
  
  /** Unique role identifier matching database primary key */
  id: number;
  
  /** Role activation status - matches 'active' field in RoleRow for consistency */
  isActive: boolean;
  
  /** ID of user who created this role for audit trail tracking */
  createdById: number;
  
  /** ISO 8601 creation timestamp for audit and sorting purposes */
  createdDate: string;
  
  /** ID of user who last modified this role for change tracking */
  lastModifiedById: number;
  
  /** ISO 8601 last modification timestamp for audit purposes */
  lastModifiedDate: string;
  
  /** Array of role IDs for hierarchical role relationships and inheritance */
  lookupByRoleId: number[];
  
  /** Role name matching the simplified RoleRow interface for consistency */
  name: string;
  
  /** 
   * Optional array of accessible tab/route identifiers for frontend navigation control.
   * Used by React Router and Next.js routing for role-based access control (RBAC).
   * 
   * @example ['dashboard', 'users', 'services', 'schema', 'api-docs']
   */
  accessibleTabs?: Array<string>;
}

/**
 * Type union for role-related operations supporting both display and full data scenarios.
 * Useful for React components that may receive either simplified or complete role data.
 * 
 * @example
 * ```tsx
 * function RoleComponent({ role }: { role: AnyRole }) {
 *   // Type guard for full role data
 *   if ('createdDate' in role) {
 *     return <DetailedRoleView role={role} />;
 *   }
 *   return <SimpleRoleView role={role} />;
 * }
 * ```
 */
export type AnyRole = RoleRow | RoleType;

/**
 * Type for role data transformation between API and display formats.
 * Used in React Query select functions and data mapping utilities.
 * 
 * @example
 * ```tsx
 * // React Query with data transformation
 * const { data: displayRoles } = useQuery({
 *   queryKey: ['roles'],
 *   queryFn: fetchRoles,
 *   select: (data: RoleType[]): RoleRow[] => 
 *     data.map(mapRoleTypeToRow)
 * });
 * ```
 */
export type RoleDataTransform<T extends AnyRole = RoleType> = T extends RoleType
  ? (role: RoleType) => RoleRow
  : (role: RoleRow) => RoleRow;

/**
 * Partial role interface for form submissions and updates.
 * Excludes read-only fields like ID and audit timestamps.
 * Optimized for React Hook Form and form validation scenarios.
 * 
 * @example
 * ```tsx
 * function CreateRoleForm() {
 *   const { register, handleSubmit } = useForm<RoleFormData>();
 *   
 *   const createMutation = useMutation({
 *     mutationFn: (data: RoleFormData) => createRole(data)
 *   });
 * 
 *   return (
 *     <form onSubmit={handleSubmit(createMutation.mutate)}>
 *       <input {...register('name', { required: true })} />
 *       <textarea {...register('description')} />
 *       <input type="checkbox" {...register('isActive')} />
 *     </form>
 *   );
 * }
 * ```
 */
export type RoleFormData = Omit<
  RoleType,
  'id' | 'createdById' | 'createdDate' | 'lastModifiedById' | 'lastModifiedDate'
>;

/**
 * Utility function type for transforming RoleType to RoleRow for table display.
 * Maintains consistency with original Angular component mapping patterns.
 * 
 * @param role - Complete role entity from API
 * @returns Simplified role data for table display
 * 
 * @example
 * ```tsx
 * const mapRoleTypeToRow: RoleMapper = (role: RoleType): RoleRow => ({
 *   id: role.id,
 *   name: role.name,
 *   description: role.description || '',
 *   active: role.isActive,
 * });
 * ```
 */
export type RoleMapper = (role: RoleType) => RoleRow;

/**
 * React component props interface for role-related components.
 * Provides type safety for role prop passing and component composition.
 * 
 * @example
 * ```tsx
 * const RoleCard: React.FC<RoleComponentProps> = ({ role, onEdit, onDelete }) => (
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>{role.name}</CardTitle>
 *     </CardHeader>
 *     <CardContent>
 *       <p>{role.description}</p>
 *     </CardContent>
 *     <CardActions>
 *       <Button onClick={() => onEdit?.(role)}>Edit</Button>
 *       <Button variant="destructive" onClick={() => onDelete?.(role.id)}>
 *         Delete
 *       </Button>
 *     </CardActions>
 *   </Card>
 * );
 * ```
 */
export interface RoleComponentProps {
  /** Role data for display and operations */
  role: AnyRole;
  
  /** Optional edit handler for role modification workflows */
  onEdit?: (role: AnyRole) => void;
  
  /** Optional delete handler for role removal operations */
  onDelete?: (roleId: number) => void;
  
  /** Optional selection handler for multi-role operations */
  onSelect?: (roleId: number, selected: boolean) => void;
  
  /** Optional flag for read-only display mode */
  readonly?: boolean;
  
  /** Optional CSS classes for component styling */
  className?: string;
}

/**
 * Role permissions interface for RBAC implementation.
 * Extends role data with permission checking capabilities for React components.
 * 
 * @example
 * ```tsx
 * function ProtectedComponent({ userRoles }: { userRoles: RolePermissions[] }) {
 *   const canManageUsers = userRoles.some(role => 
 *     role.permissions.includes('users.manage')
 *   );
 * 
 *   if (!canManageUsers) {
 *     return <AccessDenied />;
 *   }
 * 
 *   return <UserManagementPanel />;
 * }
 * ```
 */
export interface RolePermissions extends RoleType {
  /** Array of permission strings for granular access control */
  permissions: string[];
  
  /** Inherited permissions from parent roles */
  inheritedPermissions?: string[];
  
  /** Effective permissions combining direct and inherited permissions */
  effectivePermissions?: string[];
}

/**
 * Default role mapper function implementation.
 * Provides consistent data transformation between RoleType and RoleRow interfaces.
 * Maintains backward compatibility with Angular component patterns.
 * 
 * @param role - Complete role entity from DreamFactory API
 * @returns Simplified role data optimized for table display
 */
export const mapRoleTypeToRow: RoleMapper = (role: RoleType): RoleRow => ({
  id: role.id,
  name: role.name,
  description: role.description || '',
  active: role.isActive,
});

/**
 * Type guard to check if a role object is a complete RoleType.
 * Useful for React components that handle both RoleRow and RoleType.
 * 
 * @param role - Role object to check
 * @returns True if role is RoleType, false if RoleRow
 * 
 * @example
 * ```tsx
 * function RoleDisplay({ role }: { role: AnyRole }) {
 *   if (isRoleType(role)) {
 *     return (
 *       <div>
 *         <h3>{role.name}</h3>
 *         <p>Created: {new Date(role.createdDate).toLocaleDateString()}</p>
 *         <p>Modified: {new Date(role.lastModifiedDate).toLocaleDateString()}</p>
 *       </div>
 *     );
 *   }
 *   
 *   return (
 *     <div>
 *       <h3>{role.name}</h3>
 *       <p>{role.description}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const isRoleType = (role: AnyRole): role is RoleType => {
  return 'createdDate' in role && 'lastModifiedDate' in role;
};

/**
 * Utility type for React Query operations on role data.
 * Provides type safety for query keys, mutation functions, and cache operations.
 */
export type RoleQueryOperations = {
  /** Query key factory for role-related queries */
  queryKey: (params?: { id?: number; active?: boolean }) => string[];
  
  /** Mutation function type for role creation */
  createRole: (data: RoleFormData) => Promise<RoleType>;
  
  /** Mutation function type for role updates */
  updateRole: (id: number, data: Partial<RoleFormData>) => Promise<RoleType>;
  
  /** Mutation function type for role deletion */
  deleteRole: (id: number) => Promise<void>;
  
  /** Query function type for role listing with pagination */
  getRoles: (params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
  }) => Promise<{ resource: RoleType[]; meta: { count: number } }>;
};