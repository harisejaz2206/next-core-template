'use client';

import { useState } from 'react';
import { useGetUserProfileQuery, useLazyGetUserProfileQuery } from '@/@redux/features/api/api.slice';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '@/@redux/features/auth/auth.selectors';

export default function ProfileTestButton() {
  const [showResults, setShowResults] = useState(false);
  const [manualTrigger, setManualTrigger] = useState(false);
  
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectUser);
  
  // Auto query (runs immediately if enabled)
  const autoQuery = useGetUserProfileQuery(undefined, {
    skip: !manualTrigger, // Only run when manually triggered
  });
  
  // Lazy query (manual trigger)
  const [triggerLazyQuery, lazyQueryResult] = useLazyGetUserProfileQuery();

  const handleAutoQuery = () => {
    setManualTrigger(true);
    setShowResults(true);
  };

  const handleLazyQuery = () => {
    triggerLazyQuery();
    setShowResults(true);
  };

  const handleReset = () => {
    setManualTrigger(false);
    setShowResults(false);
  };

  const renderQueryResult = (result: any, label: string) => {
    if (result.isLoading) {
      return (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800 font-medium">{label}: Loading...</p>
          <div className="mt-2 w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (result.error) {
      return (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 font-medium">{label}: Error</p>
          <pre className="mt-2 text-sm text-red-700 overflow-x-auto">
            {JSON.stringify(result.error, null, 2)}
          </pre>
        </div>
      );
    }

    if (result.data) {
      return (
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 font-medium">{label}: Success</p>
          <pre className="mt-2 text-sm text-green-700 overflow-x-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="p-3 bg-gray-50 border border-gray-200 rounded">
        <p className="text-gray-800 font-medium">{label}: Not triggered</p>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile Query Test</h2>
      
      {/* Current Auth State */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Current Auth State</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
          <p><strong>User in Redux:</strong> {currentUser ? '✅ Yes' : '❌ No'}</p>
          {currentUser && (
            <p><strong>User Email:</strong> {currentUser.email}</p>
          )}
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Test Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleAutoQuery}
            disabled={manualTrigger}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            Test Auto Query
          </button>
          
          <button
            onClick={handleLazyQuery}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Test Lazy Query
          </button>
          
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Test Results */}
      {showResults && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Query Results</h3>
          
          {manualTrigger && renderQueryResult(autoQuery, "Auto Query")}
          {renderQueryResult(lazyQueryResult, "Lazy Query")}
        </div>
      )}

      {/* Test Scenarios Info */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Test Scenarios</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li><strong>Not Logged In:</strong> Should get 401 error and trigger logout</li>
          <li><strong>Valid Token:</strong> Should return user profile successfully</li>
          <li><strong>Expired Token:</strong> Should auto-refresh and retry</li>
          <li><strong>Invalid Token:</strong> Should get error and trigger logout</li>
        </ul>
      </div>
    </div>
  );
} 