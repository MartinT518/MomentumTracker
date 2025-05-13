import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  workout?: {
    type: string;
    description: string;
    color: "primary" | "secondary" | "accent";
  };
}

interface CalendarWeek {
  days: CalendarDay[];
}

interface CalendarData {
  weeks: CalendarWeek[];
}

export function TrainingCalendar() {
  const { data, isLoading } = useQuery<CalendarData>({
    queryKey: ["/api/calendar"],
  });

  // Placeholder data for the UI
  const placeholderData = {
    weeks: [
      {
        days: [
          { day: 30, isCurrentMonth: false, isToday: false },
          { day: 1, isCurrentMonth: true, isToday: true, workout: { type: "Easy", description: "5 mi Easy", color: "primary" } },
          { day: 2, isCurrentMonth: true, isToday: false, workout: { type: "Interval", description: "Interval", color: "secondary" } },
          { day: 3, isCurrentMonth: true, isToday: false, workout: { type: "Rest", description: "Rest", color: "accent" } },
          { day: 4, isCurrentMonth: true, isToday: false, workout: { type: "Tempo", description: "6 mi Tempo", color: "primary" } },
          { day: 5, isCurrentMonth: true, isToday: false, workout: { type: "Cross", description: "Cross", color: "accent" } },
          { day: 6, isCurrentMonth: true, isToday: false, workout: { type: "Long", description: "12 mi Long", color: "secondary" } },
        ]
      },
      {
        days: [
          { day: 7, isCurrentMonth: true, isToday: false, workout: { type: "Rest", description: "Rest", color: "accent" } },
          { day: 8, isCurrentMonth: true, isToday: false, workout: { type: "Easy", description: "5 mi Easy", color: "primary" } },
          { day: 9, isCurrentMonth: true, isToday: false, workout: { type: "Speed", description: "Speed", color: "secondary" } },
          { day: 10, isCurrentMonth: true, isToday: false, workout: { type: "Rest", description: "Rest", color: "accent" } },
          { day: 11, isCurrentMonth: true, isToday: false, workout: { type: "Tempo", description: "6 mi Tempo", color: "primary" } },
          { day: 12, isCurrentMonth: true, isToday: false, workout: { type: "Cross", description: "Cross", color: "accent" } },
          { day: 13, isCurrentMonth: true, isToday: false, workout: { type: "Long", description: "14 mi Long", color: "secondary" } },
        ]
      },
      {
        days: [
          { day: 14, isCurrentMonth: true, isToday: false, workout: { type: "Rest", description: "Rest", color: "accent" } },
          { day: 15, isCurrentMonth: true, isToday: false, workout: { type: "Easy", description: "6 mi Easy", color: "primary" } },
          { day: 16, isCurrentMonth: true, isToday: false, workout: { type: "Hills", description: "Hills", color: "secondary" } },
          { day: 17, isCurrentMonth: true, isToday: false, workout: { type: "Rest", description: "Rest", color: "accent" } },
          { day: 18, isCurrentMonth: true, isToday: false, workout: { type: "Tempo", description: "7 mi Tempo", color: "primary" } },
          { day: 19, isCurrentMonth: true, isToday: false, workout: { type: "Cross", description: "Cross", color: "accent" } },
          { day: 20, isCurrentMonth: true, isToday: false, workout: { type: "Long", description: "16 mi Long", color: "secondary" } },
        ]
      }
    ]
  };

  const calendarData = data || placeholderData;

  const getWorkoutColorClass = (color: "primary" | "secondary" | "accent") => {
    switch (color) {
      case "primary":
        return "text-primary";
      case "secondary":
        return "text-secondary";
      case "accent":
        return "text-accent";
      default:
        return "text-neutral-medium";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Days of week header */}
      <div className="grid grid-cols-7 text-center border-b border-gray-200">
        <div className="py-2 border-r border-gray-200 text-sm font-medium">Sun</div>
        <div className="py-2 border-r border-gray-200 text-sm font-medium">Mon</div>
        <div className="py-2 border-r border-gray-200 text-sm font-medium">Tue</div>
        <div className="py-2 border-r border-gray-200 text-sm font-medium">Wed</div>
        <div className="py-2 border-r border-gray-200 text-sm font-medium">Thu</div>
        <div className="py-2 border-r border-gray-200 text-sm font-medium">Fri</div>
        <div className="py-2 text-sm font-medium">Sat</div>
      </div>
      
      {/* Calendar grid */}
      <div>
        {calendarData.weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 text-center">
            {week.days.map((day, dayIndex) => (
              <div 
                key={`${weekIndex}-${dayIndex}`} 
                className={cn(
                  "calendar-day p-1 border-b border-gray-200 relative cursor-pointer transition-colors hover:bg-neutral-lighter/70",
                  dayIndex < 6 && "border-r",
                  !day.isCurrentMonth && "text-neutral-light",
                  day.isToday && "bg-primary-light/30",
                  weekIndex === 2 && "border-b-0" // Last row, no bottom border
                )}
                onClick={() => day.isCurrentMonth && window.location.href = "/training-plan"}
              >
                <div className="font-medium">{day.day}</div>
                {day.workout && (
                  <div className={cn(
                    "text-xs font-medium mt-1",
                    getWorkoutColorClass(day.workout.color)
                  )}>
                    {day.workout.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
