import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface CurrentGoalProps {
  goalId?: number;
}

export function CurrentGoalBanner({ goalId }: CurrentGoalProps) {
  const { data: goal, isLoading } = useQuery({
    queryKey: ["/api/goals/current"],
    enabled: !!goalId,
  });

  // Placeholder data for the UI
  const placeholderGoal = {
    name: "Chicago Marathon",
    date: "October 8, 2023",
    daysRemaining: 87,
    progress: 68,
    trainingPlan: {
      currentWeek: 8,
      totalWeeks: 16,
    },
    activitiesCompleted: 43,
    totalDistance: 278.6,
  };

  const displayData = goal || placeholderGoal;

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 md:p-6 mb-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center">
        <div className="flex-1">
          <div className="flex items-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-[#8a4df0] to-[#3a4db9] text-white border-none shadow-lg mr-2">
              Current Goal
            </span>
            <h2 className="text-lg font-semibold font-heading text-white drop-shadow-lg">{displayData.name}</h2>
          </div>
          <p className="mt-1 text-white/80 drop-shadow-md">{displayData.date} • {displayData.daysRemaining} days remaining</p>
          
          <div className="mt-4 w-full bg-white/20 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-[#8a4df0] to-[#3a4db9] h-2.5 rounded-full shadow-lg" 
              style={{ width: `${displayData.progress}%` }}
            />
          </div>
          
          <div className="mt-2 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-white/70">Training Plan</p>
              <p className="font-medium text-white drop-shadow-md">
                Week {displayData.trainingPlan.currentWeek} of {displayData.trainingPlan.totalWeeks}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/70">Completed</p>
              <p className="font-medium text-white drop-shadow-md">{displayData.activitiesCompleted} activities</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Total Distance</p>
              <p className="font-medium text-white drop-shadow-md">{displayData.totalDistance} miles</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 md:mt-0 md:ml-8 shrink-0">
          <Link href="/training-plan">
            <Button className="w-full md:w-auto bg-gradient-to-r from-[#8a4df0] to-[#3a4db9] hover:from-[#7a3de0] hover:to-[#2a3da9] text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              View Training Plan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
