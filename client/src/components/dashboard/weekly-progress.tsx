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
    <div>
      <h3 className="text-lg font-semibold font-heading text-neutral-darker mb-3">Weekly Goal Progress</h3>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-neutral-darker">Distance Goal</span>
            <span className="text-sm font-medium text-neutral-darker">
              {progressData.distanceGoal.current} / {progressData.distanceGoal.target} miles
            </span>
          </div>
          <Progress value={progressData.distanceGoal.percentage} className="h-2.5 bg-neutral-lighter" indicatorClassName="bg-accent" />
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-neutral-darker">Workouts Completed</span>
            <span className="text-sm font-medium text-neutral-darker">
              {progressData.workoutsCompleted.current} / {progressData.workoutsCompleted.target}
            </span>
          </div>
          <Progress value={progressData.workoutsCompleted.percentage} className="h-2.5 bg-neutral-lighter" indicatorClassName="bg-secondary" />
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-neutral-darker">Improvement Rate</span>
            <span className="text-sm font-medium text-neutral-darker">{progressData.improvementRate.status}</span>
          </div>
          <Progress value={progressData.improvementRate.percentage} className="h-2.5 bg-neutral-lighter" indicatorClassName="bg-primary" />
        </div>
      </div>
    </div>
  );
}
