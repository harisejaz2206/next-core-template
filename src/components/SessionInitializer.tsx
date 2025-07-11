'use client';

import { useEffect, useState } from 'react';
import { restoreUserSession, shouldRestoreSession } from '@/lib/session-restore';

interface SessionInitializerProps {
  children: React.ReactNode;
}

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