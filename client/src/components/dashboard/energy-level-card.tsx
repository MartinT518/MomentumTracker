import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Battery, Heart, Zap, Moon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
          <div className="text-center mb-4">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-100">
              <Zap className={`w-4 h-4 mr-2 ${getReadinessColor(energyData.readinessCategory)}`} />
              <span className={`font-medium ${getReadinessColor(energyData.readinessCategory)}`}>
                {getReadinessText(energyData.readinessScore)} Energy
              </span>
            </div>
            <p className="text-sm text-neutral-600 mt-2">{energyData.recommendation}</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm font-medium">
                  <Heart className="w-3.5 h-3.5 text-red-500 mr-1.5" />
                  HRV Score
                </div>
                <span className="text-sm font-medium">{energyData.hrvScore}/100</span>
              </div>
              <Progress value={energyData.hrvScore} className="h-2" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm font-medium">
                  <Heart className="w-3.5 h-3.5 text-purple-500 mr-1.5" />
                  Resting HR
                </div>
                <span className="text-sm font-medium">{energyData.restingHR} bpm</span>
              </div>
              <Progress 
                value={100 - ((energyData.restingHR - 40) / 40) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm font-medium">
                  <Moon className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
                  Sleep Score
                </div>
                <span className="text-sm font-medium">{energyData.sleepScore}/100</span>
              </div>
              <Progress value={energyData.sleepScore} className="h-2" />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-500">Overall Readiness</span>
              <span className={`text-base font-semibold ${getReadinessColor(energyData.readinessCategory)}`}>
                {energyData.readinessScore}%
              </span>
            </div>
            <Progress 
              value={energyData.readinessScore} 
              className="h-2.5 mt-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}