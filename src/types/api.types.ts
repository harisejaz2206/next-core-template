/**
 * Global API Response Interface
 * 
 * Mirrors the backend's GlobalResponseDto structure to ensure type safety
 * across all API calls in the frontend application.
 * 
 * This interface standardizes all API responses from the NestJS backend:
 * - Success responses (2xx): Include data field with actual response data
 * - Error responses (4xx/5xx): Include error field with error details, data is null
 * 
 * @template T - Type of the data being returned on success
 */
export interface IApiResponse<T = any> {
  /** Human-readable message describing the response */
  message: string;
  
  /** HTTP status code (200, 400, 500, etc.) */
  statusCode: number;
  
  /** Response data for successful requests, null for errors */
  data: T;
  
  /** Error details for failed requests, undefined for success */
  error?: any;
  
  /** Additional error options/metadata */
  errorOptions?: any;
}

/**
 * Type guard to check if API response is successful
 * @param response - The API response to check
 * @returns true if response is successful (2xx status code)
 */
export const isSuccessResponse = <T>(response: IApiResponse<T>): response is IApiResponse<T> & { data: T } => {
  return response.statusCode >= 200 && response.statusCode < 300;
};

/**
 * Type guard to check if API response is an error
 * @param response - The API response to check
 * @returns true if response is an error (4xx/5xx status code)
 */
export const isErrorResponse = <T>(response: IApiResponse<T>): response is IApiResponse<T> & { error: any } => {
  return response.statusCode >= 400;
}; 