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
  }
  // Do NOT remove an existing entry when the URL has no redirect param.
  // Angular's router may strip query params from the hash before guards run,
  // which would cause a second captureRedirectUrl() call to delete the entry
  // that was correctly stored by an earlier call.
}

/**
 * Checks for stored redirect URL and performs redirect if present.
 * Appends session token to the redirect URL if available.
 * @returns true if redirect is happening, false otherwise
 */
export function handleRedirectIfPresent(sessionToken?: string | null): boolean {
  const redirectUrl = sessionStorage.getItem(REDIRECT_URL_KEY);

  if (redirectUrl) {
    sessionStorage.removeItem(REDIRECT_URL_KEY);
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
