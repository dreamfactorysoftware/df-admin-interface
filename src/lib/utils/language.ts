/**
 * Language detection utility for DreamFactory Admin Interface
 * Provides browser language detection with localStorage persistence and fallback handling
 * Compatible with Next.js SSR/CSR contexts and React component lifecycle
 */

import {
  SUPPORTED_LANGUAGE_CODES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LOCALE_MAPPING,
  isSupportedLanguage,
  mapLocaleToLanguage,
  type SupportedLanguageCode,
} from '../constants/languages';

/**
 * Detects the user's preferred language based on localStorage, browser settings, and fallbacks.
 * Handles both server-side rendering (SSR) and client-side rendering (CSR) contexts.
 * 
 * Priority order:
 * 1. Stored user preference in localStorage (CSR only)
 * 2. Browser navigator.language settings (CSR only)
 * 3. Default language fallback
 * 
 * @returns {SupportedLanguageCode} The detected or default language code
 * 
 * @example
 * ```typescript
 * // In a React component
 * const userLanguage = detectUserLanguage();
 * console.log(userLanguage); // 'en', 'de', 'fr', or 'es'
 * 
 * // In a Next.js server component context
 * const serverLanguage = detectUserLanguage(); // Returns DEFAULT_LANGUAGE ('en')
 * ```
 */
export function detectUserLanguage(): SupportedLanguageCode {
  // Check if we're in a browser environment (CSR)
  if (typeof window !== 'undefined') {
    try {
      // Priority 1: Check localStorage for saved preference
      const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLanguage && isSupportedLanguage(storedLanguage)) {
        return storedLanguage;
      }

      // Priority 2: Check browser language preferences
      const browserLanguages = navigator.languages || [navigator.language];
      
      for (const locale of browserLanguages) {
        const mappedLanguage = mapLocaleToLanguage(locale);
        if (mappedLanguage) {
          // Save the detected language for future use
          localStorage.setItem(LANGUAGE_STORAGE_KEY, mappedLanguage);
          return mappedLanguage;
        }
      }
    } catch (error) {
      // Handle localStorage access errors (e.g., disabled cookies/storage)
      console.warn('Failed to access localStorage for language detection:', error);
    }
  }

  // Priority 3: Return default language (SSR context or no matches found)
  return DEFAULT_LANGUAGE;
}

/**
 * Sets the user's language preference and persists it to localStorage.
 * Only works in client-side context (CSR). Safe to call in SSR context (no-op).
 * 
 * @param {SupportedLanguageCode} languageCode - The language code to set
 * @returns {boolean} True if the language was successfully saved, false otherwise
 * 
 * @example
 * ```typescript
 * // In a language selector component
 * const handleLanguageChange = (newLanguage: SupportedLanguageCode) => {
 *   const success = setUserLanguage(newLanguage);
 *   if (success) {
 *     // Trigger UI update or reload
 *     window.location.reload();
 *   }
 * };
 * ```
 */
export function setUserLanguage(languageCode: SupportedLanguageCode): boolean {
  // Validate the language code
  if (!isSupportedLanguage(languageCode)) {
    console.warn(`Unsupported language code: ${languageCode}`);
    return false;
  }

  // Only proceed in browser environment
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      return true;
    } catch (error) {
      console.warn('Failed to save language preference to localStorage:', error);
      return false;
    }
  }

  // SSR context - cannot save to localStorage
  return false;
}

/**
 * Gets the currently stored language preference from localStorage.
 * Returns null if no preference is stored or if called in SSR context.
 * 
 * @returns {SupportedLanguageCode | null} The stored language code or null
 * 
 * @example
 * ```typescript
 * // Check if user has a saved preference
 * const savedLanguage = getStoredLanguage();
 * if (savedLanguage) {
 *   console.log(`User prefers: ${savedLanguage}`);
 * } else {
 *   console.log('No language preference saved');
 * }
 * ```
 */
export function getStoredLanguage(): SupportedLanguageCode | null {
  if (typeof window !== 'undefined') {
    try {
      const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return storedLanguage && isSupportedLanguage(storedLanguage) ? storedLanguage : null;
    } catch (error) {
      console.warn('Failed to read language preference from localStorage:', error);
    }
  }
  return null;
}

/**
 * Clears the stored language preference from localStorage.
 * Only works in client-side context (CSR). Safe to call in SSR context (no-op).
 * 
 * @returns {boolean} True if the preference was successfully cleared, false otherwise
 * 
 * @example
 * ```typescript
 * // Reset to browser default language detection
 * const handleResetLanguage = () => {
 *   const success = clearStoredLanguage();
 *   if (success) {
 *     // Re-detect language based on browser settings
 *     const newLanguage = detectUserLanguage();
 *     console.log(`Reset to: ${newLanguage}`);
 *   }
 * };
 * ```
 */
export function clearStoredLanguage(): boolean {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LANGUAGE_STORAGE_KEY);
      return true;
    } catch (error) {
      console.warn('Failed to clear language preference from localStorage:', error);
      return false;
    }
  }
  return false;
}

/**
 * Gets all browser language preferences in order of preference.
 * Returns an empty array in SSR context.
 * 
 * @returns {string[]} Array of browser language/locale codes in preference order
 * 
 * @example
 * ```typescript
 * // Debug language detection
 * const browserLanguages = getBrowserLanguages();
 * console.log('Browser languages:', browserLanguages);
 * // Output: ['en-US', 'en', 'fr-FR', 'fr']
 * ```
 */
export function getBrowserLanguages(): string[] {
  if (typeof window !== 'undefined' && navigator.languages) {
    return Array.from(navigator.languages);
  }
  return [];
}

/**
 * Hook-like function for React components to get language with SSR safety.
 * This function can be used directly in React components and will handle
 * both server-side and client-side rendering contexts appropriately.
 * 
 * @param {boolean} forceClientSide - If true, only returns language in client context
 * @returns {SupportedLanguageCode | null} Language code or null in SSR when forceClientSide is true
 * 
 * @example
 * ```typescript
 * // In a React component
 * const MyComponent = () => {
 *   const language = getLanguageForComponent();
 *   
 *   return (
 *     <div>
 *       Current language: {language}
 *     </div>
 *   );
 * };
 * 
 * // For client-only language detection
 * const ClientOnlyComponent = () => {
 *   const language = getLanguageForComponent(true);
 *   
 *   if (!language) {
 *     return <div>Loading language...</div>;
 *   }
 *   
 *   return <div>Client language: {language}</div>;
 * };
 * ```
 */
export function getLanguageForComponent(forceClientSide: boolean = false): SupportedLanguageCode | null {
  if (forceClientSide && typeof window === 'undefined') {
    return null;
  }
  return detectUserLanguage();
}

/**
 * Utility function to check if the current context is client-side (browser).
 * Useful for conditional rendering based on environment.
 * 
 * @returns {boolean} True if running in browser context, false in server context
 * 
 * @example
 * ```typescript
 * // Conditional language features
 * const LanguageSelector = () => {
 *   const isClient = isClientSide();
 *   const currentLanguage = detectUserLanguage();
 *   
 *   return (
 *     <div>
 *       <span>Current: {currentLanguage}</span>
 *       {isClient && (
 *         <button onClick={() => setUserLanguage('fr')}>
 *           Switch to French
 *         </button>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 */
export function isClientSide(): boolean {
  return typeof window !== 'undefined';
}

// Re-export types and constants for convenience
export type { SupportedLanguageCode };
export {
  SUPPORTED_LANGUAGE_CODES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
} from '../constants/languages';