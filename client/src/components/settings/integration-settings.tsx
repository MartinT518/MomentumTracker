import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, RefreshCw, PlugIcon, ArrowRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  getIntegrations, 
  syncActivities, 
  getLastSyncStatus, 
  disconnectIntegration, 
  updateSyncSettings,
  initiateStravaAuth,
  initiateGarminAuth,
  initiatePolarAuth
} from '@/lib/integration-service';

interface Integration {
  id: number;
  user_id: number;
  platform: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number | null;
  scope?: string;
  connected_at: string;
  last_synced_at?: string | null;
  auto_sync: boolean;
  sync_frequency?: 'daily' | 'realtime' | null;
}

interface SyncStatus {
  id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  items_synced?: number;
  items_failed?: number;
  error_message?: string;
}

export function IntegrationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatuses, setSyncStatuses] = useState<Record<string, SyncStatus | null>>({});
  const [syncInProgress, setSyncInProgress] = useState<Record<string, boolean>>({});
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null);
  
  // Load integrations on mount
  useEffect(() => {
    if (!user) return;
    
    loadIntegrations();
  }, [user]);
  
  // Load integrations and sync statuses
  const loadIntegrations = async () => {
    try {
      setIsLoading(true);
      const data = await getIntegrations();
      setIntegrations(data);
      
      // Load sync status for each connected integration
      const statuses: Record<string, SyncStatus | null> = {};
      
      for (const integration of data) {
        try {
          const status = await getLastSyncStatus(integration.platform);
          statuses[integration.platform] = status;
        } catch (error) {
          console.error(`Error loading sync status for ${integration.platform}:`, error);
          statuses[integration.platform] = null;
        }
      }
      
      setSyncStatuses(statuses);
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast({
        title: 'Failed to load integrations',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start sync for a platform
  const handleSync = async (platform: string) => {
    if (syncInProgress[platform]) return;
    
    try {
      setSyncInProgress(prev => ({ ...prev, [platform]: true }));
      
      const result = await syncActivities(platform, true);
      
      toast({
        title: 'Sync initiated',
        description: `Syncing your ${platform} activities in the background`,
      });
      
      // Refresh sync status after a moment
      setTimeout(() => {
        refreshSyncStatus(platform);
      }, 2000);
    } catch (error) {
      console.error(`Error syncing ${platform} activities:`, error);
      toast({
        title: 'Sync failed',
        description: `Failed to sync your ${platform} activities`,
        variant: 'destructive',
      });
    } finally {
      setSyncInProgress(prev => ({ ...prev, [platform]: false }));
    }
  };
  
  // Refresh sync status for a platform
  const refreshSyncStatus = async (platform: string) => {
    try {
      const status = await getLastSyncStatus(platform);
      setSyncStatuses(prev => ({ ...prev, [platform]: status }));
      
      // If sync is still in progress, check again after a delay
      if (status && (status.status === 'pending' || status.status === 'in_progress')) {
        setTimeout(() => {
          refreshSyncStatus(platform);
        }, 5000);
      }
    } catch (error) {
      console.error(`Error refreshing sync status for ${platform}:`, error);
    }
  };
  
  // Disconnect integration
  const handleDisconnect = async (platform: string) => {
    try {
      setDisconnectingPlatform(platform);
      await disconnectIntegration(platform);
      
      setIntegrations(prev => prev.filter(integration => integration.platform !== platform));
      setSyncStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[platform];
        return newStatuses;
      });
      
      toast({
        title: 'Integration disconnected',
        description: `Your ${platform} account has been disconnected`,
      });
    } catch (error) {
      console.error(`Error disconnecting ${platform}:`, error);
      toast({
        title: 'Failed to disconnect',
        description: `Could not disconnect your ${platform} account`,
        variant: 'destructive',
      });
    } finally {
      setDisconnectingPlatform(null);
    }
  };
  
  // Toggle auto sync
  const handleToggleAutoSync = async (platform: string, enabled: boolean) => {
    const integration = integrations.find(i => i.platform === platform);
    if (!integration) return;
    
    try {
      const updatedSettings = await updateSyncSettings(platform, {
        autoSync: enabled,
        syncFrequency: integration.sync_frequency || 'daily',
      });
      
      setIntegrations(prev => prev.map(i => 
        i.platform === platform ? { ...i, auto_sync: enabled } : i
      ));
      
      toast({
        title: `Auto sync ${enabled ? 'enabled' : 'disabled'}`,
        description: `Auto sync for ${platform} has been ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error(`Error updating sync settings for ${platform}:`, error);
      toast({
        title: 'Failed to update settings',
        description: `Could not update sync settings for ${platform}`,
        variant: 'destructive',
      });
    }
  };
  
  // Update sync frequency
  const handleUpdateSyncFrequency = async (platform: string, frequency: 'daily' | 'realtime') => {
    const integration = integrations.find(i => i.platform === platform);
    if (!integration) return;
    
    try {
      const updatedSettings = await updateSyncSettings(platform, {
        autoSync: integration.auto_sync,
        syncFrequency: frequency,
      });
      
      setIntegrations(prev => prev.map(i => 
        i.platform === platform ? { ...i, sync_frequency: frequency } : i
      ));
      
      toast({
        title: 'Sync frequency updated',
        description: `Sync frequency for ${platform} has been set to ${frequency}`,
      });
    } catch (error) {
      console.error(`Error updating sync frequency for ${platform}:`, error);
      toast({
        title: 'Failed to update settings',
        description: `Could not update sync frequency for ${platform}`,
        variant: 'destructive',
      });
    }
  };
  
  // Handle connect button click for different platforms
  const handleConnect = (platform: string) => {
    switch (platform.toLowerCase()) {
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
          title: 'Unsupported platform',
          description: `Connection to ${platform} is not supported yet`,
          variant: 'destructive',
        });
    }
  };
  
  // Format date string
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  // Get status icon based on sync status
  const getSyncStatusIcon = (platform: string) => {
    const status = syncStatuses[platform];
    
    if (!status) {
      return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
    
    switch (status.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
      case 'pending':
        return <Loader2 className="h-5 w-5 animate-spin text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  // Get status text based on sync status
  const getSyncStatusText = (platform: string) => {
    const status = syncStatuses[platform];
    const integration = integrations.find(i => i.platform === platform);
    
    if (!status) {
      return `Last synced: ${formatDate(integration?.last_synced_at)}`;
    }
    
    switch (status.status) {
      case 'completed':
        return `Synced ${status.items_synced || 0} items on ${formatDate(status.completed_at)}`;
      case 'failed':
        return `Sync failed: ${status.error_message || 'Unknown error'}`;
      case 'in_progress':
        return 'Sync in progress...';
      case 'pending':
        return 'Sync pending...';
      default:
        return `Last synced: ${formatDate(integration?.last_synced_at)}`;
    }
  };
  
  // Get color class for sync status
  const getSyncStatusColorClass = (platform: string) => {
    const status = syncStatuses[platform];
    
    if (!status) {
      return 'text-muted-foreground';
    }
    
    switch (status.status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'in_progress':
      case 'pending':
        return 'text-amber-600';
      default:
        return 'text-muted-foreground';
    }
  };
  
  // Check if a platform is connected
  const isPlatformConnected = (platform: string) => {
    return integrations.some(i => i.platform.toLowerCase() === platform.toLowerCase());
  };
  
  // Get integration for a platform
  const getIntegration = (platform: string) => {
    return integrations.find(i => i.platform.toLowerCase() === platform.toLowerCase());
  };
  
  // Platforms to display (connected and available)
  const platforms = [
    {
      id: 'strava',
      name: 'Strava',
      description: 'Connect with Strava to sync activities and track your training',
      connected: isPlatformConnected('strava'),
    },
    {
      id: 'garmin',
      name: 'Garmin Connect',
      description: 'Connect with Garmin to sync activities, health metrics, and sleep data',
      connected: isPlatformConnected('garmin'),
    },
    {
      id: 'polar',
      name: 'Polar Flow',
      description: 'Connect with Polar to sync activities, heart rate, and recovery metrics',
      connected: isPlatformConnected('polar'),
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
          <p className="text-muted-foreground mt-1">
            Connect your fitness trackers and apps to synchronize your training data
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={loadIntegrations} 
          className="mt-4 md:mt-0"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    
      {isLoading ? (
        <div className="flex justify-center items-center p-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {platforms.map((platform) => (
            <Card key={platform.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <PlugIcon className="h-5 w-5 mr-2" />
                  {platform.name}
                  {platform.connected && (
                    <span className="ml-2 inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      Connected
                    </span>
                  )}
                </CardTitle>
                <CardDescription>{platform.description}</CardDescription>
              </CardHeader>
              
              {platform.connected ? (
                <>
                  <CardContent className="pb-2">
                    <div className="space-y-4">
                      {/* Connection Status */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Connection Status</h4>
                          <p className="text-sm text-muted-foreground">
                            Connected since {formatDate(getIntegration(platform.id)?.connected_at)}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-1">Sync Status</h4>
                          <div className="flex items-center">
                            {getSyncStatusIcon(platform.id)}
                            <p className={`text-sm ml-2 ${getSyncStatusColorClass(platform.id)}`}>
                              {getSyncStatusText(platform.id)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Sync Settings */}
                      <div className="border rounded-md p-4">
                        <h4 className="text-sm font-medium mb-3">Sync Settings</h4>
                        
                        <div className="space-y-4">
                          {/* Auto Sync Toggle */}
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor={`auto-sync-${platform.id}`} className="font-medium">
                                Auto Sync
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Automatically sync new activities
                              </p>
                            </div>
                            <Switch 
                              id={`auto-sync-${platform.id}`}
                              checked={getIntegration(platform.id)?.auto_sync || false}
                              onCheckedChange={(checked) => handleToggleAutoSync(platform.id, checked)}
                            />
                          </div>
                          
                          {/* Sync Frequency */}
                          {getIntegration(platform.id)?.auto_sync && (
                            <div className="flex flex-col md:flex-row md:items-center justify-between">
                              <div className="mb-2 md:mb-0">
                                <Label htmlFor={`sync-frequency-${platform.id}`} className="font-medium">
                                  Sync Frequency
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  How often to check for new activities
                                </p>
                              </div>
                              <Select
                                value={getIntegration(platform.id)?.sync_frequency || 'daily'}
                                onValueChange={(value) => handleUpdateSyncFrequency(platform.id, value as 'daily' | 'realtime')}
                              >
                                <SelectTrigger id={`sync-frequency-${platform.id}`} className="w-[180px]">
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="realtime">Real-time</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-2 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button 
                      variant="secondary"
                      onClick={() => handleSync(platform.id)}
                      disabled={syncInProgress[platform.id]}
                    >
                      {syncInProgress[platform.id] ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync Now
                        </>
                      )}
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                          <XCircle className="h-4 w-4 mr-2" />
                          Disconnect
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Disconnect {platform.name}</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to disconnect your {platform.name} account? This will stop all syncing of activities and health data.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={() => handleDisconnect(platform.id)}
                            disabled={disconnectingPlatform === platform.id}
                          >
                            {disconnectingPlatform === platform.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Disconnecting...
                              </>
                            ) : (
                              'Disconnect'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </>
              ) : (
                <CardFooter>
                  <Button onClick={() => handleConnect(platform.id)}>
                    Connect {platform.name}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}