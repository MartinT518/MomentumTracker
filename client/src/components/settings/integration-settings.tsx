import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Activity } from 'lucide-react';

interface IntegrationPlatform {
  id: string;
  name: string;
  logoIcon: React.ReactNode;
  description: string;
  isConnected: boolean;
  lastSynced?: string;
}

interface IntegrationConnection {
  id: number;
  user_id: number;
  platform: string;
  is_active: boolean;
  last_sync_at: string | null;
  athlete_id: string | null;
}

export function IntegrationSettings() {
  const { toast } = useToast();
  const [syncInProgress, setSyncInProgress] = useState<string | null>(null);

  // Fetch existing connections
  const { data: connections, isLoading } = useQuery<IntegrationConnection[]>({
    queryKey: ['/api/integrations'],
    queryFn: () => apiRequest('GET', '/api/integrations').then(res => res.json())
  });

  // Connect integration mutation
  const connectMutation = useMutation({
    mutationFn: async (platform: string) => {
      const response = await apiRequest('POST', `/api/integrations/connect/${platform}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start connection process');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to authorization page
      window.location.href = data.authUrl;
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to connect",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Disconnect integration mutation
  const disconnectMutation = useMutation({
    mutationFn: async (platform: string) => {
      const response = await apiRequest('DELETE', `/api/integrations/${platform}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to disconnect');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Success",
        description: "Integration disconnected successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to disconnect",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Toggle active state mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ platform, active }: { platform: string, active: boolean }) => {
      const response = await apiRequest('PATCH', `/api/integrations/${platform}`, { is_active: active });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update settings');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Success",
        description: "Integration settings updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Sync data mutation
  const syncDataMutation = useMutation({
    mutationFn: async (platform: string) => {
      setSyncInProgress(platform);
      const response = await apiRequest('POST', `/api/integrations/sync/${platform}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sync data');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSyncInProgress(null);
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/health-metrics'] });
      toast({
        title: "Success",
        description: `Synced ${data.activities || 0} activities and ${data.metrics || 0} health metrics`,
      });
    },
    onError: (error: Error) => {
      setSyncInProgress(null);
      toast({
        title: "Failed to sync data",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Define available platforms
  const platforms: IntegrationPlatform[] = [
    {
      id: "strava",
      name: "Strava",
      logoIcon: <Activity className="h-6 w-6 text-orange-600" />,
      description: "Connect to Strava to automatically import your running and cycling activities.",
      isConnected: connections?.some(conn => conn.platform === "strava") || false,
      lastSynced: connections?.find(conn => conn.platform === "strava")?.last_sync_at || undefined
    },
    {
      id: "garmin",
      name: "Garmin Connect",
      logoIcon: <Activity className="h-6 w-6 text-blue-600" />,
      description: "Import activities, health metrics, and sleep data from your Garmin device.",
      isConnected: connections?.some(conn => conn.platform === "garmin") || false,
      lastSynced: connections?.find(conn => conn.platform === "garmin")?.last_sync_at || undefined
    },
    {
      id: "polar",
      name: "Polar Flow",
      logoIcon: <Activity className="h-6 w-6 text-red-600" />,
      description: "Get activities, heart rate data, and workouts from your Polar devices.",
      isConnected: connections?.some(conn => conn.platform === "polar") || false,
      lastSynced: connections?.find(conn => conn.platform === "polar")?.last_sync_at || undefined
    }
  ];

  // Get connection status for a platform
  const getConnectionStatus = (platformId: string) => {
    if (!connections) return { isConnected: false, isActive: false };
    
    const connection = connections.find(conn => conn.platform === platformId);
    return {
      isConnected: !!connection,
      isActive: connection?.is_active || false
    };
  };

  const handleConnect = (platform: string) => {
    connectMutation.mutate(platform);
  };

  const handleDisconnect = (platform: string) => {
    disconnectMutation.mutate(platform);
  };

  const handleToggleActive = (platform: string, active: boolean) => {
    toggleActiveMutation.mutate({ platform, active });
  };

  const handleSync = (platform: string) => {
    syncDataMutation.mutate(platform);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-medium">Fitness Platform Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect to your favorite fitness platforms to automatically import your activities,
          health metrics, and training data.
        </p>
      </div>
      <Separator />
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid gap-4">
          {platforms.map((platform) => {
            const { isConnected, isActive } = getConnectionStatus(platform.id);
            
            return (
              <Card key={platform.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    {platform.logoIcon}
                    <CardTitle className="text-lg">{platform.name}</CardTitle>
                  </div>
                  {isConnected && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground mr-2">Active</span>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) => handleToggleActive(platform.id, checked)}
                        disabled={disconnectMutation.isPending || toggleActiveMutation.isPending}
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <CardDescription>{platform.description}</CardDescription>
                  
                  {isConnected && platform.lastSynced && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last synced: {new Date(platform.lastSynced).toLocaleString()}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  {isConnected ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleDisconnect(platform.id)}
                        disabled={disconnectMutation.isPending}
                      >
                        Disconnect
                      </Button>
                      <Button
                        onClick={() => handleSync(platform.id)}
                        disabled={syncInProgress !== null || !isActive}
                      >
                        {syncInProgress === platform.id ? (
                          <>
                            <span className="animate-spin mr-2">⟳</span>
                            Syncing...
                          </>
                        ) : (
                          "Sync Data"
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleConnect(platform.id)}
                      disabled={connectMutation.isPending}
                    >
                      Connect {platform.name}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <h4 className="text-lg font-medium">About Integration Data</h4>
        <div className="text-sm text-muted-foreground mt-2 space-y-2">
          <p>
            When you connect to external fitness platforms, MomentumRun will import:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your running, cycling, and other activities</li>
            <li>Health metrics including HRV, resting heart rate, and sleep data</li>
            <li>Training sessions and workout details</li>
          </ul>
          <p>
            Data will automatically sync daily, but you can also manually sync anytime.
            You can disconnect or pause any integration at any time.
          </p>
        </div>
      </div>
    </div>
  );
}