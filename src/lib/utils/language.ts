/**
 * Language detection utility for DreamFactory Admin Interface
 * Provides browser language detection with localStorage persistence and fallback handling
 * Compatible with Next.js SSR and client-side rendering contexts
 */

import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_LANGUAGE_CODES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LOCALE_MAPPING,
  isSupportedLanguage,
  mapLocaleToLanguage,
  type SupportedLanguageCode,
} from '../constants/languages';

/**
 * Language detection result containing the detected language and source
 */
export interface LanguageDetectionResult {
  /** The detected or fallback language code */
  language: SupportedLanguageCode;
  /** The source of the language detection */
  source: 'localStorage' | 'navigator' | 'fallback';
  /** Whether this is the user's preferred language (not fallback) */
  isPreferred: boolean;
}

/**
 * Detects the user's preferred language with comprehensive fallback logic
 * 
 * Detection order:
 * 1. User's saved preference in localStorage
 * 2. Browser's navigator.language preference
 * 3. Browser's navigator.languages array
 * 4. Default fallback language (English)
 * 
 * @returns Language detection result with language code and source information
 * 
 * @example
 * ```typescript
 * // In a React component
 * const { language, source, isPreferred } = detectUserLanguage();
 * console.log(`Detected language: ${language} from ${source}`);
 * 
 * // Check if it's a user preference vs fallback
 * if (isPreferred) {
 *   console.log('Using user preferred language');
 * } else {
 *   console.log('Using fallback language');
 * }
 * ```
 */
export function detectUserLanguage(): LanguageDetectionResult {
  // SSR safety check - return default during server-side rendering
  if (typeof window === 'undefined') {
    return {
      language: DEFAULT_LANGUAGE,
      source: 'fallback',
      isPreferred: false,
    };
  }

  try {
    // 1. Check localStorage for saved user preference
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && isSupportedLanguage(savedLanguage)) {
      return {
        language: savedLanguage,
        source: 'localStorage',
        isPreferred: true,
      };
    }
  } catch (error) {
    // localStorage might not be available (incognito mode, etc.)
    console.warn('Failed to access localStorage for language preference:', error);
  }

  // 2. Check browser's primary language preference
  if (navigator.language) {
    const mappedLanguage = mapLocaleToLanguage(navigator.language);
    if (mappedLanguage) {
      return {
        language: mappedLanguage,
        source: 'navigator',
        isPreferred: true,
      };
    }
  }

  // 3. Check browser's language preferences array
  if (navigator.languages && navigator.languages.length > 0) {
    for (const browserLanguage of navigator.languages) {
      const mappedLanguage = mapLocaleToLanguage(browserLanguage);
      if (mappedLanguage) {
        return {
          language: mappedLanguage,
          source: 'navigator',
          isPreferred: true,
        };
      }
    }
  }

  // 4. Fallback to default language
  return {
    language: DEFAULT_LANGUAGE,
    source: 'fallback',
    isPreferred: false,
  };
}

/**
 * Saves the user's language preference to localStorage
 * 
 * @param language - The language code to save
 * @returns True if successfully saved, false otherwise
 * 
 * @example
 * ```typescript
 * // Save user's language choice
 * const success = saveLanguagePreference('fr');
 * if (success) {
 *   console.log('Language preference saved');
 * }
 * ```
 */
export function saveLanguagePreference(language: SupportedLanguageCode): boolean {
  // SSR safety check
  if (typeof window === 'undefined') {
    return false;
  }

  if (!isSupportedLanguage(language)) {
    console.warn(`Attempted to save unsupported language: ${language}`);
    return false;
  }

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    return true;
  } catch (error) {
    console.error('Failed to save language preference:', error);
    return false;
  }
}

/**
 * Clears the saved language preference from localStorage
 * 
 * @returns True if successfully cleared, false otherwise
 * 
 * @example
 * ```typescript
 * // Reset to browser default
 * clearLanguagePreference();
 * const { language } = detectUserLanguage(); // Will use browser/fallback detection
 * ```
 */
export function clearLanguagePreference(): boolean {
  // SSR safety check
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear language preference:', error);
    return false;
  }
}

/**
 * Gets the saved language preference from localStorage without fallback detection
 * 
 * @returns The saved language code or null if none saved or invalid
 * 
 * @example
 * ```typescript
 * const savedLang = getSavedLanguagePreference();
 * if (savedLang) {
 *   console.log(`User has saved preference: ${savedLang}`);
 * } else {
 *   console.log('No saved language preference');
 * }
 * ```
 */
export function getSavedLanguagePreference(): SupportedLanguageCode | null {
  // SSR safety check
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage && isSupportedLanguage(savedLanguage) ? savedLanguage : null;
  } catch (error) {
    console.warn('Failed to get saved language preference:', error);
    return null;
  }
}

/**
 * Gets the browser's preferred language without localStorage consideration
 * Used for detecting browser language changes or initial setup
 * 
 * @returns The browser's preferred language code or default if not supported
 * 
 * @example
 * ```typescript
 * const browserLang = getBrowserLanguage();
 * console.log(`Browser prefers: ${browserLang}`);
 * ```
 */
export function getBrowserLanguage(): SupportedLanguageCode {
  // SSR safety check
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  // Check primary browser language
  if (navigator.language) {
    const mappedLanguage = mapLocaleToLanguage(navigator.language);
    if (mappedLanguage) {
      return mappedLanguage;
    }
  }

  // Check language preferences array
  if (navigator.languages && navigator.languages.length > 0) {
    for (const browserLanguage of navigator.languages) {
      const mappedLanguage = mapLocaleToLanguage(browserLanguage);
      if (mappedLanguage) {
        return mappedLanguage;
      }
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Validates if a language code is supported and returns it, or the default language
 * Useful for URL parameters or API responses that may contain invalid language codes
 * 
 * @param language - The language code to validate
 * @returns A valid supported language code
 * 
 * @example
 * ```typescript
 * // From URL parameter or API
 * const urlLang = searchParams.get('lang');
 * const validLang = validateLanguageCode(urlLang);
 * ```
 */
export function validateLanguageCode(language: string | null | undefined): SupportedLanguageCode {
  if (language && isSupportedLanguage(language)) {
    return language;
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Creates a language change handler for React components
 * Combines language validation, preference saving, and change notification
 * 
 * @param onLanguageChange - Callback function to handle language changes
 * @returns A function that handles language changes with validation and persistence
 * 
 * @example
 * ```typescript
 * // In a React component
 * const handleLanguageChange = createLanguageChangeHandler((newLang) => {
 *   // Update app state, reload translations, etc.
 *   setCurrentLanguage(newLang);
 *   router.push(router.asPath, router.asPath, { locale: newLang });
 * });
 * 
 * // Use in language selector
 * <select onChange={(e) => handleLanguageChange(e.target.value)}>
 *   {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
 *     <option key={code} value={code}>{name}</option>
 *   ))}
 * </select>
 * ```
 */
export function createLanguageChangeHandler(
  onLanguageChange: (language: SupportedLanguageCode) => void
) {
  return (language: string) => {
    const validLanguage = validateLanguageCode(language);
    const saved = saveLanguagePreference(validLanguage);
    
    if (saved) {
      onLanguageChange(validLanguage);
    } else {
      console.warn('Failed to save language preference, but proceeding with change');
      onLanguageChange(validLanguage);
    }
  };
}

// Re-export constants for convenience
export {
  SUPPORTED_LANGUAGES,
  SUPPORTED_LANGUAGE_CODES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  type SupportedLanguageCode,
};