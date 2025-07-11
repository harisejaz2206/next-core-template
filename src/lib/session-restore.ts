import { store } from '@/lib/redux/store';
import { 
  getAccessToken, 
  getRefreshToken, 
  isTokenValid, 
  isTokenExpired, 
  removeAccessToken,
  removeRefreshToken
} from '@/lib/auth';
import { attemptTokenRefresh } from '@/lib/api/auth-helpers';
import { setUser, logout } from '@/@redux/features/auth/auth.slice';
import { apiSlice } from '@/@redux/features/api/api.slice';

/**
 * Fetches complete user profile using the stored access token
 */
const fetchUserProfile = async (): Promise<{ success: boolean; user?: any; error?: string }> => {
  try {
    // Use RTK Query to fetch profile
    const result = await store.dispatch(apiSlice.endpoints.getUserProfile.initiate());
    
    if (result.data && result.data.statusCode === 200) {
      return { 
        success: true, 
        user: result.data.data 
      };
    } else {
      return { 
        success: false, 
        error: 'Invalid profile response' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Profile fetch failed' 
    };
  }
};

/**
 * Restores user session on app startup by validating stored tokens
 * and fetching complete user profile from API
 */
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
      } else {
        // Profile fetch failed with valid tokens - something is wrong
        console.log('Session restoration: Profile fetch failed with valid tokens');
      }
    }

    // Access token expired but refresh token valid - try refresh then fetch profile
    if (isTokenExpired(accessToken) && isTokenValid(refreshToken)) {
      try {
        const refreshResult = await attemptTokenRefresh();
        
        if (refreshResult.success) {
          // Refresh successful - now fetch complete profile
          const profileResult = await fetchUserProfile();
          
          if (profileResult.success && profileResult.user) {
            store.dispatch(setUser(profileResult.user));
            return;
          }
        }
      } catch (error) {
        console.log('Session restoration: Token refresh failed');
      }
    }

    // If we reach here, tokens are invalid or profile fetch failed
    // Clear everything and ensure clean logout state
    removeAccessToken();
    removeRefreshToken();
    store.dispatch(logout());
    
  } catch (error) {
    console.error('Session restoration error:', error);
    
    // On any error, ensure clean state
    removeAccessToken();
    removeRefreshToken();
    store.dispatch(logout());
  }
};

/**
 * Checks if user session should be restored
 * (avoids unnecessary restoration if user is already authenticated)
 */
export const shouldRestoreSession = (): boolean => {
  const state = store.getState();
  const isAuthenticated = state.auth.isAuthenticated;
  const hasTokens = !!(getAccessToken() && getRefreshToken());
  
  // Restore if we have tokens but Redux state shows not authenticated
  return hasTokens && !isAuthenticated;
}; 