export interface GenericSuccessResponse {
  success: boolean;
}

/** One entry of a batch error's context.resource: flat, NOT a nested
 * envelope. */
export interface GenericErrorResource {
  code: number;
  message: string;
  status_code?: number;
}

/** Error bodies are never case-transformed; fields stay snake_case. DF 500s
 * send `context: null`. */
export interface GenericErrorResponse {
  error: {
    code: string;
    context:
      | string
      | null
      | {
          error?: Array<number | string>;
          resource?: Array<GenericErrorResource>;
        };
    message: string;
    status_code: number;
  };
}

export interface Meta {
  count: number;
}

export interface GenericListResponse<T> {
  resource: Array<T>;
  meta: Meta;
}

export interface KeyValuePair {
  key: string;
  value: any;
}
export interface RequestOptions {
  showSpinner: boolean;
  filter: string;
  sort: string;
  fields: string;
  related: string;
  limit: number;
  offset: number;
  includeCount: boolean;
  snackbarSuccess: string;
  /** @deprecated no-op: error toasts are default-on in error.interceptor.
   * ponytail: delete once the call-site sweep removes the remaining usages. */
  snackbarError: string;
  /** Maps to the ERROR_HANDLING HttpContext token (see
   * shared/utilities/http-contexts.ts). */
  errorHandling: 'default' | 'silent' | 'toast-off';
  contentType: string;
  additionalParams: KeyValuePair[];
  additionalHeaders: KeyValuePair[];
  includeCacheControl: boolean;
  refresh: boolean;
}

export type GenericCreateResponse = GenericListResponse<{ id: number }>;
export interface GenericUpdateResponse {
  id: number;
}
