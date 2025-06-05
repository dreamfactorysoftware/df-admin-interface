/**
 * User and admin profile fixture factory functions for testing authentication,
 * authorization, and user management React components with Next.js middleware integration.
 * 
 * Provides comprehensive factory functions for creating user profiles, admin accounts,
 * roles, permissions, and session data to support testing of user management interfaces
 * with JWT token validation and role-based access control.
 * 
 * @fileoverview User management test fixtures supporting React Hook Form validation,
 * Next.js middleware authentication, and comprehensive security testing scenarios.
 */

import { faker } from '@faker-js/faker';

/**
 * User profile types based on the refactored React/Next.js architecture
 */
export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone?: string;
  username?: string;
  isActive: boolean;
  isSysAdmin: boolean;
  lastLoginDate?: string;
  registrationDate: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  defaultAppId?: number;
  apps: UserApp[];
  roles: Role[];
  permissions: Permission[];
  profile?: UserProfileDetails;
}

/**
 * Admin profile with enhanced privileges for administrative operations
 */
export interface AdminProfile extends UserProfile {
  adminLevel: 'super' | 'system' | 'limited';
  canManageUsers: boolean;
  canManageServices: boolean;
  canManageApps: boolean;
  canManageRoles: boolean;
  canViewLogs: boolean;
  canModifySystem: boolean;
  lastAdminActivity?: string;
  adminNotes?: string;
}

/**
 * Role definition with granular permissions for RBAC testing
 */
export interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  roleServiceAccessByRoleId: RoleServiceAccess[];
  roleAppAccessByRoleId: RoleAppAccess[];
  permissions: Permission[];
  users?: UserProfile[];
  createdDate: string;
  lastModifiedDate: string;
}

/**
 * Permission definition for fine-grained access control
 */
export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  component?: string;
  verb?: string;
  service?: string;
  isActive: boolean;
}

/**
 * User session data with JWT token information
 */
export interface UserSession {
  sessionToken: string;
  refreshToken?: string;
  sessionId: string;
  userId: number;
  expires: string;
  issuedAt: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
  isValid: boolean;
  permissions: Permission[];
  roles: string[];
}

/**
 * User registration data for testing registration workflows
 */
export interface UserRegistration {
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  username?: string;
  sendInvite?: boolean;
  verificationToken?: string;
  registrationDate?: string;
}

/**
 * Password reset data for testing password recovery flows
 */
export interface PasswordReset {
  email: string;
  resetToken: string;
  tokenExpires: string;
  newPassword?: string;
  confirmPassword?: string;
  isTokenValid: boolean;
  requestedAt: string;
  completedAt?: string;
}

/**
 * Multi-factor authentication data
 */
export interface MfaConfiguration {
  userId: number;
  isEnabled: boolean;
  method: 'totp' | 'sms' | 'email';
  secret?: string;
  backupCodes: string[];
  lastUsed?: string;
  verificationCode?: string;
  isCodeValid?: boolean;
}

/**
 * User app access configuration
 */
export interface UserApp {
  id: number;
  name: string;
  description?: string;
  url?: string;
  isDefault: boolean;
  allowFullAccess: boolean;
  roles: Role[];
}

/**
 * Role service access configuration
 */
export interface RoleServiceAccess {
  id: number;
  roleId: number;
  serviceId: number;
  component?: string;
  verbMask: number;
  requestorMask: number;
  filters?: string;
  filterOp?: string;
}

/**
 * Role app access configuration
 */
export interface RoleAppAccess {
  id: number;
  roleId: number;
  appId: number;
  allowFullAccess: boolean;
}

/**
 * Extended user profile details
 */
export interface UserProfileDetails {
  bio?: string;
  avatar?: string;
  timezone?: string;
  locale?: string;
  dateFormat?: string;
  theme?: 'light' | 'dark' | 'system';
  preferences: Record<string, any>;
}

/**
 * Factory function configuration options
 */
export interface UserFactoryOptions {
  id?: number;
  email?: string;
  isActive?: boolean;
  isSysAdmin?: boolean;
  roles?: Role[];
  permissions?: Permission[];
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  includeProfile?: boolean;
  includeApps?: boolean;
}

export interface AdminFactoryOptions extends UserFactoryOptions {
  adminLevel?: 'super' | 'system' | 'limited';
  canManageUsers?: boolean;
  canManageServices?: boolean;
  canManageApps?: boolean;
  canManageRoles?: boolean;
  canViewLogs?: boolean;
  canModifySystem?: boolean;
}

export interface RoleFactoryOptions {
  id?: number;
  name?: string;
  isActive?: boolean;
  includePermissions?: boolean;
  includeServiceAccess?: boolean;
  includeAppAccess?: boolean;
  permissionCount?: number;
}

export interface SessionFactoryOptions {
  userId?: number;
  isValid?: boolean;
  expiresInHours?: number;
  includeRefreshToken?: boolean;
  roles?: string[];
  permissions?: Permission[];
}

/**
 * Generate a realistic user profile with configurable options
 * 
 * @param options - Configuration options for user generation
 * @returns UserProfile - Generated user profile with realistic data
 */
export function userProfileFactory(options: UserFactoryOptions = {}): UserProfile {
  const id = options.id ?? faker.number.int({ min: 1, max: 10000 });
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = options.email ?? faker.internet.email({ firstName, lastName }).toLowerCase();
  
  const baseUser: UserProfile = {
    id,
    email,
    firstName,
    lastName,
    displayName: options.includeProfile ? `${firstName} ${lastName}` : faker.person.fullName(),
    phone: faker.phone.number(),
    username: faker.internet.userName({ firstName, lastName }).toLowerCase(),
    isActive: options.isActive ?? faker.datatype.boolean({ probability: 0.9 }),
    isSysAdmin: options.isSysAdmin ?? faker.datatype.boolean({ probability: 0.1 }),
    lastLoginDate: faker.date.recent({ days: 30 }).toISOString(),
    registrationDate: faker.date.past({ years: 2 }).toISOString(),
    emailVerified: options.emailVerified ?? faker.datatype.boolean({ probability: 0.95 }),
    twoFactorEnabled: options.twoFactorEnabled ?? faker.datatype.boolean({ probability: 0.3 }),
    defaultAppId: faker.number.int({ min: 1, max: 5 }),
    apps: options.includeApps ? generateUserApps() : [],
    roles: options.roles ?? [roleFactory({ name: 'User' })],
    permissions: options.permissions ?? generateBasicPermissions(),
  };

  if (options.includeProfile) {
    baseUser.profile = {
      bio: faker.lorem.sentences(2),
      avatar: faker.image.avatar(),
      timezone: faker.location.timeZone(),
      locale: faker.location.countryCode(),
      dateFormat: faker.helpers.arrayElement(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
      theme: faker.helpers.arrayElement(['light', 'dark', 'system']),
      preferences: {
        emailNotifications: faker.datatype.boolean(),
        darkMode: faker.datatype.boolean(),
        compactView: faker.datatype.boolean(),
        autoRefresh: faker.datatype.boolean(),
      },
    };
  }

  return baseUser;
}

/**
 * Generate an administrative user profile with elevated privileges
 * 
 * @param options - Configuration options for admin generation
 * @returns AdminProfile - Generated admin profile with enhanced permissions
 */
export function adminProfileFactory(options: AdminFactoryOptions = {}): AdminProfile {
  const baseUser = userProfileFactory({
    ...options,
    isSysAdmin: true,
    isActive: true,
    emailVerified: true,
    roles: options.roles ?? [roleFactory({ name: 'Administrator' })],
    includeProfile: true,
    includeApps: true,
  });

  const adminProfile: AdminProfile = {
    ...baseUser,
    adminLevel: options.adminLevel ?? faker.helpers.arrayElement(['super', 'system', 'limited']),
    canManageUsers: options.canManageUsers ?? faker.datatype.boolean({ probability: 0.8 }),
    canManageServices: options.canManageServices ?? faker.datatype.boolean({ probability: 0.9 }),
    canManageApps: options.canManageApps ?? faker.datatype.boolean({ probability: 0.7 }),
    canManageRoles: options.canManageRoles ?? faker.datatype.boolean({ probability: 0.6 }),
    canViewLogs: options.canViewLogs ?? faker.datatype.boolean({ probability: 0.9 }),
    canModifySystem: options.canModifySystem ?? faker.datatype.boolean({ probability: 0.5 }),
    lastAdminActivity: faker.date.recent({ days: 7 }).toISOString(),
    adminNotes: faker.lorem.sentences(1),
    permissions: generateAdminPermissions(),
  };

  return adminProfile;
}

/**
 * Generate a role configuration with associated permissions
 * 
 * @param options - Configuration options for role generation
 * @returns Role - Generated role with permissions and access controls
 */
export function roleFactory(options: RoleFactoryOptions = {}): Role {
  const id = options.id ?? faker.number.int({ min: 1, max: 100 });
  const name = options.name ?? faker.helpers.arrayElement([
    'Administrator',
    'User',
    'Developer',
    'Read Only',
    'API Developer',
    'Database Manager',
    'Service Administrator',
    'Content Manager'
  ]);

  const role: Role = {
    id,
    name,
    description: faker.lorem.sentence(),
    isActive: options.isActive ?? faker.datatype.boolean({ probability: 0.9 }),
    roleServiceAccessByRoleId: options.includeServiceAccess ? generateRoleServiceAccess(id) : [],
    roleAppAccessByRoleId: options.includeAppAccess ? generateRoleAppAccess(id) : [],
    permissions: options.includePermissions ? generatePermissionsByRole(name, options.permissionCount) : [],
    createdDate: faker.date.past({ years: 1 }).toISOString(),
    lastModifiedDate: faker.date.recent({ days: 30 }).toISOString(),
  };

  return role;
}

/**
 * Generate role-based permission configurations for RBAC testing
 * 
 * @param roleName - Name of the role to generate permissions for
 * @param count - Number of permissions to generate
 * @returns Permission[] - Array of permissions based on role type
 */
export function rolePermissionFactory(roleName: string, count: number = 5): Permission[] {
  return generatePermissionsByRole(roleName, count);
}

/**
 * Generate user session data with JWT token information
 * 
 * @param options - Configuration options for session generation
 * @returns UserSession - Generated session with realistic token data
 */
export function userSessionFactory(options: SessionFactoryOptions = {}): UserSession {
  const userId = options.userId ?? faker.number.int({ min: 1, max: 10000 });
  const issuedAt = new Date();
  const expiresInHours = options.expiresInHours ?? 24;
  const expires = new Date(issuedAt.getTime() + (expiresInHours * 60 * 60 * 1000));

  // Generate realistic JWT token structure (header.payload.signature)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId.toString(),
    exp: Math.floor(expires.getTime() / 1000),
    iat: Math.floor(issuedAt.getTime() / 1000),
    roles: options.roles ?? ['User'],
  }));
  const signature = faker.string.alphanumeric(43);
  const sessionToken = `${header}.${payload}.${signature}`;

  const session: UserSession = {
    sessionToken,
    refreshToken: options.includeRefreshToken ? faker.string.uuid() : undefined,
    sessionId: faker.string.uuid(),
    userId,
    expires: expires.toISOString(),
    issuedAt: issuedAt.toISOString(),
    lastActivity: faker.date.recent({ days: 1 }).toISOString(),
    ipAddress: faker.internet.ip(),
    userAgent: faker.internet.userAgent(),
    isValid: options.isValid ?? true,
    permissions: options.permissions ?? generateBasicPermissions(),
    roles: options.roles ?? ['User'],
  };

  return session;
}

/**
 * Generate user registration data for testing user lifecycle management
 * 
 * @param options - Configuration options for registration data
 * @returns UserRegistration - Generated registration data with validation
 */
export function userRegistrationFactory(options: Partial<UserRegistration> = {}): UserRegistration {
  const firstName = options.firstName ?? faker.person.firstName();
  const lastName = options.lastName ?? faker.person.lastName();
  const email = options.email ?? faker.internet.email({ firstName, lastName }).toLowerCase();
  const password = options.password ?? 'TestPassword123!';

  const registration: UserRegistration = {
    email,
    firstName,
    lastName,
    displayName: options.displayName ?? `${firstName} ${lastName}`,
    password,
    confirmPassword: options.confirmPassword ?? password,
    phone: options.phone ?? faker.phone.number(),
    username: options.username ?? faker.internet.userName({ firstName, lastName }).toLowerCase(),
    sendInvite: options.sendInvite ?? faker.datatype.boolean({ probability: 0.7 }),
    verificationToken: options.verificationToken ?? faker.string.uuid(),
    registrationDate: options.registrationDate ?? new Date().toISOString(),
  };

  return registration;
}

/**
 * Generate password reset data for testing password recovery workflows
 * 
 * @param options - Configuration options for password reset
 * @returns PasswordReset - Generated password reset data
 */
export function passwordResetFactory(options: Partial<PasswordReset> = {}): PasswordReset {
  const requestedAt = new Date();
  const tokenExpires = new Date(requestedAt.getTime() + (24 * 60 * 60 * 1000)); // 24 hours

  const reset: PasswordReset = {
    email: options.email ?? faker.internet.email().toLowerCase(),
    resetToken: options.resetToken ?? faker.string.uuid(),
    tokenExpires: options.tokenExpires ?? tokenExpires.toISOString(),
    newPassword: options.newPassword,
    confirmPassword: options.confirmPassword,
    isTokenValid: options.isTokenValid ?? true,
    requestedAt: options.requestedAt ?? requestedAt.toISOString(),
    completedAt: options.completedAt,
  };

  return reset;
}

/**
 * Generate multi-factor authentication configuration data
 * 
 * @param userId - User ID for MFA configuration
 * @param options - Additional MFA options
 * @returns MfaConfiguration - Generated MFA configuration
 */
export function mfaConfigurationFactory(
  userId: number, 
  options: Partial<MfaConfiguration> = {}
): MfaConfiguration {
  const isEnabled = options.isEnabled ?? faker.datatype.boolean({ probability: 0.3 });
  
  const config: MfaConfiguration = {
    userId,
    isEnabled,
    method: options.method ?? faker.helpers.arrayElement(['totp', 'sms', 'email']),
    secret: isEnabled ? (options.secret ?? faker.string.alphanumeric(32)) : undefined,
    backupCodes: isEnabled ? Array.from({ length: 8 }, () => faker.string.alphanumeric(8)) : [],
    lastUsed: isEnabled ? faker.date.recent({ days: 30 }).toISOString() : undefined,
    verificationCode: options.verificationCode ?? faker.string.numeric(6),
    isCodeValid: options.isCodeValid ?? faker.datatype.boolean({ probability: 0.8 }),
  };

  return config;
}

/**
 * Generate comprehensive user relationship data including apps and service assignments
 * 
 * @param userId - User ID for relationship data
 * @param includeApps - Whether to include app assignments
 * @param includeServices - Whether to include service access
 * @returns Object containing user relationship data
 */
export function userRelationshipFactory(
  userId: number,
  includeApps: boolean = true,
  includeServices: boolean = true
) {
  return {
    userId,
    apps: includeApps ? generateUserApps() : [],
    serviceAccess: includeServices ? generateUserServiceAccess(userId) : [],
    roleAssignments: generateUserRoleAssignments(userId),
    permissions: generateBasicPermissions(),
  };
}

/**
 * Generate a complete user scenario for comprehensive testing
 * 
 * @param scenario - Type of scenario to generate
 * @returns Object containing complete user scenario data
 */
export function userScenarioFactory(
  scenario: 'admin_setup' | 'new_user' | 'power_user' | 'restricted_user' | 'deactivated_user'
) {
  switch (scenario) {
    case 'admin_setup':
      return {
        user: adminProfileFactory({ adminLevel: 'super' }),
        session: userSessionFactory({ roles: ['Administrator'], expiresInHours: 8 }),
        mfa: mfaConfigurationFactory(1, { isEnabled: true, method: 'totp' }),
        relationships: userRelationshipFactory(1, true, true),
      };

    case 'new_user':
      return {
        registration: userRegistrationFactory(),
        user: userProfileFactory({ emailVerified: false, isActive: false }),
        verificationToken: faker.string.uuid(),
      };

    case 'power_user':
      return {
        user: userProfileFactory({ 
          roles: [roleFactory({ name: 'Developer' }), roleFactory({ name: 'API Developer' })],
          twoFactorEnabled: true,
          includeProfile: true,
          includeApps: true,
        }),
        session: userSessionFactory({ roles: ['Developer', 'API Developer'] }),
        mfa: mfaConfigurationFactory(1, { isEnabled: true }),
        relationships: userRelationshipFactory(1, true, true),
      };

    case 'restricted_user':
      return {
        user: userProfileFactory({ 
          roles: [roleFactory({ name: 'Read Only' })],
          permissions: generateRestrictedPermissions(),
        }),
        session: userSessionFactory({ roles: ['Read Only'] }),
        relationships: userRelationshipFactory(1, false, false),
      };

    case 'deactivated_user':
      return {
        user: userProfileFactory({ isActive: false }),
        session: userSessionFactory({ isValid: false }),
        deactivationReason: 'Account suspended for security review',
        deactivationDate: faker.date.recent({ days: 7 }).toISOString(),
      };

    default:
      return userProfileFactory();
  }
}

// Helper functions for generating related data

function generateUserApps(): UserApp[] {
  const count = faker.number.int({ min: 1, max: 5 });
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: faker.helpers.arrayElement(['Admin App', 'API Manager', 'File Manager', 'Analytics Dashboard', 'Custom App']),
    description: faker.lorem.sentence(),
    url: faker.internet.url(),
    isDefault: index === 0,
    allowFullAccess: faker.datatype.boolean({ probability: 0.3 }),
    roles: [roleFactory()],
  }));
}

function generateBasicPermissions(): Permission[] {
  return [
    {
      id: 1,
      name: 'database.read',
      resource: 'database',
      action: 'read',
      component: '*',
      verb: 'GET',
      service: 'system',
      isActive: true,
    },
    {
      id: 2,
      name: 'api.read',
      resource: 'api',
      action: 'read',
      component: '*',
      verb: 'GET',
      service: 'system',
      isActive: true,
    },
  ];
}

function generateAdminPermissions(): Permission[] {
  const adminActions = ['create', 'read', 'update', 'delete', 'execute'] as const;
  const resources = ['user', 'role', 'service', 'database', 'api', 'system', 'logs', 'config'];
  
  return resources.flatMap((resource, resourceIndex) =>
    adminActions.map((action, actionIndex) => ({
      id: resourceIndex * adminActions.length + actionIndex + 1,
      name: `${resource}.${action}`,
      resource,
      action,
      component: '*',
      verb: action === 'read' ? 'GET' : action === 'create' ? 'POST' : action === 'update' ? 'PUT' : 'DELETE',
      service: 'system',
      isActive: true,
    }))
  );
}

function generateRestrictedPermissions(): Permission[] {
  return [
    {
      id: 1,
      name: 'api.read',
      resource: 'api',
      action: 'read',
      component: 'docs',
      verb: 'GET',
      service: 'system',
      isActive: true,
    },
  ];
}

function generatePermissionsByRole(roleName: string, count: number = 5): Permission[] {
  const rolePermissions: Record<string, string[]> = {
    'Administrator': ['user.create', 'user.read', 'user.update', 'user.delete', 'system.execute'],
    'Developer': ['api.create', 'api.read', 'api.update', 'database.read', 'service.read'],
    'User': ['api.read', 'database.read'],
    'Read Only': ['api.read'],
    'API Developer': ['api.create', 'api.read', 'api.update', 'api.delete'],
    'Database Manager': ['database.create', 'database.read', 'database.update', 'database.delete'],
    'Service Administrator': ['service.create', 'service.read', 'service.update', 'service.delete'],
    'Content Manager': ['content.create', 'content.read', 'content.update', 'content.delete'],
  };

  const permissions = rolePermissions[roleName] || ['api.read'];
  return permissions.slice(0, count).map((permission, index) => {
    const [resource, action] = permission.split('.');
    return {
      id: index + 1,
      name: permission,
      resource,
      action: action as any,
      component: '*',
      verb: action === 'read' ? 'GET' : action === 'create' ? 'POST' : action === 'update' ? 'PUT' : 'DELETE',
      service: 'system',
      isActive: true,
    };
  });
}

function generateRoleServiceAccess(roleId: number): RoleServiceAccess[] {
  const count = faker.number.int({ min: 1, max: 3 });
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    roleId,
    serviceId: faker.number.int({ min: 1, max: 10 }),
    component: faker.helpers.arrayElement(['*', 'tables', 'views', 'procedures']),
    verbMask: faker.number.int({ min: 1, max: 31 }), // Binary mask for CRUD operations
    requestorMask: faker.number.int({ min: 1, max: 7 }), // Binary mask for requestor types
    filters: faker.helpers.arrayElement([undefined, 'user_id = {user.id}', 'active = true']),
    filterOp: faker.helpers.arrayElement([undefined, 'AND', 'OR']),
  }));
}

function generateRoleAppAccess(roleId: number): RoleAppAccess[] {
  const count = faker.number.int({ min: 1, max: 3 });
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    roleId,
    appId: faker.number.int({ min: 1, max: 5 }),
    allowFullAccess: faker.datatype.boolean({ probability: 0.5 }),
  }));
}

function generateUserServiceAccess(userId: number) {
  return Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, (_, index) => ({
    id: index + 1,
    userId,
    serviceId: faker.number.int({ min: 1, max: 10 }),
    serviceName: faker.helpers.arrayElement(['mysql', 'postgresql', 'mongodb', 'api-docs']),
    accessLevel: faker.helpers.arrayElement(['read', 'write', 'admin']),
    isActive: faker.datatype.boolean({ probability: 0.9 }),
  }));
}

function generateUserRoleAssignments(userId: number) {
  return Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, (_, index) => ({
    id: index + 1,
    userId,
    roleId: faker.number.int({ min: 1, max: 10 }),
    assignedDate: faker.date.past({ years: 1 }).toISOString(),
    assignedBy: faker.number.int({ min: 1, max: 5 }),
    isActive: faker.datatype.boolean({ probability: 0.95 }),
  }));
}

/**
 * Export all factory functions and types for easy consumption
 */
export const UserFixtures = {
  // Main factory functions
  userProfile: userProfileFactory,
  adminProfile: adminProfileFactory,
  role: roleFactory,
  rolePermission: rolePermissionFactory,
  userSession: userSessionFactory,
  userRegistration: userRegistrationFactory,
  passwordReset: passwordResetFactory,
  mfaConfiguration: mfaConfigurationFactory,
  userRelationship: userRelationshipFactory,
  userScenario: userScenarioFactory,

  // Helper functions for specific scenarios
  basicUser: () => userProfileFactory({ roles: [roleFactory({ name: 'User' })] }),
  adminUser: () => adminProfileFactory({ adminLevel: 'super' }),
  developerUser: () => userProfileFactory({ 
    roles: [roleFactory({ name: 'Developer' })],
    twoFactorEnabled: true,
  }),
  readOnlyUser: () => userProfileFactory({ 
    roles: [roleFactory({ name: 'Read Only' })],
    permissions: generateRestrictedPermissions(),
  }),
  inactiveUser: () => userProfileFactory({ isActive: false }),
  unverifiedUser: () => userProfileFactory({ emailVerified: false }),

  // Session scenarios
  validSession: () => userSessionFactory({ isValid: true }),
  expiredSession: () => userSessionFactory({ isValid: false, expiresInHours: -1 }),
  adminSession: () => userSessionFactory({ roles: ['Administrator'] }),

  // Registration scenarios
  newRegistration: () => userRegistrationFactory(),
  inviteRegistration: () => userRegistrationFactory({ sendInvite: true }),

  // Password reset scenarios
  activeReset: () => passwordResetFactory({ isTokenValid: true }),
  expiredReset: () => passwordResetFactory({ isTokenValid: false }),

  // MFA scenarios
  enabledMfa: (userId: number) => mfaConfigurationFactory(userId, { isEnabled: true }),
  disabledMfa: (userId: number) => mfaConfigurationFactory(userId, { isEnabled: false }),
};

export default UserFixtures;