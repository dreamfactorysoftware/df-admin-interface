export function isValidHttpUrl(string: string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}

export const REDIRECT_URL_KEY = 'df_auth_redirect_url';

/**
 * Gets query parameters from the current URL, handling both standard URLs
 * and hash-based routing (e.g., /#/auth/login?redirect=...)
 */
export function getHashAwareQueryParams(): URLSearchParams {
  const hashQueryIndex = window.location.hash.indexOf('?');
  const queryString =
    hashQueryIndex !== -1
      ? window.location.hash.substring(hashQueryIndex + 1)
      : window.location.search.substring(1);
  return new URLSearchParams(queryString);
}

/**
 * Captures and stores redirect URL from query parameters if present.
 * Uses sessionStorage (per-tab) to prevent cross-tab interference.
 */
export function captureRedirectUrl(): void {
  // Clean up any stale entry from the previous localStorage-based implementation
  localStorage.removeItem(REDIRECT_URL_KEY);

  const urlParams = getHashAwareQueryParams();
  const redirectUrl = urlParams.get('redirect');
  if (redirectUrl) {
    sessionStorage.setItem(REDIRECT_URL_KEY, redirectUrl);
  } else {
    sessionStorage.removeItem(REDIRECT_URL_KEY);
  }
}

/**
 * Validates that a redirect URL is safe to follow:
 * - Must be a valid http/https URL (delegates to isValidHttpUrl)
 * - Must share the same origin as the current page (prevents open redirect)
 */
export function isSameOriginUrl(url: string): boolean {
  if (!isValidHttpUrl(url)) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.origin === window.location.origin;
  } catch (_) {
    return false;
  }
}

/**
 * Checks for stored redirect URL and performs redirect if present.
 * Appends session token to the redirect URL if available.
 * Only redirects to same-origin URLs to prevent open-redirect attacks.
 * Falls back to the root path when the stored URL fails validation.
 * @returns true if a redirect is happening, false otherwise
 */
export function handleRedirectIfPresent(sessionToken?: string | null): boolean {
  const redirectUrl = sessionStorage.getItem(REDIRECT_URL_KEY);

  if (redirectUrl) {
    sessionStorage.removeItem(REDIRECT_URL_KEY);

    if (!isSameOriginUrl(redirectUrl)) {
      // Stored URL failed origin validation — fall back to the default dashboard
      // rather than silently dropping the redirect, so the user still lands somewhere.
      window.location.href = '/';
      return true;
    }

    if (sessionToken) {
      const separator = redirectUrl.includes('?') ? '&' : '?';
      const finalUrl = `${redirectUrl}${separator}session_token=${sessionToken}`;
      window.location.href = finalUrl;
    } else {
      window.location.href = redirectUrl;
    }
    return true;
  }
  return false;
}
