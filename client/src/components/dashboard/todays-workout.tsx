import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar } from "lucide-react";
import { Link } from "wouter";

interface WorkoutData {
  type: string;
  targetDistance: string;
  targetPace: string;
  zone: string;
  estimatedTime: string;
  notes: string;
}

export function TodaysWorkout() {
  const { data, isLoading } = useQuery<WorkoutData>({
    queryKey: ["/api/workouts/today"],
  });

  // Placeholder data for the UI
  const placeholderWorkout = {
    type: "Easy Run",
    targetDistance: "5 miles",
    targetPace: "9:00-9:30 min/mile",
    zone: "Zone 2 (Easy)",
    estimatedTime: "~45-50 minutes",
    notes: "Focus on maintaining a conversational pace throughout the run. This is a recovery run intended to build aerobic base without creating additional fatigue."
  };

  const workout = data || placeholderWorkout;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="rounded-md bg-cyan-400/30 p-2">
            <BarChart3 className="h-5 w-5 text-cyan-300" />
          </div>
          <h3 className="ml-3 text-lg font-medium text-white">{workout.type}</h3>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-400/30 text-cyan-200">
          Today
        </span>
      </div>
      
      <div className="border-t border-white/20 pt-3 pb-1">
        <div className="flex justify-between mb-2">
          <span className="text-white/70">Target Distance</span>
          <span className="font-medium text-white">{workout.targetDistance}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-white/70">Target Pace</span>
          <span className="font-medium text-white">{workout.targetPace}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-white/70">Zone</span>
          <span className="font-medium text-white">{workout.zone}</span>
        </div>
        <div className="flex justify-between mb-3">
          <span className="text-white/70">Estimated Time</span>
          <span className="font-medium text-white">{workout.estimatedTime}</span>
        </div>
      </div>
      
      <div className="border-t border-white/20 pt-3">
        <h4 className="font-medium mb-2 text-white">Workout Notes</h4>
        <p className="text-white/70 text-sm">{workout.notes}</p>
      </div>
      
      <div className="mt-4 flex space-x-3">
        <Link href="/activities/start">
          <Button className="flex-1">
            Start Workout
          </Button>
        </Link>
        <Link href="/training-plan">
          <Button variant="outline" size="icon">
            <Calendar className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
