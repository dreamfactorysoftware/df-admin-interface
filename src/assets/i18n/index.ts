/**
 * Central i18n index file for Next.js React/Next.js migration
 * 
 * This file consolidates all translation namespaces and provides type-safe access
 * to translation keys for React components. It supports server-side rendering,
 * dynamic imports, and maintains feature-based organization while enabling 
 * centralized access patterns required for the Angular to React migration.
 * 
 * Key Features:
 * - Type-safe translation key access with TypeScript interfaces
 * - Server-side rendering compatibility
 * - Dynamic import support for Next.js optimization
 * - React Hook Form integration for form validation messages
 * - Centralized namespace exports for all feature modules
 * 
 * @see Section 0.2.1 - i18n migration requirements
 * @see React/Next.js Integration Requirements - SSR optimization
 * @see Section 8.2.4 - Asset optimization strategy
 */

import type {
  Translations,
  TranslationNamespace,
  TranslationKey,
  TranslationFunction,
  UseTranslationReturn,
  TranslationConfig,
  StaticTranslations,
  PagePropsWithTranslations,
  LocalizedComponentProps,
  ValidatedFormComponentProps,
  NamespaceKeys,
  ValidationMessageKey,
  FieldValidation,
  TranslationProps,
  EnsureTranslationStructure
} from './types';

// =============================================================================
// DYNAMIC IMPORTS FOR NEXT.JS OPTIMIZATION
// =============================================================================

/**
 * Dynamic import functions for server-side rendering and code splitting
 * These imports support Next.js dynamic loading patterns and enable
 * efficient bundle optimization for different locales
 */

/**
 * Dynamically import the main translation file with server-side rendering support
 */
export const loadMainTranslations = async (locale: string = 'en'): Promise<typeof import('./en.json')> => {
  try {
    // Support both static and dynamic locale loading for Next.js
    switch (locale) {
      case 'en':
      default:
        return await import('./en.json');
      // Additional locales can be added here as needed
      // case 'es':
      //   return await import('./es.json');
    }
  } catch (error) {
    console.warn(`Failed to load main translations for locale: ${locale}, falling back to English`, error);
    return await import('./en.json');
  }
};

/**
 * Dynamically import feature-specific translation namespaces
 * Enables lazy loading of translations for improved performance
 */
export const loadFeatureTranslations = {
  users: async (locale: string = 'en') => {
    try {
      return await import(`./users/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load users translations for locale: ${locale}`, error);
      return await import('./users/en.json');
    }
  },

  userManagement: async (locale: string = 'en') => {
    try {
      return await import(`./userManagement/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load userManagement translations for locale: ${locale}`, error);
      return await import('./userManagement/en.json');
    }
  },

  systemInfo: async (locale: string = 'en') => {
    try {
      return await import(`./systemInfo/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load systemInfo translations for locale: ${locale}`, error);
      return await import('./systemInfo/en.json');
    }
  },

  services: async (locale: string = 'en') => {
    try {
      return await import(`./services/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load services translations for locale: ${locale}`, error);
      return await import('./services/en.json');
    }
  },

  scripts: async (locale: string = 'en') => {
    try {
      return await import(`./scripts/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load scripts translations for locale: ${locale}`, error);
      return await import('./scripts/en.json');
    }
  },

  schema: async (locale: string = 'en') => {
    try {
      return await import(`./schema/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load schema translations for locale: ${locale}`, error);
      return await import('./schema/en.json');
    }
  },

  scheduler: async (locale: string = 'en') => {
    try {
      return await import(`./scheduler/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load scheduler translations for locale: ${locale}`, error);
      return await import('./scheduler/en.json');
    }
  },

  roles: async (locale: string = 'en') => {
    try {
      return await import(`./roles/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load roles translations for locale: ${locale}`, error);
      return await import('./roles/en.json');
    }
  },

  limits: async (locale: string = 'en') => {
    try {
      return await import(`./limits/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load limits translations for locale: ${locale}`, error);
      return await import('./limits/en.json');
    }
  },

  home: async (locale: string = 'en') => {
    try {
      return await import(`./home/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load home translations for locale: ${locale}`, error);
      return await import('./home/en.json');
    }
  },

  files: async (locale: string = 'en') => {
    try {
      return await import(`./files/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load files translations for locale: ${locale}`, error);
      return await import('./files/en.json');
    }
  },

  emailTemplates: async (locale: string = 'en') => {
    try {
      return await import(`./emailTemplates/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load emailTemplates translations for locale: ${locale}`, error);
      return await import('./emailTemplates/en.json');
    }
  },

  cors: async (locale: string = 'en') => {
    try {
      return await import(`./cors/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load cors translations for locale: ${locale}`, error);
      return await import('./cors/en.json');
    }
  },

  cache: async (locale: string = 'en') => {
    try {
      return await import(`./cache/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load cache translations for locale: ${locale}`, error);
      return await import('./cache/en.json');
    }
  },

  apps: async (locale: string = 'en') => {
    try {
      return await import(`./apps/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load apps translations for locale: ${locale}`, error);
      return await import('./apps/en.json');
    }
  },

  apiDocs: async (locale: string = 'en') => {
    try {
      return await import(`./apiDocs/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load apiDocs translations for locale: ${locale}`, error);
      return await import('./apiDocs/en.json');
    }
  },

  admins: async (locale: string = 'en') => {
    try {
      return await import(`./admins/${locale}.json`);
    } catch (error) {
      console.warn(`Failed to load admins translations for locale: ${locale}`, error);
      return await import('./admins/en.json');
    }
  }
} as const;

// =============================================================================
// TRANSLATION CONFIGURATION
// =============================================================================

/**
 * Default configuration for Next.js i18n integration
 * Supports server-side rendering and static generation
 */
export const defaultTranslationConfig: TranslationConfig = {
  defaultLocale: 'en',
  locales: ['en'], // Additional locales can be added as needed
  fallbackLocale: 'en',
  load: 'currentOnly', // Optimize for SSR performance
  interpolation: {
    escapeValue: false, // React already does escaping
    formatSeparator: ','
  }
};

/**
 * Available translation namespaces for type checking and validation
 */
export const TRANSLATION_NAMESPACES: readonly TranslationNamespace[] = [
  'common',
  'users',
  'userManagement', 
  'systemInfo',
  'services',
  'scripts',
  'schema',
  'scheduler',
  'roles',
  'limits',
  'home',
  'files',
  'emailTemplates',
  'cors',
  'cache',
  'apps',
  'apiDocs',
  'admins'
] as const;

// =============================================================================
// CENTRALIZED TRANSLATION LOADER
// =============================================================================

/**
 * Load all translations for a specific locale with server-side rendering support
 * This function consolidates all feature-specific translations into a unified structure
 * 
 * @param locale - The locale to load translations for
 * @returns Promise resolving to complete translations object
 */
export async function loadAllTranslations(locale: string = 'en'): Promise<Translations> {
  try {
    // Load main translations first
    const mainTranslations = await loadMainTranslations(locale);
    
    // Load all feature-specific translations in parallel for performance
    const [
      usersTranslations,
      userManagementTranslations,
      systemInfoTranslations,
      servicesTranslations,
      scriptsTranslations,
      schemaTranslations,
      schedulerTranslations,
      rolesTranslations,
      limitsTranslations,
      homeTranslations,
      filesTranslations,
      emailTemplatesTranslations,
      corsTranslations,
      cacheTranslations,
      appsTranslations,
      apiDocsTranslations,
      adminsTranslations
    ] = await Promise.all([
      loadFeatureTranslations.users(locale),
      loadFeatureTranslations.userManagement(locale),
      loadFeatureTranslations.systemInfo(locale),
      loadFeatureTranslations.services(locale),
      loadFeatureTranslations.scripts(locale),
      loadFeatureTranslations.schema(locale),
      loadFeatureTranslations.scheduler(locale),
      loadFeatureTranslations.roles(locale),
      loadFeatureTranslations.limits(locale),
      loadFeatureTranslations.home(locale),
      loadFeatureTranslations.files(locale),
      loadFeatureTranslations.emailTemplates(locale),
      loadFeatureTranslations.cors(locale),
      loadFeatureTranslations.cache(locale),
      loadFeatureTranslations.apps(locale),
      loadFeatureTranslations.apiDocs(locale),
      loadFeatureTranslations.admins(locale)
    ]);

    // Merge all translations into a unified structure
    // Extract common translations from main file and combine with feature-specific ones
    const translations: Translations = {
      // Common translations from main file
      common: {
        actions: mainTranslations.common?.actions || {},
        status: {
          active: mainTranslations.common?.labels?.active || 'Active',
          inactive: 'Inactive',
          pending: mainTranslations.common?.labels?.pending || 'Pending',
          loading: 'Loading',
          success: 'Success',
          error: 'Error',
          warning: 'Warning'
        },
        pagination: {
          first: 'First',
          last: 'Last',
          next: 'Next',
          previous: 'Previous',
          page: 'Page',
          of: 'of',
          showing: 'Showing',
          results: 'results'
        }
      },
      
      // Feature-specific translations
      users: usersTranslations.default || usersTranslations,
      userManagement: userManagementTranslations.default || userManagementTranslations,
      systemInfo: systemInfoTranslations.default || systemInfoTranslations,
      services: servicesTranslations.default || servicesTranslations,
      scripts: scriptsTranslations.default || scriptsTranslations,
      schema: schemaTranslations.default || schemaTranslations,
      scheduler: schedulerTranslations.default || schedulerTranslations,
      roles: rolesTranslations.default || rolesTranslations,
      limits: limitsTranslations.default || limitsTranslations,
      home: homeTranslations.default || homeTranslations,
      files: filesTranslations.default || filesTranslations,
      emailTemplates: emailTemplatesTranslations.default || emailTemplatesTranslations,
      cors: corsTranslations.default || corsTranslations,
      cache: cacheTranslations.default || cacheTranslations,
      apps: appsTranslations.default || appsTranslations,
      apiDocs: apiDocsTranslations.default || apiDocsTranslations,
      admins: adminsTranslations.default || adminsTranslations
    };

    return translations;
  } catch (error) {
    console.error('Failed to load translations:', error);
    
    // Return minimal fallback translations
    return {
      common: {
        actions: {
          save: 'Save',
          cancel: 'Cancel',
          edit: 'Edit',
          delete: 'Delete',
          create: 'Create',
          update: 'Update',
          view: 'View',
          close: 'Close',
          refresh: 'Refresh',
          search: 'Search',
          filter: 'Filter',
          export: 'Export',
          import: 'Import',
          reset: 'Reset',
          submit: 'Submit',
          back: 'Back',
          next: 'Next',
          previous: 'Previous',
          confirm: 'Confirm'
        },
        status: {
          active: 'Active',
          inactive: 'Inactive',
          pending: 'Pending',
          loading: 'Loading',
          success: 'Success',
          error: 'Error',
          warning: 'Warning'
        },
        pagination: {
          first: 'First',
          last: 'Last',
          next: 'Next',
          previous: 'Previous',
          page: 'Page',
          of: 'of',
          showing: 'Showing',
          results: 'results'
        }
      }
    } as Translations;
  }
}

// =============================================================================
// STATIC TRANSLATION HELPERS FOR SSR
// =============================================================================

/**
 * Load translations for Next.js getStaticProps or getServerSideProps
 * Optimized for server-side rendering performance
 * 
 * @param locale - The locale to load
 * @param namespaces - Optional array of specific namespaces to load
 * @returns Promise resolving to static translations
 */
export async function loadStaticTranslations(
  locale: string = 'en',
  namespaces?: TranslationNamespace[]
): Promise<StaticTranslations> {
  const translations = await loadAllTranslations(locale);
  
  // If specific namespaces are requested, filter to only those
  if (namespaces) {
    const filteredTranslations = { common: translations.common } as Partial<Translations>;
    
    for (const namespace of namespaces) {
      if (namespace !== 'common' && translations[namespace]) {
        filteredTranslations[namespace] = translations[namespace];
      }
    }
    
    return {
      [locale]: filteredTranslations as Translations
    };
  }
  
  return {
    [locale]: translations
  };
}

/**
 * Create page props with translations for Next.js pages
 * Supports both static generation and server-side rendering
 * 
 * @param locale - Current locale
 * @param namespaces - Optional specific namespaces to include
 * @returns Page props with translations
 */
export async function createPagePropsWithTranslations(
  locale: string = 'en',
  namespaces?: TranslationNamespace[]
): Promise<PagePropsWithTranslations> {
  const staticTranslations = await loadStaticTranslations(locale, namespaces);
  
  return {
    translations: staticTranslations[locale],
    locale,
    fallbackTranslations: locale !== 'en' ? staticTranslations.en : undefined
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get translation key with type safety and interpolation support
 * Compatible with React Hook Form validation patterns
 * 
 * @param translations - The translations object
 * @param key - The translation key with dot notation
 * @param values - Optional interpolation values
 * @returns Translated string or fallback
 */
export function getTranslation(
  translations: Translations,
  key: TranslationKey,
  values?: Record<string, string | number>
): string {
  try {
    const keyParts = key.split('.');
    let current: any = translations;
    
    for (const part of keyParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Return the key if translation is not found
        return key;
      }
    }
    
    if (typeof current === 'string') {
      // Simple interpolation for values like {{variable}}
      if (values) {
        return current.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
          return values[variable]?.toString() || match;
        });
      }
      return current;
    }
    
    // Return the key if the final value is not a string
    return key;
  } catch (error) {
    console.warn('Translation error:', error, { key, values });
    return key;
  }
}

/**
 * Get namespaced translation with type safety
 * Optimized for component-level translation usage
 * 
 * @param translations - The translations object
 * @param namespace - The translation namespace
 * @param key - The key within the namespace
 * @param values - Optional interpolation values
 * @returns Translated string or fallback
 */
export function getNamespacedTranslation<T extends TranslationNamespace>(
  translations: Translations,
  namespace: T,
  key: NamespaceKeys<T>,
  values?: Record<string, string | number>
): string {
  const fullKey = `${namespace}.${key}` as TranslationKey;
  return getTranslation(translations, fullKey, values);
}

/**
 * Create validation messages for React Hook Form integration
 * Provides type-safe form validation with i18n support
 * 
 * @param translations - The translations object
 * @param namespace - The feature namespace for validation messages
 * @returns Validation message functions
 */
export function createValidationMessages(
  translations: Translations,
  namespace: TranslationNamespace = 'common'
): Record<ValidationMessageKey, (value?: any) => string> {
  return {
    required: () => getNamespacedTranslation(translations, namespace, 'validation.required' as any) || 'This field is required',
    email: () => getNamespacedTranslation(translations, namespace, 'validation.email' as any) || 'Please enter a valid email address',
    minLength: (value: number) => getNamespacedTranslation(translations, namespace, 'validation.minLength' as any, { length: value }) || `Minimum length is ${value} characters`,
    maxLength: (value: number) => getNamespacedTranslation(translations, namespace, 'validation.maxLength' as any, { length: value }) || `Maximum length is ${value} characters`,
    pattern: () => getNamespacedTranslation(translations, namespace, 'validation.pattern' as any) || 'Please enter a valid format',
    numeric: () => getNamespacedTranslation(translations, namespace, 'validation.numeric' as any) || 'Please enter a valid number',
    url: () => getNamespacedTranslation(translations, namespace, 'validation.url' as any) || 'Please enter a valid URL',
    custom: (message: string) => message || 'Validation failed'
  };
}

/**
 * Validate that translations conform to the expected structure
 * Provides compile-time type checking for translation completeness
 * 
 * @param translations - The translations to validate
 * @returns The validated translations object
 */
export function validateTranslationStructure<T extends Translations>(
  translations: T
): EnsureTranslationStructure<T> {
  // Basic validation that common namespace exists
  if (!translations.common) {
    throw new Error('Translations must include a common namespace');
  }
  
  return translations as EnsureTranslationStructure<T>;
}

// =============================================================================
// EXPORTS
// =============================================================================

// Re-export types for easy importing
export type {
  Translations,
  TranslationNamespace,
  TranslationKey,
  TranslationFunction,
  UseTranslationReturn,
  TranslationConfig,
  StaticTranslations,
  PagePropsWithTranslations,
  LocalizedComponentProps,
  ValidatedFormComponentProps,
  NamespaceKeys,
  ValidationMessageKey,
  FieldValidation,
  TranslationProps,
  EnsureTranslationStructure
};

// Export validation functions
export { isValidTranslationKey, isValidNamespace } from './types';

// Default export for common usage patterns
export default {
  loadAllTranslations,
  loadStaticTranslations,
  createPagePropsWithTranslations,
  getTranslation,
  getNamespacedTranslation,
  createValidationMessages,
  validateTranslationStructure,
  config: defaultTranslationConfig,
  namespaces: TRANSLATION_NAMESPACES
};