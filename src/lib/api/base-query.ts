import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import axiosClient from './axios-client';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, removeAccessToken, removeRefreshToken } from '@/lib/auth';

export const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig['method'];
      data?: AxiosRequestConfig['data'];
      params?: AxiosRequestConfig['params'];
      headers?: AxiosRequestConfig['headers'];
    },
    unknown,
    unknown
  > =>
  async ({ url, method = 'get', data, params, headers }, api) => {
    // Get access token and add to headers if available
    const token = getAccessToken();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    // Set appropriate Content-Type based on method and data
    let contentTypeHeaders = {};
    if (method !== 'get' && data) {
      if (data instanceof FormData) {
        contentTypeHeaders = { 'Content-Type': 'multipart/form-data' };
      } else if (typeof data === 'string') {
        contentTypeHeaders = { 'Content-Type': 'text/plain' };
      } else {
        contentTypeHeaders = { 'Content-Type': 'application/json' };
      }
    }

    try {
      const result = await axiosClient({
        url,
        method,
        data,
        params,
        headers: {
          ...contentTypeHeaders,
          ...headers,
          ...authHeaders,
        },
      });

      // Return the full server response instead of unwrapping
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      
      // Handle 401 Unauthorized - Check error type before deciding action
      if (err.response?.status === 401 && url !== 'auth/refresh-token') {
        const errorData = err.response?.data as any;
        const errorMessage = errorData?.message || '';
        const errorText = errorMessage.toLowerCase();
        
        // Check if this is a token expiration (can be refreshed)
        const isTokenExpired = errorText.includes('jwt expired') || 
                              errorText.includes('token expired') || 
                              errorText.includes('expired');
        
        // Check if this is an invalid token (cannot be refreshed)
        const isTokenInvalid = errorText.includes('invalid signature') || 
                              errorText.includes('invalid token') || 
                              errorText.includes('malformed') ||
                              errorText.includes('invalid');

        if (isTokenExpired) {
          // Token expired - try to refresh
          const refreshToken = getRefreshToken();
          
          if (refreshToken) {
            try {
              // Attempt to refresh the token
              const refreshResult = await axiosClient({
                url: 'auth/refresh-token',
                method: 'POST',
                data: { refreshToken },
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              // Check if refresh was successful and tokens are available
              if (refreshResult.data?.statusCode === 200 && refreshResult.data?.data) {
                const tokenData = refreshResult.data.data;
                
                // Update tokens - they are direct strings in the response
                setAccessToken(tokenData.token);
                setRefreshToken(tokenData.refreshToken);

                // Retry the original request with new token
                const retryResult = await axiosClient({
                  url,
                  method,
                  data,
                  params,
                  headers: {
                    ...contentTypeHeaders,
                    ...headers,
                    Authorization: `Bearer ${tokenData.token}`,
                  },
                });

                return { data: retryResult.data };
              } else {
                throw new Error('Invalid refresh response');
              }
            } catch (refreshError) {
              // Refresh failed, clear tokens and dispatch logout
              removeAccessToken();
              removeRefreshToken();
              
              // Dispatch logout action if Redux store is available
              if (api?.dispatch) {
                const { logout } = await import('@/@redux/features/auth/auth.slice');
                const { authFailed } = await import('@/@redux/features/auth/auth.slice');
                api.dispatch(logout());
                api.dispatch(authFailed('Session expired. Please login again.'));
              }
            }
          } else {
            // No refresh token available for expired token
            removeAccessToken();
            removeRefreshToken();
            
            if (api?.dispatch) {
              const { logout } = await import('@/@redux/features/auth/auth.slice');
              const { authFailed } = await import('@/@redux/features/auth/auth.slice');
              api.dispatch(logout());
              api.dispatch(authFailed('Session expired. Please login again.'));
            }
          }
        } else if (isTokenInvalid) {
          // Token is invalid/corrupted - immediate logout with specific message
          removeAccessToken();
          removeRefreshToken();
          
          if (api?.dispatch) {
            const { logout } = await import('@/@redux/features/auth/auth.slice');
            const { authFailed } = await import('@/@redux/features/auth/auth.slice');
            api.dispatch(logout());
            api.dispatch(authFailed('Authentication failed. Please login again.'));
          }
        } else {
          // Unknown 401 error - treat as invalid token
          removeAccessToken();
          removeRefreshToken();
          
          if (api?.dispatch) {
            const { logout } = await import('@/@redux/features/auth/auth.slice');
            const { authFailed } = await import('@/@redux/features/auth/auth.slice');
            api.dispatch(logout());
            api.dispatch(authFailed('Authentication error. Please login again.'));
          }
        }
      }

      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  }; 