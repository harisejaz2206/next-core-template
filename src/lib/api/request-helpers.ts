import type { AxiosRequestConfig } from 'axios';

/**
 * Determines the appropriate Content-Type header based on the request method and data type
 */
export const getContentTypeHeaders = (
  method: AxiosRequestConfig['method'], 
  data: any
): Record<string, string> => {
  if (method === 'get' || !data) {
    return {};
  }

  if (data instanceof FormData) {
    return { 'Content-Type': 'multipart/form-data' };
  }
  
  if (typeof data === 'string') {
    return { 'Content-Type': 'text/plain' };
  }
  
  return { 'Content-Type': 'application/json' };
};

/**
 * Creates the authorization header if a token is available
 */
export const getAuthHeaders = (token: string | null): Record<string, string> => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Builds the complete headers object for an API request
 */
export const buildRequestHeaders = (
  method: AxiosRequestConfig['method'],
  data: any,
  token: string | null,
  customHeaders: Record<string, string> = {}
): Record<string, string> => {
  const contentTypeHeaders = getContentTypeHeaders(method, data);
  const authHeaders = getAuthHeaders(token);
  
  return {
    ...contentTypeHeaders,
    ...customHeaders,
    ...authHeaders,
  };
}; 