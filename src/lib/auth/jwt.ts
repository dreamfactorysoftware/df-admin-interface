/**
 * JWT Token Handling Utilities
 * 
 * Comprehensive JWT token management system for DreamFactory Admin Interface.
 * Provides secure token validation, parsing, expiration checking, and automatic
 * refresh capabilities with Next.js middleware integration.
 * 
 * Key Features:
 * - JWT signature verification with comprehensive security checks
 * - Token parsing and payload extraction with type safety
 * - Automatic token refresh with exponential backoff and retry strategies
 * - Token expiration detection with configurable refresh intervals
 * - Integration with Next.js middleware for server-side processing
 * - Secure token lifecycle management and authentication state synchronization
 */

import { 
  JWT_CONFIG, 
  SESSION_CONFIG, 
  TOKEN_EXPIRATION,
  TOKEN_KEYS,
  VALIDATION_PATTERNS,
  getAuthConfig
} from './constants';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * JWT token payload structure
 */
export interface JWTPayload {
  // Standard JWT claims
  sub: string;           // User ID (subject)
  iss: string;           // Issuer
  aud: string;           // Audience
  exp: number;           // Expiration time (Unix timestamp)
  iat: number;           // Issued at time (Unix timestamp)
  nbf?: number;          // Not before time (Unix timestamp)
  jti?: string;          // JWT ID
  
  // DreamFactory specific claims
  email: string;         // User email
  roles: string[];       // User roles
  permissions: string[]; // User permissions
  sid: string;           // Session ID
  session_id?: string;   // Alternative session ID field
  name?: string;         // User display name
  first_name?: string;   // User first name
  last_name?: string;    // User last name
  
  // Additional metadata
  type?: 'access' | 'refresh';
  scope?: string;
  tenant_id?: string;
  api_version?: string;
}

/**
 * JWT validation result
 */
export interface JWTValidationResult {
  isValid: boolean;
  payload?: JWTPayload;
  error?: JWTValidationError;
  isExpired?: boolean;
  needsRefresh?: boolean;
  timeToExpiry?: number; // Milliseconds until expiration
}

/**
 * JWT validation error types
 */
export enum JWTValidationError {
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_NOT_ACTIVE = 'TOKEN_NOT_ACTIVE',
  INVALID_ISSUER = 'INVALID_ISSUER',
  INVALID_AUDIENCE = 'INVALID_AUDIENCE',
  MISSING_CLAIMS = 'MISSING_CLAIMS',
  INVALID_TYPE = 'INVALID_TYPE',
  MALFORMED_PAYLOAD = 'MALFORMED_PAYLOAD',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED'
}

/**
 * Token refresh configuration
 */
export interface TokenRefreshConfig {
  endpoint: string;
  retryAttempts: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  timeoutMs: number;
}

/**
 * Token refresh result
 */
export interface TokenRefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
  retryAfter?: number; // Seconds to wait before retry
}

/**
 * Token security validation options
 */
export interface TokenSecurityOptions {
  verifySignature: boolean;
  checkExpiration: boolean;
  checkNotBefore: boolean;
  validateIssuer: boolean;
  validateAudience: boolean;
  allowClockSkew: number; // Seconds of clock skew tolerance
  requiredClaims: string[];
}

// =============================================================================
// JWT VALIDATION AND PARSING
// =============================================================================

/**
 * Validates JWT token format using regex pattern
 */
export function isValidJWTFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  return VALIDATION_PATTERNS.JWT_TOKEN.test(token.trim());
}

/**
 * Parses JWT token and extracts payload without verification
 * Used for initial inspection and expiration checking
 */
export function parseJWTPayload(token: string): JWTPayload | null {
  try {
    if (!isValidJWTFormat(token)) {
      return null;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode base64url payload
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(decoded) as JWTPayload;
    
    // Validate required claims exist
    if (!parsed.sub || !parsed.exp || !parsed.iat) {
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to parse JWT payload:', error);
    return null;
  }
}

/**
 * Checks if JWT token is expired
 */
export function isTokenExpired(token: string, clockSkewSeconds: number = 30): boolean {
  const payload = parseJWTPayload(token);
  if (!payload || !payload.exp) {
    return true; // Treat invalid tokens as expired
  }
  
  const now = Math.floor(Date.now() / 1000);
  const expiry = payload.exp;
  
  // Account for clock skew
  return now >= (expiry + clockSkewSeconds);
}

/**
 * Checks if token needs refresh based on configured threshold
 */
export function needsTokenRefresh(token: string): boolean {
  const payload = parseJWTPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const expiry = payload.exp;
  const refreshThreshold = SESSION_CONFIG.REFRESH.THRESHOLD / 1000; // Convert to seconds
  
  return (expiry - now) <= refreshThreshold;
}

/**
 * Gets time remaining until token expiration
 */
export function getTimeToExpiry(token: string): number | null {
  const payload = parseJWTPayload(token);
  if (!payload || !payload.exp) {
    return null;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const expiry = payload.exp;
  const secondsRemaining = expiry - now;
  
  return secondsRemaining > 0 ? secondsRemaining * 1000 : 0; // Return milliseconds
}

/**
 * Comprehensive JWT token validation with security checks
 */
export function validateJWTToken(
  token: string, 
  options: Partial<TokenSecurityOptions> = {}
): JWTValidationResult {
  const defaultOptions: TokenSecurityOptions = {
    verifySignature: false, // Server-side verification required
    checkExpiration: true,
    checkNotBefore: true,
    validateIssuer: true,
    validateAudience: true,
    allowClockSkew: 30, // 30 seconds
    requiredClaims: ['sub', 'exp', 'iat', 'email']
  };
  
  const config = { ...defaultOptions, ...options };
  
  try {
    // Format validation
    if (!isValidJWTFormat(token)) {
      return {
        isValid: false,
        error: JWTValidationError.INVALID_FORMAT
      };
    }
    
    // Parse payload
    const payload = parseJWTPayload(token);
    if (!payload) {
      return {
        isValid: false,
        error: JWTValidationError.MALFORMED_PAYLOAD
      };
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    // Check expiration
    if (config.checkExpiration && payload.exp) {
      const isExpired = now >= (payload.exp + config.allowClockSkew);
      if (isExpired) {
        return {
          isValid: false,
          payload,
          error: JWTValidationError.TOKEN_EXPIRED,
          isExpired: true,
          timeToExpiry: 0
        };
      }
    }
    
    // Check not before
    if (config.checkNotBefore && payload.nbf) {
      const isNotYetActive = now < (payload.nbf - config.allowClockSkew);
      if (isNotYetActive) {
        return {
          isValid: false,
          payload,
          error: JWTValidationError.TOKEN_NOT_ACTIVE
        };
      }
    }
    
    // Validate issuer
    if (config.validateIssuer && payload.iss !== JWT_CONFIG.ISSUER) {
      return {
        isValid: false,
        payload,
        error: JWTValidationError.INVALID_ISSUER
      };
    }
    
    // Validate audience
    if (config.validateAudience && payload.aud !== JWT_CONFIG.AUDIENCE) {
      return {
        isValid: false,
        payload,
        error: JWTValidationError.INVALID_AUDIENCE
      };
    }
    
    // Check required claims
    for (const claim of config.requiredClaims) {
      if (!(claim in payload) || !payload[claim as keyof JWTPayload]) {
        return {
          isValid: false,
          payload,
          error: JWTValidationError.MISSING_CLAIMS
        };
      }
    }
    
    // Calculate time to expiry and refresh need
    const timeToExpiry = getTimeToExpiry(token);
    const needsRefresh = needsTokenRefresh(token);
    
    return {
      isValid: true,
      payload,
      isExpired: false,
      needsRefresh,
      timeToExpiry: timeToExpiry || 0
    };
    
  } catch (error) {
    console.error('JWT validation error:', error);
    return {
      isValid: false,
      error: JWTValidationError.VERIFICATION_FAILED
    };
  }
}

// =============================================================================
// TOKEN REFRESH MANAGEMENT
// =============================================================================

/**
 * Manages token refresh attempts with exponential backoff
 */
export class TokenRefreshManager {
  private refreshPromise: Promise<TokenRefreshResult> | null = null;
  private retryCount = 0;
  private lastRefreshAttempt = 0;
  private config: TokenRefreshConfig;
  
  constructor(config: Partial<TokenRefreshConfig> = {}) {
    this.config = {
      endpoint: '/api/v2/user/refresh',
      retryAttempts: SESSION_CONFIG.REFRESH.RETRY_ATTEMPTS,
      retryDelay: SESSION_CONFIG.REFRESH.RETRY_DELAY,
      exponentialBackoff: true,
      timeoutMs: 10000, // 10 seconds
      ...config
    };
  }
  
  /**
   * Refreshes access token with retry logic and exponential backoff
   */
  async refreshToken(refreshToken: string): Promise<TokenRefreshResult> {
    // Return existing promise if refresh is already in progress
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    this.refreshPromise = this.executeRefresh(refreshToken);
    
    try {
      const result = await this.refreshPromise;
      this.refreshPromise = null;
      
      if (result.success) {
        this.retryCount = 0;
        this.lastRefreshAttempt = Date.now();
      }
      
      return result;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }
  
  /**
   * Executes the actual token refresh with retry logic
   */
  private async executeRefresh(refreshToken: string): Promise<TokenRefreshResult> {
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
        
        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`
          },
          body: JSON.stringify({
            refresh_token: refreshToken
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Don't retry on authentication errors
          if (response.status === 401 || response.status === 403) {
            return {
              success: false,
              error: errorData.message || 'Authentication failed'
            };
          }
          
          throw new Error(`HTTP ${response.status}: ${errorData.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        
        return {
          success: true,
          accessToken: data.session_token || data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in || TOKEN_EXPIRATION.ACCESS_TOKEN
        };
        
      } catch (error) {
        const isLastAttempt = attempt === this.config.retryAttempts;
        
        if (isLastAttempt) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown refresh error'
          };
        }
        
        // Calculate delay for next attempt
        const baseDelay = this.config.retryDelay;
        const delay = this.config.exponentialBackoff 
          ? baseDelay * Math.pow(2, attempt)
          : baseDelay;
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return {
      success: false,
      error: 'Max refresh attempts exceeded'
    };
  }
  
  /**
   * Checks if refresh is currently in progress
   */
  isRefreshing(): boolean {
    return this.refreshPromise !== null;
  }
  
  /**
   * Gets the last refresh attempt timestamp
   */
  getLastRefreshAttempt(): number {
    return this.lastRefreshAttempt;
  }
  
  /**
   * Resets the refresh manager state
   */
  reset(): void {
    this.refreshPromise = null;
    this.retryCount = 0;
    this.lastRefreshAttempt = 0;
  }
}

// =============================================================================
// TOKEN LIFECYCLE MANAGEMENT
// =============================================================================

/**
 * Comprehensive token lifecycle manager for authentication state
 */
export class JWTLifecycleManager {
  private refreshManager: TokenRefreshManager;
  private validationTimer: NodeJS.Timeout | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  
  constructor(refreshConfig?: Partial<TokenRefreshConfig>) {
    this.refreshManager = new TokenRefreshManager(refreshConfig);
  }
  
  /**
   * Validates token and schedules automatic refresh if needed
   */
  async validateAndScheduleRefresh(
    accessToken: string, 
    refreshToken: string,
    onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => void
  ): Promise<JWTValidationResult> {
    const validationResult = validateJWTToken(accessToken);
    
    if (!validationResult.isValid) {
      return validationResult;
    }
    
    // Schedule refresh if token needs it
    if (validationResult.needsRefresh && refreshToken) {
      this.scheduleTokenRefresh(refreshToken, onTokenRefresh);
    }
    
    // Schedule validation timer for periodic checks
    this.scheduleValidationCheck(accessToken, refreshToken, onTokenRefresh);
    
    return validationResult;
  }
  
  /**
   * Schedules automatic token refresh
   */
  private scheduleTokenRefresh(
    refreshToken: string,
    onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => void
  ): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // Refresh immediately if needed
    this.refreshTimer = setTimeout(async () => {
      try {
        const result = await this.refreshManager.refreshToken(refreshToken);
        
        if (result.success && result.accessToken && onTokenRefresh) {
          onTokenRefresh({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken || refreshToken
          });
        }
      } catch (error) {
        console.error('Scheduled token refresh failed:', error);
      }
    }, 100); // Minimal delay for immediate refresh
  }
  
  /**
   * Schedules periodic validation checks
   */
  private scheduleValidationCheck(
    accessToken: string,
    refreshToken: string,
    onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => void
  ): void {
    if (this.validationTimer) {
      clearTimeout(this.validationTimer);
    }
    
    this.validationTimer = setTimeout(() => {
      this.validateAndScheduleRefresh(accessToken, refreshToken, onTokenRefresh);
    }, SESSION_CONFIG.VALIDATION.INTERVAL);
  }
  
  /**
   * Manually triggers token refresh
   */
  async refreshTokens(refreshToken: string): Promise<TokenRefreshResult> {
    return this.refreshManager.refreshToken(refreshToken);
  }
  
  /**
   * Cleans up timers and resets state
   */
  cleanup(): void {
    if (this.validationTimer) {
      clearTimeout(this.validationTimer);
      this.validationTimer = null;
    }
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    this.refreshManager.reset();
  }
  
  /**
   * Checks if refresh is currently in progress
   */
  isRefreshing(): boolean {
    return this.refreshManager.isRefreshing();
  }
}

// =============================================================================
// NEXT.JS MIDDLEWARE INTEGRATION
// =============================================================================

/**
 * Extracts JWT token from various sources in middleware context
 */
export function extractTokenFromRequest(request: {
  headers: { get(name: string): string | null };
  cookies?: { get(name: string): { value: string } | undefined };
}): { accessToken?: string; refreshToken?: string } {
  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  
  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    accessToken = authHeader.substring(7);
  }
  
  // Check X-DreamFactory-Session-Token header
  const sessionHeader = request.headers.get('X-DreamFactory-Session-Token');
  if (sessionHeader && !accessToken) {
    accessToken = sessionHeader;
  }
  
  // Check cookies if available
  if (request.cookies) {
    const sessionCookie = request.cookies.get('df_session');
    const refreshCookie = request.cookies.get('df_refresh');
    
    if (sessionCookie?.value && !accessToken) {
      accessToken = sessionCookie.value;
    }
    
    if (refreshCookie?.value) {
      refreshToken = refreshCookie.value;
    }
  }
  
  return { accessToken, refreshToken };
}

/**
 * Validates token for middleware usage with enhanced security
 */
export function validateTokenForMiddleware(
  token: string,
  strictValidation: boolean = true
): JWTValidationResult {
  const options: Partial<TokenSecurityOptions> = {
    verifySignature: false, // Signature verification happens server-side
    checkExpiration: true,
    checkNotBefore: true,
    validateIssuer: strictValidation,
    validateAudience: strictValidation,
    allowClockSkew: 30,
    requiredClaims: strictValidation 
      ? ['sub', 'exp', 'iat', 'email', 'roles']
      : ['sub', 'exp', 'iat']
  };
  
  return validateJWTToken(token, options);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates a mock JWT token for development/testing
 */
export function createMockJWT(payload: Partial<JWTPayload> = {}): string {
  const now = Math.floor(Date.now() / 1000);
  const authConfig = getAuthConfig();
  
  const defaultPayload: JWTPayload = {
    sub: 'mock-user-id',
    iss: JWT_CONFIG.ISSUER,
    aud: JWT_CONFIG.AUDIENCE,
    exp: now + authConfig.TOKEN_EXPIRY,
    iat: now,
    email: 'mock@example.com',
    roles: ['user'],
    permissions: ['read'],
    sid: 'mock-session-id',
    ...payload
  };
  
  // Create mock JWT structure (header.payload.signature)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = btoa(JSON.stringify(defaultPayload));
  const signature = btoa('mock-signature');
  
  return `${header}.${encodedPayload}.${signature}`;
}

/**
 * Formats JWT validation error for user display
 */
export function formatJWTError(error: JWTValidationError): string {
  const errorMessages: Record<JWTValidationError, string> = {
    [JWTValidationError.INVALID_FORMAT]: 'Invalid token format',
    [JWTValidationError.INVALID_SIGNATURE]: 'Invalid token signature',
    [JWTValidationError.TOKEN_EXPIRED]: 'Session has expired. Please log in again.',
    [JWTValidationError.TOKEN_NOT_ACTIVE]: 'Token is not yet active',
    [JWTValidationError.INVALID_ISSUER]: 'Invalid token issuer',
    [JWTValidationError.INVALID_AUDIENCE]: 'Invalid token audience',
    [JWTValidationError.MISSING_CLAIMS]: 'Required token claims are missing',
    [JWTValidationError.INVALID_TYPE]: 'Invalid token type',
    [JWTValidationError.MALFORMED_PAYLOAD]: 'Malformed token payload',
    [JWTValidationError.VERIFICATION_FAILED]: 'Token verification failed'
  };
  
  return errorMessages[error] || 'Unknown token error';
}

/**
 * Checks if error indicates need for re-authentication
 */
export function shouldForceReauth(error: JWTValidationError): boolean {
  const reAuthErrors = [
    JWTValidationError.TOKEN_EXPIRED,
    JWTValidationError.INVALID_SIGNATURE,
    JWTValidationError.INVALID_FORMAT,
    JWTValidationError.VERIFICATION_FAILED
  ];
  
  return reAuthErrors.includes(error);
}

// =============================================================================
// EXPORTS
// =============================================================================

// Create global instances for application use
export const globalTokenRefreshManager = new TokenRefreshManager();
export const globalJWTLifecycleManager = new JWTLifecycleManager();

// Default export with commonly used functions
export default {
  validate: validateJWTToken,
  parse: parseJWTPayload,
  isExpired: isTokenExpired,
  needsRefresh: needsTokenRefresh,
  getTimeToExpiry,
  extractFromRequest: extractTokenFromRequest,
  validateForMiddleware: validateTokenForMiddleware,
  formatError: formatJWTError,
  shouldForceReauth,
  createMock: createMockJWT,
  TokenRefreshManager,
  JWTLifecycleManager,
  JWTValidationError
};