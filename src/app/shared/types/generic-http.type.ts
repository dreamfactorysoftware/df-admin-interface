export interface GenericSuccessResponse {
  success: boolean;
}

export interface GenericErrorResponse {
  error: {
    code: string;
    context:
      | string
      | { error: Array<any>; resource: Array<GenericErrorResponse> };
    message: string;
    status_code: number;
  };
}

export interface GenericListResponse<T> {
  resource: T;
  meta: {
    count: number;
  };
}
