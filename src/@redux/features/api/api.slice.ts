import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/api/base-query';
import type { ILoginResponse } from '@/types/auth.types';

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
  }),
});

export const { useLoginMutation } = apiSlice; 