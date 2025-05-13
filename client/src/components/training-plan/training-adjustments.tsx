import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  getTrainingPlanAdjustments, 
  applyTrainingPlanAdjustments,
  calculateTrainingLoad,
  generateWorkoutRecommendation,
  analyzeRaceReadiness,
  PlanAdjustment,
  Workout,
  TrainingPlan,
  AdjustmentParameters
} from '@/lib/training-ai-service';
import { getLatestEnergyLevel } from '@/lib/health-metrics-service';
import { getDailyHealthData } from '@/lib/health-metrics-service';
import { Settings, Brain, Zap, TrendingUp, Calendar, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';

interface TrainingAdjustmentsProps {
  planId: string | number;
  plan?: TrainingPlan;
  onPlanUpdated?: () => void;
}

export function TrainingAdjustments({ planId, plan, onPlanUpdated }: TrainingAdjustmentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('adjustments');
  const [generatingAdjustments, setGeneratingAdjustments] = useState(false);
  const [adjustment, setAdjustment] = useState<PlanAdjustment | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  
  // Fetch plan if not provided
  const { data: fetchedPlan, isLoading: isLoadingPlan } = useQuery({
    queryKey: [`/api/training-plans/${planId}`],
    queryFn: () => plan,
    enabled: !plan && !!planId
  });
  
  const currentPlan = plan || fetchedPlan;
  
  // Load energy level data
  useEffect(() => {
    const loadEnergyLevel = async () => {
      if (!user) return;
      
      try {
        const level = await getLatestEnergyLevel(user.id);
        setEnergyLevel(level);
      } catch (error) {
        console.error('Failed to load energy level:', error);
      }
    };
    
    loadEnergyLevel();
  }, [user]);
  
  // Check is today has workout
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysWorkout = currentPlan?.weeks
    .flatMap(week => week.workouts)
    .find(workout => workout.date.includes(todayStr));
  
  // Handle generating adjustment
  const generateAdjustment = async () => {
    if (!user || !currentPlan) return;
    
    setGeneratingAdjustments(true);
    
    try {
      // Load health metrics data
      const today = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      
      const formattedToday = today.toISOString().split('T')[0];
      const formattedOneWeekAgo = oneWeekAgo.toISOString().split('T')[0];
      
      const healthData = await getDailyHealthData(user.id, formattedOneWeekAgo, formattedToday);
      const latestHealthMetrics = healthData.length > 0 ? healthData[0] : undefined;
      
      // For this demo, simulate some recent activities
      // In a real implementation, you would fetch these from the database
      const recentActivities = generateSampleActivities(user.id);
      
      // Calculate performance metrics
      const trainingLoad = calculateTrainingLoad(recentActivities);
      
      // Create adjustment parameters
      const adjustmentParams: AdjustmentParameters = {
        energyLevel: energyLevel || undefined,
        healthMetrics: latestHealthMetrics,
        recentPerformance: {
          recentActivities,
          weeklyVolume: {
            current: 40,
            previous: 35,
            trend: 14.3
          },
          avgPace: {
            current: 5.2,
            previous: 5.3,
            trend: -1.9
          },
          longRunDistance: {
            current: 16,
            previous: 14,
            trend: 14.3
          },
          strainScore: 65,
          fitnessScore: 72,
          consistencyScore: 80
        },
        userPreference: {
          preferredRestDays: [0, 5], // Sunday and Friday
          maxWeeklyDistance: 70,
          minWeeklyRuns: 4,
          preferredWorkoutTypes: ['long run', 'tempo', 'easy']
        },
        adjustmentStrategy: 'moderate'
      };
      
      const adjustmentResponse = await getTrainingPlanAdjustments(planId, adjustmentParams);
      setAdjustment(adjustmentResponse);
      setActiveTab('adjustments');
    } catch (error) {
      console.error('Error generating training plan adjustments:', error);
      toast({
        title: 'Adjustment Generation Failed',
        description: 'Could not generate training plan adjustments. Try again later.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingAdjustments(false);
    }
  };
  
  // Handle applying adjustment
  const applyAdjustment = async () => {
    if (!adjustment) return;
    
    setIsApplyingChanges(true);
    
    try {
      await applyTrainingPlanAdjustments(planId, adjustment.date);
      
      toast({
        title: 'Training Plan Updated',
        description: 'AI adjustments have been applied to your training plan.',
      });
      
      // Reset adjustment data
      setAdjustment(null);
      
      // Refresh plan data
      if (onPlanUpdated) {
        onPlanUpdated();
      }
    } catch (error) {
      console.error('Error applying training plan adjustments:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not apply training plan adjustments. Try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsApplyingChanges(false);
    }
  };
  
  // Function to format workout display
  const formatWorkoutDisplay = (workout: Workout) => {
    let description = workout.description;
    
    if (workout.targetDistance) {
      description += ` (${workout.targetDistance} km)`;
    } else if (workout.targetDuration) {
      const hours = Math.floor(workout.targetDuration / 60);
      const minutes = Math.round(workout.targetDuration % 60);
      description += ` (${hours > 0 ? `${hours}h ` : ''}${minutes}min)`;
    }
    
    return description;
  };
  
  if (isLoadingPlan) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!currentPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training Plan Adjustments</CardTitle>
          <CardDescription>
            You need an active training plan to use this feature.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Training Plan Found</AlertTitle>
            <AlertDescription>
              Create a training plan to use the AI adjustment features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Generate workout recommendations based on energy level if available
  let workoutRecommendation;
  
  if (energyLevel !== null) {
    // In a real implementation, would use actual training load data
    const mockTrainingLoad = {
      acuteLoad: 45,
      chronicLoad: 50,
      trainingStressBalance: 5,
      fatigueRatio: 0.9
    };
    
    workoutRecommendation = generateWorkoutRecommendation(energyLevel, mockTrainingLoad);
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Training Optimization
            </CardTitle>
            <CardDescription>
              Smart adjustments for your training plan based on your performance and health metrics
            </CardDescription>
          </div>
          <Button 
            className="mt-4 md:mt-0" 
            onClick={generateAdjustment}
            disabled={generatingAdjustments}
          >
            {generatingAdjustments ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                {adjustment ? 'Regenerate Adjustments' : 'Generate Adjustments'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 h-auto md:grid-cols-2">
            <TabsTrigger value="adjustments" className="px-4 py-2">
              <Calendar className="h-4 w-4 mr-2" />
              Plan Adjustments
            </TabsTrigger>
            <TabsTrigger value="insights" className="px-4 py-2">
              <TrendingUp className="h-4 w-4 mr-2" />
              Insights & Recommendations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="adjustments" className="space-y-4">
            {adjustment ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>AI Adjustments Generated</AlertTitle>
                  <AlertDescription>
                    Based on your recent performance and health metrics, we've generated the following adjustments to your training plan.
                  </AlertDescription>
                </Alert>
                
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Adjustment Reason</h3>
                  <p className="text-sm text-muted-foreground">{adjustment.reason}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Proposed Changes</h3>
                  <ScrollArea className="h-[300px] rounded-md border p-2">
                    <div className="space-y-4">
                      {adjustment.changes.map((change, index) => {
                        const workout = currentPlan.weeks
                          .flatMap(week => week.workouts)
                          .find(w => w.id === change.workoutId);
                        
                        if (!workout) return null;
                        
                        return (
                          <div key={index} className="p-3 border rounded-md">
                            <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                              <div className="space-y-1">
                                <h4 className="font-medium">{format(new Date(workout.date), 'EEEE, MMM d')}</h4>
                                <p className="text-sm">{formatWorkoutDisplay(workout)}</p>
                              </div>
                              <Badge variant="outline" className="capitalize">
                                {change.field.replace(/([A-Z])/g, ' $1').trim()}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="p-2 bg-muted rounded-md">
                                <p className="text-xs font-medium mb-1">Current</p>
                                <p className="overflow-hidden text-ellipsis">
                                  {typeof change.oldValue === 'string' ? change.oldValue : JSON.stringify(change.oldValue)}
                                </p>
                              </div>
                              <div className="p-2 bg-green-50 border-green-100 rounded-md">
                                <p className="text-xs font-medium mb-1">Proposed</p>
                                <p className="overflow-hidden text-ellipsis">
                                  {typeof change.newValue === 'string' ? change.newValue : JSON.stringify(change.newValue)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Adjustments Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Generate AI-powered adjustments to optimize your training plan based on your performance, recovery metrics, and goals.
                </p>
                <Button 
                  onClick={generateAdjustment}
                  disabled={generatingAdjustments}
                >
                  {generatingAdjustments ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Adjustments'
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-4">
            {/* Energy-based Recommendations */}
            <div className="p-4 border rounded-md">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-amber-500" />
                Energy Level Insights
              </h3>
              
              {energyLevel === null ? (
                <div className="text-center p-4 border border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    Connect a fitness tracker or manually log your health metrics to see energy-based recommendations.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium">Today's Energy</p>
                      <p className="text-sm font-medium">
                        {energyLevel}%
                      </p>
                    </div>
                    <Progress 
                      value={energyLevel} 
                      className="h-2 mb-2" 
                    />
                  </div>
                  
                  {workoutRecommendation && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Optimal Training Today</h4>
                        <p className="text-sm text-muted-foreground">{workoutRecommendation.explanation}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Recommended Intensity</h4>
                        <Badge className="capitalize">
                          {workoutRecommendation.recommendedIntensity}
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Suggested Workouts</h4>
                        <ul className="space-y-1">
                          {workoutRecommendation.suggestedWorkouts.map((workout, i) => (
                            <li key={i} className="text-sm flex items-start">
                              <span className="text-primary mr-2">•</span>
                              {workout}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {todaysWorkout && (
                        <div className="p-3 border rounded-md">
                          <h4 className="text-sm font-medium mb-1">Today's Scheduled Workout</h4>
                          <p className="text-sm">{formatWorkoutDisplay(todaysWorkout)}</p>
                          
                          {workoutRecommendation.recommendedIntensity === 'rest' && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                Consider resting today instead of your scheduled workout based on your low energy level.
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          {workoutRecommendation.recommendedIntensity === 'recovery' && todaysWorkout.type.toLowerCase().includes('tempo') && (
                            <Alert variant="warning" className="mt-2 bg-amber-50 border-amber-200 text-amber-800">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                Consider switching to an easier workout today based on your energy level.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Training Load Analysis */}
            <div className="p-4 border rounded-md">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                Training Load Analysis
              </h3>
              
              <div className="space-y-3">
                <Accordion type="single" collapsible>
                  <AccordionItem value="fatigue">
                    <AccordionTrigger className="text-sm font-medium">
                      Acute : Chronic Load Ratio
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-3 bg-muted rounded-md text-sm space-y-2">
                        <p>Your current fatigue to fitness ratio is <strong>0.9</strong>, which is in the optimal training zone (0.8-1.3).</p>
                        <p>This indicates your recent training load is balanced well with your overall fitness.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="strain">
                    <AccordionTrigger className="text-sm font-medium">
                      Weekly Strain
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-3 bg-muted rounded-md text-sm space-y-2">
                        <p>Your training strain this week is <strong>moderate</strong> at 65% of your typical capacity.</p>
                        <p>You have capacity for 1-2 more high intensity sessions this week.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="consistency">
                    <AccordionTrigger className="text-sm font-medium">
                      Training Consistency
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-3 bg-muted rounded-md text-sm space-y-2">
                        <p>Your consistency score is <strong>80/100</strong>, which is very good.</p>
                        <p>You've maintained regular training with minimal gaps over the past 8 weeks.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="intensity">
                    <AccordionTrigger className="text-sm font-medium">
                      Intensity Distribution
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-3 bg-muted rounded-md text-sm space-y-2">
                        <p>Your current intensity distribution is:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>70% easy/recovery intensity</li>
                          <li>20% moderate/threshold intensity</li>
                          <li>10% high intensity</li>
                        </ul>
                        <p className="mt-2">This is close to the recommended 80/10/10 distribution for endurance athletes.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
            
            {/* Race Readiness (if race date is in plan) */}
            {currentPlan.goal.type.toLowerCase().includes('race') && (
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                  Race Readiness
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium">Readiness Score</p>
                      <p className="text-sm font-medium">72%</p>
                    </div>
                    <Progress 
                      value={72} 
                      className="h-2 mb-2" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Strengths</h4>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Training consistency
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Weekly training volume
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Areas to Improve</h4>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          Race-specific workouts
                        </li>
                        <li className="flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          Long run endurance
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Recommendations</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        Increase long run distance to at least 18-20 km for half marathon readiness.
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        Add more race-specific tempo workouts at goal pace.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {adjustment && (
        <CardFooter className="border-t px-6 py-4">
          <div className="flex justify-between items-center w-full">
            <p className="text-sm text-muted-foreground">
              {generatingAdjustments 
                ? 'Generating new adjustments...' 
                : `Adjustments generated on ${format(new Date(), 'MMM d, yyyy')}`}
            </p>
            <Button 
              onClick={applyAdjustment}
              disabled={isApplyingChanges}
            >
              {isApplyingChanges ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply Adjustments'
              )}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

// Helper function to generate sample activities for demo purposes
// In a real app, these would come from your database
function generateSampleActivities(userId: number) {
  const today = new Date();
  
  return [
    {
      id: 1,
      type: 'Easy Run',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString(),
      distance: 8,
      duration: 48 * 60,
      pace: 6,
      heartRate: {
        average: 135,
        max: 145
      },
      perceivedExertion: 3,
      tags: ['recovery'],
    },
    {
      id: 2,
      type: 'Tempo Run',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3).toISOString(),
      distance: 10,
      duration: 50 * 60,
      pace: 5,
      heartRate: {
        average: 160,
        max: 175
      },
      perceivedExertion: 7,
      tags: ['workout', 'threshold'],
    },
    {
      id: 3,
      type: 'Long Run',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString(),
      distance: 20,
      duration: 120 * 60,
      pace: 6,
      heartRate: {
        average: 145,
        max: 160
      },
      perceivedExertion: 6,
      tags: ['endurance'],
    },
    {
      id: 4,
      type: 'Recovery Run',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString(),
      distance: 6,
      duration: 40 * 60,
      pace: 6.5,
      heartRate: {
        average: 130,
        max: 140
      },
      perceivedExertion: 2,
      tags: ['recovery'],
    },
    {
      id: 5,
      type: 'Interval Workout',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10).toISOString(),
      distance: 12,
      duration: 60 * 60,
      pace: 5,
      heartRate: {
        average: 165,
        max: 185
      },
      perceivedExertion: 8,
      tags: ['workout', 'intervals', 'speed'],
    },
  ];
}