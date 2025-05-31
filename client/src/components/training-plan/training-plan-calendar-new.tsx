import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CalendarDays, 
  Calendar as CalendarIcon, 
  List, 
  ChevronLeft, 
  ChevronRight,
  Move
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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

interface DraggableWorkoutProps {
  workout: Workout;
  dayDate: Date;
  onWorkoutClick: (workout: Workout) => void;
  moveWorkout: (workoutId: number, fromDate: Date, toDate: Date) => void;
}

// Draggable workout component
const DraggableWorkout = ({ workout, dayDate, onWorkoutClick, moveWorkout }: DraggableWorkoutProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'WORKOUT',
    item: { 
      id: workout.id, 
      sourceDate: dayDate 
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  // Get intensity color with glassmorphism
  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'easy':
        return 'bg-green-500/20 text-green-200 border-green-400/30';
      case 'moderate':
        return 'bg-blue-500/20 text-blue-200 border-blue-400/30';
      case 'hard':
        return 'bg-orange-500/20 text-orange-200 border-orange-400/30';
      case 'recovery':
        return 'bg-purple-500/20 text-purple-200 border-purple-400/30';
      case 'race':
        return 'bg-red-500/20 text-red-200 border-red-400/30';
      default:
        return 'bg-white/20 text-white/80 border-white/30';
    }
  };

  return (
    <div 
      ref={drag}
      onClick={() => onWorkoutClick(workout)}
      className={cn(
        "px-1.5 py-0.5 rounded text-xs cursor-pointer group relative border backdrop-blur-sm",
        getIntensityColor(workout.intensity),
        workout.completed && "line-through opacity-70",
        isDragging && "opacity-50"
      )}
    >
      <span className="flex justify-between items-center">
        <span className="drop-shadow-sm">{workout.type}</span>
        <Move className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
      </span>
    </div>
  );
};

// Droppable day component
interface DroppableDayProps {
  day: WorkoutDay;
  onWorkoutClick: (workout: Workout) => void;
  moveWorkout: (workoutId: number, fromDate: Date, toDate: Date) => void;
}

const DroppableDay = ({ day, onWorkoutClick, moveWorkout }: DroppableDayProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'WORKOUT',
    drop: (item: { id: number, sourceDate: Date }) => {
      moveWorkout(item.id, item.sourceDate, day.dateObj);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }));

  return (
    <div 
      ref={drop}
      className={cn(
        "h-28 p-2 rounded-lg overflow-y-auto border transition-colors bg-white/5 backdrop-blur-sm",
        day.isCurrentDay 
          ? "border-blue-400/50 bg-blue-500/10" 
          : "border-white/20 hover:border-white/30",
        isOver && "border-dashed border-blue-400 bg-blue-500/20"
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
          <DraggableWorkout 
            key={workout.id} 
            workout={workout} 
            dayDate={day.dateObj}
            onWorkoutClick={onWorkoutClick}
            moveWorkout={moveWorkout}
          />
        ))}
      </div>
    </div>
  );
};

interface CalendarProps {
  onWorkoutClick?: (workout: Workout) => void;
  hasSubscription?: boolean;
  onWeekWorkoutsGenerated?: (workouts: Array<{
    date: Date;
    workoutType: string;
    intensity: "easy" | "moderate" | "hard" | "rest" | "recovery";
    completed: boolean;
  }>) => void;
}

export function TrainingPlanCalendar({ 
  onWorkoutClick = () => {}, 
  hasSubscription = false,
  onWeekWorkoutsGenerated 
}: CalendarProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  
  // Generate mock data for the calendar
  const generateMockData = (): WorkoutDay[] => {
    const today = new Date();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDayOfMonth.getDate();
    const days: WorkoutDay[] = [];
    
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
      
      days.push({
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
    
    return days;
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
  
  useEffect(() => {
    const allWorkoutDays = generateMockData();
    
    // For non-subscribers, restrict detailed workout info after week 1
    if (!hasSubscription) {
      const today = new Date();
      const firstWeekEndDate = new Date(today);
      firstWeekEndDate.setDate(today.getDate() + 7);
      
      const secondWeekEndDate = new Date(today);
      secondWeekEndDate.setDate(today.getDate() + 14);
      
      // Apply subscription restrictions to workouts
      const restrictedDays = allWorkoutDays.map(day => {
        // First week - show all details
        if (day.dateObj <= firstWeekEndDate) {
          return day;
        }
        // Second week - show type only, no details
        else if (day.dateObj <= secondWeekEndDate) {
          return {
            ...day,
            workouts: day.workouts.map(workout => ({
              ...workout,
              description: "Premium content (upgrade to view details)",
            }))
          };
        }
        // Beyond second week - no workouts shown
        else {
          return {
            ...day,
            workouts: day.workouts.length > 0 ? [
              {
                id: -1,
                type: "Premium Content",
                description: "Subscribe to see future workouts",
                duration: "",
                intensity: "moderate" as const,
                completed: false,
              }
            ] : []
          };
        }
      });
      
      setWorkoutDays(restrictedDays);
    } else {
      setWorkoutDays(allWorkoutDays);
    }
    
    // If the callback is provided, send the first week's data for strength training suggestions
    if (onWeekWorkoutsGenerated) {
      const firstWeekData = allWorkoutDays.slice(0, 7).map(day => ({
        date: day.dateObj,
        workoutType: day.workouts[0]?.type || "Rest",
        intensity: (day.workouts[0]?.intensity || "rest") as "easy" | "moderate" | "hard" | "rest" | "recovery",
        completed: day.workouts[0]?.completed || false
      }));
      
      onWeekWorkoutsGenerated(firstWeekData);
    }
  }, [currentMonth, hasSubscription, onWeekWorkoutsGenerated]);
  
  // Handlers for drag and drop
  const moveWorkout = (workoutId: number, fromDate: Date, toDate: Date) => {
    // Skip if trying to move to the same date
    if (fromDate.toDateString() === toDate.toDateString()) return;
    
    setWorkoutDays(prevDays => {
      // Deep copy of previous days
      const newDays = JSON.parse(JSON.stringify(prevDays));
      
      // Find the workout in the source day
      const sourceDayIndex = newDays.findIndex(
        (day: WorkoutDay) => day.dateObj.toString() === fromDate.toString()
      );
      
      if (sourceDayIndex === -1) return prevDays;
      
      const sourceDay = newDays[sourceDayIndex];
      const workoutIndex = sourceDay.workouts.findIndex(
        (w: Workout) => w.id === workoutId
      );
      
      if (workoutIndex === -1) return prevDays;
      
      // Get the workout and remove it from source
      const workout = {...sourceDay.workouts[workoutIndex]};
      sourceDay.workouts.splice(workoutIndex, 1);
      
      // Find the target day and add the workout
      const targetDayIndex = newDays.findIndex(
        (day: WorkoutDay) => day.dateObj.toString() === toDate.toString()
      );
      
      if (targetDayIndex === -1) return prevDays;
      
      newDays[targetDayIndex].workouts.push(workout);
      
      return newDays;
    });
  };
  
  // Handle month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Get intensity color for list view
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
    <DndProvider backend={HTML5Backend}>
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium text-white drop-shadow-sm">Training Schedule</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant={viewMode === 'calendar' ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode('calendar')}
                className={viewMode === 'calendar' ? "bg-white/20 text-white border-white/30" : "border-white/30 text-white hover:bg-white/10"}
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                Calendar
              </Button>
              <Button 
                variant={viewMode === 'list' ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? "bg-white/20 text-white border-white/30" : "border-white/30 text-white hover:bg-white/10"}
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
            <Button variant="ghost" size="sm" onClick={prevMonth} className="text-white hover:bg-white/10">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-md font-medium text-white drop-shadow-sm">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <Button variant="ghost" size="sm" onClick={nextMonth} className="text-white hover:bg-white/10">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {viewMode === 'calendar' ? (
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-white/70 drop-shadow-sm mb-2">
                  {day}
                </div>
              ))}
              
              {/* Empty slots for days before the first day of month */}
              {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-28 p-2 rounded-lg bg-white/5 opacity-50"></div>
              ))}
              
              {/* Calendar days */}
              {workoutDays.map((day) => (
                <DroppableDay 
                  key={day.date}
                  day={day}
                  onWorkoutClick={onWorkoutClick}
                  moveWorkout={moveWorkout}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {workoutDays
                .filter(day => day.workouts.length > 0)
                .map((day) => (
                  <div key={day.date} className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-2 text-white/70" />
                        <span className={cn(
                          "font-medium text-white drop-shadow-sm",
                          day.isCurrentDay && "text-blue-300"
                        )}>
                          {day.date}
                        </span>
                      </div>
                      {day.isCurrentDay && (
                        <span className="text-xs bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {day.workouts.map((workout) => (
                        <div 
                          key={workout.id} 
                          className="pl-6 border-l-2 border-l-gray-200 cursor-pointer hover:bg-gray-50 rounded-r-lg p-2"
                          onClick={() => onWorkoutClick(workout)}
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
    </DndProvider>
  );
}