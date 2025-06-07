/**
 * Next.js i18n Configuration and Translation Loader
 * 
 * Migrated from Angular Transloco HTTP loader to Next.js i18n configuration pattern.
 * Replaces Angular HttpClient with native fetch API and Next.js middleware for translation
 * file loading while maintaining compatibility with existing translation asset structure.
 * 
 * Key Features:
 * - Server-side rendering support for translations
 * - Locale-based routing integration with Next.js app router
 * - Environment-aware path resolution using Next.js environment variables
 * - Native fetch API for translation file loading
 * - Type-safe translation loading with TypeScript support
 */

import { env } from '@/lib/config/env';

/**
 * Translation resource structure compatible with existing Angular i18n assets
 */
export interface Translation {
  [key: string]: string | Translation;
}

/**
 * Supported locales configuration
 */
export const SUPPORTED_LOCALES = ['en'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

/**
 * Default locale for fallback scenarios
 */
export const DEFAULT_LOCALE: SupportedLocale = 'en';

/**
 * Next.js i18n configuration object
 * Replaces Angular TranslateModule.forRoot configuration
 */
export const i18nConfig = {
  locales: SUPPORTED_LOCALES as readonly string[],
  defaultLocale: DEFAULT_LOCALE,
  localDetection: true,
  domains: [],
} as const;

/**
 * Translation file loader for Next.js environment
 * Replaces Angular Transloco HttpLoader implementation
 */
export class NextI18nLoader {
  /**
   * Get the appropriate base path for translation assets
   * Adapts Angular isDevMode() environment detection to Next.js environment variable patterns
   */
  private getBasePath(): string {
    // Use Next.js environment variables instead of Angular isDevMode()
    const isDevelopment = env.NODE_ENV === 'development';
    const basePath = env.NEXT_PUBLIC_BASE_PATH || '';
    
    // For development, use relative path; for production, use the configured base path
    return isDevelopment ? '' : basePath;
  }

  /**
   * Construct translation file URL for given locale
   * Maintains compatibility with existing translation asset structure
   */
  private getTranslationUrl(locale: string): string {
    const basePath = this.getBasePath();
    return `${basePath}/assets/i18n/${locale}.json`;
  }

  /**
   * Load translation for specified locale using native fetch API
   * Replaces Angular HttpClient with native fetch for Next.js compatibility
   * 
   * @param locale - The locale to load translations for
   * @returns Promise resolving to translation object
   */
  async getTranslation(locale: string): Promise<Translation> {
    try {
      const url = this.getTranslationUrl(locale);
      
      // Use native fetch API instead of Angular HttpClient
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        // Enable caching for better performance
        cache: env.NODE_ENV === 'production' ? 'force-cache' : 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`Failed to load translation for locale '${locale}': ${response.statusText}`);
      }

      const translation = await response.json() as Translation;
      return translation;
    } catch (error) {
      console.error(`Error loading translation for locale '${locale}':`, error);
      
      // Fallback to default locale if current locale fails
      if (locale !== DEFAULT_LOCALE) {
        console.warn(`Falling back to default locale '${DEFAULT_LOCALE}'`);
        return this.getTranslation(DEFAULT_LOCALE);
      }
      
      // Return empty translation object if all else fails
      return {};
    }
  }

  /**
   * Preload translations for server-side rendering
   * Enables SSR support for initial page loads
   * 
   * @param locale - The locale to preload
   * @returns Promise resolving to translation object
   */
  async preloadTranslation(locale: string): Promise<Translation> {
    return this.getTranslation(locale);
  }

  /**
   * Load multiple translations for locale switching
   * Optimizes for client-side locale changes
   * 
   * @param locales - Array of locales to load
   * @returns Promise resolving to map of locale to translation
   */
  async getTranslations(locales: string[]): Promise<Record<string, Translation>> {
    const translations: Record<string, Translation> = {};
    
    await Promise.all(
      locales.map(async (locale) => {
        try {
          translations[locale] = await this.getTranslation(locale);
        } catch (error) {
          console.error(`Failed to load translation for locale '${locale}':`, error);
          translations[locale] = {};
        }
      })
    );
    
    return translations;
  }
}

/**
 * Singleton instance of the translation loader
 * Provides consistent access across the application
 */
export const i18nLoader = new NextI18nLoader();

/**
 * Utility function to detect locale from request headers
 * Used by Next.js middleware for locale-based routing
 * 
 * @param acceptLanguage - Accept-Language header value
 * @returns Detected locale or default locale
 */
export function detectLocale(acceptLanguage?: string): SupportedLocale {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  // Parse Accept-Language header and find best match
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [locale, q = '1'] = lang.trim().split(';q=');
      return { locale: locale.toLowerCase(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { locale } of languages) {
    // Check for exact match
    const exactMatch = SUPPORTED_LOCALES.find(
      (supportedLocale) => supportedLocale === locale
    );
    if (exactMatch) {
      return exactMatch;
    }

    // Check for language match (e.g., 'en-US' -> 'en')
    const languageMatch = SUPPORTED_LOCALES.find(
      (supportedLocale) => locale.startsWith(supportedLocale)
    );
    if (languageMatch) {
      return languageMatch;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Configuration for Next.js middleware integration
 * Enables automatic locale detection and routing
 */
export const middlewareConfig = {
  matcher: [
    // Skip API routes and static assets
    '/((?!api|_next/static|_next/image|assets|favicon.ico).*)',
  ],
};

/**
 * Translation namespace structure for type safety
 * Maintains organization from Angular implementation
 */
export interface TranslationNamespaces {
  common: Translation;
  navigation: Translation;
  forms: Translation;
  errors: Translation;
  success: Translation;
  database: Translation;
  schema: Translation;
  api: Translation;
  users: Translation;
  roles: Translation;
  [namespace: string]: Translation;
}

/**
 * Default export for Next.js i18n configuration
 * Used in next.config.js for framework integration
 */
export default i18nConfig;