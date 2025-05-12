import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CalendarDays, 
  Calendar as CalendarIcon, 
  List, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { cn } from "@/lib/utils";

// Training workout type interfaces
interface WorkoutDay {
  date: string;
  dateObj: Date;
  workouts: Workout[];
  isCurrentDay: boolean;
  isCurrentMonth: boolean;
}

interface Workout {
  id: number;
  type: string;
  description: string;
  duration: string;
  distance?: string;
  intensity: 'easy' | 'moderate' | 'hard' | 'recovery' | 'race';
  completed: boolean;
}

export function TrainingPlanCalendar() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Generate mock data for the calendar
  const generateMockData = (): WorkoutDay[] => {
    const today = new Date();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDayOfMonth.getDate();
    const workoutDays: WorkoutDay[] = [];
    
    // Add days for current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isCurrentDay = date.toDateString() === today.toDateString();
      
      // Create some mock workouts for this day
      const workouts: Workout[] = [];
      
      // Add a workout for every other day
      if (day % 2 === 0) {
        workouts.push({
          id: day * 100 + 1,
          type: getWorkoutType(day),
          description: getWorkoutDescription(day),
          duration: '45 minutes',
          distance: day % 3 === 0 ? `${5 + (day % 3)} miles` : undefined,
          intensity: getIntensity(day),
          completed: date < today
        });
      }
      
      // Add rest days
      if (day % 7 === 0) {
        workouts.push({
          id: day * 100 + 2,
          type: 'Rest Day',
          description: 'Active recovery or complete rest',
          duration: 'All day',
          intensity: 'recovery',
          completed: date < today
        });
      }
      
      workoutDays.push({
        date: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }),
        dateObj: date,
        workouts,
        isCurrentDay,
        isCurrentMonth: true
      });
    }
    
    return workoutDays;
  };
  
  // Helper functions to generate mock data
  const getWorkoutType = (day: number): string => {
    const types = [
      'Easy Run', 
      'Tempo Run', 
      'Interval Training', 
      'Long Run', 
      'Recovery Run',
      'Cross Training'
    ];
    return types[day % types.length];
  };
  
  const getWorkoutDescription = (day: number): string => {
    const descriptions = [
      'Steady pace run with focus on form',
      '20 min warm up, 20 min at threshold pace, 10 min cool down',
      '8x400m repeats with 2 min recovery',
      'Long slow distance run to build endurance',
      'Very easy recovery run',
      'Strength training or cross training'
    ];
    return descriptions[day % descriptions.length];
  };
  
  const getIntensity = (day: number): 'easy' | 'moderate' | 'hard' | 'recovery' | 'race' => {
    const intensities: ('easy' | 'moderate' | 'hard' | 'recovery' | 'race')[] = [
      'easy', 'moderate', 'hard', 'recovery', 'moderate', 'easy', 'race'
    ];
    return intensities[day % intensities.length];
  };
  
  const workoutDays = generateMockData();
  
  // Handle month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Get intensity color
  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-blue-100 text-blue-800';
      case 'hard':
        return 'bg-orange-100 text-orange-800';
      case 'recovery':
        return 'bg-purple-100 text-purple-800';
      case 'race':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Training Schedule</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant={viewMode === 'calendar' ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Calendar
            </Button>
            <Button 
              variant={viewMode === 'list' ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Month navigation */}
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-md font-medium">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {viewMode === 'calendar' ? (
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 mb-2">
                {day}
              </div>
            ))}
            
            {/* Empty slots for days before the first day of month */}
            {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-28 p-2 rounded-lg bg-gray-50 opacity-50"></div>
            ))}
            
            {/* Calendar days */}
            {workoutDays.map((day) => (
              <div 
                key={day.date} 
                className={cn(
                  "h-28 p-2 rounded-lg overflow-y-auto border",
                  day.isCurrentDay 
                    ? "border-primary bg-primary/5" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={cn(
                    "text-xs font-semibold",
                    day.isCurrentDay && "text-primary"
                  )}>
                    {new Date(day.dateObj).getDate()}
                  </span>
                  {day.workouts.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {day.workouts.length} workout{day.workouts.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {day.workouts.map((workout) => (
                    <div 
                      key={workout.id}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-xs",
                        getIntensityColor(workout.intensity),
                        workout.completed && "line-through opacity-70"
                      )}
                    >
                      {workout.type}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {workoutDays
              .filter(day => day.workouts.length > 0)
              .map((day) => (
                <div key={day.date} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-gray-500" />
                      <span className={cn(
                        "font-medium",
                        day.isCurrentDay && "text-primary"
                      )}>
                        {day.date}
                      </span>
                    </div>
                    {day.isCurrentDay && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {day.workouts.map((workout) => (
                      <div 
                        key={workout.id} 
                        className="pl-6 border-l-2 border-l-gray-200"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={cn(
                            "font-medium",
                            workout.completed && "line-through opacity-70"
                          )}>
                            {workout.type}
                          </span>
                          <span className={cn(
                            "text-xs rounded-full px-2 py-0.5",
                            getIntensityColor(workout.intensity)
                          )}>
                            {workout.intensity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {workout.description}
                        </p>
                        <div className="flex text-xs text-gray-500">
                          <span className="mr-3">{workout.duration}</span>
                          {workout.distance && (
                            <span>{workout.distance}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}