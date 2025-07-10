import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import axiosClient from './axios.client';
import { getAccessToken } from '@/lib/auth';

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
  async ({ url, method = 'get', data, params, headers }) => {
    try {
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

      return { data: result.data.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  }; 