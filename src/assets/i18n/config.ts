/**
 * Next.js Internationalization Configuration
 * 
 * This file replaces Angular's TranslateModule.forRoot configuration with Next.js-native
 * i18n patterns. It provides comprehensive locale support, automatic detection, server-side
 * rendering compatibility, and dynamic loading strategies for translation resources.
 * 
 * @fileoverview Centralized i18n configuration for the DreamFactory Admin Interface
 * @version 1.0.0
 * @since Next.js 15.1 migration
 */

import { LocaleConfig, SupportedLocale, NamespaceConfig, LoadingStrategy } from './types';

// =============================================================================
// SUPPORTED LOCALES CONFIGURATION
// =============================================================================

/**
 * List of supported locales based on existing translation assets
 * Maintains compatibility with Angular ngx-translate structure
 */
export const SUPPORTED_LOCALES: readonly SupportedLocale[] = [
  'en', // English (default)
  'fr', // French
  'es', // Spanish  
  'de', // German
] as const;

/**
 * Default locale for the application
 * Falls back to this when no locale is detected or specified
 */
export const DEFAULT_LOCALE: SupportedLocale = 'en';

/**
 * Locale for development and testing environments
 * Used when SUPPORTED_LOCALES detection fails
 */
export const DEV_LOCALE: SupportedLocale = 'en';

// =============================================================================
// NAMESPACE CONFIGURATION
// =============================================================================

/**
 * Translation namespace mapping based on existing Angular i18n structure
 * Each namespace corresponds to a feature module from the Angular implementation
 */
export const NAMESPACE_CONFIG: Record<string, NamespaceConfig> = {
  // Global/shared translations
  common: {
    path: 'en.json',
    priority: 'high',
    preload: true,
    ssrEnabled: true,
  },
  
  // Admin feature namespaces
  admins: {
    path: 'admins',
    priority: 'medium',
    preload: false,
    ssrEnabled: true,
  },
  
  // API Documentation
  apiDocs: {
    path: 'apiDocs',
    priority: 'low',
    preload: false,
    ssrEnabled: false,
  },
  
  // Application Management
  apps: {
    path: 'apps',
    priority: 'medium',
    preload: false,
    ssrEnabled: true,
  },
  
  // Cache Management
  cache: {
    path: 'cache',
    priority: 'low',
    preload: false,
    ssrEnabled: true,
  },
  
  // CORS Configuration
  cors: {
    path: 'cors',
    priority: 'low',
    preload: false,
    ssrEnabled: true,
  },
  
  // Email Templates
  emailTemplates: {
    path: 'emailTemplates',
    priority: 'low',
    preload: false,
    ssrEnabled: false,
  },
  
  // File Management
  files: {
    path: 'files',
    priority: 'medium',
    preload: false,
    ssrEnabled: false,
  },
  
  // Home/Dashboard
  home: {
    path: 'home',
    priority: 'high',
    preload: true,
    ssrEnabled: true,
  },
  
  // Rate Limiting
  limits: {
    path: 'limits',
    priority: 'medium',
    preload: false,
    ssrEnabled: true,
  },
  
  // Role Management
  roles: {
    path: 'roles',
    priority: 'medium',
    preload: false,
    ssrEnabled: true,
  },
  
  // Scheduler Management
  scheduler: {
    path: 'scheduler',
    priority: 'low',
    preload: false,
    ssrEnabled: true,
  },
  
  // Database Schema Management
  schema: {
    path: 'schema',
    priority: 'high',
    preload: true,
    ssrEnabled: true,
  },
  
  // Script Management
  scripts: {
    path: 'scripts',
    priority: 'low',
    preload: false,
    ssrEnabled: false,
  },
  
  // Service Management
  services: {
    path: 'services',
    priority: 'high',
    preload: true,
    ssrEnabled: true,
  },
  
  // System Information
  systemInfo: {
    path: 'systemInfo',
    priority: 'low',
    preload: false,
    ssrEnabled: true,
  },
  
  // User Management
  userManagement: {
    path: 'userManagement',
    priority: 'medium',
    preload: true,
    ssrEnabled: true,
  },
  
  // User Administration
  users: {
    path: 'users',
    priority: 'medium',
    preload: false,
    ssrEnabled: true,
  },
} as const;

// =============================================================================
// LOADING STRATEGY CONFIGURATION
// =============================================================================

/**
 * Dynamic loading strategy for translation resources
 * Optimizes performance through intelligent caching and preloading
 */
export const LOADING_STRATEGY: LoadingStrategy = {
  // Cache configuration
  cacheStrategy: 'memory-first',
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 50, // Maximum number of cached translation sets
  
  // Loading configuration
  batchSize: 3, // Load up to 3 namespaces simultaneously
  retryAttempts: 3,
  retryDelay: 1000, // 1 second base delay with exponential backoff
  timeout: 10000, // 10 second timeout for translation loading
  
  // Preloading configuration
  preloadOnIdle: true,
  preloadDelay: 2000, // 2 seconds after page load
  preloadNamespaces: ['common', 'home', 'services', 'schema'],
  
  // Development configuration
  hotReload: process.env.NODE_ENV === 'development',
  fallbackOnError: true,
  debugMode: process.env.NODE_ENV === 'development',
} as const;

// =============================================================================
// LOCALE DETECTION CONFIGURATION
// =============================================================================

/**
 * Locale detection and fallback configuration
 * Supports automatic detection from multiple sources with proper fallbacks
 */
export const LOCALE_DETECTION = {
  // Detection order (priority from high to low)
  sources: [
    'url-path',        // /en/dashboard, /fr/dashboard
    'cookie',          // locale preference cookie
    'header',          // Accept-Language header
    'query-param',     // ?locale=en
    'local-storage',   // Browser localStorage
    'navigator',       // Browser navigator.language
  ],
  
  // Cookie configuration
  cookie: {
    name: 'dreamfactory-locale',
    domain: undefined, // Use current domain
    httpOnly: false,   // Allow client-side access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 365 * 24 * 60 * 60, // 1 year
  },
  
  // URL path configuration
  urlPath: {
    prefix: true,      // Use /en/, /fr/ prefixes
    redirect: true,    // Redirect root to default locale
    trailingSlash: false,
  },
  
  // Fallback strategy
  fallback: {
    locale: DEFAULT_LOCALE,
    strategy: 'closest-match', // en-US -> en, fr-CA -> fr
    strict: false,     // Allow partial matches
  },
  
  // Browser integration
  browser: {
    detectFromNavigator: true,
    respectUserChoice: true, // Don't override explicit user selection
    rememberChoice: true,    // Save to localStorage/cookie
  },
} as const;

// =============================================================================
// SERVER-SIDE RENDERING CONFIGURATION
// =============================================================================

/**
 * Server-side rendering configuration for i18n
 * Ensures proper locale handling during SSR and hydration
 */
export const SSR_CONFIG = {
  // SSR enablement
  enabled: true,
  
  // Preloaded namespaces for SSR
  preloadNamespaces: ['common', 'home'],
  
  // Hydration configuration
  hydration: {
    checkMismatch: process.env.NODE_ENV === 'development',
    fallbackOnMismatch: true,
    suppressHydrationWarnings: process.env.NODE_ENV === 'production',
  },
  
  // Performance optimization
  performance: {
    inlineTranslations: true,  // Inline critical translations
    maxInlineSize: 5000,       // Max bytes to inline
    streamingEnabled: true,    // Enable React 19 streaming
  },
  
  // Error handling
  errorHandling: {
    fallbackLocale: DEFAULT_LOCALE,
    suppressErrors: process.env.NODE_ENV === 'production',
    logErrors: true,
  },
} as const;

// =============================================================================
// MIDDLEWARE INTEGRATION CONFIGURATION
// =============================================================================

/**
 * Next.js middleware integration configuration
 * Enables locale-based routing and authentication flow integration
 */
export const MIDDLEWARE_CONFIG = {
  // Route matching
  matcher: [
    // Match all paths except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
  
  // Locale routing
  routing: {
    strategy: 'path-prefix',   // Use /en/, /fr/ path prefixes
    defaultLocaleInPath: false, // Don't include /en/ for default locale
    caseSensitive: false,
    trailingSlash: false,
  },
  
  // Authentication integration
  auth: {
    enableLocaleInAuthFlow: true,
    preserveLocaleOnRedirect: true,
    localeParamName: 'locale',
    redirectLocaleRoutes: ['/login', '/register', '/forgot-password'],
  },
  
  // Headers configuration
  headers: {
    setContentLanguage: true,
    setVaryHeader: true,
    cacheControl: 'public, max-age=300', // 5 minutes
  },
  
  // Performance optimization
  performance: {
    cacheLocaleDetection: true,
    cacheTimeout: 60000, // 1 minute
    enableCompression: true,
  },
} as const;

// =============================================================================
// MAIN CONFIGURATION EXPORT
// =============================================================================

/**
 * Main internationalization configuration object
 * Consolidates all i18n settings for the Next.js application
 */
export const I18N_CONFIG: LocaleConfig = {
  // Core configuration
  supportedLocales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  
  // Namespace and loading configuration
  namespaces: NAMESPACE_CONFIG,
  loading: LOADING_STRATEGY,
  
  // Detection and routing
  detection: LOCALE_DETECTION,
  ssr: SSR_CONFIG,
  middleware: MIDDLEWARE_CONFIG,
  
  // Asset paths
  assetPath: '/assets/i18n',
  publicPath: '/assets/i18n',
  
  // Development configuration
  development: {
    strict: process.env.NODE_ENV === 'development',
    showMissingKeys: process.env.NODE_ENV === 'development',
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
    enableHMR: process.env.NODE_ENV === 'development',
  },
  
  // Feature flags
  features: {
    pluralization: true,
    interpolation: true,
    formatting: true,
    contextualTranslations: true,
    rtlSupport: false, // Enable if Arabic/Hebrew support needed
  },
  
  // Performance configuration
  performance: {
    enableCaching: true,
    enableCompression: true,
    enableTreeShaking: true,
    bundleAnalysis: process.env.ANALYZE === 'true',
  },
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get translation file path for a specific locale and namespace
 * @param locale - Target locale
 * @param namespace - Translation namespace
 * @returns Full path to translation file
 */
export function getTranslationPath(locale: SupportedLocale, namespace: string): string {
  const config = NAMESPACE_CONFIG[namespace];
  if (!config) {
    throw new Error(`Unknown namespace: ${namespace}`);
  }
  
  // Handle root-level translations (common/global)
  if (config.path.endsWith('.json')) {
    return `${I18N_CONFIG.assetPath}/${locale}.json`;
  }
  
  // Handle namespaced translations
  return `${I18N_CONFIG.assetPath}/${config.path}/${locale}.json`;
}

/**
 * Check if a locale is supported
 * @param locale - Locale to check
 * @returns True if locale is supported
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

/**
 * Get the closest supported locale for a given locale string
 * @param locale - Input locale (e.g., 'en-US', 'fr-CA')
 * @returns Closest supported locale or default locale
 */
export function getClosestSupportedLocale(locale: string): SupportedLocale {
  // Exact match
  if (isSupportedLocale(locale)) {
    return locale;
  }
  
  // Language code match (en-US -> en)
  const languageCode = locale.split('-')[0];
  if (isSupportedLocale(languageCode)) {
    return languageCode;
  }
  
  // Fallback to default
  return DEFAULT_LOCALE;
}

/**
 * Get preloaded namespaces for a specific page or route
 * @param route - Current route/page identifier
 * @returns Array of namespace names to preload
 */
export function getPreloadNamespaces(route: string): string[] {
  const baseNamespaces = ['common'];
  
  // Route-specific namespace mapping
  const routeNamespaces: Record<string, string[]> = {
    '/': ['home'],
    '/home': ['home'],
    '/api-connections': ['services'],
    '/api-connections/database': ['services', 'schema'],
    '/adf-schema': ['schema'],
    '/adf-services': ['services'],
    '/adf-users': ['users'],
    '/adf-admins': ['admins'],
    '/adf-roles': ['roles'],
    '/system-settings': ['systemInfo'],
  };
  
  const specificNamespaces = routeNamespaces[route] || [];
  return [...baseNamespaces, ...specificNamespaces];
}

// Export default configuration
export default I18N_CONFIG;