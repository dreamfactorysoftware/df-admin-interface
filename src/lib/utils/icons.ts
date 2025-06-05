/**
 * FontAwesome Brand Icon Management Utility
 * 
 * Provides centralized mapping and retrieval functions for social login buttons
 * and brand integrations. Optimized for React FontAwesome components with
 * proper tree-shaking support and TypeScript inference.
 * 
 * @example
 * ```tsx
 * import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
 * import { getIcon, iconExist } from '@/lib/utils/icons';
 * 
 * function SocialLoginButton({ provider }: { provider: string }) {
 *   if (!iconExist(provider)) {
 *     return <span>Unknown provider</span>;
 *   }
 *   
 *   return (
 *     <FontAwesomeIcon 
 *       icon={getIcon(provider)} 
 *       className="w-5 h-5" 
 *     />
 *   );
 * }
 * ```
 */

import type { IconDefinition } from '@fortawesome/free-brands-svg-icons';
import {
  faGithub,
  faGoogle,
  faMicrosoft,
  faAmazon,
  faApple,
  faLinkedin,
  faBitbucket,
  faFacebook,
  faSalesforce,
  faTwitch,
  faOpenid,
} from '@fortawesome/free-brands-svg-icons';

/**
 * Type definition for supported social login providers
 */
export type SupportedIconKey = 
  | 'google'
  | 'github'
  | 'microsoft'
  | 'amazon'
  | 'apple'
  | 'linkedin'
  | 'bitbucket'
  | 'facebook'
  | 'salesforce'
  | 'twitch'
  | 'openid';

/**
 * Read-only registry of supported brand icons mapped to FontAwesome icon definitions.
 * 
 * Used for social login integrations, brand displays, and authentication workflows
 * throughout the DreamFactory Admin Interface.
 * 
 * @readonly
 */
const supportedIcons: Readonly<Record<SupportedIconKey, IconDefinition>> = {
  google: faGoogle,
  github: faGithub,
  microsoft: faMicrosoft,
  amazon: faAmazon,
  apple: faApple,
  linkedin: faLinkedin,
  bitbucket: faBitbucket,
  facebook: faFacebook,
  salesforce: faSalesforce,
  twitch: faTwitch,
  openid: faOpenid,
} as const;

/**
 * Validates whether a given icon key exists in the supported icons registry.
 * 
 * Provides type-safe validation for social login providers and brand icons
 * before attempting to render them in React components.
 * 
 * @param icon - The icon key to validate
 * @returns True if the icon exists in the supported registry, false otherwise
 * 
 * @example
 * ```tsx
 * if (iconExist('google')) {
 *   // Safe to use getIcon('google')
 *   return <FontAwesomeIcon icon={getIcon('google')} />;
 * }
 * ```
 */
export function iconExist(icon: string): icon is SupportedIconKey {
  return (Object.keys(supportedIcons) as SupportedIconKey[]).includes(icon as SupportedIconKey);
}

/**
 * Retrieves a FontAwesome icon definition for the specified provider key.
 * 
 * Returns the FontAwesome IconDefinition that can be directly used with
 * the @fortawesome/react-fontawesome FontAwesomeIcon component.
 * 
 * @param icon - The icon key to retrieve
 * @returns The FontAwesome IconDefinition for the specified provider
 * @throws {Error} When the icon key is not found in the supported registry
 * 
 * @example
 * ```tsx
 * import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
 * 
 * const googleIcon = getIcon('google');
 * return <FontAwesomeIcon icon={googleIcon} className="w-6 h-6" />;
 * ```
 */
export function getIcon(icon: SupportedIconKey): IconDefinition;
export function getIcon(icon: string): IconDefinition | undefined;
export function getIcon(icon: string): IconDefinition | undefined {
  if (!iconExist(icon)) {
    // For TypeScript safety, return undefined for unknown icons
    // Calling code should use iconExist() first for validation
    return undefined;
  }
  
  return supportedIcons[icon];
}

/**
 * Returns an array of all supported icon keys.
 * 
 * Useful for generating dynamic UI elements, validation schemas,
 * and providing autocomplete suggestions for social login providers.
 * 
 * @returns Array of all supported icon keys
 * 
 * @example
 * ```tsx
 * const availableProviders = getSupportedIconKeys();
 * // ['google', 'github', 'microsoft', ...]
 * ```
 */
export function getSupportedIconKeys(): readonly SupportedIconKey[] {
  return Object.keys(supportedIcons) as SupportedIconKey[];
}

/**
 * Returns the complete read-only icon registry.
 * 
 * Provides access to the full mapping for advanced use cases such as
 * batch icon loading, provider enumeration, or testing scenarios.
 * 
 * @returns Read-only record of all supported icons
 * 
 * @example
 * ```tsx
 * const allIcons = getIconRegistry();
 * Object.entries(allIcons).forEach(([key, icon]) => {
 *   console.log(`Provider: ${key}, Icon:`, icon);
 * });
 * ```
 */
export function getIconRegistry(): Readonly<Record<SupportedIconKey, IconDefinition>> {
  return supportedIcons;
}

/**
 * Type guard to check if a value is a valid icon key with full type safety.
 * 
 * More explicit alternative to iconExist() for cases where TypeScript
 * type narrowing is critical.
 * 
 * @param value - Any value to check
 * @returns True if value is a supported icon key, false otherwise
 */
export function isSupportedIconKey(value: unknown): value is SupportedIconKey {
  return typeof value === 'string' && iconExist(value);
}