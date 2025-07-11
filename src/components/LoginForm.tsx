'use client';

import { useState } from 'react';
import { useLoginMutation } from '@/@redux/features/api/api.slice';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, selectIsAuthenticated } from '@/@redux/features/auth/auth.selectors';
import { logout } from '@/@redux/features/auth/auth.slice';
import { removeAccessToken, removeRefreshToken } from '@/lib/auth';
import AuthErrorDisplay from './AuthErrorDisplay';

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
      // console.error('Login error:', err);
    }
  };

  const handleLogout = () => {
    // Clear tokens from localStorage
    removeAccessToken();
    removeRefreshToken();
    // Clear Redux state
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
          <button
            onClick={handleLogout}
            className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {serverMessage && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm font-medium">Server Response:</p>
            <p className="text-sm text-gray-700">{serverMessage}</p>
          </div>
        )}
        
        {!!error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm font-medium text-red-800">Error Details:</p>
            <p className="text-sm text-red-700">Check console for full error details</p>
          </div>
        )}
      </div>
    </>
  );
} 