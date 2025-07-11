'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/root-reducer';

export default function ReduxCacheExplorer() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Get auth state
  const authState = useSelector((state: RootState) => state.auth);
  
  // Get API state
  const apiState = useSelector((state: RootState) => state.api);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderJsonSection = (title: string, data: any, sectionKey: string) => {
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-4 py-3 bg-gray-50 text-left font-medium text-gray-700 hover:bg-gray-100 flex items-center justify-between"
        >
          <span>{title}</span>
          <span className="text-sm">{isExpanded ? '▼' : '▶'}</span>
        </button>
        
        {isExpanded && (
          <div className="p-4 bg-white">
            <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const renderCacheAnalysis = () => {
    const mutations = apiState?.mutations || {};
    const queries = apiState?.queries || {};
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-semibold text-blue-800">Mutations</h4>
            <p className="text-blue-700">Count: {Object.keys(mutations).length}</p>
            <p className="text-blue-600 text-xs mt-1">
              POST/PUT/DELETE operations
            </p>
          </div>
          
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <h4 className="font-semibold text-green-800">Queries</h4>
            <p className="text-green-700">Count: {Object.keys(queries).length}</p>
            <p className="text-green-600 text-xs mt-1">
              GET operations & cached data
            </p>
          </div>
          
          <div className="p-3 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-800">Auth State</h4>
            <p className="text-purple-700">
              User: {authState.user ? '✅' : '❌'}
            </p>
            <p className="text-purple-600 text-xs mt-1">
              Application auth state
            </p>
          </div>
        </div>

        {/* Mutation Details */}
        {Object.keys(mutations).length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Recent Mutations</h4>
            {Object.entries(mutations).map(([key, mutation]: [string, any]) => (
              <div key={key} className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                <div className="font-medium">Key: {key}</div>
                <div>Status: <span className={`px-1 rounded ${
                  mutation.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                  mutation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>{mutation.status}</span></div>
                {mutation.endpointName && <div>Endpoint: {mutation.endpointName}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Query Details */}
        {Object.keys(queries).length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Cached Queries</h4>
            {Object.entries(queries).map(([key, query]: [string, any]) => (
              <div key={key} className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                <div className="font-medium">Key: {key}</div>
                <div>Status: <span className={`px-1 rounded ${
                  query.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                  query.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>{query.status}</span></div>
                {query.endpointName && <div>Endpoint: {query.endpointName}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Redux Cache Explorer</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Cache Analysis</h3>
        {renderCacheAnalysis()}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Detailed Data</h3>
        
        {renderJsonSection(
          "Auth State (Application Data)",
          authState,
          "auth"
        )}
        
        {renderJsonSection(
          "API Mutations Cache (Login Response)",
          apiState?.mutations || {},
          "mutations"
        )}
        
        {renderJsonSection(
          "API Queries Cache (Profile Data)",
          apiState?.queries || {},
          "queries"
        )}
        
        {renderJsonSection(
          "Complete API State",
          apiState,
          "api-complete"
        )}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Understanding the Cache</h3>
        <ul className="text-sm text-yellow-700 space-y-2">
          <li><strong>auth.user:</strong> Clean user data for your application logic</li>
          <li><strong>api.mutations:</strong> Complete API responses with metadata</li>
          <li><strong>api.queries:</strong> Cached GET request results</li>
          <li><strong>Cache Keys:</strong> Generated based on endpoint + arguments</li>
          <li><strong>Status:</strong> pending → fulfilled/rejected lifecycle</li>
        </ul>
      </div>
    </div>
  );
} 