import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import axiosClient from './axios-client';
import { getAccessToken } from '@/lib/auth';
import { handle401Error } from './auth-helpers';
import { buildRequestHeaders } from './request-helpers';

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
  async ({ url, method = 'get', data, params, headers = {} }, api) => {
    // Build request configuration
    const token = getAccessToken();
    const customHeaders = headers as Record<string, string>;
    const requestHeaders = buildRequestHeaders(method, data, token, customHeaders);
    
    const requestConfig = {
      url,
      method,
      data,
      params,
      headers: requestHeaders,
    };

    try {
      const result = await axiosClient(requestConfig);
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      
      // Handle 401 Unauthorized errors
      if (err.response?.status === 401 && url !== 'auth/refresh-token') {
        console.log('401 Unauthorized error');
        const errorData = err.response?.data as any;
        console.log('errorData: ', errorData);
        const authResult = await handle401Error(errorData, api);
        console.log('authResult: ', authResult);
        
        if (authResult.shouldRetry && authResult.newToken) {
          // Retry the original request with new token
          try {
            const retryHeaders = buildRequestHeaders(method, data, authResult.newToken, customHeaders);
            const retryResult = await axiosClient({
              ...requestConfig,
              headers: retryHeaders,
            });
            return { data: retryResult.data };
          } catch (retryError) {
            // If retry fails, return the original error
            return {
              error: {
                status: err.response?.status,
                data: err.response?.data || err.message,
              },
            };
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