import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from './utils';
import HealthMetricsPage from '../pages/health-metrics-page';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';
import { queryClient } from '@/lib/queryClient';

// Mock the useAuth hook
vi.mock('@/hooks/use-auth', async () => {
  const actual = await vi.importActual('@/hooks/use-auth');
  return {
    ...actual,
    useAuth: vi.fn(() => ({
      user: { id: 1, username: 'testuser' },
      isLoading: false,
      error: null,
      loginMutation: { isPending: false, mutate: vi.fn() },
      logoutMutation: { isPending: false, mutate: vi.fn() },
      registerMutation: { isPending: false, mutate: vi.fn() },
    })),
  };
});

// Mock toast hook to track notifications
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('Health Metrics Import', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    mockToast.mockClear();
  });

  it('should import health data from Garmin successfully', async () => {
    // Mock Garmin import endpoint
    server.use(
      http.post('/api/garmin/health-metrics/import', () => {
        return HttpResponse.json({ count: 5 }, { status: 200 });
      }),
      
      // Mock integrations endpoint to show connected Garmin
      http.get('/api/integrations', () => {
        return HttpResponse.json([
          { id: 1, user_id: 1, provider: 'garmin', connected_at: '2023-05-01T12:00:00Z' },
        ], { status: 200 });
      })
    );
    
    renderWithProviders(<HealthMetricsPage />);
    
    // Find and click the import button
    const importButton = await screen.findByText('Import Health Data');
    fireEvent.click(importButton);
    
    // Wait for the dialog to appear
    await screen.findByText('Import Health Data');
    
    // Find and click the select trigger
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    // Select Garmin Connect
    fireEvent.click(await screen.findByText('Garmin Connect'));
    
    // Check consent checkbox
    const consentCheckbox = screen.getByRole('checkbox');
    fireEvent.click(consentCheckbox);
    
    // Find and click import button
    const dialogImportButton = screen.getByRole('button', { name: 'Import Health Data' });
    fireEvent.click(dialogImportButton);
    
    // Wait for toast notification
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Garmin data imported',
          description: expect.stringContaining('5'),
        })
      );
    });
  });
  
  it('should import health data from Strava successfully', async () => {
    // Mock Strava import endpoint
    server.use(
      http.post('/api/strava/health-metrics/import', () => {
        return HttpResponse.json({ count: 3 }, { status: 200 });
      }),
      
      // Mock integrations endpoint to show connected Strava
      http.get('/api/integrations', () => {
        return HttpResponse.json([
          { id: 2, user_id: 1, provider: 'strava', connected_at: '2023-05-01T12:00:00Z' },
        ], { status: 200 });
      })
    );
    
    renderWithProviders(<HealthMetricsPage />);
    
    // Find and click the import button
    const importButton = await screen.findByText('Import Health Data');
    fireEvent.click(importButton);
    
    // Wait for the dialog to appear
    await screen.findByText('Import Health Data');
    
    // Find and click the select trigger
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    // Select Strava
    fireEvent.click(await screen.findByText('Strava'));
    
    // Check consent checkbox
    const consentCheckbox = screen.getByRole('checkbox');
    fireEvent.click(consentCheckbox);
    
    // Find and click import button
    const dialogImportButton = screen.getByRole('button', { name: 'Import Health Data' });
    fireEvent.click(dialogImportButton);
    
    // Wait for toast notification
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Strava data imported',
          description: expect.stringContaining('3'),
        })
      );
    });
  });
  
  it('should import health data from Polar successfully', async () => {
    // Mock Polar import endpoint
    server.use(
      http.post('/api/polar/health-metrics/import', () => {
        return HttpResponse.json({ count: 4 }, { status: 200 });
      }),
      
      // Mock integrations endpoint to show connected Polar
      http.get('/api/integrations', () => {
        return HttpResponse.json([
          { id: 3, user_id: 1, provider: 'polar', connected_at: '2023-05-01T12:00:00Z' },
        ], { status: 200 });
      })
    );
    
    renderWithProviders(<HealthMetricsPage />);
    
    // Find and click the import button
    const importButton = await screen.findByText('Import Health Data');
    fireEvent.click(importButton);
    
    // Wait for the dialog to appear
    await screen.findByText('Import Health Data');
    
    // Find and click the select trigger
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    // Select Polar
    fireEvent.click(await screen.findByText('Polar Flow'));
    
    // Check consent checkbox
    const consentCheckbox = screen.getByRole('checkbox');
    fireEvent.click(consentCheckbox);
    
    // Find and click import button
    const dialogImportButton = screen.getByRole('button', { name: 'Import Health Data' });
    fireEvent.click(dialogImportButton);
    
    // Wait for toast notification
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Polar data imported',
          description: expect.stringContaining('4'),
        })
      );
    });
  });
  
  it('should handle errors when platform is not connected', async () => {
    // Mock Garmin import endpoint with 404 error
    server.use(
      http.post('/api/garmin/health-metrics/import', () => {
        return HttpResponse.json(
          { message: 'No Garmin connection found. Please connect your Garmin account first.' }, 
          { status: 404 }
        );
      }),
      
      // Mock empty integrations
      http.get('/api/integrations', () => {
        return HttpResponse.json([], { status: 200 });
      })
    );
    
    renderWithProviders(<HealthMetricsPage />);
    
    // Find and click the import button
    const importButton = await screen.findByText('Import Health Data');
    fireEvent.click(importButton);
    
    // Wait for the dialog to appear
    await screen.findByText('Import Health Data');
    
    // Find and click the select trigger
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    // Select Garmin Connect
    fireEvent.click(await screen.findByText('Garmin Connect'));
    
    // Check consent checkbox
    const consentCheckbox = screen.getByRole('checkbox');
    fireEvent.click(consentCheckbox);
    
    // Find and click import button
    const dialogImportButton = screen.getByRole('button', { name: 'Import Health Data' });
    fireEvent.click(dialogImportButton);
    
    // Wait for error toast notification
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Import failed',
          variant: 'destructive',
        })
      );
    });
  });
});