'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '@/@redux/features/auth/auth.selectors';
import { 
  getAccessToken, 
  getRefreshToken, 
  isTokenValid, 
  isTokenExpired, 
  decodeJWT 
} from '@/lib/auth';
import { useGetUserProfileQuery } from '@/@redux/features/api/api.slice';

export default function TokenStatusDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTokenDetails, setShowTokenDetails] = useState(false);
  
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  
  // Test profile query to trigger token refresh
  const profileQuery = useGetUserProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  
  const accessTokenValid = accessToken ? isTokenValid(accessToken) : false;
  const accessTokenExpired = accessToken ? isTokenExpired(accessToken) : false;
  const refreshTokenValid = refreshToken ? isTokenValid(refreshToken) : false;
  const refreshTokenExpired = refreshToken ? isTokenExpired(refreshToken) : false;

  // Decode tokens for display
  const accessTokenPayload = accessToken ? decodeJWT(accessToken) : null;
  const refreshTokenPayload = refreshToken ? decodeJWT(refreshToken) : null;

  const getTimeUntilExpiry = (exp: number) => {
    const expiryTime = new Date(exp * 1000);
    const timeDiff = expiryTime.getTime() - currentTime.getTime();
    
    if (timeDiff <= 0) return 'EXPIRED';
    
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getStatusColor = (isValid: boolean, isExpired: boolean) => {
    if (isExpired) return 'text-red-600';
    if (isValid) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getStatusText = (isValid: boolean, isExpired: boolean) => {
    if (isExpired) return '❌ EXPIRED';
    if (isValid) return '✅ VALID';
    return '⚠️ INVALID';
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">🔐 Token Status Dashboard</h2>
      
      {/* Current Time */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Current Time</h3>
        <p className="text-2xl font-mono text-blue-700">{currentTime.toLocaleTimeString()}</p>
      </div>

      {/* Authentication Status */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Authentication Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Redux Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User in Redux:</strong> {user ? '✅ Yes' : '❌ No'}</p>
            {user && <p><strong>User Email:</strong> {user.email}</p>}
          </div>
          <div>
            <p><strong>Access Token:</strong> {accessToken ? '✅ Present' : '❌ Missing'}</p>
            <p><strong>Refresh Token:</strong> {refreshToken ? '✅ Present' : '❌ Missing'}</p>
            <p><strong>Profile Query Status:</strong> 
              <span className={`ml-1 px-2 py-1 rounded text-xs ${
                profileQuery.isLoading ? 'bg-yellow-100 text-yellow-800' :
                profileQuery.error ? 'bg-red-100 text-red-800' :
                profileQuery.data ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {profileQuery.isLoading ? 'Loading' :
                 profileQuery.error ? 'Error' :
                 profileQuery.data ? 'Success' : 'Idle'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Token Status */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Token Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Access Token */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Access Token</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Status:</strong> 
                <span className={`ml-1 font-mono ${getStatusColor(accessTokenValid, accessTokenExpired)}`}>
                  {getStatusText(accessTokenValid, accessTokenExpired)}
                </span>
              </p>
              {accessTokenPayload && (
                <>
                  <p><strong>Expires:</strong> {new Date(accessTokenPayload.exp * 1000).toLocaleString()}</p>
                  <p><strong>Time Left:</strong> 
                    <span className={`ml-1 font-mono ${
                      accessTokenExpired ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {getTimeUntilExpiry(accessTokenPayload.exp)}
                    </span>
                  </p>
                  <p><strong>User ID:</strong> {accessTokenPayload.id || 'N/A'}</p>
                  <p><strong>Email:</strong> {accessTokenPayload.email || 'N/A'}</p>
                </>
              )}
            </div>
          </div>

          {/* Refresh Token */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Refresh Token</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Status:</strong> 
                <span className={`ml-1 font-mono ${getStatusColor(refreshTokenValid, refreshTokenExpired)}`}>
                  {getStatusText(refreshTokenValid, refreshTokenExpired)}
                </span>
              </p>
              {refreshTokenPayload && (
                <>
                  <p><strong>Expires:</strong> {new Date(refreshTokenPayload.exp * 1000).toLocaleString()}</p>
                  <p><strong>Time Left:</strong> 
                    <span className={`ml-1 font-mono ${
                      refreshTokenExpired ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {getTimeUntilExpiry(refreshTokenPayload.exp)}
                    </span>
                  </p>
                  <p><strong>User ID:</strong> {refreshTokenPayload.id || 'N/A'}</p>
                  <p><strong>Email:</strong> {refreshTokenPayload.email || 'N/A'}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Test Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => profileQuery.refetch()}
            disabled={profileQuery.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            �� Test Profile Query
          </button>
          
          <button
            onClick={() => setShowTokenDetails(!showTokenDetails)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            {showTokenDetails ? '�� Hide' : '🔓 Show'} Token Details
          </button>
        </div>
      </div>

      {/* Token Details (Hidden by default) */}
      {showTokenDetails && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Raw Token Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Access Token Payload</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                {JSON.stringify(accessTokenPayload, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Refresh Token Payload</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                {JSON.stringify(refreshTokenPayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Testing Instructions */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">🧪 Testing Instructions</h3>
        <div className="text-sm text-yellow-700 space-y-2">
          <p><strong>1. Manual Logout Test:</strong> Use the logout button in the login form</p>
          <p><strong>2. Session Expiry Test:</strong> Wait for access token to expire (1 minute), then click "Test Profile Query"</p>
          <p><strong>3. Token Refresh Test:</strong> When access token expires, the system should automatically refresh it</p>
          <p><strong>4. Complete Expiry Test:</strong> Wait for both tokens to expire, then try any action</p>
          <p><strong>5. Browser Refresh Test:</strong> Refresh the page to test session restoration</p>
        </div>
      </div>

      {/* Expected Behaviors */}
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Expected Behaviors</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li><strong>Access Token Expires:</strong> Should auto-refresh and retry the request</li>
          <li><strong>Refresh Token Expires:</strong> Should show session expiry message and logout</li>
          <li><strong>Manual Logout:</strong> Should call API and clear all local data</li>
          <li><strong>Page Refresh:</strong> Should restore session if tokens are valid</li>
        </ul>
      </div>
    </div>
  );
}