/**
 * License and entitlement check response types maintaining API compatibility
 * while supporting React component integration for license validation workflows.
 * 
 * This module provides types for license checking functionality that integrates
 * with Next.js middleware authentication flows and React component patterns.
 * The types maintain full compatibility with existing DreamFactory license
 * validation endpoints while adding support for React-based UI components.
 */

/**
 * Response structure for license and entitlement validation API calls.
 * 
 * Used by license checking components to determine UI availability,
 * display license status messages, and handle renewal workflows.
 * Maintains compatibility with existing `/system/environment` endpoint
 * and DreamFactory license validation infrastructure.
 * 
 * @interface CheckResponse
 * @example
 * ```typescript
 * // React component usage for license validation
 * const LicenseChecker: React.FC = () => {
 *   const { data: licenseStatus, error } = useSWR<CheckResponse>(
 *     '/api/v2/system/environment',
 *     fetcher
 *   );
 * 
 *   if (licenseStatus?.disableUi === 'true') {
 *     return <LicenseExpiredBanner />;
 *   }
 * 
 *   return <Application />;
 * };
 * ```
 */
export interface CheckResponse {
  /**
   * String indicator for UI feature availability based on license status.
   * 
   * When "true", indicates that certain UI features should be disabled
   * due to license restrictions or expiration. React components should
   * check this field to conditionally render features or show upgrade prompts.
   * 
   * @example
   * ```typescript
   * // Conditional feature rendering based on license status
   * const DatabaseServicePanel: React.FC = () => {
   *   const { data: license } = useLicenseCheck();
   *   
   *   if (license?.disableUi === 'true') {
   *     return <UpgradeRequiredMessage />;
   *   }
   *   
   *   return <DatabaseConnectionForm />;
   * };
   * ```
   */
  disableUi: string;

  /**
   * Human-readable license status message for display in React components.
   * 
   * Contains descriptive text about the current license state, renewal
   * requirements, or any restrictions. Should be displayed to users
   * in license status components and notification banners.
   * 
   * @example
   * ```typescript
   * // Display license message in notification component
   * const LicenseNotification: React.FC<{ message: string }> = ({ message }) => (
   *   <Alert variant="warning" className="mb-4">
   *     <AlertTriangle className="h-4 w-4" />
   *     <AlertTitle>License Notice</AlertTitle>
   *     <AlertDescription>{message}</AlertDescription>
   *   </Alert>
   * );
   * ```
   */
  msg: string;

  /**
   * License renewal date in string format for renewal workflow components.
   * 
   * Represents when the current license expires and requires renewal.
   * React components use this for countdown timers, renewal reminders,
   * and proactive license management workflows.
   * 
   * @example
   * ```typescript
   * // License expiration countdown component
   * const LicenseRenewalTimer: React.FC<{ renewalDate: string }> = ({ renewalDate }) => {
   *   const daysUntilRenewal = useMemo(() => {
   *     const renewal = new Date(renewalDate);
   *     const now = new Date();
   *     return Math.ceil((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
   *   }, [renewalDate]);
   * 
   *   if (daysUntilRenewal <= 30) {
   *     return (
   *       <Badge variant="destructive">
   *         License expires in {daysUntilRenewal} days
   *       </Badge>
   *     );
   *   }
   *   
   *   return null;
   * };
   * ```
   */
  renewalDate: string;

  /**
   * License validation status code for programmatic license state handling.
   * 
   * Provides machine-readable status for license validation results.
   * React components and middleware use this for conditional logic,
   * error handling, and license state management workflows.
   * 
   * @example
   * ```typescript
   * // License status-based routing in Next.js middleware
   * export function middleware(request: NextRequest) {
   *   const licenseStatus = await checkLicense();
   *   
   *   if (licenseStatus.statusCode === 'EXPIRED') {
   *     return NextResponse.redirect(new URL('/license-expired', request.url));
   *   }
   *   
   *   if (licenseStatus.statusCode === 'TRIAL_EXPIRED') {
   *     return NextResponse.redirect(new URL('/upgrade-required', request.url));
   *   }
   *   
   *   return NextResponse.next();
   * }
   * ```
   */
  statusCode: string;
}

/**
 * License checking hook result interface for React component integration.
 * 
 * Provides a standardized interface for React hooks that perform license
 * validation, integrating with SWR/React Query for intelligent caching
 * and background revalidation of license status.
 * 
 * @interface LicenseCheckResult
 * @example
 * ```typescript
 * // Custom hook for license checking with caching
 * export function useLicenseCheck(): LicenseCheckResult {
 *   const { data, error, isLoading } = useSWR<CheckResponse>(
 *     '/api/v2/system/environment',
 *     fetcher,
 *     {
 *       refreshInterval: 300000, // Recheck every 5 minutes
 *       revalidateOnFocus: false,
 *       revalidateOnReconnect: true
 *     }
 *   );
 * 
 *   return {
 *     licenseStatus: data,
 *     isLoading,
 *     error,
 *     isLicenseValid: data?.statusCode === 'VALID',
 *     isUIDisabled: data?.disableUi === 'true'
 *   };
 * }
 * ```
 */
export interface LicenseCheckResult {
  /**
   * Current license status data from the API response.
   * Undefined when loading or if an error occurred.
   */
  licenseStatus?: CheckResponse;

  /**
   * Loading state indicator for React component rendering.
   * True when the license check request is in progress.
   */
  isLoading: boolean;

  /**
   * Error state for license check failures.
   * Contains error information when the license check API call fails.
   */
  error?: Error;

  /**
   * Computed boolean indicating whether the license is in a valid state.
   * Derived from the statusCode field for convenient conditional rendering.
   */
  isLicenseValid: boolean;

  /**
   * Computed boolean indicating whether UI features should be disabled.
   * Derived from the disableUi field for React component conditional logic.
   */
  isUIDisabled: boolean;
}

/**
 * Configuration options for license checking components and hooks.
 * 
 * Allows customization of license checking behavior, caching strategies,
 * and integration with React Query/SWR for optimal performance in
 * React applications.
 * 
 * @interface LicenseCheckOptions
 * @example
 * ```typescript
 * // Configure license checking with custom options
 * const licenseOptions: LicenseCheckOptions = {
 *   refreshInterval: 600000, // Check every 10 minutes
 *   enableBackgroundRefresh: true,
 *   onLicenseExpired: () => {
 *     // Redirect to renewal page
 *     router.push('/license-renewal');
 *   },
 *   onUIDisabled: (message) => {
 *     // Show upgrade modal
 *     setShowUpgradeModal(true);
 *   }
 * };
 * ```
 */
export interface LicenseCheckOptions {
  /**
   * Interval in milliseconds for background license status revalidation.
   * Defaults to 5 minutes for balanced performance and responsiveness.
   */
  refreshInterval?: number;

  /**
   * Whether to enable background refresh of license status.
   * When true, license status is checked periodically even when not in focus.
   */
  enableBackgroundRefresh?: boolean;

  /**
   * Callback function executed when license is detected as expired.
   * Used for custom handling of license expiration scenarios.
   */
  onLicenseExpired?: () => void;

  /**
   * Callback function executed when UI should be disabled due to license restrictions.
   * Receives the license message for display in custom UI components.
   */
  onUIDisabled?: (message: string) => void;

  /**
   * Custom error handler for license check failures.
   * Allows applications to implement custom error recovery strategies.
   */
  onError?: (error: Error) => void;
}

/**
 * License status enumeration for type-safe status code handling.
 * 
 * Provides strongly-typed alternatives to string status codes
 * for improved developer experience and compile-time validation
 * in React components and TypeScript applications.
 * 
 * @enum LicenseStatus
 * @example
 * ```typescript
 * // Type-safe license status handling
 * const LicenseStatusBadge: React.FC<{ status: string }> = ({ status }) => {
 *   switch (status as LicenseStatus) {
 *     case LicenseStatus.VALID:
 *       return <Badge variant="success">License Active</Badge>;
 *     case LicenseStatus.EXPIRED:
 *       return <Badge variant="destructive">License Expired</Badge>;
 *     case LicenseStatus.TRIAL:
 *       return <Badge variant="warning">Trial License</Badge>;
 *     case LicenseStatus.TRIAL_EXPIRED:
 *       return <Badge variant="destructive">Trial Expired</Badge>;
 *     default:
 *       return <Badge variant="secondary">Unknown Status</Badge>;
 *   }
 * };
 * ```
 */
export enum LicenseStatus {
  /**
   * License is valid and fully functional.
   */
  VALID = 'VALID',

  /**
   * License has expired and requires renewal.
   */
  EXPIRED = 'EXPIRED',

  /**
   * Currently running on a trial license.
   */
  TRIAL = 'TRIAL',

  /**
   * Trial license has expired.
   */
  TRIAL_EXPIRED = 'TRIAL_EXPIRED',

  /**
   * License validation failed or is invalid.
   */
  INVALID = 'INVALID',

  /**
   * Unable to verify license status.
   */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Type guard function to validate CheckResponse interface conformance.
 * 
 * Provides runtime validation for license check API responses,
 * ensuring type safety when working with dynamic API data in
 * React components and middleware functions.
 * 
 * @param data - Unknown data to validate as CheckResponse
 * @returns True if data conforms to CheckResponse interface
 * 
 * @example
 * ```typescript
 * // Validate API response in React component
 * const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 *   const [licenseStatus, setLicenseStatus] = useState<CheckResponse | null>(null);
 * 
 *   useEffect(() => {
 *     fetch('/api/v2/system/environment')
 *       .then(res => res.json())
 *       .then(data => {
 *         if (isCheckResponse(data)) {
 *           setLicenseStatus(data);
 *         } else {
 *           console.error('Invalid license response format');
 *         }
 *       });
 *   }, []);
 * 
 *   return (
 *     <LicenseContext.Provider value={licenseStatus}>
 *       {children}
 *     </LicenseContext.Provider>
 *   );
 * };
 * ```
 */
export function isCheckResponse(data: unknown): data is CheckResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).disableUi === 'string' &&
    typeof (data as any).msg === 'string' &&
    typeof (data as any).renewalDate === 'string' &&
    typeof (data as any).statusCode === 'string'
  );
}

/**
 * Default license check options for consistent behavior across components.
 * 
 * Provides sensible defaults for license checking configuration,
 * optimized for React applications with balanced performance and
 * user experience considerations.
 */
export const DEFAULT_LICENSE_CHECK_OPTIONS: Required<LicenseCheckOptions> = {
  refreshInterval: 300000, // 5 minutes
  enableBackgroundRefresh: true,
  onLicenseExpired: () => {
    // Default: Log license expiration for debugging
    console.warn('License has expired');
  },
  onUIDisabled: (message: string) => {
    // Default: Log UI restriction for debugging
    console.warn('UI features disabled:', message);
  },
  onError: (error: Error) => {
    // Default: Log license check errors
    console.error('License check failed:', error);
  }
};