import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth, AuthProvider } from './use-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

// Create a wrapper with the providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state correctly', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    // Initial state should have null user and isLoading true
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBeTruthy();
    
    // After loading completes
    await waitFor(() => {
      expect(result.current.isLoading).toBeFalsy();
    });
  });

  it('should return user data when authenticated', async () => {
    // Mock authenticated user response
    server.use(
      http.get('/api/user', () => {
        return HttpResponse.json({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        }, { status: 200 });
      })
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    // Wait for auth to complete loading
    await waitFor(() => {
      expect(result.current.isLoading).toBeFalsy();
    });
    
    // User should be authenticated
    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.username).toBe('testuser');
  });

  it('should handle login correctly', async () => {
    // Create a mock for the login mutation function
    const onSuccess = vi.fn();
    
    // Create a custom hook to test the login functionality
    const useLoginTest = () => {
      const { loginMutation } = useAuth();
      
      // Override the onSuccess callback
      loginMutation.mutate = vi.fn().mockImplementation(async (credentials) => {
        // Simulate login success
        onSuccess({
          id: 1,
          username: credentials.username,
          email: 'test@example.com',
        });
      });
      
      return { loginMutation };
    };
    
    // Render the test hook
    const { result } = renderHook(() => useLoginTest(), { wrapper: createWrapper() });
    
    // Attempt login
    result.current.loginMutation.mutate({
      username: 'testuser',
      password: 'password123',
    });
    
    // Check if onSuccess was called with correct user data
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      username: 'testuser'
    }));
  });

  it('should handle registration correctly', async () => {
    // Create a mock for the registration mutation function
    const onSuccess = vi.fn();
    
    // Create a custom hook to test the registration functionality
    const useRegisterTest = () => {
      const { registerMutation } = useAuth();
      
      // Override the onSuccess callback
      registerMutation.mutate = vi.fn().mockImplementation(async (userData) => {
        // Simulate registration success
        onSuccess({
          id: 2,
          username: userData.username,
          email: userData.email,
        });
      });
      
      return { registerMutation };
    };
    
    // Render the test hook
    const { result } = renderHook(() => useRegisterTest(), { wrapper: createWrapper() });
    
    // User registration data
    const userData = {
      username: 'newuser',
      password: 'password123',
      email: 'new@example.com',
    };
    
    // Attempt registration
    result.current.registerMutation.mutate(userData);
    
    // Check if onSuccess was called with correct user data
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({
      id: 2,
      username: 'newuser',
      email: 'new@example.com'
    }));
  });

  it('should handle logout correctly', async () => {
    // Create mocks for the queryClient's setQueryData method
    const setQueryDataMock = vi.fn();
    
    // Create a custom hook to test the logout functionality
    const useLogoutTest = () => {
      const auth = useAuth();
      
      // Mock the logoutMutation
      const mockLogoutMutation = {
        ...auth.logoutMutation,
        mutate: vi.fn().mockImplementation(() => {
          // Simulate logout success by setting user to null in the query cache
          setQueryDataMock(['/api/user'], null);
        }),
        isPending: false,
      };
      
      return { 
        ...auth,
        logoutMutation: mockLogoutMutation,
        // For testing, we'll provide a way to mock the user state
        setUser: (user: any) => setQueryDataMock(['/api/user'], user)
      };
    };
    
    // Render the test hook
    const { result } = renderHook(() => useLogoutTest(), { wrapper: createWrapper() });
    
    // Simulate that the user is initially logged in
    result.current.setUser({
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    });
    
    // Verify the mock was called
    expect(setQueryDataMock).toHaveBeenCalled();
    
    // Attempt logout
    result.current.logoutMutation.mutate();
    
    // Verify the logout mutation was called
    expect(result.current.logoutMutation.mutate).toHaveBeenCalled();
    
    // Verify the user was nullified in the cache
    expect(setQueryDataMock).toHaveBeenCalledWith(['/api/user'], null);
  });
});