/**
 * Language constants for DreamFactory Admin Interface internationalization
 * Defines supported languages and their display names for the React/Next.js implementation
 */

/**
 * Supported language codes based on the existing Angular i18n implementation
 * These correspond to the locale files in src/assets/i18n/
 */
export const SUPPORTED_LANGUAGE_CODES = ['en', 'de', 'fr', 'es'] as const;

/**
 * Type for supported language codes
 */
export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGE_CODES[number];

/**
 * Default fallback language when no preference is found or selected language is not supported
 */
export const DEFAULT_LANGUAGE: SupportedLanguageCode = 'en';

/**
 * Language display names mapping for the language selector UI
 * Maps language codes to their human-readable names in their native language
 */
export const SUPPORTED_LANGUAGES: Record<SupportedLanguageCode, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
} as const;

/**
 * Browser locale to supported language mapping
 * Maps common browser locale codes to our supported language codes
 */
export const LOCALE_MAPPING: Record<string, SupportedLanguageCode> = {
  // English variants
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'en-CA': 'en',
  'en-AU': 'en',
  
  // German variants
  'de': 'de',
  'de-DE': 'de',
  'de-AT': 'de',
  'de-CH': 'de',
  
  // French variants
  'fr': 'fr',
  'fr-FR': 'fr',
  'fr-CA': 'fr',
  'fr-BE': 'fr',
  'fr-CH': 'fr',
  
  // Spanish variants
  'es': 'es',
  'es-ES': 'es',
  'es-MX': 'es',
  'es-AR': 'es',
  'es-CO': 'es',
} as const;

/**
 * Local storage key for persisting user language preference
 */
export const LANGUAGE_STORAGE_KEY = 'dreamfactory-language-preference';

/**
 * Checks if a language code is supported by the application
 * @param languageCode - The language code to check
 * @returns True if the language is supported, false otherwise
 */
export function isSupportedLanguage(languageCode: string): languageCode is SupportedLanguageCode {
  return SUPPORTED_LANGUAGE_CODES.includes(languageCode as SupportedLanguageCode);
}

/**
 * Maps a browser locale to a supported language code
 * @param locale - The browser locale string
 * @returns The corresponding supported language code or null if not found
 */
export function mapLocaleToLanguage(locale: string): SupportedLanguageCode | null {
  // Direct match
  if (locale in LOCALE_MAPPING) {
    return LOCALE_MAPPING[locale];
  }
  
  // Try to match by language part only (e.g., 'en-IN' -> 'en')
  const languagePart = locale.split('-')[0];
  if (languagePart in LOCALE_MAPPING) {
    return LOCALE_MAPPING[languagePart];
  }
  
  return null;
}