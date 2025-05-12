import { useEffect, useState } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { handleStravaCallback, handleGarminCallback, handlePolarCallback } from '@/lib/integration-service';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function IntegrationCallbackPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/auth/:platform/callback');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const platform = params?.platform;
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      setStatus('error');
      setErrorMessage(`Authentication failed: ${error}`);
      return;
    }
    
    if (!code) {
      setStatus('error');
      setErrorMessage('No authorization code received');
      return;
    }
    
    const processAuth = async () => {
      try {
        let success = false;
        
        if (platform === 'strava') {
          success = await handleStravaCallback(code);
        } else if (platform === 'garmin') {
          success = await handleGarminCallback(code);
        } else if (platform === 'polar') {
          success = await handlePolarCallback(code);
        } else {
          throw new Error(`Unsupported platform: ${platform}`);
        }
        
        if (success) {
          setStatus('success');
        } else {
          throw new Error(`Failed to authenticate with ${platform}`);
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
      }
    };
    
    processAuth();
  }, [platform]);
  
  const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : '';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{`${platformName} Integration`}</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Processing your authentication...'}
            {status === 'success' && `Successfully connected to ${platformName}`}
            {status === 'error' && 'Integration Error'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
            )}
            
            {status === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            )}
            
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
            )}
            
            <div className="text-center">
              {status === 'loading' && (
                <p>Please wait while we connect your account...</p>
              )}
              
              {status === 'success' && (
                <p>Your {platformName} account has been successfully connected. You can now sync your activities.</p>
              )}
              
              {status === 'error' && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>
                    {errorMessage || `There was an error connecting to ${platformName}.`}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          {(status === 'success' || status === 'error') && (
            <div className="space-y-2 w-full">
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => setLocation('/settings')}
              >
                Go to Settings
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}