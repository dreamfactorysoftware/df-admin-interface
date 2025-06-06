/**
 * Next.js Internationalization Configuration
 * 
 * This configuration file replaces Angular's TranslateModule.forRoot() setup
 * with Next.js-native i18n patterns optimized for server-side rendering and
 * middleware-based locale detection. The configuration enables automatic
 * locale detection, dynamic resource loading, and seamless integration with
 * Next.js middleware authentication flows.
 * 
 * Key Features:
 * - Server-side rendering compatibility for initial page loads
 * - Automatic locale detection with fallback strategies
 * - Dynamic loading strategy for translation resources
 * - Integration with Next.js middleware for locale-based routing
 * - Type-safe translation key validation
 * 
 * Performance optimizations:
 * - Lazy loading of translation resources (per Section 8.2.4)
 * - Server-side rendering support for sub-800ms TTFB targets
 * - Intelligent caching with CDN compatibility
 * - Optimized bundle size through dynamic imports
 */

import type { 
  RootTranslations, 
  ModuleTranslations, 
  TranslationNamespace,
  TranslationProviderConfig,
  TranslationVariables 
} from './types';

// ============================================================================
// LOCALE CONFIGURATION
// ============================================================================

/**
 * Supported locales configuration
 * Currently supporting English with infrastructure for future expansion
 */
export const SUPPORTED_LOCALES = ['en'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

/**
 * Default locale configuration
 * Matches DreamFactory's default English interface
 */
export const DEFAULT_LOCALE: SupportedLocale = 'en';

/**
 * Fallback locale when requested locale is unavailable
 */
export const FALLBACK_LOCALE: SupportedLocale = 'en';

/**
 * Locale detection configuration for Next.js middleware
 * Enables automatic locale detection from browser headers and URL
 */
export const LOCALE_DETECTION_CONFIG = {
  /**
   * Enable automatic locale detection from Accept-Language header
   * Integrates with Next.js middleware authentication flow per Section 4.7
   */
  detectFromHeaders: true,
  
  /**
   * Enable locale detection from URL path
   * Supports /en/admin-settings, /en/api-connections patterns
   */
  detectFromPath: true,
  
  /**
   * Enable locale detection from subdomain
   * Future support for en.admin.dreamfactory.com patterns
   */
  detectFromSubdomain: false,
  
  /**
   * Cookie name for storing user's preferred locale
   * Persists across sessions for improved UX
   */
  cookieName: 'df-locale',
  
  /**
   * Cookie configuration for locale persistence
   */
  cookieOptions: {
    httpOnly: false, // Allow client-side access for dynamic switching
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 365 * 24 * 60 * 60, // 1 year
    path: '/',
  },
} as const;

// ============================================================================
// TRANSLATION LOADING CONFIGURATION
// ============================================================================

/**
 * Translation resource loading configuration
 * Optimized for server-side rendering and dynamic imports per Section 8.2.4
 */
export const TRANSLATION_LOADING_CONFIG = {
  /**
   * Base path for translation files
   * Matches Next.js asset optimization strategy
   */
  basePath: '/assets/i18n',
  
  /**
   * File extension for translation resources
   */
  fileExtension: '.json',
  
  /**
   * Enable server-side preloading of critical translations
   * Ensures SSR compatibility and sub-800ms TTFB targets
   */
  preloadOnServer: true,
  
  /**
   * Enable client-side caching of translation resources
   * Reduces subsequent load times and improves UX
   */
  enableClientCache: true,
  
  /**
   * Cache strategy for translation resources
   * Optimizes performance while ensuring fresh content
   */
  cacheStrategy: {
    /**
     * Memory cache for loaded translations
     */
    memory: true,
    
    /**
     * Local storage persistence for offline support
     */
    localStorage: true,
    
    /**
     * Maximum age for cached translations (in milliseconds)
     */
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    
    /**
     * Enable cache invalidation on version changes
     */
    invalidateOnVersionChange: true,
  },
  
  /**
   * Dynamic loading strategy for feature-specific translations
   * Reduces initial bundle size through code splitting
   */
  dynamicLoading: {
    /**
     * Enable lazy loading of module-specific translations
     */
    enabled: true,
    
    /**
     * Preload strategy for critical modules
     */
    preloadCritical: ['common', 'nav', 'ui'],
    
    /**
     * Load on demand for feature modules
     */
    loadOnDemand: [
      'users', 'services', 'admins', 'apiDocs', 'cache', 'cors',
      'emailTemplates', 'files', 'home', 'limits', 'roles',
      'scheduler', 'schema', 'scripts', 'systemInfo', 'userManagement'
    ],
  },
} as const;

// ============================================================================
// NEXT.JS MIDDLEWARE INTEGRATION
// ============================================================================

/**
 * Middleware configuration for locale-based routing
 * Integrates with Next.js middleware authentication flow per Section 4.7
 */
export const MIDDLEWARE_I18N_CONFIG = {
  /**
   * URL patterns that should include locale prefix
   */
  localeRoutes: [
    '/',
    '/admin-settings/:path*',
    '/api-connections/:path*',
    '/api-security/:path*',
    '/system-settings/:path*',
    '/profile/:path*',
    '/debug/:path*',
    '/adf-:path*',
  ],
  
  /**
   * URL patterns that should NOT include locale prefix
   * API routes and static assets excluded from locale processing
   */
  excludeRoutes: [
    '/api/:path*',
    '/_next/:path*',
    '/favicon.ico',
    '/robots.txt',
    '/manifest.json',
    '/assets/:path*',
  ],
  
  /**
   * Redirect strategy for root path
   */
  redirectStrategy: {
    /**
     * Redirect root path to default locale
     */
    redirectRoot: true,
    
    /**
     * Redirect unsupported locales to default
     */
    redirectUnsupported: true,
    
    /**
     * HTTP status code for redirects
     */
    redirectStatus: 307, // Temporary redirect
  },
  
  /**
   * Header configuration for locale detection
   */
  headers: {
    /**
     * Accept-Language header parsing
     */
    acceptLanguage: {
      enabled: true,
      quality: true, // Parse quality values (q=0.9)
    },
    
    /**
     * Custom locale header support
     */
    customHeader: 'X-DF-Locale',
  },
} as const;

// ============================================================================
// TRANSLATION PROVIDER CONFIGURATION
// ============================================================================

/**
 * Translation provider configuration for React context
 * Enables type-safe translation access throughout the application
 */
export const TRANSLATION_PROVIDER_CONFIG: TranslationProviderConfig = {
  /**
   * Default locale for the application
   */
  defaultLocale: DEFAULT_LOCALE,
  
  /**
   * Array of supported locales
   */
  supportedLocales: [...SUPPORTED_LOCALES],
  
  /**
   * Base path for translation files
   */
  basePath: TRANSLATION_LOADING_CONFIG.basePath,
  
  /**
   * Fallback locale when translation is missing
   */
  fallbackLocale: FALLBACK_LOCALE,
  
  /**
   * Enable debug mode for missing translations in development
   */
  debug: process.env.NODE_ENV === 'development',
  
  /**
   * Cache strategy for translation files
   */
  cacheStrategy: 'memory' as const,
};

// ============================================================================
// SERVER-SIDE RENDERING CONFIGURATION
// ============================================================================

/**
 * Server-side rendering configuration for i18n
 * Ensures translations are available during SSR per Section 8.2 requirements
 */
export const SSR_I18N_CONFIG = {
  /**
   * Enable server-side translation loading
   */
  enabled: true,
  
  /**
   * Preload translations for SSR
   * Critical for achieving sub-800ms TTFB targets
   */
  preloadTranslations: {
    /**
     * Always preload root translations on server
     */
    root: ['common', 'ui', 'nav'],
    
    /**
     * Conditionally preload based on route
     */
    conditional: {
      '/admin-settings': ['admins'],
      '/api-connections': ['services'],
      '/api-security': ['roles', 'limits'],
      '/system-settings': ['systemInfo'],
      '/adf-schema': ['schema'],
      '/adf-users': ['users'],
      '/adf-services': ['services'],
    },
  },
  
  /**
   * Server-side translation hydration strategy
   */
  hydration: {
    /**
     * Include translations in initial page props
     */
    includeInProps: true,
    
    /**
     * Optimize bundle size by including only used keys
     */
    optimizeKeys: true,
    
    /**
     * Enable progressive hydration for large translation sets
     */
    progressive: true,
  },
  
  /**
   * Error handling for SSR translation loading
   */
  errorHandling: {
    /**
     * Fallback to default locale on translation load failure
     */
    fallbackOnError: true,
    
    /**
     * Log translation errors in development
     */
    logErrors: process.env.NODE_ENV === 'development',
    
    /**
     * Continue rendering with empty translations on critical errors
     */
    continueOnCriticalError: true,
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate translation file path for a given locale and namespace
 * Supports both root and module-specific translations
 */
export function getTranslationPath(locale: SupportedLocale, namespace?: TranslationNamespace): string {
  const { basePath, fileExtension } = TRANSLATION_LOADING_CONFIG;
  
  if (namespace) {
    return `${basePath}/${namespace}/${locale}${fileExtension}`;
  }
  
  return `${basePath}/${locale}${fileExtension}`;
}

/**
 * Validate if a locale is supported
 */
export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

/**
 * Get locale from Next.js request headers
 * Used in middleware for automatic locale detection
 */
export function extractLocaleFromHeaders(headers: Headers): SupportedLocale | null {
  if (!LOCALE_DETECTION_CONFIG.detectFromHeaders) {
    return null;
  }
  
  const acceptLanguage = headers.get('accept-language');
  const customLocale = headers.get(MIDDLEWARE_I18N_CONFIG.headers.customHeader);
  
  // Check custom header first
  if (customLocale && isValidLocale(customLocale)) {
    return customLocale;
  }
  
  // Parse Accept-Language header
  if (acceptLanguage) {
    const locales = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase())
      .map(lang => lang.split('-')[0]) // Extract language part only
      .find(lang => isValidLocale(lang));
    
    if (locales) {
      return locales as SupportedLocale;
    }
  }
  
  return null;
}

/**
 * Get translation cache key for efficient caching
 * Includes version information for cache invalidation
 */
export function getTranslationCacheKey(
  locale: SupportedLocale, 
  namespace?: TranslationNamespace,
  version?: string
): string {
  const versionSuffix = version ? `@${version}` : '';
  const namespaceSuffix = namespace ? `::${namespace}` : '';
  
  return `df-i18n::${locale}${namespaceSuffix}${versionSuffix}`;
}

/**
 * Configuration validation function
 * Ensures all required configuration is properly set
 */
export function validateI18nConfig(): void {
  if (SUPPORTED_LOCALES.length === 0) {
    throw new Error('At least one locale must be supported');
  }
  
  if (!SUPPORTED_LOCALES.includes(DEFAULT_LOCALE)) {
    throw new Error('Default locale must be included in supported locales');
  }
  
  if (!SUPPORTED_LOCALES.includes(FALLBACK_LOCALE)) {
    throw new Error('Fallback locale must be included in supported locales');
  }
  
  if (typeof window === 'undefined' && !SSR_I18N_CONFIG.enabled) {
    console.warn('SSR is disabled but running in server context');
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Main i18n configuration object
 * Consolidates all configuration for easy importing
 */
const i18nConfig = {
  // Core configuration
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  fallbackLocale: FALLBACK_LOCALE,
  
  // Feature configurations
  detection: LOCALE_DETECTION_CONFIG,
  loading: TRANSLATION_LOADING_CONFIG,
  middleware: MIDDLEWARE_I18N_CONFIG,
  provider: TRANSLATION_PROVIDER_CONFIG,
  ssr: SSR_I18N_CONFIG,
  
  // Utility functions
  utils: {
    getTranslationPath,
    isValidLocale,
    extractLocaleFromHeaders,
    getTranslationCacheKey,
    validateI18nConfig,
  },
} as const;

export default i18nConfig;

// Validate configuration on module load
validateI18nConfig();