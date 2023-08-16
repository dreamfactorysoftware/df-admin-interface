export interface GenericSuccessResponse {
  success: boolean;
}

export interface GenericErrorResponse {
  error: {
    code: string;
    context: string;
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
