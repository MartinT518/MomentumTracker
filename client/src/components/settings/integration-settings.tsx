import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  initiateStravaAuth, 
  initiateGarminAuth, 
  initiatePolarAuth,
  getIntegrations,
  disconnectIntegration,
  syncActivities,
  updateSyncSettings,
  getLastSyncStatus
} from '@/lib/integration-service';
import { Loader2, RefreshCw, Unplug, Clock, Check } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

type IntegrationStatus = {
  connected: boolean;
  lastSynced?: string;
  autoSync: boolean;
  syncFrequency?: 'daily' | 'realtime';
  platform: string;
  displayName: string;
};

export function IntegrationSettings() {
  const { toast } = useToast();
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);
  
  // Fetch integrations status
  const { 
    data: integrations = { strava: false, garmin: false, polar: false },
    isLoading: isLoadingIntegrations
  } = useQuery({
    queryKey: ['/api/integrations'],
    queryFn: async () => {
      try {
        return await getIntegrations();
      } catch (error) {
        // Default all to disconnected if there's an error
        return { strava: false, garmin: false, polar: false };
      }
    }
  });
  
  // Initialize integration statuses
  const [integrationStatuses, setIntegrationStatuses] = useState<IntegrationStatus[]>([
    { platform: 'strava', displayName: 'Strava', connected: false, autoSync: true, syncFrequency: 'daily' },
    { platform: 'garmin', displayName: 'Garmin Connect', connected: false, autoSync: true, syncFrequency: 'daily' },
    { platform: 'polar', displayName: 'Polar Flow', connected: false, autoSync: true, syncFrequency: 'daily' },
  ]);
  
  // Update integration statuses when data is loaded
  useEffect(() => {
    if (integrations) {
      setIntegrationStatuses(prev => prev.map(status => ({
        ...status,
        connected: !!integrations[status.platform as keyof typeof integrations]
      })));
    }
  }, [integrations]);
  
  // For each connected integration, fetch its last sync status
  useEffect(() => {
    integrationStatuses.forEach(status => {
      if (status.connected) {
        getLastSyncStatus(status.platform)
          .then(data => {
            setIntegrationStatuses(prev => prev.map(s => 
              s.platform === status.platform ? { ...s, lastSynced: data.lastSynced, autoSync: data.autoSync, syncFrequency: data.syncFrequency } : s
            ));
          })
          .catch(error => {
            console.error(`Error fetching sync status for ${status.platform}:`, error);
          });
      }
    });
  }, [integrationStatuses.map(s => s.connected).join(',')]);
  
  // Mutation for disconnecting an integration
  const disconnectMutation = useMutation({
    mutationFn: async (platform: string) => {
      return await disconnectIntegration(platform);
    },
    onSuccess: (_, platform) => {
      toast({
        title: 'Integration Disconnected',
        description: `Successfully disconnected from ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
      });
      
      // Update local state
      setIntegrationStatuses(prev => prev.map(status => 
        status.platform === platform ? { ...status, connected: false } : status
      ));
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
    onError: (error, platform) => {
      toast({
        title: 'Disconnection Failed',
        description: `Failed to disconnect from ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for syncing activities
  const syncMutation = useMutation({
    mutationFn: async ({ platform, forceSync = false }: { platform: string, forceSync?: boolean }) => {
      return await syncActivities(platform, forceSync);
    },
    onSuccess: (data, { platform }) => {
      toast({
        title: 'Activities Synced',
        description: `Successfully synced ${data.count} activities from ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
      });
      
      // Update last synced time
      setIntegrationStatuses(prev => prev.map(status => 
        status.platform === platform ? { ...status, lastSynced: new Date().toISOString() } : status
      ));
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
    onError: (error, { platform }) => {
      toast({
        title: 'Sync Failed',
        description: `Failed to sync activities from ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for updating sync settings
  const updateSyncSettingsMutation = useMutation({
    mutationFn: async ({ platform, settings }: { platform: string, settings: { autoSync: boolean, syncFrequency?: 'daily' | 'realtime' } }) => {
      return await updateSyncSettings(platform, settings);
    },
    onSuccess: (_, { platform, settings }) => {
      toast({
        title: 'Sync Settings Updated',
        description: `Successfully updated sync settings for ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
      });
      
      // Update local state
      setIntegrationStatuses(prev => prev.map(status => 
        status.platform === platform ? { ...status, ...settings } : status
      ));
    },
    onError: (error, { platform }) => {
      toast({
        title: 'Update Failed',
        description: `Failed to update sync settings for ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Handler for connecting to a service
  const handleConnect = (platform: string) => {
    switch (platform) {
      case 'strava':
        initiateStravaAuth();
        break;
      case 'garmin':
        initiateGarminAuth();
        break;
      case 'polar':
        initiatePolarAuth();
        break;
      default:
        toast({
          title: 'Unsupported Platform',
          description: `Integration with ${platform} is not supported yet.`,
          variant: 'destructive',
        });
    }
  };
  
  // Handler for disconnecting from a service
  const handleDisconnect = (platform: string) => {
    setConfirmDisconnect(platform);
  };
  
  // Handler for confirming disconnect
  const confirmDisconnectHandler = () => {
    if (confirmDisconnect) {
      disconnectMutation.mutate(confirmDisconnect);
      setConfirmDisconnect(null);
    }
  };
  
  // Handler for syncing activities
  const handleSync = (platform: string, forceSync = false) => {
    syncMutation.mutate({ platform, forceSync });
  };
  
  // Handler for toggling auto-sync
  const handleToggleAutoSync = (platform: string, autoSync: boolean) => {
    const status = integrationStatuses.find(s => s.platform === platform);
    if (status) {
      updateSyncSettingsMutation.mutate({ 
        platform, 
        settings: { 
          autoSync, 
          syncFrequency: status.syncFrequency 
        } 
      });
    }
  };
  
  // Handler for changing sync frequency
  const handleChangeSyncFrequency = (platform: string, syncFrequency: 'daily' | 'realtime') => {
    const status = integrationStatuses.find(s => s.platform === platform);
    if (status) {
      updateSyncSettingsMutation.mutate({ 
        platform, 
        settings: { 
          autoSync: status.autoSync, 
          syncFrequency 
        } 
      });
    }
  };
  
  // For rendering a formatted last synced time
  const formatLastSynced = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-4">Integration Accounts</h3>
        <p className="text-muted-foreground mb-4">
          Connect with your favorite fitness platforms to import activities and health data
        </p>
        
        {isLoadingIntegrations ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {integrationStatuses.map((integration) => (
              <div key={integration.platform} className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 p-4 border rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      integration.connected ? 'bg-green-100' : 'bg-neutral-100'
                    }`}>
                      {/* Platform-specific icon could go here */}
                      {integration.connected ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <span className="text-lg font-medium text-neutral-500">
                          {integration.displayName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium">{integration.displayName}</h4>
                      <div className="flex items-center text-sm text-muted-foreground">
                        {integration.connected ? (
                          <>
                            <span className="mr-2">Connected</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                              Active
                            </Badge>
                          </>
                        ) : (
                          <span>Not connected</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {integration.connected && (
                    <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4 md:ml-8">
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>Last sync: {formatLastSynced(integration.lastSynced)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Switch
                          id={`auto-sync-${integration.platform}`}
                          checked={integration.autoSync}
                          onCheckedChange={(checked) => handleToggleAutoSync(integration.platform, checked)}
                          className="mr-2"
                        />
                        <label htmlFor={`auto-sync-${integration.platform}`} className="text-sm">
                          Auto-sync
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {integration.connected ? (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSync(integration.platform)}
                              disabled={syncMutation.isPending}
                            >
                              {syncMutation.isPending && syncMutation.variables?.platform === integration.platform ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-1" />
                              )}
                              Sync Now
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Sync new activities from {integration.displayName}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleDisconnect(integration.platform)}
                        disabled={disconnectMutation.isPending}
                      >
                        {disconnectMutation.isPending && disconnectMutation.variables === integration.platform ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Unplug className="h-4 w-4 mr-1" />
                        )}
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => handleConnect(integration.platform)}>
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <Alert className="mt-6 bg-blue-50">
          <AlertDescription>
            Connecting these services allows MomentumRun to automatically import your activities. You can revoke access at any time.
          </AlertDescription>
        </Alert>
      </div>
      
      {/* Disconnect confirmation dialog */}
      <Dialog open={!!confirmDisconnect} onOpenChange={(open) => !open && setConfirmDisconnect(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Integration</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect from {confirmDisconnect ? confirmDisconnect.charAt(0).toUpperCase() + confirmDisconnect.slice(1) : ''}? 
              This will stop syncing new activities, but your existing imported activities will remain in your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConfirmDisconnect(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={confirmDisconnectHandler}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}