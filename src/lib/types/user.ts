/**
 * User-related data structures and session management types for the DreamFactory Admin Interface.
 * 
 * These types preserve exact API contracts from the original Angular implementation while
 * providing enhanced TypeScript support for Next.js middleware authentication, React context
 * patterns, and role-based access control throughout the modernized React 19/Next.js 15.1
 * application architecture.
 * 
 * @module UserTypes
 * @version 1.0.0
 * @since Next.js 15.1 / React 19 migration
 */

import type { RoleType, RoleRow, AnyRole } from './role';

/**
 * Simplified user interface for table display and basic operations.
 * 
 * Used primarily in user management tables and listing components where only
 * essential user information is needed. Optimized for React table components
 * with virtual scrolling and provides clean data transformation patterns.
 * 
 * @interface UserRow
 * @example
 * ```tsx
 * // React component usage with user table
 * function UserTableRow({ user }: { user: UserRow }) {
 *   return (
 *     <tr className="border-b hover:bg-gray-50">
 *       <td className="px-4 py-2">{user.display_name}</td>
 *       <td className="px-4 py-2">{user.email}</td>
 *       <td className="px-4 py-2">
 *         <Badge variant={user.is_active ? 'success' : 'secondary'}>
 *           {user.is_active ? 'Active' : 'Inactive'}
 *         </Badge>
 *       </td>
 *     </tr>
 *   );
 * }
 * ```
 */
export interface UserRow {
  /** Unique user identifier for database operations and routing */
  id: number;
  
  /** User email address serving as unique login identifier */
  email: string;
  
  /** Display name shown throughout the user interface */
  display_name: string;
  
  /** User account activation status for access control and UI state management */
  is_active: boolean;
  
  /** First name for profile display and user identification */
  first_name: string;
  
  /** Last name for profile display and user identification */
  last_name: string;
  
  /** Username for alternative authentication methods */
  username?: string;
}

/**
 * Complete user entity interface with full audit trail and role associations.
 * 
 * Represents the complete user object as returned from DreamFactory user management
 * API endpoints. Used in user creation/editing forms, detailed profile views, and
 * comprehensive user management workflows. Fully compatible with React Hook Form
 * validation and React Query mutations for CRUD operations.
 * 
 * @interface UserType
 * @example
 * ```tsx
 * // React Hook Form integration example
 * function UserEditForm({ user }: { user: UserType }) {
 *   const { register, handleSubmit, formState: { errors } } = useForm<UserType>({
 *     defaultValues: user,
 *     resolver: zodResolver(userSchema)
 *   });
 * 
 *   const updateUserMutation = useMutation({
 *     mutationFn: updateUser,
 *     onSuccess: () => queryClient.invalidateQueries(['users'])
 *   });
 * 
 *   return (
 *     <form onSubmit={handleSubmit(updateUserMutation.mutate)}>
 *       <input {...register('first_name')} />
 *       <input {...register('last_name')} />
 *       <input {...register('email')} />
 *       <input type="checkbox" {...register('is_active')} />
 *     </form>
 *   );
 * }
 * ```
 */
export interface UserType {
  /** Unique user identifier matching database primary key */
  id: number;
  
  /** User email address - unique constraint for authentication */
  email: string;
  
  /** Display name shown throughout the application interface */
  display_name: string;
  
  /** User account activation status - matches 'is_active' field in UserRow */
  is_active: boolean;
  
  /** First name for profile display and personalization */
  first_name: string;
  
  /** Last name for profile display and identification */
  last_name: string;
  
  /** Optional username for alternative authentication workflows */
  username?: string;
  
  /** Phone number for contact information and two-factor authentication */
  phone?: string;
  
  /** Security question for account recovery workflows */
  security_question?: string;
  
  /** Default application assignment for post-login navigation */
  default_app_id?: number;
  
  /** 
   * Array of role associations for RBAC implementation.
   * Used by React components for permission checking and UI state management.
   * 
   * @example ['admin', 'service-manager', 'schema-editor']
   */
  user_to_app_to_role_by_user_id: RoleType[];
  
  /** ID of admin who created this user account for audit trail tracking */
  created_by_id?: number;
  
  /** ISO 8601 creation timestamp for audit and sorting purposes */
  created_date: string;
  
  /** ID of admin who last modified this user account for change tracking */
  last_modified_by_id?: number;
  
  /** ISO 8601 last modification timestamp for audit purposes */
  last_modified_date: string;
  
  /** 
   * Optional array of accessible service identifiers for user-specific access control.
   * Used by React components and Next.js middleware for service-level authorization.
   * 
   * @example ['database-prod', 'database-staging', 'email-service']
   */
  accessible_services?: string[];
  
  /** 
   * Optional profile picture URL for user avatar display in React components.
   */
  avatar_url?: string;
  
  /** 
   * Optional timezone setting for user-specific datetime display.
   */
  timezone?: string;
  
  /** 
   * Optional locale setting for internationalization support.
   */
  locale?: string;
}

/**
 * User session interface optimized for Next.js session management and React context.
 * 
 * Represents authenticated user session data stored in Next.js middleware and
 * provided to React components through authentication context. Supports JWT token
 * management, role-based access control, and automatic session refresh patterns.
 * 
 * @interface UserSession
 * @example
 * ```tsx
 * // Next.js middleware authentication
 * function AuthMiddleware({ children }: { children: React.ReactNode }) {
 *   const [session, setSession] = useState<UserSession | null>(null);
 * 
 *   useEffect(() => {
 *     // Extract session from Next.js middleware headers
 *     const sessionData = getSessionFromHeaders();
 *     setSession(sessionData);
 *   }, []);
 * 
 *   return (
 *     <SessionContext.Provider value={{ session, setSession }}>
 *       {children}
 *     </SessionContext.Provider>
 *   );
 * }
 * ```
 */
export interface UserSession {
  /** JWT session token for API authentication */
  session_token: string;
  
  /** Session expiration timestamp in ISO 8601 format */
  expires_at: string;
  
  /** Authenticated user data for application context */
  user: UserType;
  
  /** 
   * Effective user permissions derived from role associations.
   * Pre-computed for performance optimization in React components.
   */
  permissions: string[];
  
  /** 
   * Refresh token for automatic session renewal.
   * Managed by Next.js middleware for seamless authentication.
   */
  refresh_token?: string;
  
  /** 
   * Session creation timestamp for audit and security monitoring.
   */
  created_at: string;
  
  /** 
   * Last activity timestamp for session timeout management.
   */
  last_activity: string;
  
  /** 
   * Optional session metadata for analytics and debugging.
   */
  session_metadata?: {
    /** User agent string for security monitoring */
    user_agent?: string;
    /** IP address for security tracking */
    ip_address?: string;
    /** Login method (password, SSO, etc.) */
    login_method?: string;
  };
}

/**
 * Admin profile interface extending UserType with administrative capabilities.
 * 
 * Represents system administrators with enhanced permissions and audit capabilities.
 * Used in admin management workflows and role-based access control throughout
 * the React application for privileged operations.
 * 
 * @interface AdminProfile
 * @example
 * ```tsx
 * // Admin role checking in React components
 * function AdminPanel({ admin }: { admin: AdminProfile }) {
 *   const canManageUsers = admin.system_permissions.includes('users.manage');
 *   const canManageServices = admin.system_permissions.includes('services.manage');
 * 
 *   return (
 *     <div className="admin-panel">
 *       {canManageUsers && <UserManagementSection />}
 *       {canManageServices && <ServiceManagementSection />}
 *     </div>
 *   );
 * }
 * ```
 */
export interface AdminProfile extends UserType {
  /** 
   * System-level permissions for administrative operations.
   * Used by React components for UI feature gating and access control.
   */
  system_permissions: string[];
  
  /** 
   * Administrative role level for hierarchical access control.
   * @example 'super_admin' | 'system_admin' | 'service_admin'
   */
  admin_level: string;
  
  /** 
   * Flag indicating if admin has super user privileges.
   */
  is_sys_admin: boolean;
  
  /** 
   * Optional administrative notes for audit and management purposes.
   */
  admin_notes?: string;
  
  /** 
   * Last successful admin login timestamp for security monitoring.
   */
  last_admin_login?: string;
  
  /** 
   * Optional two-factor authentication status for enhanced security.
   */
  two_factor_enabled?: boolean;
}

/**
 * User creation/update payload interface for form submissions.
 * 
 * Excludes read-only fields like ID and audit timestamps while including
 * optional password field for user creation workflows. Optimized for
 * React Hook Form and form validation scenarios.
 * 
 * @interface UserFormData
 * @example
 * ```tsx
 * function CreateUserForm() {
 *   const { register, handleSubmit } = useForm<UserFormData>();
 *   
 *   const createMutation = useMutation({
 *     mutationFn: (data: UserFormData) => createUser(data)
 *   });
 * 
 *   return (
 *     <form onSubmit={handleSubmit(createMutation.mutate)}>
 *       <input {...register('first_name', { required: true })} />
 *       <input {...register('last_name', { required: true })} />
 *       <input {...register('email', { required: true })} />
 *       <input type="password" {...register('password')} />
 *       <input type="checkbox" {...register('is_active')} />
 *     </form>
 *   );
 * }
 * ```
 */
export interface UserFormData {
  /** User email address for authentication */
  email: string;
  
  /** Display name for user interface */
  display_name: string;
  
  /** User account activation status */
  is_active: boolean;
  
  /** First name for profile */
  first_name: string;
  
  /** Last name for profile */
  last_name: string;
  
  /** Optional username */
  username?: string;
  
  /** Optional phone number */
  phone?: string;
  
  /** Optional security question */
  security_question?: string;
  
  /** Optional default application ID */
  default_app_id?: number;
  
  /** 
   * Password field for user creation.
   * Optional for user updates (password change handled separately).
   */
  password?: string;
  
  /** 
   * Password confirmation for user creation forms.
   */
  password_confirmation?: string;
  
  /** 
   * Role associations for RBAC setup.
   */
  role_assignments?: number[];
  
  /** 
   * Optional accessible services for user-specific permissions.
   */
  accessible_services?: string[];
  
  /** 
   * Optional profile picture upload.
   */
  avatar_file?: File;
  
  /** 
   * Optional timezone setting.
   */
  timezone?: string;
  
  /** 
   * Optional locale setting.
   */
  locale?: string;
}

/**
 * Password management interface for password change workflows.
 * 
 * Used in user profile settings and administrative password reset operations.
 * Supports both self-service password changes and administrative password resets.
 * 
 * @interface PasswordChangeData
 * @example
 * ```tsx
 * function PasswordChangeForm({ userId }: { userId: number }) {
 *   const { register, handleSubmit, watch } = useForm<PasswordChangeData>();
 *   const newPassword = watch('new_password');
 * 
 *   const changePasswordMutation = useMutation({
 *     mutationFn: (data: PasswordChangeData) => changePassword(userId, data)
 *   });
 * 
 *   return (
 *     <form onSubmit={handleSubmit(changePasswordMutation.mutate)}>
 *       <input type="password" {...register('current_password')} />
 *       <input type="password" {...register('new_password')} />
 *       <input 
 *         type="password" 
 *         {...register('confirm_password', {
 *           validate: value => value === newPassword || 'Passwords must match'
 *         })} 
 *       />
 *     </form>
 *   );
 * }
 * ```
 */
export interface PasswordChangeData {
  /** Current password for verification (required for self-service) */
  current_password?: string;
  
  /** New password */
  new_password: string;
  
  /** Password confirmation */
  confirm_password: string;
  
  /** 
   * Force password change flag for administrative resets.
   * When true, user must change password on next login.
   */
  force_change?: boolean;
  
  /** 
   * Optional administrative override flag.
   * Allows admins to change passwords without current password.
   */
  admin_override?: boolean;
}

/**
 * Type union for user-related operations supporting both display and full data scenarios.
 * Useful for React components that may receive either simplified or complete user data.
 * 
 * @example
 * ```tsx
 * function UserComponent({ user }: { user: AnyUser }) {
 *   // Type guard for full user data
 *   if ('created_date' in user) {
 *     return <DetailedUserView user={user} />;
 *   }
 *   return <SimpleUserView user={user} />;
 * }
 * ```
 */
export type AnyUser = UserRow | UserType | AdminProfile;

/**
 * React component props interface for user-related components.
 * Provides type safety for user prop passing and component composition.
 * 
 * @example
 * ```tsx
 * const UserCard: React.FC<UserComponentProps> = ({ user, onEdit, onDelete }) => (
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>{user.display_name}</CardTitle>
 *       <CardDescription>{user.email}</CardDescription>
 *     </CardHeader>
 *     <CardContent>
 *       <p>Status: {user.is_active ? 'Active' : 'Inactive'}</p>
 *     </CardContent>
 *     <CardActions>
 *       <Button onClick={() => onEdit?.(user)}>Edit</Button>
 *       <Button variant="destructive" onClick={() => onDelete?.(user.id)}>
 *         Delete
 *       </Button>
 *     </CardActions>
 *   </Card>
 * );
 * ```
 */
export interface UserComponentProps {
  /** User data for display and operations */
  user: AnyUser;
  
  /** Optional edit handler for user modification workflows */
  onEdit?: (user: AnyUser) => void;
  
  /** Optional delete handler for user removal operations */
  onDelete?: (userId: number) => void;
  
  /** Optional selection handler for multi-user operations */
  onSelect?: (userId: number, selected: boolean) => void;
  
  /** Optional flag for read-only display mode */
  readonly?: boolean;
  
  /** Optional CSS classes for component styling */
  className?: string;
  
  /** Optional role checking function for conditional rendering */
  hasPermission?: (permission: string) => boolean;
}

/**
 * Authentication context interface for React context providers.
 * 
 * Provides type-safe authentication state management throughout the React
 * application tree. Integrates with Next.js middleware for session validation
 * and automatic token refresh capabilities.
 * 
 * @interface AuthContextType
 * @example
 * ```tsx
 * const AuthContext = createContext<AuthContextType | null>(null);
 * 
 * export function AuthProvider({ children }: { children: React.ReactNode }) {
 *   const [session, setSession] = useState<UserSession | null>(null);
 *   const [loading, setLoading] = useState(true);
 * 
 *   const login = async (credentials: LoginCredentials) => {
 *     const response = await authenticate(credentials);
 *     setSession(response.session);
 *   };
 * 
 *   const logout = async () => {
 *     await destroySession();
 *     setSession(null);
 *   };
 * 
 *   return (
 *     <AuthContext.Provider value={{ session, login, logout, loading }}>
 *       {children}
 *     </AuthContext.Provider>
 *   );
 * }
 * ```
 */
export interface AuthContextType {
  /** Current user session data */
  session: UserSession | null;
  
  /** Authentication loading state */
  loading: boolean;
  
  /** Login function with credentials */
  login: (credentials: LoginCredentials) => Promise<void>;
  
  /** Logout function */
  logout: () => Promise<void>;
  
  /** Session refresh function */
  refreshSession: () => Promise<void>;
  
  /** Permission checking utility */
  hasPermission: (permission: string) => boolean;
  
  /** Role checking utility */
  hasRole: (role: string) => boolean;
  
  /** User update function */
  updateUser: (userData: Partial<UserFormData>) => Promise<void>;
  
  /** Password change function */
  changePassword: (passwordData: PasswordChangeData) => Promise<void>;
}

/**
 * Login credentials interface for authentication workflows.
 * 
 * Used in login forms and authentication API calls throughout the application.
 * Supports various authentication methods including email/password and SSO.
 * 
 * @interface LoginCredentials
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { register, handleSubmit } = useForm<LoginCredentials>();
 *   const { login } = useAuth();
 * 
 *   return (
 *     <form onSubmit={handleSubmit(login)}>
 *       <input {...register('email', { required: true })} />
 *       <input type="password" {...register('password', { required: true })} />
 *       <input type="checkbox" {...register('remember_me')} />
 *     </form>
 *   );
 * }
 * ```
 */
export interface LoginCredentials {
  /** Email address for authentication */
  email: string;
  
  /** Password for authentication */
  password: string;
  
  /** Optional remember me flag for extended session */
  remember_me?: boolean;
  
  /** 
   * Optional two-factor authentication token.
   */
  two_factor_token?: string;
  
  /** 
   * Optional SSO provider identifier.
   */
  sso_provider?: string;
  
  /** 
   * Optional SSO token for external authentication.
   */
  sso_token?: string;
}

/**
 * User permissions interface for granular access control.
 * 
 * Represents effective permissions for a user based on their role assignments.
 * Used by React components for UI feature gating and access control decisions.
 * 
 * @interface UserPermissions
 * @example
 * ```tsx
 * function FeatureGatedComponent({ userPermissions }: { userPermissions: UserPermissions }) {
 *   if (!userPermissions.canManageUsers) {
 *     return <AccessDeniedMessage />;
 *   }
 * 
 *   return (
 *     <div>
 *       <UserManagementPanel />
 *       {userPermissions.canManageServices && <ServiceManagementPanel />}
 *     </div>
 *   );
 * }
 * ```
 */
export interface UserPermissions {
  /** Array of permission strings for granular access control */
  permissions: string[];
  
  /** Computed permission flags for common operations */
  canManageUsers: boolean;
  canManageServices: boolean;
  canManageRoles: boolean;
  canViewSystemInfo: boolean;
  canManageApiKeys: boolean;
  canAccessApiDocs: boolean;
  canManageSchema: boolean;
  canManageFiles: boolean;
  canManageScripts: boolean;
  canManageScheduler: boolean;
  
  /** 
   * Service-specific permissions for user access control.
   */
  servicePermissions: Record<string, string[]>;
  
  /** 
   * Role-based access control flags.
   */
  roles: string[];
  
  /** 
   * Administrative privilege level.
   */
  adminLevel?: string;
}

/**
 * Utility function type for transforming UserType to UserRow for table display.
 * Maintains consistency with original Angular component mapping patterns.
 * 
 * @param user - Complete user entity from API
 * @returns Simplified user data for table display
 * 
 * @example
 * ```tsx
 * const mapUserTypeToRow: UserMapper = (user: UserType): UserRow => ({
 *   id: user.id,
 *   email: user.email,
 *   display_name: user.display_name,
 *   is_active: user.is_active,
 *   first_name: user.first_name,
 *   last_name: user.last_name,
 *   username: user.username,
 * });
 * ```
 */
export type UserMapper = (user: UserType) => UserRow;

/**
 * Utility type for React Query operations on user data.
 * Provides type safety for query keys, mutation functions, and cache operations.
 */
export type UserQueryOperations = {
  /** Query key factory for user-related queries */
  queryKey: (params?: { id?: number; active?: boolean }) => string[];
  
  /** Mutation function type for user creation */
  createUser: (data: UserFormData) => Promise<UserType>;
  
  /** Mutation function type for user updates */
  updateUser: (id: number, data: Partial<UserFormData>) => Promise<UserType>;
  
  /** Mutation function type for user deletion */
  deleteUser: (id: number) => Promise<void>;
  
  /** Mutation function type for password changes */
  changePassword: (id: number, data: PasswordChangeData) => Promise<void>;
  
  /** Query function type for user listing with pagination */
  getUsers: (params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
  }) => Promise<{ resource: UserType[]; meta: { count: number } }>;
};

/**
 * Default user mapper function implementation.
 * Provides consistent data transformation between UserType and UserRow interfaces.
 * Maintains backward compatibility with Angular component patterns.
 * 
 * @param user - Complete user entity from DreamFactory API
 * @returns Simplified user data optimized for table display
 */
export const mapUserTypeToRow: UserMapper = (user: UserType): UserRow => ({
  id: user.id,
  email: user.email,
  display_name: user.display_name,
  is_active: user.is_active,
  first_name: user.first_name,
  last_name: user.last_name,
  username: user.username,
});

/**
 * Type guard to check if a user object is a complete UserType.
 * Useful for React components that handle both UserRow and UserType.
 * 
 * @param user - User object to check
 * @returns True if user is UserType, false if UserRow
 * 
 * @example
 * ```tsx
 * function UserDisplay({ user }: { user: AnyUser }) {
 *   if (isUserType(user)) {
 *     return (
 *       <div>
 *         <h3>{user.display_name}</h3>
 *         <p>Created: {new Date(user.created_date).toLocaleDateString()}</p>
 *         <p>Roles: {user.user_to_app_to_role_by_user_id.length}</p>
 *       </div>
 *     );
 *   }
 *   
 *   return (
 *     <div>
 *       <h3>{user.display_name}</h3>
 *       <p>{user.email}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const isUserType = (user: AnyUser): user is UserType => {
  return 'created_date' in user && 'user_to_app_to_role_by_user_id' in user;
};

/**
 * Type guard to check if a user object is an AdminProfile.
 * Useful for React components that need to differentiate admin users.
 * 
 * @param user - User object to check
 * @returns True if user is AdminProfile, false otherwise
 * 
 * @example
 * ```tsx
 * function UserActions({ user }: { user: AnyUser }) {
 *   if (isAdminProfile(user)) {
 *     return (
 *       <div>
 *         <Button>Edit User</Button>
 *         <Button>Manage Permissions</Button>
 *         {user.is_sys_admin && <Button>System Settings</Button>}
 *       </div>
 *     );
 *   }
 *   
 *   return (
 *     <div>
 *       <Button>Edit Profile</Button>
 *     </div>
 *   );
 * }
 * ```
 */
export const isAdminProfile = (user: AnyUser): user is AdminProfile => {
  return isUserType(user) && 'system_permissions' in user && 'admin_level' in user;
};

/**
 * Utility function to compute effective permissions from user roles.
 * Combines role-based permissions with user-specific permissions for RBAC.
 * 
 * @param user - User with role associations
 * @returns Computed user permissions for access control
 * 
 * @example
 * ```tsx
 * function ProtectedRoute({ user, children }: { user: UserType; children: React.ReactNode }) {
 *   const permissions = computeUserPermissions(user);
 *   
 *   if (!permissions.canAccessApiDocs) {
 *     return <Redirect to="/unauthorized" />;
 *   }
 *   
 *   return <>{children}</>;
 * }
 * ```
 */
export const computeUserPermissions = (user: UserType): UserPermissions => {
  const allPermissions: string[] = [];
  const roles: string[] = [];
  const servicePermissions: Record<string, string[]> = {};
  
  // Extract permissions from role associations
  user.user_to_app_to_role_by_user_id.forEach(role => {
    roles.push(role.name);
    // Note: Role permissions would need to be fetched separately or included in role data
  });
  
  return {
    permissions: allPermissions,
    canManageUsers: allPermissions.includes('users.manage'),
    canManageServices: allPermissions.includes('services.manage'),
    canManageRoles: allPermissions.includes('roles.manage'),
    canViewSystemInfo: allPermissions.includes('system.view'),
    canManageApiKeys: allPermissions.includes('api_keys.manage'),
    canAccessApiDocs: allPermissions.includes('api_docs.view'),
    canManageSchema: allPermissions.includes('schema.manage'),
    canManageFiles: allPermissions.includes('files.manage'),
    canManageScripts: allPermissions.includes('scripts.manage'),
    canManageScheduler: allPermissions.includes('scheduler.manage'),
    servicePermissions,
    roles,
    adminLevel: isAdminProfile(user) ? user.admin_level : undefined,
  };
};

/**
 * Utility function to validate user session data.
 * Ensures session integrity and handles expiration scenarios.
 * 
 * @param session - User session to validate
 * @returns True if session is valid, false otherwise
 * 
 * @example
 * ```tsx
 * function useSessionValidation(session: UserSession | null) {
 *   const isValid = useMemo(() => {
 *     if (!session) return false;
 *     return validateUserSession(session);
 *   }, [session]);
 * 
 *   return isValid;
 * }
 * ```
 */
export const validateUserSession = (session: UserSession): boolean => {
  if (!session || !session.session_token) {
    return false;
  }
  
  const now = new Date();
  const expiresAt = new Date(session.expires_at);
  
  // Check if session is expired
  if (now >= expiresAt) {
    return false;
  }
  
  // Check if session is within refresh window (e.g., 15 minutes before expiration)
  const refreshThreshold = new Date(expiresAt.getTime() - 15 * 60 * 1000);
  
  return now < refreshThreshold;
};