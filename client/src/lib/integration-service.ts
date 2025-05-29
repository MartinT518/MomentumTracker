import { apiRequest } from "./queryClient";

export interface IntegrationAuth {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
  platform: 'strava' | 'garmin' | 'polar';
}

export interface Activity {
  id: string;
  externalId?: string;
  name: string;
  type: string;
  startDate: string;
  endDate?: string;
  distance?: number;
  duration: number;
  elevationGain?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  averagePace?: number;
  maxPace?: number;
  startLatitude?: number;
  startLongitude?: number;
  endLatitude?: number;
  endLongitude?: number;
  polyline?: string;
  source: string;
  userId: number;
}

// URLs for authentication
export const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
export const GARMIN_AUTH_URL = "https://connect.garmin.com/oauthConfirm";
export const POLAR_AUTH_URL = "https://flow.polar.com/oauth2/authorization";

// Functions for initiating auth flow
export function initiateStravaAuth() {
  const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
  const redirectUri = `${window.location.origin}/integrations/strava/callback`;
  const scope = "read,activity:read_all,profile:read_all";
  
  const authUrl = `${STRAVA_AUTH_URL}?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=${scope}`;
  
  window.location.href = authUrl;
}

export function initiateGarminAuth() {
  const clientId = import.meta.env.VITE_GARMIN_CLIENT_ID;
  const redirectUri = `${window.location.origin}/integrations/garmin/callback`;
  
  const authUrl = `${GARMIN_AUTH_URL}?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  window.location.href = authUrl;
}

export function initiatePolarAuth() {
  const clientId = import.meta.env.VITE_POLAR_CLIENT_ID;
  const redirectUri = `${window.location.origin}/integrations/polar/callback`;
  const scope = "accesslink.read_all";
  
  const authUrl = `${POLAR_AUTH_URL}?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
  
  window.location.href = authUrl;
}

// Functions for handling auth callbacks
export async function handleStravaCallback(code: string): Promise<boolean> {
  try {
    const response = await apiRequest('POST', '/api/integrations/strava/authenticate', { code });
    
    if (!response.ok) {
      throw new Error('Failed to authenticate with Strava');
    }
    
    return true;
  } catch (error) {
    console.error('Strava authentication error:', error);
    return false;
  }
}

export async function handleGarminCallback(code: string): Promise<boolean> {
  try {
    const response = await apiRequest('POST', '/api/integrations/garmin/authenticate', { code });
    
    if (!response.ok) {
      throw new Error('Failed to authenticate with Garmin');
    }
    
    return true;
  } catch (error) {
    console.error('Garmin authentication error:', error);
    return false;
  }
}

export async function handlePolarCallback(code: string): Promise<boolean> {
  try {
    const response = await apiRequest('POST', '/api/integrations/polar/authenticate', { code });
    
    if (!response.ok) {
      throw new Error('Failed to authenticate with Polar');
    }
    
    return true;
  } catch (error) {
    console.error('Polar authentication error:', error);
    return false;
  }
}

// Functions for managing integrations
export async function getIntegrations() {
  try {
    const response = await apiRequest('GET', '/api/integrations');
    
    if (!response.ok) {
      throw new Error('Failed to fetch integrations');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching integrations:', error);
    throw error;
  }
}

export async function disconnectIntegration(platform: string) {
  try {
    const response = await apiRequest('DELETE', `/api/integrations/${platform}`);
    
    if (!response.ok) {
      throw new Error(`Failed to disconnect ${platform} integration`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error disconnecting ${platform} integration:`, error);
    throw error;
  }
}

// Functions for syncing activities
export async function syncActivities(platform: string, forceSync = false) {
  try {
    const response = await apiRequest('POST', `/api/integrations/${platform}/sync`, { forceSync });
    
    if (!response.ok) {
      throw new Error(`Failed to sync activities from ${platform}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error syncing activities from ${platform}:`, error);
    throw error;
  }
}

export async function getLastSyncStatus(platform: string) {
  try {
    // Get sync history with limit=1 to get only the most recent
    const response = await apiRequest('GET', `/api/integrations/${platform}/sync-history?limit=1`);
    
    if (!response.ok) {
      throw new Error(`Failed to get sync status for ${platform}`);
    }
    
    const history = await response.json();
    return history.length > 0 ? history[0] : null;
  } catch (error) {
    console.error(`Error getting sync status for ${platform}:`, error);
    throw error;
  }
}

export async function getSyncLogById(platform: string, syncLogId: number) {
  try {
    const response = await apiRequest('GET', `/api/integrations/${platform}/sync/${syncLogId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get sync log ${syncLogId} for ${platform}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting sync log for ${platform}:`, error);
    throw error;
  }
}

export async function getSyncHistory(platform: string, limit: number = 5) {
  try {
    const response = await apiRequest('GET', `/api/integrations/${platform}/sync-history?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get sync history for ${platform}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting sync history for ${platform}:`, error);
    throw error;
  }
}

// Function to update sync settings
export async function updateSyncSettings(platform: string, settings: { autoSync: boolean, syncFrequency?: 'daily' | 'realtime' }) {
  try {
    const response = await apiRequest('PUT', `/api/integrations/${platform}/settings`, settings);
    
    if (!response.ok) {
      throw new Error(`Failed to update sync settings for ${platform}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating sync settings for ${platform}:`, error);
    throw error;
  }
}

// Export activities to services
export async function exportWorkoutToService(workoutId: number, platform: string) {
  try {
    const response = await apiRequest('POST', `/api/integrations/${platform}/export`, { workoutId });
    
    if (!response.ok) {
      throw new Error(`Failed to export workout to ${platform}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error exporting workout to ${platform}:`, error);
    throw error;
  }
}