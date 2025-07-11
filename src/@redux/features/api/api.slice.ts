import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/api/base-query';
import type { ILoginResponse, IRefreshTokenResponse, IUser } from '@/types/auth.types';
import type { IApiResponse } from '@/types/api.types';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['User'], // add more later
  endpoints: (builder) => ({
    login: builder.mutation<
      ILoginResponse,
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        data: credentials,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data: response } = await queryFulfilled;

          const { setAccessToken, setRefreshToken } = await import('@/lib/auth');
          const { setUser } = await import('@/@redux/features/auth/auth.slice');

          // Save tokens from the response structure
          setAccessToken(response.data.token.token);
          setRefreshToken(response.data.token.refreshToken);

          // Store user data directly from API response
          dispatch(setUser(response.data.user));
        } catch (err) {
          const { authFailed } = await import('@/@redux/features/auth/auth.slice');
          dispatch(authFailed('Login failed. Please check your credentials.'));
        }
      },
    }),
    refreshToken: builder.mutation<
      IRefreshTokenResponse,
      { refreshToken: string }
    >({
      query: (refreshData) => ({
        url: 'auth/refresh-token',
        method: 'POST',
        data: refreshData,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data: response } = await queryFulfilled;

          const { setAccessToken, setRefreshToken } = await import('@/lib/auth');

          // Update tokens - they are direct strings in the response
          setAccessToken(response.data.token);
          setRefreshToken(response.data.refreshToken);
        } catch (err) {
          // Refresh failed, logout user
          const { logout } = await import('@/@redux/features/auth/auth.slice');
          dispatch(logout());
        }
      },
    }),
    getUserProfile: builder.query<
      IApiResponse<IUser>,
      void
    >({
      query: () => ({
        url: 'users/profile',
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
  }),
});

export const { 
  useLoginMutation, 
  useRefreshTokenMutation,
  useGetUserProfileQuery,
  useLazyGetUserProfileQuery
} = apiSlice; 