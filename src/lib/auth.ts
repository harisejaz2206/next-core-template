import { IUser } from '@/types/auth.types';

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

// Refresh Token Management
export const setRefreshToken = (token: string) => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const removeRefreshToken = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// JWT Decode Helper
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

// Token Validation Utilities
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

export const isTokenValid = (token: string): boolean => {
  try {
    // Check if token has proper JWT format (3 parts separated by dots)
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

export const hasValidTokens = (): boolean => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  
  // Must have both tokens
  if (!accessToken || !refreshToken) return false;
  
  // Access token can be expired (will be refreshed), but refresh token must be valid
  return isTokenValid(refreshToken);
};

// Bootstrap User Helper (returns minimal JWT data only)
// Note: For session restoration, use API profile fetch for complete user data
export const bootstrapUser = (): IUser | null => {
  const token = getAccessToken();
  if (!token || !isTokenValid(token)) return null;
  
  const payload = decodeJWT<IUser>(token);
  return payload || null;
}; 