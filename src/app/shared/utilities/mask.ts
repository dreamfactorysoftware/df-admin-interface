/**
 * Secret masking for presentation mode.
 *
 * Display-only: every call site keeps the real value in the model and hands
 * the clipboard the real value, so copy-to-Postman is unaffected. Nothing
 * here is a security boundary — the key still arrives in the API response
 * and is visible in devtools. It exists so screensharing the admin UI does
 * not put live credentials on someone else's monitor.
 */

/** Fixed width on purpose: a length-preserving mask leaks the secret's length. */
export const MASK = '••••••••••••';

export function maskSecret(value: string | null | undefined): string {
  return value ? MASK : '';
}

/**
 * Mask secrets embedded in a larger block of text — the curl / Python / JS
 * snippets, where the key sits inside an otherwise readable command that we
 * still want legible on screen.
 *
 * Known values are replaced first (exact, no false positives), then two
 * catch-all patterns cover a header we did not anticipate: DreamFactory API
 * keys (32+ hex) and JWT session tokens.
 */
export function maskSecretsIn(
  text: string,
  known: (string | null | undefined)[] = []
): string {
  let out = text;
  known
    .filter((v): v is string => !!v && v.length >= 8)
    .forEach(v => {
      out = out.split(v).join(MASK);
    });
  return out
    .replace(/\b[0-9a-f]{32,}\b/gi, MASK)
    .replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, MASK);
}

/**
 * Whether a service-config field name denotes a credential.
 *
 * Config schemas are not trustworthy here: oidc.client_secret ships as `text`
 * and mcp.oauth_client_secret as `string`, so both render as plain visible
 * inputs. `_id` is excluded because a client_id is not a secret and hiding it
 * makes OAuth setup needlessly painful.
 */
export function isSecretFieldName(name: string | null | undefined): boolean {
  if (!name) {
    return false;
  }
  const n = name.toLowerCase();
  if (n.endsWith('_id') || n === 'id') {
    return false;
  }
  return /key|secret|password|passwd|token|credential/.test(n);
}
