'use client';

import { useSelector } from 'react-redux';
import { selectAuthError } from '@/@redux/features/auth/auth.selectors';

export default function AuthErrorDisplay() {
  const authError = useSelector(selectAuthError);

  if (!authError) return null;

  // Check if this is a session expiry message
  const isSessionExpiry = authError.includes('session has expired') || authError.includes('🔒');
  
  // Different styling for session expiry vs general errors
  const bgColor = isSessionExpiry ? 'bg-yellow-50' : 'bg-red-50';
  const borderColor = isSessionExpiry ? 'border-yellow-200' : 'border-red-200';
  const iconColor = isSessionExpiry ? 'text-yellow-400' : 'text-red-400';
  const titleColor = isSessionExpiry ? 'text-yellow-800' : 'text-red-800';
  const textColor = isSessionExpiry ? 'text-yellow-700' : 'text-red-700';
  const title = isSessionExpiry ? 'Session Expired' : 'Authentication Error';

  return (
    <div className={`fixed top-4 right-4 max-w-md ${bgColor} border ${borderColor} rounded-lg p-4 shadow-lg z-50`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isSessionExpiry ? (
            <svg className={`h-5 w-5 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1C5.58 1 2 4.58 2 9s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zM9 13H7v-2h2v2zm0-4H7V5h2v4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${titleColor}`}>{title}</h3>
          <div className={`mt-1 text-sm ${textColor}`}>
            {authError}
          </div>
        </div>
      </div>
    </div>
  );
} 