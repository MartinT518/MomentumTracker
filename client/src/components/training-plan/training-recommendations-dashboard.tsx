import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { AlertCircle, ArrowRight, CheckCircle, Clock, Dumbbell, Loader2, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TrainingPlan, generateTrainingRecommendations } from '@/lib/ai-service';

interface TrainingRecommendationsDashboardProps {
  currentPlan: TrainingPlan;
  recentActivities: Array<{
    date: string;
    type: string;
    distance?: number;
    duration?: number;
    avgPace?: string;
    heartRate?: {
      avg?: number;
      max?: number;
    };
    perceivedEffort?: number;
    notes?: string;
  }>;
  healthMetrics?: {
    sleepScore?: number;
    hrvScore?: number;
    restingHeartRate?: number;
    energyLevel?: number;
    stressLevel?: number;
  };
  isSubscriber: boolean;
}

export const TrainingRecommendationsDashboard: React.FC<TrainingRecommendationsDashboardProps> = ({
  currentPlan,
  recentActivities,
  healthMetrics,
  isSubscriber
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Array<{
    type: "intensity" | "volume" | "recovery" | "workout_type" | "general";
    recommendation: string;
    reasoning: string;
    priority: "high" | "medium" | "low";
  }> | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const handleGenerateRecommendations = async () => {
    if (!isSubscriber) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const performanceData = {
        recentActivities,
        healthMetrics,
        totalDistanceLastWeek: recentActivities.reduce((total, activity) => 
          total + (activity.distance || 0), 0),
        comparedToPlanLastWeek: "on-target" as const, // This would be dynamically determined in a real app
        userFeedback: "I've been feeling good on my easy runs but struggling with intervals."
      };
      
      const result = await generateTrainingRecommendations(currentPlan, performanceData);
      setRecommendations(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate training recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'intensity':
        return <Zap className="h-4 w-4" />;
      case 'volume':
        return <ArrowRight className="h-4 w-4" />;
      case 'recovery':
        return <Clock className="h-4 w-4" />;
      case 'workout_type':
        return <Dumbbell className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'intensity':
        return 'bg-blue-100 text-blue-800';
      case 'volume':
        return 'bg-purple-100 text-purple-800';
      case 'recovery':
        return 'bg-green-100 text-green-800';
      case 'workout_type':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredRecommendations = recommendations 
    ? activeTab === 'all' 
      ? recommendations 
      : recommendations.filter(rec => rec.type === activeTab)
    : [];

  if (!isSubscriber) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training Recommendations</CardTitle>
          <CardDescription>
            Get AI-powered insights to optimize your training based on your performance and health data
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Zap className="h-12 w-12 mx-auto text-primary/60 mb-4" />
          <h3 className="text-xl font-bold mb-2">Premium Feature</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Upgrade to premium for personalized training recommendations based on 
            your recent performance, health metrics, and training history.
          </p>
          <Button asChild>
            <Link href="/subscription">Upgrade to Premium</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Recommendations</CardTitle>
        <CardDescription>
          AI-powered insights to optimize your training based on your recent performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!recommendations && !loading && (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-6">
              Generate personalized training recommendations based on your recent
              runs, health metrics, and training plan.
            </p>
            <Button onClick={handleGenerateRecommendations}>
              Generate Recommendations
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-10">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">
              Analyzing your training data and generating personalized recommendations...
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {recommendations && recommendations.length > 0 && (
          <>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="intensity">Intensity</TabsTrigger>
                <TabsTrigger value="volume">Volume</TabsTrigger>
                <TabsTrigger value="recovery">Recovery</TabsTrigger>
                <TabsTrigger value="workout_type">Workout Types</TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                <div className="space-y-4">
                  {filteredRecommendations.map((rec, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <Badge className={cn("mr-2", getTypeColor(rec.type))}>
                            <span className="flex items-center">
                              {getTypeIcon(rec.type)}
                              <span className="ml-1 capitalize">{rec.type.replace('_', ' ')}</span>
                            </span>
                          </Badge>
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority} priority
                          </Badge>
                        </div>
                      </div>
                      <h4 className="font-semibold text-base mb-2">{rec.recommendation}</h4>
                      <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        {recommendations && recommendations.length === 0 && (
          <Alert className="my-4">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>No Recommendations Needed</AlertTitle>
            <AlertDescription>
              Based on your recent training data, your current plan is well-suited to your needs.
              Continue following your plan and check back after more activities.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      {recommendations && (
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={handleGenerateRecommendations}>
            Refresh Recommendations
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default TrainingRecommendationsDashboard;