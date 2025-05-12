import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  Gauge, 
  Footprints, 
  Info, 
  Activity,
  ThermometerSun
} from "lucide-react";

interface WorkoutDetailProps {
  id: number;
  date: string;
  title: string;
  type: string;
  purpose: string;
  intensity: 'easy' | 'moderate' | 'hard' | 'recovery' | 'race';
  distance?: string;
  duration: string;
  warmup: string;
  mainSet: {
    type: 'intervals' | 'steady' | 'progression' | 'fartlek';
    description: string;
    intervals?: {
      count: number;
      distance?: string;
      duration?: string;
      effort: string;
      recovery: string;
    }
  };
  cooldown: string;
  considerations: string[];
}

export function WorkoutDetailView() {
  // Mock data for the workout detail
  const workout: WorkoutDetailProps = {
    id: 1,
    date: "May 12, 2025",
    title: "Threshold Intervals",
    type: "Interval Training",
    purpose: "Build lactate threshold and improve running economy",
    intensity: "hard",
    distance: "7 miles",
    duration: "60 minutes",
    warmup: "15 minutes easy running, gradually increasing pace, followed by 4x30 second strides with 60 seconds easy jogging recovery",
    mainSet: {
      type: "intervals",
      description: "4 sets of 5-minute intervals at threshold pace (about 85-90% of max heart rate)",
      intervals: {
        count: 4,
        duration: "5 minutes",
        effort: "Threshold pace (about 85-90% of max heart rate)",
        recovery: "2 minutes easy jogging recovery between intervals"
      }
    },
    cooldown: "10 minutes of very easy jogging, followed by essential stretching routine",
    considerations: [
      "Focus on maintaining consistent pacing throughout each interval",
      "Pay attention to running form, especially as fatigue sets in during later intervals",
      "Adjust pacing if the heart rate rises above 90% during intervals",
      "Stay well hydrated before and after the workout",
      "If feeling unusually fatigued, reduce the number of intervals or extend recovery periods"
    ]
  };

  // Get intensity color for badges
  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'easy':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'moderate':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'hard':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'recovery':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'race':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  // Get interval type badge
  const getIntervalTypeBadge = (type: string) => {
    switch (type) {
      case 'intervals':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100';
      case 'steady':
        return 'bg-teal-100 text-teal-800 hover:bg-teal-100';
      case 'progression':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'fartlek':
        return 'bg-pink-100 text-pink-800 hover:bg-pink-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <div>
            <div className="text-sm text-neutral-500 mb-1">{workout.date}</div>
            <CardTitle className="text-xl font-semibold">{workout.title}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getIntensityColor(workout.intensity)}>
              {workout.intensity}
            </Badge>
            <Badge variant="outline">
              <Clock className="w-3 h-3 mr-1" />
              {workout.duration}
            </Badge>
            {workout.distance && (
              <Badge variant="outline">
                <Footprints className="w-3 h-3 mr-1" />
                {workout.distance}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="bg-blue-50 p-2 rounded-full">
            <Info className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold mb-1">Workout Purpose</h3>
            <p className="text-sm text-neutral-700">{workout.purpose}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-green-50 p-2 rounded-full">
              <Activity className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold mb-1">Warm-up</h3>
              <p className="text-sm text-neutral-700">{workout.warmup}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-orange-50 p-2 rounded-full">
              <Gauge className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-semibold">Main Set</h3>
                <Badge variant="outline" className={getIntervalTypeBadge(workout.mainSet.type)}>
                  {workout.mainSet.type}
                </Badge>
              </div>
              <p className="text-sm text-neutral-700 mb-3">{workout.mainSet.description}</p>
              
              {workout.mainSet.intervals && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <div className="flex items-center">
                      <span className="text-xs font-medium text-gray-500 mr-2">Sets:</span>
                      <span className="text-sm">{workout.mainSet.intervals.count}</span>
                    </div>
                    {workout.mainSet.intervals.distance && (
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-500 mr-2">Distance:</span>
                        <span className="text-sm">{workout.mainSet.intervals.distance}</span>
                      </div>
                    )}
                    {workout.mainSet.intervals.duration && (
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-500 mr-2">Duration:</span>
                        <span className="text-sm">{workout.mainSet.intervals.duration}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-1">Effort:</span>
                    <span className="text-sm block">{workout.mainSet.intervals.effort}</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-1">Recovery:</span>
                    <span className="text-sm block">{workout.mainSet.intervals.recovery}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-50 p-2 rounded-full">
              <Activity className="h-5 w-5 text-blue-500 transform rotate-180" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold mb-1">Cool-down</h3>
              <p className="text-sm text-neutral-700">{workout.cooldown}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex items-start gap-3">
          <div className="bg-yellow-50 p-2 rounded-full">
            <ThermometerSun className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold mb-2">Considerations</h3>
            <ul className="space-y-1.5">
              {workout.considerations.map((consideration, index) => (
                <li key={index} className="text-sm text-neutral-700 flex">
                  <span className="text-primary mr-2">•</span>
                  <span>{consideration}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}