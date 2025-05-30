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
    <div className="glass-card rounded-xl p-4 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center">
        <div className="flex-1">
          <div className="flex items-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-light text-secondary-dark mr-2">
              Current Goal
            </span>
            <h2 className="text-lg font-semibold font-heading text-neutral-darker">{displayData.name}</h2>
          </div>
          <p className="mt-1 text-neutral-medium">{displayData.date} • {displayData.daysRemaining} days remaining</p>
          
          <div className="mt-4 w-full bg-neutral-lighter rounded-full h-2.5">
            <div 
              className="bg-secondary h-2.5 rounded-full" 
              style={{ width: `${displayData.progress}%` }}
            />
          </div>
          
          <div className="mt-2 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-neutral-medium">Training Plan</p>
              <p className="font-medium text-neutral-darker">
                Week {displayData.trainingPlan.currentWeek} of {displayData.trainingPlan.totalWeeks}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-medium">Completed</p>
              <p className="font-medium text-neutral-darker">{displayData.activitiesCompleted} activities</p>
            </div>
            <div>
              <p className="text-xs text-neutral-medium">Total Distance</p>
              <p className="font-medium text-neutral-darker">{displayData.totalDistance} miles</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 md:mt-0 md:ml-8 shrink-0">
          <Link href="/training-plan">
            <Button variant="outline" className="w-full md:w-auto">
              View Training Plan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
