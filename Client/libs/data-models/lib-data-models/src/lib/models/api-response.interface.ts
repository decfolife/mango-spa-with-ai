export interface ApiResponse {
  clientErrorMessage?: string;
  success: boolean;
  data: any;
  errorCode?: string;
  statusCode?: number;
}

export interface ApiResult<T> {
  data: T;
  succeeded: boolean;
  message: string;
  errorCode: string;
  statusCode: string;
}
