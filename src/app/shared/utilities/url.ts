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
 * Captures and stores redirect URL from query parameters if present
 */
export function captureRedirectUrl(): void {
  const urlParams = getHashAwareQueryParams();
  const redirectUrl = urlParams.get('redirect');
  if (redirectUrl) {
    localStorage.setItem(REDIRECT_URL_KEY, redirectUrl);
  }
}

/**
 * Checks for stored redirect URL and performs redirect if present.
 * Appends session token to the redirect URL if available.
 * @returns true if redirect is happening, false otherwise
 */
export function handleRedirectIfPresent(sessionToken?: string | null): boolean {
  const redirectUrl = localStorage.getItem(REDIRECT_URL_KEY);

  if (redirectUrl) {
    localStorage.removeItem(REDIRECT_URL_KEY);
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
