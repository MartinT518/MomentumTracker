import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HealthMetricsPage from './health-metrics-page';
import { TestWrapper } from '@/test/test-wrapper';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock the dependencies that are causing issues
vi.mock('@/components/common/sidebar', () => {
  return {
    __esModule: true,
    default: () => ({ 
      type: 'div',
      props: {},
      key: null,
      ref: null
    })
  };
});

vi.mock('@/components/common/mobile-menu', () => {
  return {
    __esModule: true,
    default: () => ({ 
      type: 'div',
      props: {},
      key: null,
      ref: null
    })
  };
});

// Mock toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('HealthMetricsPage (Simplified)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows health metrics page title when user is authenticated', async () => {
    // Mock API response
    server.use(
      http.get('/api/health-metrics', () => {
        return HttpResponse.json([
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
        ]);
      })
    );

    // Render with test wrapper
    render(
      <TestWrapper authenticated={true}>
        <HealthMetricsPage />
      </TestWrapper>
    );
    
    // Check if the main title appears
    await waitFor(() => {
      expect(screen.getByText('Health Metrics')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Track your biometric data and energy levels')).toBeInTheDocument();
  });

  it('shows unauthorized message when user is not authenticated', async () => {
    render(
      <TestWrapper authenticated={false}>
        <HealthMetricsPage />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/please log in to view your health metrics/i)).toBeInTheDocument();
    });
  });
});