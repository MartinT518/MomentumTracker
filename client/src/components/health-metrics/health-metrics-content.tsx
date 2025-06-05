import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

// Type definition for health metrics
interface HealthMetric {
  id: number;
  date: string;
  userId: number;
  hrvScore?: number;
  restingHeartRate?: number;
  sleepQuality?: string;
  sleepDuration?: number;
  stressLevel?: string;
  platform: string;
  syncDate: string;
}

// This is a simplified version of the health metrics page content
// that can be more easily tested without UI dependencies
export function HealthMetricsContent() {
  const { user } = useAuth();
  
  const { data: healthMetrics, isLoading } = useQuery<HealthMetric[]>({
    queryKey: ['/api/health-metrics'],
    enabled: !!user,
  });

  // Show unauthorized message if user is not logged in
  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold mb-4">Unauthorized</h2>
          <p className="text-neutral-dark">Please log in to view your health metrics.</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show empty state if no metrics
  if (!healthMetrics || healthMetrics.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-2">Health Metrics</h1>
        <p className="text-lg text-neutral-dark mb-6">Track your biometric data and energy levels</p>
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow p-8 text-center">
          <p className="text-neutral-dark">No health metrics found. Import data to get started.</p>
        </div>
      </div>
    );
  }

  // Show health metrics
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">Health Metrics</h1>
      <p className="text-lg text-neutral-dark mb-6">Track your biometric data and energy levels</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthMetrics.map((metric) => (
          <div key={metric.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow p-4">
            <div className="font-medium">{new Date(metric.date).toLocaleDateString()}</div>
            <div className="mt-2">
              {metric.hrvScore && <div>HRV Score: {metric.hrvScore}</div>}
              {metric.restingHeartRate && <div>Resting HR: {metric.restingHeartRate} bpm</div>}
              {metric.sleepQuality && <div>Sleep Quality: {metric.sleepQuality}</div>}
              {metric.sleepDuration && <div>Sleep Duration: {metric.sleepDuration} hrs</div>}
              {metric.stressLevel && <div>Stress Level: {metric.stressLevel}</div>}
              <div className="mt-1 text-xs text-gray-500">Source: {metric.platform}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}