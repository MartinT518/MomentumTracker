import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  generateTrainingPlanAdjustments, 
  UserPerformance, 
  TrainingPlan, 
  PlanAdjustment 
} from '@/lib/ai-service';
import { 
  ChevronRight, 
  Save, 
  AlertTriangle, 
  Check, 
  Loader2, 
  ChevronDown,
  Zap,
  LineChart,
  Heart,
  Activity
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// Sample data generator (in a real app, this would come from the user's activities)
const generateSamplePerformanceData = (): UserPerformance => {
  // Generate some realistic sample data for demo purposes
  return {
    completedWorkouts: [
      {
        date: "2025-05-05",
        workoutType: "Easy Run",
        plannedDistance: "5 miles",
        actualDistance: "4.8 miles",
        plannedDuration: "50 minutes",
        actualDuration: "48 minutes",
        perceivedEffort: 4,
        heartRateData: {
          average: 142,
          max: 158
        },
        notes: "Felt good, slightly tired from yesterday's strength session",
        completed: true
      },
      {
        date: "2025-05-07",
        workoutType: "Tempo Run",
        plannedDistance: "6 miles",
        actualDistance: "6.2 miles",
        plannedDuration: "48 minutes",
        actualDuration: "51 minutes",
        perceivedEffort: 7,
        heartRateData: {
          average: 162,
          max: 175
        },
        notes: "Struggled in the middle portion, had to slow down",
        completed: true
      },
      {
        date: "2025-05-09",
        workoutType: "Long Run",
        plannedDistance: "10 miles",
        actualDistance: "8.3 miles",
        plannedDuration: "90 minutes",
        actualDuration: "76 minutes",
        perceivedEffort: 6,
        heartRateData: {
          average: 155,
          max: 168
        },
        notes: "Cut short due to right calf tightness",
        completed: false
      }
    ],
    missedWorkouts: [
      {
        date: "2025-05-03",
        workoutType: "Recovery Run",
        reason: "Sick - mild cold"
      }
    ],
    biometricData: {
      sleepQuality: [7, 6, 8, 7, 5, 6, 7],
      restingHeartRate: [52, 53, 54, 53, 56, 55, 54],
      hrvScore: [72, 68, 74, 70, 65, 67, 69]
    },
    energyLevels: [7, 6, 8, 7, 5, 6, 7],
    fatigueLevel: 6,
    weeklyMileage: {
      planned: 30,
      actual: 25.5
    },
    recentInjuries: [
      "Mild right calf tightness"
    ],
    goalsProgress: [
      {
        type: "Marathon",
        target: 240, // 4 hours in minutes
        current: 258 // 4:18
      }
    ]
  };
};

interface PlanAdjustmentToolProps {
  currentPlan: TrainingPlan;
  onApplyChanges: (adjustedPlan: TrainingPlan, insights: PlanAdjustment) => void;
}

const PlanAdjustmentTool: React.FC<PlanAdjustmentToolProps> = ({ currentPlan, onApplyChanges }) => {
  const [activeTab, setActiveTab] = useState('performance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjustmentResult, setAdjustmentResult] = useState<PlanAdjustment | null>(null);
  
  // For the performance data form
  const [performanceData, setPerformanceData] = useState<UserPerformance>(generateSamplePerformanceData());
  
  // For the preferences form
  const [focusAreas, setFocusAreas] = useState<string[]>(['endurance']);
  const [recoveryPreference, setRecoveryPreference] = useState<'aggressive' | 'moderate' | 'conservative'>('moderate');

  const handleFocusAreaToggle = (value: string) => {
    setFocusAreas(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const handleRecoveryChange = (value: number[]) => {
    const recoveryOptions: Array<'aggressive' | 'moderate' | 'conservative'> = ['aggressive', 'moderate', 'conservative'];
    setRecoveryPreference(recoveryOptions[value[0] - 1]);
  };

  const handleGenerateAdjustments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateTrainingPlanAdjustments(
        currentPlan,
        performanceData,
        { 
          focusAreas,
          recoveryPreference
        }
      );
      
      setAdjustmentResult(result);
      setActiveTab('results');
    } catch (err: any) {
      setError(err.message || 'Failed to generate plan adjustments');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChanges = () => {
    if (!adjustmentResult) return;
    
    // In a real application, we would apply the AI's suggestions to create an updated plan
    // This is a simplified version that just passes the original plan and insights
    onApplyChanges(currentPlan, adjustmentResult);
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Training Plan AI Adjustment Tool
          </CardTitle>
          <CardDescription>
            Our advanced AI analyzes your performance data and makes intelligent adjustments to your training plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="performance">Performance Data</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="results" disabled={!adjustmentResult}>Results</TabsTrigger>
            </TabsList>
            
            {/* Performance Data Tab */}
            <TabsContent value="performance" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex gap-2 items-center">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  Your Recent Performance
                </h3>
                <p className="text-sm text-muted-foreground">
                  This data is collected from your completed activities and health metrics. 
                  The AI uses this information to make smart adjustments to your plan.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Recent Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span>Completion Rate:</span>
                          <span className="font-medium">
                            {Math.round(performanceData.completedWorkouts.length / 
                              (performanceData.completedWorkouts.length + performanceData.missedWorkouts.length) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span>Avg. Effort:</span>
                          <span className="font-medium">
                            {(performanceData.completedWorkouts.reduce(
                              (sum, workout) => sum + workout.perceivedEffort, 0
                            ) / performanceData.completedWorkouts.length).toFixed(1)}/10
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weekly Mileage:</span>
                          <span className="font-medium">
                            {performanceData.weeklyMileage.actual} / {performanceData.weeklyMileage.planned} miles
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Recovery Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span>Current Fatigue:</span>
                          <span className="font-medium">{performanceData.fatigueLevel}/10</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span>Sleep Quality:</span>
                          <span className="font-medium">
                            {(performanceData.biometricData?.sleepQuality.reduce(
                              (sum, quality) => sum + quality, 0
                            ) / performanceData.biometricData?.sleepQuality.length).toFixed(1)}/10
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Resting HR:</span>
                          <span className="font-medium">
                            {performanceData.biometricData?.restingHeartRate[
                              performanceData.biometricData.restingHeartRate.length - 1
                            ]} bpm
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Issues & Limitations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        {performanceData.recentInjuries && performanceData.recentInjuries.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-1">
                            {performanceData.recentInjuries.map((injury, idx) => (
                              <li key={idx}>{injury}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground italic">No current injuries reported</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-md font-medium mb-2">Recent Workouts</h4>
                  <div className="space-y-2">
                    {performanceData.completedWorkouts.map((workout, idx) => (
                      <Collapsible key={idx} className="border rounded-md">
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              workout.completed ? "bg-green-500" : "bg-amber-500"
                            )} />
                            <span className="font-medium">{new Date(workout.date).toLocaleDateString()} - {workout.workoutType}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-4 pt-0 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Distance:</span>
                                <span>{workout.actualDistance} / {workout.plannedDistance}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Duration:</span>
                                <span>{workout.actualDuration} / {workout.plannedDuration}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Effort:</span>
                                <span>{workout.perceivedEffort}/10</span>
                              </div>
                              {workout.heartRateData && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Avg HR:</span>
                                  <span>{workout.heartRateData.average} bpm</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {workout.notes && (
                            <div className="mt-2 border-t pt-2">
                              <p className="italic">{workout.notes}</p>
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </div>
                
                <Alert className="bg-muted/50 border-muted">
                  <LineChart className="h-4 w-4" />
                  <AlertTitle>Performance Analysis</AlertTitle>
                  <AlertDescription>
                    The AI will analyze your recent training activities, biometric data, and health metrics
                    to identify patterns and make personalized adjustments to your training plan.
                  </AlertDescription>
                </Alert>
              </div>
              
              <div className="flex justify-end">
                <Button variant="default" onClick={() => setActiveTab('preferences')}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            
            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Training Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  Tell us your preferences so the AI can tailor adjustments to your goals and needs.
                </p>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Focus Areas</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="endurance" 
                          checked={focusAreas.includes('endurance')}
                          onCheckedChange={() => handleFocusAreaToggle('endurance')}
                        />
                        <Label htmlFor="endurance">Endurance</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="speed" 
                          checked={focusAreas.includes('speed')}
                          onCheckedChange={() => handleFocusAreaToggle('speed')}
                        />
                        <Label htmlFor="speed">Speed</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="strength" 
                          checked={focusAreas.includes('strength')}
                          onCheckedChange={() => handleFocusAreaToggle('strength')}
                        />
                        <Label htmlFor="strength">Strength</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="recovery" 
                          checked={focusAreas.includes('recovery')}
                          onCheckedChange={() => handleFocusAreaToggle('recovery')}
                        />
                        <Label htmlFor="recovery">Recovery</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="hills" 
                          checked={focusAreas.includes('hills')}
                          onCheckedChange={() => handleFocusAreaToggle('hills')}
                        />
                        <Label htmlFor="hills">Hills</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="race-specific" 
                          checked={focusAreas.includes('race-specific')}
                          onCheckedChange={() => handleFocusAreaToggle('race-specific')}
                        />
                        <Label htmlFor="race-specific">Race-Specific</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Recovery Preference</h4>
                      <span className="text-sm text-primary font-medium capitalize">{recoveryPreference}</span>
                    </div>
                    <div className="space-y-2">
                      <Slider 
                        defaultValue={[2]} 
                        max={3} 
                        min={1} 
                        step={1} 
                        onValueChange={handleRecoveryChange}
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Aggressive</span>
                        <span>Moderate</span>
                        <span>Conservative</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {recoveryPreference === 'aggressive' && 'Prioritize training progress over recovery, with minimal rest days.'}
                      {recoveryPreference === 'moderate' && 'Balanced approach between training intensity and adequate recovery.'}
                      {recoveryPreference === 'conservative' && 'Prioritize full recovery between hard sessions, with extra rest when needed.'}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Additional Notes</h4>
                    <Textarea 
                      placeholder="Any other preferences or considerations the AI should know about? (optional)"
                      className="h-[100px]"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('performance')}>
                  Back
                </Button>
                <Button 
                  variant="default" 
                  onClick={handleGenerateAdjustments}
                  disabled={loading || focusAreas.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Generate AI Adjustments
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            {/* Results Tab */}
            {adjustmentResult && (
              <TabsContent value="results" className="space-y-4">
                <div className="space-y-4">
                  <div className="bg-muted/30 border p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">AI Recommendation Summary</h3>
                    <p className="text-sm">{adjustmentResult.recommendedChanges.overall}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Current Week Adjustments</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm">{adjustmentResult.recommendedChanges.currentWeek.message}</p>
                        <div className="space-y-2">
                          {adjustmentResult.recommendedChanges.currentWeek.adjustments.map((adjustment, idx) => (
                            <Collapsible key={idx} className="border rounded-md">
                              <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-left">
                                <span className="font-medium text-sm">{adjustment.day}</span>
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                              </CollapsibleTrigger>
                              <CollapsibleContent className="px-3 pb-3 pt-0 text-sm">
                                <div className="space-y-2">
                                  <div className="p-2 bg-muted/50 rounded text-muted-foreground">
                                    <p className="text-xs font-medium mb-1">Original:</p>
                                    <p>{adjustment.originalWorkout}</p>
                                  </div>
                                  <div className="p-2 bg-primary/10 rounded border-l-2 border-primary">
                                    <p className="text-xs font-medium mb-1 text-primary">Adjusted:</p>
                                    <p>{adjustment.adjustedWorkout}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium mb-1">Reason:</p>
                                    <p className="italic">{adjustment.reason}</p>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Future Weeks Guidance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm">{adjustmentResult.recommendedChanges.futureWeeks.message}</p>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Recommended Adjustments:</h4>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            {adjustmentResult.recommendedChanges.futureWeeks.adjustmentTypes.map((type, idx) => (
                              <li key={idx}>{type}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {adjustmentResult.adaptationInsights.strengths.map((strength, idx) => (
                            <li key={idx}>{strength}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Limiting Factors
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {adjustmentResult.adaptationInsights.limitingFactors.map((factor, idx) => (
                            <li key={idx}>{factor}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          Training Load
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Previous Week:</span>
                              <span className="font-medium">{adjustmentResult.trainingLoad.previousWeek}/100</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Current Week:</span>
                              <span className="font-medium">{adjustmentResult.trainingLoad.currentWeek}/100</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Recommended:</span>
                              <span className="font-medium">{adjustmentResult.trainingLoad.recommendedNextWeek}/100</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs">{adjustmentResult.trainingLoad.explanation}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Additional Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {adjustmentResult.adaptationInsights.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('preferences')}>
                    Back
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={handleApplyChanges}
                    disabled={!adjustmentResult}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Apply These Adjustments
                  </Button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanAdjustmentTool;