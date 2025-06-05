/**
 * URL validation utilities for HTTP/HTTPS protocol compliance
 * 
 * This module provides URL validation functions that work consistently across
 * client-side React components and Next.js server-side contexts. Essential for
 * form validation, API request validation, and security checks throughout the
 * application.
 * 
 * @module URL Validation Utilities
 * @author DreamFactory Admin Interface
 */

/**
 * Validates that a URL string uses HTTP or HTTPS protocol and is properly formatted.
 * 
 * This function maintains exact compatibility with existing form validation patterns
 * and uses the native URL constructor for robust parsing. It ensures consistent
 * validation behavior across database connection forms, API endpoint configuration,
 * and other URL input fields throughout the application.
 * 
 * **Key Features:**
 * - Uses native URL constructor for standards-compliant parsing
 * - Validates HTTP/HTTPS protocol compliance for security
 * - Works in both browser and Node.js environments
 * - Compatible with React Hook Form and Zod schema validation
 * - Optimized for tree-shaking in Next.js build system
 * 
 * **Usage Examples:**
 * ```typescript
 * // Basic validation
 * isValidHttpUrl('https://api.example.com') // true
 * isValidHttpUrl('http://localhost:3306') // true
 * isValidHttpUrl('ftp://example.com') // false
 * isValidHttpUrl('not-a-url') // false
 * 
 * // In React Hook Form with Zod
 * const schema = z.object({
 *   host: z.string()
 *     .refine(isValidHttpUrl, 'Please enter a valid HTTP/HTTPS URL')
 * })
 * 
 * // In database connection validation
 * if (!isValidHttpUrl(connectionUrl)) {
 *   throw new Error('Database host must be a valid HTTP/HTTPS URL')
 * }
 * ```
 * 
 * @param url - The URL string to validate
 * @returns True if the URL is valid and uses HTTP/HTTPS protocol, false otherwise
 * 
 * @example
 * ```typescript
 * // Valid URLs
 * isValidHttpUrl('https://api.dreamfactory.com') // true
 * isValidHttpUrl('http://localhost:8080/api') // true
 * isValidHttpUrl('https://db.example.com:5432') // true
 * 
 * // Invalid URLs
 * isValidHttpUrl('ftp://example.com') // false (wrong protocol)
 * isValidHttpUrl('example.com') // false (no protocol)
 * isValidHttpUrl('') // false (empty string)
 * isValidHttpUrl('not-a-url') // false (malformed)
 * ```
 * 
 * @throws Never throws - returns false for any invalid input
 * 
 * @since 1.0.0
 * @category Validation
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/URL/URL | URL Constructor Documentation}
 */
export function isValidHttpUrl(url: string): boolean {
  // Handle edge cases early for performance
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return false;
  }

  try {
    // Use native URL constructor for standards-compliant parsing
    // This works consistently in both browser and Node.js environments
    const urlObject = new URL(url.trim());
    
    // Only allow HTTP and HTTPS protocols for security compliance
    // This ensures URLs can be safely used for API connections and
    // database services throughout the application
    return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
  } catch (error) {
    // URL constructor throws for malformed URLs
    // Return false for any parsing errors to maintain consistent behavior
    return false;
  }
}

/**
 * Validates that a URL string uses HTTPS protocol exclusively.
 * 
 * This function provides stricter validation for scenarios requiring
 * secure connections only. Useful for production API endpoints,
 * secure database connections, and other security-sensitive contexts.
 * 
 * @param url - The URL string to validate
 * @returns True if the URL is valid and uses HTTPS protocol, false otherwise
 * 
 * @example
 * ```typescript
 * isValidHttpsUrl('https://secure-api.example.com') // true
 * isValidHttpsUrl('http://insecure.example.com') // false
 * ```
 * 
 * @since 1.0.0
 * @category Validation
 */
export function isValidHttpsUrl(url: string): boolean {
  // Handle edge cases early
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return false;
  }

  try {
    const urlObject = new URL(url.trim());
    
    // Only allow HTTPS protocol for secure connections
    return urlObject.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Validates and normalizes a URL string for consistent usage.
 * 
 * This function validates the URL and returns a normalized version
 * with consistent formatting, or null if the URL is invalid.
 * 
 * @param url - The URL string to validate and normalize
 * @returns Normalized URL string or null if invalid
 * 
 * @example
 * ```typescript
 * normalizeHttpUrl('  https://API.Example.com/  ') // 'https://api.example.com/'
 * normalizeHttpUrl('invalid-url') // null
 * ```
 * 
 * @since 1.0.0
 * @category Validation
 */
export function normalizeHttpUrl(url: string): string | null {
  if (!isValidHttpUrl(url)) {
    return null;
  }

  try {
    // URL constructor automatically normalizes the URL
    const urlObject = new URL(url.trim());
    return urlObject.toString();
  } catch (error) {
    return null;
  }
}

/**
 * Type guard to check if a value is a valid HTTP/HTTPS URL string.
 * 
 * This function provides TypeScript type narrowing for URL validation,
 * useful in contexts where type safety is critical.
 * 
 * @param value - The value to check
 * @returns True if value is a valid HTTP/HTTPS URL string
 * 
 * @example
 * ```typescript
 * function processUrl(input: unknown) {
 *   if (isHttpUrl(input)) {
 *     // input is now typed as string and validated as HTTP/HTTPS URL
 *     console.log(input.length); // TypeScript knows this is safe
 *   }
 * }
 * ```
 * 
 * @since 1.0.0
 * @category Validation
 */
export function isHttpUrl(value: unknown): value is string {
  return typeof value === 'string' && isValidHttpUrl(value);
}

/**
 * Common URL validation error messages for consistent user feedback.
 * 
 * These predefined messages ensure consistent validation feedback
 * across all forms and validation contexts in the application.
 * 
 * @since 1.0.0
 * @category Constants
 */
export const URL_VALIDATION_MESSAGES = {
  REQUIRED: 'URL is required',
  INVALID_FORMAT: 'Please enter a valid HTTP or HTTPS URL',
  INVALID_PROTOCOL: 'URL must use HTTP or HTTPS protocol',
  HTTPS_REQUIRED: 'URL must use HTTPS protocol for secure connections',
  MALFORMED: 'URL format is invalid',
} as const;

/**
 * Type definition for URL validation error messages.
 * 
 * @since 1.0.0
 * @category Types
 */
export type URLValidationMessage = typeof URL_VALIDATION_MESSAGES[keyof typeof URL_VALIDATION_MESSAGES];