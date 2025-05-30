import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { getTrainingRecommendation, getEnergyLevelLabel, getEnergyLevelColor } from '@/lib/energy-calculator';
import { getLatestEnergyLevel } from '@/lib/health-metrics-service';
import { Loader2, BarChart2, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';

export function EnergyLevelCard() {
  const { user } = useAuth();
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEnergyLevel() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const level = await getLatestEnergyLevel(user.id);
        setEnergyLevel(level);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch energy level:', err);
        setError('Could not load your energy data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEnergyLevel();
  }, [user]);

  // Function to get energy level label text
  const getEnergyText = () => {
    if (energyLevel === null) return 'No data available';
    return getEnergyLevelLabel(energyLevel);
  };

  // Function to get recommendation text
  const getRecommendationText = () => {
    if (energyLevel === null) return 'No recommendation available';
    return getTrainingRecommendation(energyLevel);
  };

  // Function to get color based on energy level
  const getColor = () => {
    if (energyLevel === null) return '#94a3b8'; // slate-400
    return getEnergyLevelColor(energyLevel);
  };

  return (
    <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center text-white">
          <BarChart2 className="mr-2 h-5 w-5 text-cyan-300" />
          Energy Level
        </CardTitle>
        <CardDescription className="text-white/80">
          Based on your health metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mt-2 bg-red-500/20 border-red-400/30">
            <AlertTriangle className="h-4 w-4 text-red-300" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        ) : energyLevel === null ? (
          <div className="space-y-4">
            <div className="text-center p-4 bg-white/10 rounded-lg border border-white/20">
              <p className="mb-2 font-medium text-white">No recent health data available</p>
              <p className="text-sm text-white/70 mb-4">
                Connect a fitness tracker or manually log your health metrics to see your energy level
              </p>
              <div className="space-x-2">
                <Link href="/health-metrics">
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-cyan-500/80 text-white hover:bg-cyan-500 h-9 px-4 py-2">
                    Log Metrics
                  </button>
                </Link>
                <Link href="/settings">
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-white/30 bg-white/10 text-white hover:bg-white/20 h-9 px-4 py-2">
                    Connect Device
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-white">Today's Energy</span>
                <span className="text-sm font-medium" style={{ color: getColor() }}>
                  {energyLevel}%
                </span>
              </div>
              <Progress 
                value={energyLevel} 
                className="h-2" 
                style={{ '--progress-background': getColor() } as React.CSSProperties} 
              />
              <div className="mt-2">
                <span className="text-2xl font-bold" style={{ color: getColor() }}>
                  {getEnergyText()}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-md bg-white/10 border border-white/20">
              <h4 className="font-medium mb-1 text-white">Training Recommendation</h4>
              <p className="text-sm text-white/80">{getRecommendationText()}</p>
            </div>

            <div className="text-xs text-white/70 flex justify-between items-center">
              <Link href="/health-metrics" className="hover:underline hover:text-white">
                View full health data
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}