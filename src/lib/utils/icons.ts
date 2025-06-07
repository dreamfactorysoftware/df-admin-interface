/**
 * FontAwesome Brand Icon Management Utility
 * 
 * Provides centralized mapping and retrieval functions for brand icons used in social login buttons
 * and brand integrations. This utility maintains compatibility with React FontAwesome components
 * while supporting efficient tree-shaking in Next.js builds.
 * 
 * @example
 * ```tsx
 * import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
 * import { iconExist, getIcon } from '@/lib/utils/icons';
 * 
 * function SocialLoginButton({ provider }: { provider: string }) {
 *   if (!iconExist(provider)) {
 *     return null;
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
  type IconDefinition,
} from '@fortawesome/free-brands-svg-icons';

/**
 * Registry of supported brand icons for social authentication and integrations.
 * 
 * This mapping provides a stable interface between string identifiers used in
 * authentication configurations and FontAwesome icon definitions. The registry
 * is designed to support tree-shaking - only imported icons will be included
 * in the final bundle.
 * 
 * @readonly
 */
const supportedIcons: Readonly<Record<string, IconDefinition>> = {
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
 * Type representing all available icon identifiers.
 * Derived from the supportedIcons registry to ensure type safety.
 */
export type SupportedIconKey = keyof typeof supportedIcons;

/**
 * Array of all supported icon keys for iteration and validation.
 * Useful for generating UI lists or validation schemas.
 */
export const supportedIconKeys = Object.keys(supportedIcons) as SupportedIconKey[];

/**
 * Checks if a given icon identifier exists in the supported icons registry.
 * 
 * This function provides runtime validation for icon identifiers, which is
 * particularly useful when working with dynamic configurations or user input.
 * 
 * @param icon - The icon identifier to check
 * @returns True if the icon exists in the registry, false otherwise
 * 
 * @example
 * ```ts
 * if (iconExist('google')) {
 *   // Safe to use the google icon
 *   const googleIcon = getIcon('google');
 * }
 * 
 * // Type-safe usage with supported keys
 * const provider: SupportedIconKey = 'github';
 * if (iconExist(provider)) {
 *   // This will always be true for SupportedIconKey types
 * }
 * ```
 */
export function iconExist(icon: string): icon is SupportedIconKey {
  return Object.prototype.hasOwnProperty.call(supportedIcons, icon);
}

/**
 * Retrieves the FontAwesome icon definition for a given identifier.
 * 
 * This function returns the actual IconDefinition object that can be used
 * with React FontAwesome components. It's designed to work efficiently with
 * the @fortawesome/react-fontawesome library.
 * 
 * @param icon - The icon identifier to retrieve
 * @returns The FontAwesome IconDefinition object, or undefined if not found
 * 
 * @example
 * ```tsx
 * import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
 * 
 * function AuthButton({ provider }: { provider: string }) {
 *   const iconDef = getIcon(provider);
 *   
 *   if (!iconDef) {
 *     return <span>Unsupported provider</span>;
 *   }
 *   
 *   return (
 *     <button>
 *       <FontAwesomeIcon icon={iconDef} />
 *       Sign in with {provider}
 *     </button>
 *   );
 * }
 * ```
 */
export function getIcon(icon: string): IconDefinition | undefined {
  return supportedIcons[icon];
}

/**
 * Type-safe version of getIcon for when you know the icon exists.
 * 
 * This overload provides better TypeScript inference when using
 * SupportedIconKey types, eliminating the need for undefined checks.
 * 
 * @param icon - A known supported icon identifier
 * @returns The FontAwesome IconDefinition object (guaranteed to exist)
 */
export function getIcon(icon: SupportedIconKey): IconDefinition;
export function getIcon(icon: string): IconDefinition | undefined;
export function getIcon(icon: string): IconDefinition | undefined {
  return supportedIcons[icon];
}

/**
 * Utility function to get all available icons as an array.
 * 
 * This is useful for generating menus, testing, or administrative interfaces
 * where you need to display all available social login options.
 * 
 * @returns Array of [key, IconDefinition] tuples for all supported icons
 * 
 * @example
 * ```tsx
 * function SocialProviderList() {
 *   const allIcons = getAllIcons();
 *   
 *   return (
 *     <div className="grid grid-cols-4 gap-4">
 *       {allIcons.map(([key, iconDef]) => (
 *         <div key={key} className="flex items-center space-x-2">
 *           <FontAwesomeIcon icon={iconDef} />
 *           <span>{key}</span>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function getAllIcons(): Array<[SupportedIconKey, IconDefinition]> {
  return Object.entries(supportedIcons) as Array<[SupportedIconKey, IconDefinition]>;
}

/**
 * Creates a React component props object for FontAwesome icons.
 * 
 * This utility function provides a convenient way to generate props
 * for FontAwesome icons with consistent styling and accessibility.
 * 
 * @param icon - The icon identifier
 * @param options - Optional configuration for the icon
 * @returns Props object for FontAwesome icon component, or null if icon doesn't exist
 * 
 * @example
 * ```tsx
 * function SocialButton({ provider }: { provider: string }) {
 *   const iconProps = createIconProps(provider, {
 *     className: 'w-5 h-5',
 *     'aria-hidden': true
 *   });
 *   
 *   if (!iconProps) {
 *     return null;
 *   }
 *   
 *   return (
 *     <button>
 *       <FontAwesomeIcon {...iconProps} />
 *       Sign in with {provider}
 *     </button>
 *   );
 * }
 * ```
 */
export function createIconProps(
  icon: string,
  options: {
    className?: string;
    size?: 'xs' | 'sm' | 'lg' | 'xl' | '2xl' | '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x';
    'aria-hidden'?: boolean;
    title?: string;
  } = {}
): { icon: IconDefinition; className?: string; size?: string; 'aria-hidden'?: boolean; title?: string } | null {
  const iconDef = getIcon(icon);
  
  if (!iconDef) {
    return null;
  }
  
  return {
    icon: iconDef,
    ...options,
  };
}