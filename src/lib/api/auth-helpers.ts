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
  message: string = 'Authentication error. Please login again.'
): Promise<void> => {
  // Clear tokens from localStorage
  removeAccessToken();
  removeRefreshToken();
  
  // Dispatch Redux actions if available
  if (api?.dispatch) {
    const { logout } = await import('@/@redux/features/auth/auth.slice');
    const { authFailed } = await import('@/@redux/features/auth/auth.slice');
    api.dispatch(logout());
    api.dispatch(authFailed(message));
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
      // Refresh failed
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