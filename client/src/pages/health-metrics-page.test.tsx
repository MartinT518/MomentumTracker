import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from '../test/utils';
import HealthMetricsPage from './health-metrics-page';
import { queryClient } from '@/lib/queryClient';
import * as authHook from '@/hooks/use-auth';

// Mock the useAuth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: 'testuser' },
    isLoading: false,
    error: null,
  })),
}));

// Mock toast hook to track notifications
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('HealthMetricsPage', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('renders the health metrics page with title', async () => {
    renderWithProviders(<HealthMetricsPage />);
    
    // Check if the main title is rendered
    expect(await screen.findByText('Health Metrics')).toBeInTheDocument();
    expect(screen.getByText('Track your biometric data and energy levels')).toBeInTheDocument();
  });

  it('shows the import health data button', async () => {
    renderWithProviders(<HealthMetricsPage />);
    
    // Check if the import button is rendered
    expect(await screen.findByText('Import Health Data')).toBeInTheDocument();
  });

  it('opens import dialog when Import Health Data button is clicked', async () => {
    renderWithProviders(<HealthMetricsPage />);
    
    // Find and click the import button
    const importButton = await screen.findByText('Import Health Data');
    fireEvent.click(importButton);
    
    // Check if the dialog title is rendered
    expect(await screen.findByText('Import Health Data')).toBeInTheDocument();
    expect(screen.getByText('Select Platform')).toBeInTheDocument();
  });

  it('allows user to select different platforms for import', async () => {
    renderWithProviders(<HealthMetricsPage />);
    
    // Open the import dialog
    const importButton = await screen.findByText('Import Health Data');
    fireEvent.click(importButton);
    
    // Wait for the dialog to appear
    await screen.findByText('Import Health Data');
    
    // Find and click the select trigger
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    // Verify platform options are available
    expect(await screen.findByText('Garmin Connect')).toBeInTheDocument();
    expect(screen.getByText('Strava')).toBeInTheDocument();
    expect(screen.getByText('Polar Flow')).toBeInTheDocument();
    
    // Select Strava
    fireEvent.click(screen.getByText('Strava'));
    
    // Check consent checkbox
    const consentCheckbox = screen.getByRole('checkbox');
    fireEvent.click(consentCheckbox);
    
    // Find and click import button
    const dialogImportButton = screen.getByRole('button', { name: 'Import Health Data' });
    expect(dialogImportButton).not.toBeDisabled();
  });

  it('shows no health metrics message when there are no metrics', async () => {
    // Mock empty health metrics response
    vi.mock('../lib/queryClient', () => ({
      queryClient: {
        setQueryData: vi.fn(),
        getQueryData: vi.fn(),
        invalidateQueries: vi.fn(),
      },
      apiRequest: vi.fn().mockResolvedValue({
        json: () => Promise.resolve([]),
      }),
    }));
    
    renderWithProviders(<HealthMetricsPage />);
    
    // Wait for the loading to finish and check for empty state message
    await waitFor(() => {
      expect(screen.getByText(/No health metrics found/i)).toBeInTheDocument();
    });
  });

  it('should show unauthorized message when user is not logged in', async () => {
    // Mock unauthenticated user
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    } as any);
    
    renderWithProviders(<HealthMetricsPage />);
    
    // Check for unauthorized message
    await waitFor(() => {
      expect(screen.getByText(/Please log in to view your health metrics/i)).toBeInTheDocument();
    });
  });
});