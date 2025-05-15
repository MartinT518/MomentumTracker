import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthContext } from '@/hooks/use-auth';

// Create a test wrapper that provides auth context and query client
interface TestWrapperProps {
  children: React.ReactNode;
  authenticated?: boolean;
}

export function TestWrapper({ children, authenticated = true }: TestWrapperProps) {
  // Mock auth context value with complete user object structure
  const authContextValue = {
    user: authenticated ? { 
      id: 1, 
      username: 'testuser', 
      password: 'hashed_password', 
      email: 'test@example.com',
      created_at: new Date(),
      updated_at: new Date(),
      age: 30,
      weight: '70.5',
      height: '175.5',
      experience_level: 'intermediate',
      bio: 'Test user bio',
      profile_image: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: 'free',
      subscription_end_date: null
    } : null,
    isLoading: false,
    error: null,
    loginMutation: { 
      mutate: () => {}, 
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null
    },
    registerMutation: { 
      mutate: () => {}, 
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null
    },
    logoutMutation: { 
      mutate: () => {}, 
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null
    }
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authContextValue}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}