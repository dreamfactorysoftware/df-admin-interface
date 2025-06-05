/**
 * License and entitlement check response types for React component integration.
 * 
 * This module provides type definitions for license checking workflows that maintain
 * full compatibility with existing DreamFactory backend endpoints while supporting
 * modern React component patterns including React Query caching, component state
 * management, and Next.js middleware integration.
 * 
 * The types defined here support:
 * - Server-side license validation through Next.js middleware
 * - React Query/SWR intelligent caching for license status
 * - Component-level license checking with React hooks
 * - Optimistic updates for license renewal workflows
 * - Background synchronization of license status
 */

/**
 * Response interface for license and entitlement checking endpoints.
 * 
 * This interface maintains full compatibility with the existing DreamFactory
 * backend API contract while supporting React component integration patterns.
 * 
 * @example React Query Integration
 * ```typescript
 * const { data: licenseStatus, error, isLoading } = useQuery({
 *   queryKey: ['license-check'],
 *   queryFn: fetchLicenseStatus,
 *   staleTime: 5 * 60 * 1000, // 5 minutes
 *   cacheTime: 10 * 60 * 1000, // 10 minutes
 *   refetchInterval: 30 * 60 * 1000, // Check every 30 minutes
 * });
 * ```
 * 
 * @example SWR Integration
 * ```typescript
 * const { data: licenseCheck, mutate } = useSWR(
 *   '/api/v2/system/license/check',
 *   fetcher,
 *   {
 *     refreshInterval: 30 * 60 * 1000, // 30 minutes
 *     revalidateOnFocus: true,
 *     revalidateOnReconnect: true,
 *   }
 * );
 * ```
 * 
 * @example Component Usage
 * ```typescript
 * function LicenseStatus({ checkResponse }: { checkResponse: CheckResponse }) {
 *   const shouldDisableUI = checkResponse.disableUi === 'true';
 *   const isExpired = checkResponse.statusCode === 'EXPIRED';
 *   
 *   if (shouldDisableUI) {
 *     return <PaywallComponent message={checkResponse.msg} />;
 *   }
 *   
 *   return (
 *     <div className={cn(
 *       "license-status",
 *       isExpired && "border-red-500 bg-red-50"
 *     )}>
 *       <p>{checkResponse.msg}</p>
 *       {checkResponse.renewalDate && (
 *         <p>Renewal Date: {checkResponse.renewalDate}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export interface CheckResponse {
  /**
   * Flag indicating whether the UI should be disabled due to license issues.
   * 
   * When set to 'true', React components should render appropriate
   * paywall or license warning interfaces. This supports conditional
   * rendering patterns for license enforcement.
   * 
   * @example
   * ```typescript
   * const isUIDisabled = checkResponse.disableUi === 'true';
   * if (isUIDisabled) {
   *   return <PaywallComponent />;
   * }
   * ```
   */
  disableUi: string;

  /**
   * Human-readable message about the current license status.
   * 
   * This message can be displayed directly in React components
   * for user notification about license status, expiration warnings,
   * or renewal requirements.
   * 
   * @example
   * ```typescript
   * <Alert variant={isWarning ? 'warning' : 'info'}>
   *   {checkResponse.msg}
   * </Alert>
   * ```
   */
  msg: string;

  /**
   * ISO date string representing when the license needs to be renewed.
   * 
   * This supports date formatting and countdown components in React
   * applications for proactive license management.
   * 
   * @example
   * ```typescript
   * const renewalDate = new Date(checkResponse.renewalDate);
   * const daysUntilRenewal = differenceInDays(renewalDate, new Date());
   * 
   * <RenewalCountdown
   *   renewalDate={renewalDate}
   *   daysRemaining={daysUntilRenewal}
   * />
   * ```
   */
  renewalDate: string;

  /**
   * Status code indicating the current license state.
   * 
   * Common values include 'ACTIVE', 'EXPIRED', 'WARNING', 'INVALID'.
   * This supports conditional styling and component behavior based
   * on license status.
   * 
   * @example
   * ```typescript
   * const statusVariant = {
   *   'ACTIVE': 'success',
   *   'EXPIRED': 'destructive',
   *   'WARNING': 'warning',
   *   'INVALID': 'destructive'
   * }[checkResponse.statusCode] || 'default';
   * 
   * <Badge variant={statusVariant}>
   *   {checkResponse.statusCode}
   * </Badge>
   * ```
   */
  statusCode: string;
}

/**
 * Type guard to validate CheckResponse objects at runtime.
 * 
 * This utility function provides type safety when working with
 * API responses that should conform to the CheckResponse interface,
 * supporting robust error handling in React components.
 * 
 * @param obj - Object to validate as CheckResponse
 * @returns Type predicate indicating if object is valid CheckResponse
 * 
 * @example
 * ```typescript
 * const handleLicenseCheck = (data: unknown) => {
 *   if (isCheckResponse(data)) {
 *     // data is now typed as CheckResponse
 *     setLicenseStatus(data);
 *   } else {
 *     setError('Invalid license check response');
 *   }
 * };
 * ```
 */
export function isCheckResponse(obj: unknown): obj is CheckResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as CheckResponse).disableUi === 'string' &&
    typeof (obj as CheckResponse).msg === 'string' &&
    typeof (obj as CheckResponse).renewalDate === 'string' &&
    typeof (obj as CheckResponse).statusCode === 'string'
  );
}

/**
 * Options for configuring license check behavior in React components.
 * 
 * This interface supports various caching and polling strategies
 * for license checking in React Query/SWR implementations.
 */
export interface LicenseCheckOptions {
  /**
   * How long to consider cached license data fresh (in milliseconds).
   * Default: 5 minutes (300000ms)
   */
  staleTime?: number;

  /**
   * How long to keep license data in cache (in milliseconds).
   * Default: 10 minutes (600000ms)
   */
  cacheTime?: number;

  /**
   * Interval for automatic license check polling (in milliseconds).
   * Default: 30 minutes (1800000ms)
   */
  refetchInterval?: number;

  /**
   * Whether to revalidate license on window focus.
   * Default: true
   */
  revalidateOnFocus?: boolean;

  /**
   * Whether to revalidate license on network reconnect.
   * Default: true
   */
  revalidateOnReconnect?: boolean;

  /**
   * Whether to show loading indicators during license checks.
   * Default: false
   */
  showLoading?: boolean;

  /**
   * Callback function when license check fails.
   */
  onError?: (error: Error) => void;

  /**
   * Callback function when license status changes.
   */
  onStatusChange?: (status: CheckResponse) => void;
}

/**
 * Utility type for React components that depend on license status.
 * 
 * This type helps ensure that license-aware components receive
 * the necessary license information for proper rendering.
 */
export interface LicenseAwareComponentProps {
  /**
   * Current license check response data.
   */
  licenseStatus?: CheckResponse;

  /**
   * Whether license check is currently loading.
   */
  isLicenseLoading?: boolean;

  /**
   * Error from license check, if any.
   */
  licenseError?: Error | null;

  /**
   * Function to manually trigger license status refresh.
   */
  refreshLicense?: () => void;
}

/**
 * Status enumeration for common license check status codes.
 * 
 * This provides type safety and IDE autocompletion when working
 * with license status codes in React components.
 */
export const LICENSE_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  WARNING: 'WARNING',
  INVALID: 'INVALID',
  GRACE_PERIOD: 'GRACE_PERIOD',
  TRIAL: 'TRIAL',
  SUSPENDED: 'SUSPENDED'
} as const;

/**
 * Type derived from LICENSE_STATUS constant for type safety.
 */
export type LicenseStatusCode = typeof LICENSE_STATUS[keyof typeof LICENSE_STATUS];

/**
 * Type guard to check if a status code is valid.
 * 
 * @param status - Status code to validate
 * @returns Whether the status code is a valid LicenseStatusCode
 */
export function isValidLicenseStatus(status: string): status is LicenseStatusCode {
  return Object.values(LICENSE_STATUS).includes(status as LicenseStatusCode);
}