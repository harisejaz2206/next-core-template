import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/api/base-query';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['User'], // add more later
  endpoints: (builder) => ({
    login: builder.mutation<
      { accessToken: string; refreshToken: string },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        data: credentials,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          const { setAccessToken, setRefreshToken, decodeJWT } = await import('@/lib/auth');
          const { setUser } = await import('@/@redux/features/auth/auth.slice');

          // Save tokens
          setAccessToken(data.accessToken);
          setRefreshToken(data.refreshToken);

          // Decode user and store in Redux
          const user = decodeJWT(data.accessToken);
          if (user) dispatch(setUser(user));
        } catch (err) {
          const { authFailed } = await import('@/@redux/features/auth/auth.slice');
          dispatch(authFailed('Login failed. Please check your credentials.'));
        }
      },
    }),
  }),
});

export const { useLoginMutation } = apiSlice; 