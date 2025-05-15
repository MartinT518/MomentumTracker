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
    // Mock login response
    server.use(
      http.post('/api/login', () => {
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
    
    // Attempt login
    result.current.loginMutation.mutate({
      username: 'testuser',
      password: 'password123',
    });
    
    // Wait for login to complete
    await waitFor(() => {
      expect(result.current.loginMutation.isPending).toBeFalsy();
    });
    
    // User should be logged in
    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.username).toBe('testuser');
  });

  it('should handle registration correctly', async () => {
    // Mock registration response
    server.use(
      http.post('/api/register', () => {
        return HttpResponse.json({
          id: 2,
          username: 'newuser',
          email: 'new@example.com',
        }, { status: 201 });
      })
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    // Wait for auth to complete loading
    await waitFor(() => {
      expect(result.current.isLoading).toBeFalsy();
    });
    
    // Attempt registration
    result.current.registerMutation.mutate({
      username: 'newuser',
      password: 'password123',
      email: 'new@example.com',
    });
    
    // Wait for registration to complete
    await waitFor(() => {
      expect(result.current.registerMutation.isPending).toBeFalsy();
    });
    
    // User should be registered and logged in
    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.username).toBe('newuser');
  });

  it('should handle logout correctly', async () => {
    // Mock logout response
    server.use(
      http.post('/api/logout', () => {
        return new HttpResponse(null, { status: 200 });
      })
    );
    
    // Start with authenticated user
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
    
    // Wait for auth to complete loading and user to be authenticated
    await waitFor(() => {
      expect(result.current.isLoading).toBeFalsy();
      expect(result.current.user).not.toBeNull();
    });
    
    // Attempt logout
    result.current.logoutMutation.mutate();
    
    // Wait for logout to complete
    await waitFor(() => {
      expect(result.current.logoutMutation.isPending).toBeFalsy();
    });
    
    // User should be logged out
    expect(result.current.user).toBeNull();
  });
});