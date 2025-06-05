/**
 * Cryptographic utility functions for generating secure, time-variant API keys
 * using the Web Crypto SubtleCrypto API. These functions provide SHA-256 hash-based
 * key generation for authentication and provisioning workflows.
 * 
 * This module is compatible with both browser environments and Next.js serverless
 * runtime environments that support the Web Crypto API.
 * 
 * @example
 * ```typescript
 * import { generateApiKey } from '@/lib/utils/hash';
 * 
 * // Generate a secure API key for database service authentication
 * const apiKey = await generateApiKey('localhost', 'myapp');
 * console.log(apiKey); // "a1b2c3d4e5f6..."
 * ```
 */

/**
 * Generates a secure, time-variant API key using SHA-256 hashing.
 * 
 * This function combines the provided hostname, application name, and current
 * timestamp to create a unique hash-based API key. The time-variant nature
 * ensures that keys generated at different times will be unique, while the
 * SHA-256 algorithm provides cryptographic security.
 * 
 * The generated key is deterministic for the same inputs at the same timestamp,
 * making it suitable for authentication workflows where keys need to be
 * reproducible within a time window.
 * 
 * @param hostname - The hostname or domain identifier for the API key context.
 *                   Typically the server hostname or application domain.
 * @param appname - The application name or identifier for scoping the API key.
 *                  Used to differentiate keys between different applications.
 * 
 * @returns A Promise that resolves to a 64-character hexadecimal string
 *          representing the SHA-256 hash of the combined input data.
 * 
 * @throws {TypeError} When Web Crypto API is not available in the environment
 * @throws {DOMException} When the crypto.subtle.digest operation fails
 * 
 * @example
 * ```typescript
 * // Generate API key for database service authentication
 * const key = await generateApiKey('api.example.com', 'dreamfactory-admin');
 * 
 * // Use in authorization headers
 * const headers = {
 *   'X-API-Key': key,
 *   'Content-Type': 'application/json'
 * };
 * ```
 * 
 * @example
 * ```typescript
 * // Generate keys for different environments
 * const devKey = await generateApiKey('localhost:3000', 'dev-app');
 * const prodKey = await generateApiKey('app.company.com', 'prod-app');
 * ```
 * 
 * @since 1.0.0
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API} Web Crypto API Documentation
 */
export async function generateApiKey(hostname: string, appname: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${hostname}${appname}${Date.now()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}