import { useEffect, useState } from "react";
import { useLocation, useRoute, useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { handleStravaCallback, handleGarminCallback, handlePolarCallback } from "@/lib/integration-service";

export default function IntegrationCallbackPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [_, params] = useRoute<{ platform: string }>("/auth/:platform/callback");
  const platform = params?.platform || "";
  
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [redirectTimer, setRedirectTimer] = useState(5);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (success || error) {
      intervalId = setInterval(() => {
        setRedirectTimer((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            setLocation('/settings');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [success, error, setLocation]);

  useEffect(() => {
    async function processCallback() {
      if (!user) return;
      
      try {
        setIsProcessing(true);
        
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        
        if (error) {
          setError(`Authorization denied: ${error}`);
          return;
        }
        
        if (!code) {
          setError('No authorization code received');
          return;
        }
        
        let success = false;
        
        switch (platform.toLowerCase()) {
          case 'strava':
            success = await handleStravaCallback(code);
            break;
          case 'garmin':
            success = await handleGarminCallback(code);
            break;
          case 'polar':
            success = await handlePolarCallback(code);
            break;
          default:
            setError(`Unsupported platform: ${platform}`);
            return;
        }
        
        if (success) {
          setSuccess(true);
        } else {
          setError(`Failed to connect ${platform} account`);
        }
      } catch (err) {
        console.error('Error during integration callback:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsProcessing(false);
      }
    }
    
    processCallback();
  }, [platform, user]);

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to connect a fitness tracker
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/auth')}>Sign In</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
  
  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>
            {isProcessing
              ? `Connecting ${platformName}`
              : success
                ? `Connected to ${platformName}`
                : `Connection Failed`}
          </CardTitle>
          <CardDescription>
            {isProcessing
              ? "Please wait while we establish a connection to your account..."
              : success
                ? "Your account has been successfully connected"
                : "There was an issue connecting your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center p-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <p className="text-center text-muted-foreground">
                Establishing connection to {platformName}...
              </p>
            </div>
          ) : success ? (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertTitle>Connection Successful</AlertTitle>
              <AlertDescription>
                Your {platformName} account has been successfully connected. Your activities and health data will now be synchronized.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-5 w-5" />
              <AlertTitle>Connection Failed</AlertTitle>
              <AlertDescription>
                {error || `Failed to connect to ${platformName}`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            {!isProcessing && `Redirecting in ${redirectTimer} seconds...`}
          </p>
          <Button 
            variant={isProcessing ? "outline" : "default"}
            onClick={() => setLocation('/settings')}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Go to Settings"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}