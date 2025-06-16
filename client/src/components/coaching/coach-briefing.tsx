import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Target, Activity, TrendingUp, Clock, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface CoachBriefingProps {
  userId: number;
}

interface UserGoal {
  id: number;
  title: string;
  target_date: string;
  target_value: string;
  current_value: string;
  goal_type: string;
  status: string;
}

interface RecentActivity {
  id: number;
  activity_type: string;
  duration: number;
  distance: number;
  activity_date: string;
  calories: number;
}

interface TrainingPlan {
  overview?: {
    weeklyMileage: string;
    workoutsPerWeek: string;
    longRunDistance: string;
    qualityWorkouts: string;
  };
  philosophy?: string;
}

export function CoachBriefing({ userId }: CoachBriefingProps) {
  // Fetch user goals
  const { data: goals = [] } = useQuery<UserGoal[]>({
    queryKey: ['/api/goals'],
    queryFn: async () => {
      const response = await fetch('/api/goals');
      return response.json();
    },
  });

  // Fetch recent activities
  const { data: recentActivities = [] } = useQuery<RecentActivity[]>({
    queryKey: ['/api/activities/recent'],
    queryFn: async () => {
      const response = await fetch('/api/activities/recent');
      return response.json();
    },
  });

  // Fetch current training plan from localStorage (AI-generated plan)
  const aiPlan = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('ai-training-plan');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getGoalProgress = (goal: UserGoal) => {
    const current = parseFloat(goal.current_value) || 0;
    const target = parseFloat(goal.target_value) || 1;
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="space-y-6 h-full">
      {/* Athlete Overview */}
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20 h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Athlete Overview
          </CardTitle>
          <CardDescription className="text-white/70">
            Current training status and goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Training Goals */}
          <div>
            <h4 className="font-medium text-white mb-3">Active Goals</h4>
            {goals.length > 0 ? (
              <div className="space-y-3">
                {goals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium text-white">{goal.title}</h5>
                        <p className="text-sm text-white/70">
                          Target: {goal.target_value} by {formatDate(goal.target_date)}
                        </p>
                      </div>
                      <Badge variant={goal.status === 'active' ? 'default' : 'secondary'}>
                        {goal.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm text-white/70">
                        <span>Progress</span>
                        <span>{goal.current_value} / {goal.target_value}</span>
                      </div>
                      <Progress value={getGoalProgress(goal)} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/60 text-sm">No active goals set</p>
            )}
          </div>

          {/* Current Training Plan */}
          {aiPlan && (
            <div>
              <h4 className="font-medium text-white mb-3">Current Training Plan</h4>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-white/70">Weekly Mileage</p>
                    <p className="font-medium text-white">{aiPlan.overview?.weeklyMileage || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Workouts/Week</p>
                    <p className="font-medium text-white">{aiPlan.overview?.workoutsPerWeek || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Long Run</p>
                    <p className="font-medium text-white">{aiPlan.overview?.longRunDistance || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Quality Workouts</p>
                    <p className="font-medium text-white">{aiPlan.overview?.qualityWorkouts || "Not set"}</p>
                  </div>
                </div>
                {aiPlan.philosophy && (
                  <div>
                    <p className="text-sm text-white/70 mb-1">Training Philosophy</p>
                    <p className="text-sm text-white/80">{aiPlan.philosophy}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Training Activity */}
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20 h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Training
          </CardTitle>
          <CardDescription className="text-white/70">
            Last 7 days of activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Activity className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{activity.activity_type}</p>
                      <p className="text-sm text-white/70">
                        {formatDate(activity.activity_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center text-white/70">
                        <MapPin className="h-3 w-3 mr-1" />
                        {activity.distance > 0 ? `${activity.distance} mi` : 'N/A'}
                      </div>
                      <div className="flex items-center text-white/70">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(activity.duration)}
                      </div>
                      <div className="flex items-center text-white/70">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {activity.calories} cal
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/60 text-sm">No recent activities found</p>
          )}
        </CardContent>
      </Card>

      {/* Training Notes */}
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Coach Notes
          </CardTitle>
          <CardDescription className="text-white/70">
            Key considerations for coaching this athlete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <h5 className="font-medium text-blue-200 mb-1">Training Focus</h5>
              <p className="text-sm text-white/80">
                {goals.length > 0 
                  ? `Primary goal: ${goals[0]?.title}. Consider adjusting intensity and volume based on target date.`
                  : "No specific goals set - focus on building consistent training habits and establishing baseline fitness."
                }
              </p>
            </div>
            
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <h5 className="font-medium text-green-200 mb-1">Recent Activity Level</h5>
              <p className="text-sm text-white/80">
                {recentActivities.length > 0 
                  ? `Active athlete with ${recentActivities.length} recent activities. Monitor for overtraining signs.`
                  : "Low recent activity - may need motivation and gradual progression planning."
                }
              </p>
            </div>

            {aiPlan && (
              <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <h5 className="font-medium text-purple-200 mb-1">AI Plan Integration</h5>
                <p className="text-sm text-white/80">
                  Athlete has an existing AI-generated plan. Use this as a baseline but feel free to make personalized adjustments based on their responses and progress.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}