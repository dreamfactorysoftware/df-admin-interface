/**
 * Central i18n index file for DreamFactory Admin Interface
 * 
 * This file provides a unified export structure for all translation namespaces
 * and enables type-safe access to translation keys throughout the Next.js application.
 * It replaces Angular's ngx-translate module pattern with Next.js dynamic import
 * structure while maintaining server-side rendering compatibility.
 * 
 * Features:
 * - Unified export structure for all translation namespaces
 * - Type-safe translation key access with TypeScript interfaces
 * - Dynamic loading for feature-specific translation modules
 * - Server-side rendering compatibility for Next.js
 * - Optimized loading strategy for better performance
 * 
 * @see Section 0.2.1 - i18n migration requirements
 * @see React/Next.js Integration Requirements - SSR support
 * @see Section 8.2.4 - Asset optimization strategy
 */

// ============================================================================
// TYPE IMPORTS
// ============================================================================

import type {
  RootTranslations,
  ModuleTranslations,
  CompleteTranslations,
  TranslationKey,
  RootTranslationKey,
  ModuleTranslationKey,
  TranslationNamespace,
  TranslationVariables,
  UseTranslationReturn,
  TranslationProviderConfig,
  TranslationAwareProps,
  FormComponentTranslationProps,
  AllTranslationKeys
} from './types';

// ============================================================================
// CORE TRANSLATION IMPORTS
// ============================================================================

/**
 * Main English translations from central en.json file
 * These contain common UI elements, navigation, and core functionality
 */
import coreTranslations from './en.json';

// ============================================================================
// TRANSLATION NAMESPACE MAPPING
// ============================================================================

/**
 * Mapping of translation namespaces to their dynamic import paths
 * This enables lazy loading of feature-specific translations for better performance
 */
const TRANSLATION_NAMESPACE_MAP = {
  // Feature-specific translation modules
  users: () => import('./users/en.json'),
  services: () => import('./services/en.json'),
  admins: () => import('./admins/en.json'),
  apiDocs: () => import('./apiDocs/en.json'),
  cache: () => import('./cache/en.json'),
  cors: () => import('./cors/en.json'),
  emailTemplates: () => import('./emailTemplates/en.json'),
  files: () => import('./files/en.json'),
  home: () => import('./home/en.json'),
  limits: () => import('./limits/en.json'),
  roles: () => import('./roles/en.json'),
  scheduler: () => import('./scheduler/en.json'),
  schema: () => import('./schema/en.json'),
  scripts: () => import('./scripts/en.json'),
  systemInfo: () => import('./systemInfo/en.json'),
  userManagement: () => import('./userManagement/en.json'),
  apps: () => import('./apps/en.json'),
} as const;

/**
 * Type-safe namespace keys extracted from the mapping
 */
export type AvailableNamespace = keyof typeof TRANSLATION_NAMESPACE_MAP;

// ============================================================================
// TRANSLATION CACHE
// ============================================================================

/**
 * In-memory cache for loaded translation modules
 * Prevents redundant dynamic imports and improves performance
 */
const translationCache = new Map<string, any>();

/**
 * Server-side translation cache for SSR compatibility
 * Ensures translations are available during server-side rendering
 */
const serverTranslationCache = new Map<string, any>();

// ============================================================================
// DYNAMIC TRANSLATION LOADING
// ============================================================================

/**
 * Dynamically loads a translation namespace with caching
 * Supports both client-side and server-side rendering
 * 
 * @param namespace - The translation namespace to load
 * @returns Promise resolving to the translation module
 */
export async function loadTranslationNamespace<T extends AvailableNamespace>(
  namespace: T
): Promise<ModuleTranslations[T]> {
  // Check cache first for performance
  const cacheKey = `namespace_${namespace}`;
  
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }
  
  try {
    const moduleLoader = TRANSLATION_NAMESPACE_MAP[namespace];
    if (!moduleLoader) {
      throw new Error(`Translation namespace '${namespace}' not found`);
    }
    
    // Dynamic import with error handling
    const module = await moduleLoader();
    const translations = module.default || module;
    
    // Cache the loaded translations
    translationCache.set(cacheKey, translations);
    
    // Also cache on server-side for SSR
    if (typeof window === 'undefined') {
      serverTranslationCache.set(cacheKey, translations);
    }
    
    return translations;
  } catch (error) {
    console.error(`Failed to load translation namespace '${namespace}':`, error);
    // Return empty object as fallback to prevent runtime errors
    return {} as ModuleTranslations[T];
  }
}

/**
 * Preloads multiple translation namespaces for better performance
 * Useful for critical app sections that need immediate translation access
 * 
 * @param namespaces - Array of namespaces to preload
 * @returns Promise resolving when all namespaces are loaded
 */
export async function preloadTranslationNamespaces(
  namespaces: AvailableNamespace[]
): Promise<void> {
  try {
    await Promise.all(
      namespaces.map(namespace => loadTranslationNamespace(namespace))
    );
  } catch (error) {
    console.error('Failed to preload translation namespaces:', error);
  }
}

/**
 * Gets all available translation namespace keys
 * Useful for dynamic translation loading scenarios
 */
export function getAvailableNamespaces(): AvailableNamespace[] {
  return Object.keys(TRANSLATION_NAMESPACE_MAP) as AvailableNamespace[];
}

// ============================================================================
// CORE TRANSLATIONS EXPORT
// ============================================================================

/**
 * Core translations immediately available (no dynamic loading required)
 * These include common UI elements, navigation, and essential functionality
 */
export const coreTranslations: RootTranslations = coreTranslations as RootTranslations;

/**
 * Combined translations object that merges core and dynamically loaded modules
 * This is populated as modules are loaded and provides a unified interface
 */
let combinedTranslations: Partial<CompleteTranslations> = {
  ...coreTranslations
} as Partial<CompleteTranslations>;

// ============================================================================
// TRANSLATION ACCESS UTILITIES
// ============================================================================

/**
 * Type-safe translation key resolver with interpolation support
 * Supports nested key access with dot notation and variable substitution
 * 
 * @param key - Translation key with dot notation support
 * @param variables - Optional variables for interpolation
 * @param fallback - Fallback text if translation not found
 * @returns Translated string with interpolated variables
 */
export function getTranslation(
  key: AllTranslationKeys | string,
  variables?: TranslationVariables,
  fallback?: string
): string {
  try {
    // Split key by dots to access nested properties
    const keyParts = key.split('.');
    let result: any = combinedTranslations;
    
    // Navigate through nested object structure
    for (const part of keyParts) {
      if (result && typeof result === 'object' && part in result) {
        result = result[part];
      } else {
        // Key not found, return fallback or key itself
        return fallback || key;
      }
    }
    
    // Ensure we have a string result
    if (typeof result !== 'string') {
      return fallback || key;
    }
    
    // Perform variable interpolation if variables provided
    if (variables) {
      return interpolateTranslation(result, variables);
    }
    
    return result;
  } catch (error) {
    console.error(`Translation error for key '${key}':`, error);
    return fallback || key;
  }
}

/**
 * Interpolates variables into translation strings
 * Supports {{variableName}} syntax for variable substitution
 * 
 * @param text - Translation text with variable placeholders
 * @param variables - Variables to interpolate
 * @returns Text with interpolated variables
 */
function interpolateTranslation(
  text: string,
  variables: TranslationVariables
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Checks if a translation key exists in the loaded translations
 * Useful for conditional rendering based on translation availability
 * 
 * @param key - Translation key to check
 * @returns True if key exists, false otherwise
 */
export function hasTranslation(key: string): boolean {
  try {
    const keyParts = key.split('.');
    let result: any = combinedTranslations;
    
    for (const part of keyParts) {
      if (result && typeof result === 'object' && part in result) {
        result = result[part];
      } else {
        return false;
      }
    }
    
    return typeof result === 'string';
  } catch {
    return false;
  }
}

// ============================================================================
// NEXT.JS INTEGRATION UTILITIES
// ============================================================================

/**
 * Creates a translation function with namespace context
 * Optimized for Next.js components and hooks
 * 
 * @param namespace - Optional namespace to scope translations
 * @returns Translation function with namespace context
 */
export function createNamespacedTranslation(namespace?: string) {
  return function t(
    key: string,
    variables?: TranslationVariables,
    fallback?: string
  ): string {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return getTranslation(fullKey, variables, fallback);
  };
}

/**
 * Server-side rendering compatible translation getter
 * Ensures translations are available during SSR without client-side hydration mismatches
 * 
 * @param key - Translation key
 * @param variables - Optional interpolation variables
 * @param fallback - Fallback text
 * @returns Promise resolving to translated text
 */
export async function getTranslationSSR(
  key: string,
  variables?: TranslationVariables,
  fallback?: string
): Promise<string> {
  // Check if we're in server environment
  if (typeof window === 'undefined') {
    // On server, ensure core translations are available
    const result = getTranslation(key, variables, fallback);
    return result;
  }
  
  // On client, use regular translation function
  return getTranslation(key, variables, fallback);
}

/**
 * Registers a translation module in the combined translations object
 * Used internally when dynamic modules are loaded
 * 
 * @param namespace - The namespace to register
 * @param translations - The translation object to register
 */
export function registerTranslationModule(
  namespace: string,
  translations: any
): void {
  if (combinedTranslations) {
    (combinedTranslations as any)[namespace] = translations;
  }
}

// ============================================================================
// REACT HOOK INTEGRATION
// ============================================================================

/**
 * Translation state interface for React hooks
 */
interface TranslationState {
  translations: Partial<CompleteTranslations>;
  loadedNamespaces: Set<string>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Initial translation state
 */
export const initialTranslationState: TranslationState = {
  translations: combinedTranslations,
  loadedNamespaces: new Set(['core']),
  isLoading: false,
  error: null,
};

/**
 * Hook factory for creating translation-aware React hooks
 * Provides the foundation for useTranslation and related hooks
 * 
 * @param namespace - Optional namespace to automatically load
 * @returns Translation state and utilities
 */
export function createTranslationHook(namespace?: string) {
  return {
    getTranslation,
    hasTranslation,
    loadTranslationNamespace,
    preloadTranslationNamespaces,
    createNamespacedTranslation: () => createNamespacedTranslation(namespace),
    getAvailableNamespaces,
  };
}

// ============================================================================
// CONFIGURATION AND SETUP
// ============================================================================

/**
 * Default translation provider configuration
 * Optimized for Next.js SSR and performance
 */
export const defaultTranslationConfig: TranslationProviderConfig = {
  defaultLocale: 'en',
  supportedLocales: ['en'],
  basePath: '/assets/i18n',
  fallbackLocale: 'en',
  debug: process.env.NODE_ENV === 'development',
  cacheStrategy: 'memory',
};

/**
 * Initializes the translation system for Next.js application
 * Sets up caching, preloading, and SSR compatibility
 * 
 * @param config - Optional configuration overrides
 * @returns Promise resolving when initialization is complete
 */
export async function initializeTranslations(
  config: Partial<TranslationProviderConfig> = {}
): Promise<void> {
  const finalConfig = { ...defaultTranslationConfig, ...config };
  
  try {
    // Preload critical translation namespaces for better performance
    const criticalNamespaces: AvailableNamespace[] = [
      'services',
      'schema',
      'users',
      'admins'
    ];
    
    if (finalConfig.debug) {
      console.log('Initializing translation system with config:', finalConfig);
      console.log('Preloading critical namespaces:', criticalNamespaces);
    }
    
    // Preload critical namespaces
    await preloadTranslationNamespaces(criticalNamespaces);
    
    if (finalConfig.debug) {
      console.log('Translation system initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize translation system:', error);
    throw error;
  }
}

// ============================================================================
// VALIDATION AND UTILITIES
// ============================================================================

/**
 * Validates that all required translation keys exist
 * Useful for build-time validation and testing
 * 
 * @param requiredKeys - Array of keys that must exist
 * @returns Array of missing keys
 */
export function validateTranslationKeys(requiredKeys: string[]): string[] {
  const missingKeys: string[] = [];
  
  for (const key of requiredKeys) {
    if (!hasTranslation(key)) {
      missingKeys.push(key);
    }
  }
  
  return missingKeys;
}

/**
 * Gets translation statistics for debugging and monitoring
 * Provides insight into loaded namespaces and cache usage
 */
export function getTranslationStats() {
  return {
    cacheSize: translationCache.size,
    serverCacheSize: serverTranslationCache.size,
    loadedNamespaces: Array.from(translationCache.keys()),
    availableNamespaces: getAvailableNamespaces(),
    coreTranslationsLoaded: !!coreTranslations,
  };
}

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

/**
 * Default export provides the core translation functions
 * Optimized for tree-shaking and Next.js integration
 */
export default {
  // Core functionality
  getTranslation,
  hasTranslation,
  getTranslationSSR,
  
  // Dynamic loading
  loadTranslationNamespace,
  preloadTranslationNamespaces,
  
  // Utilities
  createNamespacedTranslation,
  getAvailableNamespaces,
  validateTranslationKeys,
  getTranslationStats,
  
  // Setup
  initializeTranslations,
  defaultTranslationConfig,
  
  // State
  initialTranslationState,
  createTranslationHook,
  
  // Core translations
  coreTranslations,
} as const;

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

/**
 * Re-export types for easy importing in components
 */
export type {
  RootTranslations,
  ModuleTranslations,
  CompleteTranslations,
  TranslationKey,
  RootTranslationKey,
  ModuleTranslationKey,
  TranslationNamespace,
  TranslationVariables,
  UseTranslationReturn,
  TranslationProviderConfig,
  TranslationAwareProps,
  FormComponentTranslationProps,
  AllTranslationKeys,
  AvailableNamespace
};

/**
 * Namespace mapping re-export for external usage
 */
export { TRANSLATION_NAMESPACE_MAP };