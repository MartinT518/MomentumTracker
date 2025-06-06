import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Activity, Heart, Timer, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AppleHealthData {
  steps: number;
  activeEnergyBurned: number;
  distanceWalkingRunning: number;
  heartRate: number;
  workouts: any[];
}

export function AppleHealthIntegration() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [healthData, setHealthData] = useState<AppleHealthData | null>(null);
  const { toast } = useToast();

  const connectAppleHealth = async () => {
    setIsConnecting(true);
    
    try {
      // Check if HealthKit is available (iOS device)
      if (!window.HealthKit) {
        toast({
          title: "Apple Health Not Available",
          description: "Apple Health is only available on iOS devices with Safari.",
          variant: "destructive",
        });
        return;
      }

      // Request health data permissions
      const permissions = {
        read: [
          'HKQuantityTypeIdentifierStepCount',
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          'HKQuantityTypeIdentifierDistanceWalkingRunning',
          'HKQuantityTypeIdentifierHeartRate',
          'HKWorkoutTypeIdentifier'
        ]
      };

      await window.HealthKit.requestAuthorization(permissions);
      
      // Fetch recent health data
      const data = await fetchHealthData();
      setHealthData(data);
      setIsConnected(true);
      
      toast({
        title: "Apple Health Connected",
        description: "Successfully connected to Apple Health. Health data will sync automatically.",
      });
      
    } catch (error) {
      console.error('Apple Health connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Apple Health. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchHealthData = async (): Promise<AppleHealthData> => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    const [steps, activeEnergy, distance, heartRate, workouts] = await Promise.all([
      window.HealthKit.querySampleType({
        sampleType: 'HKQuantityTypeIdentifierStepCount',
        startDate,
        endDate,
        limit: 100
      }),
      window.HealthKit.querySampleType({
        sampleType: 'HKQuantityTypeIdentifierActiveEnergyBurned',
        startDate,
        endDate,
        limit: 100
      }),
      window.HealthKit.querySampleType({
        sampleType: 'HKQuantityTypeIdentifierDistanceWalkingRunning',
        startDate,
        endDate,
        limit: 100
      }),
      window.HealthKit.querySampleType({
        sampleType: 'HKQuantityTypeIdentifierHeartRate',
        startDate,
        endDate,
        limit: 50
      }),
      window.HealthKit.querySampleType({
        sampleType: 'HKWorkoutTypeIdentifier',
        startDate,
        endDate,
        limit: 20
      })
    ]);

    return {
      steps: steps.reduce((total: number, sample: any) => total + sample.quantity, 0),
      activeEnergyBurned: activeEnergy.reduce((total: number, sample: any) => total + sample.quantity, 0),
      distanceWalkingRunning: distance.reduce((total: number, sample: any) => total + sample.quantity, 0),
      heartRate: heartRate.length > 0 ? heartRate[heartRate.length - 1].quantity : 0,
      workouts: workouts
    };
  };

  const syncHealthData = async () => {
    if (!isConnected) return;
    
    try {
      const data = await fetchHealthData();
      
      // Send data to backend
      const response = await fetch('/api/integrations/apple-health/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setHealthData(data);
        toast({
          title: "Sync Complete",
          description: "Apple Health data synced successfully.",
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync Apple Health data.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-white drop-shadow-sm">Apple Health</CardTitle>
            <CardDescription className="text-white/70 drop-shadow-sm">
              Sync health data and workouts from Apple Health
            </CardDescription>
          </div>
          {isConnected && (
            <Badge variant="default" className="ml-auto bg-green-500/20 text-green-400 border-green-500/30">
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center py-4">
            <p className="text-white/70 drop-shadow-sm mb-4">
              Connect Apple Health to sync your health data, workouts, and activity metrics automatically.
            </p>
            <Button 
              onClick={connectAppleHealth}
              disabled={isConnecting}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0"
            >
              {isConnecting ? (
                <>
                  <Timer className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Smartphone className="mr-2 h-4 w-4" />
                  Connect Apple Health
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <span className="text-white/70 text-sm drop-shadow-sm">Steps</span>
                </div>
                <p className="text-xl font-semibold text-white drop-shadow-sm">
                  {healthData?.steps.toLocaleString() || '0'}
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-400" />
                  <span className="text-white/70 text-sm drop-shadow-sm">Calories</span>
                </div>
                <p className="text-xl font-semibold text-white drop-shadow-sm">
                  {Math.round(healthData?.activeEnergyBurned || 0)}
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-400" />
                  <span className="text-white/70 text-sm drop-shadow-sm">Distance</span>
                </div>
                <p className="text-xl font-semibold text-white drop-shadow-sm">
                  {(healthData?.distanceWalkingRunning || 0).toFixed(1)} km
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-400" />
                  <span className="text-white/70 text-sm drop-shadow-sm">Heart Rate</span>
                </div>
                <p className="text-xl font-semibold text-white drop-shadow-sm">
                  {Math.round(healthData?.heartRate || 0)} bpm
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={syncHealthData}
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Timer className="mr-2 h-4 w-4" />
                Sync Now
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Extend window interface for HealthKit
declare global {
  interface Window {
    HealthKit?: {
      requestAuthorization: (permissions: any) => Promise<void>;
      querySampleType: (options: any) => Promise<any[]>;
    };
  }
}