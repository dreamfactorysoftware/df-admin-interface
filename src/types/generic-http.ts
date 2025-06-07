/**
 * Generic HTTP types for backward compatibility with Angular patterns.
 * 
 * This file provides legacy type definitions to support existing code
 * during the Angular to React migration process. New code should use
 * the enhanced types from ./api.ts instead.
 * 
 * @fileoverview Legacy HTTP type definitions for compatibility
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 * @deprecated Use types from ./api.ts for new implementations
 */

// Re-export modern types for compatibility
export {
  ApiSuccessResponse as GenericSuccessResponse,
  ApiErrorResponse as GenericErrorResponse,
  ApiListResponse as GenericListResponse,
  ApiBulkResponse as GenericCreateResponse,
  ApiResourceResponse as GenericUpdateResponse,
  PaginationMeta as Meta,
  KeyValuePair,
  ApiRequestOptions as RequestOptions,
} from './api';

// Legacy interfaces maintained for compatibility
export interface GenericSuccessResponse {
  success: boolean;
}

export interface GenericErrorResponse {
  error: {
    code: string;
    context: string | { 
      error: Array<any>; 
      resource: Array<GenericErrorResponse> 
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
  snackbarError: string;
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