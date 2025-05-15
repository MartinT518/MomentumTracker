import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HealthMetricsContent } from './health-metrics-content';
import { AuthContext } from '@/hooks/use-auth';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

// Helper function to render with providers
const renderWithProviders = (ui: React.ReactElement, { authenticated = true } = {}) => {
  // Create a mock user based on authenticated state
  const mockUser = authenticated ? {
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
  } : null;

  // Create a more complete mock auth context
  const mockAuthContext = {
    user: mockUser,
    isLoading: false,
    error: null,
    loginMutation: {
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isSuccess: false,
      isError: false, 
      error: null,
      data: undefined,
      variables: undefined,
      isIdle: true,
      status: 'idle',
      failureCount: 0,
      failureReason: null,
      reset: vi.fn()
    },
    registerMutation: {
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isSuccess: false,
      isError: false, 
      error: null,
      data: undefined,
      variables: undefined,
      isIdle: true,
      status: 'idle',
      failureCount: 0,
      failureReason: null,
      reset: vi.fn()
    },
    logoutMutation: {
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isSuccess: false,
      isError: false, 
      error: null,
      data: undefined,
      variables: undefined,
      isIdle: true,
      status: 'idle',
      failureCount: 0,
      failureReason: null,
      reset: vi.fn()
    }
  };

  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    </AuthContext.Provider>
  );
};

describe('HealthMetricsContent', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('should show loading state initially when authenticated', async () => {
    // Set up a delayed response to show loading state
    server.use(
      http.get('/api/health-metrics', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json([]);
      })
    );

    renderWithProviders(<HealthMetricsContent />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show unauthorized message when not authenticated', async () => {
    renderWithProviders(<HealthMetricsContent />, { authenticated: false });
    
    expect(screen.getByText(/please log in to view your health metrics/i)).toBeInTheDocument();
  });

  it('should show empty state message when no metrics are available', async () => {
    // Mock empty response
    server.use(
      http.get('/api/health-metrics', () => {
        return HttpResponse.json([]);
      })
    );

    renderWithProviders(<HealthMetricsContent />);
    
    await waitFor(() => {
      expect(screen.getByText(/no health metrics found/i)).toBeInTheDocument();
    });
  });

  it('should display health metrics when data is available', async () => {
    // Mock health metrics data
    const mockMetrics = [
      {
        id: 1,
        date: '2024-05-01',
        userId: 1,
        hrvScore: 75,
        restingHeartRate: 55,
        sleepQuality: 'Good',
        sleepDuration: 7.5,
        stressLevel: 'Medium',
        platform: 'Garmin',
        syncDate: '2024-05-01'
      }
    ];

    server.use(
      http.get('/api/health-metrics', () => {
        return HttpResponse.json(mockMetrics);
      })
    );

    renderWithProviders(<HealthMetricsContent />);
    
    await waitFor(() => {
      expect(screen.getByText('HRV Score: 75')).toBeInTheDocument();
      expect(screen.getByText('Resting HR: 55 bpm')).toBeInTheDocument();
      expect(screen.getByText('Sleep Quality: Good')).toBeInTheDocument();
      expect(screen.getByText('Sleep Duration: 7.5 hrs')).toBeInTheDocument();
      expect(screen.getByText('Stress Level: Medium')).toBeInTheDocument();
      expect(screen.getByText('Source: Garmin')).toBeInTheDocument();
    });
  });
});