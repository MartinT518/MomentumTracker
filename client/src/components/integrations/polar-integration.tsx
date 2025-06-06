import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Unlink, RefreshCw, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PolarConnection {
  id: number;
  user_id: number;
  platform: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  status: string;
  last_sync?: string;
  created_at: string;
}

interface SyncLog {
  id: number;
  user_id: number;
  platform: string;
  status: string;
  activities_synced: number;
  error?: string;
  created_at: string;
}

export function PolarIntegration() {
  const [connection, setConnection] = useState<PolarConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      const response = await apiRequest("GET", "/api/integrations/polar/status");
      const data = await response.json();
      setConnection(data.connection || null);
      setSyncLogs(data.syncLogs || []);
    } catch (error) {
      console.error("Failed to check Polar connection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await apiRequest("GET", "/api/integrations/polar/auth");
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Polar",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await apiRequest("DELETE", "/api/integrations/polar/disconnect");
      setConnection(null);
      setSyncLogs([]);
      toast({
        title: "Disconnected",
        description: "Polar integration has been disconnected",
      });
    } catch (error: any) {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect from Polar",
        variant: "destructive",
      });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await apiRequest("POST", "/api/integrations/polar/sync");
      const data = await response.json();
      
      toast({
        title: "Sync Started",
        description: `Syncing your Polar data...`,
      });
      
      // Refresh connection status and logs after sync
      setTimeout(() => {
        checkConnection();
        setIsSyncing(false);
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync Polar data",
        variant: "destructive",
      });
      setIsSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-red-500" />
            Polar Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-red-500" />
            Polar Flow
          </div>
          {connection && (
            <Badge variant={connection.status === "connected" ? "default" : "secondary"}>
              {connection.status}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect your Polar account to sync workouts, heart rate data, and training metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection ? (
          <>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex-1"
                variant="outline"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Button>
              <Button
                onClick={handleDisconnect}
                variant="destructive"
                className="flex-1"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>

            {connection.last_sync && (
              <p className="text-sm text-muted-foreground">
                Last synced: {formatDate(connection.last_sync)}
              </p>
            )}

            {syncLogs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Sync History</h4>
                <div className="space-y-1">
                  {syncLogs.slice(0, 3).map((log) => (
                    <div
                      key={log.id}
                      className="flex justify-between items-center text-sm p-2 bg-muted rounded"
                    >
                      <span>
                        {formatDate(log.created_at)} - {log.activities_synced} activities
                      </span>
                      <Badge
                        variant={log.status === "completed" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            {isConnecting ? "Connecting..." : "Connect to Polar"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}