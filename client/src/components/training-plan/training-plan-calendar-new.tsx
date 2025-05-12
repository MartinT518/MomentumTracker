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
    <div 
      ref={drag}
      onClick={() => onWorkoutClick(workout)}
      className={cn(
        "px-1.5 py-0.5 rounded text-xs cursor-pointer group relative",
        getIntensityColor(workout.intensity),
        workout.completed && "line-through opacity-70",
        isDragging && "opacity-50"
      )}
    >
      <span className="flex justify-between items-center">
        <span>{workout.type}</span>
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
        "h-28 p-2 rounded-lg overflow-y-auto border transition-colors",
        day.isCurrentDay 
          ? "border-primary bg-primary/5" 
          : "border-gray-200 hover:border-gray-300",
        isOver && "border-dashed border-blue-500 bg-blue-50"
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
}

export function TrainingPlanCalendar({ onWorkoutClick = () => {} }: CalendarProps) {
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
    setWorkoutDays(generateMockData());
  }, [currentMonth]);
  
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