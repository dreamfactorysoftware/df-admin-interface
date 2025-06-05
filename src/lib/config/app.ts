/**
 * Application-wide configuration utility consolidating UI constants, table definitions, and application metadata.
 * Migrates Angular-specific configuration patterns to React/Next.js compatible format while preserving existing business logic.
 * 
 * @fileoverview This module serves as the central configuration hub for the DreamFactory Admin Interface,
 * providing type-safe constants, table column definitions, home page resources, and application metadata
 * optimized for React 19/Next.js 15.1+ with Tailwind CSS styling.
 * 
 * Key migrations:
 * - Angular home page resource links → React component configuration
 * - Angular Material table columns → React table library format
 * - Angular dependency injection tokens → React/Next.js service patterns
 * - FontAwesome icon mappings preserved for UI consistency
 * - i18n key references maintained for seamless translation
 */

import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBook,
  faBug,
  faFileLines,
  faVideo,
  faComments,
  faLifeRing,
  faPenToSquare,
  faDatabase,
  faCode,
  faUsers,
  faKey,
  faCog,
  faFileExport,
  faShield,
  faChart,
  faHome,
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faDownload,
  faUpload,
  faRefresh,
  faSearch,
  faFilter,
  faSort,
  faCheck,
  faTimes,
  faExclamationTriangle,
  faInfo,
  faCheckCircle,
  faTimesCircle,
  faSpinner,
  faSave,
  faCancel,
  faArrowLeft,
  faArrowRight,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faChevronDown,
  faEllipsisVertical,
  faGear,
  faUser,
  faSignOut,
  faBars,
  faGlobe,
  faMoon,
  faSun,
  faPlay,
  faStop,
  faPause,
} from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faGithub } from '@fortawesome/free-brands-svg-icons';

// ================================================================================================
// APPLICATION METADATA & BRANDING
// ================================================================================================

/**
 * Application metadata configuration for Next.js head management and SEO optimization.
 * Provides consistent branding, titles, and meta information across the application.
 */
export const APP_METADATA = {
  name: 'DreamFactory Admin Console',
  shortName: 'DreamFactory',
  description: 'Generate REST APIs from your databases in minutes with DreamFactory',
  tagline: 'Powerful database API management and generation platform',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  buildId: process.env.BUILD_ID || 'development',
  
  // SEO and social media metadata
  keywords: [
    'API', 'REST', 'Database', 'MySQL', 'PostgreSQL', 'SQL Server', 'Oracle', 
    'MongoDB', 'Snowflake', 'API Generation', 'Database Management', 'Admin Console'
  ],
  author: 'DreamFactory Software Inc.',
  creator: 'DreamFactory Team',
  
  // Open Graph metadata
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'DreamFactory',
    images: {
      default: '/images/og-image.png',
      width: 1200,
      height: 630,
      alt: 'DreamFactory Admin Console - Generate REST APIs from databases',
    },
  },
  
  // Twitter Card metadata
  twitter: {
    card: 'summary_large_image',
    creator: '@dreamfactory',
    site: '@dreamfactory',
  },
  
  // Application URLs
  urls: {
    home: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    company: 'https://www.dreamfactory.com',
    documentation: 'https://wiki.dreamfactory.com',
    support: 'https://www.dreamfactory.com/support',
    github: 'https://github.com/dreamfactorysoftware',
    community: 'http://community.dreamfactory.com',
    blog: 'https://blog.dreamfactory.com',
    twitter: 'https://twitter.com/dfsoftwareinc',
  },
  
  // Feature flags and environment configuration
  features: {
    darkMode: true,
    multiTenant: false,
    analytics: process.env.NODE_ENV === 'production',
    debugMode: process.env.NODE_ENV === 'development',
    apiDocumentation: true,
    schemaVisualization: true,
    realTimeUpdates: true,
  },
} as const;

// ================================================================================================
// HOME PAGE RESOURCES & NAVIGATION
// ================================================================================================

/**
 * Resource link interface for home page navigation cards.
 * Supports React component rendering with FontAwesome icons and external URLs.
 */
export interface ResourceLink {
  /** Internationalization key for the resource name */
  name: string;
  /** FontAwesome icon definition for the resource */
  icon: IconDefinition;
  /** External URL for the resource */
  link: string;
  /** Optional description for tooltips or extended displays */
  description?: string;
  /** Optional category for grouping resources */
  category?: 'documentation' | 'community' | 'development' | 'support';
  /** Whether the link opens in a new tab/window */
  external?: boolean;
}

/**
 * Welcome page resources displayed on the dashboard home screen.
 * Migrated from Angular constants/home.ts to React component configuration.
 */
export const WELCOME_PAGE_RESOURCES: readonly ResourceLink[] = [
  {
    name: 'home.resourceLinks.gettingStartedGuide',
    icon: faFileLines,
    link: 'https://guide.dreamfactory.com',
    description: 'Step-by-step guide to get started with DreamFactory',
    category: 'documentation',
    external: true,
  },
  {
    name: 'home.resourceLinks.videoTutorials',
    icon: faVideo,
    link: 'https://wiki.dreamfactory.com/DreamFactory/Videos',
    description: 'Video tutorials covering DreamFactory features',
    category: 'documentation',
    external: true,
  },
  {
    name: 'home.resourceLinks.fullDocumentation',
    icon: faBook,
    link: 'https://wiki.dreamfactory.com/',
    description: 'Comprehensive documentation and API reference',
    category: 'documentation',
    external: true,
  },
  {
    name: 'home.resourceLinks.communityForum',
    icon: faComments,
    link: 'http://community.dreamfactory.com/',
    description: 'Join the DreamFactory community discussion',
    category: 'community',
    external: true,
  },
  {
    name: 'home.resourceLinks.bugFeatureRequests',
    icon: faBug,
    link: 'https://github.com/dreamfactorysoftware/dreamfactory/issues',
    description: 'Report bugs and request new features',
    category: 'development',
    external: true,
  },
  {
    name: 'home.resourceLinks.twitter',
    icon: faTwitter,
    link: 'https://twitter.com/dfsoftwareinc',
    description: 'Follow DreamFactory on Twitter for updates',
    category: 'community',
    external: true,
  },
  {
    name: 'home.resourceLinks.blog',
    icon: faPenToSquare,
    link: 'https://blog.dreamfactory.com/',
    description: 'Read the latest DreamFactory blog posts',
    category: 'community',
    external: true,
  },
  {
    name: 'home.resourceLinks.contactSupport',
    icon: faLifeRing,
    link: 'https://www.dreamfactory.com/support',
    description: 'Get professional support for DreamFactory',
    category: 'support',
    external: true,
  },
] as const;

/**
 * Resources page resources with additional written tutorials.
 * Extended version of welcome page resources for dedicated resources page.
 */
export const RESOURCES_PAGE_RESOURCES: readonly ResourceLink[] = [
  {
    name: 'home.resourceLinks.writtenTutorials',
    icon: faFileLines,
    link: 'http://wiki.dreamfactory.com/DreamFactory/Tutorials',
    description: 'Written tutorials and how-to guides',
    category: 'documentation',
    external: true,
  },
  ...WELCOME_PAGE_RESOURCES.slice(1), // Include all welcome resources except getting started
] as const;

/**
 * SDK and example links for different platforms and technologies.
 * Supports both native mobile development and web frameworks.
 */
export interface SDKLink {
  /** Internationalization key for the SDK name */
  name: string;
  /** GitHub repository URL for the SDK */
  url: string;
  /** Icon filename for the platform/technology */
  icon: string;
  /** Platform category for grouping */
  category: 'native' | 'web' | 'mobile';
  /** Programming language or framework */
  technology: string;
}

/**
 * Native platform SDK links for mobile and desktop development.
 */
export const NATIVE_EXAMPLE_LINKS: readonly SDKLink[] = [
  {
    name: 'home.brandNames.objectiveC',
    url: 'https://github.com/dreamfactorysoftware/ios-sdk',
    icon: 'in_product_apple_lil.png',
    category: 'native',
    technology: 'Objective-C',
  },
  {
    name: 'home.brandNames.appleSwift',
    url: 'https://github.com/dreamfactorysoftware/ios-swift-sdk',
    icon: 'in_product_swift_lil.png',
    category: 'native',
    technology: 'Swift',
  },
  {
    name: 'home.brandNames.androidJava',
    url: 'https://github.com/dreamfactorysoftware/android-sdk',
    icon: 'in_product_android_lil.png',
    category: 'mobile',
    technology: 'Java',
  },
  {
    name: 'home.brandNames.microsoftNet',
    url: 'https://github.com/dreamfactorysoftware/.net-sdk',
    icon: 'in_product_dotnet_lil.png',
    category: 'native',
    technology: '.NET',
  },
] as const;

/**
 * JavaScript framework SDK links for web development.
 */
export const JAVASCRIPT_EXAMPLE_LINKS: readonly SDKLink[] = [
  {
    name: 'home.brandNames.javaScript',
    url: 'https://github.com/dreamfactorysoftware/javascript-sdk',
    icon: 'in_product_javascript_lil.png',
    category: 'web',
    technology: 'JavaScript',
  },
  {
    name: 'home.brandNames.ionic',
    url: 'https://github.com/dreamfactorysoftware/ionic-sdk',
    icon: 'in_product_ionic_lil.png',
    category: 'mobile',
    technology: 'Ionic',
  },
  {
    name: 'home.brandNames.titanium',
    url: 'https://github.com/dreamfactorysoftware/titanium-sdk',
    icon: 'in_product_titanium_lil.png',
    category: 'mobile',
    technology: 'Titanium',
  },
  {
    name: 'home.brandNames.angularJs',
    url: 'https://github.com/dreamfactorysoftware/angular-sdk',
    icon: 'in_product_angular_lil.svg',
    category: 'web',
    technology: 'AngularJS',
  },
  {
    name: 'home.brandNames.angular2',
    url: 'https://github.com/dreamfactorysoftware/angular2-sdk',
    icon: 'in_product_angular2_lil.png',
    category: 'web',
    technology: 'Angular',
  },
  {
    name: 'home.brandNames.react',
    url: 'https://github.com/dreamfactorysoftware/reactjs-sdk',
    icon: 'in_product_reactjs_lil.png',
    category: 'web',
    technology: 'React',
  },
] as const;

// ================================================================================================
// REACT TABLE COLUMN DEFINITIONS
// ================================================================================================

/**
 * Generic table column definition interface for React table libraries.
 * Compatible with TanStack Table, React Table, and other modern React table solutions.
 * Migrated from Angular Material table column definitions.
 */
export interface TableColumn<T = any> {
  /** Unique identifier for the column */
  id: string;
  /** Column header text (supports i18n keys) */
  header: string;
  /** Accessor function or property key for data extraction */
  accessorKey?: keyof T;
  /** Custom cell rendering function */
  cell?: (info: { getValue: () => any; row: { original: T }; column: { id: string } }) => any;
  /** Whether the column is sortable */
  enableSorting?: boolean;
  /** Whether the column supports filtering */
  enableColumnFilter?: boolean;
  /** Whether the column can be hidden */
  enableHiding?: boolean;
  /** Whether the column can be resized */
  enableResizing?: boolean;
  /** Default column width */
  size?: number;
  /** Minimum column width */
  minSize?: number;
  /** Maximum column width */
  maxSize?: number;
  /** Column alignment */
  meta?: {
    align?: 'left' | 'center' | 'right';
    headerAlign?: 'left' | 'center' | 'right';
    className?: string;
    headerClassName?: string;
  };
}

/**
 * User management table column definitions.
 * Migrated from Angular constants/table-columns.ts with React table compatibility.
 */
export const USER_TABLE_COLUMNS: readonly TableColumn[] = [
  {
    id: 'active',
    header: 'users.table.active',
    accessorKey: 'active',
    enableSorting: true,
    enableColumnFilter: true,
    size: 100,
    meta: {
      align: 'center',
      headerAlign: 'center',
    },
    cell: ({ getValue }) => {
      const isActive = getValue() as boolean;
      return {
        type: 'boolean',
        value: isActive,
        display: isActive ? 'Active' : 'Inactive',
        className: isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      };
    },
  },
  {
    id: 'email',
    header: 'users.table.email',
    accessorKey: 'email',
    enableSorting: true,
    enableColumnFilter: true,
    size: 250,
    meta: {
      align: 'left',
    },
  },
  {
    id: 'displayName',
    header: 'users.table.name',
    accessorKey: 'displayName',
    enableSorting: true,
    enableColumnFilter: true,
    size: 200,
    meta: {
      align: 'left',
    },
  },
  {
    id: 'firstName',
    header: 'users.table.firstName',
    accessorKey: 'firstName',
    enableSorting: true,
    enableColumnFilter: true,
    size: 150,
    meta: {
      align: 'left',
    },
  },
  {
    id: 'lastName',
    header: 'users.table.lastName',
    accessorKey: 'lastName',
    enableSorting: true,
    enableColumnFilter: true,
    size: 150,
    meta: {
      align: 'left',
    },
  },
  {
    id: 'registration',
    header: 'users.table.registration',
    accessorKey: 'registration',
    enableSorting: true,
    enableColumnFilter: false,
    size: 180,
    meta: {
      align: 'left',
    },
    cell: ({ getValue }) => {
      const date = getValue() as string;
      return {
        type: 'date',
        value: date,
        display: new Date(date).toLocaleDateString(),
      };
    },
  },
  {
    id: 'actions',
    header: 'common.actions',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    enableResizing: false,
    size: 120,
    meta: {
      align: 'center',
      headerAlign: 'center',
      className: 'sticky-actions',
    },
    cell: ({ row }) => ({
      type: 'actions',
      actions: [
        {
          id: 'view',
          label: 'common.view',
          icon: faEye,
          variant: 'ghost' as const,
          onClick: (item: any) => console.log('View user:', item),
        },
        {
          id: 'edit',
          label: 'common.edit',
          icon: faEdit,
          variant: 'ghost' as const,
          onClick: (item: any) => console.log('Edit user:', item),
        },
        {
          id: 'delete',
          label: 'common.delete',
          icon: faTrash,
          variant: 'ghost' as const,
          className: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
          onClick: (item: any) => console.log('Delete user:', item),
          confirmationRequired: true,
          confirmationMessage: 'users.deleteConfirmation',
        },
      ],
    }),
  },
] as const;

/**
 * Database service table column definitions for service management.
 */
export const SERVICE_TABLE_COLUMNS: readonly TableColumn[] = [
  {
    id: 'name',
    header: 'services.table.name',
    accessorKey: 'name',
    enableSorting: true,
    enableColumnFilter: true,
    size: 200,
    meta: {
      align: 'left',
    },
  },
  {
    id: 'label',
    header: 'services.table.label',
    accessorKey: 'label',
    enableSorting: true,
    enableColumnFilter: true,
    size: 200,
    meta: {
      align: 'left',
    },
  },
  {
    id: 'type',
    header: 'services.table.type',
    accessorKey: 'type',
    enableSorting: true,
    enableColumnFilter: true,
    size: 150,
    meta: {
      align: 'left',
    },
    cell: ({ getValue }) => {
      const type = getValue() as string;
      return {
        type: 'badge',
        value: type,
        display: type.toUpperCase(),
        className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      };
    },
  },
  {
    id: 'active',
    header: 'services.table.active',
    accessorKey: 'active',
    enableSorting: true,
    enableColumnFilter: true,
    size: 100,
    meta: {
      align: 'center',
      headerAlign: 'center',
    },
    cell: ({ getValue }) => {
      const isActive = getValue() as boolean;
      return {
        type: 'status',
        value: isActive,
        display: isActive ? 'Active' : 'Inactive',
        className: isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      };
    },
  },
  {
    id: 'description',
    header: 'services.table.description',
    accessorKey: 'description',
    enableSorting: false,
    enableColumnFilter: true,
    size: 300,
    meta: {
      align: 'left',
    },
  },
  {
    id: 'actions',
    header: 'common.actions',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    enableResizing: false,
    size: 150,
    meta: {
      align: 'center',
      headerAlign: 'center',
      className: 'sticky-actions',
    },
    cell: ({ row }) => ({
      type: 'actions',
      actions: [
        {
          id: 'schema',
          label: 'services.viewSchema',
          icon: faDatabase,
          variant: 'ghost' as const,
          onClick: (item: any) => console.log('View schema:', item),
        },
        {
          id: 'edit',
          label: 'common.edit',
          icon: faEdit,
          variant: 'ghost' as const,
          onClick: (item: any) => console.log('Edit service:', item),
        },
        {
          id: 'delete',
          label: 'common.delete',
          icon: faTrash,
          variant: 'ghost' as const,
          className: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
          onClick: (item: any) => console.log('Delete service:', item),
          confirmationRequired: true,
          confirmationMessage: 'services.deleteConfirmation',
        },
      ],
    }),
  },
] as const;

// ================================================================================================
// API SERVICE CONFIGURATION
// ================================================================================================

/**
 * API endpoint configuration interface.
 * Replaces Angular dependency injection tokens with React/Next.js service patterns.
 */
export interface APIEndpoint {
  /** Unique identifier for the endpoint */
  id: string;
  /** Human-readable name for the endpoint */
  name: string;
  /** Base URL for the endpoint */
  url: string;
  /** Optional description */
  description?: string;
  /** HTTP methods supported */
  methods?: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
  /** Whether authentication is required */
  requiresAuth?: boolean;
  /** Rate limiting configuration */
  rateLimit?: {
    requests: number;
    window: number; // in seconds
  };
}

/**
 * Base API URL for all DreamFactory endpoints.
 */
export const BASE_API_URL = '/api/v2';

/**
 * System API endpoints configuration.
 * Migrated from Angular constants/urls.ts and tokens.ts patterns.
 */
export const API_ENDPOINTS: Record<string, APIEndpoint> = {
  // System endpoints
  SYSTEM: {
    id: 'system',
    name: 'System Configuration',
    url: `${BASE_API_URL}/system`,
    description: 'System-wide configuration and metadata',
    methods: ['GET', 'POST', 'PUT'],
    requiresAuth: true,
  },
  ENVIRONMENT: {
    id: 'environment',
    name: 'Environment Information',
    url: `${BASE_API_URL}/system/environment`,
    description: 'System environment and version information',
    methods: ['GET'],
    requiresAuth: true,
  },
  
  // User management endpoints
  SYSTEM_ADMIN: {
    id: 'system_admin',
    name: 'System Administrators',
    url: `${BASE_API_URL}/system/admin`,
    description: 'System administrator management',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    requiresAuth: true,
  },
  SYSTEM_USER: {
    id: 'system_user',
    name: 'System Users',
    url: `${BASE_API_URL}/system/user`,
    description: 'Application user management',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    requiresAuth: true,
  },
  
  // Service management endpoints
  SYSTEM_SERVICE: {
    id: 'system_service',
    name: 'System Services',
    url: `${BASE_API_URL}/system/service`,
    description: 'Database and API service management',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    requiresAuth: true,
  },
  SERVICE_TYPE: {
    id: 'service_type',
    name: 'Service Types',
    url: `${BASE_API_URL}/system/service_type`,
    description: 'Available service type definitions',
    methods: ['GET'],
    requiresAuth: true,
  },
  
  // Security endpoints
  ROLES: {
    id: 'roles',
    name: 'User Roles',
    url: `${BASE_API_URL}/system/role`,
    description: 'Role-based access control management',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    requiresAuth: true,
  },
  LIMITS: {
    id: 'limits',
    name: 'API Limits',
    url: `${BASE_API_URL}/system/limit`,
    description: 'API rate limiting and quota management',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    requiresAuth: true,
  },
  
  // Configuration endpoints
  SYSTEM_CORS: {
    id: 'system_cors',
    name: 'CORS Configuration',
    url: `${BASE_API_URL}/system/cors`,
    description: 'Cross-origin resource sharing configuration',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    requiresAuth: true,
  },
  EMAIL_TEMPLATES: {
    id: 'email_templates',
    name: 'Email Templates',
    url: `${BASE_API_URL}/system/email_template`,
    description: 'System email template management',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    requiresAuth: true,
  },
  LOOKUP_KEYS: {
    id: 'lookup_keys',
    name: 'Global Lookup Keys',
    url: `${BASE_API_URL}/system/lookup`,
    description: 'Global configuration lookup keys',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    requiresAuth: true,
  },
  
  // External endpoints
  GITHUB_REPO: {
    id: 'github_repo',
    name: 'GitHub Repository API',
    url: 'https://api.github.com/repos',
    description: 'GitHub repository access for script import',
    methods: ['GET'],
    requiresAuth: false,
    rateLimit: {
      requests: 60,
      window: 3600, // 1 hour
    },
  },
  SUBSCRIPTION_DATA: {
    id: 'subscription_data',
    name: 'License Verification',
    url: 'https://updates.dreamfactory.com/check',
    description: 'DreamFactory license and subscription verification',
    methods: ['GET'],
    requiresAuth: false,
  },
} as const;

// ================================================================================================
// UI ICON MAPPINGS
// ================================================================================================

/**
 * Centralized FontAwesome icon mapping for consistent UI iconography.
 * Maintains existing icon associations while providing type-safe access.
 */
export const UI_ICONS = {
  // Navigation and layout
  bars: faBars,
  home: faHome,
  search: faSearch,
  globe: faGlobe,
  user: faUser,
  signOut: faSignOut,
  
  // Theme and appearance
  moon: faMoon,
  sun: faSun,
  gear: faGear,
  cog: faCog,
  
  // Database and services
  database: faDatabase,
  code: faCode,
  key: faKey,
  shield: faShield,
  
  // User management
  users: faUsers,
  userCircle: faUser,
  
  // Actions
  plus: faPlus,
  edit: faEdit,
  trash: faTrash,
  eye: faEye,
  download: faDownload,
  upload: faUpload,
  refresh: faRefresh,
  save: faSave,
  cancel: faCancel,
  
  // Navigation arrows
  arrowLeft: faArrowLeft,
  arrowRight: faArrowRight,
  chevronLeft: faChevronLeft,
  chevronRight: faChevronRight,
  chevronUp: faChevronUp,
  chevronDown: faChevronDown,
  
  // Table and data
  filter: faFilter,
  sort: faSort,
  ellipsisVertical: faEllipsisVertical,
  
  // Status and feedback
  check: faCheck,
  times: faTimes,
  checkCircle: faCheckCircle,
  timesCircle: faTimesCircle,
  exclamationTriangle: faExclamationTriangle,
  info: faInfo,
  spinner: faSpinner,
  
  // Media controls
  play: faPlay,
  stop: faStop,
  pause: faPause,
  
  // Export and reporting
  fileExport: faFileExport,
  chart: faChart,
  
  // External links and branding
  twitter: faTwitter,
  github: faGithub,
  book: faBook,
  bug: faBug,
  fileLines: faFileLines,
  video: faVideo,
  comments: faComments,
  lifeRing: faLifeRing,
  penToSquare: faPenToSquare,
} as const;

// ================================================================================================
// EXPORT FILE TYPES
// ================================================================================================

/**
 * Supported export file types for data export functionality.
 */
export const EXPORT_TYPES = ['csv', 'json', 'xml'] as const;
export type ExportType = typeof EXPORT_TYPES[number];

/**
 * Export type configuration with labels and MIME types.
 */
export const EXPORT_TYPE_CONFIG: Record<ExportType, {
  label: string;
  mimeType: string;
  extension: string;
  description: string;
}> = {
  csv: {
    label: 'CSV',
    mimeType: 'text/csv',
    extension: '.csv',
    description: 'Comma-separated values format',
  },
  json: {
    label: 'JSON',
    mimeType: 'application/json',
    extension: '.json',
    description: 'JavaScript Object Notation format',
  },
  xml: {
    label: 'XML',
    mimeType: 'application/xml',
    extension: '.xml',
    description: 'Extensible Markup Language format',
  },
} as const;

// ================================================================================================
// PAGINATION AND DISPLAY CONFIGURATION
// ================================================================================================

/**
 * Default pagination and display settings for tables and lists.
 */
export const PAGINATION_CONFIG = {
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
  maxPageSize: 1000,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: true,
} as const;

/**
 * Default table configuration for React table components.
 */
export const TABLE_CONFIG = {
  enableSorting: true,
  enableFiltering: true,
  enableColumnResizing: true,
  enableColumnHiding: true,
  enableRowSelection: true,
  enablePagination: true,
  initialState: {
    pagination: {
      pageIndex: 0,
      pageSize: PAGINATION_CONFIG.defaultPageSize,
    },
  },
} as const;

// ================================================================================================
// VALIDATION AND ERROR MESSAGES
// ================================================================================================

/**
 * Common validation error message keys for forms.
 */
export const VALIDATION_MESSAGES = {
  required: 'validation.required',
  email: 'validation.email',
  minLength: 'validation.minLength',
  maxLength: 'validation.maxLength',
  pattern: 'validation.pattern',
  numeric: 'validation.numeric',
  url: 'validation.url',
  unique: 'validation.unique',
  passwordMatch: 'validation.passwordMatch',
  strongPassword: 'validation.strongPassword',
} as const;

/**
 * Common form field configuration.
 */
export const FORM_CONFIG = {
  debounceMs: 300,
  validateOnChange: true,
  validateOnBlur: true,
  reValidateMode: 'onChange' as const,
  mode: 'onTouched' as const,
} as const;

// ================================================================================================
// TYPE EXPORTS
// ================================================================================================

export type { ResourceLink, SDKLink, TableColumn, APIEndpoint };
export type IconKey = keyof typeof UI_ICONS;
export type APIEndpointKey = keyof typeof API_ENDPOINTS;