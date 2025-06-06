import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Unlink, Activity, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StravaStatus {
  connected: boolean;
  lastSync: string | null;
  athleteId: string | null;
}

export function StravaIntegration() {
  const [status, setStatus] = useState<StravaStatus>({ connected: false, lastSync: null, athleteId: null });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkStravaStatus();
  }, []);

  const checkStravaStatus = async () => {
    try {
      const response = await apiRequest("GET", "/api/integrations/strava/status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error checking Strava status:", error);
    } finally {
      setLoading(false);
    }
  };

  const connectToStrava = () => {
    window.location.href = "/api/auth/strava";
  };

  const disconnectStrava = async () => {
    try {
      await apiRequest("DELETE", "/api/auth/strava");
      setStatus({ connected: false, lastSync: null, athleteId: null });
      toast({
        title: "Disconnected",
        description: "Strava integration has been disconnected successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect Strava integration.",
        variant: "destructive",
      });
    }
  };

  const syncStravaData = async () => {
    setSyncing(true);
    try {
      const response = await apiRequest("POST", "/api/integrations/strava/sync");
      const result = await response.json();
      
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${result.activitiesSynced} activities from Strava.`,
      });
      
      // Refresh status after sync
      await checkStravaStatus();
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync data from Strava. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-orange-500" />
            <CardTitle>Strava Integration</CardTitle>
          </div>
          {status.connected && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          Connect your Strava account to automatically import your running activities and training data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status.connected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              By connecting Strava, you'll get:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Automatic activity import</li>
              <li>• GPS route data and maps</li>
              <li>• Heart rate and pace analysis</li>
              <li>• Training load insights</li>
            </ul>
            <Button onClick={connectToStrava} className="w-full">
              <Activity className="h-4 w-4 mr-2" />
              Connect to Strava
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Strava Connected
                </span>
              </div>
              {status.athleteId && (
                <Badge variant="outline" className="text-xs">
                  ID: {status.athleteId}
                </Badge>
              )}
            </div>
            
            {status.lastSync && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Last sync: {new Date(status.lastSync).toLocaleDateString()} at{" "}
                  {new Date(status.lastSync).toLocaleTimeString()}
                </span>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button
                onClick={syncStravaData}
                disabled={syncing}
                className="flex-1"
                variant="outline"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
              
              <Button
                onClick={disconnectStrava}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}