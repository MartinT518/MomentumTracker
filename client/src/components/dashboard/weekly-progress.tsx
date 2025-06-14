import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

interface ProgressData {
  distanceGoal: {
    current: number;
    target: number;
    percentage: number;
  };
  workoutsCompleted: {
    current: number;
    target: number;
    percentage: number;
  };
  improvementRate: {
    status: string;
    percentage: number;
  };
}

export function WeeklyProgress() {
  const { data, isLoading } = useQuery<ProgressData>({
    queryKey: ["/api/progress/weekly"],
  });

  // Placeholder data for the UI
  const placeholderData = {
    distanceGoal: {
      current: 32.4,
      target: 35,
      percentage: 92
    },
    workoutsCompleted: {
      current: 4,
      target: 5,
      percentage: 80
    },
    improvementRate: {
      status: "On Track",
      percentage: 85
    }
  };

  const progressData = data || placeholderData;

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 shadow-xl">
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-white/80">Distance Goal</span>
          <span className="text-sm font-medium text-white drop-shadow-md">
            {progressData.distanceGoal.current} / {progressData.distanceGoal.target} miles
          </span>
        </div>
        <Progress value={progressData.distanceGoal.percentage} className="h-2.5 bg-white/20" indicatorClassName="bg-gradient-to-r from-[#8a4df0] to-[#3a4db9]" />
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-white/80">Workouts Completed</span>
          <span className="text-sm font-medium text-white drop-shadow-md">
            {progressData.workoutsCompleted.current} / {progressData.workoutsCompleted.target}
          </span>
        </div>
        <Progress value={progressData.workoutsCompleted.percentage} className="h-2.5 bg-white/20" indicatorClassName="bg-gradient-to-r from-[#3a4db9] to-[#8a4df0]" />
      </div>
      
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-white/80">Improvement Rate</span>
          <span className="text-sm font-medium text-white drop-shadow-md">{progressData.improvementRate.status}</span>
        </div>
        <Progress value={progressData.improvementRate.percentage} className="h-2.5 bg-white/20" indicatorClassName="bg-gradient-to-r from-[#8a4df0] to-[#3a4db9]" />
      </div>
    </div>
  );
}
