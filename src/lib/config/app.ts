/**
 * Application Configuration for DreamFactory Admin Interface
 * 
 * Comprehensive application-wide configuration utility that consolidates UI constants,
 * table definitions, and application metadata. Migrates Angular-specific configuration
 * patterns to React/Next.js compatible format while preserving existing business logic
 * for table columns, home page resources, and application branding.
 * 
 * Key Features:
 * - Table column definitions optimized for React table rendering libraries
 * - Home page resources and navigation links with external URL mappings
 * - Application metadata compatible with Next.js head management and SEO
 * - FontAwesome icon mappings and internationalization key references
 * - Responsive design constants and UI configuration
 * - Database type definitions and service configuration
 */

import { UserProfile, UserRow, RoleType } from '@/types/user';
import { API_ENDPOINTS } from '@/lib/config/api';

// ============================================================================
// APPLICATION METADATA & BRANDING
// ============================================================================

/**
 * Core application metadata and branding constants
 * Compatible with Next.js metadata API for SEO optimization
 */
export const APP_METADATA = {
  name: 'DreamFactory Admin Console',
  shortName: 'DreamFactory',
  description: 'Generate REST APIs from your databases in minutes with DreamFactory',
  version: '5.0.0',
  author: 'DreamFactory Software Inc.',
  website: 'https://www.dreamfactory.com',
  supportEmail: 'support@dreamfactory.com',
  documentationUrl: 'https://wiki.dreamfactory.com',
  
  // SEO and social metadata
  keywords: ['API', 'REST', 'Database', 'MySQL', 'PostgreSQL', 'SQL Server', 'Oracle', 'MongoDB', 'Snowflake'],
  ogImage: '/images/og-dreamfactory-admin.png',
  twitterHandle: '@dreamfactory',
  
  // Application constants
  maxUploadSize: '100MB',
  sessionTimeout: 3600000, // 1 hour in milliseconds
  defaultPageSize: 25,
  maxPageSize: 100,
  
  // Feature flags for conditional UI rendering
  features: {
    enableAdvancedSchemaViews: true,
    enableBulkOperations: true,
    enableDarkMode: true,
    enableFileManagement: true,
    enableRealtimeUpdates: true,
    enableAPITesting: true,
    enableSystemMonitoring: true,
  },
} as const;

/**
 * Application theme configuration for Tailwind CSS and Next.js
 */
export const THEME_CONFIG = {
  defaultTheme: 'system' as 'light' | 'dark' | 'system',
  themes: ['light', 'dark', 'system'] as const,
  
  // Brand colors (aligned with Tailwind config)
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0e7ff', 
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1', // Main brand color
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
    accent: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b', // Secondary accent
      600: '#d97706',
      700: '#b45309',
    },
  },
  
  // Responsive breakpoints (matches Tailwind defaults)
  breakpoints: {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// ============================================================================
// HOME PAGE RESOURCES & NAVIGATION
// ============================================================================

/**
 * Home page resource links and external integrations
 * Migrated from Angular home resource configuration to React component props
 */
export const HOME_RESOURCES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Quick start guide to create your first API',
    icon: 'fas fa-rocket',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    url: '/quickstart',
    external: false,
    category: 'tutorial',
    priority: 1,
    i18nKey: 'home.resources.gettingStarted',
  },
  {
    id: 'documentation',
    title: 'Documentation',
    description: 'Comprehensive guides and API reference',
    icon: 'fas fa-book',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    url: 'https://wiki.dreamfactory.com',
    external: true,
    category: 'documentation',
    priority: 2,
    i18nKey: 'home.resources.documentation',
  },
  {
    id: 'community-forum',
    title: 'Community Forum',
    description: 'Connect with other developers and get help',
    icon: 'fas fa-users',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    url: 'https://community.dreamfactory.com',
    external: true,
    category: 'community',
    priority: 3,
    i18nKey: 'home.resources.community',
  },
  {
    id: 'video-tutorials',
    title: 'Video Tutorials',
    description: 'Learn through step-by-step video guides',
    icon: 'fas fa-play-circle',
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    url: 'https://www.youtube.com/dreamfactory',
    external: true,
    category: 'tutorial',
    priority: 4,
    i18nKey: 'home.resources.videoTutorials',
  },
  {
    id: 'api-docs',
    title: 'API Documentation',
    description: 'Interactive API documentation and testing',
    icon: 'fas fa-code',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    url: '/api-docs',
    external: false,
    category: 'documentation',
    priority: 5,
    i18nKey: 'home.resources.apiDocs',
  },
  {
    id: 'support',
    title: 'Contact Support',
    description: 'Get help from our technical support team',
    icon: 'fas fa-life-ring',
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    url: 'https://support.dreamfactory.com',
    external: true,
    category: 'support',
    priority: 6,
    i18nKey: 'home.resources.support',
  },
] as const;

/**
 * Main navigation menu configuration
 * Supports React routing and access control
 */
export const NAVIGATION_MENU = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'fas fa-tachometer-alt',
    href: '/',
    requiresAuth: true,
    permissions: [],
    i18nKey: 'navigation.dashboard',
    description: 'System overview and metrics',
  },
  {
    id: 'api-connections',
    label: 'API Connections',
    icon: 'fas fa-plug',
    href: '/api-connections',
    requiresAuth: true,
    permissions: ['read_services'],
    i18nKey: 'navigation.apiConnections',
    description: 'Manage database and service connections',
    children: [
      {
        id: 'database-services',
        label: 'Database Services',
        icon: 'fas fa-database',
        href: '/api-connections/database',
        permissions: ['read_services'],
        i18nKey: 'navigation.databaseServices',
      },
    ],
  },
  {
    id: 'api-security',
    label: 'API Security',
    icon: 'fas fa-shield-alt',
    href: '/api-security',
    requiresAuth: true,
    permissions: ['manage_security'],
    i18nKey: 'navigation.apiSecurity',
    description: 'Role-based access control and security',
    children: [
      {
        id: 'roles',
        label: 'Roles',
        icon: 'fas fa-user-tag',
        href: '/api-security/roles',
        permissions: ['read_roles'],
        i18nKey: 'navigation.roles',
      },
      {
        id: 'limits',
        label: 'API Limits',
        icon: 'fas fa-tachometer-alt',
        href: '/api-security/limits',
        permissions: ['read_limits'],
        i18nKey: 'navigation.limits',
      },
    ],
  },
  {
    id: 'admin-settings',
    label: 'Admin Settings',
    icon: 'fas fa-cog',
    href: '/admin-settings',
    requiresAuth: true,
    permissions: ['read_users'],
    i18nKey: 'navigation.adminSettings',
    description: 'User and application management',
    adminOnly: true,
  },
  {
    id: 'system-settings',
    label: 'System Settings',
    icon: 'fas fa-server',
    href: '/system-settings',
    requiresAuth: true,
    permissions: ['read_config'],
    i18nKey: 'navigation.systemSettings',
    description: 'System configuration and maintenance',
    adminOnly: true,
  },
] as const;

/**
 * Quick action buttons for dashboard and common operations
 */
export const QUICK_ACTIONS = [
  {
    id: 'create-database-service',
    label: 'Create Database Service',
    description: 'Connect to a database and generate APIs',
    icon: 'fas fa-plus-circle',
    href: '/api-connections/database/create',
    color: 'primary',
    permissions: ['create_services'],
    i18nKey: 'quickActions.createDatabaseService',
  },
  {
    id: 'browse-api-docs',
    label: 'Browse API Docs',
    description: 'View and test your generated APIs',
    icon: 'fas fa-book-open',
    href: '/api-docs',
    color: 'secondary',
    permissions: ['read_api_docs'],
    i18nKey: 'quickActions.browseApiDocs',
  },
  {
    id: 'manage-users',
    label: 'Manage Users',
    description: 'Add and configure user access',
    icon: 'fas fa-users-cog',
    href: '/admin-settings/users',
    color: 'accent',
    permissions: ['read_users'],
    adminOnly: true,
    i18nKey: 'quickActions.manageUsers',
  },
  {
    id: 'view-logs',
    label: 'View System Logs',
    description: 'Monitor system activity and errors',
    icon: 'fas fa-file-alt',
    href: '/system-settings/logs',
    color: 'neutral',
    permissions: ['view_logs'],
    adminOnly: true,
    i18nKey: 'quickActions.viewLogs',
  },
] as const;

// ============================================================================
// TABLE COLUMN DEFINITIONS
// ============================================================================

/**
 * Standardized table column definitions for React table libraries
 * Compatible with TanStack Table, React Table, and other data grid components
 */

// Base column interface for type safety
export interface TableColumn {
  id: string;
  accessorKey: string;
  header: string;
  cell?: any;
  size?: number;
  minSize?: number;
  maxSize?: number;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableGrouping?: boolean;
  enablePinning?: boolean;
  meta?: {
    align?: 'left' | 'center' | 'right';
    type?: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'action';
    className?: string;
    i18nKey?: string;
  };
}

/**
 * Database services table columns
 */
export const DATABASE_SERVICES_COLUMNS: TableColumn[] = [
  {
    id: 'select',
    accessorKey: 'id',
    header: '',
    size: 50,
    enableSorting: false,
    enableFiltering: false,
    meta: {
      type: 'boolean',
      align: 'center',
    },
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Service Name',
    size: 200,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'text',
      align: 'left',
      i18nKey: 'table.columns.serviceName',
    },
  },
  {
    id: 'label',
    accessorKey: 'label',
    header: 'Display Label',
    size: 180,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'text',
      align: 'left',
      i18nKey: 'table.columns.displayLabel',
    },
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: 'Database Type',
    size: 120,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'badge',
      align: 'center',
      i18nKey: 'table.columns.databaseType',
    },
  },
  {
    id: 'is_active',
    accessorKey: 'is_active',
    header: 'Status',
    size: 100,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'badge',
      align: 'center',
      i18nKey: 'table.columns.status',
    },
  },
  {
    id: 'created_date',
    accessorKey: 'created_date',
    header: 'Created',
    size: 150,
    enableSorting: true,
    enableFiltering: false,
    meta: {
      type: 'date',
      align: 'left',
      i18nKey: 'table.columns.created',
    },
  },
  {
    id: 'last_modified_date',
    accessorKey: 'last_modified_date',
    header: 'Modified',
    size: 150,
    enableSorting: true,
    enableFiltering: false,
    meta: {
      type: 'date',
      align: 'left',
      i18nKey: 'table.columns.modified',
    },
  },
  {
    id: 'actions',
    accessorKey: 'id',
    header: 'Actions',
    size: 120,
    enableSorting: false,
    enableFiltering: false,
    enablePinning: true,
    meta: {
      type: 'action',
      align: 'center',
      i18nKey: 'table.columns.actions',
    },
  },
] as const;

/**
 * Users table columns
 */
export const USERS_TABLE_COLUMNS: TableColumn[] = [
  {
    id: 'select',
    accessorKey: 'id',
    header: '',
    size: 50,
    enableSorting: false,
    enableFiltering: false,
    meta: {
      type: 'boolean',
      align: 'center',
    },
  },
  {
    id: 'username',
    accessorKey: 'username',
    header: 'Username',
    size: 150,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'text',
      align: 'left',
      i18nKey: 'table.columns.username',
    },
  },
  {
    id: 'display_name',
    accessorKey: 'display_name',
    header: 'Display Name',
    size: 180,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'text',
      align: 'left',
      i18nKey: 'table.columns.displayName',
    },
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'Email',
    size: 220,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'text',
      align: 'left',
      i18nKey: 'table.columns.email',
    },
  },
  {
    id: 'role',
    accessorKey: 'role',
    header: 'Role',
    size: 120,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'badge',
      align: 'center',
      i18nKey: 'table.columns.role',
    },
  },
  {
    id: 'is_active',
    accessorKey: 'is_active',
    header: 'Status',
    size: 100,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'badge',
      align: 'center',
      i18nKey: 'table.columns.status',
    },
  },
  {
    id: 'last_login_date',
    accessorKey: 'last_login_date',
    header: 'Last Login',
    size: 150,
    enableSorting: true,
    enableFiltering: false,
    meta: {
      type: 'date',
      align: 'left',
      i18nKey: 'table.columns.lastLogin',
    },
  },
  {
    id: 'created_date',
    accessorKey: 'created_date',
    header: 'Created',
    size: 150,
    enableSorting: true,
    enableFiltering: false,
    meta: {
      type: 'date',
      align: 'left',
      i18nKey: 'table.columns.created',
    },
  },
  {
    id: 'actions',
    accessorKey: 'id',
    header: 'Actions',
    size: 120,
    enableSorting: false,
    enableFiltering: false,
    enablePinning: true,
    meta: {
      type: 'action',
      align: 'center',
      i18nKey: 'table.columns.actions',
    },
  },
] as const;

/**
 * Roles table columns
 */
export const ROLES_TABLE_COLUMNS: TableColumn[] = [
  {
    id: 'select',
    accessorKey: 'id',
    header: '',
    size: 50,
    enableSorting: false,
    enableFiltering: false,
    meta: {
      type: 'boolean',
      align: 'center',
    },
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Role Name',
    size: 180,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'text',
      align: 'left',
      i18nKey: 'table.columns.roleName',
    },
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Description',
    size: 300,
    enableSorting: false,
    enableFiltering: true,
    meta: {
      type: 'text',
      align: 'left',
      i18nKey: 'table.columns.description',
    },
  },
  {
    id: 'is_active',
    accessorKey: 'is_active',
    header: 'Status',
    size: 100,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'badge',
      align: 'center',
      i18nKey: 'table.columns.status',
    },
  },
  {
    id: 'created_date',
    accessorKey: 'created_date',
    header: 'Created',
    size: 150,
    enableSorting: true,
    enableFiltering: false,
    meta: {
      type: 'date',
      align: 'left',
      i18nKey: 'table.columns.created',
    },
  },
  {
    id: 'actions',
    accessorKey: 'id',
    header: 'Actions',
    size: 120,
    enableSorting: false,
    enableFiltering: false,
    enablePinning: true,
    meta: {
      type: 'action',
      align: 'center',
      i18nKey: 'table.columns.actions',
    },
  },
] as const;

/**
 * Schema tables columns (for database schema discovery)
 */
export const SCHEMA_TABLES_COLUMNS: TableColumn[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Table Name',
    size: 200,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'text',
      align: 'left',
      i18nKey: 'table.columns.tableName',
    },
  },
  {
    id: 'label',
    accessorKey: 'label',
    header: 'Display Label',
    size: 180,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'text',
      align: 'left',
      i18nKey: 'table.columns.displayLabel',
    },
  },
  {
    id: 'plural',
    accessorKey: 'plural',
    header: 'Plural Form',
    size: 160,
    enableSorting: false,
    enableFiltering: true,
    meta: {
      type: 'text',
      align: 'left',
      i18nKey: 'table.columns.pluralForm',
    },
  },
  {
    id: 'primary_key',
    accessorKey: 'primary_key',
    header: 'Primary Key',
    size: 140,
    enableSorting: false,
    enableFiltering: false,
    meta: {
      type: 'text',
      align: 'left',
      i18nKey: 'table.columns.primaryKey',
    },
  },
  {
    id: 'field_count',
    accessorKey: 'field_count',
    header: 'Fields',
    size: 80,
    enableSorting: true,
    enableFiltering: false,
    meta: {
      type: 'number',
      align: 'center',
      i18nKey: 'table.columns.fieldCount',
    },
  },
  {
    id: 'actions',
    accessorKey: 'name',
    header: 'Actions',
    size: 120,
    enableSorting: false,
    enableFiltering: false,
    enablePinning: true,
    meta: {
      type: 'action',
      align: 'center',
      i18nKey: 'table.columns.actions',
    },
  },
] as const;

/**
 * API limits table columns
 */
export const API_LIMITS_COLUMNS: TableColumn[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Limit Name',
    size: 180,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'text',
      align: 'left',
      i18nKey: 'table.columns.limitName',
    },
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Description',
    size: 250,
    enableSorting: false,
    enableFiltering: true,
    meta: {
      type: 'text',
      align: 'left',
      i18nKey: 'table.columns.description',
    },
  },
  {
    id: 'rate',
    accessorKey: 'rate',
    header: 'Rate',
    size: 100,
    enableSorting: true,
    enableFiltering: false,
    meta: {
      type: 'number',
      align: 'center',
      i18nKey: 'table.columns.rate',
    },
  },
  {
    id: 'period',
    accessorKey: 'period',
    header: 'Period',
    size: 100,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'text',
      align: 'center',
      i18nKey: 'table.columns.period',
    },
  },
  {
    id: 'is_active',
    accessorKey: 'is_active',
    header: 'Status',
    size: 100,
    enableSorting: true,
    enableFiltering: true,
    meta: {
      type: 'badge',
      align: 'center',
      i18nKey: 'table.columns.status',
    },
  },
  {
    id: 'actions',
    accessorKey: 'id',
    header: 'Actions',
    size: 120,
    enableSorting: false,
    enableFiltering: false,
    enablePinning: true,
    meta: {
      type: 'action',
      align: 'center',
      i18nKey: 'table.columns.actions',
    },
  },
] as const;

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

/**
 * Supported database types and their configuration
 */
export const DATABASE_TYPES = [
  {
    id: 'mysql',
    name: 'MySQL',
    label: 'MySQL Database',
    icon: 'fas fa-database',
    color: 'text-orange-600',
    category: 'SQL',
    description: 'MySQL relational database',
    defaultPort: 3306,
    supportedVersions: ['5.7', '8.0'],
    features: ['transactions', 'indexes', 'views', 'procedures'],
    connectionParams: ['host', 'port', 'database', 'username', 'password'],
    isPopular: true,
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    label: 'PostgreSQL Database',
    icon: 'fas fa-elephant',
    color: 'text-blue-600',
    category: 'SQL',
    description: 'PostgreSQL advanced relational database',
    defaultPort: 5432,
    supportedVersions: ['12', '13', '14', '15'],
    features: ['transactions', 'indexes', 'views', 'procedures', 'jsonb'],
    connectionParams: ['host', 'port', 'database', 'username', 'password', 'schema'],
    isPopular: true,
  },
  {
    id: 'sqlserver',
    name: 'SQL Server',
    label: 'Microsoft SQL Server',
    icon: 'fas fa-server',
    color: 'text-red-600',
    category: 'SQL',
    description: 'Microsoft SQL Server database',
    defaultPort: 1433,
    supportedVersions: ['2017', '2019', '2022'],
    features: ['transactions', 'indexes', 'views', 'procedures'],
    connectionParams: ['host', 'port', 'database', 'username', 'password'],
    isPopular: true,
  },
  {
    id: 'oracle',
    name: 'Oracle',
    label: 'Oracle Database',
    icon: 'fas fa-coins',
    color: 'text-yellow-600',
    category: 'SQL',
    description: 'Oracle enterprise database',
    defaultPort: 1521,
    supportedVersions: ['12c', '18c', '19c', '21c'],
    features: ['transactions', 'indexes', 'views', 'procedures', 'packages'],
    connectionParams: ['host', 'port', 'service_name', 'username', 'password'],
    isPopular: false,
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    label: 'MongoDB NoSQL',
    icon: 'fas fa-leaf',
    color: 'text-green-600',
    category: 'NoSQL',
    description: 'MongoDB document database',
    defaultPort: 27017,
    supportedVersions: ['4.4', '5.0', '6.0'],
    features: ['documents', 'collections', 'aggregation'],
    connectionParams: ['host', 'port', 'database', 'username', 'password'],
    isPopular: true,
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    label: 'Snowflake Data Cloud',
    icon: 'fas fa-snowflake',
    color: 'text-cyan-600',
    category: 'Cloud',
    description: 'Snowflake cloud data platform',
    defaultPort: 443,
    supportedVersions: ['latest'],
    features: ['warehouses', 'schemas', 'views', 'procedures'],
    connectionParams: ['account', 'warehouse', 'database', 'schema', 'username', 'password'],
    isPopular: false,
  },
] as const;

/**
 * Database connection status types and their styling
 */
export const CONNECTION_STATUS = {
  connected: {
    label: 'Connected',
    color: 'green',
    icon: 'fas fa-check-circle',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    i18nKey: 'status.connected',
  },
  disconnected: {
    label: 'Disconnected',
    color: 'red',
    icon: 'fas fa-times-circle',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    i18nKey: 'status.disconnected',
  },
  testing: {
    label: 'Testing...',
    color: 'yellow',
    icon: 'fas fa-spinner fa-spin',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    i18nKey: 'status.testing',
  },
  error: {
    label: 'Error',
    color: 'red',
    icon: 'fas fa-exclamation-triangle',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    i18nKey: 'status.error',
  },
} as const;

// ============================================================================
// UI CONSTANTS & ICONS
// ============================================================================

/**
 * FontAwesome icon mappings for consistent UI
 */
export const ICONS = {
  // Core application icons
  dashboard: 'fas fa-tachometer-alt',
  database: 'fas fa-database',
  api: 'fas fa-plug',
  security: 'fas fa-shield-alt',
  users: 'fas fa-users',
  settings: 'fas fa-cog',
  
  // Action icons
  add: 'fas fa-plus',
  edit: 'fas fa-edit',
  delete: 'fas fa-trash',
  save: 'fas fa-save',
  cancel: 'fas fa-times',
  refresh: 'fas fa-sync-alt',
  search: 'fas fa-search',
  filter: 'fas fa-filter',
  
  // Status icons
  success: 'fas fa-check-circle',
  warning: 'fas fa-exclamation-triangle',
  error: 'fas fa-times-circle',
  info: 'fas fa-info-circle',
  loading: 'fas fa-spinner fa-spin',
  
  // Navigation icons
  home: 'fas fa-home',
  back: 'fas fa-arrow-left',
  forward: 'fas fa-arrow-right',
  up: 'fas fa-chevron-up',
  down: 'fas fa-chevron-down',
  left: 'fas fa-chevron-left',
  right: 'fas fa-chevron-right',
  
  // File and document icons
  file: 'fas fa-file',
  folder: 'fas fa-folder',
  download: 'fas fa-download',
  upload: 'fas fa-upload',
  copy: 'fas fa-copy',
  link: 'fas fa-link',
  
  // Database specific icons
  table: 'fas fa-table',
  field: 'fas fa-columns',
  relationship: 'fas fa-link',
  schema: 'fas fa-sitemap',
  
  // Theme and UI icons
  theme: 'fas fa-palette',
  expand: 'fas fa-expand',
  collapse: 'fas fa-compress',
  menu: 'fas fa-bars',
  close: 'fas fa-times',
} as const;

/**
 * Application status types and their configurations
 */
export const STATUS_TYPES = {
  active: {
    label: 'Active',
    color: 'green',
    icon: ICONS.success,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    badgeColor: 'bg-green-100 text-green-800',
    i18nKey: 'status.active',
  },
  inactive: {
    label: 'Inactive',
    color: 'gray',
    icon: 'fas fa-pause-circle',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    badgeColor: 'bg-gray-100 text-gray-800',
    i18nKey: 'status.inactive',
  },
  pending: {
    label: 'Pending',
    color: 'yellow',
    icon: 'fas fa-clock',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    i18nKey: 'status.pending',
  },
  error: {
    label: 'Error',
    color: 'red',
    icon: ICONS.error,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    badgeColor: 'bg-red-100 text-red-800',
    i18nKey: 'status.error',
  },
} as const;

// ============================================================================
// INTERNATIONALIZATION KEYS
// ============================================================================

/**
 * Common internationalization key patterns
 * Used throughout the application for consistent translations
 */
export const I18N_KEYS = {
  // Common actions
  actions: {
    create: 'actions.create',
    edit: 'actions.edit',
    delete: 'actions.delete',
    save: 'actions.save',
    cancel: 'actions.cancel',
    refresh: 'actions.refresh',
    search: 'actions.search',
    filter: 'actions.filter',
    export: 'actions.export',
    import: 'actions.import',
  },
  
  // Common labels
  labels: {
    name: 'labels.name',
    description: 'labels.description',
    status: 'labels.status',
    created: 'labels.created',
    modified: 'labels.modified',
    actions: 'labels.actions',
  },
  
  // Validation messages
  validation: {
    required: 'validation.required',
    email: 'validation.email',
    minLength: 'validation.minLength',
    maxLength: 'validation.maxLength',
    pattern: 'validation.pattern',
  },
  
  // Status messages
  status: {
    loading: 'status.loading',
    success: 'status.success',
    error: 'status.error',
    warning: 'status.warning',
    info: 'status.info',
  },
  
  // Navigation
  navigation: {
    dashboard: 'navigation.dashboard',
    apiConnections: 'navigation.apiConnections',
    apiSecurity: 'navigation.apiSecurity',
    adminSettings: 'navigation.adminSettings',
    systemSettings: 'navigation.systemSettings',
  },
} as const;

// ============================================================================
// FORM CONFIGURATION
// ============================================================================

/**
 * Common form field configurations for React Hook Form
 */
export const FORM_FIELD_TYPES = {
  text: {
    component: 'Input',
    type: 'text',
    validation: {
      required: true,
      maxLength: 255,
    },
  },
  email: {
    component: 'Input',
    type: 'email',
    validation: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },
  password: {
    component: 'Input',
    type: 'password',
    validation: {
      required: true,
      minLength: 8,
    },
  },
  textarea: {
    component: 'Textarea',
    validation: {
      maxLength: 1000,
    },
  },
  select: {
    component: 'Select',
    validation: {
      required: true,
    },
  },
  multiselect: {
    component: 'MultiSelect',
    validation: {
      required: false,
    },
  },
  checkbox: {
    component: 'Checkbox',
    validation: {
      required: false,
    },
  },
  number: {
    component: 'Input',
    type: 'number',
    validation: {
      required: true,
      min: 0,
    },
  },
  date: {
    component: 'DatePicker',
    validation: {
      required: false,
    },
  },
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Type definitions for external use
 */
export type DatabaseType = typeof DATABASE_TYPES[number]['id'];
export type StatusType = keyof typeof STATUS_TYPES;
export type ConnectionStatusType = keyof typeof CONNECTION_STATUS;
export type ThemeType = typeof THEME_CONFIG.themes[number];
export type HomeResourceCategory = typeof HOME_RESOURCES[number]['category'];
export type NavigationMenuItem = typeof NAVIGATION_MENU[number];
export type QuickActionItem = typeof QUICK_ACTIONS[number];

/**
 * Utility functions for configuration access
 */
export const getStatusConfig = (status: StatusType) => STATUS_TYPES[status];
export const getConnectionStatusConfig = (status: ConnectionStatusType) => CONNECTION_STATUS[status];
export const getDatabaseTypeConfig = (type: DatabaseType) => DATABASE_TYPES.find(db => db.id === type);
export const getHomeResourcesByCategory = (category: HomeResourceCategory) => 
  HOME_RESOURCES.filter(resource => resource.category === category);
export const getNavigationItemsForUser = (permissions: string[], isAdmin: boolean = false) =>
  NAVIGATION_MENU.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.permissions && item.permissions.length > 0) {
      return item.permissions.some(permission => permissions.includes(permission));
    }
    return true;
  });

/**
 * Default export with all configuration objects
 */
export default {
  APP_METADATA,
  THEME_CONFIG,
  HOME_RESOURCES,
  NAVIGATION_MENU,
  QUICK_ACTIONS,
  DATABASE_SERVICES_COLUMNS,
  USERS_TABLE_COLUMNS,
  ROLES_TABLE_COLUMNS,
  SCHEMA_TABLES_COLUMNS,
  API_LIMITS_COLUMNS,
  DATABASE_TYPES,
  CONNECTION_STATUS,
  STATUS_TYPES,
  ICONS,
  I18N_KEYS,
  FORM_FIELD_TYPES,
} as const;