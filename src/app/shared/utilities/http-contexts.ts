import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * How the error interceptor should surface a failed request.
 * - 'default': normalize + toast (severity-routed) + rethrow AppError.
 * - 'toast-off': normalize + rethrow AppError only; the caller owns display
 *   (table shells, detail forms, the /error page).
 * - 'silent': full opt-out; the raw error passes through untouched
 *   (deliberate graceful degradation: search autocomplete, analytics, ...).
 */
export const ERROR_HANDLING = new HttpContextToken<
  'default' | 'silent' | 'toast-off'
>(() => 'default');

/** Translation key for a success toast shown when the request succeeds. */
export const SUCCESS_TOAST = new HttpContextToken<string | null>(() => null);

export function silent(context: HttpContext = new HttpContext()): HttpContext {
  return context.set(ERROR_HANDLING, 'silent');
}

export function toastOff(
  context: HttpContext = new HttpContext()
): HttpContext {
  return context.set(ERROR_HANDLING, 'toast-off');
}
