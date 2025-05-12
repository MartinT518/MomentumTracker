import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Battery, Heart, Zap, Moon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Progress } from "@/components/ui/progress";

interface EnergyLevelData {
  readinessScore: number;
  hrvScore: number;
  restingHR: number;
  sleepScore: number;
  readinessCategory: 'low' | 'moderate' | 'optimal';
  recommendation: string;
}

export function EnergyLevelCard() {
  // In a real app, this would come from an API
  const energyData: EnergyLevelData = {
    readinessScore: 78,
    hrvScore: 82,
    restingHR: 54,
    sleepScore: 76,
    readinessCategory: 'moderate',
    recommendation: 'You can train with moderate intensity today.',
  };
  
  const getReadinessColor = (category: string) => {
    switch (category) {
      case 'low':
        return 'text-red-500';
      case 'moderate':
        return 'text-yellow-500';
      case 'optimal':
        return 'text-green-500';
      default:
        return 'text-neutral-500';
    }
  };
  
  const getReadinessText = (score: number) => {
    if (score < 60) return 'Low';
    if (score < 80) return 'Moderate';
    return 'Optimal';
  };
  
  const getProgressColor = (score: number) => {
    if (score < 60) return 'bg-red-500';
    if (score < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Energy Level</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Battery className={`w-5 h-5 ${getReadinessColor(energyData.readinessCategory)}`} />
              </TooltipTrigger>
              <TooltipContent>
                <p>Based on your biometric data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>Today's training readiness based on biometrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mt-1 space-y-5">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-4 space-y-3 md:space-y-0">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-100">
                <Zap className={`w-4 h-4 mr-2 ${getReadinessColor(energyData.readinessCategory)}`} />
                <span className={`font-medium ${getReadinessColor(energyData.readinessCategory)}`}>
                  {getReadinessText(energyData.readinessScore)} Energy
                </span>
              </div>
              <p className="text-sm text-neutral-600 mt-2 md:max-w-md">{energyData.recommendation}</p>
            </div>
            
            <div className="flex justify-center">
              <div className="h-28 w-28 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Score', value: energyData.readinessScore },
                        { name: 'Remaining', value: 100 - energyData.readinessScore }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={34}
                      outerRadius={48}
                      fill="#8884d8"
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell key="cell-0" fill={
                        energyData.readinessCategory === 'low' ? '#ef4444' : 
                        energyData.readinessCategory === 'moderate' ? '#eab308' : '#22c55e'
                      } />
                      <Cell key="cell-1" fill="#f3f4f6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Zap className={`w-5 h-5 ${getReadinessColor(energyData.readinessCategory)}`} />
                  <p className={`text-lg font-bold ${getReadinessColor(energyData.readinessCategory)}`}>
                    {energyData.readinessScore}%
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* HRV Score */}
            <div className="flex flex-col items-center">
              <div className="h-24 w-24 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Score', value: energyData.hrvScore },
                        { name: 'Remaining', value: 100 - energyData.hrvScore }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell key="cell-0" fill="#ef4444" />
                      <Cell key="cell-1" fill="#f3f4f6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Heart className="w-4 h-4 text-red-500" />
                  <p className="text-sm font-bold mt-0.5">{energyData.hrvScore}</p>
                </div>
              </div>
              <p className="text-xs font-medium mt-2">HRV Score</p>
            </div>
            
            {/* Resting HR */}
            <div className="flex flex-col items-center">
              <div className="h-24 w-24 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Score', value: 100 - ((energyData.restingHR - 40) / 40) * 100 },
                        { name: 'Remaining', value: ((energyData.restingHR - 40) / 40) * 100 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell key="cell-0" fill="#a855f7" />
                      <Cell key="cell-1" fill="#f3f4f6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Heart className="w-4 h-4 text-purple-500" />
                  <p className="text-sm font-bold mt-0.5">{energyData.restingHR} <span className="text-xs">bpm</span></p>
                </div>
              </div>
              <p className="text-xs font-medium mt-2">Resting HR</p>
            </div>
            
            {/* Sleep Score */}
            <div className="flex flex-col items-center">
              <div className="h-24 w-24 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Score', value: energyData.sleepScore },
                        { name: 'Remaining', value: 100 - energyData.sleepScore }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell key="cell-0" fill="#3b82f6" />
                      <Cell key="cell-1" fill="#f3f4f6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Moon className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-bold mt-0.5">{energyData.sleepScore}</p>
                </div>
              </div>
              <p className="text-xs font-medium mt-2">Sleep Score</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}