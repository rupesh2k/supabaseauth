// features/auth/context/useAuth.ts

import { useContext } from 'react';
import { AuthContext } from './AuthContext';

/**
 * Hook to access auth context.
 * Must be used within AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
