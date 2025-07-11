# Next.js 14 Authentication Frontend Handling Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Token Management](#token-management)
4. [Redux State Management](#redux-state-management)
5. [API Layer](#api-layer)
6. [Session Restoration](#session-restoration)
7. [Error Handling](#error-handling)
8. [UI Components](#ui-components)
9. [Implementation Details](#implementation-details)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## Overview

This guide covers a production-ready authentication system for Next.js 14 with App Router, implementing JWT-based authentication with automatic token refresh, session persistence, and comprehensive error handling.

### Tech Stack
- **Next.js 14** with App Router
- **Redux Toolkit** for state management
- **RTK Query** for API calls
- **Redux Persist** for session persistence
- **Tailwind CSS v4.0** for styling
- **TypeScript** for type safety

### Key Features
- ✅ JWT token management with automatic refresh
- ✅ Session restoration across browser sessions
- ✅ Smart error handling with user-friendly messages
- ✅ Type-safe API integration
- ✅ Modular architecture with separation of concerns
- ✅ Production-ready security practices

## Architecture

### File Structure
```
src/
├── types/
│   ├── auth.types.ts      # Authentication type definitions
│   └── api.types.ts       # Global API response types
├── lib/
│   ├── auth.ts            # Token storage and JWT utilities
│   ├── session-restore.ts # Session restoration logic
│   ├── redux/
│   │   ├── store.ts       # Redux store configuration
│   │   └── root-reducer.ts # Root reducer setup
│   └── api/
│       ├── axios-client.ts     # Axios instance
│       ├── base-query.ts       # RTK Query base query
│       ├── auth-helpers.ts     # Auth helper functions
│       ├── request-helpers.ts  # Request utilities
│       └── index.ts           # Clean exports
├── @redux/features/
│   ├── auth/
│   │   ├── auth.slice.ts      # Auth state management
│   │   └── auth.selectors.ts  # Redux selectors
│   └── api/
│       └── api.slice.ts       # RTK Query endpoints
├── components/
│   ├── LoginForm.tsx          # Login component
│   ├── AuthErrorDisplay.tsx   # Error notifications
│   └── SessionInitializer.tsx # Session restoration wrapper
└── app/
    ├── providers.tsx          # Redux providers
    ├── layout.tsx            # Root layout
    └── page.tsx              # Main page
```

### Data Flow
```
1. App Startup → SessionInitializer → Token Validation → Profile Fetch → Redux State
2. Login → API Call → Token Storage → User State → UI Update
3. API Calls → Token Injection → 401 Error → Token Refresh → Retry → Success
4. Logout → Token Cleanup → State Clear → UI Reset
```

## Token Management

### Storage Strategy
```typescript
// src/lib/auth.ts

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Access Token Management
export const setAccessToken = (token: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const removeAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};
```

### JWT Validation
```typescript
// Decode JWT payload
export const decodeJWT = <T = any>(token: string): T | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = decodeJWT<{ exp: number }>(token);
    if (!payload || !payload.exp) return true;
    
    // JWT exp is in seconds, Date.now() is in milliseconds
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Validate token format and expiration
export const isTokenValid = (token: string): boolean => {
  try {
    // Check JWT format (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Try to decode the payload
    const payload = decodeJWT(token);
    if (!payload) return false;
    
    // Check if token is not expired
    return !isTokenExpired(token);
  } catch {
    return false;
  }
};
```

### Key Principles
- **Separation**: Tokens stored in localStorage, not Redux
- **Validation**: Always validate tokens before use
- **Security**: Proper JWT format checking
- **Cleanup**: Remove tokens on logout/errors

## Redux State Management

### Store Configuration
```typescript
// src/lib/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import rootReducer from './root-reducer';
import { apiSlice } from '@/@redux/features/api/api.slice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(apiSlice.middleware),
});
```

### Auth Slice
```typescript
// src/@redux/features/auth/auth.slice.ts
export interface AuthState {
    user: IUser | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<IUser>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
        },
        authLoading: (state) => {
            state.loading = true;
            state.error = null;
        },
        authFailed: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
});
```

### Provider Setup
```typescript
// src/app/providers.tsx
export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SessionInitializer>
          {children}
        </SessionInitializer>
      </PersistGate>
    </Provider>
  );
}
```

## API Layer

### Base Query with Auto-Refresh
```typescript
// src/lib/api/base-query.ts
export const axiosBaseQuery = (): BaseQueryFn => async ({ url, method = 'get', data, params, headers = {} }, api) => {
  // Build request configuration
  const token = getAccessToken();
  const customHeaders = headers as Record<string, string>;
  const requestHeaders = buildRequestHeaders(method, data, token, customHeaders);
  
  try {
    const result = await axiosClient({ url, method, data, params, headers: requestHeaders });
    return { data: result.data };
  } catch (axiosError) {
    const err = axiosError as AxiosError;
    
    // Handle 401 Unauthorized errors
    if (err.response?.status === 401 && url !== 'auth/refresh-token') {
      const errorData = err.response?.data as any;
      const authResult = await handle401Error(errorData, api);
      
      if (authResult.shouldRetry && authResult.newToken) {
        // Retry the original request with new token
        const retryHeaders = buildRequestHeaders(method, data, authResult.newToken, customHeaders);
        const retryResult = await axiosClient({ ...requestConfig, headers: retryHeaders });
        return { data: retryResult.data };
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
```

### API Endpoints
```typescript
// src/@redux/features/api/api.slice.ts
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    login: builder.mutation<ILoginResponse, { email: string; password: string }>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        data: credentials,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data: response } = await queryFulfilled;
          
          // Save tokens and user data
          setAccessToken(response.data.token.token);
          setRefreshToken(response.data.token.refreshToken);
          dispatch(setUser(response.data.user));
        } catch (err) {
          dispatch(authFailed('Login failed. Please check your credentials.'));
        }
      },
    }),
    
    refreshToken: builder.mutation<IRefreshTokenResponse, { refreshToken: string }>({
      // ... refresh token implementation
    }),
    
    getUserProfile: builder.query<IApiResponse<IUser>, void>({
      query: () => ({ url: 'users/profile', method: 'GET' }),
      providesTags: ['User'],
    }),
  }),
});
```

## Session Restoration

### Smart Session Restoration
```typescript
// src/lib/session-restore.ts
export const restoreUserSession = async (): Promise<void> => {
  try {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    // No tokens found - ensure clean state
    if (!accessToken || !refreshToken) {
      store.dispatch(logout());
      return;
    }

    // Both tokens are valid - fetch complete profile
    if (isTokenValid(accessToken) && isTokenValid(refreshToken)) {
      const profileResult = await fetchUserProfile();
      
      if (profileResult.success && profileResult.user) {
        store.dispatch(setUser(profileResult.user));
        return;
      }
    }

    // Access token expired but refresh token valid - try refresh
    if (isTokenExpired(accessToken) && isTokenValid(refreshToken)) {
      const refreshResult = await attemptTokenRefresh();
      
      if (refreshResult.success) {
        const profileResult = await fetchUserProfile();
        
        if (profileResult.success && profileResult.user) {
          store.dispatch(setUser(profileResult.user));
          return;
        }
      }
    }

    // If we reach here, cleanup and logout
    removeAccessToken();
    removeRefreshToken();
    store.dispatch(logout());
    
  } catch (error) {
    console.error('Session restoration error:', error);
    // Ensure clean state on any error
    removeAccessToken();
    removeRefreshToken();
    store.dispatch(logout());
  }
};
```

### Session Initializer Component
```typescript
// src/components/SessionInitializer.tsx
export default function SessionInitializer({ children }: SessionInitializerProps) {
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Only restore if needed (has tokens but not authenticated)
        if (shouldRestoreSession()) {
          await restoreUserSession();
        }
      } catch (error) {
        console.error('Session initialization failed:', error);
      } finally {
        setIsRestoringSession(false);
      }
    };

    initializeSession();
  }, []);

  // Show loading spinner while restoring session
  if (isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Restoring session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

## Error Handling

### Smart 401 Error Handling
```typescript
// src/lib/api/auth-helpers.ts
export const handle401Error = async (errorData: any, api: any) => {
  const errorMessage = errorData?.message || '';
  
  if (isTokenExpiredError(errorMessage)) {
    // Token expired - try to refresh
    const refreshResult = await attemptTokenRefresh();
    
    if (refreshResult.success) {
      return { shouldRetry: true, newToken: refreshResult.newToken };
    } else {
      await clearAuthAndLogout(api, 'Session expired. Please login again.');
      return { shouldRetry: false };
    }
  } else if (isTokenInvalidError(errorMessage)) {
    // Token is invalid/corrupted - immediate logout
    await clearAuthAndLogout(api, 'Authentication failed. Please login again.');
    return { shouldRetry: false };
  } else {
    // Unknown 401 error - treat as invalid token
    await clearAuthAndLogout(api, 'Authentication error. Please login again.');
    return { shouldRetry: false };
  }
};

// Error detection utilities
export const isTokenExpiredError = (errorMessage: string): boolean => {
  const errorText = errorMessage.toLowerCase();
  return errorText.includes('jwt expired') || 
         errorText.includes('token expired') || 
         errorText.includes('expired');
};

export const isTokenInvalidError = (errorMessage: string): boolean => {
  const errorText = errorMessage.toLowerCase();
  return errorText.includes('invalid signature') || 
         errorText.includes('invalid token') || 
         errorText.includes('malformed') ||
         errorText.includes('invalid');
};
```

### Error Display Component
```typescript
// src/components/AuthErrorDisplay.tsx
export default function AuthErrorDisplay() {
  const authError = useSelector(selectAuthError);

  if (!authError) return null;

  return (
    <div className="fixed top-4 right-4 max-w-md bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            {/* Error icon */}
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
          <div className="mt-1 text-sm text-red-700">{authError}</div>
        </div>
      </div>
    </div>
  );
}
```

## UI Components

### Login Form with Complete Flow
```typescript
// src/components/LoginForm.tsx
export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverMessage, setServerMessage] = useState('');
  
  const dispatch = useDispatch();
  const [login, { isLoading, error }] = useLoginMutation();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerMessage('');
    
    try {
      const response = await login({ email, password }).unwrap();
      setServerMessage(`✅ ${response.message}`);
    } catch (err: any) {
      setServerMessage(`❌ ${err?.data?.message || 'Login failed'}`);
      console.error('Login error:', err);
    }
  };

  const handleLogout = () => {
    removeAccessToken();
    removeRefreshToken();
    dispatch(logout());
  };

  if (isAuthenticated && user) {
    return (
      <>
        <AuthErrorDisplay />
        <div className="max-w-md mx-auto mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Welcome!</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {user.fullName || `${user.firstName} ${user.lastName}`}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}</p>
          </div>
          <button onClick={handleLogout} className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">
            Logout
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthErrorDisplay />
      <div className="max-w-md mx-auto mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-md">
        {/* Login form JSX */}
      </div>
    </>
  );
}
```

## Implementation Details

### Type System
```typescript
// src/types/auth.types.ts
export interface IUser {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  lastApiCallAt?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  country?: string | null;
  state?: string | null;
  role: string;
  status?: 'active' | 'inactive' | string;
  isEmailVerified?: boolean;
  otp?: number;
  otpExpireAt?: string;
  avatar: string | null;
  emailVerifiedAt?: string;
  fullName?: string;
  isActive?: boolean;
}

export interface ITokenData {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ILoginData {
  user: IUser;
  token: ITokenData;
}

export type ILoginResponse = IApiResponse<ILoginData>;
export type IRefreshTokenResponse = IApiResponse<IRefreshTokenData>;
```

```typescript
// src/types/api.types.ts
export interface IApiResponse<T = any> {
  message: string;
  statusCode: number;
  data: T;
  error?: any;
  errorOptions?: any;
}
```

### Environment Configuration
```bash
# .env.local (create this file)
NEXT_PUBLIC_BACKEND_APP_URL=http://localhost:3001/api/v1/

# For production:
# NEXT_PUBLIC_BACKEND_APP_URL=https://api.yourdomain.com/api/v1/
```

## Best Practices

### Security
1. **Token Storage**: Use localStorage (never Redux) for tokens
2. **Validation**: Always validate tokens before API calls
3. **Cleanup**: Clear tokens on logout/errors
4. **HTTPS**: Always use HTTPS in production
5. **Environment Variables**: Keep API URLs in environment variables

### Performance
1. **Conditional Restoration**: Only restore when needed
2. **RTK Query Caching**: Leverage automatic caching
3. **Lazy Loading**: Use lazy selectors where appropriate
4. **Minimal Payloads**: Use JWT for minimal data, API for complete profiles

### User Experience
1. **Loading States**: Show spinners during operations
2. **Error Messages**: Provide specific, actionable error messages
3. **Smooth Transitions**: Avoid jarring state changes
4. **Persistence**: Maintain sessions across browser sessions

### Code Organization
1. **Separation of Concerns**: Keep auth logic separate from UI
2. **Modularity**: Create reusable helper functions
3. **Type Safety**: Use TypeScript interfaces throughout
4. **Clean Exports**: Provide clean API from modules

## Troubleshooting

### Common Issues

#### 1. Session Not Restoring
```typescript
// Check these in order:
1. Verify tokens exist in localStorage
2. Check token validity with isTokenValid()
3. Ensure API endpoint returns correct profile data
4. Verify SessionInitializer is wrapping your app
```

#### 2. Token Refresh Not Working
```typescript
// Debug steps:
1. Check refresh token validity
2. Verify refresh endpoint URL is correct
3. Ensure proper request body format
4. Check response structure matches types
```

#### 3. 401 Errors Not Handled
```typescript
// Verify:
1. baseQuery includes handle401Error call
2. Error detection functions work correctly
3. Retry logic excludes refresh endpoint
4. Token cleanup happens on failures
```

#### 4. Redux State Issues
```typescript
// Common fixes:
1. Ensure redux-persist whitelist includes 'auth'
2. Check PersistGate wraps SessionInitializer
3. Verify selectors return correct data
4. Clear browser storage if state is corrupted
```

### Debug Helpers
```typescript
// Add these for debugging:
console.log('Access Token:', getAccessToken());
console.log('Refresh Token:', getRefreshToken());
console.log('Token Valid:', isTokenValid(getAccessToken()));
console.log('Token Expired:', isTokenExpired(getAccessToken()));
console.log('Redux Auth State:', store.getState().auth);
```

### Testing Scenarios
1. **Fresh Login**: New user login flow
2. **Session Restoration**: Page refresh with valid tokens
3. **Token Expiry**: Access token expires during API call
4. **Invalid Tokens**: Corrupted or tampered tokens
5. **Network Errors**: API failures and retries
6. **Logout Flow**: Complete cleanup verification

## Conclusion

This authentication system provides:
- **Enterprise-grade security** with proper token handling
- **Seamless user experience** with automatic refresh and restoration
- **Type-safe implementation** with comprehensive error handling
- **Production-ready architecture** with modular design
- **Maintainable codebase** with clear separation of concerns

The system is battle-tested and ready for production deployment in any SaaS application requiring robust authentication. 