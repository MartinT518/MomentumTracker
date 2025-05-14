import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Flag, 
  TrendingUp, 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  Activity, 
  Award, 
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getGoalProgressData, 
  getGoalPaceData, 
  getGoalComparisonData, 
  getWeightProgressData,
  GoalProgress,
  GoalPaceData,
  GoalComparisonData,
  WeightProgressData
} from "@/lib/goal-service";

interface GoalVisualizationProps {
  goal: any;
  activities?: any[];
  className?: string;
}

export function GoalVisualization({ goal, activities = [], className }: GoalVisualizationProps) {
  const [chartType, setChartType] = useState<"progress" | "pace" | "comparison" | "prediction">("progress");
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">("weekly");
  
  // State for holding data from our service
  const [loading, setLoading] = useState<boolean>(true);
  const [progressData, setProgressData] = useState<GoalProgress | null>(null);
  const [paceData, setPaceData] = useState<GoalPaceData | null>(null);
  const [comparisonData, setComparisonData] = useState<GoalComparisonData | null>(null);
  const [weightData, setWeightData] = useState<WeightProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch data when component mounts or when goal/chart type changes
  useEffect(() => {
    async function fetchData() {
      if (!goal || !goal.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch progress data for all chart types
        const progress = await getGoalProgressData(goal.id);
        setProgressData(progress);
        
        // Fetch data specific to the current chart type
        if (chartType === "pace" && goal.type === "race") {
          const pace = await getGoalPaceData(goal.id);
          setPaceData(pace);
        } else if (chartType === "comparison") {
          const comparison = await getGoalComparisonData(goal.id);
          setComparisonData(comparison);
        } else if (goal.type === "weight") {
          const weight = await getWeightProgressData(goal.id);
          setWeightData(weight);
        }
      } catch (err) {
        console.error("Error fetching goal visualization data:", err);
        setError("Failed to load goal data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [goal, chartType]);
  
  // Generate forecasted data based on goal progress and target date
  const generateForecastData = () => {
    // If we have data from the service, use it
    if (progressData && progressData.forecastData) {
      return progressData.forecastData;
    }
    
    // Otherwise, generate fallback data
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    const totalDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate weekly data points from now until target date
    const weeksLeft = Math.ceil(totalDays / 7);
    const progressPerWeek = (100 - goal.progress) / weeksLeft;
    
    let data = [];
    
    // Add current progress
    data.push({
      name: "Current",
      progress: goal.progress,
      target: goal.progress,
    });
    
    // Add forecasted progress for remaining weeks
    for (let i = 1; i <= weeksLeft; i++) {
      const weekProgress = Math.min(100, goal.progress + (progressPerWeek * i));
      data.push({
        name: `Week ${i}`,
        progress: weekProgress,
        target: Math.min(100, goal.progress + ((100 - goal.progress) / weeksLeft) * i),
      });
    }
    
    return data;
  };
  
  // Generate pace or performance data (for race goals)
  const generatePaceData = () => {
    // If we have data from the service, use it
    if (paceData && paceData.paceData) {
      return paceData.paceData;
    }
    
    if (goal.type !== "race") return [];
    
    // Fallback pace data
    const paceImprovementData = [
      { date: "Jan", pace: 10.2, target: 9.5 },
      { date: "Feb", pace: 9.8, target: 9.3 },
      { date: "Mar", pace: 9.6, target: 9.1 },
      { date: "Apr", pace: 9.4, target: 8.9 },
      { date: "May", pace: 9.2, target: 8.7 },
      { date: "Now", pace: 9.0, target: 8.5 },
      { date: "Target", pace: null, target: 8.0 },
    ];
    
    return paceImprovementData;
  };
  
  // Generate comparison data (compare with similar goals by other users)
  const generateComparisonData = () => {
    // If we have data from the service, use it
    if (comparisonData && comparisonData.comparisonData) {
      return comparisonData.comparisonData;
    }
    
    // Fallback comparison data
    const fallbackData = [
      { name: "Week 1", you: 10, average: 8, top: 15 },
      { name: "Week 2", you: 18, average: 15, top: 22 },
      { name: "Week 3", you: 25, average: 22, top: 30 },
      { name: "Week 4", you: 32, average: 28, top: 38 },
      { name: "Week 5", you: 45, average: 35, top: 48 },
      { name: "Week 6", you: 58, average: 42, top: 55 },
      { name: "Current", you: goal.progress, average: 50, top: 65 },
    ];
    
    return fallbackData;
  };
  
  // For weight loss goals, generate projection chart
  const generateWeightProjection = () => {
    // If we have data from the service, use it
    if (weightData && weightData.weightData) {
      return weightData.weightData;
    }
    
    if (goal.type !== "weight") return [];
    
    const startingWeightNum = parseInt(goal.startingWeight.replace(" lbs", ""));
    const targetWeightNum = parseInt(goal.targetWeight.replace(" lbs", ""));
    const currentWeightNum = parseInt(goal.currentWeight.replace(" lbs", ""));
    
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    const totalDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const weeksLeft = Math.ceil(totalDays / 7);
    
    const weightLossPerWeek = (currentWeightNum - targetWeightNum) / weeksLeft;
    
    let data = [];
    
    // Add historical weight data
    const progressPercentage = goal.progress / 100;
    const totalWeightLoss = startingWeightNum - targetWeightNum;
    const weeksPassed = Math.round((progressPercentage * totalWeightLoss) / weightLossPerWeek);
    
    for (let i = 0; i < weeksPassed; i++) {
      const historicalWeight = startingWeightNum - (i * ((startingWeightNum - currentWeightNum) / weeksPassed));
      data.push({
        name: `Week -${weeksPassed - i}`,
        weight: Math.round(historicalWeight * 10) / 10,
        target: Math.round((startingWeightNum - (i * ((startingWeightNum - targetWeightNum) / (weeksPassed + weeksLeft)))) * 10) / 10,
      });
    }
    
    // Add current weight
    data.push({
      name: "Now",
      weight: currentWeightNum,
      target: Math.round((startingWeightNum - (weeksPassed * ((startingWeightNum - targetWeightNum) / (weeksPassed + weeksLeft)))) * 10) / 10,
    });
    
    // Add forecasted weight
    for (let i = 1; i <= weeksLeft; i++) {
      const projectedWeight = Math.max(targetWeightNum, currentWeightNum - (i * weightLossPerWeek));
      data.push({
        name: `Week +${i}`,
        weight: null, // No actual data for future weeks
        target: Math.round((startingWeightNum - ((weeksPassed + i) * ((startingWeightNum - targetWeightNum) / (weeksPassed + weeksLeft)))) * 10) / 10,
        projected: Math.round(projectedWeight * 10) / 10,
      });
    }
    
    return data;
  };
  
  // Generate predicted achievement date based on current progress
  const generatePredictionData = () => {
    // If we have data from the service, use it
    if (progressData && progressData.forecastData) {
      return progressData.forecastData;
    }
    
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    const totalDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // For prediction tracking, we need to estimate progress per day
    const startingWeight = goal.type === "weight" ? parseInt(goal.startingWeight.replace(" lbs", "")) : 0;
    const currentWeight = goal.type === "weight" ? parseInt(goal.currentWeight.replace(" lbs", "")) : 0;
    const targetWeight = goal.type === "weight" ? parseInt(goal.targetWeight.replace(" lbs", "")) : 0;
    
    // Calculate rate of progress
    const progressPerDay = goal.progress / (goal.type === "weight" 
      ? (startingWeight - currentWeight) / (startingWeight - targetWeight) * totalDays 
      : totalDays);
    
    // Predict days needed to reach 100%
    const daysNeeded = Math.ceil((100 - goal.progress) / progressPerDay);
    
    // Generate prediction chart
    const data = [];
    
    // Current point
    data.push({
      name: "Now",
      progress: goal.progress,
      ideal: goal.progress,
    });
    
    // Prediction points (weekly)
    const weeksToTarget = Math.ceil(totalDays / 7);
    const weeksNeeded = Math.ceil(daysNeeded / 7);
    
    for (let i = 1; i <= Math.max(weeksToTarget, weeksNeeded); i++) {
      const predictedProgress = Math.min(100, goal.progress + (progressPerDay * i * 7));
      const idealProgress = Math.min(100, goal.progress + ((100 - goal.progress) / weeksToTarget) * i);
      
      data.push({
        name: `Week ${i}`,
        progress: predictedProgress,
        ideal: idealProgress,
      });
      
      // Stop if we've reached 100% in both lines
      if (predictedProgress >= 100 && idealProgress >= 100) break;
    }
    
    return data;
  };

  // Extract values from goal for weight calculations
  const startingWeight = goal.type === "weight" ? parseInt(goal.startingWeight.replace(" lbs", "")) : 0;
  const currentWeight = goal.type === "weight" ? parseInt(goal.currentWeight.replace(" lbs", "")) : 0;
  const targetWeight = goal.type === "weight" ? parseInt(goal.targetWeight.replace(" lbs", "")) : 0;
  
  // Get the appropriate chart data based on chart type
  const chartData = (() => {
    switch (chartType) {
      case "progress":
        return generateForecastData();
      case "pace":
        return generatePaceData();
      case "comparison":
        return generateComparisonData();
      case "prediction":
        return generatePredictionData();
      default:
        return [];
    }
  })();
  
  // Weight projection data is handled separately
  const weightProjectionData = goal.type === "weight" ? generateWeightProjection() : [];
  
  // Render different charts based on goal type and selected chart type
  const renderChart = () => {
    if (goal.type === "weight" && chartType === "progress") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weightProjectionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[targetWeight - 5, startingWeight + 5]} />
            <Tooltip formatter={(value) => [`${value} lbs`, "Weight"]} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="weight" 
              name="Actual Weight" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              dot={{ r: 4 }} 
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="projected" 
              name="Projected Weight" 
              stroke="#3b82f6" 
              strokeDasharray="5 5" 
              strokeWidth={2} 
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              name="Target Pace" 
              stroke="#22c55e" 
              strokeDasharray="3 3" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    if (goal.type === "race" && chartType === "pace") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} />
            <Tooltip formatter={(value) => [`${value} min/mile`, "Pace"]} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="pace" 
              name="Your Pace" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              dot={{ r: 4 }} 
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              name="Target Pace" 
              stroke="#22c55e" 
              strokeDasharray="3 3" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === "comparison") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="you" name="Your Progress" fill="#3b82f6" />
            <Bar dataKey="average" name="Average Progress" fill="#9ca3af" />
            <Bar dataKey="top" name="Top Performers" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === "prediction") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => [`${value}%`, "Completion"]} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="progress" 
              name="Predicted Progress" 
              stroke="#3b82f6" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="ideal" 
              name="Planned Progress" 
              stroke="#22c55e" 
              strokeDasharray="3 3" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    // Default progress chart (works for all goal types)
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value) => [`${value}%`, "Completion"]} />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="progress" 
            name="Your Progress" 
            stroke="#3b82f6" 
            fill="#3b82f670" 
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="target" 
            name="Target Progress" 
            stroke="#22c55e" 
            fill="#22c55e50" 
            strokeWidth={2}
            strokeDasharray="3 3"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  // If no goal is provided, return an empty state
  if (!goal) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Goal Visualization</CardTitle>
          <CardDescription>Select a goal to view detailed charts</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-neutral-medium">No goal selected</div>
        </CardContent>
      </Card>
    );
  }
  
  // Show loading state
  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Goal Visualization</CardTitle>
          <CardDescription>Loading visualization data...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <div className="text-neutral-medium">Loading goal data...</div>
        </CardContent>
      </Card>
    );
  }
  
  // Show error state if there was a problem loading data
  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Goal Visualization</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="text-red-500 mb-4">Failed to load goal data</div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center">
              {goal.type === "race" ? (
                <Flag className="mr-2 h-5 w-5 text-primary" />
              ) : goal.type === "weight" ? (
                <Activity className="mr-2 h-5 w-5 text-primary" />
              ) : (
                <Award className="mr-2 h-5 w-5 text-primary" />
              )}
              {goal.type === "race" ? `${goal.distance} Race Goal` : 
               goal.type === "weight" ? "Weight Loss Goal" : "Custom Goal"}
            </CardTitle>
            <CardDescription>
              {goal.type === "race" && `Target: ${goal.targetTime}`}
              {goal.type === "weight" && `${goal.startingWeight} → ${goal.targetWeight}`}
              {goal.type === "custom" && goal.target}
              {goal.targetDate && ` • Target Date: ${goal.targetDate}`}
            </CardDescription>
          </div>
          
          <Tabs defaultValue="weekly" value={viewMode} onValueChange={(v) => setViewMode(v as "weekly" | "monthly")} className="w-[250px] mt-4 md:mt-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-5 flex flex-wrap gap-2">
          <Button 
            variant={chartType === "progress" ? "default" : "outline"} 
            size="sm"
            onClick={() => setChartType("progress")}
            className="flex items-center"
          >
            <TrendingUp className="mr-1.5 h-4 w-4" />
            Progress Tracker
          </Button>
          
          {goal.type === "race" && (
            <Button 
              variant={chartType === "pace" ? "default" : "outline"} 
              size="sm"
              onClick={() => setChartType("pace")}
              className="flex items-center"
            >
              <Clock className="mr-1.5 h-4 w-4" />
              Pace Improvement
            </Button>
          )}
          
          <Button 
            variant={chartType === "comparison" ? "default" : "outline"} 
            size="sm"
            onClick={() => setChartType("comparison")}
            className="flex items-center"
          >
            <BarChartIcon className="mr-1.5 h-4 w-4" />
            Comparison
          </Button>
          
          <Button 
            variant={chartType === "prediction" ? "default" : "outline"} 
            size="sm"
            onClick={() => setChartType("prediction")}
            className="flex items-center"
          >
            <Calendar className="mr-1.5 h-4 w-4" />
            Prediction
          </Button>
        </div>
        
        {renderChart()}
        
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-50 rounded-lg p-3">
            <div className="text-sm text-neutral-500 mb-1">Current Progress</div>
            <div className="font-semibold text-lg">
              {progressData ? `${progressData.currentProgress}%` : `${goal.progress}%`}
            </div>
          </div>
          
          <div className="bg-neutral-50 rounded-lg p-3">
            <div className="text-sm text-neutral-500 mb-1">Status</div>
            <div className="font-semibold text-lg">
              {progressData ? 
                (progressData.prediction.isOnTrack ? 
                  <span className="flex items-center text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1.5" />
                    On Track
                  </span> : 
                  <span className="flex items-center text-yellow-600">
                    <Clock className="w-4 h-4 mr-1.5" />
                    Behind Schedule
                  </span>
                ) :
                (goal.status === "on-track" ? "On Track" : 
                 goal.status === "at-risk" ? "At Risk" : 
                 goal.status === "behind" ? "Behind" : 
                 goal.status === "achieved" ? "Achieved" : "Exceeded")
              }
            </div>
          </div>
          
          <div className="bg-neutral-50 rounded-lg p-3">
            <div className="text-sm text-neutral-500 mb-1">Estimated Completion</div>
            <div className="font-semibold text-lg">
              {progressData && progressData.prediction.estimatedCompletionDate ? 
                new Date(progressData.prediction.estimatedCompletionDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                }) :
                goal.targetDate
              }
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {progressData && progressData.prediction.daysAhead ? 
                <span className="text-green-600">{progressData.prediction.daysAhead} days ahead</span> :
                progressData && progressData.prediction.daysBehind ?
                <span className="text-yellow-600">{progressData.prediction.daysBehind} days behind</span> :
                "On schedule"
              }
            </div>
          </div>
          
          {(chartType === "pace" && goal.type === "race" && paceData) && (
            <div className="bg-neutral-50 rounded-lg p-3">
              <div className="text-sm text-neutral-500 mb-1">Pace Improvement</div>
              <div className="font-semibold text-lg">
                {paceData.improvement.percentage > 0 ? 
                  <span className="text-green-600">+{paceData.improvement.percentage}%</span> :
                  <span className="text-red-600">{paceData.improvement.percentage}%</span>
                }
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {paceData.improvement.absolute > 0 ? 
                  `${paceData.improvement.absolute} min/mile faster` :
                  `${Math.abs(paceData.improvement.absolute)} min/mile slower`
                }
              </div>
            </div>
          )}
          
          {(chartType === "comparison" && comparisonData) && (
            <div className="bg-neutral-50 rounded-lg p-3">
              <div className="text-sm text-neutral-500 mb-1">User Ranking</div>
              <div className="font-semibold text-lg">
                {comparisonData.ranking.position || `${comparisonData.ranking.percentile}th percentile`}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {comparisonData.ranking.percentile > 75 ? 
                  "Top performer" :
                  comparisonData.ranking.percentile > 50 ?
                  "Above average" :
                  comparisonData.ranking.percentile > 25 ?
                  "Average" :
                  "Below average"
                }
              </div>
            </div>
          )}
          
          {goal.type === "race" && (
            <>
              <div className="bg-neutral-50 rounded-lg p-3">
                <div className="text-sm text-neutral-500 mb-1">Target Time</div>
                <div className="font-semibold text-lg">{goal.targetTime}</div>
              </div>
              
              {chartType !== "comparison" && chartType !== "pace" && (
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-sm text-neutral-500 mb-1">Training Plan</div>
                  <div className="font-semibold text-lg">{goal.trainingPlan?.split('-').pop().trim() || "Custom"}</div>
                </div>
              )}
            </>
          )}
          
          {goal.type === "weight" && (
            <>
              <div className="bg-neutral-50 rounded-lg p-3">
                <div className="text-sm text-neutral-500 mb-1">Current Weight</div>
                <div className="font-semibold text-lg">
                  {weightData ? 
                    `${weightData.currentWeight} lbs` :
                    goal.currentWeight
                  }
                </div>
              </div>
              
              {weightData && (
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-sm text-neutral-500 mb-1">Projected Final</div>
                  <div className="font-semibold text-lg">{weightData.projection.expectedFinalWeight} lbs</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {weightData.projection.expectedFinalWeight <= weightData.targetWeight ? 
                      <span className="text-green-600">Will reach target</span> :
                      <span className="text-yellow-600">{weightData.projection.expectedFinalWeight - weightData.targetWeight} lbs short</span>
                    }
                  </div>
                </div>
              )}
              
              {(!weightData || chartType !== "progress") && (
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-sm text-neutral-500 mb-1">Target Weight</div>
                  <div className="font-semibold text-lg">{goal.targetWeight}</div>
                </div>
              )}
            </>
          )}
          
          {goal.type === "custom" && (
            <>
              <div className="bg-neutral-50 rounded-lg p-3">
                <div className="text-sm text-neutral-500 mb-1">Current</div>
                <div className="font-semibold text-lg">{goal.actual}</div>
              </div>
              
              <div className="bg-neutral-50 rounded-lg p-3">
                <div className="text-sm text-neutral-500 mb-1">Target</div>
                <div className="font-semibold text-lg">{goal.target}</div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}