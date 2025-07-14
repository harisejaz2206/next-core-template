import axiosClient from './axios-client';
import { 
  getRefreshToken, 
  setAccessToken, 
  setRefreshToken, 
  removeAccessToken, 
  removeRefreshToken,
  isTokenExpired as checkTokenExpired,
  isTokenValid as checkTokenValid
} from '@/lib/auth';

/**
 * Determines if a 401 error is due to token expiration
 */
export const isTokenExpiredError = (errorMessage: string): boolean => {
  const errorText = errorMessage.toLowerCase();
  return errorText.includes('jwt expired') || 
         errorText.includes('token expired') || 
         errorText.includes('expired');
};

/**
 * Determines if a 401 error is due to invalid/corrupted token
 */
export const isTokenInvalidError = (errorMessage: string): boolean => {
  const errorText = errorMessage.toLowerCase();
  return errorText.includes('invalid signature') || 
         errorText.includes('invalid token') || 
         errorText.includes('malformed') ||
         errorText.includes('invalid');
};

/**
 * Attempts to refresh the access token using the refresh token
 */
export const attemptTokenRefresh = async (): Promise<{
  success: boolean;
  newToken?: string;
  error?: string;
}> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    return { success: false, error: 'No refresh token available' };
  }

  // Check if refresh token is valid before attempting refresh
  if (!checkTokenValid(refreshToken)) {
    return { success: false, error: 'Refresh token is invalid or expired' };
  }

  try {
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
      
      // Update tokens in localStorage
      setAccessToken(tokenData.token);
      setRefreshToken(tokenData.refreshToken);
      
      return { 
        success: true, 
        newToken: tokenData.token 
      };
    } else {
      return { 
        success: false, 
        error: 'Invalid refresh response' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Refresh request failed' 
    };
  }
};

/**
 * Clears all authentication data and dispatches logout actions
 */
export const clearAuthAndLogout = async (
  api: any, 
  message: string = 'Authentication error. Please login again.',
  isSessionExpiry: boolean = false
): Promise<void> => {
  // Clear tokens from localStorage
  removeAccessToken();
  removeRefreshToken();
  
  // Dispatch Redux actions if available
  if (api?.dispatch) {
    const { logout } = await import('@/@redux/features/auth/auth.slice');
    const { authFailed } = await import('@/@redux/features/auth/auth.slice');
    api.dispatch(logout());
    
    // Show different messages for session expiry vs other auth errors
    if (isSessionExpiry) {
      api.dispatch(authFailed('🔒 Your session has expired. Please log in again to continue.'));
    } else {
      api.dispatch(authFailed(message));
    }
  }
};

/**
 * Displays logout message for expired sessions
 */
export const handleSessionExpiredLogout = async (api: any): Promise<void> => {
  await clearAuthAndLogout(
    api, 
    'Session expired. Please login again.',
    true // Mark as session expiry
  );
};

/**
 * Performs a complete logout including API call and local cleanup
 * This is for manual user logout actions
 */
export const performLogout = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    // Import RTK Query mutation
    const { store } = await import('@/lib/redux/store');
    const { apiSlice } = await import('@/@redux/features/api/api.slice');
    
    // Call the logout API endpoint which will handle cleanup via onQueryStarted
    const result = await store.dispatch(apiSlice.endpoints.logout.initiate());
    
    if (result.data?.statusCode === 200) {
      return {
        success: true,
        message: result.data.data?.message || 'Logged out successfully'
      };
    } else {
      return {
        success: false,
        message: 'Logout API call failed, but local cleanup completed'
      };
    }
  } catch (error) {
    // Even if API fails, we still clear local data (handled by mutation)
    return {
      success: false,
      message: 'Logout completed locally, server logout may have failed'
    };
  }
};

/**
 * Handles 401 authentication errors with appropriate actions
 */
export const handle401Error = async (
  errorData: any,
  api: any
): Promise<{
  shouldRetry: boolean;
  newToken?: string;
}> => {
  console.log('errorData:', errorData);
  console.log('api:', api);
  const errorMessage = errorData?.message || '';
  
  if (isTokenExpiredError(errorMessage)) {
    // Token expired - try to refresh
    const refreshResult = await attemptTokenRefresh();
    
    if (refreshResult.success) {
      return { 
        shouldRetry: true, 
        newToken: refreshResult.newToken 
      };
    } else {
      // Refresh failed - this is a session expiry scenario
      await handleSessionExpiredLogout(api);
      return { shouldRetry: false };
    }
  } else if (isTokenInvalidError(errorMessage)) {
    // Token is invalid/corrupted - immediate logout
    await clearAuthAndLogout(api, 'Authentication failed. Please login again.');
    return { shouldRetry: false };
  } else {
    console.log('Unknown 401 error - inside');
    // Unknown 401 error - treat as invalid token
    await clearAuthAndLogout(api, 'Authentication error. Please login again.');
    return { shouldRetry: false };
  }
}; 