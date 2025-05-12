import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, Tooltip, CartesianGrid } from "recharts";

interface GoalProgressProps {
  goalType: string;
  goalTarget: string;
  targetDate: string;
  currentProgress: number;
  daysLeft: number;
  forecastData: {
    name: string;
    actual: number;
    forecast: number;
  }[];
}

export function TrainingGoalOverview() {
  // In a real app, this would be fetched from an API
  const goalProgress: GoalProgressProps = {
    goalType: "Marathon",
    goalTarget: "Sub 3:45",
    targetDate: "October 15, 2025",
    currentProgress: 68,
    daysLeft: 152,
    forecastData: [
      { name: 'Week 1', actual: 10, forecast: 10 },
      { name: 'Week 2', actual: 15, forecast: 15 },
      { name: 'Week 3', actual: 18, forecast: 17 },
      { name: 'Week 4', actual: 22, forecast: 20 },
      { name: 'Week 5', actual: 25, forecast: 23 },
      { name: 'Week 6', actual: 0, forecast: 28 },
      { name: 'Week 7', actual: 0, forecast: 32 },
      { name: 'Week 8', actual: 0, forecast: 36 },
    ],
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'text-red-500';
    if (progress < 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="md:col-span-1">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
              Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="relative inline-block h-36 w-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Progress', value: goalProgress.currentProgress },
                          { name: 'Remaining', value: 100 - goalProgress.currentProgress }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#f3f4f6" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold">{goalProgress.currentProgress}%</p>
                    <p className="text-xs text-neutral-500">Complete</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{goalProgress.goalType}</span>
                  <span className="text-sm font-medium">{goalProgress.goalTarget}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-xs text-neutral-500">Target Date</span>
                  <span className="text-xs text-neutral-500">{goalProgress.daysLeft} days left</span>
                </div>
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs">
                  <Target className="w-3.5 h-3.5 mr-1" />
                  {goalProgress.targetDate}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Progress Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={goalProgress.forecastData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#22c55e" 
                    activeDot={{ r: 8 }}
                    strokeWidth={2} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="forecast" 
                    stroke="#94a3b8" 
                    strokeDasharray="5 5" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}